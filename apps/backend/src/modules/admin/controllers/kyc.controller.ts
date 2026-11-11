import { Router, Response } from 'express';
import { KycSubmissionModel } from '../models/KycSubmission';
import { MemberModel } from '../models/Member';
import { UserModel } from '../../users/users.model';
import { KYCSubmissionModel } from '../../kyc/kyc.model';
import { KYCStatus } from '@fic/shared-types';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../middleware/admin-auth.middleware';

const router = Router();

// GET /api/admin/kyc - List KYC submissions with filter
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, categoryId } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;
    if (categoryId) filter.categoryId = categoryId;

    // Filter to valid submissions with member reference or member name/email
    filter.$or = [
      { memberId: { $ne: null } },
      { memberEmail: { $exists: true, $ne: '' } },
      { memberName: { $exists: true, $ne: '' } }
    ];

    const submissions = await KycSubmissionModel.find(filter)
      .populate('memberId', 'name email phone status address')
      .populate('categoryId', 'name')
      .populate('assignedTo', 'name')
      .sort({ submittedAt: -1 })
      .lean();

    // Enrich submissions with user data if member fields were stored on User
    const enrichedSubmissions = await Promise.all(
      submissions
        .filter((sub: any) => sub.memberName || sub.memberEmail || sub.memberId)
        .map(async (sub: any) => {
          if (!sub.memberPhone || !sub.memberDob || !sub.address || !sub.subCategory) {
            const user = await UserModel.findOne({
              $or: [{ _id: sub.memberId }, { email: sub.memberEmail?.toLowerCase() }]
            }).lean() as any;

            if (user) {
              return {
                ...sub,
                memberPhone: sub.memberPhone || user.phoneNumber,
                memberDob: sub.memberDob || user.dob,
                subCategory: sub.subCategory || user.subCategory || user.primarySubcategoryName,
                address: sub.address || user.address,
                dynamicProfile: sub.dynamicProfile || user.dynamicProfile,
              };
            }
          }
          return sub;
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

    submission.status = decision;
    submission.reviewerNotes = reviewerNotes || submission.reviewerNotes;
    submission.rejectionReason = rejectionReason || (decision === 'APPROVED' ? undefined : submission.rejectionReason);
    if (decision === 'APPROVED') {
      submission.verifiedAt = new Date();
    }
    await submission.save();

    // 1. Update corresponding Member record status
    const member = await MemberModel.findById(submission.memberId);
    if (member) {
      member.kycStatus = decision;
      if (decision === 'APPROVED' && member.paymentStatus === 'PAID') {
        member.status = 'ACTIVE';
      } else if (decision === 'REJECTED') {
        member.status = 'PENDING_KYC';
      }
      await member.save();
    }

    // 2. Synchronize portal access in UserModel so customer gains immediate access
    const isApproved = decision === 'APPROVED';
    await UserModel.findOneAndUpdate(
      { $or: [{ _id: submission.memberId }, { email: submission.memberEmail?.toLowerCase() }] },
      {
        $set: {
          isKycApproved: isApproved,
          status: isApproved ? 'ACTIVE' : 'UNDER_REVIEW'
        }
      }
    );

    // 3. Keep customer KYCSubmission document aligned
    await KYCSubmissionModel.findOneAndUpdate(
      { $or: [{ userId: submission.memberId }, { userId: member?._id }] },
      {
        $set: {
          status: isApproved ? KYCStatus.APPROVED : (decision === 'REJECTED' ? KYCStatus.REJECTED : KYCStatus.RESUBMISSION_REQUESTED),
          rejectionReason: rejectionReason || undefined,
          reviewedAt: new Date()
        }
      }
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


