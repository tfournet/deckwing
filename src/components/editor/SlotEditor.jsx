import { useEffect, useMemo, useState } from 'react';
import { getLayout } from '../../../shared/layouts/index.js';
import { PointsEditor } from './PointsEditor';
import { createEmptyLayoutBlock } from './layoutBlockDefaults.js';

const INPUT_CLS =
  'w-full bg-ops-indigo-800 border border-ops-indigo-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-bot-teal-400/50 placeholder-cloud-gray-600';
const TEXTAREA_CLS = `${INPUT_CLS} resize-none`;
const LABEL_CLS =
  'text-cloud-gray-400 text-xs font-bold uppercase tracking-wider mb-1 block';

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className={LABEL_CLS}>{label}</label>
      {children}
    </div>
  );
}

function buildJsonFallbackValue(block, kind) {
  if (kind === 'chart') {
    return {
      type: block?.type || 'bar',
      data: block?.data || [],
    };
  }

  if (kind === 'table') {
    return {
      headers: block?.headers || [],
      rows: block?.rows || [],
    };
  }

  return block || {};
}

function JsonFallbackField({ kind, block, slotLabel, onChange }) {
  const rawValue = useMemo(
    () => JSON.stringify(buildJsonFallbackValue(block, kind), null, 2),
    [block, kind],
  );
  const [text, setText] = useState(rawValue);
  const [error, setError] = useState('');

  useEffect(() => {
    setText(rawValue);
    setError('');
  }, [rawValue]);

  const handleTextChange = (event) => {
    const nextText = event.target.value;
    setText(nextText);

    try {
      const parsed = JSON.parse(nextText || '{}');
      setError('');
      onChange(parsed);
    } catch {
      setError('Enter valid JSON to update this block.');
    }
  };

  return (
    <div className="space-y-2">
      <Field label={`${kind} JSON`}>
        <textarea
          rows={6}
          value={text}
          onChange={handleTextChange}
          className={TEXTAREA_CLS}
          aria-label={`${slotLabel} ${kind} json`}
          spellCheck={false}
        />
      </Field>
      {error ? <p className="text-xs text-alert-coral-300">{error}</p> : null}
    </div>
  );
}

