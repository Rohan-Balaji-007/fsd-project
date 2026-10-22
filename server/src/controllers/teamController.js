import { supabaseAdmin } from '../services/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { createNotification, notifyTeamMembers } from '../services/notificationService.js';

export const listTeams = async (req, res, next) => {
  try {
    const { event_id, search, skills, department, only_open, page = 1, limit = 10 } = req.query;

    const fromIndex = (page - 1) * limit;
    const toIndex = fromIndex + limit - 1;

    let query = supabaseAdmin
      .from('teams')
      .select(`
        *,
        event:events!teams_event_id_fkey(id, title, category, start_date, venue),
        leader:profiles!teams_leader_id_fkey(id, full_name, avatar_url, department, academic_year),
        members:team_members(
          id,
          role,
          joined_at,
          user:profiles(id, full_name, avatar_url, department, skills)
        )
      `, { count: 'exact' });

    if (event_id) {
      query = query.eq('event_id', event_id);
    }

    if (only_open === 'true') {
      query = query.eq('status', 'open');
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (skills) {
      const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
      if (skillsArray.length > 0) {
        query = query.overlaps('required_skills', skillsArray);
      }
    }

    query = query
      .order('created_at', { ascending: false })
      .range(fromIndex, toIndex);

    const { data: teams, error, count } = await query;

    if (error) {
      return next(new AppError(error.message, 500));
    }

    let filteredTeams = teams || [];

    // Filter by department if requested (checks leader or any member department)
    if (department) {
      const deptLower = department.toLowerCase();
      filteredTeams = filteredTeams.filter((team) => {
        const leaderDept = team.leader?.department?.toLowerCase() || '';
        const memberDept = team.members?.some(
          (m) => m.user?.department?.toLowerCase() === deptLower
        );
        return leaderDept === deptLower || memberDept;
      });
    }

    // Attach computed member count
    const enrichedTeams = filteredTeams.map((team) => ({
      ...team,
      member_count: team.members ? team.members.length : 0
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        teams: enrichedTeams,
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

export const getTeamById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    const { data: team, error } = await supabaseAdmin
      .from('teams')
      .select(`
        *,
        event:events!teams_event_id_fkey(id, title, description, category, start_date, end_date, venue),
        leader:profiles!teams_leader_id_fkey(id, full_name, avatar_url, department, academic_year, skills),
        members:team_members(
          id,
          role,
          joined_at,
          user:profiles(id, full_name, avatar_url, department, academic_year, skills, experience)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return next(new AppError(error.message, 500));
    }

    if (!team) {
      return next(new AppError('Team not found', 404));
    }

    const isLeader = currentUserId && team.leader_id === currentUserId;
    const isMember = currentUserId && team.members?.some((m) => m.user?.id === currentUserId);

    let pendingRequestsCount = 0;
    let pendingRequests = null;

    if (isLeader) {
      const { data: requests, count } = await supabaseAdmin
        .from('join_requests')
        .select(`
          id,
          message,
          status,
          created_at,
          applicant:profiles!join_requests_user_id_fkey(id, full_name, avatar_url, department, academic_year, skills)
        `, { count: 'exact' })
        .eq('team_id', id)
        .eq('status', 'pending');

      pendingRequestsCount = count || 0;
      pendingRequests = requests || [];
    }

    res.json({
      success: true,
      data: {
        ...team,
        member_count: team.members ? team.members.length : 0,
        is_leader: Boolean(isLeader),
        is_member: Boolean(isMember),
        pending_requests_count: pendingRequestsCount,
        ...(isLeader && { pending_requests: pendingRequests })
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createTeam = async (req, res, next) => {
  try {
    const { event_id, name, description = '', required_skills = [], max_members } = req.body;
    const leader_id = req.user.id;

    // Verify event exists
    const { data: event, error: eventErr } = await supabaseAdmin
      .from('events')
      .select('id, title')
      .eq('id', event_id)
      .maybeSingle();

    if (eventErr || !event) {
      return next(new AppError('Referenced event does not exist', 404));
    }

    // Insert team (DB trigger on_team_created automatically inserts leader into team_members)
    const { data: team, error } = await supabaseAdmin
      .from('teams')
      .insert({
        event_id,
        leader_id,
        name,
        description,
        required_skills,
        max_members,
        status: 'open'
      })
      .select()
      .single();

    if (error) {
      return next(new AppError(error.message, 400));
    }

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (err) {
    next(err);
  }
};

export const updateTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    // Verify team exists and caller is leader
    const { data: team, error: fetchErr } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !team) {
      return next(new AppError('Team not found', 404));
    }

    if (team.leader_id !== currentUserId && req.user.role !== 'admin') {
      return next(new AppError('Forbidden: Only the team leader can edit this team', 403));
    }

    // If max_members is being updated, verify it is not less than current member count
    if (req.body.max_members !== undefined) {
      const { count: currentMemberCount } = await supabaseAdmin
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', id);

      if (req.body.max_members < currentMemberCount) {
        return next(
          new AppError(
            `Cannot set max_members to ${req.body.max_members} because the team already has ${currentMemberCount} members`,
            400
          )
        );
      }
    }

    const { data: updatedTeam, error: updateErr } = await supabaseAdmin
      .from('teams')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return next(new AppError(updateErr.message, 400));
    }

    // Notification rule: Create a notification on team updated to members
    await notifyTeamMembers({
      teamId: id,
      excludeUserId: currentUserId,
      type: 'team_updated',
      message: `Team "${updatedTeam.name}" details have been updated by the leader.`,
      link: `/teams/${id}`
    });

    res.json({
      success: true,
      data: updatedTeam
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    const { data: team, error: fetchErr } = await supabaseAdmin
      .from('teams')
      .select('id, name, leader_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !team) {
      return next(new AppError('Team not found', 404));
    }

    if (team.leader_id !== currentUserId && req.user.role !== 'admin') {
      return next(new AppError('Forbidden: Only the team leader can delete this team', 403));
    }

    const { error: deleteErr } = await supabaseAdmin
      .from('teams')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      return next(new AppError(deleteErr.message, 500));
    }

    res.json({
      success: true,
      data: { message: `Team "${team.name}" was deleted successfully`, id }
    });
  } catch (err) {
    next(err);
  }
};

export const getMyTeams = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    // Find all team IDs user is member of
    const { data: memberships, error: memErr } = await supabaseAdmin
      .from('team_members')
      .select('team_id, role, joined_at')
      .eq('user_id', currentUserId);

    if (memErr) {
      return next(new AppError(memErr.message, 500));
    }

    if (!memberships || memberships.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const teamIds = memberships.map((m) => m.team_id);
    const membershipMap = new Map(memberships.map((m) => [m.team_id, m]));

    const { data: teams, error: teamsErr } = await supabaseAdmin
      .from('teams')
      .select(`
        *,
        event:events!teams_event_id_fkey(id, title, category, start_date, venue),
        leader:profiles!teams_leader_id_fkey(id, full_name, avatar_url),
        members:team_members(id)
      `)
      .in('id', teamIds)
      .order('created_at', { ascending: false });

    if (teamsErr) {
      return next(new AppError(teamsErr.message, 500));
    }

    const enriched = (teams || []).map((team) => {
      const membership = membershipMap.get(team.id);
      return {
        ...team,
        my_role: membership ? membership.role : (team.leader_id === currentUserId ? 'leader' : 'member'),
        member_count: team.members ? team.members.length : 0
      };
    });

    res.json({
      success: true,
      data: enriched
    });
  } catch (err) {
    next(err);
  }
};

export const removeTeamMember = async (req, res, next) => {
  try {
    const { id: teamId, userId: targetUserId } = req.params;
    const currentUserId = req.user.id;

    // Verify team
    const { data: team, error: teamErr } = await supabaseAdmin
      .from('teams')
      .select('id, name, leader_id, max_members, status')
      .eq('id', teamId)
      .maybeSingle();

    if (teamErr || !team) {
      return next(new AppError('Team not found', 404));
    }

    const isLeader = team.leader_id === currentUserId;
    const isSelfLeaving = currentUserId === targetUserId;
    const isAdmin = req.user.role === 'admin';

    // Permission check
    if (!isLeader && !isSelfLeaving && !isAdmin) {
      return next(new AppError('Forbidden: You can only remove yourself or members of your own team', 403));
    }

    // Leader cannot leave their own team via member removal
    if (isSelfLeaving && isLeader) {
      return next(new AppError('Leader cannot leave their own team. Transfer leadership or delete the team.', 400));
    }

    // Check membership
    const { data: memberRow, error: memberErr } = await supabaseAdmin
      .from('team_members')
      .select('id, user_id, role, profile:profiles(id, full_name)')
      .eq('team_id', teamId)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (memberErr || !memberRow) {
      return next(new AppError('User is not a member of this team', 404));
    }

    // Delete membership
    const { error: deleteErr } = await supabaseAdmin
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', targetUserId);

    if (deleteErr) {
      return next(new AppError(deleteErr.message, 500));
    }

    // Check capacity: If team status was 'full', set it back to 'open'
    const { count: remainingCount } = await supabaseAdmin
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId);

    if (team.status === 'full' && remainingCount < team.max_members) {
      await supabaseAdmin
        .from('teams')
        .update({ status: 'open' })
        .eq('id', teamId);
    }

    // Notification rule: Create notification on member left / removed
    const memberName = memberRow.profile?.full_name || 'A team member';

    if (isSelfLeaving) {
      // Member left voluntarily -> Notify leader
      await createNotification({
        userId: team.leader_id,
        type: 'member_left',
        message: `${memberName} has left your team "${team.name}".`,
        link: `/teams/${teamId}`
      });
    } else {
      // Leader or Admin removed member -> Notify target user
      await createNotification({
        userId: targetUserId,
        type: 'member_removed',
        message: `You have been removed from team "${team.name}".`,
        link: `/events`
      });
    }

    res.json({
      success: true,
      data: {
        message: isSelfLeaving ? 'You have left the team.' : 'Member removed successfully.',
        team_id: teamId,
        user_id: targetUserId,
        remaining_members: remainingCount
      }
    });
  } catch (err) {
    next(err);
  }
};
