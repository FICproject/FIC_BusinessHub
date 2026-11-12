import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { KYCSubmissionModel } from './kyc.model';
import { UserModel } from '../users/users.model';
import { MemberModel } from '../admin/models/Member';
import { KycSubmissionModel as AdminKycSubmissionModel } from '../admin/models/KycSubmission';
import { CategoryModel as AdminCategoryModel } from '../admin/models/Category';
import { DocumentAssetModel, toSafeDocumentDto } from '../documents/documents.model';
import { PaymentModel } from '../payments/payments.model';
import { authenticate, requireRoles, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';
import { KYCStatus, UserRole } from '@fic/shared-types';

export const kycRouter = Router();

// Submit KYC documents (linked to private DocumentAsset uploads)
kycRouter.post('/submit', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { categoryId, documents } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      throw new AppError('Please provide at least one required KYC document.', 400);
    }

    const user = await UserModel.findById(req.user.userId);
    if (!user) throw new AppError('User account not found.', 404);

    const resolvedCategoryId =
      categoryId && mongoose.isValidObjectId(categoryId)
        ? new mongoose.Types.ObjectId(categoryId)
        : user.primaryCategoryId || new mongoose.Types.ObjectId();

    let categoryName = user.primaryCategoryName || 'General Business';
    try {
      const foundCat = await AdminCategoryModel.findById(resolvedCategoryId);
      if (foundCat) categoryName = foundCat.name;
    } catch {
      // Keep existing name
    }

    const verifiedDocs = await Promise.all(
      documents.map(async (doc: any, index: number) => {
        if (doc.documentId) {
          const asset = await DocumentAssetModel.findOne({
            documentId: String(doc.documentId),
            ownerId: req.user!.userId,
            isDeleted: { $ne: true }
          });
          if (!asset) {
            throw new AppError(
              `Referenced KYC document "${doc.documentId}" was not found or belongs to another user.`,
              403,
              'INVALID_DOCUMENT_REFERENCE'
            );
          }

          asset.documentStatus = 'PENDING_REVIEW';
          asset.entityType = 'KYC';
          await asset.save();

          return {
            documentId: asset.documentId,
            documentType: doc.documentType || `doc_${index}`,
            title: doc.documentName || doc.title || asset.documentLabel || doc.documentType || `Document ${index + 1}`,
            fileUrl: `/api/v1/documents/${asset.documentId}/view`,
            fileName: asset.originalFileName,
            originalMimeType: asset.originalMimeType,
            originalFileSize: asset.originalFileSize,
            checksum: asset.checksum,
            hasOptimizedPreview: Boolean(asset.optimizedStorageKey),
            hasThumbnail: Boolean(asset.thumbnailStorageKey),
            documentNumber: doc.documentNumber || asset.documentNumber || '',
            uploadedAt: asset.createdAt.toISOString()
          };
        }

        // Legacy URL-only metadata (strictly disallow unvalidated large base64 payloads inside MongoDB)
        const rawUrl = String(doc.fileUrl || '');
        if (rawUrl.startsWith('data:')) {
          throw new AppError(
            'Raw base64 KYC payloads are no longer accepted. Please upload files using POST /api/v1/documents/upload first.',
            400,
            'DIRECT_MULTIPART_UPLOAD_REQUIRED'
          );
        }

        return {
          documentId: undefined,
          documentType: doc.documentType || `doc_${index}`,
          title: doc.documentName || doc.title || doc.documentType || `Document ${index + 1}`,
          fileUrl: rawUrl,
          fileName: doc.fileName || doc.documentName || `Document_${index + 1}`,
          documentNumber: doc.documentNumber || '',
          uploadedAt: new Date().toISOString()
        };
      })
    );

    const formattedAdminDocs = verifiedDocs.map((doc) => ({
      ...(doc.documentId ? { documentId: doc.documentId } : {}),
      docKey: doc.documentType,
      title: doc.title,
      fileUrl: doc.documentId ? `/api/admin/documents/${doc.documentId}/view` : doc.fileUrl,
      fileName: doc.fileName,
      originalMimeType: doc.originalMimeType,
      originalFileSize: doc.originalFileSize,
      checksum: doc.checksum,
      hasOptimizedPreview: doc.hasOptimizedPreview,
      hasThumbnail: doc.hasThumbnail,
      documentNumber: doc.documentNumber || '',
      uploadedAt: doc.uploadedAt,
      status: 'PENDING'
    }));

    // Lookup genuine verified Razorpay payment record (never synthesize fake payment IDs)
    const verifiedPayment = await PaymentModel.findOne({
      userId: req.user.userId,
      status: 'SUCCESS'
    })
      .sort({ createdAt: -1 })
      .lean();

    const verifiedPaymentDetails = verifiedPayment
      ? {
          orderId: verifiedPayment.razorpayOrderId || verifiedPayment.internalOrderId,
          paymentId: verifiedPayment.razorpayPaymentId || verifiedPayment.paymentId,
          amount: verifiedPayment.amount,
          currency: verifiedPayment.currency || 'INR',
          method: verifiedPayment.paymentMethod || 'RAZORPAY',
          paidAt: verifiedPayment.verifiedAt || verifiedPayment.updatedAt,
          status: 'CAPTURED'
        }
      : undefined;

    // 1. Save / Update in customer KYC submission collection
    const submission = await KYCSubmissionModel.findOneAndUpdate(
      { userId: req.user.userId },
      {
        userId: req.user.userId,
        categoryId: resolvedCategoryId,
        status: KYCStatus.PENDING,
        documents: verifiedDocs.map((doc) => ({
          ...(doc.documentId ? { documentId: doc.documentId } : {}),
          documentType: doc.documentType || 'ID_PROOF',
          documentNumber: doc.documentNumber || '',
          originalFileName: doc.fileName,
          originalMimeType: doc.originalMimeType,
          originalFileSize: doc.originalFileSize,
          checksum: doc.checksum,
          hasOptimizedPreview: doc.hasOptimizedPreview,
          hasThumbnail: doc.hasThumbnail,
          fileUrl: doc.fileUrl,
          verificationStatus: KYCStatus.PENDING,
          uploadedAt: new Date(doc.uploadedAt)
        }))
      },
      { upsert: true, new: true }
    );

    // 2. Synchronize to Admin KYC Submission collection
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
        ...(verifiedPaymentDetails ? { paymentDetails: verifiedPaymentDetails } : {}),
        categoryId: resolvedCategoryId,
        categoryName,
        status: 'SUBMITTED',
        documents: formattedAdminDocs,
        submittedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // 3. Keep Member record in sync with PENDING_KYC / UNDER_REVIEW status
    await MemberModel.findByIdAndUpdate(
      user._id,
      {
        name: user.fullName,
        email: user.email.toLowerCase(),
        phone: user.phoneNumber,
        primaryCategory: resolvedCategoryId,
        primaryCategoryName: categoryName,
        kycStatus: 'SUBMITTED',
        status: 'UNDER_REVIEW',
        paymentStatus: verifiedPayment ? 'PAID' : 'PENDING'
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

// Get user's own KYC status along with private document metadata
kycRouter.get('/status', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const submission = await KYCSubmissionModel.findOne({ userId: req.user.userId }).lean();
    const privateDocs = await DocumentAssetModel.find({
      ownerId: req.user.userId,
      entityType: 'KYC',
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...(submission || { status: KYCStatus.NOT_SUBMITTED }),
        documentAssets: privateDocs.map((d) => toSafeDocumentDto(d, 'member'))
      }
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