function SlotField({ slotDef, block, onChange }) {
  const slotLabel = slotDef.label || slotDef.name;
  const allowedKinds = slotDef.kinds?.length ? slotDef.kinds : ['text'];
  const activeBlock = block || createEmptyLayoutBlock(slotDef.name, allowedKinds[0]);

  const updateBlock = (changes) => {
    onChange({
      ...activeBlock,
      ...changes,
      slot: slotDef.name,
      kind: changes.kind || activeBlock.kind,
    });
  };

  return (
    <div
      data-slot-editor={slotDef.name}
      className="rounded-xl border border-ops-indigo-700/40 bg-ops-indigo-900/30 p-4 space-y-4"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-cloud-gray-200">{slotLabel}</h3>
          <p className="text-xs text-cloud-gray-500">
            Slot: <span className="font-mono">{slotDef.name}</span>
          </p>
        </div>

        <div className="w-full md:w-56">
          <Field label="Kind">
            <select
              value={activeBlock.kind}
              onChange={(event) => onChange(createEmptyLayoutBlock(slotDef.name, event.target.value))}
              className={`${INPUT_CLS} cursor-pointer`}
              aria-label={`${slotLabel} block kind`}
            >
              {allowedKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {activeBlock.kind === 'heading' && (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <Field label="Title">
            <input
              type="text"
              value={activeBlock.text || ''}
              onChange={(event) => updateBlock({ text: event.target.value })}
              className={INPUT_CLS}
              placeholder="Heading text"
              aria-label={`${slotLabel} heading text`}
            />
          </Field>
          <Field label="Size">
            <select
              value={activeBlock.size || 'lg'}
              onChange={(event) => updateBlock({ size: event.target.value })}
              className={`${INPUT_CLS} cursor-pointer`}
              aria-label={`${slotLabel} heading size`}
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">Extra Large</option>
            </select>
          </Field>
        </div>
      )}

      {activeBlock.kind === 'text' && (
        <Field label="Text">
          <textarea
            rows={4}
            value={activeBlock.text || ''}
            onChange={(event) => updateBlock({ text: event.target.value })}
            className={TEXTAREA_CLS}
            placeholder="Add text"
            aria-label={`${slotLabel} text`}
          />
        </Field>
      )}

      {activeBlock.kind === 'list' && (
        <div className="space-y-1">
          <span className={LABEL_CLS}>Bullet Points</span>
          <PointsEditor
            points={activeBlock.items || []}
            onChange={(items) => updateBlock({ items })}
          />
        </div>
      )}

      {activeBlock.kind === 'metric' && (
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Value">
            <input
              type="text"
              value={activeBlock.value || ''}
              onChange={(event) => updateBlock({ value: event.target.value })}
              className={INPUT_CLS}
              placeholder="42%"
              aria-label={`${slotLabel} metric value`}
            />
          </Field>
          <Field label="Label">
            <input
              type="text"
              value={activeBlock.label || ''}
              onChange={(event) => updateBlock({ label: event.target.value })}
              className={INPUT_CLS}
              placeholder="Metric label"
              aria-label={`${slotLabel} metric label`}
            />
          </Field>
        </div>
      )}

      {activeBlock.kind === 'image' && (
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Image URL">
            <input
              type="text"
              value={activeBlock.src || ''}
              onChange={(event) => updateBlock({ src: event.target.value })}
              className={INPUT_CLS}
              placeholder="https://..."
              aria-label={`${slotLabel} image url`}
            />
          </Field>
          <Field label="Alt Text">
            <input
              type="text"
              value={activeBlock.alt || ''}
              onChange={(event) => updateBlock({ alt: event.target.value })}
              className={INPUT_CLS}
              placeholder="Describe the image"
              aria-label={`${slotLabel} image alt`}
            />
          </Field>
        </div>
      )}

      {activeBlock.kind === 'quote' && (
        <div className="space-y-3">
          <Field label="Quote">
            <textarea
              rows={4}
              value={activeBlock.text || ''}
              onChange={(event) => updateBlock({ text: event.target.value })}
              className={TEXTAREA_CLS}
              placeholder="Quote text"
              aria-label={`${slotLabel} quote text`}
            />
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Attribution">
              <input
                type="text"
                value={activeBlock.attribution || ''}
                onChange={(event) => updateBlock({ attribution: event.target.value })}
                className={INPUT_CLS}
                placeholder="Person name"
                aria-label={`${slotLabel} quote attribution`}
              />
            </Field>
            <Field label="Role">
              <input
                type="text"
                value={activeBlock.role || ''}
                onChange={(event) => updateBlock({ role: event.target.value })}
                className={INPUT_CLS}
                placeholder="Role or title"
                aria-label={`${slotLabel} quote role`}
              />
            </Field>
          </div>
        </div>
      )}

      {activeBlock.kind === 'callout' && (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <Field label="Text">
            <textarea
              rows={3}
              value={activeBlock.text || ''}
              onChange={(event) => updateBlock({ text: event.target.value })}
              className={TEXTAREA_CLS}
              placeholder="Callout text"
              aria-label={`${slotLabel} callout text`}
            />
          </Field>
          <Field label="Variant">
            <select
              value={activeBlock.variant || 'teal'}
              onChange={(event) => updateBlock({ variant: event.target.value })}
              className={`${INPUT_CLS} cursor-pointer`}
              aria-label={`${slotLabel} callout variant`}
            >
              <option value="teal">Teal</option>
              <option value="amber">Amber</option>
              <option value="coral">Coral</option>
            </select>
          </Field>
        </div>
      )}

      {activeBlock.kind === 'icon' && (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <Field label="Icon Name">
            <input
              type="text"
              value={activeBlock.name || ''}
              onChange={(event) => updateBlock({ name: event.target.value })}
              className={INPUT_CLS}
              placeholder="Zap"
              aria-label={`${slotLabel} icon name`}
            />
          </Field>
          <Field label="Size">
            <input
              type="number"
              min={12}
              max={160}
              value={activeBlock.size || 48}
              onChange={(event) => updateBlock({ size: Number(event.target.value) || 48 })}
              className={INPUT_CLS}
              aria-label={`${slotLabel} icon size`}
            />
          </Field>
        </div>
      )}

      {(activeBlock.kind === 'chart' || activeBlock.kind === 'table') && (
        <JsonFallbackField
          kind={activeBlock.kind}
          block={activeBlock}
          slotLabel={slotLabel}
          onChange={(parsed) => onChange({ slot: slotDef.name, kind: activeBlock.kind, ...parsed })}
        />
      )}
    </div>
  );
}

/**
 * SlotEditor — renders a form for each slot in a layout slide.
 * Props:
 *   slide - the layout slide object
 *   onUpdateBlocks(newBlocks) - callback with updated blocks array
 */
export function SlotEditor({ slide, onUpdateBlocks }) {
  const layout = slide.layout === 'custom' ? null : getLayout(slide.layout);
  if (slide.layout !== 'custom' && !layout) {
    return <p className="text-alert-coral-300 text-sm">Unknown layout: "{slide.layout}"</p>;
  }

  const slots = slide.layout === 'custom' ? (slide.slots || []) : (layout?.slots || []);
  const slotOrder = new Map(slots.map((slot, index) => [slot.name, index]));

  const handleSlotChange = (slotName, updatedBlock) => {
    const existingBlocks = slide.blocks || [];
    const hasExistingBlock = existingBlocks.some((candidate) => candidate.slot === slotName);
    const nextBlocks = hasExistingBlock
      ? existingBlocks.map((candidate) => (candidate.slot === slotName ? updatedBlock : candidate))
      : [...existingBlocks, updatedBlock];

    nextBlocks.sort(
      (left, right) =>
        (slotOrder.get(left.slot) ?? Number.MAX_SAFE_INTEGER)
        - (slotOrder.get(right.slot) ?? Number.MAX_SAFE_INTEGER),
    );

    onUpdateBlocks(nextBlocks);
  };

  return (
    <div className="space-y-4">
      {slots.map((slotDef) => {
        const block = (slide.blocks || []).find((candidate) => candidate.slot === slotDef.name);

        return (
          <SlotField
            key={slotDef.name}
            slotDef={slotDef}
            block={block}
            onChange={(updatedBlock) => handleSlotChange(slotDef.name, updatedBlock)}
          />
        );
      })}
    </div>
  );
}

export default SlotEditor;
