import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Settings,
  Trash2,
  Save,
  ArrowLeft,
  Calendar,
  Sparkles,
  AlertTriangle,
  UserX,
  Plus
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { calculateSkillMatch, getSkillMatchBreakdown, getSkillMatchBadgeStyle } from '../utils/skillMatch.js';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { SkillTag } from '../components/ui/SkillTag.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export const TeamDashboard = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [team, setTeam] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'members' | 'settings'

  // Edit team form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    required_skills: [],
    max_members: 4,
    status: 'open'
  });
  const [skillInput, setSkillInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Modals & Action loading
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removingMember, setRemovingMember] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [teamRes, reqsRes] = await Promise.all([
        api.get(`/teams/${id}`),
        api.get(`/teams/${id}/requests`)
      ]);

      if (teamRes?.success) {
        setTeam(teamRes.data);
        setEditForm({
          name: teamRes.data.name || '',
          description: teamRes.data.description || '',
          required_skills: teamRes.data.required_skills || [],
          max_members: teamRes.data.max_members || 4,
          status: teamRes.data.status || 'open'
        });
      }
      if (reqsRes?.success) {
        setRequests(reqsRes.data || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      toast.error(err.message || 'Failed to load team dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [id]);

  // Handle Accept / Reject Join Request
  const handleRequestAction = async (requestId, action) => {
    try {
      setProcessingRequestId(requestId);
      const res = await api.patch(`/requests/${requestId}`, { action });

      if (res?.success) {
        toast.success(
          action === 'accept'
            ? 'Applicant accepted! They have been added to the team roster.'
            : 'Join request declined.'
        );
        // Refresh dashboard data
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(`Error processing request (${action}):`, err);
      // Clear, actionable error messages for team full or already handled
      toast.error(err.message || `Failed to ${action} join request`);
      // Re-fetch in case team status was changed
      fetchDashboardData();
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Handle Member Removal
  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      setRemovingMember(true);
      const res = await api.delete(`/teams/${id}/members/${memberToRemove.user_id}`);

      if (res?.success) {
        toast.success(`${memberToRemove.user?.full_name || 'Member'} was removed from the team.`);
        setMemberToRemove(null);
        await fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove member');
    } finally {
      setRemovingMember(false);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast.error('Team name cannot be empty');
      return;
    }

    const currentMemberCount = team?.members?.length || 1;
    if (Number(editForm.max_members) < currentMemberCount) {
      toast.error(`Team already has ${currentMemberCount} members. Max members cannot be less than current roster.`);
      return;
    }

    try {
      setSavingSettings(true);
      const res = await api.put(`/teams/${id}`, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        required_skills: editForm.required_skills,
        max_members: Number(editForm.max_members),
        status: editForm.status
      });

      if (res?.success) {
        toast.success('Team details updated successfully!');
        await fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update team');
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle Delete Team
  const handleConfirmDeleteTeam = async () => {
    try {
      setDeletingTeam(true);
      const res = await api.delete(`/teams/${id}`);

      if (res?.success) {
        toast.success('Team deleted successfully.');
        setDeleteModalOpen(false);
        navigate('/my-teams');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete team');
    } finally {
      setDeletingTeam(false);
    }
  };

  // Skill management in settings
  const handleAddSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (editForm.required_skills.some((item) => item.toLowerCase() === s.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setEditForm((prev) => ({ ...prev, required_skills: [...prev.required_skills, s] }));
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setEditForm((prev) => ({
      ...prev,
      required_skills: prev.required_skills.filter((s) => s !== skillToRemove)
    }));
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <Spinner size="lg" />
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Loading team dashboard...</p>
      </div>
    );
  }

  // Leader authorization guard
  if (!team || (user && team.leader_id !== user.id)) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto' }}>
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--color-danger-light)',
                color: 'var(--color-danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}
            >
              <AlertTriangle size={30} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Access Restricted
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Only the verified leader of this team has administrative access to this dashboard.
            </p>
            <Link to="/my-teams">
              <Button variant="primary">Go to My Teams</Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const openPositions = Math.max(0, team.max_members - (team.members?.length || 1));

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Back link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <Link
          to={`/teams/${team.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          <ArrowLeft size={16} /> Public Team Page
        </Link>

        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Leader Dashboard
        </span>
      </div>

      {/* Header Banner Card */}
      <Card style={{ marginBottom: '2rem' }}>
        <CardBody style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.375rem' }}>
                <Badge variant="primary">Leader Mode</Badge>
                <Badge variant={team.status === 'open' ? 'success' : team.status === 'full' ? 'warning' : 'danger'}>
                  {team.status}
                </Badge>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {team.members?.length || 1} / {team.max_members} members ({openPositions} open)
                </span>
              </div>

              <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                {team.name}
              </h1>

              {team.event && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  <Calendar size={14} />
                  <span>{team.event.title}</span>
                </div>
              )}
            </div>

            {/* Quick Status Stats */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '0.75rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {pendingRequests.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Pending Requests
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '0.75rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: openPositions > 0 ? 'var(--color-success)' : 'var(--color-warning-dark)' }}>
                  {openPositions}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Open Slots
                </div>
              </div>
            </div>
          </div>
        </CardBody>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderTop: '1px solid var(--border-light)',
            background: '#fafbfc',
            padding: '0 1.5rem'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '1rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9375rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'requests' ? 'var(--color-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'requests' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Clock size={16} />
            <span>Join Requests</span>
            {pendingRequests.length > 0 && (
              <span
                style={{
                  background: 'var(--color-danger)',
                  color: '#fff',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            style={{
              padding: '1rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9375rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'members' ? 'var(--color-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'members' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Users size={16} />
            <span>Team Roster ({team.members?.length || 1})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '1rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9375rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'settings' ? 'var(--color-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'settings' ? '2px solid var(--color-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Settings size={16} />
            <span>Edit Team & Settings</span>
          </button>
        </div>
      </Card>

      {/* TAB 1: PENDING JOIN REQUESTS */}
      {activeTab === 'requests' && (
        <div>
          {pendingRequests.length === 0 ? (
            <EmptyState
              icon={<Clock size={32} />}
              title="No pending join requests"
              description="When students interested in your project request to join, you will see their complete profile, skills, and match percentage here."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {pendingRequests.map((req) => {
                const applicant = req.applicant || {};
                const matchScore = calculateSkillMatch(team.required_skills, applicant.skills || []);
                const badgeStyle = getSkillMatchBadgeStyle(matchScore);
                const { matchedSkills, missingSkills } = getSkillMatchBreakdown(team.required_skills, applicant.skills || []);
                const isProcessing = processingRequestId === req.id;

                return (
                  <Card key={req.id}>
                    <CardBody style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                        {/* Applicant identity */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          {applicant.avatar_url ? (
                            <img
                              src={applicant.avatar_url}
                              alt={applicant.full_name}
                              style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: 'var(--color-primary)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '1.125rem'
                              }}
                            >
                              {applicant.full_name ? applicant.full_name[0].toUpperCase() : 'A'}
                            </div>
                          )}

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {applicant.full_name}
                              </h3>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Applied {new Date(req.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                              {applicant.department || 'Student'} • {applicant.academic_year || 'College'}
                            </div>
                          </div>
                        </div>

                        {/* Match % Badge */}
                        <div
                          style={{
                            background: badgeStyle.bg,
                            color: badgeStyle.color,
                            border: `1px solid ${badgeStyle.border}`,
                            padding: '4px 12px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Sparkles size={14} />
                          <span>{matchScore}% Skill Match</span>
                        </div>
                      </div>

                      {/* Introductory Note */}
                      {req.message && (
                        <div
                          style={{
                            background: 'var(--bg-subtle)',
                            padding: '0.875rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem',
                            color: 'var(--text-main)',
                            fontStyle: 'italic',
                            marginBottom: '1rem',
                            borderLeft: '3px solid var(--color-primary)'
                          }}
                        >
                          "{req.message}"
                        </div>
                      )}

                      {/* Skills analysis */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                          Applicant's Skills Breakdown:
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {matchedSkills.map((s) => (
                            <span
                              key={s}
                              style={{
                                background: 'var(--color-success-light)',
                                color: 'var(--color-success-dark)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <CheckCircle2 size={12} /> {s}
                            </span>
                          ))}

                          {applicant.skills
                            ?.filter((s) => !matchedSkills.some((ms) => ms.toLowerCase() === s.toLowerCase()))
                            .map((otherSkill) => (
                              <span
                                key={otherSkill}
                                style={{
                                  background: '#f1f5f9',
                                  color: '#475569',
                                  border: '1px solid #cbd5e1',
                                  padding: '3px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {otherSkill}
                              </span>
                            ))}
                        </div>
                      </div>

                      {/* Action Buttons: Accept / Reject */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '0.75rem',
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: '1rem'
                        }}
                      >
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<XCircle size={15} />}
                          onClick={() => handleRequestAction(req.id, 'reject')}
                          disabled={isProcessing}
                        >
                          Decline Request
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          icon={<CheckCircle2 size={15} />}
                          loading={isProcessing}
                          onClick={() => handleRequestAction(req.id, 'accept')}
                        >
                          Accept Member
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TEAM ROSTER & REMOVE MEMBER */}
      {activeTab === 'members' && (
        <div>
          <Card>
            <CardHeader>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  Confirmed Team Roster
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Manage current members. If a member is removed and the team was full, status resets to open.
                </p>
              </div>

              <Badge variant="neutral">
                {team.members?.length || 1} / {team.max_members} Slots Filled
              </Badge>
            </CardHeader>

            <CardBody style={{ padding: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {team.members?.map((member) => {
                  const isLeader = member.user?.id === team.leader_id;

                  return (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {member.user?.avatar_url ? (
                          <img
                            src={member.user.avatar_url}
                            alt={member.user.full_name}
                            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              background: isLeader ? 'var(--color-primary)' : '#94a3b8',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700
                            }}
                          >
                            {member.user?.full_name ? member.user.full_name[0].toUpperCase() : 'M'}
                          </div>
                        )}

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                              {member.user?.full_name}
                            </span>
                            <Badge variant={isLeader ? 'primary' : 'neutral'} style={{ fontSize: '0.6875rem' }}>
                              {isLeader ? 'Leader' : 'Member'}
                            </Badge>
                          </div>

                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            {member.user?.department || 'Student'} • Joined {new Date(member.joined_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isLeader ? (
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Team Creator
                          </span>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<UserX size={15} />}
                            onClick={() => setMemberToRemove(member)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* TAB 3: EDIT TEAM DETAILS & DANGER ZONE */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Edit Details Card */}
          <Card>
            <CardHeader>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  Edit Team Details
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Update your team name, description, required skills, capacity, or recruitment status.
                </p>
              </div>
            </CardHeader>

            <CardBody>
              <form onSubmit={handleSaveSettings}>
                <Input
                  label="Team Name"
                  name="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />

                <Input
                  as="textarea"
                  label="Project Description & Mission"
                  name="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <Input
                    label="Max Members"
                    name="max_members"
                    type="number"
                    min={team.members?.length || 2}
                    max={20}
                    value={editForm.max_members}
                    onChange={(e) => setEditForm({ ...editForm, max_members: Number(e.target.value) })}
                    helperText={`Cannot be lower than current roster count (${team.members?.length || 1})`}
                    required
                  />

                  <Input
                    as="select"
                    label="Recruitment Status"
                    name="status"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    options={[
                      { label: 'Open (Recruiting Teammates)', value: 'open' },
                      { label: 'Full (Roster Complete)', value: 'full' },
                      { label: 'Closed (Paused Recruitment)', value: 'closed' }
                    ]}
                  />
                </div>

                {/* Required Skills Tag Input */}
                <div className="form-group">
                  <label className="form-label">Required Skills</label>
                  <div className="tag-input-container">
                    {editForm.required_skills.map((skill) => (
                      <SkillTag
                        key={skill}
                        skill={skill}
                        onRemove={handleRemoveSkill}
                      />
                    ))}

                    <input
                      type="text"
                      placeholder="Add required skill & press Enter"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      className="tag-input-field"
                    />

                    {skillInput.trim() && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAddSkill}
                      >
                        <Plus size={14} /> Add
                      </Button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={savingSettings}
                    icon={<Save size={16} />}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          {/* Danger Zone: Delete Team */}
          <Card style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <CardHeader style={{ background: 'var(--color-danger-light)' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-danger-dark)' }}>
                  Danger Zone
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-danger-dark)' }}>
                  Irreversible administrative actions for this team
                </p>
              </div>
            </CardHeader>

            <CardBody style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Delete this Team
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Deleting this team will remove all member assignments and cancel any pending join requests.
                </p>
              </div>

              <Button
                variant="danger"
                size="md"
                icon={<Trash2 size={16} />}
                onClick={() => setDeleteModalOpen(true)}
              >
                Delete Team
              </Button>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <Modal
          isOpen={Boolean(memberToRemove)}
          onClose={() => setMemberToRemove(null)}
          title="Remove Team Member"
          footer={
            <>
              <Button variant="ghost" onClick={() => setMemberToRemove(null)} disabled={removingMember}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmRemoveMember}
                loading={removingMember}
                icon={<UserX size={16} />}
              >
                Yes, Remove Member
              </Button>
            </>
          }
        >
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
            Are you sure you want to remove <strong style={{ color: 'var(--text-main)' }}>{memberToRemove.user?.full_name}</strong> from <strong style={{ color: 'var(--text-main)' }}>{team.name}</strong>?
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            They will receive a notification and will need to submit a new join request to re-enter.
          </p>
        </Modal>
      )}

      {/* Delete Team Confirmation Modal */}
      {deleteModalOpen && (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Team Permanently"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleteModalOpen(false)} disabled={deletingTeam}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDeleteTeam}
                loading={deletingTeam}
                icon={<Trash2 size={16} />}
              >
                Permanently Delete Team
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--color-danger)', marginTop: '2px' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                This action cannot be undone.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Team <strong style={{ color: 'var(--text-main)' }}>{team.name}</strong> and all associated member links will be permanently deleted from the database.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
