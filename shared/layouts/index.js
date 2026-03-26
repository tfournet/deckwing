import singleCenter from './single-center.json' with { type: 'json' };
import twoColumn from './two-column.json' with { type: 'json' };
import fourColumn from './four-column.json' with { type: 'json' };
import dashboard from './dashboard.json' with { type: 'json' };
import comparison from './comparison.json' with { type: 'json' };
import imageLeft from './image-left.json' with { type: 'json' };
import twoColumnWideLeft from './two-column-wide-left.json' with { type: 'json' };
import twoColumnWideRight from './two-column-wide-right.json' with { type: 'json' };
import threeColumn from './three-column.json' with { type: 'json' };
import topBottom from './top-bottom.json' with { type: 'json' };
import imageRight from './image-right.json' with { type: 'json' };
import timeline4 from './timeline-4.json' with { type: 'json' };
import timeline6 from './timeline-6.json' with { type: 'json' };
import quoteContext from './quote-context.json' with { type: 'json' };
import featureGrid2x2 from './feature-grid-2x2.json' with { type: 'json' };
import featureGrid2x3 from './feature-grid-2x3.json' with { type: 'json' };
import heroSidebar from './hero-sidebar.json' with { type: 'json' };
import comparisonTable from './comparison-table.json' with { type: 'json' };
import logoWall from './logo-wall.json' with { type: 'json' };
import annotatedImage from './annotated-image.json' with { type: 'json' };
import quadrant from './quadrant.json' with { type: 'json' };

const layouts = [
  singleCenter,
  twoColumn,
  fourColumn,
  dashboard,
  comparison,
  imageLeft,
  twoColumnWideLeft,
  twoColumnWideRight,
  threeColumn,
  topBottom,
  imageRight,
  timeline4,
  timeline6,
  quoteContext,
  featureGrid2x2,
  featureGrid2x3,
  heroSidebar,
  comparisonTable,
  logoWall,
  annotatedImage,
  quadrant,
];
const LAYOUTS = new Map(layouts.map(layout => [layout.id, layout]));

export function getLayout(id) {
  return LAYOUTS.get(id) || null;
}

export function getLayoutNames() {
  return [...LAYOUTS.keys()];
}

export function getAllLayouts() {
  return [...LAYOUTS.values()];
}

export function validateCustomSlots(slots, errors) {
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];

    if (!slot.name || !slot.position) {
      errors.push(`Custom slot ${i}: missing name or position`);
      continue;
    }

    const position = slot.position;
    if (!isValidGridPosition(position)) {
      errors.push(`Slot "${slot.name}": position values must be positive integers`);
      continue;
    }

    if (position.col < 1 || position.col + position.colSpan - 1 > 12) {
      errors.push(`Slot "${slot.name}": exceeds column bounds`);
    }
    if (position.row < 1 || position.row + position.rowSpan - 1 > 6) {
      errors.push(`Slot "${slot.name}": exceeds row bounds`);
    }

    for (let j = i + 1; j < slots.length; j += 1) {
      const otherSlot = slots[j];
      if (!otherSlot?.position || !isValidGridPosition(otherSlot.position)) continue;
      if (slotsOverlap(position, otherSlot.position)) {
        errors.push(`Slots "${slot.name}" and "${otherSlot.name}" overlap`);
      }
    }
  }
}

export function validateBlockSlotAssignment(blocks, slots, errors) {
  const usedSlots = new Set();

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];

    if (!block.slot) {
      errors.push(`Block ${i}: missing "slot"`);
      continue;
    }

    if (!block.kind) {
      errors.push(`Block ${i}: missing "kind"`);
      continue;
    }

    if (usedSlots.has(block.slot)) {
      errors.push(`Block ${i}: duplicate slot "${block.slot}"`);
    }
    usedSlots.add(block.slot);

    const slotDef = slots.find(slot => slot.name === block.slot);
    if (!slotDef) {
      errors.push(`Block ${i}: slot "${block.slot}" not defined in layout`);
    } else if (slotDef.kinds && !slotDef.kinds.includes(block.kind)) {
      errors.push(
        `Block ${i}: kind "${block.kind}" not allowed in slot "${block.slot}" (allowed: ${slotDef.kinds.join(', ')})`,
      );
    }
  }

  return usedSlots;
}

export function validateRequiredSlots(slots, usedSlots, errors) {
  for (const slot of slots) {
    if (slot.required && !usedSlots.has(slot.name)) {
      errors.push(`Required slot "${slot.name}" not filled`);
    }
  }
}

export function validateLayoutSlide(slide) {
  const errors = [];

  if (!slide.layout) {
    errors.push('Layout slide missing "layout" field');
    return { valid: false, errors };
  }

  const isCustom = slide.layout === 'custom';
  const layoutDef = isCustom ? null : getLayout(slide.layout);

  if (!isCustom && !layoutDef) {
    errors.push(`Unknown layout: "${slide.layout}"`);
    return { valid: false, errors };
  }

  const slots = isCustom ? (slide.slots || []) : layoutDef.slots;
  const blocks = slide.blocks || [];
  const usedSlots = validateBlockSlotAssignment(blocks, slots, errors);

  if (!isCustom && layoutDef) {
    validateRequiredSlots(layoutDef.slots, usedSlots, errors);
  }

  if (isCustom && Array.isArray(slide.slots)) {
    validateCustomSlots(slide.slots, errors);
  }

  return { valid: errors.length === 0, errors };
}

function isValidGridPosition(position) {
  const values = [position.col, position.row, position.colSpan, position.rowSpan];
  return values.every(value => Number.isInteger(value) && value > 0);
}

function slotsOverlap(a, b) {
  return !(
    a.col + a.colSpan <= b.col ||
    b.col + b.colSpan <= a.col ||
    a.row + a.rowSpan <= b.row ||
    b.row + b.rowSpan <= a.row
  );
}
