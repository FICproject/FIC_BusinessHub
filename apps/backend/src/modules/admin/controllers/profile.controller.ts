import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../middleware/admin-auth.middleware';
import { AdminUserModel } from '../models/AdminUser';

export const adminProfileRouter = Router();

// GET /api/admin/profile - Get current admin's profile
adminProfileRouter.get('/', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const user = await AdminUserModel.findById(req.admin.id).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, error: 'Admin user not found' });
      return;
    }

    const userData = {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      countryCode: user.countryCode || '+91',
      avatarUrl: user.avatarUrl || '',
      role: user.role,
      department: user.department,
      regionScope: user.regionScope,
      permissions: user.permissions || [],
      lastLoginAt: user.lastLoginAt,
    };

    res.status(200).json({
      success: true,
      data: {
        user: userData,
        ...userData
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// PUT & PATCH /api/admin/profile - Update current admin's profile
const handleProfileUpdate = async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const { name, phone, countryCode, avatarUrl, currentPassword, newPassword } = req.body;
    const user = await AdminUserModel.findById(req.admin.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'Admin user not found' });
      return;
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (countryCode !== undefined) user.countryCode = countryCode.trim();
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl.trim();

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ success: false, error: 'Current password is required to set a new password' });
        return;
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ success: false, error: 'Current password does not match' });
        return;
      }
      user.passwordHash = await bcrypt.hash(newPassword, 10);
      user.requirePasswordReset = false;
    }

    await user.save();
    await logAdminAction(req, 'UPDATE_PROFILE', 'AdminUser', user._id.toString(), { name: user.name });

    const userData = {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      countryCode: user.countryCode || '+91',
      avatarUrl: user.avatarUrl || '',
      role: user.role,
      department: user.department,
      regionScope: user.regionScope,
      permissions: user.permissions || [],
      lastLoginAt: user.lastLoginAt,
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      data: {
        user: userData,
        ...userData
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};

adminProfileRouter.put('/', authenticateAdmin, handleProfileUpdate);
adminProfileRouter.patch('/', authenticateAdmin, handleProfileUpdate);
