import { Router } from 'express';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { patchNotificationReadSchema } from '../validators/index.js';

const router = Router();

router.get('/', requireAuth, getMyNotifications);
router.patch('/read-all', requireAuth, markAllNotificationsRead);
router.patch('/:id/read', requireAuth, validate(patchNotificationReadSchema), markNotificationRead);

export default router;
