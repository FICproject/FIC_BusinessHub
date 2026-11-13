import { Router, Request, Response } from 'express';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../middleware/admin-auth.middleware';
import { FinancialConfigModel, ensureFinancialConfig } from '../models/FinancialConfig';
import { AuditLogModel } from '../models/AuditLog';
import { ReferralConfigModel } from '../models/Referral';

export const adminPricingRouter = Router();
export const publicPricingRouter = Router();

// ==========================================
// Public Endpoint: GET /api/v1/config/pricing
// ==========================================
publicPricingRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const config = await ensureFinancialConfig();
    res.status(200).json({
      success: true,
      data: {
        firstYearMembershipFee: config.firstYearMembershipFee,
        renewalMembershipFee: config.renewalMembershipFee,
        referralRewardAmount: config.referralRewardAmount,
        referralProgramEnabled: config.referralProgramEnabled,
        minWithdrawalAmount: config.minWithdrawalAmount,
        currency: config.currency,
        pricingVersion: config.pricingVersion,
        updatedAt: config.updatedAt
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve platform pricing configuration',
      details: err.message
    });
  }
});

// ===================================================
// Admin Endpoint: GET /api/admin/config/pricing
// ===================================================
adminPricingRouter.get('/', authenticateAdmin, async (_req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const config = await ensureFinancialConfig();
    const auditLogs = await AuditLogModel.find({
      $or: [{ action: 'UPDATE_PRICING' }, { entityType: 'FinancialConfig' }]
    })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        config,
        auditLogs
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to load pricing configuration',
      details: err.message
    });
  }
});

// ===================================================
// Admin Endpoint: PUT /api/admin/config/pricing
// Super Admin is VIEW ONLY. Only ADMIN can update.
// ===================================================
adminPricingRouter.put('/', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // RBAC Enforcement: Super Admin is strictly View Only for Pricing
    if (req.admin.role === 'SUPER_ADMIN') {
      res.status(403).json({
        success: false,
        code: 'SUPER_ADMIN_VIEW_ONLY',
        error: 'View Only: Only authorized Admin can update pricing. Super Admin has view-only access.'
      });
      return;
    }

    const {
      firstYearMembershipFee,
      renewalMembershipFee,
      referralRewardAmount,
      referralProgramEnabled,
      minWithdrawalAmount
    } = req.body;

    const parsedFirstYear = Number(firstYearMembershipFee);
    const parsedRenewal = Number(renewalMembershipFee);

    if (!Number.isFinite(parsedFirstYear) || parsedFirstYear <= 0) {
      res.status(400).json({
        success: false,
        error: 'First year membership amount must be a positive number greater than 0.'
      });
      return;
    }

    if (!Number.isFinite(parsedRenewal) || parsedRenewal <= 0) {
      res.status(400).json({
        success: false,
        error: 'Second year onwards renewal amount must be a positive number greater than 0.'
      });
      return;
    }

    let parsedReferral = 500;
    if (referralRewardAmount !== undefined) {
      parsedReferral = Number(referralRewardAmount);
      if (!Number.isFinite(parsedReferral) || parsedReferral < 0) {
        res.status(400).json({
          success: false,
          error: 'Referral reward amount must be a valid non-negative number.'
        });
        return;
      }
    }

    let parsedMinWithdrawal = 500;
    if (minWithdrawalAmount !== undefined) {
      parsedMinWithdrawal = Number(minWithdrawalAmount);
      if (!Number.isFinite(parsedMinWithdrawal) || parsedMinWithdrawal <= 0) {
        res.status(400).json({
          success: false,
          error: 'Minimum withdrawal amount must be greater than 0.'
        });
        return;
      }
    }

    const config = await ensureFinancialConfig();
    const previousState = {
      firstYearMembershipFee: config.firstYearMembershipFee,
      renewalMembershipFee: config.renewalMembershipFee,
      referralRewardAmount: config.referralRewardAmount,
      referralProgramEnabled: config.referralProgramEnabled,
      minWithdrawalAmount: config.minWithdrawalAmount
    };

    config.firstYearMembershipFee = parsedFirstYear;
    config.renewalMembershipFee = parsedRenewal;
    if (referralRewardAmount !== undefined) {
      config.referralRewardAmount = parsedReferral;
    }
    if (referralProgramEnabled !== undefined) {
      config.referralProgramEnabled = Boolean(referralProgramEnabled);
    }
    if (minWithdrawalAmount !== undefined) {
      config.minWithdrawalAmount = parsedMinWithdrawal;
    }

    config.pricingVersion = (config.pricingVersion || 1) + 1;
    config.updatedByAdminId = req.admin.id;
    config.updatedByAdminName = req.admin.name || 'Admin Operations';
    await config.save();

    // Synchronize referral config model as well for backwards compatibility
    await ReferralConfigModel.findOneAndUpdate(
      { key: 'DEFAULT_CONFIG' },
      {
        bonusPerReferral: config.referralRewardAmount,
        isActive: config.referralProgramEnabled,
        updatedBy: req.admin.name || 'Admin Operations'
      },
      { upsert: true }
    );

    // Audit log
    await logAdminAction(
      req,
      'UPDATE_PRICING',
      'FinancialConfig',
      config._id.toString(),
      {
        previous: previousState,
        updated: {
          firstYearMembershipFee: config.firstYearMembershipFee,
          renewalMembershipFee: config.renewalMembershipFee,
          referralRewardAmount: config.referralRewardAmount,
          referralProgramEnabled: config.referralProgramEnabled,
          minWithdrawalAmount: config.minWithdrawalAmount
        },
        changedBy: req.admin.name,
        adminRole: req.admin.role,
        pricingVersion: config.pricingVersion
      }
    );

    res.status(200).json({
      success: true,
      message: 'Membership pricing updated successfully.',
      data: config
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to update pricing configuration',
      details: err.message
    });
  }
});

