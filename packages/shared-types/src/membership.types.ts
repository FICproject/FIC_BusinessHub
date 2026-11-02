export enum MembershipStatus {
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  GRACE_PERIOD = 'GRACE_PERIOD'
}

export enum PaymentStatus {
  INITIATED = 'INITIATED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface IMembership {
  _id: string;
  userId: string;
  status: MembershipStatus;
  planType: 'FIRST_YEAR_INTRO' | 'ANNUAL_RENEWAL';
  amount: number;
  startDate: Date | string;
  endDate: Date | string;
  paymentId?: string;
}

