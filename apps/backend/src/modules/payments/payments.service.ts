import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  MembershipStatus,
  PaymentType,
  WalletStatus,
  WalletTransactionStatus,
  WalletTransactionType
} from '@fic/shared-types';
import { AppError } from '../../common/errors/app-error';
import { paymentProvider } from '../../integrations/payment-provider';
import { UserModel } from '../users/users.model';
import { MembershipModel } from '../membership/membership.model';
import { ServiceListingModel } from '../services/services.model';
import {
  MemberWalletModel,
  WalletFundingModel,
  WalletTransactionModel
} from '../wallet/wallet.model';
import { MemberModel } from '../admin/models/Member';
import { AdminPaymentModel } from '../admin/models/Payment';
import { KycSubmissionModel as AdminKycSubmissionModel } from '../admin/models/KycSubmission';
import { AdminMemberWalletModel } from '../admin/models/MemberWallet';
import { IPaymentDocument, PaymentModel, PaymentPurpose } from './payments.model';

export const AUTHORITATIVE_PRICING = {
  MEMBERSHIP_FIRST_YEAR: 99,
  MEMBERSHIP_RENEWAL: 5999,
  WALLET_TOPUP_MIN: 100,
  WALLET_TOPUP_MAX: 200000
} as const;

export type CanonicalPaymentPurpose =
  | 'MEMBERSHIP_FIRST_YEAR'
  | 'MEMBERSHIP_RENEWAL'
  | 'WALLET_TOPUP'
  | 'SERVICE_ORDER';

export function normalizePaymentPurpose(rawPurpose?: string): CanonicalPaymentPurpose {
  const normalized = (rawPurpose || '').trim().toUpperCase();
  if (
    normalized === 'MEMBERSHIP_FIRST_YEAR' ||
    normalized === 'FIRST_YEAR_MEMBERSHIP' ||
    normalized === 'FIRST_YEAR_INTRO' ||
    normalized === 'INTRO_FEE'
  ) {
    return 'MEMBERSHIP_FIRST_YEAR';
  }
  if (
    normalized === 'MEMBERSHIP_RENEWAL' ||
    normalized === 'ANNUAL_RENEWAL' ||
    normalized === 'STANDARD_ANNUAL'
  ) {
    return 'MEMBERSHIP_RENEWAL';
  }
  if (normalized === 'WALLET_TOPUP' || normalized === 'WALLET_FUNDING' || normalized === 'ADD_FUNDS') {
    return 'WALLET_TOPUP';
  }
  if (normalized === 'SERVICE_ORDER') {
    return 'SERVICE_ORDER';
  }
  throw new AppError(
    `Unsupported payment purpose "${rawPurpose}". Allowed: MEMBERSHIP_FIRST_YEAR, MEMBERSHIP_RENEWAL, WALLET_TOPUP, SERVICE_ORDER.`,
    400,
    'INVALID_PAYMENT_PURPOSE'
  );
}

function mapPurposeToAdminType(purpose: string): PaymentType {
  const canonical = normalizePaymentPurpose(purpose);
  if (canonical === 'MEMBERSHIP_FIRST_YEAR') return 'INTRO_FEE';
  if (canonical === 'MEMBERSHIP_RENEWAL') return 'ANNUAL_RENEWAL';
  if (canonical === 'WALLET_TOPUP') return 'WALLET_TOPUP';
  return 'SERVICE_ORDER';
}

