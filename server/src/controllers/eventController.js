import { supabaseAdmin } from '../services/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

export const listEvents = async (req, res, next) => {
  try {
    const { search, category, start_date_from, start_date_to, page = 1, limit = 10 } = req.query;

    const fromIndex = (page - 1) * limit;
    const toIndex = fromIndex + limit - 1;

    let query = supabaseAdmin
      .from('events')
      .select('*, creator:profiles!events_created_by_fkey(id, full_name, avatar_url)', { count: 'exact' });

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,venue.ilike.%${search}%`);
    }

    if (start_date_from) {
      query = query.gte('start_date', start_date_from);
    }

    if (start_date_to) {
      query = query.lte('start_date', start_date_to);
    }

    query = query
      .order('start_date', { ascending: true })
      .range(fromIndex, toIndex);

    const { data: events, error, count } = await query;

    if (error) {
      return next(new AppError(error.message, 500));
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('*, creator:profiles!events_created_by_fkey(id, full_name, avatar_url)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return next(new AppError(error.message, 500));
    }

    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    // Also get active team count for this event
    const { count: teamCount } = await supabaseAdmin
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', id);

    res.json({
      success: true,
      data: {
        ...event,
        team_count: teamCount || 0
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const eventPayload = {
      ...req.body,
      created_by: req.user.id
    };

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .insert(eventPayload)
      .select()
      .single();

    if (error) {
      return next(new AppError(error.message, 400));
    }

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (err) {
    next(err);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: existingEvent, error: fetchError } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingEvent) {
      return next(new AppError('Event not found', 404));
    }

    const { data: updatedEvent, error } = await supabaseAdmin
      .from('events')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return next(new AppError(error.message, 400));
    }

    res.json({
      success: true,
      data: updatedEvent
    });
  } catch (err) {
    next(err);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: existingEvent, error: fetchError } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingEvent) {
      return next(new AppError('Event not found', 404));
    }

    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      return next(new AppError(error.message, 500));
    }

    res.json({
      success: true,
      data: { message: 'Event deleted successfully', id }
    });
  } catch (err) {
    next(err);
  }
};
