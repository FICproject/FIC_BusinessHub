import { Router, Request, Response, NextFunction } from 'express';
import { CategoryModel, SubcategoryModel } from './categories.model';
import { CategoryConfigurationModel } from '../category-configurations/category-configurations.model';

export const categoriesRouter = Router();

// GET all categories with their subcategories
categoriesRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await CategoryModel.find({ isActive: true }).sort({ displayOrder: 1 }).lean();

    const result = await Promise.all(
      categories.map(async (cat) => {
        const subcategories = await SubcategoryModel.find({
          categoryId: cat._id,
          isActive: true
        }).sort({ displayOrder: 1 }).lean();
        return {
          ...cat,
          subcategories
        };
      })
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// GET category by ID or Slug with configuration
categoriesRouter.get('/:idOrSlug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idOrSlug } = req.params;
    const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: idOrSlug }
      : { slug: idOrSlug };

    const category = await CategoryModel.findOne(query).lean();
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    const subcategories = await SubcategoryModel.find({ categoryId: category._id, isActive: true })
      .sort({ displayOrder: 1 })
      .lean();

    const configuration = await CategoryConfigurationModel.findOne({ categoryId: category._id }).lean();

    res.status(200).json({
      success: true,
      data: {
        ...category,
        subcategories,
        configuration
      }
    });
  } catch (error) {
    next(error);
  }
});
