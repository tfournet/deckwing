import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const singleCenter = require('./single-center.json');
const twoColumn = require('./two-column.json');
const fourColumn = require('./four-column.json');
const dashboard = require('./dashboard.json');
const comparison = require('./comparison.json');
const imageLeft = require('./image-left.json');

const layouts = [singleCenter, twoColumn, fourColumn, dashboard, comparison, imageLeft];
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

  if (!isCustom && layoutDef) {
    for (const slot of layoutDef.slots) {
      if (slot.required && !usedSlots.has(slot.name)) {
        errors.push(`Required slot "${slot.name}" not filled`);
      }
    }
  }

  if (isCustom && Array.isArray(slide.slots)) {
    for (let i = 0; i < slide.slots.length; i += 1) {
      const slot = slide.slots[i];

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

      for (let j = i + 1; j < slide.slots.length; j += 1) {
        const otherSlot = slide.slots[j];
        if (!otherSlot?.position || !isValidGridPosition(otherSlot.position)) continue;
        if (slotsOverlap(position, otherSlot.position)) {
          errors.push(`Slots "${slot.name}" and "${otherSlot.name}" overlap`);
        }
      }
    }
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
