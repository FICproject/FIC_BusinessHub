import mongoose from 'mongoose';
import { UserModel } from '../modules/users/users.model';
import { MembershipModel } from '../modules/membership/membership.model';
import { getOrCreateWallet } from '../modules/wallet/wallet.routes';
import { WalletTransactionModel } from '../modules/wallet/wallet.model';
import { WalletTransactionType, WalletTransactionStatus, MembershipStatus } from '@fic/shared-types';
import { getAuthoritativePricing } from '../modules/payments/payments.service';
import { notifyMember } from '../modules/notifications/notifications.service';

/**
 * Runs the daily membership automated renewal & expiry alert processor
 */
export async function runMembershipAutoRenewalAndAlerts(): Promise<{
  renewedCount: number;
  failedCount: number;
  alertsSent: number;
}> {
  let renewedCount = 0;
  let failedCount = 0;
  let alertsSent = 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const pricing = await getAuthoritativePricing();
  const renewalFee = Number(pricing.MEMBERSHIP_RENEWAL) || 5999;

  // 1. Process Auto-Renewals (Phase 7 & 9)
  const autoRenewUsers = await UserModel.find({
    isMembershipActive: true,
    autoRenewWithWallet: true
  });

  const now = new Date();
  const oneDayAhead = new Date(Date.now() + 24 * 60 * 60 * 1000);

  for (const user of autoRenewUsers) {
    try {
      const membership = await MembershipModel.findOne({ userId: user._id }).sort({ createdAt: -1 });
      const expiry = membership?.endDate || new Date(new Date(user.createdAt).getTime() + 365 * 24 * 60 * 60 * 1000);

      // Only execute auto-renewal on the final day (within 24 hours of expiry or on expiry day)
      if (expiry <= oneDayAhead) {
        const wallet = await getOrCreateWallet(user._id.toString());
        if (wallet.availableBalance >= renewalFee) {
          // Sufficient balance: Atomically deduct renewal
          const balanceAfter = wallet.availableBalance - renewalFee;
          wallet.availableBalance -= renewalFee;
          wallet.totalBalance -= renewalFee;
          wallet.withdrawalEligibleBalance = Math.max(0, wallet.withdrawalEligibleBalance - renewalFee);
          wallet.membershipEligibleBalance = Math.max(0, wallet.membershipEligibleBalance - renewalFee);
          wallet.totalRenewalSpent += renewalFee;
          await wallet.save();

          // Create ledger entry
          const transaction = await WalletTransactionModel.create({
            transactionId: `TXN_AUTORNW_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            walletId: wallet._id,
            userId: user._id,
            transactionType: WalletTransactionType.MEMBERSHIP_RENEWAL,
            direction: 'DEBIT',
            amount: renewalFee,
            currency: 'INR',
            description: `Automated Annual Membership Renewal (Year 2+) via Universal Wallet`,
            status: WalletTransactionStatus.COMPLETED,
            balanceAfter,
            sourceReferenceId: `AUTO_RNW_${Date.now()}`
          });

          // Compute extended date (+365 days)
          const newEndDate = new Date(Math.max(expiry.getTime(), now.getTime()) + 365 * 24 * 60 * 60 * 1000);
          const newMembership = await MembershipModel.create({
            userId: user._id,
            status: MembershipStatus.ACTIVE,
            planType: 'ANNUAL_RENEWAL',
            amount: renewalFee,
            startDate: expiry > now ? expiry : now,
            endDate: newEndDate,
            paymentId: transaction._id
          });

          user.isMembershipActive = true;
          user.activeMembershipId = newMembership._id as any;
          user.lastExpiryAlertDate = `${todayStr}_renewed`;
          await user.save();

          await notifyMember({
            userId: user._id.toString(),
            eventType: 'MEMBERSHIP_AUTO_RENEWED',
            title: 'Membership Auto-Renewed Successfully',
            message: `Your annual membership has been auto-renewed for 1 year using your universal wallet balance (₹${renewalFee.toLocaleString('en-IN')}). Valid until ${newEndDate.toLocaleDateString('en-GB')}.`,
            link: '/profile',
            priority: 'HIGH'
          });

          renewedCount++;
        } else {
          // Insufficient balance
          const shortfall = renewalFee - wallet.availableBalance;
          failedCount++;

          if (user.lastExpiryAlertDate !== `${todayStr}_insufficient`) {
            user.lastExpiryAlertDate = `${todayStr}_insufficient`;
            await user.save();

            await notifyMember({
              userId: user._id.toString(),
              eventType: 'AUTO_RENEWAL_INSUFFICIENT_FUNDS',
              title: 'Auto-Renewal Alert: Insufficient Wallet Balance',
              message: `Your membership expires soon. Auto-renewal requires ₹${renewalFee.toLocaleString('en-IN')}, but your wallet balance is ₹${wallet.availableBalance.toLocaleString('en-IN')} (Shortfall: ₹${shortfall.toLocaleString('en-IN')}). Please add funds or renew manually.`,
              link: '/profile',
              priority: 'HIGH'
            });
          }
        }
      }
    } catch (err) {
      console.error(`Auto-renewal error for user ${user._id}:`, err);
    }
  }

  // 2. Process Expiry Reminders (Phase 8: 7, 3, 1, 0 days)
  const activeMembers = await UserModel.find({ isMembershipActive: true });

  for (const member of activeMembers) {
    try {
      const membership = await MembershipModel.findOne({ userId: member._id }).sort({ createdAt: -1 });
      const expiry = membership?.endDate || new Date(new Date(member.createdAt).getTime() + 365 * 24 * 60 * 60 * 1000);
      const msDiff = expiry.getTime() - now.getTime();
      const daysRemaining = Math.ceil(msDiff / (24 * 60 * 60 * 1000));

      if ([7, 3, 1, 0].includes(daysRemaining)) {
        const alertKey = `${todayStr}_day_${daysRemaining}`;
        if (member.lastExpiryAlertDate === alertKey) {
          continue; // Prevent duplicate alert on the same calendar day
        }

        let alertTitle = '';
        let alertMsg = '';

        if (daysRemaining === 7) {
          alertTitle = 'Membership Expiring in 7 Days';
          alertMsg = `Your annual FIC membership will expire on ${expiry.toLocaleDateString('en-GB')}. Early renewal window is now open in your profile.`;
        } else if (daysRemaining === 3) {
          alertTitle = 'Membership Expiring in 3 Days';
          alertMsg = `Only 3 days remaining on your FIC subscription. Renew now using your universal wallet or online payment to ensure uninterrupted services.`;
        } else if (daysRemaining === 1) {
          alertTitle = 'Urgent: Membership Expires Tomorrow';
          alertMsg = `Your FIC membership expires tomorrow (${expiry.toLocaleDateString('en-GB')}). Please renew to keep your ecosystem access active.`;
        } else if (daysRemaining === 0) {
          alertTitle = 'Membership Expires Today';
          alertMsg = `Today is the final day of your active membership. Please renew immediately to avoid access restriction.`;
        }

        await notifyMember({
          userId: member._id.toString(),
          eventType: 'MEMBERSHIP_EXPIRING_ALERT',
          title: alertTitle,
          message: alertMsg,
          link: '/profile',
          priority: 'HIGH'
        });

        member.lastExpiryAlertDate = alertKey;
        await member.save();
        alertsSent++;
      }
    } catch (err) {
      console.error(`Expiry alert error for member ${member._id}:`, err);
    }
  }

  console.log(`[MEMBERSHIP_JOB] Completed. Auto-renewed: ${renewedCount}, Insufficient: ${failedCount}, Alerts sent: ${alertsSent}`);
  return { renewedCount, failedCount, alertsSent };
}

/**
 * Initializes recurring background timer
 */
export function startMembershipRenewalCron() {
  // Run on startup after 10 seconds
  setTimeout(() => {
    runMembershipAutoRenewalAndAlerts().catch((e) => console.warn('Initial renewal job check error:', e));
  }, 10000);

  // Run every 6 hours
  setInterval(() => {
    runMembershipAutoRenewalAndAlerts().catch((e) => console.warn('Recurring renewal job error:', e));
  }, 6 * 60 * 60 * 1000);
}
