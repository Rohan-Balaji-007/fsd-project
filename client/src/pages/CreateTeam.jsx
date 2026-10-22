import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Sparkles,
  ArrowLeft,
  PlusCircle,
  Plus
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardHeader, CardBody } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { SkillTag } from '../components/ui/SkillTag.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';

const POPULAR_SUGGESTED_SKILLS = [
  'React', 'Python', 'Node.js', 'FastAPI', 'PyTorch',
  'SQL', 'TailwindCSS', 'Figma', 'TypeScript', 'Docker',
  'UI/UX Design', 'C++', 'Machine Learning', 'Flutter'
];

export const CreateTeam = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const initialEventId = searchParams.get('event_id') || '';

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [formData, setFormData] = useState({
    event_id: initialEventId,
    name: '',
    description: '',
    required_skills: [],
    max_members: 4
  });

  const [skillInput, setSkillInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        const res = await api.get('/events', { params: { limit: 50 } });
        if (res?.success && res?.data) {
          const list = res.data.events || [];
          setEvents(list);
          if (!formData.event_id && list.length > 0) {
            setFormData((prev) => ({ ...prev, event_id: list[0].id }));
          }
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || skillInput).trim();
    if (!trimmed) return;
    if (formData.required_skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      required_skills: [...prev.required_skills, trimmed]
    }));
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      required_skills: prev.required_skills.filter((s) => s !== skillToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.event_id) {
      newErrors.event_id = 'Please select a collegiate event';
    }
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Team name must be at least 2 characters';
    }
    if (!formData.max_members || formData.max_members < 2) {
      newErrors.max_members = 'Teams must accommodate at least 2 members';
    }
    if (formData.max_members > 20) {
      newErrors.max_members = 'Maximum allowed team size is 20';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the errors in the form.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/teams', {
        event_id: formData.event_id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        required_skills: formData.required_skills,
        max_members: Number(formData.max_members)
      });

      if (res?.success && res?.data) {
        toast.success(`Team "${res.data.name}" successfully created!`);
        navigate(`/teams/${res.data.id}`);
      }
    } catch (err) {
      console.error('Error creating team:', err);
      toast.error(err.message || 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <Link
        to="/teams"
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
        <ArrowLeft size={16} /> Back to Teams
      </Link>

      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Users size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Create a New Team
              </h1>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Register your team for a campus competition and invite teammates with the skills you need.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          {loadingEvents ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <Spinner size="md" />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Event Selector */}
              <Input
                as="select"
                label="Target Event / Competition"
                name="event_id"
                value={formData.event_id}
                onChange={(e) => {
                  setFormData({ ...formData, event_id: e.target.value });
                  if (errors.event_id) setErrors({ ...errors, event_id: null });
                }}
                options={[
                  { label: '-- Select Event --', value: '' },
                  ...events.map((ev) => ({
                    label: `${ev.title} (${ev.category}) - ${new Date(ev.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
                    value: ev.id
                  }))
                ]}
                error={errors.event_id}
                required
                icon={<Calendar size={18} />}
              />

              {/* Team Name */}
              <Input
                label="Team Name"
                name="name"
                placeholder="e.g. QuantumHackers, CyberShield Alpha, ByteForce"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
                error={errors.name}
                required
                icon={<Users size={18} />}
              />

              {/* Max Members */}
              <Input
                label="Maximum Team Size (including yourself)"
                name="max_members"
                type="number"
                min="2"
                max="20"
                value={formData.max_members}
                onChange={(e) => {
                  setFormData({ ...formData, max_members: Number(e.target.value) });
                  if (errors.max_members) setErrors({ ...errors, max_members: null });
                }}
                error={errors.max_members}
                helperText="Must be at least 2 members. Cannot exceed event team limits."
                required
              />

              {/* Description */}
              <Input
                as="textarea"
                label="Project Vision & Goals (Optional)"
                name="description"
                placeholder="Briefly describe what your team plans to build, specific domain tracks you want to tackle, or team culture."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />

              {/* Required Skills Tag Input */}
              <div className="form-group">
                <label className="form-label">
                  Required Teammate Skills
                </label>

                <div className="tag-input-container">
                  {formData.required_skills.map((skill) => (
                    <SkillTag
                      key={skill}
                      skill={skill}
                      onRemove={handleRemoveSkill}
                    />
                  ))}

                  <input
                    type="text"
                    placeholder="Type skill & press Enter (e.g. React, Python)"
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
                      onClick={() => handleAddSkill()}
                    >
                      <Plus size={14} /> Add
                    </Button>
                  )}
                </div>

                {/* Popular Skill Chips */}
                <div style={{ marginTop: '0.625rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Suggestions:</span>
                  {POPULAR_SUGGESTED_SKILLS.filter((s) => !formData.required_skills.includes(s)).slice(0, 8).map((ps) => (
                    <button
                      key={ps}
                      type="button"
                      onClick={() => handleAddSkill(ps)}
                      style={{
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        color: 'var(--text-muted)'
                      }}
                    >
                      + {ps}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button variant="ghost" onClick={() => navigate(-1)} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={submitting}
                  icon={<PlusCircle size={18} />}
                >
                  Create Team
                </Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
