import { Router, Response, NextFunction } from 'express';
import { BusinessDevRequestModel } from './business-development.model';
import { authenticate, requireActiveVerifiedMember, requireRoles, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { UserRole } from '@fic/shared-types';
import { AppError } from '../../common/errors/app-error';

export const businessDevRouter = Router();

businessDevRouter.post('/', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { businessName, supportType, currentChallenges, expectedOutcomes, refNumber } = req.body;
    const generatedRef = refNumber || `SCALE-2026-${Math.floor(100 + Math.random() * 900)}`;

    const request = await BusinessDevRequestModel.create({
      userId: req.user.userId,
      refNumber: generatedRef,
      businessName,
      supportType,
      currentChallenges,
      expectedOutcomes,
      status: 'SUBMITTED',
      latestFicUpdate: 'Your scaling request has been received. Our team is reviewing your business requirements.',
      whatHappensNext: 'FIC will review your request and share an update.',
      updateHistory: [
        {
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
          status: 'Submitted',
          update: 'Your scaling request has been received. Our team is reviewing your business requirements.',
          updatedBy: 'FIC Enterprise Desk'
        }
      ],
      memberAction: {
        isRequired: false
      },
      activityHistory: [
        {
          title: 'Request Submitted',
          description: 'Enterprise scaling request received by FIC Scaling Desk under strict non-disclosure.',
          timestamp: 'Today'
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Business development request submitted. FIC will assign a specialist.',
      data: request
    });
  } catch (error) {
    next(error);
  }
});

// Submit additional information requested by FIC
businessDevRouter.put('/:id/additional-info', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { id } = req.params;
    const { additionalInfo } = req.body;

    const request = await BusinessDevRequestModel.findOne({
      $or: [{ _id: id }, { refNumber: id }],
      userId: req.user.userId
    });

    if (!request) {
      throw new AppError('Scaling request not found', 404);
    }

    request.memberAction = {
      isRequired: false,
      title: request.memberAction?.title,
      reason: request.memberAction?.reason,
      dueDate: request.memberAction?.dueDate,
      submittedInfo: additionalInfo,
      submittedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    if (request.status === 'WAITING_FOR_MEMBER') {
      request.status = 'UNDER_REVIEW';
    }

    request.activityHistory = request.activityHistory || [];
    request.activityHistory.push({
      title: 'Additional Information Submitted',
      description: 'Member submitted requested operational details for scaling diagnosis.',
      timestamp: 'Today'
    });

    await request.save();

    res.status(200).json({
      success: true,
      message: 'Additional information submitted successfully.',
      data: request
    });
  } catch (error) {
    next(error);
  }
});

businessDevRouter.get('/me', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const requests = await BusinessDevRequestModel.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
});

// Update request status and latest FIC update (authorized FIC team / admin)
businessDevRouter.put('/:id/fic-update', authenticate, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { id } = req.params;
    const { status, latestFicUpdate, whatHappensNext, ficRecommendations } = req.body;

    const request = await BusinessDevRequestModel.findOne({
      $or: [{ _id: id }, { refNumber: id }]
    });

    if (!request) {
      throw new AppError('Scaling request not found', 404);
    }

    if (status) request.status = status;
    if (latestFicUpdate) request.latestFicUpdate = latestFicUpdate;
    if (whatHappensNext) request.whatHappensNext = whatHappensNext;
    if (ficRecommendations !== undefined) request.ficRecommendations = ficRecommendations;

    request.updateHistory = request.updateHistory || [];
    request.updateHistory.unshift({
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      status: status || request.status,
      update: latestFicUpdate || request.latestFicUpdate || 'Status updated by FIC team.',
      updatedBy: req.user.role === 'ADMIN' ? 'FIC Admin' : 'FIC Enterprise Desk'
    });

    await request.save();

    res.status(200).json({
      success: true,
      message: 'FIC update and status successfully saved.',
      data: request
    });
  } catch (error) {
    next(error);
  }
});


