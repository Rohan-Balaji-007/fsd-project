import React from 'react';

export const Spinner = ({ size = 'md', variant = 'primary', className = '' }) => {
  const sizeClass = `spinner-${size}`;
  const variantClass = variant === 'white' ? 'spinner-white' : '';

  return (
    <span
      className={`spinner ${sizeClass} ${variantClass} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};
