import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AdminPaymentModel } from '../models/Payment';
import { MemberModel } from '../models/Member';
import { UserModel } from '../../users/users.model';
import { PaymentModel } from '../../payments/payments.model';
import { processRazorpayWebhookEvent } from '../../payments/payments.service';
import { AppError } from '../../../common/errors/app-error';
import { authenticateAdmin } from '../middleware/admin-auth.middleware';

const router = Router();

function normalizeStoredStatusForAdmin(rawStatus?: string): 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED' | 'REFUNDED' {
  const upper = String(rawStatus || 'PENDING').trim().toUpperCase();
  if (upper === 'SUCCESS' || upper === 'CAPTURED' || upper === 'PAID') return 'SUCCESS';
  if (upper === 'REFUNDED') return 'REFUNDED';
  if (upper === 'CANCELLED') return 'CANCELLED';
  if (upper === 'FAILED') return 'FAILED';
  return 'PENDING';
}

function resolveStatusFilterSet(rawFilter?: unknown): string[] | null {
  const normalized = String(rawFilter || 'ALL').trim().toUpperCase();
  if (!normalized || normalized === 'ALL') return null;
  if (normalized === 'SUCCESS') return ['SUCCESS', 'CAPTURED', 'PAID'];
  if (normalized === 'PENDING') return ['PENDING', 'CREATED', 'INITIATED', 'AUTHORIZED'];
  if (normalized === 'FAILED') return ['FAILED'];
  if (normalized === 'CANCELLED') return ['CANCELLED'];
  if (normalized === 'REFUNDED') return ['REFUNDED'];
  return [normalized];
}

function getPurposeDescription(purpose?: string, paymentType?: string): string {
  const key = String(purpose || paymentType || '').trim().toUpperCase();
  if (key === 'MEMBERSHIP_FIRST_YEAR' || key === 'INTRO_FEE' || key === 'FIRST_YEAR_MEMBERSHIP') {
    return 'FIC Business Hub — First-Year Introductory Membership Fee';
  }
  if (key === 'MEMBERSHIP_RENEWAL' || key === 'ANNUAL_RENEWAL') {
    return 'FIC Business Hub — Annual Membership Renewal';
  }
  if (key === 'WALLET_TOPUP') {
    return 'FIC Member Wallet Top-Up Deposit';
  }
  if (key === 'SERVICE_ORDER') {
    return 'FIC Business Marketplace Service Order';
  }
  if (key === 'MANUAL_OVERRIDE') {
    return 'Administrative Membership Adjustment';
  }
  return 'FIC Business Hub Platform Transaction';
}

