import { supabaseAdmin } from '../services/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { createNotification } from '../services/notificationService.js';

export const createJoinRequest = async (req, res, next) => {
  try {
    const { id: teamId } = req.params;
    const { message = '' } = req.body;
    const applicantId = req.user.id;

    // 1. Fetch team
    const { data: team, error: teamErr } = await supabaseAdmin
      .from('teams')
      .select('id, name, leader_id, max_members, status')
      .eq('id', teamId)
      .maybeSingle();

    if (teamErr || !team) {
      return next(new AppError('Team not found', 404));
    }

    // 2. Check team status
    if (team.status === 'closed') {
      return next(new AppError('Team is currently closed for join requests', 400));
    }

    // 3. Rule: Leader cannot request to join their own team
    if (team.leader_id === applicantId) {
      return next(new AppError('Team leader cannot send a join request to their own team', 400));
    }

    // 4. Rule: Existing members cannot request again
    const { data: existingMember } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', applicantId)
      .maybeSingle();

    if (existingMember) {
      return next(new AppError('You are already a member of this team', 400));
    }

    // 5. Rule: Check current team capacity
    const { count: memberCount } = await supabaseAdmin
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId);

    if (team.status === 'full' || (memberCount !== null && memberCount >= team.max_members)) {
      return next(new AppError(`Team "${team.name}" is already at full capacity (${memberCount}/${team.max_members} members)`, 400));
    }

    // 6. Rule: No duplicate PENDING request from the same user to the same team
    const { data: existingPending } = await supabaseAdmin
      .from('join_requests')
      .select('id, status')
      .eq('team_id', teamId)
      .eq('user_id', applicantId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingPending) {
      return next(new AppError('You already have a pending join request for this team', 409));
    }

    // 7. Insert the join request
    const { data: newRequest, error: insertErr } = await supabaseAdmin
      .from('join_requests')
      .insert({
        team_id: teamId,
        user_id: applicantId,
        message,
        status: 'pending'
      })
      .select()
      .single();

    if (insertErr) {
      return next(new AppError(insertErr.message, 400));
    }

    // 8. Notification rule: Create notification on request sent (to leader)
    const applicantName = req.user.profile?.full_name || 'A student';
    await createNotification({
      userId: team.leader_id,
      type: 'join_request',
      message: `${applicantName} requested to join your team "${team.name}".`,
      link: `/teams/${teamId}`
    });

    res.status(201).json({
      success: true,
      data: newRequest
    });
  } catch (err) {
    next(err);
  }
};

export const getTeamJoinRequests = async (req, res, next) => {
  try {
    const { id: teamId } = req.params;
    const currentUserId = req.user.id;

    // Verify team and leader
    const { data: team, error: teamErr } = await supabaseAdmin
      .from('teams')
      .select('id, name, leader_id')
      .eq('id', teamId)
      .maybeSingle();

    if (teamErr || !team) {
      return next(new AppError('Team not found', 404));
    }

    if (team.leader_id !== currentUserId && req.user.role !== 'admin') {
      return next(new AppError('Forbidden: Only the team leader can view team join requests', 403));
    }

    const { data: requests, error } = await supabaseAdmin
      .from('join_requests')
      .select(`
        *,
        applicant:profiles!join_requests_user_id_fkey(
          id,
          full_name,
          avatar_url,
          department,
          academic_year,
          skills,
          experience
        )
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) {
      return next(new AppError(error.message, 500));
    }

    res.json({
      success: true,
      data: requests || []
    });
  } catch (err) {
    next(err);
  }
};

export const patchJoinRequest = async (req, res, next) => {
  try {
    const { id: requestId } = req.params;
    const action = req.body.action || (req.body.status === 'accepted' ? 'accept' : req.body.status === 'rejected' ? 'reject' : null);
    const leaderId = req.user.id;

    if (!action || !['accept', 'reject'].includes(action)) {
      return next(new AppError('Action must be either "accept" or "reject"', 400));
    }

    // 1. Fetch request and team info
    const { data: request, error: reqErr } = await supabaseAdmin
      .from('join_requests')
      .select(`
        *,
        team:teams(id, name, leader_id, max_members, status)
      `)
      .eq('id', requestId)
      .maybeSingle();

    if (reqErr || !request) {
      return next(new AppError('Join request not found', 404));
    }

    // 2. Rule: Only the leader can accept/reject requests
    if (request.team.leader_id !== leaderId && req.user.role !== 'admin') {
      return next(new AppError('Forbidden: Only the team leader can accept or reject requests', 403));
    }

    // 3. Rule: Request must be pending
    if (request.status !== 'pending') {
      return next(new AppError(`Cannot update request: current status is already "${request.status}"`, 400));
    }

    // 4. Handle ACCEPT via Postgres RPC (atomic row-locking & capacity check)
    if (action === 'accept') {
      const { data: rpcResult, error: rpcErr } = await supabaseAdmin.rpc('accept_join_request', {
        p_request_id: requestId,
        p_leader_id: request.team.leader_id // pass authorized leader
      });

      if (rpcErr) {
        // RPC throws clean user-facing Postgres exceptions
        const isCapacityError = rpcErr.message.includes('capacity') || rpcErr.message.includes('full');
        return next(new AppError(rpcErr.message, isCapacityError ? 400 : 400));
      }

      return res.json({
        success: true,
        data: rpcResult
      });
    }

    // 5. Handle REJECT
    if (action === 'reject') {
      const { data: updatedRequest, error: updateErr } = await supabaseAdmin
        .from('join_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)
        .select()
        .single();

      if (updateErr) {
        return next(new AppError(updateErr.message, 400));
      }

      // Notification rule: Create notification on request rejected
      await createNotification({
        userId: request.user_id,
        type: 'request_rejected',
        message: `Your request to join team "${request.team.name}" was declined.`,
        link: `/teams/${request.team_id}`
      });

      return res.json({
        success: true,
        data: updatedRequest
      });
    }
  } catch (err) {
    next(err);
  }
};

export const getMyJoinRequests = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    const { data: requests, error } = await supabaseAdmin
      .from('join_requests')
      .select(`
        *,
        team:teams(
          id,
          name,
          status,
          max_members,
          leader:profiles!teams_leader_id_fkey(id, full_name, avatar_url),
          event:events!teams_event_id_fkey(id, title, category, start_date)
        )
      `)
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });

    if (error) {
      return next(new AppError(error.message, 500));
    }

    res.json({
      success: true,
      data: requests || []
    });
  } catch (err) {
    next(err);
  }
};

export const cancelJoinRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    const { data: request, error: fetchErr } = await supabaseAdmin
      .from('join_requests')
      .select('id, user_id, status')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !request) {
      return next(new AppError('Join request not found', 404));
    }

    if (request.user_id !== currentUserId && req.user.role !== 'admin') {
      return next(new AppError('Forbidden: You can only cancel your own join requests', 403));
    }

    if (request.status !== 'pending') {
      return next(new AppError(`Cannot cancel a request with status "${request.status}"`, 400));
    }

    const { error: deleteErr } = await supabaseAdmin
      .from('join_requests')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      return next(new AppError(deleteErr.message, 500));
    }

    res.json({
      success: true,
      data: { message: 'Join request cancelled successfully', id }
    });
  } catch (err) {
    next(err);
  }
};
