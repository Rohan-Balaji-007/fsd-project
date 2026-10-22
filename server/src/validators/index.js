import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid UUID identifier');

// Profiles
export const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100).optional(),
    avatar_url: z.string().url('Invalid avatar URL').nullable().optional(),
    department: z.string().trim().max(100).nullable().optional(),
    academic_year: z.string().trim().max(50).nullable().optional(),
    skills: z.array(z.string().trim()).optional(),
    interests: z.array(z.string().trim()).optional(),
    experience: z.string().trim().max(3000).nullable().optional()
  })
});

export const getProfileByIdSchema = z.object({
  params: z.object({
    id: uuidSchema
  })
});

// Events
export const eventCategoryEnum = z.enum(['hackathon', 'competition', 'exhibition', 'cultural', 'other']);

export const listEventsQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    category: eventCategoryEnum.optional(),
    start_date_from: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
    start_date_to: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10)
  })
});

export const getEventByIdSchema = z.object({
  params: z.object({
    id: uuidSchema
  })
});

export const createEventSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().trim().min(10, 'Description must be at least 10 characters'),
    category: eventCategoryEnum,
    start_date: z.string().datetime({ offset: true, message: 'start_date must be a valid ISO timestamp' }),
    end_date: z.string().datetime({ offset: true, message: 'end_date must be a valid ISO timestamp' }),
    venue: z.string().trim().min(2, 'Venue is required'),
    registration_url: z.string().url('Invalid registration URL').nullable().optional(),
    registration_deadline: z.string().datetime({ offset: true }).nullable().optional()
  }).refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
    message: 'end_date cannot be earlier than start_date',
    path: ['end_date']
  })
});

export const updateEventSchema = z.object({
  params: z.object({
    id: uuidSchema
  }),
  body: z.object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().min(10).optional(),
    category: eventCategoryEnum.optional(),
    start_date: z.string().datetime({ offset: true }).optional(),
    end_date: z.string().datetime({ offset: true }).optional(),
    venue: z.string().trim().min(2).optional(),
    registration_url: z.string().url().nullable().optional(),
    registration_deadline: z.string().datetime({ offset: true }).nullable().optional()
  })
});

// Teams
export const listTeamsQuerySchema = z.object({
  query: z.object({
    event_id: uuidSchema.optional(),
    search: z.string().trim().optional(),
    skills: z.string().trim().optional(), // comma-separated skill filter
    department: z.string().trim().optional(),
    only_open: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10)
  })
});

export const getTeamByIdSchema = z.object({
  params: z.object({
    id: uuidSchema
  })
});

export const createTeamSchema = z.object({
  body: z.object({
    event_id: uuidSchema,
    name: z.string().trim().min(2, 'Team name must be at least 2 characters').max(100),
    description: z.string().trim().max(1000).optional().default(''),
    required_skills: z.array(z.string().trim()).default([]),
    max_members: z.number().int().min(2, 'max_members must be at least 2').max(30)
  })
});

export const updateTeamSchema = z.object({
  params: z.object({
    id: uuidSchema
  }),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(1000).optional(),
    required_skills: z.array(z.string().trim()).optional(),
    max_members: z.number().int().min(2).max(30).optional(),
    status: z.enum(['open', 'full', 'closed']).optional()
  })
});

// Join Requests
export const createJoinRequestSchema = z.object({
  params: z.object({
    id: uuidSchema // team_id
  }),
  body: z.object({
    message: z.string().trim().max(500).optional().default('')
  })
});

export const patchJoinRequestSchema = z.object({
  params: z.object({
    id: uuidSchema // request_id
  }),
  body: z.object({
    action: z.enum(['accept', 'reject']).optional(),
    status: z.enum(['accepted', 'rejected']).optional()
  }).refine((data) => data.action !== undefined || data.status !== undefined, {
    message: 'Either action ("accept"|"reject") or status ("accepted"|"rejected") must be provided'
  })
});

export const deleteJoinRequestSchema = z.object({
  params: z.object({
    id: uuidSchema
  })
});

// Team Member Removal
export const removeTeamMemberSchema = z.object({
  params: z.object({
    id: uuidSchema, // team_id
    userId: uuidSchema // user_id to remove
  })
});

// Notifications
export const patchNotificationReadSchema = z.object({
  params: z.object({
    id: uuidSchema
  })
});
