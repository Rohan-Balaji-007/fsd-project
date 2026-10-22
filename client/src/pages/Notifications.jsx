import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Check,
  ExternalLink,
  UserPlus,
  CheckCircle2,
  XCircle,
  UserMinus,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardHeader, CardBody } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res?.success && res?.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      toast.error('Could not load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Click on a notification: marks as read and navigates to target link
  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await api.patch(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      if (notif.link) {
        navigate(notif.link);
      }
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  // Mark single as read without navigating
  const handleMarkSingleRead = async (e, id) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      toast.error('Failed to mark read: ' + err.message);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      const res = await api.patch('/notifications/read-all');
      if (res?.success) {
        toast.success('All notifications marked as read.');
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      toast.error('Failed to mark all as read: ' + err.message);
    } finally {
      setMarkingAll(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'join_request':
        return <UserPlus size={18} color="var(--color-primary)" />;
      case 'request_accepted':
        return <CheckCircle2 size={18} color="var(--color-success)" />;
      case 'request_rejected':
        return <XCircle size={18} color="var(--color-danger)" />;
      case 'member_left':
      case 'member_removed':
        return <UserMinus size={18} color="var(--color-warning-dark)" />;
      case 'team_updated':
        return <Sparkles size={18} color="var(--color-secondary)" />;
      default:
        return <Info size={18} color="var(--color-primary)" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <Spinner size="lg" />
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Notifications
            </h1>
            {unreadCount > 0 && (
              <Badge variant="danger">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
            Stay updated with your join requests, team invitations, and squad announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            icon={<CheckCheck size={16} />}
            loading={markingAll}
            onClick={handleMarkAllRead}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`btn btn-sm ${filter === 'unread' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={36} />}
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          description="You'll be alerted when team leaders respond to your applications or teammates join your squad."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredNotifications.map((notif) => (
            <Card
              key={notif.id}
              hoverable
              onClick={() => handleNotificationClick(notif)}
              style={{
                cursor: notif.link ? 'pointer' : 'default',
                background: notif.is_read ? '#ffffff' : 'linear-gradient(to right, #f5f3ff, #ffffff)',
                borderColor: notif.is_read ? 'var(--border-light)' : '#c7d2fe'
              }}
            >
              <CardBody style={{ padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: notif.is_read ? 'var(--bg-subtle)' : '#ede9fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  {getNotificationIcon(notif.type)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9375rem', fontWeight: notif.is_read ? 500 : 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    {notif.message}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(notif.created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  {!notif.is_read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkSingleRead(e, notif.id)}
                      title="Mark as read"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-primary)',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Check size={16} />
                    </button>
                  )}

                  {notif.link && (
                    <ExternalLink size={16} color="var(--text-muted)" />
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
