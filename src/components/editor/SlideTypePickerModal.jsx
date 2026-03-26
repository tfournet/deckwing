import { useEffect, useRef } from 'react';
import { X, Type, List, LayoutGrid, Image, Quote, BarChart2, Bookmark, Square } from 'lucide-react';
import { createSlide } from '../../schema/slide-schema';

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
      <div className="bg-ops-indigo-900 border border-ops-indigo-600/50 rounded-xl p-4 shadow-2xl w-[480px] max-w-[calc(100vw-2rem)]">
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

        {/* 2-column type grid */}
        <div className="grid grid-cols-2 gap-2">
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
      </div>
    </div>
  );
}
