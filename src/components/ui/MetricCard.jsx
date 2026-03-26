import React from 'react';
import { TOKENS, tw } from '../../config/tokens';

export function MetricCard({
  value,
  label,
  valueColor = 'text-white',
  className = '',
  ...props
}) {
  return (
    <div className={tw(TOKENS.metric.container, className)} {...props}>
      <div className={tw(TOKENS.metric.value, valueColor)}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className={TOKENS.metric.label}>{label}</div>
    </div>
  );
}

export function MetricGrid({ children, cols = 3, className = '' }) {
  const colsClass = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };
  return (
    <div className={tw('grid gap-4', colsClass[cols] || 'grid-cols-3', className)}>
      {children}
    </div>
  );
}

export default MetricCard;
