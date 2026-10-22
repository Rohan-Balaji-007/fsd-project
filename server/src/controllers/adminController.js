import { supabaseAdmin } from '../services/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAdminStats = async (req, res, next) => {
  try {
    const [
      { count: usersCount },
      { count: eventsCount },
      { count: teamsCount },
      { count: requestsCount }
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('events').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('teams').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('join_requests').select('*', { count: 'exact', head: true })
    ]);

    res.json({
      success: true,
      data: {
        total_users: usersCount || 0,
        total_events: eventsCount || 0,
        total_teams: teamsCount || 0,
        total_requests: requestsCount || 0
      }
    });
  } catch (err) {
    next(err);
  }
};

export const listAllUsers = async (req, res, next) => {
  try {
    const { search = '', role = '', page = 1, limit = 20 } = req.query;
    const fromIndex = (page - 1) * limit;
    const toIndex = fromIndex + limit - 1;

    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,department.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(fromIndex, toIndex);

    const { data: users, error, count } = await query;

    if (error) {
      return next(new AppError(error.message, 500));
    }

    res.json({
      success: true,
      data: {
        users: users || [],
        total: count || 0,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent deleting oneself
    if (req.user.id === id) {
      return next(new AppError('Admin cannot delete their own account from moderation', 400));
    }

    // Try deleting from auth.users (cascades to profiles, teams, etc.)
    try {
      await supabaseAdmin.auth.admin.deleteUser(id);
    } catch (authErr) {
      console.warn('Could not delete from auth.users, deleting profile row directly:', authErr.message);
      const { error } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        return next(new AppError(error.message, 500));
      }
    }

    res.json({
      success: true,
      data: { message: 'User deleted successfully', id }
    });
  } catch (err) {
    next(err);
  }
};

export const listAllTeamsForModeration = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const fromIndex = (page - 1) * limit;
    const toIndex = fromIndex + limit - 1;

    let query = supabaseAdmin
      .from('teams')
      .select(`
        *,
        event:events(id, title),
        leader:profiles!teams_leader_id_fkey(id, full_name, avatar_url, department)
      `, { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(fromIndex, toIndex);

    const { data: teams, error, count } = await query;

    if (error) {
      return next(new AppError(error.message, 500));
    }

    res.json({
      success: true,
      data: {
        teams: teams || [],
        total: count || 0,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['student', 'admin'].includes(role)) {
      return next(new AppError('Role must be either "student" or "admin"', 400));
    }

    // Safety guard: Prevent demoting yourself to avoid locking yourself out
    if (req.user.id === id && role === 'student') {
      return next(new AppError('You cannot demote your own admin account. Another administrator must change your role.', 400));
    }

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select('id, full_name, role, department')
      .single();

    if (error) {
      return next(new AppError(error.message, 500));
    }

    res.json({
      success: true,
      data: updatedProfile
    });
  } catch (err) {
    next(err);
  }
};

