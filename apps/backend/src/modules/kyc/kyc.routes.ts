import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { KYCSubmissionModel } from './kyc.model';
import { UserModel } from '../users/users.model';
import { MemberModel } from '../admin/models/Member';
import { KycSubmissionModel as AdminKycSubmissionModel } from '../admin/models/KycSubmission';
import { CategoryModel as AdminCategoryModel } from '../admin/models/Category';
import { authenticate, requireRoles, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';
import { KYCStatus, UserRole } from '@fic/shared-types';

export const kycRouter = Router();

// Submit KYC documents
kycRouter.post('/submit', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { categoryId, documents, paymentDetails } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      throw new AppError('Please provide at least one required KYC document.', 400);
    }

    const user = await UserModel.findById(req.user.userId);
    if (!user) throw new AppError('User account not found.', 404);

    const resolvedCategoryId = (categoryId && mongoose.isValidObjectId(categoryId))
      ? new mongoose.Types.ObjectId(categoryId)
      : (user.primaryCategoryId || new mongoose.Types.ObjectId());

    // Resolve category name
    let categoryName = user.primaryCategoryName || 'General Business';
    try {
      const foundCat = await AdminCategoryModel.findById(resolvedCategoryId);
      if (foundCat) categoryName = foundCat.name;
    } catch {
      // Keep existing name
    }

    // Standardize documents for admin review display
    const formattedDocs = documents.map((doc: any, index: number) => ({
      docKey: doc.documentType || `doc_${index}`,
      title: doc.documentName || doc.title || doc.documentType || `Document ${index + 1}`,
      fileUrl: doc.fileUrl || '',
      fileName: doc.fileName || doc.documentName || `Document_${index + 1}.png`,
      documentNumber: doc.documentNumber || '',
      uploadedAt: new Date().toISOString(),
      status: 'PENDING'
    }));

    // 1. Save / Update in customer KYC submission collection
    const submission = await KYCSubmissionModel.findOneAndUpdate(
      { userId: req.user.userId },
      {
        userId: req.user.userId,
        categoryId: resolvedCategoryId,
        status: KYCStatus.PENDING,
        documents: documents.map((doc: any) => ({
          documentType: doc.documentType || 'ID_PROOF',
          documentNumber: doc.documentNumber || '',
          fileUrl: doc.fileUrl || '',
          verificationStatus: KYCStatus.PENDING,
          uploadedAt: new Date()
        }))
      },
      { upsert: true, new: true }
    );

    // 2. Synchronize to Admin KYC Submission collection for Admin KYC Verification Tab
    await AdminKycSubmissionModel.findOneAndUpdate(
      { $or: [{ memberId: user._id }, { memberEmail: user.email.toLowerCase() }] },
      {
        memberId: user._id,
        memberName: user.fullName,
        memberEmail: user.email.toLowerCase(),
        memberPhone: user.phoneNumber,
        memberDob: user.dob,
        subCategory: user.subCategory || user.primarySubcategoryName || '',
        address: user.address,
        dynamicProfile: user.dynamicProfile,
        paymentDetails: paymentDetails || {
          orderId: `order_rp_${Date.now()}`,
          paymentId: `pay_rp_${Date.now()}`,
          amount: 99,
          currency: 'INR',
          method: 'RAZORPAY_UPI',
          paidAt: new Date(),
          status: 'CAPTURED'
        },
        categoryId: resolvedCategoryId,
        categoryName: categoryName,
        status: 'SUBMITTED',
        documents: formattedDocs,
        submittedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // 3. Keep Member record in sync with PENDING_KYC status
    await MemberModel.findByIdAndUpdate(
      user._id,
      {
        name: user.fullName,
        email: user.email.toLowerCase(),
        phone: user.phoneNumber,
        primaryCategory: resolvedCategoryId,
        primaryCategoryName: categoryName,
        kycStatus: 'SUBMITTED',
        status: 'UNDER_REVIEW'
      },
      { upsert: true }
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


