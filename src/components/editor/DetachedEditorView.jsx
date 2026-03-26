import { useState, useEffect, useCallback } from 'react';
import { Pencil } from 'lucide-react';
import { SLIDE_TYPES } from '../../schema/slide-schema';
import { getThemeNames } from '../../config/themes';
import { EditorContent, TYPE_FIELDS } from './SlideEditor';

export function DetachedEditorView() {
  const [slide, setSlide] = useState(null);
  const [index, setIndex] = useState(0);
  const [jsonMode, setJsonMode] = useState(false);

  useEffect(() => {
    document.title = 'DeckWing Editor';

    function handler(event) {
      if (event.origin !== window.location.origin) return;
      if (event.source !== window.opener) return;
      if (event.data?.type === 'deckwing:slide-data') {
        setSlide(event.data.slide);
        setIndex(event.data.index);
      }
    }

    window.addEventListener('message', handler);

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'deckwing:editor-ready' }, window.location.origin);
    }

    return () => window.removeEventListener('message', handler);
  }, []);

  const update = useCallback((changes) => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'deckwing:slide-edit',
        index,
        changes,
      }, window.location.origin);
    }
  }, [index]);

  const handleJsonChange = useCallback((parsed) => {
    const { id, ...rest } = parsed;
    update(rest);
  }, [update]);

  const handleTypeChange = useCallback((newType) => {
    update({ type: newType });
  }, [update]);

  if (!slide) {
    return (
      <div className="w-screen h-screen bg-ops-indigo-950 flex items-center justify-center">
        <p className="text-cloud-gray-400 text-sm">Waiting for slide data...</p>
      </div>
    );
  }

  const slideTypes = Object.keys(SLIDE_TYPES);
  const themeNames = getThemeNames();
  const TypeFields = TYPE_FIELDS[slide.type] || null;

  return (
    <div className="w-screen h-screen bg-ops-indigo-900 overflow-y-auto p-4">
      <div className="max-w-2xl mx-auto bg-ops-indigo-950/40 border border-ops-indigo-700/30 rounded-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-ops-indigo-700/30">
          <div className="flex items-center gap-2 text-cloud-gray-300 text-sm font-display font-semibold">
            <Pencil size={14} className="text-bot-teal-400" />
            Editing Slide {index + 1}
            <span className="text-cloud-gray-500 text-xs capitalize">({slide.type})</span>
          </div>
          <button
            type="button"
            onClick={() => setJsonMode((value) => !value)}
            className="px-2 py-1 rounded text-xs bg-ops-indigo-800 hover:bg-ops-indigo-700 text-cloud-gray-400 hover:text-white transition-colors"
          >
            {jsonMode ? 'Visual' : 'JSON'}
          </button>
        </div>
        <div className="p-4 space-y-4">
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
  );
}

export default DetachedEditorView;
