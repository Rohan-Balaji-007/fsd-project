import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = ({
  id,
  label,
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = null,
  helperText = null,
  required = false,
  icon = null,
  as = 'input', // 'input' | 'textarea' | 'select'
  options = [], // For select: [{ label, value }]
  rows = 4,
  disabled = false,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  const describedBy = error
    ? `${inputId}-error`
    : helperText
    ? `${inputId}-helper`
    : undefined;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className={`form-label ${required ? 'form-label-required' : ''}`}>
          {label}
        </label>
      )}

      <div className="input-wrapper">
        {icon && <span className="input-icon-prefix">{icon}</span>}

        {as === 'textarea' ? (
          <textarea
            id={inputId}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            rows={rows}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={`textarea-field ${icon ? 'input-with-prefix' : ''} ${error ? 'input-error' : ''}`}
            {...props}
          />
        ) : as === 'select' ? (
          <select
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={`select-field ${icon ? 'input-with-prefix' : ''} ${error ? 'input-error' : ''}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={inputId}
            name={name}
            type={effectiveType}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={`input-field ${icon ? 'input-with-prefix' : ''} ${isPassword ? 'input-with-suffix' : ''} ${error ? 'input-error' : ''}`}
            {...props}
          />
        )}

        {isPassword && (
          <button
            type="button"
            className="input-icon-suffix"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex="-1"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && <p id={`${inputId}-error`} className="form-error-text" role="alert">{error}</p>}
      {!error && helperText && <p id={`${inputId}-helper`} className="form-helper-text">{helperText}</p>}
    </div>
  );
};
