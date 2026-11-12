import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/errors/app-error';
import {
  listMemberNotifications,
  markAllMemberNotificationsRead,
  markMemberNotificationRead
} from './notifications.service';

export const notificationsRouter = Router();

// GET /api/v1/notifications - List persistent notifications for authenticated member
notificationsRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const data = await listMemberNotifications(req.user.userId, limit);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/notifications/read-all - Mark all member notifications as read
notificationsRouter.patch('/read-all', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    await markAllMemberNotificationsRead(req.user.userId);
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/notifications/:id/read - Mark a single member notification as read
notificationsRouter.patch('/:id/read', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const updated = await markMemberNotificationRead(req.user.userId, req.params.id);
    if (!updated) {
      throw new AppError('Notification not found.', 404, 'NOTIFICATION_NOT_FOUND');
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

