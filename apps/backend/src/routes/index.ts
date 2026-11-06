import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { categoriesRouter } from '../modules/categories/categories.routes';
import { categoryConfigurationsRouter } from '../modules/category-configurations/category-configurations.routes';
import { registrationRouter } from '../modules/registration/registration.routes';
import { membershipRouter } from '../modules/membership/membership.routes';
import { paymentsRouter } from '../modules/payments/payments.routes';
import { kycRouter } from '../modules/kyc/kyc.routes';
import { marketplaceRouter } from '../modules/marketplace/marketplace.routes';
import { servicesRouter } from '../modules/services/services.routes';
import { connectionsRouter } from '../modules/connections/connections.routes';
import { businessIdeasRouter } from '../modules/business-ideas/business-ideas.routes';
import { businessDevRouter } from '../modules/business-development/business-development.routes';
import { investmentRouter } from '../modules/investment/investment.routes';
import { partnershipsRouter } from '../modules/partnerships/partnerships.routes';
import { dashboardRouter } from '../modules/dashboard/dashboard.routes';
import { walletRouter } from '../modules/wallet/wallet.routes';
import { referralsRouter } from '../modules/referrals/referral.routes';
import { mentoringRouter } from '../modules/mentoring/mentoring.routes';

export const apiRouter = Router();

// Healthcheck
apiRouter.use(healthRouter);

// Domain Routes
apiRouter.use('/auth', authRouter);
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/category-configurations', categoryConfigurationsRouter);
apiRouter.use('/registration-submissions', registrationRouter);
apiRouter.use('/membership', membershipRouter);
apiRouter.use('/payments', paymentsRouter);
apiRouter.use('/kyc', kycRouter);
apiRouter.use('/marketplace', marketplaceRouter);
apiRouter.use('/services', servicesRouter);
apiRouter.use('/connections', connectionsRouter);
apiRouter.use('/business-ideas', businessIdeasRouter);
apiRouter.use('/business-development-requests', businessDevRouter);
apiRouter.use('/investment', investmentRouter);
apiRouter.use('/investment-profiles', investmentRouter);
apiRouter.use('/partnership-requests', partnershipsRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/wallet', walletRouter);
apiRouter.use('/referrals', referralsRouter);
apiRouter.use('/mentoring', mentoringRouter);
