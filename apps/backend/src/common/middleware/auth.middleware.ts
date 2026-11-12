import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { AppError } from '../errors/app-error';
import { JWTPayload, UserRole } from '@fic/shared-types';
import { evaluateMemberActivationAccess } from '../../modules/kyc/kyc-status.helpers';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export const authenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing token.', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as JWTPayload;
    req.user = decoded;
    next();
  } catch (_jwtErr) {
    next(new AppError('Invalid or expired authentication token.', 401, 'INVALID_TOKEN'));
  }
};

export const requireRoles = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden. You do not have permission to access this resource.', 403, 'FORBIDDEN'));
    }

    next();
  };
};

/**
 * Strict backend portal access guard:
 * Validates live database state for account activation, KYC approval,
 * no unresolved document reupload/rejection flags, and active membership/payment.
 */
export const requireActiveVerifiedMember = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    const evaluation = await evaluateMemberActivationAccess(req.user.userId);
    if (!evaluation.canAccessDashboard) {
      return next(new AppError(evaluation.denyMessage, evaluation.denyStatus, evaluation.denyCode));
    }

    next();
  } catch (err) {
    next(err);
  }
};
