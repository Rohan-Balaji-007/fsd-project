import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  User,
  Upload,
  Briefcase,
  GraduationCap,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';
import { supabase } from '../services/supabase.js';
import { Card, CardHeader, CardBody } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { SkillTag } from '../components/ui/SkillTag.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';

const POPULAR_SKILLS = [
  'Python', 'React', 'Node.js', 'TypeScript', 'SQL',
  'PyTorch', 'TailwindCSS', 'Figma', 'FastAPI', 'Docker',
  'Next.js', 'C++', 'Java', 'UI/UX Design', 'Machine Learning'
];

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Artificial Intelligence & Data Science',
  'Design & Media Arts',
  'Business Administration',
  'Biotechnology'
];

const ACADEMIC_YEARS = [
  '1st Year (Freshman)',
  '2nd Year (Sophomore)',
  '3rd Year (Junior)',
  '4th Year (Senior)',
  'Postgraduate / Masters',
  'PhD Scholar'
];

export const Profile = () => {
  const { user, profile, refreshProfile, isProfileComplete } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const isCompletePrompt = searchParams.get('complete') === 'true' || !isProfileComplete;

  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: '',
    department: '',
    academic_year: '',
    skills: [],
    interests: [],
    experience: ''
  });

  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Sync state with current user profile
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || '',
        department: profile.department || '',
        academic_year: profile.academic_year || ACADEMIC_YEARS[2],
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        interests: Array.isArray(profile.interests) ? profile.interests : [],
        experience: profile.experience || ''
      });
    }
  }, [profile]);

  // Handle Photo Upload to Supabase Storage
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 3MB) and type
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Avatar image must be under 3MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image (PNG, JPG, WebP)');
      return;
    }

    try {
      setUploadingPhoto(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // Fallback: If bucket is not public/created, use Data URL for immediate local preview
        console.warn('Storage bucket upload notice:', uploadError.message);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev) => ({ ...prev, avatar_url: reader.result }));
          toast.info('Avatar preview updated.');
        };
        reader.readAsDataURL(file);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
        toast.success('Avatar uploaded successfully!');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      toast.error('Failed to upload photo: ' + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Skill tag management
  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || skillInput).trim();
    if (!trimmed) return;
    if (formData.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.info(`"${trimmed}" is already added.`);
      setSkillInput('');
      return;
    }
    setFormData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
    setSkillInput('');
    if (errors.skills) setErrors((prev) => ({ ...prev, skills: null }));
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove)
    }));
  };

  // Interest tag management
  const handleAddInterest = (interestToAdd) => {
    const trimmed = (interestToAdd || interestInput).trim();
    if (!trimmed) return;
    if (formData.interests.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
      setInterestInput('');
      return;
    }
    setFormData((prev) => ({ ...prev, interests: [...prev.interests, trimmed] }));
    setInterestInput('');
  };

  const handleRemoveInterest = (interestToRemove) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interestToRemove)
    }));
  };

  // Save profile to backend via PUT /api/profile/me
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    if (formData.skills.length === 0) {
      newErrors.skills = 'Please add at least one technical or core skill';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.put('/profile/me', {
        full_name: formData.full_name.trim(),
        avatar_url: formData.avatar_url || null,
        department: formData.department,
        academic_year: formData.academic_year,
        skills: formData.skills,
        interests: formData.interests,
        experience: formData.experience.trim() || null
      });

      if (res?.success) {
        toast.success('Profile saved successfully!');
        await refreshProfile();

        // If user was completing profile on first login, transition them smoothly to events
        if (isCompletePrompt) {
          navigate('/events');
        }
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Forced completion banner for first login */}
      {isCompletePrompt && (
        <div
          style={{
            background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)',
            border: '1px solid #c7d2fe',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
              Complete your student profile
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#4338ca' }}>
              Add your department, academic year, and technical skills so our matching engine can calculate skill synergy scores for teams and hackathons.
            </p>
          </div>
        </div>
      )}

      {/* Main Profile Form Card */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <User size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Student Profile
              </h1>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Manage your public collegiate profile and teammate skills
              </p>
            </div>
          </div>

          <Badge variant={isProfileComplete ? 'success' : 'warning'}>
            {isProfileComplete ? 'Complete' : 'Incomplete'}
          </Badge>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleSubmit}>
            {/* Avatar Upload Section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                paddingBottom: '1.75rem',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '1.75rem'
              }}
            >
              <div style={{ position: 'relative' }}>
                {formData.avatar_url ? (
                  <img
                    src={formData.avatar_url}
                    alt={formData.full_name || 'Profile'}
                    style={{
                      width: '92px',
                      height: '92px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--border-light)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '92px',
                      height: '92px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      fontWeight: 700,
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    {formData.full_name ? formData.full_name[0].toUpperCase() : 'U'}
                  </div>
                )}

                {uploadingPhoto && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.4)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Spinner size="md" variant="white" />
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Profile Photo
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Upload a photo to Supabase storage. Supports JPG, PNG or WebP under 3MB.
                </p>

                <label
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', cursor: uploadingPhoto ? 'not-allowed' : 'pointer' }}
                >
                  <Upload size={14} />
                  <span>{uploadingPhoto ? 'Uploading...' : 'Upload New Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {/* Basic Info: Name & Email */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <Input
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={(e) => {
                  setFormData({ ...formData, full_name: e.target.value });
                  if (errors.full_name) setErrors({ ...errors, full_name: null });
                }}
                error={errors.full_name}
                required
                icon={<User size={18} />}
              />

              <Input
                label="College Email"
                name="email"
                value={user?.email || ''}
                disabled
                helperText="Email is permanently linked to your Supabase Auth account"
              />
            </div>

            {/* Department & Academic Year */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <Input
                as="select"
                label="Department / Major"
                name="department"
                value={formData.department}
                onChange={(e) => {
                  setFormData({ ...formData, department: e.target.value });
                  if (errors.department) setErrors({ ...errors, department: null });
                }}
                options={[
                  { label: '-- Select Your Department --', value: '' },
                  ...DEPARTMENTS.map((d) => ({ label: d, value: d }))
                ]}
                error={errors.department}
                required
                icon={<GraduationCap size={18} />}
              />

              <Input
                as="select"
                label="Academic Year"
                name="academic_year"
                value={formData.academic_year}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                options={ACADEMIC_YEARS.map((y) => ({ label: y, value: y }))}
                icon={<Briefcase size={18} />}
              />
            </div>

            {/* Skills Tag Input */}
            <div className="form-group">
              <label className="form-label form-label-required">
                Technical & Core Skills
              </label>

              <div className="tag-input-container" style={{ borderColor: errors.skills ? 'var(--color-danger)' : undefined }}>
                {formData.skills.map((skill) => (
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
                    style={{ padding: '0.2rem 0.5rem' }}
                  >
                    <Plus size={14} /> Add
                  </Button>
                )}
              </div>

              {errors.skills && <p className="form-error-text">{errors.skills}</p>}

              {/* Quick-add popular skills */}
              <div style={{ marginTop: '0.625rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick add:</span>
                {POPULAR_SKILLS.filter((s) => !formData.skills.includes(s)).slice(0, 8).map((ps) => (
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
                      color: 'var(--text-muted)',
                      transition: 'all 150ms'
                    }}
                  >
                    + {ps}
                  </button>
                ))}
              </div>
            </div>

            {/* Interests Tag Input */}
            <div className="form-group">
              <label className="form-label">
                Interests & Project Passions
              </label>

              <div className="tag-input-container">
                {formData.interests.map((interest) => (
                  <SkillTag
                    key={interest}
                    skill={interest}
                    onRemove={handleRemoveInterest}
                  />
                ))}

                <input
                  type="text"
                  placeholder="Type interest & press Enter (e.g. AI Agents, Fintech, IoT)"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInterest();
                    }
                  }}
                  className="tag-input-field"
                />

                {interestInput.trim() && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddInterest()}
                    style={{ padding: '0.2rem 0.5rem' }}
                  >
                    <Plus size={14} /> Add
                  </Button>
                )}
              </div>
              <p className="form-helper-text">
                Areas of interest help teammates understand what hackathon tracks you love.
              </p>
            </div>

            {/* Experience / Bio */}
            <Input
              as="textarea"
              label="Bio & Prior Project Experience"
              name="experience"
              placeholder="Tell prospective teammates about projects you've built, previous hackathons won, or technical highlights."
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              rows={4}
            />

            {/* Submit Action */}
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={saving}
                icon={<Save size={18} />}
              >
                Save Profile
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
