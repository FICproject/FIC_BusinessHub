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
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
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
// Authorized Admin and Super Admin can update pricing.
// ===================================================
adminPricingRouter.put('/', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, error: 'Authentication required' });
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

    const updateFields: any = {
      firstYearMembershipFee: parsedFirstYear,
      renewalMembershipFee: parsedRenewal,
      updatedByAdminId: req.admin?.id || 'admin',
      updatedByAdminName: req.admin?.name || 'Admin Operations'
    };

    if (referralRewardAmount !== undefined) {
      updateFields.referralRewardAmount = parsedReferral;
    }
    if (referralProgramEnabled !== undefined) {
      updateFields.referralProgramEnabled = Boolean(referralProgramEnabled);
    }
    if (minWithdrawalAmount !== undefined) {
      updateFields.minWithdrawalAmount = parsedMinWithdrawal;
    }

    const updatedConfig = await FinancialConfigModel.findOneAndUpdate(
      { key: 'DEFAULT_FINANCIAL_CONFIG' },
      {
        $set: updateFields,
        $inc: { pricingVersion: 1 }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Synchronize referral config model as well for backwards compatibility
    try {
      await ReferralConfigModel.findOneAndUpdate(
        { key: 'DEFAULT_CONFIG' },
        {
          $set: {
            bonusPerReferral: updatedConfig.referralRewardAmount,
            isActive: updatedConfig.referralProgramEnabled,
            updatedBy: req.admin?.name || 'Admin Operations'
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (refErr) {
      console.warn('Non-fatal warning synchronizing ReferralConfigModel:', refErr);
    }

    // Audit log
    try {
      await logAdminAction(
        req,
        'UPDATE_PRICING',
        'FinancialConfig',
        updatedConfig._id.toString(),
        {
          updated: {
            firstYearMembershipFee: updatedConfig.firstYearMembershipFee,
            renewalMembershipFee: updatedConfig.renewalMembershipFee,
            referralRewardAmount: updatedConfig.referralRewardAmount,
            referralProgramEnabled: updatedConfig.referralProgramEnabled,
            minWithdrawalAmount: updatedConfig.minWithdrawalAmount
          },
          changedBy: req.admin.name,
          adminRole: req.admin.role,
          pricingVersion: updatedConfig.pricingVersion
        }
      );
    } catch (auditErr) {
      console.warn('Non-fatal warning writing audit log for pricing update:', auditErr);
    }

    res.status(200).json({
      success: true,
      message: 'Membership pricing updated successfully.',
      data: updatedConfig
    });
  } catch (err: any) {
    console.error('Failed to update pricing configuration:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to update pricing configuration',
      details: err.message
    });
  }
});

