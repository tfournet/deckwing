/**
 * useChat — Chat state management hook
 *
 * Manages message history, API communication, and session lifecycle
 * for the AI chat panel.
 */

import { useState, useCallback, useRef } from 'react';

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function generateSessionId() {
  return 'session_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
}

/**
 * @param {object} options
 * @param {object} options.deck - Current deck state to send with each message
 * @param {function} options.onAction - Called with action object when AI returns one
 * @param {string} [options.model] - Claude model id to use for generation
 */
export function useChat({ deck, onAction, model }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdRef = useRef(generateSessionId());

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

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
  }, [deck, isLoading, model, onAction]);

  const resetChat = useCallback(async () => {
    sessionIdRef.current = generateSessionId();
    setMessages([]);
    setIsLoading(false);

    try {
      await fetch('/api/chat/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionIdRef.current }),
      });
    } catch {
      // Reset is best-effort — local state already cleared
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
