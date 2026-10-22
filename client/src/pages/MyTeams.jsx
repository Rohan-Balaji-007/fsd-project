import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  UserMinus,
  Check,
  X,
  Clock,
  ExternalLink,
  PlusCircle,
  CheckCircle2,
  XCircle,
  LayoutDashboard
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export const MyTeams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('lead'); // 'lead' | 'belong' | 'requests'
  const [teams, setTeams] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Leave team modal state
  const [teamToLeave, setTeamToLeave] = useState(null);
  const [leaving, setLeaving] = useState(false);

  // Cancel request state
  const [cancellingRequestId, setCancellingRequestId] = useState(null);

  const fetchMyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [teamsRes, requestsRes] = await Promise.all([
        api.get('/my-teams'),
        api.get('/requests/mine')
      ]);

      if (teamsRes?.success) setTeams(teamsRes.data || []);
      if (requestsRes?.success) setMyRequests(requestsRes.data || []);
    } catch (err) {
      console.error('Error fetching my teams data:', err);
      setError(err.message || 'Failed to load your team data');
      toast.error('Failed to load your team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyData();
  }, [user]);

  // Handle Leave Team
  const handleConfirmLeaveTeam = async () => {
    if (!teamToLeave || !user) return;

    try {
      setLeaving(true);
      const res = await api.delete(`/teams/${teamToLeave.id}/members/${user.id}`);
      if (res?.success) {
        toast.success(`You have left ${teamToLeave.name}.`);
        setTeamToLeave(null);
        await fetchMyData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to leave team');
    } finally {
      setLeaving(false);
    }
  };

  // Handle Cancel Join Request
  const handleCancelRequest = async (requestId) => {
    try {
      setCancellingRequestId(requestId);
      const res = await api.delete(`/requests/${requestId}`);
      if (res?.success) {
        toast.success('Join application cancelled.');
        setMyRequests((prev) => prev.filter((r) => r.id !== requestId));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel request');
    } finally {
      setCancellingRequestId(null);
    }
  };

  const teamsILead = teams.filter((t) => t.my_role === 'leader' || t.leader_id === user?.id);
  const teamsIBelongTo = teams.filter((t) => t.my_role !== 'leader' && t.leader_id !== user?.id);

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <Spinner size="lg" />
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Loading your teams & requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto' }}>
        <EmptyState
          title="Could not load your teams"
          description={error}
          actionLabel="Try Again"
          onAction={fetchMyData}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            My Teams & Applications
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
            Manage the teams you lead, track memberships, and monitor sent join applications.
          </p>
        </div>

        <Link to="/teams/create">
          <Button variant="primary" size="md" icon={<PlusCircle size={18} />}>
            Create New Team
          </Button>
        </Link>
      </div>

      {/* Segmented Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          background: 'var(--bg-subtle)',
          padding: '4px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2rem',
          border: '1px solid var(--border-light)',
          flexWrap: 'wrap'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('lead')}
          style={{
            flex: 1,
            padding: '0.625rem 1rem',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'lead' ? '#ffffff' : 'transparent',
            boxShadow: activeTab === 'lead' ? 'var(--shadow-sm)' : 'none',
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: activeTab === 'lead' ? 'var(--color-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 150ms',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minWidth: '160px'
          }}
        >
          <Shield size={16} />
          <span>Teams I Lead ({teamsILead.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('belong')}
          style={{
            flex: 1,
            padding: '0.625rem 1rem',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'belong' ? '#ffffff' : 'transparent',
            boxShadow: activeTab === 'belong' ? 'var(--shadow-sm)' : 'none',
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: activeTab === 'belong' ? 'var(--color-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 150ms',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minWidth: '160px'
          }}
        >
          <Users size={16} />
          <span>Teams I Belong To ({teamsIBelongTo.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          style={{
            flex: 1,
            padding: '0.625rem 1rem',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'requests' ? '#ffffff' : 'transparent',
            boxShadow: activeTab === 'requests' ? 'var(--shadow-sm)' : 'none',
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: activeTab === 'requests' ? 'var(--color-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 150ms',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minWidth: '160px'
          }}
        >
          <Clock size={16} />
          <span>My Applications ({myRequests.length})</span>
        </button>
      </div>

      {/* TAB 1: TEAMS I LEAD */}
      {activeTab === 'lead' && (
        <div>
          {teamsILead.length === 0 ? (
            <EmptyState
              icon={<Shield size={36} />}
              title="You haven't created any teams yet"
              description="Step up as team leader: pick a hackathon or expo, register your squad, and recruit students with complementary skills."
              actionLabel="Create Your First Team"
              onAction={() => navigate('/teams/create')}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {teamsILead.map((team) => {
                const openSlots = Math.max(0, team.max_members - (team.member_count || 1));

                return (
                  <Card key={team.id} hoverable style={{ display: 'flex', flexDirection: 'column' }}>
                    <CardHeader>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge variant="primary">Leader</Badge>
                        <Badge variant={team.status === 'open' ? 'success' : team.status === 'full' ? 'warning' : 'danger'}>
                          {team.status}
                        </Badge>
                      </div>

                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {team.member_count} / {team.max_members} members ({openSlots} open)
                      </span>
                    </CardHeader>

                    <CardBody style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.375rem', color: 'var(--text-main)' }}>
                        {team.name}
                      </h3>

                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '0.75rem' }}>
                        {team.event?.title || 'Campus Event'}
                      </div>

                      {team.description && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {team.description}
                        </p>
                      )}
                    </CardBody>

                    <CardFooter style={{ background: '#fafbfc', gap: '0.5rem' }}>
                      <Link to={`/teams/${team.id}/dashboard`} style={{ flex: 1 }}>
                        <Button variant="primary" size="sm" fullWidth icon={<LayoutDashboard size={15} />}>
                          Team Dashboard
                        </Button>
                      </Link>

                      <Link to={`/teams/${team.id}`}>
                        <Button variant="ghost" size="sm" title="View Public Page">
                          <ExternalLink size={16} />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TEAMS I BELONG TO */}
      {activeTab === 'belong' && (
        <div>
          {teamsIBelongTo.length === 0 ? (
            <EmptyState
              icon={<Users size={36} />}
              title="You are not a member of any teams yet"
              description="Browse open squads for upcoming hackathons and submit join requests to team leaders."
              actionLabel="Discover Open Teams"
              onAction={() => navigate('/teams')}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {teamsIBelongTo.map((team) => (
                <Card key={team.id} hoverable style={{ display: 'flex', flexDirection: 'column' }}>
                  <CardHeader>
                    <Badge variant="success">Member</Badge>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {team.member_count} / {team.max_members} members
                    </span>
                  </CardHeader>

                  <CardBody style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.375rem', color: 'var(--text-main)' }}>
                      {team.name}
                    </h3>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {team.event?.title || 'Campus Event'}
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Led by <strong style={{ color: 'var(--text-main)' }}>{team.leader?.full_name || 'Leader'}</strong>
                    </div>

                    {team.description && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {team.description}
                      </p>
                    )}
                  </CardBody>

                  <CardFooter style={{ background: '#fafbfc', gap: '0.5rem' }}>
                    <Link to={`/teams/${team.id}`} style={{ flex: 1 }}>
                      <Button variant="outline" size="sm" fullWidth>
                        View Team Roster
                      </Button>
                    </Link>

                    <Button
                      variant="danger"
                      size="sm"
                      icon={<UserMinus size={15} />}
                      onClick={() => setTeamToLeave(team)}
                    >
                      Leave Team
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MY JOIN REQUESTS */}
      {activeTab === 'requests' && (
        <div>
          {myRequests.length === 0 ? (
            <EmptyState
              icon={<Clock size={36} />}
              title="No join requests submitted"
              description="When you find teams looking for your skills, send a join request and track acceptance here."
              actionLabel="Find a Team"
              onAction={() => navigate('/teams')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myRequests.map((req) => {
                const isPending = req.status === 'pending';
                const isAccepted = req.status === 'accepted';
                const isRejected = req.status === 'rejected';

                return (
                  <Card key={req.id}>
                    <CardBody style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: isAccepted ? 'var(--color-success-light)' : isRejected ? 'var(--color-danger-light)' : 'var(--color-warning-light)',
                            color: isAccepted ? 'var(--color-success)' : isRejected ? 'var(--color-danger)' : 'var(--color-warning-dark)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: '2px'
                          }}
                        >
                          {isAccepted && <CheckCircle2 size={20} />}
                          {isRejected && <XCircle size={20} />}
                          {isPending && <Clock size={20} />}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <Link to={`/teams/${req.team_id}`} style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--text-main)', textDecoration: 'underline' }}>
                              {req.team?.name || 'Target Team'}
                            </Link>

                            <Badge variant={isAccepted ? 'success' : isRejected ? 'danger' : 'warning'}>
                              {req.status}
                            </Badge>
                          </div>

                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            Event: <strong>{req.team?.event?.title || 'Event'}</strong> • Submitted {new Date(req.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>

                          {req.message && (
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', fontStyle: 'italic', marginTop: '6px' }}>
                              "{req.message}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        {isPending && (
                          <Button
                            variant="danger"
                            size="sm"
                            loading={cancellingRequestId === req.id}
                            onClick={() => handleCancelRequest(req.id)}
                          >
                            Cancel Application
                          </Button>
                        )}

                        {isAccepted && (
                          <Link to={`/teams/${req.team_id}`}>
                            <Button variant="outline" size="sm">
                              Go to Team Roster
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Leave Team Confirmation Modal */}
      {teamToLeave && (
        <Modal
          isOpen={Boolean(teamToLeave)}
          onClose={() => setTeamToLeave(null)}
          title="Confirm Leaving Team"
          footer={
            <>
              <Button variant="ghost" onClick={() => setTeamToLeave(null)} disabled={leaving}>
                Stay in Team
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmLeaveTeam}
                loading={leaving}
                icon={<UserMinus size={16} />}
              >
                Yes, Leave Team
              </Button>
            </>
          }
        >
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
            Are you sure you want to leave <strong style={{ color: 'var(--text-main)' }}>{teamToLeave.name}</strong>?
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            The team leader will be notified and your spot will reopen for other applicants.
          </p>
        </Modal>
      )}
    </div>
  );
};
