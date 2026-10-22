import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  ExternalLink,
  Users,
  PlusCircle,
  Clock,
  ArrowLeft,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { calculateSkillMatch } from '../utils/skillMatch.js';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { SkillTag } from '../components/ui/SkillTag.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export const EventDetail = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();

  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventAndTeams = async () => {
      try {
        setLoading(true);
        const [eventRes, teamsRes] = await Promise.all([
          api.get(`/events/${id}`),
          api.get('/teams', { params: { event_id: id } })
        ]);

        if (eventRes?.success) setEvent(eventRes.data);
        if (teamsRes?.success) setTeams(teamsRes.data?.teams || []);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError(err.message || 'Event not found');
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndTeams();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <Spinner size="lg" />
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <EmptyState
          title="Event Not Found"
          description={error || 'The requested event could not be found or may have been removed.'}
          actionLabel="Back to Events"
          onAction={() => window.location.assign('/events')}
        />
      </div>
    );
  }

  const getCategoryBadgeVariant = (cat) => {
    switch (cat) {
      case 'hackathon': return 'primary';
      case 'competition': return 'warning';
      case 'exhibition': return 'success';
      case 'cultural': return 'neutral';
      default: return 'primary';
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Back button */}
      <Link
        to="/events"
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
        <ArrowLeft size={16} /> Back to All Events
      </Link>

      {/* Event Header Banner Card */}
      <Card style={{ marginBottom: '2.5rem' }}>
        <CardBody style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <Badge variant={getCategoryBadgeVariant(event.category)}>
              {event.category}
            </Badge>

            {event.registration_deadline && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--color-warning-dark)', background: 'var(--color-warning-light)', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
                <Clock size={14} />
                <span>Register before {new Date(event.registration_deadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
          </div>

          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1.2 }}>
            {event.title}
          </h1>

          <p style={{ fontSize: '1.0625rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.75rem', maxWidth: '840px' }}>
            {event.description}
          </p>

          {/* Meta details grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              padding: '1.25rem',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                Dates & Duration
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>
                <Calendar size={16} color="var(--color-primary)" />
                <span>{new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                Venue Location
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>
                <MapPin size={16} color="var(--color-secondary)" />
                <span>{event.venue}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                Teams Formed
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>
                <Users size={16} color="var(--color-success)" />
                <span>{teams.length} teams recruiting</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {event.registration_url && (
              <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" size="md" icon={<ExternalLink size={16} />}>
                  Official Event Portal
                </Button>
              </a>
            )}

            <Link to={`/teams/create?event_id=${event.id}`}>
              <Button variant="secondary" size="md" icon={<PlusCircle size={16} />}>
                Create Team for this Event
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      {/* Teams Registered for this Event */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
              Teams Formed for this Event ({teams.length})
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              Join an existing team or recruit squad members to match required skills.
            </p>
          </div>

          <Link to={`/teams/create?event_id=${event.id}`}>
            <Button variant="outline" size="sm" icon={<PlusCircle size={15} />}>
              + Create Team
            </Button>
          </Link>
        </div>

        {teams.length === 0 ? (
          <EmptyState
            icon={<Users size={32} />}
            title="No teams registered yet"
            description="Be the first to register a team for this event and start recruiting teammates!"
            actionLabel="Create the First Team"
            onAction={() => window.location.assign(`/teams/create?event_id=${event.id}`)}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {teams.map((team) => {
              const matchScore = profile?.skills ? calculateSkillMatch(team.required_skills, profile.skills) : 0;
              const openPositions = Math.max(0, team.max_members - (team.member_count || 1));

              return (
                <Card key={team.id} hoverable style={{ display: 'flex', flexDirection: 'column' }}>
                  <CardHeader>
                    <div>
                      <Badge variant={team.status === 'open' ? 'success' : team.status === 'full' ? 'warning' : 'danger'}>
                        {team.status}
                      </Badge>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        {openPositions} {openPositions === 1 ? 'spot' : 'spots'} left
                      </span>
                    </div>

                    {user && team.required_skills?.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: matchScore >= 70 ? 'var(--color-success-light)' : matchScore >= 40 ? 'var(--color-warning-light)' : 'var(--bg-subtle)',
                          color: matchScore >= 70 ? 'var(--color-success-dark)' : matchScore >= 40 ? 'var(--color-warning-dark)' : 'var(--text-muted)',
                          padding: '2px 8px',
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
                    <h3 style={{ fontSize: '1.1875rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                      {team.name}
                    </h3>

                    {team.description && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {team.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '1rem' }}>
                      {team.required_skills?.slice(0, 4).map((skill) => (
                        <SkillTag key={skill} skill={skill} />
                      ))}
                      {team.required_skills?.length > 4 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                          +{team.required_skills.length - 4} more
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                      <ShieldCheck size={14} color="var(--color-primary)" />
                      <span>Led by <strong>{team.leader?.full_name || 'Leader'}</strong></span>
                    </div>
                  </CardBody>

                  <CardFooter style={{ background: '#fafbfc' }}>
                    <Link to={`/teams/${team.id}`} style={{ width: '100%' }}>
                      <Button variant="outline" fullWidth size="sm">
                        View Team & Roster
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
