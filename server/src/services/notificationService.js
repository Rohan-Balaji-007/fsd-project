import { supabaseAdmin } from './supabase.js';

/**
 * Creates an in-app notification for a given user.
 *
 * @param {Object} params
 * @param {string} params.userId - Target user UUID
 * @param {string} params.type - 'join_request' | 'request_accepted' | 'request_rejected' | 'member_left' | 'team_updated'
 * @param {string} params.message - Notification message
 * @param {string} [params.link] - Optional app route
 */
export const createNotification = async ({ userId, type, message, link = null }) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        message,
        link,
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('[NotificationService] Error creating notification:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[NotificationService] Unexpected error creating notification:', err);
    return null;
  }
};

/**
 * Sends notifications to all members of a team, optionally excluding a specific user (e.g. the updater).
 */
export const notifyTeamMembers = async ({ teamId, excludeUserId = null, type, message, link = null }) => {
  try {
    const { data: members, error } = await supabaseAdmin
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId);

    if (error || !members || members.length === 0) return;

    const notificationsToInsert = members
      .filter((m) => m.user_id !== excludeUserId)
      .map((m) => ({
        user_id: m.user_id,
        type,
        message,
        link,
        is_read: false
      }));

    if (notificationsToInsert.length > 0) {
      await supabaseAdmin.from('notifications').insert(notificationsToInsert);
    }
  } catch (err) {
    console.error('[NotificationService] Error notifying team members:', err);
  }
};
