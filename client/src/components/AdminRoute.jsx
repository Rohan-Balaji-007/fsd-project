import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './ui/Spinner.jsx';
import { Card, CardBody } from './ui/Card.jsx';
import { Button } from './ui/Button.jsx';

export const AdminRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role !== 'admin') {
    return (
      <div style={{ maxWidth: '520px', margin: '4rem auto', padding: '1rem' }}>
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--color-danger-light)',
                color: 'var(--color-danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}
            >
              <ShieldAlert size={32} />
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              Administrator Access Required
            </h1>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              Your current account role is <strong>{profile?.role || 'student'}</strong>. You do not have sufficient permissions to access the platform administrative panel.
            </p>

            <Link to="/">
              <Button variant="primary" icon={<ArrowLeft size={16} />}>
                Return to Campus Home
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  return children;
};