export async function collectUnifiedPayments(): Promise<any[]> {
  const [adminPayments, gatewayPayments] = await Promise.all([
    AdminPaymentModel.find({})
      .populate('memberId', 'name email phone primaryCategoryName')
      .sort({ createdAt: -1 })
      .lean(),
    PaymentModel.find({})
      .select(
        'paymentId userId memberId orderId internalOrderId razorpayOrderId razorpayPaymentId transactionId transactionReference amount amountInPaise currency status paymentMethod preferredMethod purpose provider mode signatureVerified webhookVerified failureReason verifiedAt createdAt updatedAt'
      )
      .sort({ createdAt: -1 })
      .lean()
  ]);

  const byPaymentId = new Map<string, any>();
  const byOrderId = new Map<string, any>();
  const seenKeys = new Set<string>();

  for (const gp of gatewayPayments as any[]) {
    if (gp.paymentId) byPaymentId.set(gp.paymentId, gp);
    if (gp.razorpayOrderId) byOrderId.set(gp.razorpayOrderId, gp);
    if (gp.internalOrderId) byOrderId.set(gp.internalOrderId, gp);
  }

  const unified: any[] = [];

  for (const ap of adminPayments as any[]) {
    const linked =
      (ap.paymentId && byPaymentId.get(ap.paymentId)) ||
      (ap.razorpayOrderId && byOrderId.get(ap.razorpayOrderId)) ||
      (ap.internalOrderId && byOrderId.get(ap.internalOrderId));

    const effectiveStatus = normalizeStoredStatusForAdmin(linked?.status || ap.status);
    const keyCandidates = [
      ap.paymentId || linked?.paymentId,
      ap.razorpayOrderId || linked?.razorpayOrderId,
      ap.internalOrderId || linked?.internalOrderId,
      ap.razorpayPaymentId || linked?.razorpayPaymentId,
      ap.gatewayTransactionId
    ]
      .filter(Boolean)
      .map((k) => String(k));

    // Avoid counting duplicate admin/webhook payment rows referring to the same transaction
    if (keyCandidates.some((k) => seenKeys.has(k))) {
      continue;
    }
    keyCandidates.forEach((k) => seenKeys.add(k));

    unified.push({
      ...ap,
      status: effectiveStatus,
      rawStatus: linked?.status || ap.status,
      paymentId: ap.paymentId || linked?.paymentId,
      internalOrderId: ap.internalOrderId || linked?.internalOrderId,
      razorpayOrderId: ap.razorpayOrderId || linked?.razorpayOrderId,
      razorpayPaymentId: ap.razorpayPaymentId || linked?.razorpayPaymentId,
      paymentMethod: ap.paymentMethod || linked?.paymentMethod || linked?.preferredMethod,
      purpose: ap.purpose || linked?.purpose,
      mode: linked?.mode || 'TEST',
      signatureVerified: Boolean(ap.signatureVerified ?? linked?.signatureVerified),
      webhookVerified: Boolean(ap.webhookVerified ?? linked?.webhookVerified),
      failureReason: ap.failureReason || linked?.failureReason,
      verifiedAt: linked?.verifiedAt || ap.createdAt
    });
  }

  // Include any verified or pending PaymentModel records not yet mirrored into AdminPaymentModel
  const orphanGatewayPayments = (gatewayPayments as any[]).filter((gp) => {
    const keys = [gp.paymentId, gp.razorpayOrderId, gp.internalOrderId, gp.razorpayPaymentId].filter(Boolean);
    return !keys.some((k) => seenKeys.has(String(k)));
  });

  if (orphanGatewayPayments.length > 0) {
    const userIds = orphanGatewayPayments.map((g) => g.userId).filter(Boolean);
    const memberLookupIds = Array.from(
      new Set([
        ...userIds.map((id) => String(id)),
        ...orphanGatewayPayments.map((g) => g.memberId).filter(Boolean).map((id) => String(id))
      ])
    );
    const [users, members] = await Promise.all([
      userIds.length
        ? UserModel.find({ _id: { $in: userIds } })
          .select('fullName email phoneNumber primaryCategoryName')
          .lean()
        : [],
      memberLookupIds.length
        ? MemberModel.find({
          _id: { $in: memberLookupIds },
          $nor: [{ kycStatus: 'NOT_SUBMITTED', paymentStatus: 'PENDING' }]
        })
          .select('name email phone primaryCategoryName')
          .lean()
        : []
    ]);
    const userMap = new Map((users as any[]).map((u) => [u._id.toString(), u]));
    const memberMap = new Map((members as any[]).map((m) => [m._id.toString(), m]));

    for (const gp of orphanGatewayPayments) {
      const normalizedStatus = normalizeStoredStatusForAdmin(gp.status);
      const m =
        (gp.memberId ? memberMap.get(gp.memberId.toString()) : null) ||
        (gp.userId ? memberMap.get(gp.userId.toString()) : null);
      // Do not surface unpaid/cancelled/initiated registration orders in Admin until payment succeeds & KYC is submitted
      if (!m && normalizedStatus !== 'SUCCESS') continue;

      const gpKeys = [gp.paymentId, gp.razorpayOrderId, gp.internalOrderId, gp.razorpayPaymentId]
        .filter(Boolean)
        .map((k) => String(k));
      if (gpKeys.some((k) => seenKeys.has(k))) continue;
      gpKeys.forEach((k) => seenKeys.add(k));

      const u = gp.userId ? userMap.get(gp.userId.toString()) : null;
      const resolvedMember = m || (u ? { _id: u._id, name: u.fullName, email: u.email, phone: u.phoneNumber, primaryCategoryName: u.primaryCategoryName } : null);

      unified.push({
        _id: gp._id,
        paymentId: gp.paymentId,
        internalOrderId: gp.internalOrderId,
        memberId: resolvedMember,
        amount: gp.amount,
        currency: gp.currency || 'INR',
        paymentType:
          gp.purpose === 'MEMBERSHIP_RENEWAL' || gp.purpose === 'ANNUAL_RENEWAL'
            ? 'ANNUAL_RENEWAL'
            : gp.purpose === 'WALLET_TOPUP'
              ? 'WALLET_TOPUP'
              : gp.purpose === 'SERVICE_ORDER'
                ? 'SERVICE_ORDER'
                : 'INTRO_FEE',
        purpose: gp.purpose,
        status: normalizeStoredStatusForAdmin(gp.status),
        rawStatus: gp.status,
        gatewayProvider: gp.provider || 'RAZORPAY',
        gatewayTransactionId: gp.razorpayPaymentId || gp.transactionReference || gp.razorpayOrderId || gp.internalOrderId,
        razorpayOrderId: gp.razorpayOrderId,
        razorpayPaymentId: gp.razorpayPaymentId,
        paymentMethod: gp.paymentMethod || gp.preferredMethod,
        signatureVerified: Boolean(gp.signatureVerified),
        webhookVerified: Boolean(gp.webhookVerified),
        failureReason: gp.failureReason,
        mode: gp.mode || 'TEST',
        verifiedAt: gp.verifiedAt || gp.createdAt,
        createdAt: gp.createdAt,
        updatedAt: gp.updatedAt
      });
    }
  }

  unified.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return unified;
}

