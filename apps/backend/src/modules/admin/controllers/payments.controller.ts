import { Router, Response } from 'express';
import { AdminPaymentModel } from '../models/Payment';
import { MemberModel } from '../models/Member';
import { UserModel } from '../../users/users.model';
import { KycSubmissionModel } from '../models/KycSubmission';
import { authenticateAdmin, AuthenticatedAdminRequest, logAdminAction } from '../middleware/admin-auth.middleware';

const router = Router();

// GET /api/admin/payments - List all transaction history with filters
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;

    let payments: any[] = await AdminPaymentModel.find(filter)
      .populate('memberId', 'name email phone primaryCategoryName')
      .sort({ createdAt: -1 })
      .lean();

    // If payments table is empty or missing newly registered members, auto-discover payments from members / KYC records
    const membersWithPayment = await MemberModel.find({ paymentStatus: 'PAID' }).lean();

    for (const m of membersWithPayment) {
      const alreadyHasPayment = payments.some((p: any) =>
        p.memberId?._id?.toString() === m._id.toString() ||
        p.memberId?.email?.toLowerCase() === m.email.toLowerCase()
      );

      if (!alreadyHasPayment) {
        // Look up corresponding KYC submission for Razorpay order/payment details
        const kyc = await KycSubmissionModel.findOne({
          $or: [{ memberId: m._id }, { memberEmail: m.email.toLowerCase() }]
        }).lean() as any;

        const txnId = kyc?.paymentDetails?.paymentId || `pay_rzp_${m._id.toString().slice(-6)}`;
        const orderId = kyc?.paymentDetails?.orderId || `order_rzp_${m._id.toString().slice(-6)}`;

        // Save persistent Admin Payment record
        const createdPayment = await AdminPaymentModel.create({
          memberId: m._id,
          amount: m.membershipFeePaid || 99,
          currency: 'INR',
          paymentType: 'INTRO_FEE',
          status: 'SUCCESS',
          gatewayProvider: 'RAZORPAY',
          gatewayTransactionId: txnId,
          invoiceUrl: `https://ficapp.in/invoices/inv_${orderId}.pdf`
        });

        payments.push({
          ...createdPayment.toObject(),
          memberId: {
            _id: m._id,
            name: m.name,
            email: m.email,
            phone: m.phone,
            primaryCategoryName: m.primaryCategoryName
          }
        });
      }
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      payments = payments.filter((p: any) => {
        const nameMatch = p.memberId?.name?.toLowerCase().includes(q);
        const emailMatch = p.memberId?.email?.toLowerCase().includes(q);
        const txnMatch = p.gatewayTransactionId?.toLowerCase().includes(q);
        return nameMatch || emailMatch || txnMatch;
      });
    }

    res.json({ success: true, data: payments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/webhooks/payment - Payment gateway webhook receiver
router.post('/webhook', async (req, res) => {
  console.log('[WEBHOOK RECEIVED] Payment Gateway Payload:', req.body);
  res.json({ received: true });
});

export default router;

