import { Router, Request, Response, NextFunction } from 'express';
import { ServiceListingModel } from '../services/services.model';
import { ServiceListingStatus } from '@fic/shared-types';

export const marketplaceRouter = Router();

// Universal Service Discovery: All approved services discoverable across all member categories
// Provider personal contact info (name, email, mobile) is strictly excluded at field projection level!
marketplaceRouter.get('/services', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, search, pricingType, page = 1, limit = 20 } = req.query;

    const filter: Record<string, any> = {
      status: ServiceListingStatus.APPROVED,
      isActive: true
    };

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (pricingType) {
      filter.pricingType = pricingType;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(String(search), 'i')] } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Strict projection: NEVER return provider details (no populate on providerId personal data)
    const [listings, total] = await Promise.all([
      ServiceListingModel.find(filter)
        .select('_id title description categoryId subcategoryId pricingType price deliveryTimeline tags createdAt')
        .populate('categoryId', 'name slug iconName')
        .populate('subcategoryId', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ServiceListingModel.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        items: listings,
        total,
        page: Number(page),
        pageSize: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Single Service Detail (Privacy Safe)
marketplaceRouter.get('/services/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const service = await ServiceListingModel.findOne({
      _id: id,
      status: ServiceListingStatus.APPROVED,
      isActive: true
    })
      .select('_id title description categoryId subcategoryId pricingType price deliveryTimeline tags createdAt')
      .populate('categoryId', 'name slug iconName')
      .populate('subcategoryId', 'name slug')
      .lean();

    if (!service) {
      res.status(404).json({ success: false, message: 'Service listing not found or not active.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    next(error);
  }
});

