import React from 'react';
import { TOKENS, tw } from '../../config/tokens';

export function CodeBlock({
  variant = 'block',
  className = '',
  children,
  ...props
}) {
  if (variant === 'inline') {
    return (
      <code className={tw(TOKENS.code.inline, className)} {...props}>
        {children}
      </code>
    );
  }

  return (
    <pre className={tw(TOKENS.code.block, className)} {...props}>
      <code>{children}</code>
    </pre>
  );
}

export function InlineCode({ children, ...props }) {
  return <CodeBlock variant="inline" {...props}>{children}</CodeBlock>;
}

export default CodeBlock;
