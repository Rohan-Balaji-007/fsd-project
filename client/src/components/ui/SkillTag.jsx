import React from 'react';
import { X } from 'lucide-react';

export const SkillTag = ({
  skill,
  matched = false,
  onRemove = null,
  onClick = null,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`skill-tag ${matched ? 'skill-tag-matched' : ''} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      {...props}
    >
      <span>{skill}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(skill);
          }}
          className="skill-tag-remove-btn"
          aria-label={`Remove skill ${skill}`}
        >
          <X size={14} />
        </button>
      )}
    </span>
  );
};
