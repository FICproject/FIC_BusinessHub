import crypto from 'crypto';
import Razorpay from 'razorpay';
import { config } from '../../config';
import { AppError } from '../../common/errors/app-error';

export interface CreateRazorpayOrderParams {
  amountInPaise: number;
  currency?: 'INR';
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
  notes?: Record<string, any>;
}

class RazorpayPaymentProvider {
  private cachedClient: Razorpay | null = null;
  private cachedKeySignature = '';

  public getKeyId(): string {
    return (process.env.RAZORPAY_KEY_ID || config.razorpay.keyId || '').trim();
  }

  private getKeySecret(): string {
    return (process.env.RAZORPAY_KEY_SECRET || config.razorpay.keySecret || '').trim();
  }

  private getWebhookSecret(): string {
    return (process.env.RAZORPAY_WEBHOOK_SECRET || config.razorpay.webhookSecret || '').trim();
  }

  public isTestMode(): boolean {
    const keyId = this.getKeyId();
    return keyId.startsWith('rzp_test_');
  }

  public assertConfigured(): { keyId: string; keySecret: string; mode: 'TEST' | 'LIVE' } {
    const keyId = this.getKeyId();
    const keySecret = this.getKeySecret();

    if (!keyId || !keySecret) {
      throw new AppError(
        'Razorpay gateway credentials are not configured on the server. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in apps/backend/.env.',
        503,
        'PAYMENT_GATEWAY_NOT_CONFIGURED'
      );
    }

    if (keyId.startsWith('rzp_live_') && !config.razorpay.allowLiveKeys) {
      throw new AppError(
        'Live Razorpay keys are disabled in Test Mode integration. Provide rzp_test_* credentials.',
        403,
        'LIVE_KEY_BLOCKED_IN_TEST_MODE'
      );
    }

    if (!keyId.startsWith('rzp_test_') && !config.razorpay.allowLiveKeys) {
      throw new AppError(
        'Invalid Razorpay Key ID format. Expected a Test Mode key starting with rzp_test_.',
        500,
        'INVALID_GATEWAY_KEY_FORMAT'
      );
    }

    return {
      keyId,
      keySecret,
      mode: keyId.startsWith('rzp_live_') ? 'LIVE' : 'TEST'
    };
  }

  private getClient(): Razorpay {
    const { keyId, keySecret } = this.assertConfigured();
    const sig = `${keyId}:${keySecret.length}`;
    if (!this.cachedClient || this.cachedKeySignature !== sig) {
      this.cachedClient = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
      this.cachedKeySignature = sig;
    }
    return this.cachedClient;
  }

  async createOrder(params: CreateRazorpayOrderParams): Promise<RazorpayOrderResult> {
    if (!Number.isInteger(params.amountInPaise) || params.amountInPaise < 100) {
      throw new AppError('Order amount must be at least 100 paise (INR 1).', 400, 'INVALID_AMOUNT');
    }

    const client = this.getClient();
    try {
      const order = await client.orders.create({
        amount: params.amountInPaise,
        currency: params.currency || 'INR',
        receipt: params.receipt.slice(0, 40),
        payment_capture: true,
        ...(params.notes ? { notes: params.notes } : {})
      });
      return order as unknown as RazorpayOrderResult;
    } catch (err: any) {
      const gatewayDesc =
        err?.error?.description || err?.description || err?.message || 'Razorpay order creation failed';
      throw new AppError(`Razorpay gateway error: ${gatewayDesc}`, 502, 'RAZORPAY_ORDER_FAILED');
    }
  }

  async fetchPayment(razorpayPaymentId: string): Promise<any | null> {
    try {
      const client = this.getClient();
      return await client.payments.fetch(razorpayPaymentId);
    } catch {
      return null;
    }
  }

  /**
   * Constant-time HMAC-SHA256 verification of Razorpay Checkout signature:
   * expected = HMAC_SHA256(key_secret, `${razorpay_order_id}|${razorpay_payment_id}`)
   */
  verifyCheckoutSignature(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): boolean {
    const { keySecret } = this.assertConfigured();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return false;
    }

    const expectedHex = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedHex, 'utf8');
    const receivedBuf = Buffer.from(razorpaySignature.trim(), 'utf8');
    if (expectedBuf.length !== receivedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  }

  /**
   * Constant-time HMAC-SHA256 verification of Razorpay webhook raw payload against X-Razorpay-Signature.
   */
  verifyWebhookSignature(rawBody: Buffer | string, signatureHeader: string): boolean {
    const webhookSecret = this.getWebhookSecret();
    if (!webhookSecret) {
      throw new AppError(
        'Razorpay webhook secret is not configured on the server (RAZORPAY_WEBHOOK_SECRET).',
        503,
        'WEBHOOK_SECRET_NOT_CONFIGURED'
      );
    }
    if (!rawBody || !signatureHeader) {
      return false;
    }

    const expectedHex = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedHex, 'utf8');
    const receivedBuf = Buffer.from(signatureHeader.trim(), 'utf8');
    if (expectedBuf.length !== receivedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  }
}

export const paymentProvider = new RazorpayPaymentProvider();
