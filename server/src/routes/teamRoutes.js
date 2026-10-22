import { Router } from 'express';
import {
  listTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  removeTeamMember
} from '../controllers/teamController.js';
import { createJoinRequest, getTeamJoinRequests } from '../controllers/requestController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listTeamsQuerySchema,
  getTeamByIdSchema,
  createTeamSchema,
  updateTeamSchema,
  createJoinRequestSchema,
  removeTeamMemberSchema
} from '../validators/index.js';

const router = Router();

// Team listing and details
router.get('/', validate(listTeamsQuerySchema), listTeams);
router.get('/:id', optionalAuth, validate(getTeamByIdSchema), getTeamById);

// Team CRUD (auth required)
router.post('/', requireAuth, validate(createTeamSchema), createTeam);
router.put('/:id', requireAuth, validate(updateTeamSchema), updateTeam);
router.delete('/:id', requireAuth, validate(getTeamByIdSchema), deleteTeam);

// Join requests for specific team
router.post('/:id/requests', requireAuth, validate(createJoinRequestSchema), createJoinRequest);
router.get('/:id/requests', requireAuth, validate(getTeamByIdSchema), getTeamJoinRequests);

// Member removal (leader removes or member leaves)
router.delete('/:id/members/:userId', requireAuth, validate(removeTeamMemberSchema), removeTeamMember);

export default router;
