import React from 'react';
import * as Icons from 'lucide-react';

function HeadingBlock({ block }) {
  const sizes = { sm: '24px', md: '36px', lg: '52px', xl: '72px' };

  return (
    <h2
      style={{
        color: 'var(--block-accent)',
        fontSize: sizes[block.size] || sizes.lg,
        fontWeight: 900,
        lineHeight: 1.1,
        fontFamily: 'Montserrat, sans-serif',
        margin: 0,
      }}
    >
      {block.text}
    </h2>
  );
}

function TextBlock({ block }) {
  const variants = {
    body: { fontSize: '28px', color: 'var(--block-text)' },
    caption: { fontSize: '20px', color: 'var(--block-text-muted)' },
    small: { fontSize: '16px', color: 'var(--block-text-muted)' },
  };

  return (
    <p style={{ ...(variants[block.style] || variants.body), lineHeight: 1.5, margin: 0 }}>
      {block.text}
    </p>
  );
}

function ListBlock({ block }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {(block.items || []).map((item, i) => (
        <li
          key={i}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            marginBottom: '16px',
            fontSize: '28px',
            color: 'var(--block-text)',
            lineHeight: 1.4,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: 'var(--block-accent)',
              marginTop: 10,
              flexShrink: 0,
            }}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

function MetricBlock({ block }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px' }}>
      <div
        style={{
          fontSize: '64px',
          fontWeight: 900,
          color: block.color || 'var(--block-accent)',
          lineHeight: 1.1,
        }}
      >
        {block.value}
      </div>
      <div
        style={{
          fontSize: '20px',
          color: 'var(--block-text-muted)',
          marginTop: '8px',
        }}
      >
        {block.label}
      </div>
    </div>
  );
}

function ImageBlock({ block }) {
  return (
    <img
      src={block.src}
      alt={block.alt || ''}
      style={{
        width: '100%',
        height: '100%',
        objectFit: block.fit || 'contain',
        borderRadius: '12px',
      }}
    />
  );
}

function IconBlock({ block }) {
  const Icon = Icons[block.name];
  if (!Icon) return null;

  return (
    <div
      style={{
        color: 'var(--block-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <Icon size={block.size || 48} />
    </div>
  );
}

function QuoteBlock({ block }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
        padding: '16px',
      }}
    >
      <div style={{ fontSize: '80px', color: 'var(--block-accent)', lineHeight: 1 }}>&quot;</div>
      <blockquote
        style={{
          fontSize: '36px',
          fontStyle: 'italic',
          color: 'var(--block-text)',
          lineHeight: 1.4,
          margin: '0 0 16px 0',
        }}
      >
        {block.text}
      </blockquote>
      {block.attribution && (
        <div>
          <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--block-accent)' }}>
            {block.attribution}
          </span>
          {block.role && (
            <span style={{ fontSize: '20px', color: 'var(--block-text-muted)', marginLeft: '8px' }}>
              {block.role}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function CalloutBlock({ block }) {
  const variants = {
    teal: { bg: 'rgba(30,175,175,0.15)', border: '#1EAFAF', text: '#78CFCF' },
    amber: { bg: 'rgba(249,161,0,0.15)', border: '#F9A100', text: '#FBC766' },
    coral: { bg: 'rgba(241,91,91,0.15)', border: '#F15B5B', text: '#F79D9D' },
  };
  const variant = variants[block.variant] || variants.teal;

  return (
    <div
      style={{
        backgroundColor: variant.bg,
        border: `2px solid ${variant.border}`,
        borderRadius: '12px',
        padding: '20px',
        color: variant.text,
        fontSize: '24px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      {block.text}
    </div>
  );
}

function DividerBlock({ block }) {
  const isVertical = block.direction === 'vertical';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--block-accent)',
          opacity: 0.4,
          ...(isVertical ? { width: '2px', height: '80%' } : { height: '2px', width: '80%' }),
          borderRadius: '1px',
        }}
      />
    </div>
  );
}

function SpacerBlock() {
  return <div />;
}

function ChartBlock() {
  return (
    <div
      style={{
        border: '1px dashed var(--block-accent)',
        borderRadius: '12px',
        color: 'var(--block-text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        fontSize: '20px',
        padding: '12px',
      }}
    >
      Chart preview coming in Phase 2
    </div>
  );
}

function TableBlock({ block }) {
  return (
    <div style={{ overflow: 'hidden', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--block-text)', fontSize: '18px' }}>
        <thead>
          <tr>
            {(block.headers || []).map((header, i) => (
              <th
                key={i}
                style={{
                  textAlign: 'left',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--block-accent)',
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(block.rows || []).map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const BLOCK_RENDERERS = {
  heading: HeadingBlock,
  text: TextBlock,
  list: ListBlock,
  metric: MetricBlock,
  chart: ChartBlock,
  table: TableBlock,
  image: ImageBlock,
  icon: IconBlock,
  quote: QuoteBlock,
  callout: CalloutBlock,
  divider: DividerBlock,
  spacer: SpacerBlock,
};

export function BlockRenderer({ block }) {
  const Renderer = BLOCK_RENDERERS[block.kind];

  if (!Renderer) {
    return <div style={{ color: '#F15B5B', fontSize: '16px' }}>Unknown block: {block.kind}</div>;
  }

  return <Renderer block={block} />;
}

export { BLOCK_RENDERERS };
export default BlockRenderer;
