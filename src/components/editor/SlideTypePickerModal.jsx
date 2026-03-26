import { useEffect, useRef, useState } from 'react';
import { X, Type, List, LayoutGrid, Image, Quote, BarChart2, Bookmark, Square } from 'lucide-react';
import { getAllLayouts } from '../../../shared/layouts/index.js';
import { createSlide } from '../../schema/slide-schema';
import { createEmptyLayoutBlock } from './layoutBlockDefaults.js';

const SLIDE_TYPE_DEFS = [
  {
    type: 'title',
    label: 'Title',
    description: 'Hero slide with big text',
    icon: Type,
    defaultData: { title: 'New Title Slide', subtitle: '' },
  },
  {
    type: 'content',
    label: 'Content',
    description: 'Heading with bullet points',
    icon: List,
    defaultData: { title: 'New Slide', points: ['Add your content here'] },
  },
  {
    type: 'grid',
    label: 'Grid',
    description: 'Multi-column card layout',
    icon: LayoutGrid,
    defaultData: {
      title: 'Grid Layout',
      columns: 3,
      items: [
        { title: 'Item 1', description: 'Description' },
        { title: 'Item 2', description: 'Description' },
        { title: 'Item 3', description: 'Description' },
      ],
    },
  },
  {
    type: 'image',
    label: 'Image',
    description: 'Full-slide image',
    icon: Image,
    defaultData: { src: '', caption: '' },
  },
  {
    type: 'quote',
    label: 'Quote',
    description: 'Large quote with attribution',
    icon: Quote,
    defaultData: { quote: 'Your quote here.', attribution: 'Author Name' },
  },
  {
    type: 'metric',
    label: 'Metric',
    description: 'Stats and numbers display',
    icon: BarChart2,
    defaultData: {
      title: 'By the Numbers',
      metrics: [
        { value: '—', label: 'Metric', color: 'text-bot-teal-400' },
      ],
    },
  },
  {
    type: 'section',
    label: 'Section',
    description: 'Section divider',
    icon: Bookmark,
    defaultData: { title: 'New Section', subtitle: '' },
  },
  {
    type: 'blank',
    label: 'Blank',
    description: 'Empty slide',
    icon: Square,
    defaultData: {},
  },
];

/**
 * Modal for picking a slide type when adding a new slide.
 *
 * Props:
 *   onSelect(slide) — called with a new slide object on selection
 *   onClose()       — called on dismiss (Escape or backdrop click)
 */
export function SlideTypePickerModal({ onSelect, onClose }) {
  const backdropRef = useRef(null);
  const [activeTab, setActiveTab] = useState('presets');
  const layouts = getAllLayouts();

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Trap focus inside modal on mount
  useEffect(() => {
    backdropRef.current?.focus();
  }, []);

  function handleBackdropClick(e) {
    if (e.target === backdropRef.current) onClose();
  }

  function handleSelect(def) {
    const slide = createSlide(def.type, def.defaultData);
    onSelect(slide);
    onClose();
  }

  function handleSelectLayout(layout) {
    const blocks = layout.slots
      .filter((slot) => slot.required)
      .map((slot) => {
        const kind = slot.kinds?.[0] || 'text';
        return createEmptyLayoutBlock(slot.name, kind);
      });

    const slide = createSlide('layout', {
      layout: layout.id,
      blocks,
    });
    onSelect(slide);
    onClose();
  }

  return (
    /* Backdrop */
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      aria-label="Choose slide type"
    >
      {/* Panel */}
      <div className="bg-ops-indigo-900 border border-ops-indigo-600/50 rounded-xl p-4 shadow-2xl w-[640px] max-w-[calc(100vw-2rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-sm tracking-wide uppercase">
            Choose Slide Type
          </h2>
          <button
            className="text-cloud-gray-500 hover:text-cloud-gray-300 transition-colors p-1 rounded"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4" role="tablist" aria-label="Slide type sources">
          {[
            { id: 'presets', label: 'Presets' },
            { id: 'layouts', label: 'Layouts' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-bot-teal-400/15 border border-bot-teal-400/40 text-bot-teal-300'
                  : 'bg-ops-indigo-800/50 border border-ops-indigo-600/30 text-cloud-gray-400 hover:text-cloud-gray-200'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="max-h-[70vh] overflow-y-auto pr-1">
          {activeTab === 'presets' ? (
            <div className="grid grid-cols-2 gap-2" role="tabpanel" aria-label="Preset slide types">
              {SLIDE_TYPE_DEFS.map((def) => {
                const Icon = def.icon;
                return (
                  <button
                    key={def.type}
                    className="flex items-start gap-3 p-3 rounded-lg text-left
                               bg-ops-indigo-800/60 border border-ops-indigo-600/30
                               hover:bg-bot-teal-400/10 hover:border-bot-teal-400/30
                               transition-colors group"
                    onClick={() => handleSelect(def)}
                  >
                    <span className="mt-0.5 p-1.5 rounded-md bg-ops-indigo-700/60
                                     text-cloud-gray-400 group-hover:text-bot-teal-400
                                     transition-colors shrink-0">
                      <Icon size={14} />
                    </span>
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-cloud-gray-200 text-sm font-semibold
                                       group-hover:text-white transition-colors">
                        {def.label}
                      </span>
                      <span className="text-cloud-gray-500 text-xs leading-snug">
                        {def.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3" role="tabpanel" aria-label="Layout slide types">
              {layouts.map((layout) => (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => handleSelectLayout(layout)}
                  className="rounded-xl border border-ops-indigo-600/30 bg-ops-indigo-800/50 p-3 text-left transition-colors hover:border-bot-teal-400/35 hover:bg-bot-teal-400/10 group space-y-3"
                >
                  <LayoutPreview layout={layout} />
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-cloud-gray-200 group-hover:text-white transition-colors">
                      {layout.name}
                    </div>
                    <p className="text-xs leading-snug text-cloud-gray-500">
                      {layout.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LayoutPreview({ layout }) {
  return (
    <div className="rounded-lg border border-ops-indigo-600/30 bg-ops-indigo-950/60 p-2">
      <div className="grid h-24 grid-cols-12 grid-rows-6 gap-1">
        {layout.slots.map((slot) => (
          <div
            key={slot.name}
            style={{
              gridColumn: `${slot.position.col} / span ${slot.position.colSpan}`,
              gridRow: `${slot.position.row} / span ${slot.position.rowSpan}`,
            }}
            className="rounded border border-bot-teal-400/25 bg-bot-teal-400/10 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-bot-teal-200/80 overflow-hidden"
          >
            <span className="block truncate">{slot.label || slot.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
