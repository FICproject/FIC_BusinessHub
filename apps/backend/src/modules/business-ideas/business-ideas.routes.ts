import { Router, Response, NextFunction } from 'express';
import { BusinessIdeaModel } from './business-ideas.model';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';

export const businessIdeasRouter = Router();

// Submit a business idea for FIC development & mentoring
businessIdeasRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { title, description, targetMarket, stage, supportNeeded } = req.body;

    const idea = await BusinessIdeaModel.create({
      userId: req.user.userId,
      title,
      description,
      targetMarket,
      stage,
      supportNeeded: supportNeeded || [],
      status: 'SUBMITTED'
    });

    res.status(201).json({
      success: true,
      message: 'Business idea submitted successfully to FIC for review.',
      data: idea
    });
  } catch (error) {
    next(error);
  }
});

// Get own submitted business ideas
businessIdeasRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const ideas = await BusinessIdeaModel.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: ideas });
  } catch (error) {
    next(error);
  }
});
