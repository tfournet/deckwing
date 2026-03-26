import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Code, Eye } from 'lucide-react';
import { SLIDE_TYPES } from '../../schema/slide-schema';
import { getThemeNames } from '../../config/themes';
import { PointsEditor } from './PointsEditor';
import { GridItemEditor } from './GridItemEditor';
import { MetricsEditor } from './MetricsEditor';
import JsonEditor from './JsonEditor';

/* ── shared style tokens ───────────────────────────────────────────── */
const INPUT_CLS =
  'w-full bg-ops-indigo-800 border border-ops-indigo-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-bot-teal-400/50 placeholder-cloud-gray-600';
const TEXTAREA_CLS = `${INPUT_CLS} resize-none`;
const LABEL_CLS =
  'text-cloud-gray-400 text-xs font-bold uppercase tracking-wider mb-1 block';
const SECTION_HEADER_CLS =
  'text-cloud-gray-300 text-sm font-display font-semibold mb-3';
const FIELD_CLS = 'space-y-1';

/* ── small helpers ─────────────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div className={FIELD_CLS}>
      <label className={LABEL_CLS}>{label}</label>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-ops-indigo-700/30 my-4" />;
}

/* ── per-type field groups ─────────────────────────────────────────── */
function TitleFields({ slide, update }) {
  return (
    <>
      <Field label="Title">
        <input type="text" value={slide.title || ''} onChange={(e) => update({ title: e.target.value })} className={INPUT_CLS} placeholder="Slide title" />
      </Field>
      <Field label="Subtitle">
        <input type="text" value={slide.subtitle || ''} onChange={(e) => update({ subtitle: e.target.value })} className={INPUT_CLS} placeholder="Subtitle" />
      </Field>
      <Field label="Author">
        <input type="text" value={slide.author || ''} onChange={(e) => update({ author: e.target.value })} className={INPUT_CLS} placeholder="Author name" />
      </Field>
      <Field label="Date">
        <input type="text" value={slide.date || ''} onChange={(e) => update({ date: e.target.value })} className={INPUT_CLS} placeholder="e.g. March 2026" />
      </Field>
    </>
  );
}

function ContentFields({ slide, update }) {
  return (
    <>
      <Field label="Title">
        <input type="text" value={slide.title || ''} onChange={(e) => update({ title: e.target.value })} className={INPUT_CLS} placeholder="Slide title" />
      </Field>
      <Field label="Subtitle">
        <input type="text" value={slide.subtitle || ''} onChange={(e) => update({ subtitle: e.target.value })} className={INPUT_CLS} placeholder="Subtitle" />
      </Field>
      <Field label="Icon (Lucide name)">
        <input type="text" value={slide.icon || ''} onChange={(e) => update({ icon: e.target.value })} className={INPUT_CLS} placeholder="e.g. Zap, Shield, Play" />
      </Field>
      <Divider />
      <div>
        <p className={SECTION_HEADER_CLS}>Bullet Points</p>
        <PointsEditor
          points={slide.points || []}
          onChange={(points) => update({ points })}
        />
      </div>
    </>
  );
}

function GridFields({ slide, update }) {
  return (
    <>
      <Field label="Title">
        <input type="text" value={slide.title || ''} onChange={(e) => update({ title: e.target.value })} className={INPUT_CLS} placeholder="Slide title" />
      </Field>
      <Field label="Subtitle">
        <input type="text" value={slide.subtitle || ''} onChange={(e) => update({ subtitle: e.target.value })} className={INPUT_CLS} placeholder="Subtitle" />
      </Field>
      <Field label="Columns (1–4)">
        <input
          type="number"
          min={1}
          max={4}
          value={slide.columns || 3}
          onChange={(e) => update({ columns: Math.min(4, Math.max(1, Number(e.target.value))) })}
          className={INPUT_CLS}
        />
      </Field>
      <Divider />
      <div>
        <p className={SECTION_HEADER_CLS}>Grid Items</p>
        <GridItemEditor
          items={slide.items || []}
          onChange={(items) => update({ items })}
        />
      </div>
    </>
  );
}

function ImageFields({ slide, update }) {
  return (
    <>
      <Field label="Image URL">
        <input type="text" value={slide.src || ''} onChange={(e) => update({ src: e.target.value })} className={INPUT_CLS} placeholder="https://..." />
      </Field>
      <Field label="Title">
        <input type="text" value={slide.title || ''} onChange={(e) => update({ title: e.target.value })} className={INPUT_CLS} placeholder="Optional title" />
      </Field>
      <Field label="Caption">
        <input type="text" value={slide.caption || ''} onChange={(e) => update({ caption: e.target.value })} className={INPUT_CLS} placeholder="Optional caption" />
      </Field>
      <Field label="Fit">
        <select
          value={slide.fit || 'contain'}
          onChange={(e) => update({ fit: e.target.value })}
          className={`${INPUT_CLS} cursor-pointer`}
        >
          <option value="contain">Contain</option>
          <option value="cover">Cover</option>
        </select>
      </Field>
    </>
  );
}

