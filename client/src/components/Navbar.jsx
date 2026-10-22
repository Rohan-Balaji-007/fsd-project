import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Users, Menu, X, LogOut, User, Compass, Briefcase, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { NotificationBell } from './NotificationBell.jsx';
import { Button } from './ui/Button.jsx';
import { useToast } from '../context/ToastContext.jsx';

export const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast.info('Logged out successfully');
      setMobileMenuOpen(false);
      navigate('/login');
    } catch (err) {
      toast.error('Failed to log out: ' + err.message);
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="brand-link" onClick={closeMobileMenu}>
          <div className="brand-badge">
            <Users size={18} />
          </div>
          <span>Team<span style={{ color: 'var(--color-primary)' }}>Up</span></span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="nav-links-desktop">
          <NavLink to="/events" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Events
          </NavLink>
          <NavLink to="/teams" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Find Teams
          </NavLink>
          {user && (
            <NavLink to="/my-teams" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              My Teams
            </NavLink>
          )}
          {profile?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
              Admin Panel
            </NavLink>
          )}
        </nav>

        {/* Desktop Action Area */}
        <div className="nav-actions">
          {user ? (
            <>
              <NotificationBell />

              <Link
                to="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer'
                }}
                title="View Profile"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'Avatar'}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    maxWidth: '120px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {profile?.full_name?.split(' ')[0] || 'Profile'}
                </span>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                icon={<LogOut size={16} />}
                title="Log out"
              >
                <span style={{ display: 'none' }}>Logout</span>
              </Button>
            </>
          ) : (
            <div className="nav-auth-buttons" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <NavLink
            to="/events"
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Compass size={18} /> Events
            </span>
          </NavLink>
          <NavLink
            to="/teams"
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={18} /> Find Teams
            </span>
          </NavLink>

          {user ? (
            <>
              <NavLink
                to="/my-teams"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Briefcase size={18} /> My Teams
                </span>
              </NavLink>

              <NavLink
                to="/profile"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <User size={18} /> Student Profile
                </span>
              </NavLink>

              {profile?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                  style={{ color: 'var(--color-primary)', fontWeight: 700 }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldCheck size={18} /> Admin Panel
                  </span>
                </NavLink>
              )}

              <Button
                variant="danger"
                size="sm"
                fullWidth
                onClick={handleLogout}
                icon={<LogOut size={16} />}
                style={{ marginTop: '0.5rem' }}
              >
                Log Out
              </Button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Link to="/login" onClick={closeMobileMenu}>
                <Button variant="secondary" fullWidth size="md">
                  Log In
                </Button>
              </Link>
              <Link to="/register" onClick={closeMobileMenu}>
                <Button variant="primary" fullWidth size="md">
                  Create Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
