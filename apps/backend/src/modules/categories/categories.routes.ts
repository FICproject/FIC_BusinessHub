import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { CategoryModel as AdminCategoryModel } from '../admin/models/Category';
import { CategoryModel, SubcategoryModel } from './categories.model';
import { CategoryConfigurationModel } from '../category-configurations/category-configurations.model';

export const categoriesRouter = Router();

// GET all categories with their subcategories (seamlessly merges admin-created categories)
categoriesRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Fetch any categories registered via Admin Categories & Config
    const adminCategories = await AdminCategoryModel.find({ isActive: true }).sort({ name: 1 }).lean();

    if (adminCategories.length > 0) {
      // Map admin categories to standard frontend format
      const formatted = adminCategories.map((cat: any) => ({
        _id: cat._id,
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        iconName: cat.icon || 'Briefcase',
        subcategories: (cat.subcategories || []).map((sub: any) =>
          typeof sub === 'string' ? sub : (sub.name || '')
        ).filter(Boolean),
        customFields: cat.customFields || [],
        kycRequirements: cat.kycRequirements || []
      }));

      res.status(200).json({
        success: true,
        data: formatted
      });
      return;
    }

    // 2. Fallback to classic category collection if admin collection is empty
    const categories = await CategoryModel.find({ isActive: true }).sort({ displayOrder: 1 }).lean();
    const result = await Promise.all(
      categories.map(async (cat) => {
        const subcategories = await SubcategoryModel.find({
          categoryId: cat._id,
          isActive: true
        }).sort({ displayOrder: 1 }).lean();
        return {
          ...cat,
          id: cat._id.toString(),
          subcategories: subcategories.map((s) => s.name)
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
    const isObjectId = mongoose.isValidObjectId(idOrSlug);
    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };

    // Check admin category collection first
    const adminCategory = await AdminCategoryModel.findOne(query).lean();
    if (adminCategory) {
      res.status(200).json({
        success: true,
        data: {
          ...adminCategory,
          id: adminCategory._id.toString(),
          subcategories: (adminCategory.subcategories || []).map((s: any) => typeof s === 'string' ? s : s.name)
        }
      });
      return;
    }

    // Fallback to legacy categories
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