// GET /api/admin/payments - List transaction history with accurate status filtering, search & pagination
router.get('/', authenticateAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search, purpose, paginated } = req.query;
    const rawPage = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const rawLimit = Math.min(200, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));

    let records = await collectUnifiedPayments();

    if (purpose && String(purpose).trim().toUpperCase() !== 'ALL') {
      const purposeFilter = String(purpose).trim().toUpperCase();
      records = records.filter(
        (p) =>
          String(p.purpose || '').trim().toUpperCase() === purposeFilter ||
          String(p.paymentType || '').trim().toUpperCase() === purposeFilter
      );
    }

    const searchTerm = typeof search === 'string' ? search.trim().toLowerCase() : '';
    if (searchTerm) {
      records = records.filter((p: any) => {
        const nameMatch = p.memberId?.name?.toLowerCase().includes(searchTerm);
        const emailMatch = p.memberId?.email?.toLowerCase().includes(searchTerm);
        const phoneMatch = p.memberId?.phone?.toLowerCase().includes(searchTerm);
        const txnMatch = p.gatewayTransactionId?.toLowerCase().includes(searchTerm);
        const rzpPayMatch = p.razorpayPaymentId?.toLowerCase().includes(searchTerm);
        const rzpOrdMatch = p.razorpayOrderId?.toLowerCase().includes(searchTerm);
        const internalMatch = p.internalOrderId?.toLowerCase().includes(searchTerm);
        const payIdMatch = p.paymentId?.toLowerCase().includes(searchTerm);
        return Boolean(
          nameMatch ||
          emailMatch ||
          phoneMatch ||
          txnMatch ||
          rzpPayMatch ||
          rzpOrdMatch ||
          internalMatch ||
          payIdMatch
        );
      });
    }

    const statusCounts: Record<string, number> = {
      ALL: records.length,
      SUCCESS: 0,
      PENDING: 0,
      FAILED: 0,
      CANCELLED: 0,
      REFUNDED: 0
    };
    for (const r of records) {
      const st = normalizeStoredStatusForAdmin(r.rawStatus || r.status);
      if (st === 'SUCCESS') statusCounts.SUCCESS += 1;
      else if (st === 'PENDING') statusCounts.PENDING += 1;
      else if (st === 'FAILED') statusCounts.FAILED += 1;
      else if (st === 'CANCELLED') statusCounts.CANCELLED += 1;
      else if (st === 'REFUNDED') statusCounts.REFUNDED += 1;
    }

    const allowedStatuses = resolveStatusFilterSet(status);
    if (allowedStatuses) {
      records = records.filter((p) => {
        const normalized = normalizeStoredStatusForAdmin(p.rawStatus || p.status);
        const rawUpper = String(p.rawStatus || p.status || '').trim().toUpperCase();
        return allowedStatuses.includes(normalized) || allowedStatuses.includes(rawUpper);
      });
    }

    if (String(paginated || '').toLowerCase() === 'true') {
      const total = records.length;
      const totalPages = Math.max(1, Math.ceil(total / rawLimit));
      const safePage = Math.min(rawPage, totalPages);
      const startIndex = (safePage - 1) * rawLimit;
      const items = records.slice(startIndex, startIndex + rawLimit);

      res.json({
        success: true,
        data: {
          items,
          pagination: {
            page: safePage,
            limit: rawLimit,
            total,
            totalPages,
            hasNextPage: safePage < totalPages,
            hasPrevPage: safePage > 1
          },
          statusCounts
        }
      });
      return;
    }

    res.json({ success: true, data: records.slice(0, 200) });
  } catch (err: any) {
    next(err);
  }
});

