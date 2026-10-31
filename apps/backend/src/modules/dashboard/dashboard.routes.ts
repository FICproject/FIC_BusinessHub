import { Router, Response, NextFunction } from 'express';
import { UserModel } from '../users/users.model';
import { CategoryConfigurationModel } from '../category-configurations/category-configurations.model';
import { ServiceRequestModel } from '../connections/connections.model';
import { BusinessIdeaModel } from '../business-ideas/business-ideas.model';
import { BusinessDevRequestModel } from '../business-development/business-development.model';
import { PartnershipRequestModel } from '../partnerships/partnerships.model';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';

export const dashboardRouter = Router();

dashboardRouter.get('/my-summary', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const user = await UserModel.findById(req.user.userId)
      .populate('primaryCategoryId')
      .populate('subcategoryIds')
      .select('-passwordHash');

    if (!user) throw new AppError('User not found', 404);

    let categoryConfig = null;
    if (user.primaryCategoryId) {
      categoryConfig = await CategoryConfigurationModel.findOne({
        categoryId: (user.primaryCategoryId as any)._id || user.primaryCategoryId
      }).lean();
    }

    const [serviceRequestsCount, ideasCount, devRequestsCount, partnershipsCount] = await Promise.all([
      ServiceRequestModel.countDocuments({ requesterId: user._id }),
      BusinessIdeaModel.countDocuments({ userId: user._id }),
      BusinessDevRequestModel.countDocuments({ userId: user._id }),
      PartnershipRequestModel.countDocuments({ userId: user._id })
    ]);

    res.status(200).json({
      success: true,
      data: {
        user,
        categoryConfig,
        metrics: {
          activeServiceRequests: serviceRequestsCount,
          submittedIdeas: ideasCount,
          activeDevRequests: devRequestsCount,
          activePartnershipRequests: partnershipsCount
        },
        ficBulletin: [
          {
            id: 'b-1',
            title: 'Welcome to FIC Business Hub',
            date: new Date().toLocaleDateString(),
            content: 'Your primary category workspace is active. Explore verified services and connect with business opportunities.'
          },
          {
            id: 'b-2',
            title: 'FIC Intermediary Guarantee',
            date: new Date().toLocaleDateString(),
            content: 'All service coordination is moderated by FIC team to ensure trust, compliance, and privacy.'
          }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
});