export async function calculateAuthoritativeAmount(params: {
  purpose: CanonicalPaymentPurpose;
  requestedAmount?: unknown;
  serviceId?: string;
}): Promise<{ amountInr: number; amountInPaise: number; description: string; extraDetails: Record<string, any> }> {
  const { purpose, requestedAmount, serviceId } = params;

  if (purpose === 'MEMBERSHIP_FIRST_YEAR') {
    return {
      amountInr: AUTHORITATIVE_PRICING.MEMBERSHIP_FIRST_YEAR,
      amountInPaise: AUTHORITATIVE_PRICING.MEMBERSHIP_FIRST_YEAR * 100,
      description: 'FIC Business Hub - First-Year Introductory Membership Fee',
      extraDetails: { planType: 'FIRST_YEAR_INTRO' }
    };
  }

  if (purpose === 'MEMBERSHIP_RENEWAL') {
    return {
      amountInr: AUTHORITATIVE_PRICING.MEMBERSHIP_RENEWAL,
      amountInPaise: AUTHORITATIVE_PRICING.MEMBERSHIP_RENEWAL * 100,
      description: 'FIC Business Hub - Annual Membership Renewal',
      extraDetails: { planType: 'ANNUAL_RENEWAL' }
    };
  }

  if (purpose === 'WALLET_TOPUP') {
    const num = Number(requestedAmount);
    if (!Number.isFinite(num) || num < AUTHORITATIVE_PRICING.WALLET_TOPUP_MIN || num > AUTHORITATIVE_PRICING.WALLET_TOPUP_MAX) {
      throw new AppError(
        `Wallet top-up amount must be between INR ${AUTHORITATIVE_PRICING.WALLET_TOPUP_MIN} and INR ${AUTHORITATIVE_PRICING.WALLET_TOPUP_MAX}.`,
        400,
        'INVALID_TOPUP_AMOUNT'
      );
    }
    const amountInPaise = Math.round(num * 100);
    const amountInr = amountInPaise / 100;
    return {
      amountInr,
      amountInPaise,
      description: `FIC Wallet Top-Up (INR ${amountInr})`,
      extraDetails: { topUpAmount: amountInr }
    };
  }

  // SERVICE_ORDER — compute strictly from DB ServiceListing
  if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
    throw new AppError('Valid serviceId is required for SERVICE_ORDER payments.', 400, 'SERVICE_ID_REQUIRED');
  }
  const service = await ServiceListingModel.findById(serviceId).lean();
  if (!service || !service.isActive) {
    throw new AppError('Selected service is unavailable.', 404, 'SERVICE_NOT_FOUND');
  }
  if (!service.price || service.price <= 0) {
    throw new AppError('Selected service does not have a fixed payable price.', 400, 'INVALID_SERVICE_PRICE');
  }
  const amountInPaise = Math.round(service.price * 100);
  const amountInr = amountInPaise / 100;
  return {
    amountInr,
    amountInPaise,
    description: `Service Order: ${service.title}`,
    extraDetails: { serviceId: service._id.toString(), serviceTitle: service.title }
  };
}

async function resolveMemberForUser(user: { _id: any; email: string }): Promise<any | null> {
  return MemberModel.findOne({
    $or: [{ _id: user._id }, { email: user.email.toLowerCase() }]
  });
}

export async function syncAdminPaymentRecord(
  payment: IPaymentDocument,
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
): Promise<void> {
  let memberId = payment.memberId;
  if (!memberId) {
    const user = await UserModel.findById(payment.userId).select('email').lean<{ email?: string }>();
    if (user?.email) {
      const member = await MemberModel.findOne({ email: user.email.toLowerCase() }).select('_id').lean<{ _id?: any }>();
      if (member?._id) {
        memberId = member._id as mongoose.Types.ObjectId;
      }
    }
  }
  if (!memberId) return;

  const gatewayTxnId =
    payment.razorpayPaymentId ||
    payment.transactionReference ||
    payment.razorpayOrderId ||
    payment.internalOrderId;

  await AdminPaymentModel.findOneAndUpdate(
    {
      $or: [
        { paymentId: payment.paymentId },
        ...(payment.razorpayOrderId ? [{ razorpayOrderId: payment.razorpayOrderId }] : []),
        { gatewayTransactionId: gatewayTxnId }
      ]
    },
    {
      $set: {
        paymentId: payment.paymentId,
        internalOrderId: payment.internalOrderId,
        memberId,
        amount: payment.amount,
        currency: payment.currency || 'INR',
        paymentType: mapPurposeToAdminType(payment.purpose),
        purpose: payment.purpose,
        status,
        gatewayProvider: 'RAZORPAY',
        gatewayTransactionId: gatewayTxnId,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        paymentMethod: payment.paymentMethod || payment.preferredMethod,
        signatureVerified: payment.signatureVerified,
        webhookVerified: payment.webhookVerified,
        failureReason: payment.failureReason
      }
    },
    { upsert: true, new: true }
  );
}

