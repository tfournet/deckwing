/**
 * ChatMessage — Individual message bubble in the chat panel
 *
 * User messages: right-aligned, ops-indigo-800 background
 * AI messages: left-aligned, bot-teal accent bar on left edge
 * Loading state: animated typing indicator
 */

import { Bot, Search } from 'lucide-react';

/**
 * Formats a Date into a relative time string.
 * @param {Date} date
 * @returns {string}
 */
function formatRelativeTime(date) {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  return date.toLocaleDateString();
}

/**
 * Summarizes an AI action into a short human-readable string.
 * @param {object} action
 * @returns {string|null}
 */
function describeAction(action) {
  if (!action) return null;
  switch (action.type) {
    case 'create_deck': {
      const count = action.data?.slides?.length ?? 0;
      return `Created a ${count}-slide deck`;
    }
    case 'update_slide': {
      const idx = action.data?.index;
      return idx != null ? `Updated slide ${idx + 1}` : 'Updated a slide';
    }
    case 'add_slide': {
      return 'Added a slide';
    }
    case 'remove_slide': {
      const idx = action.data?.index;
      return idx != null ? `Removed slide ${idx + 1}` : 'Removed a slide';
    }
    case 'reorder': {
      return 'Reordered slides';
    }
    default:
      return null;
  }
}

/**
 * Animated typing indicator shown while the AI is processing.
 * Shows a thinking status line when available, bouncing dots otherwise.
 */
export function TypingIndicator({ thinkingStatus }) {
  return (
    <div className="flex items-start gap-2 mb-3">
      {/* Teal accent bar */}
      <div className="w-0.5 self-stretch bg-bot-teal-400/60 rounded-full shrink-0 ml-px" />

      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Bot size={11} className="text-bot-teal-400 shrink-0" />
          <span className="text-cloud-gray-500 text-xs font-medium">Deckster</span>
        </div>
        <div className="bg-ops-indigo-800/60 border border-ops-indigo-600/30 rounded-lg px-3 py-2.5">
          {thinkingStatus ? (
            <p className="text-cloud-gray-400 text-xs italic leading-relaxed">{thinkingStatus}</p>
          ) : (
            <div className="inline-flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full bg-bot-teal-400/70 animate-bounce"
                style={{ animationDelay: '0ms', animationDuration: '1s' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-bot-teal-400/70 animate-bounce"
                style={{ animationDelay: '150ms', animationDuration: '1s' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-bot-teal-400/70 animate-bounce"
                style={{ animationDelay: '300ms', animationDuration: '1s' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * InterviewOptions — Clickable pill buttons for interview question answers.
 *
 * Rendered below an AI message when message.interviewOptions is present.
 * Clicking a pill calls onSelectOption, which sends the value as a user message.
 * The pills use bot-teal styling consistent with the Deckster accent.
 */
function InterviewOptions({ options, onSelectOption }) {
  if (!options?.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          className="px-3 py-1.5 rounded-full border border-bot-teal-400/50 text-bot-teal-400 text-sm hover:bg-bot-teal-400/20 active:bg-bot-teal-400/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bot-teal-400/60 cursor-pointer transition-all"
          onClick={() => onSelectOption(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/**
 * ResearchIndicator — Shown when Deckster is researching approved sources.
 *
 * Appears as a distinct, muted element in the chat stream with an
 * animated pulse icon. Disappears when the AI response arrives.
 */
function ResearchIndicator({ content }) {
  return (
    <div className="flex items-start gap-2 py-2">
      <div className="w-0.5 self-stretch bg-bot-teal-400/40 rounded-full shrink-0 ml-px" />
      <div className="flex items-center gap-2 text-cloud-gray-500 text-sm italic">
        <Search size={14} className="animate-pulse shrink-0" />
        {content}
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {object} props.message - Message object with role, content, action, timestamp, isError, interviewOptions, type
 * @param {function} [props.onSelectOption] - Called when user clicks an interview pill
 */
export function ChatMessage({ message, onSelectOption }) {
  // Research status messages get their own minimal treatment
  if (message.type === 'research') {
    return <ResearchIndicator content={message.content} />;
  }

  const isUser = message.role === 'user';
  const actionLabel = !isUser ? describeAction(message.action) : null;

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div className="flex flex-col items-end gap-1 max-w-[85%]">
          <div className="bg-ops-indigo-700 border border-ops-indigo-600/50 rounded-lg rounded-tr-sm px-3 py-2">
            <p className="text-cloud-gray-100 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
          <span className="text-cloud-gray-600 text-xs tabular-nums">
            {formatRelativeTime(message.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  // AI message
  return (
    <div className="flex items-start gap-2 mb-3">
      {/* Teal accent bar — signals AI origin */}
      <div className="w-0.5 self-stretch bg-bot-teal-400/60 rounded-full shrink-0 ml-px" />

      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Bot size={11} className="text-bot-teal-400 shrink-0" />
          <span className="text-cloud-gray-500 text-xs font-medium">Deckster</span>
          <span className="text-cloud-gray-700 text-xs tabular-nums ml-auto">
            {formatRelativeTime(message.timestamp)}
          </span>
        </div>

        <div
          className={`rounded-lg rounded-tl-sm px-3 py-2 border ${
            message.isError
              ? 'bg-alert-coral-400/10 border-alert-coral-400/30'
              : 'bg-ops-indigo-800/60 border-ops-indigo-600/30'
          }`}
        >
          <p
            className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
              message.isError ? 'text-alert-coral-300' : 'text-cloud-gray-100'
            }`}
          >
            {message.content}
          </p>
        </div>

        {/* Action preview badge */}
        {actionLabel && (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-bot-teal-400/10 border border-bot-teal-400/20 w-fit mt-0.5">
            <div className="w-1 h-1 rounded-full bg-bot-teal-400" />
            <span className="text-bot-teal-400 text-xs font-medium">{actionLabel}</span>
          </div>
        )}

        {/* Interview option pills */}
        {message.interviewOptions && onSelectOption && (
          <InterviewOptions
            options={message.interviewOptions}
            onSelectOption={onSelectOption}
          />
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