// GET /api/admin/payments/:id/receipt - Fetch authoritative receipt data for a payment record
router.get('/:id/receipt', authenticateAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = decodeURIComponent(String(req.params.id || '')).trim();
    if (!rawId) {
      throw new AppError('Payment receipt identifier is required.', 400, 'INVALID_PAYMENT_ID');
    }

    const orClauses: Record<string, any>[] = [
      { paymentId: rawId },
      { internalOrderId: rawId },
      { razorpayOrderId: rawId },
      { razorpayPaymentId: rawId },
      { gatewayTransactionId: rawId }
    ];
    if (mongoose.isValidObjectId(rawId)) {
      orClauses.push({ _id: new mongoose.Types.ObjectId(rawId) });
    }

    const adminPayment: any = await AdminPaymentModel.findOne({ $or: orClauses })
      .populate('memberId', 'name email phone primaryCategoryName address membershipPlan')
      .lean();

    const gatewayOrClauses: Record<string, any>[] = [
      { paymentId: rawId },
      { internalOrderId: rawId },
      { razorpayOrderId: rawId },
      { razorpayPaymentId: rawId },
      { orderId: rawId },
      { transactionReference: rawId }
    ];
    if (adminPayment?.paymentId) gatewayOrClauses.push({ paymentId: adminPayment.paymentId });
    if (adminPayment?.razorpayOrderId) gatewayOrClauses.push({ razorpayOrderId: adminPayment.razorpayOrderId });
    if (mongoose.isValidObjectId(rawId)) {
      gatewayOrClauses.push({ _id: new mongoose.Types.ObjectId(rawId) });
    }

    const gatewayPayment: any = await PaymentModel.findOne({ $or: gatewayOrClauses })
      .select('-razorpaySignature -webhookEventIds')
      .lean();

    if (!adminPayment && !gatewayPayment) {
      throw new AppError(
        `No payment receipt found for identifier "${rawId}". Please check the transaction reference and retry.`,
        404,
        'PAYMENT_RECEIPT_NOT_FOUND'
      );
    }

    // Resolve complete member/user info for receipt header
    let memberProfile: any = adminPayment?.memberId || null;
    let userProfile: any = null;
    const lookupUserId = gatewayPayment?.userId || memberProfile?._id;
    if (lookupUserId) {
      userProfile = await UserModel.findById(lookupUserId)
        .select('fullName email phoneNumber primaryCategoryName subCategory address')
        .lean();
    }
    if (!memberProfile && userProfile) {
      memberProfile = await MemberModel.findOne({
        $or: [{ _id: userProfile._id }, { email: userProfile.email.toLowerCase() }]
      })
        .select('name email phone primaryCategoryName membershipPlan')
        .lean();
    }

    const effectiveStatus = normalizeStoredStatusForAdmin(gatewayPayment?.status || adminPayment?.status);
    const amount = Number(gatewayPayment?.amount ?? adminPayment?.amount ?? 0);
    const currency = gatewayPayment?.currency || adminPayment?.currency || 'INR';
    const purpose = gatewayPayment?.purpose || adminPayment?.purpose;
    const paymentType = adminPayment?.paymentType || purpose;
    const transactionReference =
      gatewayPayment?.razorpayPaymentId ||
      adminPayment?.razorpayPaymentId ||
      adminPayment?.gatewayTransactionId ||
      gatewayPayment?.transactionReference ||
      gatewayPayment?.razorpayOrderId ||
      adminPayment?.internalOrderId ||
      rawId;

    const receiptSeed = (gatewayPayment?.paymentId || adminPayment?.paymentId || String(adminPayment?._id || gatewayPayment?._id))
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(-8)
      .toUpperCase();

    const issuedDate = gatewayPayment?.verifiedAt || adminPayment?.createdAt || gatewayPayment?.createdAt || new Date();

    res.json({
      success: true,
      data: {
        receiptNumber: `FIC-RCPT-${receiptSeed}`,
        recordId: String(adminPayment?._id || gatewayPayment?._id),
        paymentId: gatewayPayment?.paymentId || adminPayment?.paymentId || null,
        internalOrderId: gatewayPayment?.internalOrderId || adminPayment?.internalOrderId || null,
        razorpayOrderId: gatewayPayment?.razorpayOrderId || adminPayment?.razorpayOrderId || null,
        razorpayPaymentId: gatewayPayment?.razorpayPaymentId || adminPayment?.razorpayPaymentId || null,
        transactionReference,
        gatewayProvider: adminPayment?.gatewayProvider || gatewayPayment?.provider || 'RAZORPAY',
        paymentMethod:
          gatewayPayment?.paymentMethod ||
          adminPayment?.paymentMethod ||
          gatewayPayment?.preferredMethod ||
          adminPayment?.gatewayProvider ||
          'RAZORPAY',
        mode: gatewayPayment?.mode || 'TEST',
        status: effectiveStatus,
        rawStatus: gatewayPayment?.status || adminPayment?.status,
        amount,
        currency,
        purpose: purpose || paymentType,
        paymentType,
        description: getPurposeDescription(purpose, paymentType),
        signatureVerified: Boolean(adminPayment?.signatureVerified ?? gatewayPayment?.signatureVerified),
        webhookVerified: Boolean(adminPayment?.webhookVerified ?? gatewayPayment?.webhookVerified),
        failureReason: gatewayPayment?.failureReason || adminPayment?.failureReason || null,
        transactionDate: issuedDate,
        createdAt: adminPayment?.createdAt || gatewayPayment?.createdAt,
        member: {
          id: String(memberProfile?._id || userProfile?._id || ''),
          name: memberProfile?.name || userProfile?.fullName || 'FIC Member',
          email: memberProfile?.email || userProfile?.email || '—',
          phone: memberProfile?.phone || userProfile?.phoneNumber || '—',
          category: memberProfile?.primaryCategoryName || userProfile?.primaryCategoryName || 'General Business',
          subCategory: userProfile?.subCategory || '',
          address: userProfile?.address || memberProfile?.address || null
        },
        issuer: {
          organizationName: 'Forge India Connect — FIC Business Hub',
          supportEmail: 'support@ficbusinesshub.in'
        }
      }
    });
  } catch (err) {
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