export interface RazorpayEnabledMethods {
  upi: boolean;
  card: boolean;
  netbanking: boolean;
  wallet: boolean;
}

export interface RazorpayGatewayMethods extends RazorpayEnabledMethods {
  upiIntent: boolean;
}

const checkoutMethodsCache = new Map<
  string,
  { methods: RazorpayEnabledMethods; gatewayMethods: RazorpayGatewayMethods; expiresAt: number }
>();

export async function getRazorpayCheckoutConfig(): Promise<{
  keyId: string;
  mode: 'TEST' | 'LIVE';
  methods: RazorpayEnabledMethods;
  gatewayMethods: RazorpayGatewayMethods;
}> {
  const { keyId, mode } = paymentProvider.assertConfigured();
  const cached = checkoutMethodsCache.get(keyId);
  if (cached && cached.expiresAt > Date.now()) {
    return { keyId, mode, methods: cached.methods, gatewayMethods: cached.gatewayMethods };
  }

  let gatewayMethods: RazorpayGatewayMethods = {
    upi: mode === 'TEST',
    upiIntent: mode === 'TEST',
    card: true,
    netbanking: true,
    wallet: true
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const resp = await fetch(
      `https://api.razorpay.com/v1/methods?key_id=${encodeURIComponent(keyId)}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (resp.ok) {
      const data: any = await resp.json().catch(() => null);
      if (data && typeof data === 'object') {
        const hasNetbanking =
          Boolean(data.netbanking) &&
          (typeof data.netbanking !== 'object' || Object.keys(data.netbanking).length > 0);
        const hasWallet =
          Boolean(data.wallet) &&
          (typeof data.wallet !== 'object' || Object.values(data.wallet).some(Boolean));
        gatewayMethods = {
          upi: Boolean(data.upi),
          upiIntent: Boolean(data.upi_intent),
          card: Boolean(data.card),
          netbanking: hasNetbanking,
          wallet: hasWallet
        };
      }
    }
  } catch {
    // Keep safe defaults if Razorpay methods probe times out
  }

  // In TEST mode, allow UPI/QR and Cards in UI even if merchant test key lacks UPI Collect activation
  const methods: RazorpayEnabledMethods = {
    upi: mode === 'TEST' ? true : gatewayMethods.upi,
    card: mode === 'TEST' ? true : gatewayMethods.card,
    netbanking: gatewayMethods.netbanking,
    wallet: gatewayMethods.wallet
  };

  checkoutMethodsCache.set(keyId, {
    methods,
    gatewayMethods,
    expiresAt: Date.now() + 5 * 60 * 1000
  });
  return { keyId, mode, methods, gatewayMethods };
}

export async function createRazorpayOrderForUser(params: {
  userId: string;
  purpose: string;
  amount?: unknown;
  serviceId?: string;
  preferredMethod?: string;
  notes?: Record<string, string>;
}): Promise<{
  paymentId: string;
  internalOrderId: string;
  razorpayOrderId: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  keyId: string;
  mode: 'TEST' | 'LIVE';
  purpose: CanonicalPaymentPurpose;
  description: string;
  enabledMethods: RazorpayEnabledMethods;
  gatewayMethods: RazorpayGatewayMethods;
  prefill: { name: string; email: string; contact: string };
}> {
  if ((params.preferredMethod || '').trim().toUpperCase() === 'COD') {
    throw new AppError(
      'Cash on Delivery is not supported. Complete payment online using Razorpay.',
      400,
      'COD_NOT_SUPPORTED'
    );
  }

  const user = await UserModel.findById(params.userId);
  if (!user) {
    throw new AppError('User account not found.', 404, 'USER_NOT_FOUND');
  }

  const checkoutConfig = await getRazorpayCheckoutConfig();
  const { keyId, mode, methods: enabledMethods, gatewayMethods } = checkoutConfig;
  const canonicalPurpose = normalizePaymentPurpose(params.purpose);
  const { amountInr, amountInPaise, description, extraDetails } = await calculateAuthoritativeAmount({
    purpose: canonicalPurpose,
    requestedAmount: params.amount,
    serviceId: params.serviceId
  });

  const member = await resolveMemberForUser(user);
  const paymentId = `PAY-${crypto.randomUUID()}`;
  const internalOrderId = `FIC_ORD_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const rzpOrder = await paymentProvider.createOrder({
    amountInPaise,
    currency: 'INR',
    receipt: internalOrderId,
    notes: {
      paymentId,
      internalOrderId,
      userId: user._id.toString(),
      purpose: canonicalPurpose,
      ...(params.notes || {})
    }
  });

  const payment = await PaymentModel.create({
    paymentId,
    userId: user._id,
    ...(member?._id ? { memberId: member._id } : {}),
    orderId: internalOrderId,
    internalOrderId,
    razorpayOrderId: rzpOrder.id,
    amount: amountInr,
    amountInPaise,
    currency: 'INR',
    status: 'INITIATED',
    preferredMethod: params.preferredMethod?.trim().toLowerCase() || undefined,
    purpose: canonicalPurpose as PaymentPurpose,
    provider: 'RAZORPAY',
    mode,
    signatureVerified: false,
    webhookVerified: false,
    fulfilled: false,
    paymentDetails: {
      description,
      customerName: user.fullName,
      customerEmail: user.email,
      ...extraDetails
    }
  });

  await syncAdminPaymentRecord(payment, 'PENDING');

  return {
    paymentId,
    internalOrderId,
    razorpayOrderId: rzpOrder.id,
    amount: amountInr,
    amountInPaise,
    currency: 'INR',
    keyId,
    mode,
    purpose: canonicalPurpose,
    description,
    enabledMethods,
    gatewayMethods,
    prefill: {
      name: user.fullName || '',
      email: user.email || '',
      contact: (user.phoneNumber || '').replace(/[^0-9+]/g, '')
    }
  };
}

async function applyBusinessFulfillment(payment: IPaymentDocument): Promise<Record<string, any>> {
  const user = await UserModel.findById(payment.userId);
  if (!user) {
    return { warning: 'Owner user not found during fulfillment' };
  }

  const canonicalPurpose = normalizePaymentPurpose(payment.purpose);
  const member = await resolveMemberForUser(user);

  if (canonicalPurpose === 'MEMBERSHIP_FIRST_YEAR' || canonicalPurpose === 'MEMBERSHIP_RENEWAL') {
    const planType = canonicalPurpose === 'MEMBERSHIP_RENEWAL' ? 'ANNUAL_RENEWAL' : 'FIRST_YEAR_INTRO';
    const existingMembership = await MembershipModel.findOne({ userId: user._id }).sort({ endDate: -1 });
    const now = new Date();
    const baseStart =
      canonicalPurpose === 'MEMBERSHIP_RENEWAL' && existingMembership?.endDate && existingMembership.endDate > now
        ? new Date(existingMembership.endDate)
        : now;
    const endDate = new Date(baseStart);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const membership = await MembershipModel.create({
      userId: user._id,
      status: MembershipStatus.ACTIVE,
      planType,
      amount: payment.amount,
      startDate: now,
      endDate,
      paymentId: payment._id as mongoose.Types.ObjectId
    });

    await UserModel.updateOne(
      { _id: user._id },
      { $set: { isMembershipActive: true, activeMembershipId: membership._id } }
    );

    if (member) {
      await MemberModel.updateOne(
        { _id: member._id },
        {
          $set: {
            paymentStatus: 'PAID',
            membershipPlan: canonicalPurpose === 'MEMBERSHIP_RENEWAL' ? 'STANDARD_ANNUAL' : 'FIRST_YEAR_INTRO',
            membershipFeePaid: payment.amount,
            membershipExpiresAt: endDate
          }
        }
      );

      await AdminKycSubmissionModel.updateMany(
        { memberId: member._id },
        {
          $set: {
            paymentDetails: {
              amount: payment.amount,
              planName: canonicalPurpose === 'MEMBERSHIP_RENEWAL' ? 'Annual Renewal' : 'First-Year Membership',
              transactionId: payment.razorpayPaymentId || payment.transactionId || payment.paymentId,
              razorpayOrderId: payment.razorpayOrderId,
              paymentMethod: payment.paymentMethod || 'RAZORPAY',
              paidAt: payment.verifiedAt || new Date()
            }
          }
        }
      );
    }

    return {
      membershipActivated: true,
      membershipId: membership._id.toString(),
      planType,
      validUntil: endDate
    };
  }

  if (canonicalPurpose === 'WALLET_TOPUP') {
    let wallet = await MemberWalletModel.findOne({ userId: user._id });
    if (!wallet) {
      wallet = await MemberWalletModel.create({
        userId: user._id,
        currency: 'INR',
        status: WalletStatus.ACTIVE
      });
    }

    const updatedWallet = await MemberWalletModel.findByIdAndUpdate(
      wallet._id,
      {
        $inc: {
          totalBalance: payment.amount,
          availableBalance: payment.amount,
          membershipEligibleBalance: payment.amount,
          totalAdded: payment.amount
        }
      },
      { new: true }
    );

    const balanceAfter = updatedWallet?.totalBalance ?? wallet.totalBalance + payment.amount;
    const reference = payment.razorpayPaymentId || payment.paymentId;

    await WalletTransactionModel.create({
      transactionId: `TXN-${crypto.randomUUID()}`,
      walletId: wallet._id,
      userId: user._id,
      transactionType: WalletTransactionType.ADD_FUNDS,
      direction: 'CREDIT',
      amount: payment.amount,
      currency: 'INR',
      description: `Razorpay Wallet Top-Up (${payment.razorpayPaymentId || payment.internalOrderId})`,
      status: WalletTransactionStatus.COMPLETED,
      idempotencyKey: `rzp_topup_${reference}`,
      balanceAfter,
      sourceReferenceId: reference
    });

    await WalletFundingModel.create({
      fundingId: `FND-${crypto.randomUUID()}`,
      userId: user._id,
      walletId: wallet._id,
      amount: payment.amount,
      currency: 'INR',
      paymentProvider: 'RAZORPAY',
      paymentOrderId: payment.razorpayOrderId || payment.internalOrderId,
      gatewayTransactionId: reference,
      paymentStatus: 'SUCCESS',
      settlementStatus: 'SETTLED'
    });

    // Mirror into AdminMemberWalletModel if member exists
    if (member) {
      await AdminMemberWalletModel.findOneAndUpdate(
        { memberId: member._id },
        {
          $setOnInsert: {
            memberId: member._id,
            memberEmail: user.email.toLowerCase(),
            currency: 'INR',
            currencySymbol: '₹',
            status: 'ACTIVE'
          },
          $set: {
            balance: balanceAfter,
            lastSyncedAt: new Date()
          },
          $push: {
            transactions: {
              id: `TXN-${Date.now()}`,
              type: 'CREDIT',
              title: 'Razorpay Wallet Top-Up',
              category: 'WALLET_TOPUP',
              amount: payment.amount,
              currency: 'INR',
              status: 'SUCCESS',
              reference,
              date: new Date().toISOString(),
              description: `Added via Razorpay (${payment.paymentMethod || 'online'})`
            }
          }
        },
        { upsert: true }
      );
    }

    return {
      walletCredited: true,
      newBalance: balanceAfter
    };
  }

  return { serviceOrderPaid: true };
}

export async function fulfillVerifiedPayment(params: {
  payment: IPaymentDocument;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  paymentMethod?: string;
  fromWebhook: boolean;
}): Promise<{ payment: IPaymentDocument; alreadyFulfilled: boolean; fulfillmentDetails: Record<string, any> }> {
  const { payment, razorpayPaymentId, razorpaySignature, paymentMethod, fromWebhook } = params;

  const setFields: Record<string, any> = {
    fulfilled: true,
    status: 'SUCCESS',
    razorpayPaymentId,
    transactionId: razorpayPaymentId,
    transactionReference: razorpayPaymentId,
    verifiedAt: payment.verifiedAt || new Date(),
    failureReason: undefined
  };

  if (razorpaySignature) setFields.razorpaySignature = razorpaySignature;
  if (paymentMethod) setFields.paymentMethod = paymentMethod.toUpperCase();
  if (fromWebhook) {
    setFields.webhookVerified = true;
  } else {
    setFields.signatureVerified = true;
  }

  // Atomic check-and-set to guarantee zero duplicate credits if checkout /verify and /webhook arrive concurrently
  const lockedPayment = await PaymentModel.findOneAndUpdate(
    { _id: payment._id, fulfilled: { $ne: true } },
    { $set: setFields },
    { new: true }
  );

  if (!lockedPayment) {
    // Already fulfilled cleanly; update verification flags non-destructively
    const existing = await PaymentModel.findByIdAndUpdate(
      payment._id,
      {
        $set: {
          ...(fromWebhook ? { webhookVerified: true } : { signatureVerified: true }),
          ...(paymentMethod && !payment.paymentMethod ? { paymentMethod: paymentMethod.toUpperCase() } : {})
        }
      },
      { new: true }
    );
    await syncAdminPaymentRecord(existing || payment, 'SUCCESS');
    return {
      payment: existing || payment,
      alreadyFulfilled: true,
      fulfillmentDetails: { idempotentReplay: true }
    };
  }

  let fulfillmentDetails: Record<string, any>;
  try {
    fulfillmentDetails = await applyBusinessFulfillment(lockedPayment);
  } catch (err) {
    await PaymentModel.updateOne(
      { _id: lockedPayment._id },
      { $set: { fulfilled: false } }
    );
    throw err;
  }
  await syncAdminPaymentRecord(lockedPayment, 'SUCCESS');

  return {
    payment: lockedPayment,
    alreadyFulfilled: false,
    fulfillmentDetails
  };
}

export async function verifyCheckoutPaymentForUser(params: {
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentMethod?: string;
}): Promise<{ payment: IPaymentDocument; alreadyFulfilled: boolean; fulfillmentDetails: Record<string, any> }> {
  const payment = await PaymentModel.findOne({ razorpayOrderId: params.razorpayOrderId });
  if (!payment) {
    throw new AppError('Payment order not found for verification.', 404, 'PAYMENT_ORDER_NOT_FOUND');
  }

  if (payment.userId.toString() !== params.userId.toString()) {
    throw new AppError('Forbidden. You cannot verify another user’s payment order.', 403, 'FORBIDDEN');
  }

  const isValid = paymentProvider.verifyCheckoutSignature({
    razorpayOrderId: params.razorpayOrderId,
    razorpayPaymentId: params.razorpayPaymentId,
    razorpaySignature: params.razorpaySignature
  });

  if (!isValid) {
    if (!payment.fulfilled) {
      payment.status = 'FAILED';
      payment.failureReason = 'Razorpay HMAC-SHA256 signature verification failed';
      await payment.save();
      await syncAdminPaymentRecord(payment, 'FAILED');
    }
    throw new AppError(
      'Payment signature verification failed. Transaction was not confirmed.',
      400,
      'INVALID_PAYMENT_SIGNATURE'
    );
  }

  // Enrich gateway payment method from Razorpay API if reachable (best-effort)
  let resolvedMethod = params.paymentMethod || payment.preferredMethod;
  const rzpDetails = await paymentProvider.fetchPayment(params.razorpayPaymentId);
  if (rzpDetails?.method) {
    resolvedMethod = String(rzpDetails.method).toUpperCase();
  }

  return fulfillVerifiedPayment({
    payment,
    razorpayPaymentId: params.razorpayPaymentId,
    razorpaySignature: params.razorpaySignature,
    paymentMethod: resolvedMethod,
    fromWebhook: false
  });
}

export async function completeTestModeCheckoutForUser(params: {
  userId: string;
  razorpayOrderId: string;
  method: 'UPI' | 'CARD';
  vpa?: string;
  outcome?: 'success' | 'failure';
}): Promise<{ payment: IPaymentDocument; alreadyFulfilled: boolean; fulfillmentDetails: Record<string, any> }> {
  const { keyId, keySecret, mode } = paymentProvider.assertConfigured();
  if (mode !== 'TEST' || !keyId.startsWith('rzp_test_')) {
    throw new AppError(
      'Test Mode checkout completion is strictly disabled outside Razorpay Test Mode.',
      403,
      'TEST_MODE_ONLY'
    );
  }

  const payment = await PaymentModel.findOne({ razorpayOrderId: params.razorpayOrderId });
  if (!payment) {
    throw new AppError('Payment order not found for Test Mode completion.', 404, 'PAYMENT_ORDER_NOT_FOUND');
  }

  if (payment.userId.toString() !== params.userId.toString()) {
    throw new AppError('Forbidden. You cannot complete another user’s payment order.', 403, 'FORBIDDEN');
  }

  const normalizedMethod = params.method === 'CARD' ? 'CARD' : 'UPI';
  const cleanVpa = (params.vpa || '').trim().toLowerCase();
  const isFailureRequested =
    params.outcome === 'failure' ||
    (normalizedMethod === 'UPI' && cleanVpa === 'failure@razorpay');

  if (isFailureRequested) {
    const failureReason =
      normalizedMethod === 'UPI'
        ? `UPI authorization declined for VPA "${cleanVpa || 'failure@razorpay'}" in Razorpay Test Mode.`
        : 'Test Card authorization was declined in Razorpay Test Mode.';
    if (!payment.fulfilled) {
      payment.status = 'FAILED';
      payment.failureReason = failureReason;
      await payment.save();
      await syncAdminPaymentRecord(payment, 'FAILED');
    }
    throw new AppError(failureReason, 402, 'TEST_MODE_PAYMENT_DECLINED');
  }

  if (payment.fulfilled && payment.razorpayPaymentId && payment.razorpaySignature) {
    return verifyCheckoutPaymentForUser({
      userId: params.userId,
      razorpayOrderId: params.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      razorpaySignature: payment.razorpaySignature,
      paymentMethod: payment.paymentMethod || normalizedMethod
    });
  }

  const syntheticPaymentId = `pay_test_${crypto.randomBytes(7).toString('hex')}`;
  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${params.razorpayOrderId}|${syntheticPaymentId}`)
    .digest('hex');

  return verifyCheckoutPaymentForUser({
    userId: params.userId,
    razorpayOrderId: params.razorpayOrderId,
    razorpayPaymentId: syntheticPaymentId,
    razorpaySignature: generatedSignature,
    paymentMethod: normalizedMethod
  });
}

export async function recordCheckoutFailureOrCancel(params: {
  userId: string;
  razorpayOrderId?: string;
  paymentId?: string;
  status: 'FAILED' | 'CANCELLED';
  reason?: string;
  razorpayPaymentId?: string;
}): Promise<IPaymentDocument> {
  const filter: Record<string, any> = { userId: params.userId };
  if (params.razorpayOrderId) {
    filter.razorpayOrderId = params.razorpayOrderId;
  } else if (params.paymentId) {
    filter.$or = [{ paymentId: params.paymentId }, { internalOrderId: params.paymentId }];
  } else {
    throw new AppError('razorpayOrderId or paymentId is required.', 400, 'PAYMENT_IDENTIFIER_REQUIRED');
  }

  const payment = await PaymentModel.findOne(filter);
  if (!payment) {
    throw new AppError('Payment record not found.', 404, 'PAYMENT_NOT_FOUND');
  }

  if (payment.fulfilled || payment.status === 'SUCCESS') {
    return payment;
  }

  payment.status = params.status;
  if (params.razorpayPaymentId) {
    payment.razorpayPaymentId = params.razorpayPaymentId;
  }
  payment.failureReason =
    params.reason ||
    (params.status === 'CANCELLED' ? 'Checkout dismissed by user' : 'Payment failed at gateway');
  await payment.save();
  await syncAdminPaymentRecord(payment, params.status === 'CANCELLED' ? 'FAILED' : 'FAILED');
  return payment;
}

export async function processRazorpayWebhookEvent(params: {
  rawBody: Buffer | string;
  signatureHeader: string;
  eventIdHeader?: string;
  payload: any;
}): Promise<{ status: string; paymentId?: string; event?: string }> {
  const valid = paymentProvider.verifyWebhookSignature(params.rawBody, params.signatureHeader);
  if (!valid) {
    throw new AppError('Invalid Razorpay webhook signature.', 401, 'INVALID_WEBHOOK_SIGNATURE');
  }

  const eventName = String(params.payload?.event || '');
  const paymentEntity = params.payload?.payload?.payment?.entity;
  const orderEntity = params.payload?.payload?.order?.entity;

  const razorpayOrderId: string | undefined =
    paymentEntity?.order_id || orderEntity?.id;
  const razorpayPaymentId: string | undefined = paymentEntity?.id;

  if (!razorpayOrderId) {
    return { status: 'ignored_no_order_id', event: eventName };
  }

  const payment = await PaymentModel.findOne({ razorpayOrderId });
  if (!payment) {
    return { status: 'ignored_order_not_tracked', event: eventName };
  }

  const eventKey = params.eventIdHeader || `${eventName}:${razorpayPaymentId || razorpayOrderId}`;
  if (payment.webhookEventIds?.includes(eventKey)) {
    return { status: 'duplicate_event_ignored', paymentId: payment.paymentId, event: eventName };
  }

  await PaymentModel.updateOne(
    { _id: payment._id },
    { $addToSet: { webhookEventIds: eventKey } }
  );

  if (eventName === 'payment.captured' || eventName === 'order.paid') {
    const resolvedMethod = paymentEntity?.method
      ? String(paymentEntity.method).toUpperCase()
      : payment.paymentMethod;
    await fulfillVerifiedPayment({
      payment,
      razorpayPaymentId: razorpayPaymentId || payment.razorpayPaymentId || `rzp_evt_${Date.now()}`,
      paymentMethod: resolvedMethod,
      fromWebhook: true
    });
    return { status: 'processed_captured', paymentId: payment.paymentId, event: eventName };
  }

  if (eventName === 'payment.authorized') {
    if (!payment.fulfilled) {
      await PaymentModel.updateOne(
        { _id: payment._id },
        {
          $set: {
            status: 'AUTHORIZED',
            webhookVerified: true,
            ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
            ...(paymentEntity?.method ? { paymentMethod: String(paymentEntity.method).toUpperCase() } : {})
          }
        }
      );
    }
    return { status: 'processed_authorized', paymentId: payment.paymentId, event: eventName };
  }

  if (eventName === 'payment.failed') {
    if (!payment.fulfilled) {
      const failureReason =
        paymentEntity?.error_description ||
        paymentEntity?.error_reason ||
        'Payment failed at Razorpay gateway';
      payment.status = 'FAILED';
      payment.webhookVerified = true;
      if (razorpayPaymentId) payment.razorpayPaymentId = razorpayPaymentId;
      payment.failureReason = failureReason;
      await payment.save();
      await syncAdminPaymentRecord(payment, 'FAILED');
    }
    return { status: 'processed_failed', paymentId: payment.paymentId, event: eventName };
  }

  return { status: 'ignored_unhandled_event', paymentId: payment.paymentId, event: eventName };
}
