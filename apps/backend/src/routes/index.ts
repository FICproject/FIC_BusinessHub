import { Router } from 'express';
import { healthRouter } from './health.routes';

export const apiRouter = Router();

// Base health route
apiRouter.use(healthRouter);

// Domain API routes will be registered here
// e.g., apiRouter.use('/auth', authRouter);
// e.g., apiRouter.use('/categories', categoriesRouter);
// e.g., apiRouter.use('/kyc', kycRouter);
// e.g., apiRouter.use('/services', servicesRouter);
