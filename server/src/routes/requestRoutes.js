import { Router } from 'express';
import {
  patchJoinRequest,
  getMyJoinRequests,
  cancelJoinRequest
} from '../controllers/requestController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  patchJoinRequestSchema,
  deleteJoinRequestSchema
} from '../validators/index.js';

const router = Router();

// Specific routes before param routes
router.get('/mine', requireAuth, getMyJoinRequests);

// Param routes
router.patch('/:id', requireAuth, validate(patchJoinRequestSchema), patchJoinRequest);
router.delete('/:id', requireAuth, validate(deleteJoinRequestSchema), cancelJoinRequest);

export default router;
