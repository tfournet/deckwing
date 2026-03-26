import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, MoreHorizontal, Copy, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { SlideTypePickerModal } from './SlideTypePickerModal';

/**
 * Enhanced slide outline panel with drag-to-reorder, duplicate, delete,
 * keyboard shortcuts, action menus, and a type-picker modal.
 *
 * Props:
 *   slides           — array of slide objects
 *   currentIndex     — index of the active slide
 *   onSelectSlide(i) — navigate to slide i
 *   onReorderSlides(newSlides) — called with reordered slides array
 *   onAddSlide(slide) — called with a newly created slide object
 *   onDuplicateSlide(i) — duplicate slide at index i
 *   onRemoveSlide(i)   — remove slide at index i
 */
export function SlideOutline({
  slides,
  currentIndex,
  onSelectSlide,
  onReorderSlides,
  onAddSlide,
  onDuplicateSlide,
  onRemoveSlide,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerInsertAt, setPickerInsertAt] = useState(null); // null = append after current
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [hoverGap, setHoverGap] = useState(null); // index where hover-gap + button shows
  const hoverTimerRef = useRef(null);

  // Drag state (stored in refs to avoid stale closure issues in event handlers)
  const dragIndex = useRef(null);
  const [dropIndicator, setDropIndicator] = useState(null); // index before which indicator shows

  const panelRef = useRef(null);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    function onKeyDown(e) {
      // Don't steal events that bubble up from inputs inside the panel
      if (e.target !== panel) return;

      const total = slides.length;
      if (total === 0) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          onSelectSlide(Math.max(0, currentIndex - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          onSelectSlide(Math.min(total - 1, currentIndex + 1));
          break;
        case 'Delete':
        case 'Backspace':
          if (total > 1) {
            e.preventDefault();
            onRemoveSlide(currentIndex);
          }
          break;
        case 'd':
        case 'D':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onDuplicateSlide(currentIndex);
          }
          break;
        default:
          break;
      }
    }

    panel.addEventListener('keydown', onKeyDown);
    return () => panel.removeEventListener('keydown', onKeyDown);
  }, [slides.length, currentIndex, onSelectSlide, onRemoveSlide, onDuplicateSlide]);

  // Close action menu on outside click
  useEffect(() => {
    if (openMenuIndex === null) return;
    function handleOutside(e) {
      // Close unless the click is inside a menu button or menu itself
      if (!e.target.closest('[data-action-menu]')) {
        setOpenMenuIndex(null);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [openMenuIndex]);

  // ── Drag-and-drop ───────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e, index) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
    // Ghost: use the element itself, default browser ghost is fine
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback((e, targetIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropIndicator(targetIndex);
  }, []);

  const handleDragLeaveList = useCallback((e) => {
    // Only clear if leaving the list container entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropIndicator(null);
    }
  }, []);

  const handleDrop = useCallback((e, targetIndex) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === targetIndex) {
      setDropIndicator(null);
      dragIndex.current = null;
      return;
    }

    const next = [...slides];
    const [moved] = next.splice(from, 1);
    // targetIndex is the "before" position; adjust for the removed element
    const insertAt = from < targetIndex ? targetIndex - 1 : targetIndex;
    next.splice(insertAt, 0, moved);
    onReorderSlides(next);

    // Keep selection on the moved slide
    onSelectSlide(insertAt);

    setDropIndicator(null);
    dragIndex.current = null;
  }, [slides, onReorderSlides, onSelectSlide]);

  const handleDragEnd = useCallback(() => {
    setDropIndicator(null);
    dragIndex.current = null;
  }, []);

  // ── Action menu ─────────────────────────────────────────────────────────────
  function ActionMenu({ index }) {
    const isFirst = index === 0;
    const isLast = index === slides.length - 1;
    const onlySlide = slides.length <= 1;

    function moveUp() {
      if (isFirst) return;
      const next = [...slides];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      onReorderSlides(next);
      onSelectSlide(index - 1);
      setOpenMenuIndex(null);
    }

    function moveDown() {
      if (isLast) return;
      const next = [...slides];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      onReorderSlides(next);
      onSelectSlide(index + 1);
      setOpenMenuIndex(null);
    }

    return (
      <div
        data-action-menu
        className="absolute right-0 top-7 z-30 w-44
                   bg-ops-indigo-800 border border-ops-indigo-600/50
                   rounded-lg shadow-xl py-1"
      >
        <MenuItem
          icon={<Copy size={12} />}
          label="Duplicate"
          shortcut="⌘D"
          onClick={() => { onDuplicateSlide(index); setOpenMenuIndex(null); }}
        />
        <MenuItem
          icon={<ChevronUp size={12} />}
          label="Move Up"
          disabled={isFirst}
          onClick={moveUp}
        />
        <MenuItem
          icon={<ChevronDown size={12} />}
          label="Move Down"
          disabled={isLast}
          onClick={moveDown}
        />
        <div className="h-px bg-ops-indigo-600/40 my-1" />
        <MenuItem
          icon={<Trash2 size={12} />}
          label="Delete"
          danger
          disabled={onlySlide}
          onClick={() => { onRemoveSlide(index); setOpenMenuIndex(null); }}
        />
      </div>
    );
  }

  function MenuItem({ icon, label, shortcut, onClick, disabled, danger }) {
    return (
      <button
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors
          ${disabled
            ? 'text-cloud-gray-600 cursor-not-allowed'
            : danger
              ? 'text-alert-coral-400 hover:bg-alert-coral-400/10'
              : 'text-cloud-gray-300 hover:bg-ops-indigo-700/60 hover:text-white'
          }`}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        data-action-menu
      >
        <span className="shrink-0">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {shortcut && (
          <span className="text-cloud-gray-600 font-mono">{shortcut}</span>
        )}
      </button>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Panel — tabIndex makes keyboard events work */}
      <div
        ref={panelRef}
        tabIndex={0}
        className="flex flex-col h-full outline-none focus-visible:ring-1 focus-visible:ring-bot-teal-400/40"
      >
        {/* Header */}
        <div className="p-3 border-b border-ops-indigo-700/30 shrink-0">
          <span className="text-cloud-gray-400 text-xs font-bold uppercase tracking-wider">
            Slides
          </span>
        </div>

        {/* Slide list */}
        <div
          className="flex-1 overflow-y-auto p-2"
          onDragLeave={handleDragLeaveList}
          onMouseLeave={() => {
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
            setHoverGap(null);
          }}
        >
          {slides.map((slide, i) => {
            const isActive = i === currentIndex;
            const showIndicatorAbove = dropIndicator === i;
            const showHoverGap = hoverGap === i && dragIndex.current === null;

            return (
              <div key={slide.id}>
                {/* Drop indicator above this item (drag mode) */}
                {showIndicatorAbove && (
                  <div className="h-0.5 bg-bot-teal-400 rounded-full mx-2 my-0.5" />
                )}

                {/* Hover-gap insert point (non-drag mode) */}
                {showHoverGap && (
                  <div className="flex items-center justify-center py-1">
                    <button
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full
                                 bg-bot-teal-400/20 border border-bot-teal-400/40
                                 text-bot-teal-400 text-xs hover:bg-bot-teal-400/30
                                 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPickerInsertAt(i);
                        setPickerOpen(true);
                        setHoverGap(null);
                      }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                )}

                {/* Gap sensor — detects mouse hovering between slides */}
                <div
                  className="h-1"
                  onMouseEnter={() => {
                    if (dragIndex.current !== null) return;
                    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                    hoverTimerRef.current = setTimeout(() => setHoverGap(i), 200);
                  }}
                  onMouseLeave={() => {
                    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                  }}
                />

                {/* Slide row */}
                <div
                  className={`relative group flex items-center w-full rounded-lg
                               transition-colors select-none cursor-pointer
                               ${isActive
                                 ? 'bg-bot-teal-400/20 border border-bot-teal-400/30'
                                 : 'border border-transparent hover:bg-ops-indigo-800/50'
                               }`}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={(e) => handleDrop(e, i)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelectSlide(i)}
                >
                  {/* Slide info */}
                  <div className="flex-1 min-w-0 p-2 pr-1">
                    <div className="flex items-baseline gap-1.5 min-w-0">
                      <span className="text-xs text-cloud-gray-500 font-mono shrink-0 w-5 text-right">
                        {i + 1}
                      </span>
                      <span
                        className={`text-sm font-medium truncate
                          ${isActive ? 'text-bot-teal-400' : 'text-cloud-gray-300'}`}
                      >
                        {slide.title || slide.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-6.5">
                      <span className="text-xs text-cloud-gray-600 capitalize">
                        {slide.type}
                      </span>
                    </div>
                  </div>

                  {/* Action menu trigger — only visible on hover or when menu open */}
                  <div className="relative shrink-0 pr-1" data-action-menu>
                    <button
                      className={`p-1 rounded transition-colors
                        ${openMenuIndex === i
                          ? 'text-cloud-gray-300 bg-ops-indigo-700/60'
                          : 'text-transparent group-hover:text-cloud-gray-500 hover:!text-cloud-gray-300 hover:bg-ops-indigo-700/60'
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuIndex(openMenuIndex === i ? null : i);
                      }}
                      title="Slide options"
                      aria-label="Slide options"
                      data-action-menu
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {openMenuIndex === i && (
                      <ActionMenu index={i} />
                    )}
                  </div>
                </div>

                {/* Drop indicator below last item */}
                {i === slides.length - 1 && dropIndicator === slides.length && (
                  <div className="h-0.5 bg-bot-teal-400 rounded-full mx-2 my-0.5" />
                )}
              </div>
            );
          })}

          {/* Drop zone at the very end when dragging past last item */}
          {slides.length > 0 && (
            <div
              className="h-4"
              onDragOver={(e) => { e.preventDefault(); setDropIndicator(slides.length); }}
              onDrop={(e) => handleDrop(e, slides.length)}
            />
          )}

          {/* Mini-slide add button at bottom */}
          <button
            className="w-full p-3 mt-1 rounded-lg border-2 border-dashed border-ops-indigo-600/40
                       hover:border-bot-teal-400/50 hover:bg-bot-teal-400/5
                       flex items-center justify-center gap-2
                       text-cloud-gray-500 hover:text-bot-teal-400
                       transition-all group"
            onClick={() => {
              setPickerInsertAt(null);
              setPickerOpen(true);
            }}
          >
            <Plus size={16} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Add slide</span>
          </button>
        </div>
      </div>

      {/* Slide type picker modal */}
      {pickerOpen && (
        <SlideTypePickerModal
          onSelect={(slide) => {
            onAddSlide(slide, pickerInsertAt);
            setPickerInsertAt(null);
          }}
          onClose={() => { setPickerOpen(false); setPickerInsertAt(null); }}
        />
      )}
    </>
  );
}
