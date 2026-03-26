import { useState, useCallback, useEffect, useRef } from 'react';

export function useDetachedEditor() {
  const [isDetached, setIsDetached] = useState(false);
  const windowRef = useRef(null);
  const closeCheckRef = useRef(null);
  const latestSlideDataRef = useRef(null);

  const clearCloseCheck = useCallback(() => {
    if (closeCheckRef.current) {
      clearInterval(closeCheckRef.current);
      closeCheckRef.current = null;
    }
  }, []);

  const openEditor = useCallback(() => {
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.focus?.();
      setIsDetached(true);
      if (latestSlideDataRef.current) {
        windowRef.current.postMessage(latestSlideDataRef.current, window.location.origin);
      }
      return true;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('editor', 'detached');

    const child = window.open(url.toString(), 'deckwing-editor', 'width=700,height=600');
    if (!child) {
      return false;
    }

    clearCloseCheck();
    windowRef.current = child;
    setIsDetached(true);

    closeCheckRef.current = setInterval(() => {
      if (child.closed) {
        clearCloseCheck();
        windowRef.current = null;
        setIsDetached(false);
      }
    }, 500);

    return true;
  }, [clearCloseCheck]);

  const closeEditor = useCallback(() => {
    clearCloseCheck();
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.close();
    }
    windowRef.current = null;
    setIsDetached(false);
  }, [clearCloseCheck]);

  const sendSlideData = useCallback((slide, index) => {
    const payload = {
      type: 'deckwing:slide-data',
      slide,
      index,
    };

    latestSlideDataRef.current = payload;

    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.postMessage(payload, window.location.origin);
    }
  }, []);

  const useEditListener = (onEdit) => {
    useEffect(() => {
      function handler(event) {
        if (event.origin !== window.location.origin) return;
        if (windowRef.current && event.source && event.source !== windowRef.current) return;
        if (event.data?.type === 'deckwing:slide-edit') {
          onEdit(event.data.index, event.data.changes);
        }
      }

      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    }, [onEdit]);
  };

  useEffect(() => {
    function handleMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (windowRef.current && event.source && event.source !== windowRef.current) return;
      if (event.data?.type !== 'deckwing:editor-ready') return;
      if (!latestSlideDataRef.current) return;
      if (!windowRef.current || windowRef.current.closed) return;

      windowRef.current.postMessage(latestSlideDataRef.current, window.location.origin);
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => () => {
    clearCloseCheck();
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.close();
    }
  }, [clearCloseCheck]);

  return { isDetached, openEditor, closeEditor, sendSlideData, useEditListener };
}

export default useDetachedEditor;
