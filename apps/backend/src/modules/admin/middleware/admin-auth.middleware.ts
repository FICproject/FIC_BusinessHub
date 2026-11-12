import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { AdminRole } from '@fic/shared-types';
import { AuditLogModel } from '../models/AuditLog';
import { AdminUserModel } from '../models/AdminUser';
import { config } from '../../../config';

const JWT_SECRET = process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET || config.jwt.accessSecret;

export interface AuthenticatedAdminRequest extends Request {
  admin?: {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
    department?: string;
    permissions: string[];
  };
}

export const authenticateAdmin = async (
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authorization token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const adminId = String(decoded.id || decoded.userId || '');

    if (!adminId || !mongoose.isValidObjectId(adminId)) {
      res.status(401).json({ success: false, error: 'Invalid admin session identity' });
      return;
    }

    const adminDoc = await AdminUserModel.findById(adminId).select('name email role department isActive permissions').lean();
    if (!adminDoc) {
      res.status(401).json({ success: false, error: 'Admin account no longer exists' });
      return;
    }
    if (!adminDoc.isActive) {
      res.status(403).json({ success: false, error: 'Admin account is disabled. Access denied.' });
      return;
    }

    req.admin = {
      id: String(adminDoc._id),
      name: adminDoc.name || decoded.name || 'Admin',
      email: adminDoc.email || decoded.email,
      role: adminDoc.role as AdminRole,
      department: adminDoc.department,
      permissions: Array.isArray(adminDoc.permissions) ? adminDoc.permissions : decoded.permissions || [],
    };
    next();
  } catch (_err) {
    res.status(401).json({ success: false, error: 'Invalid or expired session token' });
  }
};

export const requireRole = (...roles: AdminRole[]) => {
  return (req: AuthenticatedAdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.admin.role)) {
      res.status(403).json({ success: false, error: `Access denied. Requires role: ${roles.join(' or ')}` });
      return;
    }
    next();
  };
};

export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: AuthenticatedAdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (req.admin.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    const perms = req.admin.permissions || [];
    if (perms.includes('*') || perms.includes('ALL')) {
      next();
      return;
    }

    // Active KYC_COMPLIANCE or MANAGEMENT admins are authorized for KYC verification unless restricted
    const departmentMatchesKyc =
      requiredPermissions.some((p) => p.startsWith('KYC_')) &&
      (req.admin.department === 'KYC_COMPLIANCE' || req.admin.department === 'MANAGEMENT');

    const hasExplicitPerm = requiredPermissions.some((p) => perms.includes(p));
    // Also allow standard ADMIN staff if their permissions array was initialized empty for legacy staff accounts without restricting them unless explicit permissions deny KYC
    const legacyAdminNoExplicitList = req.admin.role === 'ADMIN' && perms.length === 0;

    if (hasExplicitPerm || departmentMatchesKyc || legacyAdminNoExplicitList) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      error: `Access denied. Missing permission: ${requiredPermissions.join(' or ')}`,
    });
  };
};

export const logAdminAction = async (
  adminReq: AuthenticatedAdminRequest,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, any>
) => {
  try {
    if (adminReq.admin) {
      await AuditLogModel.create({
        adminId: adminReq.admin.id,
        adminName: adminReq.admin.name,
        adminRole: adminReq.admin.role,
        action,
        entityType,
        entityId,
        ipAddress: adminReq.ip || (adminReq.headers['x-forwarded-for'] as string),
        details,
      });
    }
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};
