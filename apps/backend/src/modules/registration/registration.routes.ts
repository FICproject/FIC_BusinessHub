import { Router, Response, NextFunction } from 'express';
import { RegistrationSubmissionModel } from './registration.model';
import { UserModel } from '../users/users.model';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';

export const registrationRouter = Router();

// Submit or update dynamic registration form fields
registrationRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized.', 401);
    }

    const { categoryId, subcategoryIds, fieldsData } = req.body;

    const submission = await RegistrationSubmissionModel.findOneAndUpdate(
      { userId: req.user.userId },
      {
        userId: req.user.userId,
        categoryId,
        subcategoryIds: subcategoryIds || [],
        fieldsData,
        configurationVersion: 1
      },
      { upsert: true, new: true }
    );

    await UserModel.findByIdAndUpdate(req.user.userId, {
      primaryCategoryId: categoryId,
      subcategoryIds: subcategoryIds || []
    });

    res.status(200).json({
      success: true,
      message: 'Registration details saved successfully.',
      data: submission
    });
  } catch (error) {
    next(error);
  }
});

// Get user's own registration submission
registrationRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const submission = await RegistrationSubmissionModel.findOne({ userId: req.user.userId });
    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
});
