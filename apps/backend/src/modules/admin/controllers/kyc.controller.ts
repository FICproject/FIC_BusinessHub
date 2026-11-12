import mongoose from 'mongoose';
import { Router, Response } from 'express';
import { KycSubmissionModel } from '../models/KycSubmission';
import { MemberModel } from '../models/Member';
import { UserModel } from '../../users/users.model';
import { KYCSubmissionModel } from '../../kyc/kyc.model';
import { DocumentAssetModel, toSafeDocumentDto } from '../../documents/documents.model';
import { PaymentModel } from '../../payments/payments.model';
import { AccountStatus, KYCStatus } from '@fic/shared-types';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../middleware/admin-auth.middleware';

const router = Router();

async function syncMissingKycSubmissionsFromSharedDb() {
  // Identify members/users who have completed KYC upload, payment, or customer-side KYC submission
  // without an Admin KycSubmission document yet, and create a single idempotent Admin entry.
  const [existingAdminSubs, customerSubs, submittedMembers, usersWithKycDocs] = await Promise.all([
    KycSubmissionModel.find({
      $or: [
        { memberId: { $ne: null } },
        { memberEmail: { $exists: true, $ne: '' } }
      ]
    })
      .select('memberId memberEmail')
      .lean(),
    KYCSubmissionModel.find({
      userId: { $ne: null },
      status: { $ne: KYCStatus.NOT_SUBMITTED }
    })
      .sort({ updatedAt: -1 })
      .lean(),
    MemberModel.find({
      $or: [
        { kycStatus: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUESTED'] } },
        { paymentStatus: 'PAID' }
      ]
    }).lean(),
    DocumentAssetModel.distinct('ownerId', {
      entityType: 'KYC',
      isDeleted: { $ne: true }
    })
  ]);

  const coveredMemberIds = new Set<string>();
  const coveredEmails = new Set<string>();
  for (const sub of existingAdminSubs as any[]) {
    if (sub.memberId) coveredMemberIds.add(String(sub.memberId));
    if (sub.memberEmail) coveredEmails.add(String(sub.memberEmail).toLowerCase());
  }

  const customerSubByUserId = new Map<string, any>();
  for (const cs of customerSubs as any[]) {
    if (cs.userId) customerSubByUserId.set(String(cs.userId), cs);
  }

  const candidateUserIds = new Set<string>();
  for (const cs of customerSubs as any[]) {
    if (cs.userId && !coveredMemberIds.has(String(cs.userId))) {
      candidateUserIds.add(String(cs.userId));
    }
  }
  for (const m of submittedMembers as any[]) {
    const email = m.email?.toLowerCase();
    if (!coveredMemberIds.has(String(m._id)) && (!email || !coveredEmails.has(email))) {
      candidateUserIds.add(String(m._id));
    }
  }
  for (const uid of usersWithKycDocs as any[]) {
    if (uid && !coveredMemberIds.has(String(uid))) {
      candidateUserIds.add(String(uid));
    }
  }

  if (candidateUserIds.size === 0) return;

  const users = await UserModel.find({ _id: { $in: Array.from(candidateUserIds) } }).lean() as any[];
  for (const user of users) {
    const email = user.email?.toLowerCase();
    if (coveredMemberIds.has(String(user._id)) || (email && coveredEmails.has(email))) continue;

    const memberDoc = (submittedMembers as any[]).find(
      (m) => String(m._id) === String(user._id) || (email && m.email?.toLowerCase() === email)
    );
    const customerSub = customerSubByUserId.get(String(user._id));
    const [assets, latestPayment] = await Promise.all([
      DocumentAssetModel.find({
        ownerId: user._id,
        entityType: 'KYC',
        isDeleted: { $ne: true }
      })
        .sort({ createdAt: -1 })
        .lean(),
      PaymentModel.findOne({ userId: user._id, status: 'SUCCESS' }).sort({ createdAt: -1 }).lean()
    ]);

    const docsFromAssets = (assets as any[]).map((a, idx) => ({
      documentId: a.documentId,
      docKey: a.documentCategory || `doc_${idx}`,
      title: a.documentLabel || a.originalFileName || `Document ${idx + 1}`,
      fileUrl: `/api/admin/documents/${a.documentId}/view`,
      fileName: a.originalFileName || a.documentLabel || `Document_${idx + 1}`,
      originalMimeType: a.originalMimeType,
      originalFileSize: a.originalFileSize,
      checksum: a.checksum,
      hasOptimizedPreview: Boolean(a.optimizedStorageKey),
      hasThumbnail: Boolean(a.thumbnailStorageKey),
      documentNumber: a.documentNumber || '',
      uploadedAt: (a.createdAt || new Date()).toISOString(),
      status: a.documentStatus === 'VERIFIED' ? 'VERIFIED' : a.documentStatus === 'REJECTED' ? 'REJECTED' : 'PENDING'
    }));

    const docsFromSub = (customerSub?.documents || []).map((d: any, idx: number) => ({
      ...(d.documentId ? { documentId: d.documentId } : {}),
      docKey: d.documentType || `doc_${idx}`,
      title: d.documentType || `Document ${idx + 1}`,
      fileUrl: d.documentId ? `/api/admin/documents/${d.documentId}/view` : d.fileUrl,
      fileName: d.originalFileName || d.documentType || `Document_${idx + 1}`,
      originalMimeType: d.originalMimeType,
      originalFileSize: d.originalFileSize,
      checksum: d.checksum,
      hasOptimizedPreview: d.hasOptimizedPreview,
      hasThumbnail: d.hasThumbnail,
      documentNumber: d.documentNumber || '',
      uploadedAt: (d.uploadedAt || customerSub.createdAt || new Date()).toISOString(),
      status: d.verificationStatus === 'APPROVED' ? 'VERIFIED' : d.verificationStatus === 'REJECTED' ? 'REJECTED' : 'PENDING'
    }));

    const mergedDocs = docsFromAssets.length > 0 ? docsFromAssets : docsFromSub;
    const rawState = customerSub?.status || memberDoc?.kycStatus || 'SUBMITTED';
    const normalizedStatus =
      rawState === 'APPROVED' || user.isKycApproved
        ? 'APPROVED'
        : rawState === 'REJECTED'
        ? 'REJECTED'
        : rawState === 'RESUBMIT_REQUIRED' || rawState === 'RESUBMISSION_REQUESTED'
        ? 'RESUBMISSION_REQUESTED'
        : 'SUBMITTED';

    if (!memberDoc) {
      await MemberModel.findOneAndUpdate(
        { $or: [{ _id: user._id }, ...(email ? [{ email }] : [])] },
        {
          $setOnInsert: {
            _id: user._id,
            registeredAt: user.createdAt || new Date()
          },
          $set: {
            name: user.fullName,
            email: email || user.email,
            phone: user.phoneNumber,
            primaryCategory: user.primaryCategoryId,
            primaryCategoryName: user.primaryCategoryName || 'General Business',
            subcategories: [user.subCategory || user.primarySubcategoryName || 'Member'].filter(Boolean),
            kycStatus: normalizedStatus,
            status: normalizedStatus === 'APPROVED' ? 'ACTIVE' : 'UNDER_REVIEW',
            membershipFeePaid: latestPayment ? latestPayment.amount : 0,
            paymentStatus: latestPayment ? 'PAID' : 'PENDING'
          }
        },
        { upsert: true }
      );
    }

    await KycSubmissionModel.findOneAndUpdate(
      { $or: [{ memberId: user._id }, ...(email ? [{ memberEmail: email }] : [])] },
      {
        $setOnInsert: {
          memberId: user._id,
          memberName: user.fullName,
          memberEmail: email || user.email,
          memberPhone: user.phoneNumber,
          memberDob: user.dob,
          subCategory: user.subCategory || user.primarySubcategoryName || '',
          address: user.address,
          dynamicProfile: user.dynamicProfile,
          categoryId: customerSub?.categoryId || user.primaryCategoryId || new mongoose.Types.ObjectId(),
          categoryName: user.primaryCategoryName || 'General Business',
          status: normalizedStatus,
          documents: mergedDocs,
          ...(latestPayment
            ? {
                paymentDetails: {
                  orderId: latestPayment.razorpayOrderId || latestPayment.internalOrderId,
                  paymentId: latestPayment.razorpayPaymentId || latestPayment.paymentId,
                  amount: latestPayment.amount,
                  currency: latestPayment.currency || 'INR',
                  method: latestPayment.paymentMethod || 'RAZORPAY',
                  paidAt: latestPayment.verifiedAt || latestPayment.updatedAt,
                  status: 'CAPTURED'
                }
              }
            : {}),
          submittedAt: customerSub?.createdAt || user.createdAt || new Date()
        }
      },
      { upsert: true }
    );

    coveredMemberIds.add(String(user._id));
    if (email) coveredEmails.add(email);
  }
}

// GET /api/admin/kyc - List KYC submissions with filter
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    await syncMissingKycSubmissionsFromSharedDb();

    const { status, categoryId } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') {
      const s = String(status).trim().toUpperCase();
      if (s === 'RESUBMISSION_REQUESTED') {
        filter.status = { $in: ['RESUBMISSION_REQUESTED', 'RESUBMIT_REQUIRED'] };
      } else if (s === 'SUBMITTED') {
        filter.status = { $in: ['SUBMITTED', 'PENDING', 'UNDER_REVIEW'] };
      } else {
        filter.status = s;
      }
    }
    if (categoryId) filter.categoryId = categoryId;

    // Filter to valid Admin KYC submissions with member reference or member name/email
    filter.$or = [
      { memberId: { $ne: null } },
      { memberEmail: { $exists: true, $ne: '' } },
      { memberName: { $exists: true, $ne: '' } }
    ];

    const submissions = await KycSubmissionModel.find(filter)
      .populate('memberId', 'name email phone status address')
      .populate('categoryId', 'name')
      .populate('assignedTo', 'name')
      .sort({ submittedAt: -1, updatedAt: -1 })
      .lean();

    // Deduplicate per member/email and enrich with User fields
    const dedupMap = new Map<string, any>();
    for (const sub of submissions as any[]) {
      if (!sub.memberName && !sub.memberEmail && !sub.memberId) continue;
      const memberKey = String(
        sub.memberId?._id || sub.memberId || (sub.memberEmail ? sub.memberEmail.toLowerCase() : sub._id)
      );
      if (!dedupMap.has(memberKey)) {
        dedupMap.set(memberKey, sub);
      }
    }

    const enrichedSubmissions = await Promise.all(
      Array.from(dedupMap.values()).map(async (sub: any) => {
        const normalizedStatus =
          sub.status === 'RESUBMIT_REQUIRED' ? 'RESUBMISSION_REQUESTED' : sub.status;
        if (!sub.memberPhone || !sub.memberDob || !sub.address || !sub.subCategory || !sub.documents?.length) {
          const user = await UserModel.findOne({
            $or: [{ _id: sub.memberId?._id || sub.memberId }, { email: sub.memberEmail?.toLowerCase() }]
          }).lean() as any;

          if (user) {
            return {
              ...sub,
              status: normalizedStatus,
              adminNotes: sub.adminNotes || sub.reviewerNotes,
              memberPhone: sub.memberPhone || user.phoneNumber,
              memberDob: sub.memberDob || user.dob,
              subCategory: sub.subCategory || user.subCategory || user.primarySubcategoryName,
              address: sub.address || user.address,
              dynamicProfile: sub.dynamicProfile || user.dynamicProfile,
            };
          }
        }
        return {
          ...sub,
          status: normalizedStatus,
          adminNotes: sub.adminNotes || sub.reviewerNotes,
        };
      })
    );

    res.json({ success: true, data: enrichedSubmissions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/kyc/:id - Get specific KYC submission details
router.get('/:id', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const submission = await KycSubmissionModel.findById(req.params.id)
      .populate('memberId')
      .populate('categoryId')
      .populate('assignedTo', 'name email role')
      .lean();

    if (!submission) {
      res.status(404).json({ success: false, error: 'KYC submission not found' });
      return;
    }

    const subObj = submission as any;
    if (!subObj.memberPhone || !subObj.memberDob || !subObj.address || !subObj.subCategory) {
      const user = await UserModel.findOne({
        $or: [{ _id: subObj.memberId }, { email: subObj.memberEmail?.toLowerCase() }]
      }).lean() as any;

      if (user) {
        subObj.memberPhone = subObj.memberPhone || user.phoneNumber;
        subObj.memberDob = subObj.memberDob || user.dob;
        subObj.subCategory = subObj.subCategory || user.subCategory || user.primarySubcategoryName;
        subObj.address = subObj.address || user.address;
        subObj.dynamicProfile = subObj.dynamicProfile || user.dynamicProfile;
      }
    }

    const ownerUser = await UserModel.findOne({
      $or: [{ _id: subObj.memberId?._id || subObj.memberId }, { email: subObj.memberEmail?.toLowerCase() }]
    }).select('_id').lean<{ _id?: any }>();
    const privateAssets = await DocumentAssetModel.find({
      $or: [
        ...(ownerUser?._id ? [{ ownerId: ownerUser._id }] : []),
        ...(subObj.memberId ? [{ memberId: subObj.memberId?._id || subObj.memberId }] : [])
      ],
      entityType: 'KYC',
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });
    subObj.documentAssets = privateAssets.map((a) => toSafeDocumentDto(a, 'admin'));

    if (!subObj.memberPhone || !subObj.memberDob || !subObj.address || !subObj.subCategory) {
      const user = await UserModel.findOne({
        $or: [{ _id: subObj.memberId }, { email: subObj.memberEmail?.toLowerCase() }]
      }).lean() as any;

      if (user) {
        subObj.memberPhone = subObj.memberPhone || user.phoneNumber;
        subObj.memberDob = subObj.memberDob || user.dob;
        subObj.subCategory = subObj.subCategory || user.subCategory || user.primarySubcategoryName;
        subObj.address = subObj.address || user.address;
        subObj.dynamicProfile = subObj.dynamicProfile || user.dynamicProfile;
      }
    }
    res.json({ success: true, data: subObj });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/kyc/:id/review - Review/Decision on KYC submission
router.patch('/:id/review', authenticateAdmin, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { decision, reviewerNotes, rejectionReason } = req.body; // 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUESTED'

    if (!['APPROVED', 'REJECTED', 'RESUBMISSION_REQUESTED'].includes(decision)) {
      res.status(400).json({ success: false, error: 'Invalid review decision' });
      return;
    }

    const submission = await KycSubmissionModel.findById(id);
    if (!submission) {
      res.status(404).json({ success: false, error: 'KYC submission not found' });
      return;
    }

    const trimmedReason = typeof rejectionReason === 'string' ? rejectionReason.trim() : '';
    const trimmedNotes = typeof reviewerNotes === 'string' ? reviewerNotes.trim() : '';

    if (decision !== 'APPROVED' && !trimmedReason) {
      res.status(400).json({
        success: false,
        error: 'Please provide a clear reason or instructions for rejection or resubmission.'
      });
      return;
    }

    submission.status = decision;
    submission.reviewerNotes = trimmedNotes || submission.reviewerNotes;
    submission.rejectionReason = decision === 'APPROVED' ? undefined : trimmedReason;
    submission.verifiedAt = new Date();
    await submission.save();

    // 1. Update corresponding Member record status
    const member = await MemberModel.findOne({
      $or: [{ _id: submission.memberId }, ...(submission.memberEmail ? [{ email: submission.memberEmail.toLowerCase() }] : [])]
    });
    if (member) {
      member.kycStatus = decision;
      if (decision === 'APPROVED' && member.paymentStatus === 'PAID') {
        member.status = 'ACTIVE';
      } else if (decision === 'REJECTED' || decision === 'RESUBMISSION_REQUESTED') {
        member.status = 'PENDING_KYC';
      }
      await member.save();
    }

    // 2. Keep UserModel.status ACTIVE so member can log in and see APPROVED / RESUBMISSION_REQUESTED / REJECTED status
    const isApproved = decision === 'APPROVED';
    await UserModel.findOneAndUpdate(
      { $or: [{ _id: submission.memberId }, { email: submission.memberEmail?.toLowerCase() }] },
      {
        $set: {
          isKycApproved: isApproved,
          status: AccountStatus.ACTIVE
        }
      }
    );

    // 3. Keep customer KYCSubmission document aligned
    await KYCSubmissionModel.findOneAndUpdate(
      { $or: [{ userId: submission.memberId }, ...(member?._id ? [{ userId: member._id }] : [])] },
      {
        $set: {
          userId: submission.memberId || member?._id,
          categoryId: submission.categoryId,
          status: isApproved
            ? KYCStatus.APPROVED
            : decision === 'REJECTED'
            ? KYCStatus.REJECTED
            : KYCStatus.RESUBMIT_REQUIRED,
          rejectionReason: isApproved ? undefined : trimmedReason,
          reviewedAt: new Date()
        }
      },
      { upsert: true }
    );

    // 4. Update DocumentAsset statuses for uploaded KYC docs
    const linkedDocIds = (submission.documents || []).map((d: any) => d.documentId).filter(Boolean);
    await DocumentAssetModel.updateMany(
      {
        $or: [
          ...(linkedDocIds.length ? [{ documentId: { $in: linkedDocIds } }] : []),
          { ownerId: submission.memberId, entityType: 'KYC' }
        ]
      },
      { $set: { documentStatus: isApproved ? 'VERIFIED' : 'REJECTED' } }
    );

    await logAdminAction(req, `KYC_${decision}`, 'KycSubmission', id, {
      memberId: submission.memberId.toString(),
      decision,
      rejectionReason,
    });

    res.json({
      success: true,
      message: `KYC submission marked as ${decision}. Portal access ${isApproved ? 'GRANTED' : 'RESTRICTED'}.`,
      data: submission,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;


