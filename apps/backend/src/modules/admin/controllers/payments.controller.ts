import { Router, Request, Response, NextFunction } from 'express';
import { AdminPaymentModel } from '../models/Payment';
import { PaymentModel } from '../../payments/payments.model';
import { processRazorpayWebhookEvent } from '../../payments/payments.service';
import { AppError } from '../../../common/errors/app-error';
import { authenticateAdmin } from '../middleware/admin-auth.middleware';

const router = Router();

// GET /api/admin/payments - List all real transaction history with filters & Razorpay audit metadata
router.get('/', authenticateAdmin, async (req, res, next) => {
  try {
    const { status, search, purpose } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;
    if (purpose && purpose !== 'ALL') filter.purpose = purpose;

    const adminPayments: any[] = await AdminPaymentModel.find(filter)
      .populate('memberId', 'name email phone primaryCategoryName')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    // Enrich with authoritative PaymentModel records (razorpayOrderId, razorpayPaymentId, paymentMethod, verification flags)
    const orderIds = adminPayments.map((p) => p.razorpayOrderId).filter(Boolean);
    const paymentIds = adminPayments.map((p) => p.paymentId).filter(Boolean);
    const linkedPayments = await PaymentModel.find({
      $or: [
        ...(orderIds.length ? [{ razorpayOrderId: { $in: orderIds } }] : []),
        ...(paymentIds.length ? [{ paymentId: { $in: paymentIds } }] : [])
      ]
    })
      .select(
        'paymentId internalOrderId razorpayOrderId razorpayPaymentId paymentMethod preferredMethod purpose mode signatureVerified webhookVerified failureReason verifiedAt'
      )
      .lean();

    const byPaymentId = new Map(linkedPayments.map((lp: any) => [lp.paymentId, lp]));
    const byOrderId = new Map(linkedPayments.map((lp: any) => [lp.razorpayOrderId, lp]));

    let enriched = adminPayments.map((p: any) => {
      const linked = (p.paymentId && byPaymentId.get(p.paymentId)) || (p.razorpayOrderId && byOrderId.get(p.razorpayOrderId));
      return {
        ...p,
        paymentId: p.paymentId || linked?.paymentId,
        internalOrderId: p.internalOrderId || linked?.internalOrderId,
        razorpayOrderId: p.razorpayOrderId || linked?.razorpayOrderId,
        razorpayPaymentId: p.razorpayPaymentId || linked?.razorpayPaymentId,
        paymentMethod: p.paymentMethod || linked?.paymentMethod || linked?.preferredMethod,
        purpose: p.purpose || linked?.purpose,
        mode: linked?.mode || 'TEST',
        signatureVerified: Boolean(p.signatureVerified ?? linked?.signatureVerified),
        webhookVerified: Boolean(p.webhookVerified ?? linked?.webhookVerified),
        failureReason: p.failureReason || linked?.failureReason,
        verifiedAt: linked?.verifiedAt
      };
    });

    if (search && typeof search === 'string') {
      const q = search.trim().toLowerCase();
      enriched = enriched.filter((p: any) => {
        const nameMatch = p.memberId?.name?.toLowerCase().includes(q);
        const emailMatch = p.memberId?.email?.toLowerCase().includes(q);
        const txnMatch = p.gatewayTransactionId?.toLowerCase().includes(q);
        const rzpPayMatch = p.razorpayPaymentId?.toLowerCase().includes(q);
        const rzpOrdMatch = p.razorpayOrderId?.toLowerCase().includes(q);
        const internalMatch = p.internalOrderId?.toLowerCase().includes(q);
        const payIdMatch = p.paymentId?.toLowerCase().includes(q);
        return (
          nameMatch ||
          emailMatch ||
          txnMatch ||
          rzpPayMatch ||
          rzpOrdMatch ||
          internalMatch ||
          payIdMatch
        );
      });
    }

    res.json({ success: true, data: enriched });
  } catch (err: any) {
    next(err);
  }
});

// POST /api/admin/payments/webhook - Verified Razorpay webhook handler
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const eventId = req.headers['x-razorpay-event-id'] as string | undefined;
    if (!signature) {
      throw new AppError('Missing X-Razorpay-Signature header.', 400, 'MISSING_WEBHOOK_SIGNATURE');
    }

    const rawBody: Buffer | string =
      (req as any).rawBody || (Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body || {}));

    const result = await processRazorpayWebhookEvent({
      rawBody,
      signatureHeader: signature,
      eventIdHeader: eventId,
      payload: req.body
    });

    res.json({ received: true, ...result });
  } catch (err) {
    next(err);
  }
});

export default router;
