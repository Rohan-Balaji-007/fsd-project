import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Calendar,
  Users,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Search,
  AlertTriangle,
  UserX,
  Layers,
  Sparkles,
  Clock,
  MapPin
} from 'lucide-react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardHeader, CardBody } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

const EVENT_CATEGORIES = [
  { label: 'Hackathon', value: 'hackathon' },
  { label: 'Competition', value: 'competition' },
  { label: 'Exhibition', value: 'exhibition' },
  { label: 'Cultural & Jams', value: 'cultural' },
  { label: 'Other', value: 'other' }
];

export const Admin = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'teams' | 'users'

  // Stats
  const [stats, setStats] = useState(null);

  // Events CRUD state
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    category: 'hackathon',
    start_date: '',
    end_date: '',
    venue: '',
    registration_url: '',
    registration_deadline: ''
  });
  const [savingEvent, setSavingEvent] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  // Teams Moderation state
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  const [teamToDelete, setTeamToDelete] = useState(null);

  // Users Moderation state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res?.success) setStats(res.data);
    } catch (err) {
      console.warn('Could not load admin stats:', err);
    }
  };

  // Fetch Events
  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const res = await api.get('/events', { params: { limit: 100 } });
      if (res?.success) setEvents(res.data.events || []);
    } catch (err) {
      toast.error('Failed to load events: ' + err.message);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Fetch Teams
  const fetchTeams = async () => {
    try {
      setLoadingTeams(true);
      const res = await api.get('/admin/teams', { params: { search: teamSearch, limit: 100 } });
      if (res?.success) setTeams(res.data.teams || []);
    } catch (err) {
      toast.error('Failed to load teams: ' + err.message);
    } finally {
      setLoadingTeams(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get('/admin/users', { params: { search: userSearch, limit: 100 } });
      if (res?.success) setUsers(res.data.users || []);
    } catch (err) {
      toast.error('Failed to load users: ' + err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (activeTab === 'teams') fetchTeams();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  // Handle Event Modal Open (Create vs Edit)
  const handleOpenCreateEvent = () => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      category: 'hackathon',
      start_date: '',
      end_date: '',
      venue: '',
      registration_url: '',
      registration_deadline: ''
    });
    setEventModalOpen(true);
  };

  const handleOpenEditEvent = (event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title || '',
      description: event.description || '',
      category: event.category || 'hackathon',
      start_date: event.start_date ? event.start_date.substring(0, 16) : '',
      end_date: event.end_date ? event.end_date.substring(0, 16) : '',
      venue: event.venue || '',
      registration_url: event.registration_url || '',
      registration_deadline: event.registration_deadline ? event.registration_deadline.substring(0, 16) : ''
    });
    setEventModalOpen(true);
  };

  // Save Event (Create or Update)
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.description.trim() || !eventForm.start_date || !eventForm.end_date || !eventForm.venue.trim()) {
      toast.error('Please fill in all required event details');
      return;
    }

    try {
      setSavingEvent(true);
      const payload = {
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        category: eventForm.category,
        start_date: new Date(eventForm.start_date).toISOString(),
        end_date: new Date(eventForm.end_date).toISOString(),
        venue: eventForm.venue.trim(),
        registration_url: eventForm.registration_url.trim() || null,
        registration_deadline: eventForm.registration_deadline ? new Date(eventForm.registration_deadline).toISOString() : null
      };

      if (editingEvent) {
        const res = await api.put(`/events/${editingEvent.id}`, payload);
        if (res?.success) {
          toast.success('Event updated successfully');
          setEventModalOpen(false);
          fetchEvents();
          fetchStats();
        }
      } else {
        const res = await api.post('/events', payload);
        if (res?.success) {
          toast.success('New event created successfully');
          setEventModalOpen(false);
          fetchEvents();
          fetchStats();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save event');
    } finally {
      setSavingEvent(false);
    }
  };

  // Delete Event
  const handleConfirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      const res = await api.delete(`/events/${eventToDelete.id}`);
      if (res?.success) {
        toast.success(`Event "${eventToDelete.title}" deleted.`);
        setEventToDelete(null);
        fetchEvents();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete event');
    }
  };

  // Delete Inappropriate Team
  const handleConfirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    try {
      const res = await api.delete(`/teams/${teamToDelete.id}`);
      if (res?.success) {
        toast.success(`Team "${teamToDelete.name}" deleted for inappropriate content.`);
        setTeamToDelete(null);
        fetchTeams();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete team');
    }
  };

  // Delete Inappropriate User
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const res = await api.delete(`/admin/users/${userToDelete.id}`);
      if (res?.success) {
        toast.success(`User "${userToDelete.full_name}" deleted.`);
        setUserToDelete(null);
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  // Shift or Update User Role (Promote/Demote)
  const handleChangeUserRole = async (targetUser, newRole) => {
    try {
      const res = await api.patch(`/admin/users/${targetUser.id}/role`, { role: newRole });
      if (res?.success) {
        toast.success(`Role for "${targetUser.full_name}" updated to ${newRole}.`);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update user role');
    }
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Admin Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Campus Admin Panel
            </h1>
            <Badge variant="primary">Admin</Badge>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
            Platform moderation: manage events, monitor teams, and remove inappropriate content.
          </p>
        </div>

        {activeTab === 'events' && (
          <Button variant="primary" icon={<Plus size={18} />} onClick={handleOpenCreateEvent}>
            Add New Event
          </Button>
        )}
      </div>

      {/* Stats Counter Bar */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <Card style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Events</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{stats.total_events}</div>
          </Card>
          <Card style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Teams</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-secondary)' }}>{stats.total_teams}</div>
          </Card>
          <Card style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registered Students</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>{stats.total_users}</div>
          </Card>
          <Card style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Join Requests Processed</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-warning-dark)' }}>{stats.total_requests}</div>
          </Card>
        </div>
      )}

      {/* Tab Switcher */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('events')}
          className={`btn btn-sm ${activeTab === 'events' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <Calendar size={16} /> Manage Events ({events.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('teams')}
          className={`btn btn-sm ${activeTab === 'teams' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <Layers size={16} /> Moderate Teams ({teams.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <Users size={16} /> Student Directory ({users.length})
        </button>
      </div>

      {/* TAB 1: MANAGE EVENTS (CRUD) */}
      {activeTab === 'events' && (
        <div>
          {loadingEvents ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <Spinner size="lg" />
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              icon={<Calendar size={36} />}
              title="No events created yet"
              actionLabel="Create Event"
              onAction={handleOpenCreateEvent}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {events.map((ev) => (
                <Card key={ev.id}>
                  <CardBody style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.375rem' }}>
                        <Badge variant="primary">{ev.category}</Badge>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>{ev.title}</h3>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        <span><MapPin size={13} style={{ verticalAlign: 'middle' }} /> {ev.venue}</span>
                        <span><Calendar size={13} style={{ verticalAlign: 'middle' }} /> {new Date(ev.start_date).toLocaleDateString()} - {new Date(ev.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button variant="secondary" size="sm" icon={<Edit size={14} />} onClick={() => handleOpenEditEvent(ev)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => setEventToDelete(ev)}>
                        Delete
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MODERATE TEAMS */}
      {activeTab === 'teams' && (
        <div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search team name or bio..."
                aria-label="Search teams for moderation"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchTeams()}
                className="input-field"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
            <Button variant="secondary" size="md" onClick={fetchTeams}>
              Search
            </Button>
          </div>

          {loadingTeams ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <Spinner size="lg" />
            </div>
          ) : teams.length === 0 ? (
            <EmptyState title="No teams found" description="No teams match your moderation query." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {teams.map((t) => (
                <Card key={t.id}>
                  <CardBody style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>{t.name}</h3>
                        <Badge variant={t.status === 'open' ? 'success' : 'neutral'}>{t.status}</Badge>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        Event: {t.event?.title || 'Event'} • Leader: {t.leader?.full_name} ({t.leader?.department})
                      </div>
                      {t.description && (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                          "{t.description}"
                        </p>
                      )}
                    </div>

                    <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => setTeamToDelete(t)}>
                      Delete Team
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MODERATE USERS */}
      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search user name or department..."
                aria-label="Search student directory"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                className="input-field"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
            <Button variant="secondary" size="md" onClick={fetchUsers}>
              Search
            </Button>
          </div>

          {loadingUsers ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <Spinner size="lg" />
            </div>
          ) : users.length === 0 ? (
            <EmptyState title="No users found" description="No student profiles match your search criteria." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {users.map((u) => (
                <Card key={u.id}>
                  <CardBody style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '260px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>{u.full_name || 'Unnamed Student'}</h3>
                        <Badge variant={u.role === 'admin' ? 'primary' : 'neutral'}>{u.role}</Badge>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {u.department || 'No department'} • {u.academic_year || 'Year unspecified'}
                      </div>
                      {u.skills?.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '4px' }}>
                          Skills: {u.skills.join(', ')}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {u.role === 'admin' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChangeUserRole(u, 'student')}
                          title="Demote to standard student role"
                        >
                          Demote to Student
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<ShieldCheck size={14} color="var(--color-primary)" />}
                          onClick={() => handleChangeUserRole(u, 'admin')}
                          title="Grant administrator permissions"
                        >
                          Make Admin
                        </Button>
                      )}

                      {u.role !== 'admin' && (
                        <Button variant="danger" size="sm" icon={<UserX size={14} />} onClick={() => setUserToDelete(u)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Event Modal */}
      {eventModalOpen && (
        <Modal
          isOpen={eventModalOpen}
          onClose={() => setEventModalOpen(false)}
          title={editingEvent ? 'Edit Event' : 'Create New Event'}
          footer={
            <>
              <Button variant="ghost" onClick={() => setEventModalOpen(false)} disabled={savingEvent}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveEvent} loading={savingEvent}>
                {editingEvent ? 'Update Event' : 'Publish Event'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveEvent}>
            <Input
              label="Event Title"
              name="title"
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              required
            />

            <Input
              as="select"
              label="Category"
              name="category"
              value={eventForm.category}
              onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
              options={EVENT_CATEGORIES}
              required
            />

            <Input
              as="textarea"
              label="Event Description"
              name="description"
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              rows={3}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Start Date & Time"
                name="start_date"
                type="datetime-local"
                value={eventForm.start_date}
                onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                required
              />

              <Input
                label="End Date & Time"
                name="end_date"
                type="datetime-local"
                value={eventForm.end_date}
                onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                required
              />
            </div>

            <Input
              label="Venue Location"
              name="venue"
              placeholder="e.g. Auditorium Hall B & Hybrid"
              value={eventForm.venue}
              onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
              required
            />

            <Input
              label="Official Registration URL (Optional)"
              name="registration_url"
              placeholder="https://..."
              value={eventForm.registration_url}
              onChange={(e) => setEventForm({ ...eventForm, registration_url: e.target.value })}
            />

            <Input
              label="Registration Deadline (Optional)"
              name="registration_deadline"
              type="datetime-local"
              value={eventForm.registration_deadline}
              onChange={(e) => setEventForm({ ...eventForm, registration_deadline: e.target.value })}
            />
          </form>
        </Modal>
      )}

      {/* Delete Event Confirmation Modal */}
      {eventToDelete && (
        <Modal
          isOpen={Boolean(eventToDelete)}
          onClose={() => setEventToDelete(null)}
          title="Delete Event"
          footer={
            <>
              <Button variant="ghost" onClick={() => setEventToDelete(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleConfirmDeleteEvent}>Yes, Delete Event</Button>
            </>
          }
        >
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-main)' }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text-main)' }}>{eventToDelete.title}</strong>? All associated teams and requests will be deleted.
          </p>
        </Modal>
      )}

      {/* Delete Team Confirmation Modal */}
      {teamToDelete && (
        <Modal
          isOpen={Boolean(teamToDelete)}
          onClose={() => setTeamToDelete(null)}
          title="Delete Team for Moderation"
          footer={
            <>
              <Button variant="ghost" onClick={() => setTeamToDelete(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleConfirmDeleteTeam}>Yes, Delete Inappropriate Team</Button>
            </>
          }
        >
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-main)' }}>
            Are you sure you want to delete team <strong style={{ color: 'var(--text-main)' }}>{teamToDelete.name}</strong>?
          </p>
        </Modal>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <Modal
          isOpen={Boolean(userToDelete)}
          onClose={() => setUserToDelete(null)}
          title="Delete User Account"
          footer={
            <>
              <Button variant="ghost" onClick={() => setUserToDelete(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleConfirmDeleteUser}>Yes, Delete User Account</Button>
            </>
          }
        >
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-main)' }}>
            Are you sure you want to permanently remove <strong style={{ color: 'var(--text-main)' }}>{userToDelete.full_name}</strong> from the platform?
          </p>
        </Modal>
      )}
    </div>
  );
};