function QuoteFields({ slide, update }) {
  return (
    <>
      <Field label="Quote">
        <textarea
          value={slide.quote || ''}
          onChange={(e) => update({ quote: e.target.value })}
          rows={4}
          className={TEXTAREA_CLS}
          placeholder="The quote text…"
        />
      </Field>
      <Field label="Attribution">
        <input type="text" value={slide.attribution || ''} onChange={(e) => update({ attribution: e.target.value })} className={INPUT_CLS} placeholder="Person name" />
      </Field>
      <Field label="Role / Title">
        <input type="text" value={slide.role || ''} onChange={(e) => update({ role: e.target.value })} className={INPUT_CLS} placeholder="e.g. CEO, Author" />
      </Field>
    </>
  );
}

function MetricFields({ slide, update }) {
  return (
    <>
      <Field label="Title">
        <input type="text" value={slide.title || ''} onChange={(e) => update({ title: e.target.value })} className={INPUT_CLS} placeholder="Optional title" />
      </Field>
      <Field label="Subtitle">
        <input type="text" value={slide.subtitle || ''} onChange={(e) => update({ subtitle: e.target.value })} className={INPUT_CLS} placeholder="Optional subtitle" />
      </Field>
      <Divider />
      <div>
        <p className={SECTION_HEADER_CLS}>Metrics</p>
        <MetricsEditor
          metrics={slide.metrics || []}
          onChange={(metrics) => update({ metrics })}
        />
      </div>
    </>
  );
}

function SectionFields({ slide, update }) {
  return (
    <>
      <Field label="Title">
        <input type="text" value={slide.title || ''} onChange={(e) => update({ title: e.target.value })} className={INPUT_CLS} placeholder="Section title" />
      </Field>
      <Field label="Subtitle">
        <input type="text" value={slide.subtitle || ''} onChange={(e) => update({ subtitle: e.target.value })} className={INPUT_CLS} placeholder="Optional subtitle" />
      </Field>
    </>
  );
}

const TYPE_FIELDS = {
  title: TitleFields,
  content: ContentFields,
  grid: GridFields,
  image: ImageFields,
  quote: QuoteFields,
  metric: MetricFields,
  section: SectionFields,
  blank: () => null,
};

/* ── main component ────────────────────────────────────────────────── */

/**
 * SlideEditor - Inline editor panel for the current slide
 *
 * Props:
 *   slide        – current slide object
 *   index        – current slide index in deck
 *   onUpdateSlide(index, changes) – callback to apply changes
 */
export function SlideEditor({ slide, index, onUpdateSlide }) {
  const [open, setOpen] = useState(false);
  const [jsonMode, setJsonMode] = useState(false);

  const update = (changes) => onUpdateSlide(index, changes);
  const handleJsonChange = (parsed) => {
    const { id, ...rest } = parsed;
    onUpdateSlide(index, rest);
  };

  const TypeFields = TYPE_FIELDS[slide?.type] || null;
  const themeNames = getThemeNames();
  const slideTypes = Object.keys(SLIDE_TYPES);

  const handleTypeChange = (newType) => {
    // When changing type, preserve common fields and reset type-specific ones
    update({ type: newType });
  };

  if (!slide) return null;

  return (
    <div className="shrink-0 border-t border-ops-indigo-700/30">
      {/* Toggle bar */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-ops-indigo-900/60 hover:bg-ops-indigo-800/40 transition-colors"
      >
        <div className="flex items-center gap-2 text-cloud-gray-300 text-sm font-display font-semibold">
          <Pencil size={14} className="text-bot-teal-400" />
          Edit Slide
          {open && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setJsonMode(v => !v); }}
              className="ml-3 flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-ops-indigo-800 hover:bg-ops-indigo-700 text-cloud-gray-400 hover:text-white transition-colors"
              title={jsonMode ? 'Visual editor' : 'JSON editor'}
            >
              {jsonMode ? <Eye size={12} /> : <Code size={12} />}
              {jsonMode ? 'Visual' : 'JSON'}
            </button>
          )}
        </div>
        {open ? (
          <ChevronUp size={16} className="text-cloud-gray-500" />
        ) : (
          <ChevronDown size={16} className="text-cloud-gray-500" />
        )}
      </button>

      {/* Editor body */}
      {open && (
        <div className="bg-ops-indigo-900/40 px-4 py-4 space-y-4 overflow-y-auto max-h-80">
          {jsonMode ? (
            <JsonEditor value={slide} onChange={handleJsonChange} mode="slide" />
          ) : (
          <>
          {/* Slide meta controls */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slide Type">
              <select
                value={slide.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className={`${INPUT_CLS} cursor-pointer`}
              >
                {slideTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Theme">
              <select
                value={slide.theme || 'rewst'}
                onChange={(e) => update({ theme: e.target.value })}
                className={`${INPUT_CLS} cursor-pointer`}
              >
                {themeNames.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Type-specific fields */}
          {TypeFields && (
            <>
              <Divider />
              <div className="space-y-3">
                <TypeFields slide={slide} update={update} />
              </div>
            </>
          )}

          {/* Speaker notes */}
          <Divider />
          <Field label="Speaker Notes">
            <textarea
              value={slide.notes || ''}
              onChange={(e) => update({ notes: e.target.value })}
              rows={3}
              placeholder="Notes for the presenter…"
              className={TEXTAREA_CLS}
            />
          </Field>
          </>
          )}
        </div>
      )}
    </div>
  );
}

