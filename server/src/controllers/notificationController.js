import { supabaseAdmin } from '../services/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });

    if (error) {
      return next(new AppError(error.message, 500));
    }

    const unreadCount = (notifications || []).filter((n) => !n.is_read).length;

    res.json({
      success: true,
      data: {
        notifications: notifications || [],
        unread_count: unreadCount
      }
    });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    const { data: notification, error: fetchErr } = await supabaseAdmin
      .from('notifications')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !notification) {
      return next(new AppError('Notification not found', 404));
    }

    if (notification.user_id !== currentUserId) {
      return next(new AppError('Forbidden: Access denied to this notification', 403));
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return next(new AppError(updateErr.message, 400));
    }

    res.json({
      success: true,
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', currentUserId)
      .eq('is_read', false);

    if (error) {
      return next(new AppError(error.message, 500));
    }

    res.json({
      success: true,
      data: { message: 'All notifications marked as read' }
    });
  } catch (err) {
    next(err);
  }
};
