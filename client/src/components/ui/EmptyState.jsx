import React from 'react';
import { Layers } from 'lucide-react';
import { Button } from './Button.jsx';

export const EmptyState = ({
  icon = <Layers size={28} />,
  title = 'No items found',
  description = 'There are no records to display matching your criteria.',
  actionLabel = null,
  onAction = null,
  className = '',
  ...props
}) => {
  return (
    <div className={`empty-state ${className}`} {...props}>
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
