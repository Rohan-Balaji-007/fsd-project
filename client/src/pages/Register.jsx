import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Valid college email is required.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const data = await register(
        formData.email.trim(),
        formData.password,
        formData.fullName.trim()
      );

      // Check if session was returned immediately (auto-confirmed or email confirm disabled)
      if (data.session) {
        toast.success('Registration successful! Please complete your student profile.');
        navigate('/profile?complete=true', { replace: true });
      } else {
        // Email confirmation is required by Supabase auth configuration
        setSuccessInfo({
          email: formData.email,
          message: 'Account created! Please check your inbox to confirm your email, then log in.'
        });
        toast.success('Account created! Please verify your email.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.message || 'Registration failed. Please check your credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (successInfo) {
    return (
      <div style={{ maxWidth: '440px', margin: '3rem auto 0', width: '100%' }}>
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--color-success-light)',
                color: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Check your email
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
              We sent a verification link to <strong style={{ color: 'var(--text-main)' }}>{successInfo.email}</strong>.
              Click the link in the email to activate your student account.
            </p>
            <Link to="/login">
              <Button variant="primary" fullWidth size="lg">
                Go to Login
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '440px', margin: '2rem auto 0', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
          Create an account
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Connect with campus innovators, build projects & win events.
        </p>
      </div>

      <Card>
        <CardBody>
          {error && (
            <div
              style={{
                background: 'var(--color-danger-light)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--color-danger-dark)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                marginBottom: '1.25rem'
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              name="fullName"
              placeholder="e.g. Alex Mercer"
              value={formData.fullName}
              onChange={handleChange}
              icon={<User size={18} />}
              required
            />

            <Input
              label="College Email"
              name="email"
              type="email"
              placeholder="student@college.edu"
              value={formData.email}
              onChange={handleChange}
              icon={<Mail size={18} />}
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              icon={<Lock size={18} />}
              required
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              icon={<Lock size={18} />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
              icon={<UserPlus size={18} />}
              style={{ marginTop: '0.5rem' }}
            >
              Create Student Account
            </Button>
          </form>

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
              textAlign: 'center',
              fontSize: '0.875rem',
              color: 'var(--text-muted)'
            }}
          >
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}
            >
              Sign in <ArrowRight size={14} />
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
