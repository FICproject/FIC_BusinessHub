import { Router, Response } from 'express';
import { CategoryModel } from '../models/Category';
import { authenticateAdmin, requireRole, AuthenticatedAdminRequest, logAdminAction } from '../middleware/admin-auth.middleware';

const router = Router();

// GET /api/admin/categories - Get all categories with subcategories & dynamic rules
router.get('/', authenticateAdmin, async (_req, res) => {
  try {
    const categories = await CategoryModel.find().sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/categories - Create a new category (Super Admin or Admin with permission)
router.post('/', authenticateAdmin, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { name, slug, description, icon, allowMultipleSubcategories, subcategories, customFields, kycRequirements } = req.body;
    if (!name || !slug) {
      res.status(400).json({ success: false, error: 'Name and slug are required' });
      return;
    }

    const existing = await CategoryModel.findOne({ slug: slug.toLowerCase() });
    if (existing) {
      res.status(400).json({ success: false, error: 'A category with this slug already exists' });
      return;
    }

    const category = await CategoryModel.create({
      name,
      slug: slug.toLowerCase(),
      description,
      icon,
      allowMultipleSubcategories: allowMultipleSubcategories ?? true,
      subcategories: subcategories || [],
      customFields: customFields || [],
      kycRequirements: kycRequirements || [
        { docKey: 'id_proof', title: 'Government ID Proof', required: true, allowedExtensions: ['pdf', 'jpg', 'png'], maxSizeMB: 5 },
      ],
      isActive: true,
    });

    await logAdminAction(req, 'CREATE_CATEGORY', 'Category', category._id.toString(), { name, slug });
    res.status(201).json({ success: true, data: category });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/categories/:id - Update category & dynamic schema rules
router.put('/:id', authenticateAdmin, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const category = await CategoryModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    await logAdminAction(req, 'UPDATE_CATEGORY', 'Category', id, { updatedFields: Object.keys(updateData) });
    res.json({ success: true, data: category });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/categories/:id/subcategories - Add a subcategory
router.post('/:id/subcategories', authenticateAdmin, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, description } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: 'Subcategory name is required' });
      return;
    }

    const subSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const category = await CategoryModel.findById(id);
    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    // Check if subcategory already exists
    const exists = category.subcategories?.some((s: any) => s.slug === subSlug || s.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      res.status(400).json({ success: false, error: 'Subcategory with this name already exists' });
      return;
    }

    category.subcategories.push({
      name,
      slug: subSlug,
      description: description || '',
      isActive: true
    } as any);

    await category.save();
    await logAdminAction(req, 'ADD_SUBCATEGORY', 'Category', id, { subcategoryName: name });
    res.json({ success: true, data: category });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/categories/:id/subcategories/:subSlug - Remove or delete a subcategory
router.delete('/:id/subcategories/:subSlug', authenticateAdmin, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id, subSlug } = req.params;
    const category = await CategoryModel.findById(id);
    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    category.subcategories = category.subcategories.filter((s: any) => s.slug !== subSlug && s._id?.toString() !== subSlug);
    await category.save();

    await logAdminAction(req, 'DELETE_SUBCATEGORY', 'Category', id, { subSlug });
    res.json({ success: true, message: 'Subcategory removed successfully', data: category });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/categories/:id - Deactivate category
router.delete('/:id', authenticateAdmin, requireRole('SUPER_ADMIN'), async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await CategoryModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    await logAdminAction(req, 'DEACTIVATE_CATEGORY', 'Category', id);
    res.json({ success: true, message: 'Category deactivated successfully', data: category });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

