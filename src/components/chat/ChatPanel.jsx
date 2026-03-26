/**
 * ChatPanel — Right sidebar AI chat interface
 *
 * Handles the full chat UI: message list, input, send, reset.
 * Receives messages, loading state, and callbacks from useChat via props.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { MessageSquare, Send, RotateCcw, Loader2 } from 'lucide-react';
import { ChatMessage, TypingIndicator } from './ChatMessage';

/**
 * @param {object} props
 * @param {Array} props.messages - Message array from useChat
 * @param {boolean} props.isLoading - Whether AI is processing
 * @param {function} props.onSendMessage - Called with text string
 * @param {function} props.onResetChat - Called to reset conversation
 * @param {function} props.onClose - Called when close button clicked
 */
export function ChatPanel({ messages, isLoading, onSendMessage, onResetChat, onClose }) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInputValue('');
    inputRef.current?.focus();
  }, [inputValue, isLoading, onSendMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleReset = useCallback(() => {
    onResetChat();
    inputRef.current?.focus();
  }, [onResetChat]);

  const isEmpty = messages.length === 0;

  return (
    <aside className="w-96 bg-ops-indigo-900/50 border-l border-ops-indigo-700/30 flex flex-col shrink-0">
      {/* Panel header */}
      <div className="h-10 px-3 border-b border-ops-indigo-700/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-cloud-gray-400 text-xs font-bold uppercase tracking-wider">
            AI Assistant
          </span>
          {isLoading && (
            <Loader2 size={11} className="text-bot-teal-400 animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isEmpty && (
            <button
              className="text-cloud-gray-600 hover:text-cloud-gray-300 transition-colors p-1 rounded"
              onClick={handleReset}
              title="New chat"
            >
              <RotateCcw size={13} />
            </button>
          )}
          <button
            className="text-cloud-gray-600 hover:text-cloud-gray-300 transition-colors p-1 rounded leading-none"
            onClick={onClose}
            title="Close"
          >
            <span className="text-base leading-none">&times;</span>
          </button>
        </div>
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-0"
      >
        {isEmpty ? (
          /* Welcome state */
          <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
            <div className="mb-4 p-3 rounded-xl bg-bot-teal-400/10 border border-bot-teal-400/20">
              <MessageSquare size={28} className="text-bot-teal-400 opacity-80" />
            </div>
            <p className="text-cloud-gray-200 text-base font-display font-semibold mb-2">
              Chat with AI to build your deck
            </p>
            <p className="text-cloud-gray-500 text-sm leading-relaxed max-w-xs">
              Describe your topic, ask to add slides, or refine content. The AI understands Rewst's brand and audience.
            </p>
            <div className="mt-6 space-y-2 w-full max-w-xs">
              {[
                'Create a 6-slide deck about MSP automation ROI',
                'Add a metrics slide with onboarding stats',
                'Make slide 2 more concise',
              ].map((prompt) => (
                <button
                  key={prompt}
                  className="w-full text-left text-xs text-cloud-gray-400 hover:text-cloud-gray-200 bg-ops-indigo-800/40 hover:bg-ops-indigo-800/70 border border-ops-indigo-600/30 rounded-lg px-3 py-2 transition-colors"
                  onClick={() => {
                    setInputValue(prompt);
                    inputRef.current?.focus();
                  }}
                >
                  &ldquo;{prompt}&rdquo;
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-ops-indigo-700/30 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            className="flex-1 bg-ops-indigo-800 border border-ops-indigo-600/50 rounded-xl px-3 py-2 text-sm text-white placeholder-cloud-gray-600 focus:outline-none focus:border-bot-teal-400/50 resize-none leading-relaxed transition-colors min-h-[36px] max-h-32"
            placeholder="Describe your presentation..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
            style={{
              height: 'auto',
              minHeight: '36px',
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
            }}
          />
          <button
            className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              inputValue.trim() && !isLoading
                ? 'bg-bot-teal-400 hover:bg-bot-teal-500 text-ops-indigo-950'
                : 'bg-ops-indigo-700 text-cloud-gray-600 cursor-not-allowed'
            }`}
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            title="Send (Enter)"
          >
            {isLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </div>
        <p className="text-cloud-gray-700 text-xs mt-1.5 px-1">
          Enter to send, Shift+Enter for newline
        </p>
      </div>
    </aside>
  );
}

export default ChatPanel;
