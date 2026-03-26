/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDetachedEditor } from './useDetachedEditor';

function createChildWindow() {
  return {
    closed: false,
    close: vi.fn(function close() {
      this.closed = true;
    }),
    focus: vi.fn(),
    postMessage: vi.fn(),
  };
}

describe('useDetachedEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns false when window.open is blocked', () => {
    vi.spyOn(window, 'open').mockReturnValue(null);

    const { result } = renderHook(() => useDetachedEditor());

    let opened;
    act(() => {
      opened = result.current.openEditor();
    });

    expect(opened).toBe(false);
    expect(result.current.isDetached).toBe(false);
  });

  it('posts slide data to the child window', () => {
    const child = createChildWindow();
    vi.spyOn(window, 'open').mockReturnValue(child);

    const { result } = renderHook(() => useDetachedEditor());

    act(() => {
      result.current.openEditor();
      result.current.sendSlideData({ title: 'Detached' }, 2);
    });

    expect(child.postMessage).toHaveBeenCalledWith(
      {
        type: 'deckwing:slide-data',
        slide: { title: 'Detached' },
        index: 2,
      },
      window.location.origin,
    );
  });

  it('closes the child window and clears detached state', () => {
    const child = createChildWindow();
    vi.spyOn(window, 'open').mockReturnValue(child);

    const { result } = renderHook(() => useDetachedEditor());

    act(() => {
      result.current.openEditor();
    });

    expect(result.current.isDetached).toBe(true);

    act(() => {
      result.current.closeEditor();
    });

    expect(child.close).toHaveBeenCalledTimes(1);
    expect(result.current.isDetached).toBe(false);
  });

  it('delivers edit messages from the child window to the listener', () => {
    const onEdit = vi.fn();
    const child = createChildWindow();
    vi.spyOn(window, 'open').mockReturnValue(child);

    renderHook(() => {
      const detachedEditor = useDetachedEditor();
      detachedEditor.useEditListener(onEdit);
      return detachedEditor;
    });

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: window.location.origin,
        source: window,
        data: {
          type: 'deckwing:slide-edit',
          index: 1,
          changes: { title: 'Updated from child' },
        },
      }));
    });

    expect(onEdit).toHaveBeenCalledWith(1, { title: 'Updated from child' });
  });
});
