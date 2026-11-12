import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../../common/errors/app-error';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { PaymentModel } from './payments.model';
import {
  createRazorpayOrderForUser,
  processRazorpayWebhookEvent,
  recordCheckoutFailureOrCancel,
  verifyCheckoutPaymentForUser
} from './payments.service';

export const paymentsRouter = Router();

/**
 * POST /api/v1/payments/create-order (and /api/payments/create-order)
 * Authoritatively computes price in INR on the server and creates a real Razorpay Test Mode order.
 */
paymentsRouter.post(
  '/create-order',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const { purpose, amount, serviceId, preferredMethod, notes } = req.body || {};
      if (!purpose) {
        throw new AppError('Payment purpose is required.', 400, 'PURPOSE_REQUIRED');
      }

      const orderPayload = await createRazorpayOrderForUser({
        userId,
        purpose,
        amount,
        serviceId,
        preferredMethod,
        notes
      });

      res.status(201).json({
        success: true,
        message: 'Razorpay payment order created successfully.',
        data: orderPayload
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/payments/verify (and /api/payments/verify)
 * Cryptographically verifies HMAC-SHA256 Razorpay signature and idempotently fulfills order.
 */
paymentsRouter.post(
  '/verify',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        paymentMethod
      } = req.body || {};

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new AppError(
          'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required for verification.',
          400,
          'MISSING_SIGNATURE_FIELDS'
        );
      }

      const result = await verifyCheckoutPaymentForUser({
        userId,
        razorpayOrderId: String(razorpay_order_id),
        razorpayPaymentId: String(razorpay_payment_id),
        razorpaySignature: String(razorpay_signature),
        paymentMethod: paymentMethod ? String(paymentMethod) : undefined
      });

      res.json({
        success: true,
        message: result.alreadyFulfilled
          ? 'Payment was already verified and fulfilled.'
          : 'Payment verified and fulfilled successfully.',
        data: {
          paymentId: result.payment.paymentId,
          internalOrderId: result.payment.internalOrderId,
          razorpayOrderId: result.payment.razorpayOrderId,
          razorpayPaymentId: result.payment.razorpayPaymentId,
          amount: result.payment.amount,
          currency: result.payment.currency,
          status: result.payment.status,
          purpose: result.payment.purpose,
          paymentMethod: result.payment.paymentMethod,
          signatureVerified: result.payment.signatureVerified,
          webhookVerified: result.payment.webhookVerified,
          verifiedAt: result.payment.verifiedAt,
          alreadyFulfilled: result.alreadyFulfilled,
          ...result.fulfillmentDetails
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/payments/webhook (and /api/payments/webhook)
 * Razorpay server-to-server webhook endpoint using raw request buffer for X-Razorpay-Signature HMAC validation.
 */
paymentsRouter.post(
  '/webhook',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/payments/:paymentId/failure
 * Records checkout dismissal or gateway failure cleanly (never marks payment as paid).
 */
paymentsRouter.post(
  '/:paymentId/failure',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const { razorpay_order_id, razorpay_payment_id, reason, status } = req.body || {};
      const updated = await recordCheckoutFailureOrCancel({
        userId,
        paymentId: req.params.paymentId,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        status: status === 'CANCELLED' ? 'CANCELLED' : 'FAILED',
        reason
      });

      res.json({
        success: true,
        data: {
          paymentId: updated.paymentId,
          internalOrderId: updated.internalOrderId,
          razorpayOrderId: updated.razorpayOrderId,
          status: updated.status,
          failureReason: updated.failureReason
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/payments/my-history
 * Lists authenticated member's own Razorpay payment transactions.
 */
paymentsRouter.get(
  '/my-history',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const payments = await PaymentModel.find({ userId })
        .select('-razorpaySignature -webhookEventIds')
        .sort({ createdAt: -1 })
        .limit(50);

      res.json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/payments/:paymentId/status
 * Authoritative server-side payment status lookup restricted to payment owner.
 */
paymentsRouter.get(
  '/:paymentId/status',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const identifier = req.params.paymentId;
      const payment = await PaymentModel.findOne({
        $or: [
          { paymentId: identifier },
          { internalOrderId: identifier },
          { razorpayOrderId: identifier },
          { orderId: identifier }
        ]
      }).select('-razorpaySignature');

      if (!payment) {
        throw new AppError('Payment record not found.', 404, 'PAYMENT_NOT_FOUND');
      }

      if (payment.userId.toString() !== userId.toString()) {
        throw new AppError('Forbidden. You cannot inspect another user’s payment.', 403, 'FORBIDDEN');
      }

      res.json({
        success: true,
        data: {
          paymentId: payment.paymentId,
          internalOrderId: payment.internalOrderId,
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: payment.razorpayPaymentId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          purpose: payment.purpose,
          paymentMethod: payment.paymentMethod,
          mode: payment.mode,
          signatureVerified: payment.signatureVerified,
          webhookVerified: payment.webhookVerified,
          fulfilled: payment.fulfilled,
          failureReason: payment.failureReason,
          verifiedAt: payment.verifiedAt,
          createdAt: payment.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Legacy compatibility: POST /api/v1/payments/membership/order -> delegates to real Razorpay create-order.
 */
paymentsRouter.post(
  '/membership/order',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }
      const orderPayload = await createRazorpayOrderForUser({
        userId,
        purpose: 'MEMBERSHIP_FIRST_YEAR'
      });
      res.status(201).json({
        success: true,
        data: {
          ...orderPayload,
          orderId: orderPayload.razorpayOrderId
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Legacy compatibility: POST /api/v1/payments/membership/confirm
 * Rejects unsigned/mock confirmations; only verifies genuine Razorpay signatures.
 */
paymentsRouter.post(
  '/membership/confirm',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentMethod } = req.body || {};
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new AppError(
          'Unsigned payment confirmation is rejected. Valid Razorpay signature verification is required.',
          400,
          'INVALID_PAYMENT_SIGNATURE'
        );
      }

      const result = await verifyCheckoutPaymentForUser({
        userId,
        razorpayOrderId: String(razorpay_order_id),
        razorpayPaymentId: String(razorpay_payment_id),
        razorpaySignature: String(razorpay_signature),
        paymentMethod: paymentMethod ? String(paymentMethod) : undefined
      });

      res.json({
        success: true,
        message: 'Membership payment verified and activated.',
        data: result.payment
      });
    } catch (error) {
      next(error);
    }
  }
);
