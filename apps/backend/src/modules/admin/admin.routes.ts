import { Router } from 'express';
import authRoutes from './controllers/auth.controller';
import categoryRoutes from './controllers/categories.controller';
import kycRoutes from './controllers/kyc.controller';
import memberRoutes from './controllers/members.controller';
import serviceRoutes from './controllers/services.controller';
import requestRoutes from './controllers/requests.controller';
import dashboardRoutes from './controllers/dashboard.controller';
import meetingRoutes from './controllers/meetings.controller';
import paymentRoutes from './controllers/payments.controller';
import supportRoutes from './controllers/support.controller';
import notificationRoutes from './controllers/notifications.controller';
import referralRoutes from './controllers/referrals.controller';
import fundingRoutes from './controllers/funding.controller';
import { adminDocumentsRouter } from './controllers/documents.controller';
import { adminPricingRouter } from './controllers/pricing.controller';

export const adminRouter = Router();

adminRouter.use('/auth', authRoutes);
adminRouter.use('/categories', categoryRoutes);
adminRouter.use('/kyc', kycRoutes);
adminRouter.use('/members', memberRoutes);
adminRouter.use('/services', serviceRoutes);
adminRouter.use('/requests', requestRoutes);
adminRouter.use('/dashboard', dashboardRoutes);
adminRouter.use('/meetings', meetingRoutes);
adminRouter.use('/payments', paymentRoutes);
adminRouter.use('/support', supportRoutes);
adminRouter.use('/notifications', notificationRoutes);
adminRouter.use('/referrals', referralRoutes);
adminRouter.use('/funding', fundingRoutes);
adminRouter.use('/documents', adminDocumentsRouter);
adminRouter.use('/config/pricing', adminPricingRouter);
adminRouter.use('/pricing', adminPricingRouter);

