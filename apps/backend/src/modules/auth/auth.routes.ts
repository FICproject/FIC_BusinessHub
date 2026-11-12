import { Router } from 'express';
import { register, login, getMe, updateProfile } from './auth.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { UserModel } from '../users/users.model';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', authenticate, getMe);
authRouter.patch('/profile', authenticate, updateProfile);

// Public check-status endpoint for live KYC approval polling without session mismatch
authRouter.get('/check-status', async (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      res.status(400).json({ success: false, error: 'Email parameter required' });
      return;
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() })
      .select('isKycApproved status')
      .lean() as { isKycApproved?: boolean; status?: string } | null;
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        isKycApproved: Boolean(user.isKycApproved),
        kycStatus: user.isKycApproved ? 'APPROVED' : 'SUBMITTED',
        status: user.isKycApproved ? 'ACTIVE' : user.status
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

