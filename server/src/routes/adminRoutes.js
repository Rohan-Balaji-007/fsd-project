import { Router } from 'express';
import {
  getAdminStats,
  listAllUsers,
  deleteUser,
  listAllTeamsForModeration,
  updateUserRole
} from '../controllers/adminController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { validate } from '../middleware/validate.js';
import { getProfileByIdSchema } from '../validators/index.js';

const router = Router();

// Protect all admin routes with authentication and admin role verification
router.use(requireAuth, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', listAllUsers);
router.patch('/users/:id/role', validate(getProfileByIdSchema), updateUserRole);
router.delete('/users/:id', validate(getProfileByIdSchema), deleteUser);
router.get('/teams', listAllTeamsForModeration);

export default router;
