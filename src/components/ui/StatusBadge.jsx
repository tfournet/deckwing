import React from 'react';
import { TOKENS, tw } from '../../config/tokens';

export function StatusBadge({
  variant = 'neutral',
  className = '',
  children,
  ...props
}) {
  const variantClasses = {
    success: TOKENS.badge.success,
    error: TOKENS.badge.error,
    warning: TOKENS.badge.warning,
    info: TOKENS.badge.info,
    neutral: TOKENS.badge.neutral,
  };

  return (
    <span className={tw(variantClasses[variant] || variantClasses.neutral, className)} {...props}>
      {children}
    </span>
  );
}

export default StatusBadge;
