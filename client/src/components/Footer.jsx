import React from 'react';
import { Users, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div className="brand-badge" style={{ width: '28px', height: '28px' }}>
            <Users size={14} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>
            Team<span style={{ color: 'var(--color-primary)' }}>Up</span>
          </span>
          <span className="footer-meta" style={{ marginLeft: '0.5rem' }}>
            • Collegiate Team Formation
          </span>
        </div>

        <div className="footer-meta" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          Designed for college students to build winning teams with skill matching.
        </div>

        <div className="footer-meta">
          &copy; {new Date().getFullYear()} TeamUp Platform. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
