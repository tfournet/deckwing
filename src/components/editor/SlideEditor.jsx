import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, Pencil, Code, Eye, Maximize2, Minimize2, X } from 'lucide-react';
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
  const [poppedOut, setPoppedOut] = useState(false);
  const [panelHeight, setPanelHeight] = useState(320);
  const dragRef = useRef(null);

  const update = (changes) => onUpdateSlide(index, changes);
  const handleJsonChange = (parsed) => {
    const { id, ...rest } = parsed;
    onUpdateSlide(index, rest);
  };

  // Drag-to-resize handle
  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = panelHeight;

    function onMove(ev) {
      const delta = startY - ev.clientY;
      setPanelHeight(Math.max(160, Math.min(800, startHeight + delta)));
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [panelHeight]);

  // Close popout on Escape
  useEffect(() => {
    if (!poppedOut) return;
    const handler = (e) => { if (e.key === 'Escape') setPoppedOut(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [poppedOut]);

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
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setJsonMode(v => !v); }}
                className="ml-3 flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-ops-indigo-800 hover:bg-ops-indigo-700 text-cloud-gray-400 hover:text-white transition-colors"
                title={jsonMode ? 'Visual editor' : 'JSON editor'}
              >
                {jsonMode ? <Eye size={12} /> : <Code size={12} />}
                {jsonMode ? 'Visual' : 'JSON'}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPoppedOut(true); }}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-ops-indigo-800 hover:bg-ops-indigo-700 text-cloud-gray-400 hover:text-white transition-colors"
                title="Pop out editor"
              >
                <Maximize2 size={12} />
              </button>
            </>
          )}
        </div>
        {open ? (
          <ChevronUp size={16} className="text-cloud-gray-500" />
        ) : (
          <ChevronDown size={16} className="text-cloud-gray-500" />
        )}
      </button>

      {/* Editor body — inline panel */}
      {open && !poppedOut && (
        <>
          {/* Drag-to-resize handle */}
          <div
            className="h-1.5 cursor-ns-resize bg-ops-indigo-700/30 hover:bg-bot-teal-400/30 transition-colors flex items-center justify-center"
            onMouseDown={handleDragStart}
            title="Drag to resize"
          >
            <div className="w-8 h-0.5 bg-cloud-gray-600 rounded-full" />
          </div>
          <div
            className="bg-ops-indigo-900/40 px-4 py-4 space-y-4 overflow-y-auto"
            style={{ maxHeight: panelHeight }}
          >
            <EditorContent
              slide={slide}
              jsonMode={jsonMode}
              handleJsonChange={handleJsonChange}
              handleTypeChange={handleTypeChange}
              update={update}
              slideTypes={slideTypes}
              themeNames={themeNames}
              TypeFields={TypeFields}
            />
          </div>
        </>
      )}

      {/* Pop-out modal */}
      {open && poppedOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-ops-indigo-900 border border-ops-indigo-600/50 rounded-xl shadow-2xl w-[700px] max-w-[calc(100vw-2rem)] max-h-[80vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-ops-indigo-700/30 shrink-0">
              <div className="flex items-center gap-2 text-cloud-gray-300 text-sm font-display font-semibold">
                <Pencil size={14} className="text-bot-teal-400" />
                Edit Slide {index + 1}
                <span className="text-cloud-gray-500 text-xs capitalize">({slide.type})</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setJsonMode(v => !v)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-ops-indigo-800 hover:bg-ops-indigo-700 text-cloud-gray-400 hover:text-white transition-colors"
                >
                  {jsonMode ? <Eye size={12} /> : <Code size={12} />}
                  {jsonMode ? 'Visual' : 'JSON'}
                </button>
                <button
                  type="button"
                  onClick={() => setPoppedOut(false)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-ops-indigo-800 hover:bg-ops-indigo-700 text-cloud-gray-400 hover:text-white transition-colors"
                  title="Dock editor"
                >
                  <Minimize2 size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => { setPoppedOut(false); setOpen(false); }}
                  className="p-1 rounded text-cloud-gray-500 hover:text-cloud-gray-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <EditorContent
                slide={slide}
                jsonMode={jsonMode}
                handleJsonChange={handleJsonChange}
                handleTypeChange={handleTypeChange}
                update={update}
                slideTypes={slideTypes}
                themeNames={themeNames}
                TypeFields={TypeFields}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── shared editor content (used by both inline and popout) ──────── */

function EditorContent({ slide, jsonMode, handleJsonChange, handleTypeChange, update, slideTypes, themeNames, TypeFields }) {
  return jsonMode ? (
    <JsonEditor value={slide} onChange={handleJsonChange} mode="slide" />
  ) : (
    <>
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

      {TypeFields && (
        <>
          <Divider />
          <div className="space-y-3">
            <TypeFields slide={slide} update={update} />
          </div>
        </>
      )}

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
  );
}

