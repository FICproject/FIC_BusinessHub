import { Router, Request, Response, NextFunction } from 'express';
import { ServiceListingModel } from '../services/services.model';
import { UserModel } from '../users/users.model';
import { ServiceListingStatus, AccountStatus } from '@fic/shared-types';

export const marketplaceRouter = Router();

// Universal Service Discovery: All approved services discoverable across all member categories
// Provider personal contact info (name, email, mobile) is strictly excluded at field projection level!
marketplaceRouter.get('/services', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, search, page = 1, limit = 50 } = req.query;

    // Exclude services from unapproved, suspended, or unverified members
    const activeVerifiedUsers = await UserModel.find({
      status: AccountStatus.ACTIVE,
      isKycApproved: true
    }).select('_id').lean();

    const activeUserObjectIds = activeVerifiedUsers.map((u: any) => u._id);
    const activeUserStringIds = activeVerifiedUsers.map((u: any) => u._id.toString());
    const validProviderIds = [...activeUserObjectIds, ...activeUserStringIds];

    const filter: Record<string, any> = {
      status: ServiceListingStatus.APPROVED,
      isActive: true,
      providerId: { $in: validProviderIds }
    };

    if (categoryId && categoryId !== 'all') {
      filter.$or = [
        { categoryId: categoryId },
        { categorySlug: categoryId }
      ];
    }

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { categoryName: { $regex: search, $options: 'i' } },
          { subcategoryName: { $regex: search, $options: 'i' } },
          { tags: { $in: [searchRegex] } }
        ]
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Strict projection: NEVER return provider details (no populate on provider personal data)
    // Timeline and Pricing are NOT included for public card view.
    const [listings, total] = await Promise.all([
      ServiceListingModel.find(filter)
        .select(
          '_id title shortDescription description categoryId subcategoryId categoryName categorySlug subcategoryName servicesOffered skills tags targetCustomers coverageArea deliveryMode createdAt'
        )
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
      .select(
        '_id title shortDescription description categoryId subcategoryId categoryName categorySlug subcategoryName servicesOffered skills tags targetCustomers coverageArea deliveryMode createdAt'
      )
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
