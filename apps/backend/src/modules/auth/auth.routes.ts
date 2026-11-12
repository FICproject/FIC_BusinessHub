import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  checkEmailAvailability,
  checkMobileAvailability,
  resolveUserKycSnapshot
} from './auth.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { lookupIndianPinCode } from './pincode.service';
import { UserModel } from '../users/users.model';
import { evaluateMemberActivationAccess } from '../kyc/kyc-status.helpers';

export const authRouter = Router();

authRouter.get('/check-email', checkEmailAvailability);
authRouter.get('/check-mobile', checkMobileAvailability);
authRouter.get('/pincode/:pincode', async (req, res, next) => {
  try {
    const location = await lookupIndianPinCode(req.params.pincode);
    res.status(200).json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
});
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', authenticate, getMe);
authRouter.patch('/profile', authenticate, updateProfile);

// Public check-status endpoint for live KYC approval/decision polling without session mismatch
authRouter.get('/check-status', async (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      res.status(400).json({ success: false, error: 'Email parameter required' });
      return;
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() })
      .select('_id email isKycApproved status')
      .lean() as { _id: any; email?: string; isKycApproved?: boolean; status?: string } | null;
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const activation = await evaluateMemberActivationAccess(user._id.toString());
    const kycSnapshot = activation.kycSnapshot || (await resolveUserKycSnapshot(user));

    res.json({
      success: true,
      data: {
        isKycApproved: activation.checks.kycApproved,
        kycApproved: activation.checks.kycApproved,
        kycStatus: kycSnapshot.kycStatus,
        canAccessDashboard: activation.canAccessDashboard,
        activationChecks: activation.checks,
        rejectionReason: kycSnapshot.rejectionReason,
        reviewerNotes: kycSnapshot.reviewerNotes,
        reviewedAt: kycSnapshot.reviewedAt,
        submittedAt: kycSnapshot.submittedAt,
        status: activation.checks.accountActive ? 'ACTIVE' : user.status
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
