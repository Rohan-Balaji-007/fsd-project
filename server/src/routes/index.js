import { Router } from 'express';
import profileRoutes from './profileRoutes.js';
import eventRoutes from './eventRoutes.js';
import teamRoutes from './teamRoutes.js';
import requestRoutes from './requestRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import { getMyTeams } from '../controllers/teamController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

// Profiles: support both /api/profile/me and /api/profiles/:id
router.use('/profile', profileRoutes);
router.use('/profiles', profileRoutes);

// Events
router.use('/events', eventRoutes);

// Teams
router.use('/teams', teamRoutes);

// My Teams
router.get('/my-teams', requireAuth, getMyTeams);

// Join Requests
router.use('/requests', requestRoutes);

// Notifications
router.use('/notifications', notificationRoutes);

// Admin Moderation Area (Protected by requireAuth, requireAdmin)
import adminRoutes from './adminRoutes.js';
router.use('/admin', adminRoutes);

export default router;
