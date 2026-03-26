import React from 'react';
import { TOKENS, tw } from '../../config/tokens';

export function Card({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const variantClasses = {
    default: TOKENS.card.padded,
    large: TOKENS.card.large,
  };

  const sizeClasses = { sm: 'p-2', md: 'p-4', lg: 'p-6', xl: 'p-8' };

  const baseClass = variant === 'default'
    ? tw(TOKENS.card.base, sizeClasses[size])
    : variantClasses[variant] || TOKENS.card.padded;

  return (
    <div className={tw(baseClass, className)} {...props}>
      {children}
    </div>
  );
}

export default Card;
