import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LAYOUT_FILE_NAMES = [
  'single-center.json',
  'two-column.json',
  'four-column.json',
  'dashboard.json',
  'comparison.json',
  'image-left.json',
];

function loadLayout(fileName) {
  const filePath = join(__dirname, fileName);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

const layouts = LAYOUT_FILE_NAMES.map(loadLayout);
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

  for (let i = 0; i < blocks.length; i++) {
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
    for (let i = 0; i < slide.slots.length; i++) {
      const slot = slide.slots[i];

      if (!slot.name || !slot.position) {
        errors.push(`Custom slot ${i}: missing name or position`);
        continue;
      }

      const position = slot.position;
      if (position.col < 1 || position.col + position.colSpan - 1 > 12) {
        errors.push(`Slot "${slot.name}": exceeds column bounds`);
      }
      if (position.row < 1 || position.row + position.rowSpan - 1 > 6) {
        errors.push(`Slot "${slot.name}": exceeds row bounds`);
      }

      for (let j = i + 1; j < slide.slots.length; j++) {
        const otherSlot = slide.slots[j];
        if (!otherSlot?.position) continue;
        if (slotsOverlap(position, otherSlot.position)) {
          errors.push(`Slots "${slot.name}" and "${otherSlot.name}" overlap`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function slotsOverlap(a, b) {
  return !(
    a.col + a.colSpan <= b.col ||
    b.col + b.colSpan <= a.col ||
    a.row + a.rowSpan <= b.row ||
    b.row + b.rowSpan <= a.row
  );
}
