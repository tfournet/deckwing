/**
 * useChat — Chat state management hook
 *
 * Manages message history, API communication, and session lifecycle
 * for the AI chat panel.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

async function fetchSessionId() {
  const res = await fetch('/api/chat/session', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to create chat session');
  const { sessionId } = await res.json();
  return sessionId;
}

/**
 * @param {object} options
 * @param {object} options.deck - Current deck state to send with each message
 * @param {function} options.onAction - Called with action object when AI returns one
 * @param {string} [options.model] - Claude model id to use for generation
 */
export function useChat({ deck, onAction, model, currentSlideIndex }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdRef = useRef(null);

  useEffect(() => {
    fetchSessionId().then(id => { sessionIdRef.current = id; });
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading || !sessionIdRef.current) return;

    const userMsg = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      action: null,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          sessionId: sessionIdRef.current,
          deck,
          currentSlideIndex,
          model,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg = {
        id: generateId(),
        role: 'assistant',
        content: data.reply || '',
        action: data.action || null,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (data.action && onAction) {
        onAction(data.action);
      }
    } catch (err) {
      const errorMsg = {
        id: generateId(),
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        action: null,
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [currentSlideIndex, deck, isLoading, model, onAction]);

  const resetChat = useCallback(async () => {
    const oldSessionId = sessionIdRef.current;
    setMessages([]);
    setIsLoading(false);

    try {
      await fetch('/api/chat/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: oldSessionId }),
      });
    } catch {
      // Reset is best-effort — local state already cleared
    }

    try {
      sessionIdRef.current = await fetchSessionId();
    } catch {
      sessionIdRef.current = null;
    }
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    resetChat,
    sessionId: sessionIdRef.current,
  };
}

export default useChat;
