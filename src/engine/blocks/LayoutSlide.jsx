import React from 'react';
import { getLayout } from '../../../shared/layouts/index.js';
import { BlockRenderer } from './BlockRenderer.jsx';

export function LayoutSlide({ slide }) {
  const isCustom = slide.layout === 'custom';
  const layoutDef = isCustom ? null : getLayout(slide.layout);
  const slots = isCustom ? (slide.slots || []) : (layoutDef?.slots || []);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridTemplateRows: 'repeat(6, 1fr)',
        gap: '16px',
        width: '100%',
        height: '100%',
        padding: '0',
      }}
    >
      {(slide.blocks || []).map((block) => {
        const slotDef = slots.find(slot => slot.name === block.slot);
        if (!slotDef) return null;
        const pos = slotDef.position;

        return (
          <div
            key={block.slot}
            data-slot={block.slot}
            style={{
              gridColumn: `${pos.col} / span ${pos.colSpan}`,
              gridRow: `${pos.row} / span ${pos.rowSpan}`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minWidth: 0,
              minHeight: 0,
            }}
          >
            <BlockRenderer block={block} />
          </div>
        );
      })}
    </div>
  );
}

export default LayoutSlide;
