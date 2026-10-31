export interface MemberEligibility {
  isPaymentDone: boolean;
  isKycApproved: boolean;
  isMembershipActive: boolean;
  isAccountActive: boolean;
}

export const isMemberFullDashboardEligible = (status: MemberEligibility): boolean => {
  return (
    status.isPaymentDone &&
    status.isKycApproved &&
    status.isMembershipActive &&
    status.isAccountActive
  );
};

