import { Router } from 'express';
import { getMyProfile, updateMyProfile, getProfileById } from '../controllers/profileController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, getProfileByIdSchema } from '../validators/index.js';

const router = Router();

// /api/profile/me and /api/profiles/me
router.get('/me', requireAuth, getMyProfile);
router.put('/me', requireAuth, validate(updateProfileSchema), updateMyProfile);

// /api/profiles/:id
router.get('/:id', optionalAuth, validate(getProfileByIdSchema), getProfileById);

export default router;
