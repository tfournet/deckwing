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
  const [thinkingStatus, setThinkingStatus] = useState(null);
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
    setThinkingStatus(null);

    try {
      const response = await fetch('/api/chat/stream', {
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

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let result = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'thinking') {
              setThinkingStatus(data.status);
            } else if (data.type === 'result') {
              result = data;
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.includes('JSON')) throw parseErr;
          }
        }
      }

      setThinkingStatus(null);

      if (result) {
        const assistantMsg = {
          id: generateId(),
          role: 'assistant',
          content: result.reply || '',
          action: result.action || null,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMsg]);

        if (result.action && onAction) {
          onAction(result.action);
        }
      }
    } catch (err) {
      setThinkingStatus(null);
      const errorMsg = {
        id: generateId(),
        role: 'assistant',
        content: err.message || 'Something went wrong. Please try again.',
        action: null,
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setThinkingStatus(null);
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
    thinkingStatus,
    sendMessage,
    resetChat,
    sessionId: sessionIdRef.current,
  };
}

export default useChat;
