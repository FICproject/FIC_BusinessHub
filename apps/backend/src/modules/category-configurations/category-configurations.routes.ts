import { Router, Request, Response, NextFunction } from 'express';
import { CategoryConfigurationModel } from './category-configurations.model';

export const categoryConfigurationsRouter = Router();

categoryConfigurationsRouter.get('/:categoryId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId } = req.params;
    const config = await CategoryConfigurationModel.findOne({ categoryId }).lean();
    if (!config) {
      res.status(404).json({ success: false, message: 'Configuration not found for category' });
      return;
    }
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

