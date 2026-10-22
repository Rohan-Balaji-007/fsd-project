import React from 'react';

export const Badge = ({
  children,
  variant = 'primary', // primary | success | warning | danger | neutral
  icon = null,
  className = '',
  ...props
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`} {...props}>
      {icon && <span className="badge-icon">{icon}</span>}
      {children}
    </span>
  );
};
