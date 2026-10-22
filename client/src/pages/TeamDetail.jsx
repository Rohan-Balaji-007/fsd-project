import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Clock,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getSkillMatchBreakdown, getSkillMatchBadgeStyle } from '../utils/skillMatch.js';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { SkillTag } from '../components/ui/SkillTag.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export const TeamDetail = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User's existing requests check
  const [myPendingRequest, setMyPendingRequest] = useState(null);

  // Request to Join Modal state
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/teams/${id}`);
      if (res?.success && res?.data) {
        setTeam(res.data);
      } else {
        setError('Team not found');
      }

      // If user is logged in, check if they already requested this team
      if (user) {
        try {
          const reqRes = await api.get('/requests/mine');
          if (reqRes?.success && reqRes?.data) {
            const existing = reqRes.data.find(
              (r) => r.team_id === id && r.status === 'pending'
            );
            setMyPendingRequest(existing || null);
          }
        } catch (err) {
          console.warn('Could not check personal requests:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching team details:', err);
      setError(err.message || 'Team not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamDetails();
  }, [id, user]);

  const handleSendJoinRequest = async (e) => {
    e.preventDefault();
    try {
      setSendingRequest(true);
      const res = await api.post(`/teams/${id}/requests`, {
        message: requestMessage.trim()
      });

      if (res?.success) {
        toast.success('Join request sent successfully!');
        setRequestModalOpen(false);
        setRequestMessage('');
        setMyPendingRequest(res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send request');
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <Spinner size="lg" />
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Loading team details...</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <EmptyState
          title="Team Not Found"
          description={error || 'The requested team does not exist or may have been deleted.'}
          actionLabel="Back to Teams"
          onAction={() => navigate('/teams')}
        />
      </div>
    );
  }

  // Business Rules Checks:
  const isLeader = user && team.leader_id === user.id;
  const isMember = user && team.members?.some((m) => m.user?.id === user.id);
  const isFull = team.status === 'full' || (team.member_count >= team.max_members);
  const isPending = Boolean(myPendingRequest);

  // Skill Compatibility breakdown
  const { matchPercentage, matchedSkills, missingSkills } = getSkillMatchBreakdown(
    team.required_skills || [],
    profile?.skills || []
  );

  const badgeStyle = getSkillMatchBadgeStyle(matchPercentage);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Back link */}
      <Link
        to={team.event_id ? `/events/${team.event_id}` : '/teams'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          fontWeight: 500,
          marginBottom: '1.5rem'
        }}
      >
        <ArrowLeft size={16} /> Back to {team.event?.title || 'Teams'}
      </Link>

      {/* Main Team Overview Card */}
      <Card style={{ marginBottom: '2rem' }}>
        <CardBody style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                <Badge variant={team.status === 'open' ? 'success' : team.status === 'full' ? 'warning' : 'danger'}>
                  {team.status}
                </Badge>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {team.member_count} of {team.max_members} members recruited
                </span>
              </div>

              <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                {team.name}
              </h1>

              {team.event && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9375rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  <Calendar size={16} />
                  <Link to={`/events/${team.event.id}`} style={{ textDecoration: 'underline' }}>
                    {team.event.title}
                  </Link>
                </div>
              )}
            </div>

            {/* Match percentage ring / card if user logged in */}
            {user && team.required_skills?.length > 0 && (
              <div
                style={{
                  background: badgeStyle.bg,
                  border: `1px solid ${badgeStyle.border}`,
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center',
                  minWidth: '150px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: badgeStyle.color, fontWeight: 800, fontSize: '1.75rem' }}>
                  <Sparkles size={20} />
                  <span>{matchPercentage}%</span>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: badgeStyle.color, textTransform: 'uppercase' }}>
                  {badgeStyle.label}
                </div>
              </div>
            )}
          </div>

          {team.description && (
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
              {team.description}
            </p>
          )}

          {/* Action Button Area with Business Rule Guards */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
            {isLeader ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge variant="primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                  <Shield size={16} /> You are the Team Leader
                </Badge>
                <Link to="/my-teams">
                  <Button variant="secondary" size="md">
                    Manage Team & Requests
                  </Button>
                </Link>
              </div>
            ) : isMember ? (
              <Badge variant="success" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                <UserCheck size={16} /> You are an Active Member
              </Badge>
            ) : isPending ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge variant="warning" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                  <Clock size={16} /> Join Request Pending Review
                </Badge>
                <Link to="/my-teams">
                  <Button variant="ghost" size="sm">
                    View My Requests
                  </Button>
                </Link>
              </div>
            ) : isFull ? (
              <Button variant="secondary" size="md" disabled>
                Team is Full ({team.max_members}/{team.max_members})
              </Button>
            ) : !user ? (
              <Link to="/login">
                <Button variant="primary" size="lg" icon={<Send size={18} />}>
                  Log in to Request to Join
                </Button>
              </Link>
            ) : (
              <Button
                variant="primary"
                size="lg"
                icon={<Send size={18} />}
                onClick={() => setRequestModalOpen(true)}
              >
                Request to Join Team
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Grid: Skill Compatibility Breakdown + Team Roster */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Card 1: Skill Compatibility Breakdown */}
        <Card>
          <CardHeader>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--color-primary)" />
              Skill Compatibility Breakdown
            </h3>
          </CardHeader>

          <CardBody>
            {team.required_skills?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                This team has not specified any required technical skills. All enthusiastic students are welcome to apply!
              </p>
            ) : (
              <div>
                {/* Matched Skills */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-success-dark)', marginBottom: '0.625rem' }}>
                    <CheckCircle2 size={16} />
                    <span>Skills You Possess ({matchedSkills.length})</span>
                  </div>

                  {matchedSkills.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {matchedSkills.map((skill) => (
                        <span
                          key={skill}
                          style={{
                            background: 'var(--color-success-light)',
                            color: 'var(--color-success-dark)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <CheckCircle2 size={13} /> {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {user ? 'None of your listed skills currently match.' : 'Log in to see how your skills match.'}
                    </p>
                  )}
                </div>

                {/* Missing Skills */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 700, color: '#b45309', marginBottom: '0.625rem' }}>
                    <AlertCircle size={16} />
                    <span>Skills Still Needed ({missingSkills.length})</span>
                  </div>

                  {missingSkills.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {missingSkills.map((skill) => (
                        <span
                          key={skill}
                          style={{
                            background: '#fffbeb',
                            color: '#b45309',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8125rem',
                            fontWeight: 500
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-success-dark)', fontWeight: 600 }}>
                      🎉 You match 100% of the team's required skills!
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Card 2: Current Team Roster */}
        <Card>
          <CardHeader>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="var(--color-secondary)" />
              Team Roster ({team.members?.length || 1} / {team.max_members})
            </h3>
          </CardHeader>

          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Leader */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '0.875rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary-light)',
                border: '1px solid rgba(79, 70, 229, 0.2)'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1rem'
                }}
              >
                {team.leader?.full_name ? team.leader.full_name[0].toUpperCase() : 'L'}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{team.leader?.full_name}</span>
                  <Badge variant="primary" style={{ fontSize: '0.6875rem' }}>Leader</Badge>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {team.leader?.department || 'Engineering'}
                </div>
              </div>
            </div>

            {/* Other Members */}
            {team.members
              ?.filter((m) => m.user?.id !== team.leader_id)
              .map((member) => (
                <div
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '0.875rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: '#94a3b8',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1rem'
                    }}
                  >
                    {member.user?.full_name ? member.user.full_name[0].toUpperCase() : 'M'}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{member.user?.full_name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {member.user?.department || 'Student'} • Member
                    </div>
                  </div>
                </div>
              ))}

            {/* Open slots indicator */}
            {team.max_members - (team.members?.length || 1) > 0 && (
              <div
                style={{
                  padding: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-light)',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem'
                }}
              >
                + {team.max_members - (team.members?.length || 1)} open slot(s) awaiting teammates
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Request to Join Modal */}
      {requestModalOpen && (
        <Modal
          isOpen={requestModalOpen}
          onClose={() => setRequestModalOpen(false)}
          title={`Join ${team.name}`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setRequestModalOpen(false)} disabled={sendingRequest}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSendJoinRequest}
                loading={sendingRequest}
                icon={<Send size={16} />}
              >
                Submit Application
              </Button>
            </>
          }
        >
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Your profile skills ({profile?.skills?.join(', ') || 'None listed'}) will be shared with the team leader.
            </p>

            <Input
              as="textarea"
              label="Introductory Message (Optional)"
              name="requestMessage"
              placeholder="Hi! I saw you need teammates for this event. Here is what I can contribute..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              rows={4}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
