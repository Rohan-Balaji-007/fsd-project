import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Search, Tag, Users, ArrowRight } from 'lucide-react';
import { api } from '../services/api.js';
import { Card, CardBody, CardFooter } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

const CATEGORIES = [
  { label: 'All Events', value: '' },
  { label: 'Hackathons', value: 'hackathon' },
  { label: 'Competitions', value: 'competition' },
  { label: 'Exhibitions', value: 'exhibition' },
  { label: 'Cultural & Jams', value: 'cultural' }
];

export const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/events', { params });
      if (res?.success && res?.data) {
        setEvents(res.data.events || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message || 'Unable to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedCategory, search]);

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
    <div>
      {/* Hero Header */}
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.75rem' }}>
          Explore Campus Events & Competitions
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.0625rem', maxWidth: '640px', margin: '0 auto' }}>
          Form teams with students possessing complementary skills and build award-winning projects.
        </p>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          background: '#ffffff',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Category Pill Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={`btn btn-sm ${selectedCategory === cat.value ? 'btn-primary' : 'btn-secondary'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', minWidth: '240px', flex: '1', maxWidth: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search events, venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.25rem', fontSize: '0.875rem' }}
          />
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '0.9375rem' }}>Loading events...</p>
        </div>
      ) : error ? (
        <EmptyState
          title="Failed to load events"
          description={error}
          actionLabel="Try Again"
          onAction={fetchEvents}
        />
      ) : events.length === 0 ? (
        <EmptyState
          title="No events found"
          description="Try clearing your search filters or check back later for newly announced hackathons and expos."
          actionLabel="Clear Filters"
          onAction={() => { setSelectedCategory(''); setSearch(''); }}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {events.map((event) => (
            <Card key={event.id} hoverable style={{ display: 'flex', flexDirection: 'column' }}>
              <CardBody style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Badge variant={getCategoryBadgeVariant(event.category)}>
                    {event.category}
                  </Badge>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Starts {new Date(event.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1875rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)', lineHeight: 1.3 }}>
                  {event.title}
                </h3>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {event.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={15} color="var(--color-primary)" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.venue}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={15} color="var(--color-secondary)" />
                    <span>
                      {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardBody>

              <CardFooter style={{ background: '#fafbfc' }}>
                <Link to={`/teams?event_id=${event.id}`} style={{ width: '100%' }}>
                  <Button variant="outline" fullWidth size="sm" icon={<Users size={16} />}>
                    View & Join Teams
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
