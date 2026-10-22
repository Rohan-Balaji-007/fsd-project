import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.email.trim() || !formData.password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      const { profile } = await login(formData.email.trim(), formData.password);
      toast.success('Welcome back! Logged in successfully.');

      // Check if profile needs completion
      const isComplete = Boolean(
        profile &&
        profile.department &&
        profile.department.trim() !== '' &&
        profile.skills &&
        profile.skills.length > 0
      );

      if (!isComplete) {
        navigate('/profile?complete=true', { replace: true });
      } else {
        const destination = location.state?.from?.pathname || '/events';
        navigate(destination, { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.message || 'Invalid email or password';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto 0', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
          Welcome back
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Log in with your college account to join teams & events.
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
              placeholder="••••••••"
              value={formData.password}
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
              icon={<LogIn size={18} />}
              style={{ marginTop: '0.5rem' }}
            >
              Log In
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
            Don't have an account yet?{' '}
            <Link
              to="/register"
              style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}
            >
              Sign up <ArrowRight size={14} />
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
