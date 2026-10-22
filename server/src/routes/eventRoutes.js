import { Router } from 'express';
import {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/eventController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { validate } from '../middleware/validate.js';
import {
  listEventsQuerySchema,
  getEventByIdSchema,
  createEventSchema,
  updateEventSchema
} from '../validators/index.js';

const router = Router();

// Public read endpoints
router.get('/', validate(listEventsQuerySchema), listEvents);
router.get('/:id', validate(getEventByIdSchema), getEventById);

// Admin-only mutation endpoints
router.post('/', requireAuth, requireAdmin, validate(createEventSchema), createEvent);
router.put('/:id', requireAuth, requireAdmin, validate(updateEventSchema), updateEvent);
router.delete('/:id', requireAuth, requireAdmin, validate(getEventByIdSchema), deleteEvent);

export default router;
