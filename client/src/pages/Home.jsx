import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Users,
  Sparkles,
  Trophy,
  ArrowRight,
  Calendar,
  MapPin,
  CheckCircle2,
  PlusCircle,
  Search
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardFooter } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';

export const Home = () => {
  const { user } = useAuth();
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoadingEvents(true);
        const res = await api.get('/events', { params: { limit: 3 } });
        if (res?.success && res?.data) {
          setFeaturedEvents(res.data.events || []);
        }
      } catch (err) {
        console.warn('Could not load featured events:', err.message);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          textAlign: 'center',
          padding: '3rem 1rem 4rem',
          maxWidth: '920px',
          margin: '0 auto'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8125rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            marginBottom: '1.5rem',
            border: '1px solid rgba(79, 70, 229, 0.2)'
          }}
        >
          <Sparkles size={14} />
          <span>Automated Skill-Matching for Collegiate Teams</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: 'var(--text-main)',
            marginBottom: '1.25rem'
          }}
        >
          Build Winning Teams for College Hackathons & Expos
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            maxWidth: '720px',
            margin: '0 auto 2.25rem'
          }}
        >
          Connect with campus innovators with complementary skills. Discover hackathons, form squads, track join requests, and ship award-winning projects together.
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Link to="/teams">
            <Button variant="primary" size="lg" icon={<Search size={18} />}>
              Find a Team
            </Button>
          </Link>

          <Link to="/events">
            <Button variant="secondary" size="lg" icon={<Compass size={18} />}>
              Browse Events
            </Button>
          </Link>

          {user && (
            <Link to="/teams/create">
              <Button variant="outline" size="lg" icon={<PlusCircle size={18} />}>
                Create Team
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ padding: '3.5rem 0', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            How TeamUp Works
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            From finding collegiate competitions to finalizing your team roster in 4 simple steps.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <Card style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem'
              }}
            >
              1
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Discover Events</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Browse upcoming campus hackathons, ICPC competitive coding challenges, engineering expos, and game jams.
            </p>
          </Card>

          <Card style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-secondary-light)',
                color: 'var(--color-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem'
              }}
            >
              2
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Skill Matching</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Our automated matching formula calculates your compatibility percentage against open positions on every team.
            </p>
          </Card>

          <Card style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-success-light)',
                color: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem'
              }}
            >
              3
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Atomic Roster Lock</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Team leaders review incoming requests and approve members atomically with zero race conditions or overfilling.
            </p>
          </Card>

          <Card style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-lg)',
                background: '#fef3c7',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem'
              }}
            >
              4
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Collaborate & Win</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Get notified of status updates in real time, build high-impact tech prototypes, and take home the trophy.
            </p>
          </Card>
        </div>
      </section>

      {/* Featured Events from DB */}
      <section style={{ padding: '3.5rem 0', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
              Featured Campus Events
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              Upcoming competitions with open team recruitment slots.
            </p>
          </div>

          <Link to="/events">
            <Button variant="ghost" size="sm" icon={<ArrowRight size={16} />}>
              View All Events
            </Button>
          </Link>
        </div>

        {loadingEvents ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Spinner size="md" />
          </div>
        ) : featuredEvents.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No upcoming events scheduled right now.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {featuredEvents.map((event) => (
              <Card key={event.id} hoverable style={{ display: 'flex', flexDirection: 'column' }}>
                <CardBody style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <Badge variant={event.category === 'hackathon' ? 'primary' : event.category === 'competition' ? 'warning' : 'success'}>
                      {event.category}
                    </Badge>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(event.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1875rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                    {event.title}
                  </h3>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {event.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    <MapPin size={15} color="var(--color-primary)" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.venue}</span>
                  </div>
                </CardBody>

                <CardFooter style={{ background: '#fafbfc' }}>
                  <Link to={`/events/${event.id}`} style={{ width: '100%' }}>
                    <Button variant="outline" fullWidth size="sm" icon={<ArrowRight size={16} />}>
                      View Event & Teams
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Call to Action Banner */}
      <section
        style={{
          marginTop: '2rem',
          background: 'linear-gradient(135deg, var(--color-primary), #6366f1)',
          color: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, marginBottom: '0.75rem' }}>
          Ready to Find Your Dream Teammates?
        </h2>
        <p style={{ fontSize: '1.0625rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 1.75rem' }}>
          Create your verified student profile, showcase your technical skills, and connect with peers ready to build.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {user ? (
            <Link to="/teams/create">
              <Button variant="secondary" size="lg" icon={<PlusCircle size={18} />}>
                Create Your Team Now
              </Button>
            </Link>
          ) : (
            <Link to="/register">
              <Button variant="secondary" size="lg" icon={<CheckCircle2 size={18} />}>
                Join TeamUp for Free
              </Button>
            </Link>
          )}
          <Link to="/teams">
            <Button
              variant="outline"
              size="lg"
              style={{ color: '#ffffff', borderColor: '#ffffff', background: 'rgba(255,255,255,0.1)' }}
            >
              Browse Open Teams
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
