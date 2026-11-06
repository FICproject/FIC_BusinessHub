import { Router, Response, NextFunction } from 'express';
import { BusinessIdeaModel } from './business-ideas.model';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';

export const businessIdeasRouter = Router();

// Submit a business idea for FIC development & mentoring
businessIdeasRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { title, description, targetMarket, stage, supportNeeded, supportRequired, refNumber } = req.body;
    const generatedRef = refNumber || `IDEA-2026-${Math.floor(100 + Math.random() * 900)}`;

    const resolvedSupport = supportRequired || (Array.isArray(supportNeeded) ? supportNeeded.join(', ') : supportNeeded) || '';

    const idea = await BusinessIdeaModel.create({
      userId: req.user.userId,
      refNumber: generatedRef,
      title,
      description,
      targetMarket,
      stage: stage || 'IDEA',
      supportNeeded: resolvedSupport,
      supportRequired: resolvedSupport,
      status: 'SUBMITTED',
      latestFicUpdate: 'Your business idea has been received. Our team is currently reviewing it.',
      whatHappensNext: 'FIC will complete the initial review and update you.',
      updateHistory: [
        {
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
          status: 'Submitted',
          update: 'Your business idea has been received. Our team is currently reviewing it.',
          updatedBy: 'FIC Incubation Desk'
        }
      ],
      currentStep: 1,
      memberAction: {
        isRequired: false
      },
      activityHistory: [
        {
          title: 'Idea Submitted',
          description: 'Idea registered securely under strict FIC non-disclosure protocol.',
          timestamp: 'Today'
        }
      ]
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

// Submit additional information requested by FIC
businessIdeasRouter.put('/:id/additional-info', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { id } = req.params;
    const { additionalInfo } = req.body;

    const idea = await BusinessIdeaModel.findOne({
      $or: [{ _id: id }, { refNumber: id }],
      userId: req.user.userId
    });

    if (!idea) {
      throw new AppError('Business idea not found', 404);
    }

    idea.memberAction = {
      isRequired: false,
      title: idea.memberAction?.title,
      reason: idea.memberAction?.reason,
      dueDate: idea.memberAction?.dueDate,
      submittedInfo: additionalInfo,
      submittedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    if (idea.status === 'INFO_REQUIRED') {
      idea.status = 'UNDER_REVIEW';
    }

    idea.activityHistory = idea.activityHistory || [];
    idea.activityHistory.push({
      title: 'Additional Information Submitted',
      description: 'Member provided requested clarification for incubation desk.',
      timestamp: 'Today'
    });

    await idea.save();

    res.status(200).json({
      success: true,
      message: 'Additional information submitted successfully.',
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

// Update request status and latest FIC update (authorized FIC team / admin)
businessIdeasRouter.put('/:id/fic-update', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { id } = req.params;
    const { status, latestFicUpdate, whatHappensNext } = req.body;

    const idea = await BusinessIdeaModel.findOne({
      $or: [{ _id: id }, { refNumber: id }]
    });

    if (!idea) {
      throw new AppError('Business idea not found', 404);
    }

    if (status) idea.status = status;
    if (latestFicUpdate) idea.latestFicUpdate = latestFicUpdate;
    if (whatHappensNext) idea.whatHappensNext = whatHappensNext;

    idea.updateHistory = idea.updateHistory || [];
    idea.updateHistory.unshift({
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      status: status || idea.status,
      update: latestFicUpdate || idea.latestFicUpdate || 'Status updated by FIC team.',
      updatedBy: req.user.role === 'ADMIN' ? 'FIC Admin' : 'FIC Incubation Desk'
    });

    await idea.save();

    res.status(200).json({
      success: true,
      message: 'FIC update and status successfully saved.',
      data: idea
    });
  } catch (error) {
    next(error);
  }
});


