import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Sparkles,
  Send,
  ShieldCheck,
  Check,
  Clock,
  Filter,
  ArrowUpDown,
  Building2,
  Calendar
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { calculateSkillMatch, getSkillMatchBadgeStyle } from '../utils/skillMatch.js';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { SkillTag } from '../components/ui/SkillTag.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export const Teams = () => {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const eventFilter = searchParams.get('event_id') || '';

  const [teams, setTeams] = useState([]);
  const [events, setEvents] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [sortBy, setSortBy] = useState('best_match'); // 'best_match' | 'newest' | 'open_slots'

  // Request to Join Modal State
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  // Load events for filter dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events', { params: { limit: 50 } });
        if (res?.success && res?.data) {
          setEvents(res.data.events || []);
        }
      } catch (err) {
        console.warn('Could not load events dropdown:', err);
      }
    };
    fetchEvents();
  }, []);

  // Load personal requests to detect already pending applications
  const fetchMyRequests = async () => {
    if (!user) return;
    try {
      const res = await api.get('/requests/mine');
      if (res?.success && res?.data) {
        setMyRequests(res.data || []);
      }
    } catch (err) {
      console.warn('Could not load my requests:', err);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, [user]);

  // Load Teams from backend
  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (eventFilter) params.event_id = eventFilter;
      if (search.trim()) params.search = search.trim();
      if (departmentFilter.trim()) params.department = departmentFilter.trim();
      if (skillFilter.trim()) params.skills = skillFilter.trim();
      if (onlyOpen) params.only_open = 'true';

      const res = await api.get('/teams', { params });
      if (res?.success && res?.data) {
        setTeams(res.data.teams || []);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError(err.message || 'Unable to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchTeams, 250);
    return () => clearTimeout(timer);
  }, [eventFilter, search, departmentFilter, skillFilter, onlyOpen]);

  // Sorted teams computation (including "Best match" sort option)
  const sortedTeams = useMemo(() => {
    const list = [...teams];

    return list.sort((a, b) => {
      if (sortBy === 'best_match') {
        const scoreA = profile?.skills ? calculateSkillMatch(a.required_skills, profile.skills) : 0;
        const scoreB = profile?.skills ? calculateSkillMatch(b.required_skills, profile.skills) : 0;
        return scoreB - scoreA;
      }
      if (sortBy === 'open_slots') {
        const openA = Math.max(0, a.max_members - (a.member_count || 1));
        const openB = Math.max(0, b.max_members - (b.member_count || 1));
        return openB - openA;
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });
  }, [teams, sortBy, profile]);

  // Handle Send Join Request
  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedTeam) return;

    try {
      setSendingRequest(true);
      const res = await api.post(`/teams/${selectedTeam.id}/requests`, {
        message: requestMessage.trim()
      });

      if (res?.success) {
        toast.success(`Join request sent to ${selectedTeam.name}'s leader!`);
        setSelectedTeam(null);
        setRequestMessage('');
        fetchMyRequests();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send join request');
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Find a Team
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
            {eventFilter ? 'Filtering teams for the selected event.' : 'Browse collegiate squads recruiting members with your skills.'}
          </p>
        </div>

        <Link to="/teams/create">
          <Button variant="primary" size="md" icon={<Plus size={18} />}>
            Create Team
          </Button>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {/* Search by team name */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search team name or bio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          {/* Event Filter dropdown */}
          <div>
            <select
              value={eventFilter}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  setSearchParams({ event_id: val });
                } else {
                  setSearchParams({});
                }
              }}
              className="select-field"
            >
              <option value="">All Events</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter input */}
          <div style={{ position: 'relative' }}>
            <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Filter by Department..."
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          {/* Skill Filter input */}
          <div style={{ position: 'relative' }}>
            <Sparkles size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Filter required skill (e.g. React)..."
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
        </div>

        {/* Bottom controls: Open only + Sort By */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={(e) => setOnlyOpen(e.target.checked)}
              style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
            />
            Show only teams with open positions
          </label>

          {/* Sort By Dropdown (includes "Best match") */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpDown size={14} /> Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="select-field"
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', width: 'auto' }}
            >
              <option value="best_match">✨ Best Skill Match</option>
              <option value="newest">🕒 Newest Teams</option>
              <option value="open_slots">👥 Most Open Positions</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Matching teams...</p>
        </div>
      ) : error ? (
        <EmptyState
          title="Failed to load teams"
          description={error}
          actionLabel="Try Again"
          onAction={fetchTeams}
        />
      ) : sortedTeams.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title="No teams match your search"
          description="Try broadening your department or skill filters, or create a team and invite others."
          actionLabel="Create Team"
          onAction={() => window.location.assign('/teams/create')}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {sortedTeams.map((team) => {
            const isLeader = user && team.leader_id === user.id;
            const isMember = user && team.members?.some((m) => m.user?.id === user.id);
            const isFull = team.status === 'full' || (team.member_count >= team.max_members);
            const isPending = Boolean(
              myRequests.some((r) => r.team_id === team.id && r.status === 'pending')
            );

            const matchScore = profile?.skills
              ? calculateSkillMatch(team.required_skills, profile.skills)
              : 0;

            const badgeStyle = getSkillMatchBadgeStyle(matchScore);
            const openPositions = Math.max(0, team.max_members - (team.member_count || 1));

            return (
              <Card key={team.id} hoverable style={{ display: 'flex', flexDirection: 'column' }}>
                <CardHeader>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge variant={team.status === 'open' ? 'success' : team.status === 'full' ? 'warning' : 'danger'}>
                      {team.status}
                    </Badge>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {openPositions} open {openPositions === 1 ? 'position' : 'positions'}
                    </span>
                  </div>

                  {/* Colored Skill Match Badge */}
                  {user && team.required_skills?.length > 0 && (
                    <div
                      title="Calculated using: round(matched_skills / total_required * 100)"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: badgeStyle.bg,
                        color: badgeStyle.color,
                        border: `1px solid ${badgeStyle.border}`,
                        padding: '3px 9px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      <Sparkles size={12} />
                      <span>{matchScore}% match</span>
                    </div>
                  )}
                </CardHeader>

                <CardBody style={{ flex: 1 }}>
                  <Link to={`/teams/${team.id}`}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                      {team.name}
                    </h3>
                  </Link>

                  {team.event && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      <span>{team.event.title}</span>
                    </div>
                  )}

                  {team.description && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {team.description}
                    </p>
                  )}

                  {/* Required skills with match status highlighting */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.375rem', textTransform: 'uppercase' }}>
                      Required Skills:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {team.required_skills?.length > 0 ? (
                        team.required_skills.map((skill) => {
                          const isMatched = profile?.skills?.some(
                            (ps) => ps.trim().toLowerCase() === skill.trim().toLowerCase()
                          );
                          return (
                            <SkillTag
                              key={skill}
                              skill={skill}
                              matched={isMatched}
                            />
                          );
                        })
                      ) : (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Open to all skills</span>
                      )}
                    </div>
                  </div>

                  {/* Leader info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    <ShieldCheck size={16} color="var(--color-primary)" />
                    <span>
                      Led by <strong style={{ color: 'var(--text-main)' }}>{team.leader?.full_name || 'Leader'}</strong>
                      {team.leader?.department ? ` • ${team.leader.department}` : ''}
                    </span>
                  </div>
                </CardBody>

                {/* Footer with Business Rule Button Guards */}
                <CardFooter style={{ background: '#fafbfc' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <Link to={`/teams/${team.id}`} style={{ flex: 1 }}>
                      <Button variant="outline" size="sm" fullWidth>
                        Details
                      </Button>
                    </Link>

                    {/* Do not show Request button to leader, existing members, or on full teams */}
                    {isLeader ? (
                      <Badge variant="primary" style={{ padding: '0.375rem 0.75rem' }}>
                        Leader
                      </Badge>
                    ) : isMember ? (
                      <Badge variant="success" style={{ padding: '0.375rem 0.75rem' }}>
                        Member
                      </Badge>
                    ) : isPending ? (
                      /* Show "Pending" if already requested */
                      <Badge variant="warning" style={{ padding: '0.375rem 0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> Pending
                      </Badge>
                    ) : isFull ? (
                      <Badge variant="neutral" style={{ padding: '0.375rem 0.75rem' }}>
                        Full
                      </Badge>
                    ) : !user ? (
                      <Link to="/login">
                        <Button variant="primary" size="sm">
                          Log in
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Send size={14} />}
                        onClick={() => setSelectedTeam(team)}
                      >
                        Request
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Join Request Modal */}
      {selectedTeam && (
        <Modal
          isOpen={Boolean(selectedTeam)}
          onClose={() => setSelectedTeam(null)}
          title={`Request to join ${selectedTeam.name}`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setSelectedTeam(null)} disabled={sendingRequest}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSendRequest}
                loading={sendingRequest}
                icon={<Send size={16} />}
              >
                Send Request
              </Button>
            </>
          }
        >
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Your application and skills will be sent to the team leader (<strong style={{ color: 'var(--text-main)' }}>{selectedTeam.leader?.full_name}</strong>).
            </p>

            <Input
              as="textarea"
              label="Introductory Note (Optional)"
              name="requestMessage"
              placeholder="Hi! I have experience with the required tech stack and would love to build this with you..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              rows={3}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
