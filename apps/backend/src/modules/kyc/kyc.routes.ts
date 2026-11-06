import { Router, Response, NextFunction } from 'express';
import { KYCSubmissionModel } from './kyc.model';
import { UserModel } from '../users/users.model';
import { authenticate, requireRoles, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';
import { KYCStatus, UserRole } from '@fic/shared-types';

export const kycRouter = Router();

// Submit KYC documents
kycRouter.post('/submit', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { categoryId, documents } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      throw new AppError('Please provide at least one required KYC document.', 400);
    }

    const submission = await KYCSubmissionModel.findOneAndUpdate(
      { userId: req.user.userId },
      {
        userId: req.user.userId,
        categoryId: categoryId || req.user.primaryCategoryId,
        status: KYCStatus.PENDING,
        documents: documents.map((doc: any) => ({
          documentType: doc.documentType,
          documentNumber: doc.documentNumber || '',
          fileUrl: doc.fileUrl,
          verificationStatus: KYCStatus.PENDING,
          uploadedAt: new Date()
        }))
      },
      { upsert: true, new: true }
    );

    await UserModel.findByIdAndUpdate(req.user.userId, {
      activeKycSubmissionId: submission._id
    });

    res.status(200).json({
      success: true,
      message: 'KYC application submitted successfully. It is now in queue for FIC verification.',
      data: submission
    });
  } catch (error) {
    next(error);
  }
});

// Get user's own KYC status
kycRouter.get('/status', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const submission = await KYCSubmissionModel.findOne({ userId: req.user.userId });
    res.status(200).json({
      success: true,
      data: submission || { status: KYCStatus.NOT_SUBMITTED }
    });
  } catch (error) {
    next(error);
  }
});

// Demo/Testing helper: restricted instant approval for development verification
kycRouter.post('/dev-approve-me', authenticate, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('Development endpoint disabled in production.', 404);
    }
    if (!req.user) throw new AppError('Unauthorized', 401);

    await KYCSubmissionModel.findOneAndUpdate(
      { userId: req.user.userId },
      { status: KYCStatus.APPROVED, reviewedAt: new Date() }
    );

    const user = await UserModel.findByIdAndUpdate(
      req.user.userId,
      { isKycApproved: true },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'KYC marked as Approved for testing by Administrator.',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

