import React from 'react';
import { TOKENS, tw } from '../../config/tokens';

export function ProgressBar({
  value,
  color = 'teal',
  animated = true,
  className = '',
  ...props
}) {
  const colorClasses = {
    teal: TOKENS.progress.barTeal,
    green: TOKENS.progress.barGreen,
    amber: TOKENS.progress.barAmber,
    coral: TOKENS.progress.barCoral,
  };

  const barClass = tw(
    TOKENS.progress.bar,
    colorClasses[color] || colorClasses.teal,
    animated && 'transition-all duration-300'
  );

  return (
    <div className={tw(TOKENS.progress.track, className)} {...props}>
      <div
        className={barClass}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export default ProgressBar;
