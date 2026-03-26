import { useState, useEffect, useRef, useCallback } from 'react';
import { Check, Copy, RotateCcw, AlertTriangle, Code } from 'lucide-react';
import { validateSlide, validateDeck } from '../../schema/slide-schema';
import { tw } from '../../config/tokens';

/**
 * JsonEditor — raw JSON editor with schema validation.
 *
 * Props:
 *   value     {object}          — slide or deck object to edit
 *   onChange  {function}        — called with parsed object when valid
 *   mode      {'slide'|'deck'}  — selects which validator to use
 *   className {string}          — additional wrapper classes
 */
export default function JsonEditor({ value, onChange, mode = 'slide', className = '' }) {
  const originalJson = JSON.stringify(value, null, 2);

  const [text, setText] = useState(originalJson);
  const [parseError, setParseError] = useState(null);
  const [schemaErrors, setSchemaErrors] = useState([]);
  const [isValid, setIsValid] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [copied, setCopied] = useState(false);

  const debounceRef = useRef(null);

  // Validate the current text string, returns { parsed, parseError, schemaErrors }
  const runValidation = useCallback(
    (raw) => {
      let parsed;

      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        return { parsed: null, parseError: err.message, schemaErrors: [] };
      }

      const result = mode === 'deck' ? validateDeck(parsed) : validateSlide(parsed);
      return {
        parsed,
        parseError: null,
        schemaErrors: result.valid ? [] : result.errors,
      };
    },
    [mode],
  );

  // Re-validate whenever the original value changes from outside
  useEffect(() => {
    const next = JSON.stringify(value, null, 2);
    setText(next);
    setIsDirty(false);
    const { parseError: pe, schemaErrors: se } = runValidation(next);
    setParseError(pe);
    setSchemaErrors(se);
    setIsValid(!pe && se.length === 0);
  }, [value, runValidation]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setText(raw);
    setIsDirty(raw !== originalJson);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const { parsed, parseError: pe, schemaErrors: se } = runValidation(raw);
      setParseError(pe);
      setSchemaErrors(se);
      const valid = !pe && se.length === 0;
      setIsValid(valid);
      if (valid && parsed) {
        onChange?.(parsed);
      }
    }, 300);
  };

  const handleFormat = () => {
    try {
      const pretty = JSON.stringify(JSON.parse(text), null, 2);
      setText(pretty);
      setIsDirty(pretty !== originalJson);
    } catch {
      // text is invalid JSON — leave as-is, error already shown
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  const handleReset = () => {
    setText(originalJson);
    setIsDirty(false);
    const { parseError: pe, schemaErrors: se } = runValidation(originalJson);
    setParseError(pe);
    setSchemaErrors(se);
    setIsValid(!pe && se.length === 0);
  };

  // Derived border color
  const borderClass = isDirty
    ? isValid
      ? 'border-green-500/70'
      : 'border-alert-coral-400/70'
    : 'border-slate-700';

  const hasErrors = parseError !== null || schemaErrors.length > 0;

  return (
    <div className={tw('flex flex-col gap-2', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Code size={13} className="text-slate-500" />
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wide">
            {mode} JSON
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Valid indicator */}
          {isDirty && isValid && (
            <span className="flex items-center gap-1 text-green-400 text-xs mr-2">
              <Check size={12} />
              Valid
            </span>
          )}

          {/* Format button */}
          <button
            type="button"
            onClick={handleFormat}
            title="Format JSON"
            className={tw(
              'flex items-center gap-1 px-2 py-1 rounded text-xs',
              'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200',
              'transition-colors',
            )}
          >
            <Code size={12} />
            Format
          </button>

          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy JSON"
            className={tw(
              'flex items-center gap-1 px-2 py-1 rounded text-xs',
              'bg-transparent hover:bg-slate-800 transition-colors',
              copied ? 'text-green-400' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleReset}
            title="Reset to original"
            disabled={!isDirty}
            className={tw(
              'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
              isDirty
                ? 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                : 'bg-transparent text-slate-600 cursor-not-allowed',
            )}
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={handleChange}
        spellCheck={false}
        className={tw(
          'w-full min-h-[300px] resize-none',
          'bg-ops-indigo-950 border rounded-lg p-4',
          'font-mono text-sm text-cloud-gray-200',
          'focus:outline-none',
          'transition-colors duration-150',
          borderClass,
        )}
        style={{ tabSize: 2 }}
      />

      {/* Character count */}
      <div className="flex justify-end">
        <span className="text-xs font-mono text-slate-600">
          {text.length.toLocaleString()} chars
        </span>
      </div>

      {/* Error box */}
      {hasErrors && (
        <div
          className={tw(
            'bg-alert-coral-400/10 border border-alert-coral-400/30',
            'rounded-lg p-3 space-y-1',
          )}
        >
          <div className="flex items-center gap-1.5 text-alert-coral-300 text-xs font-semibold mb-1">
            <AlertTriangle size={12} />
            {parseError ? 'JSON syntax error' : `Schema errors (${schemaErrors.length})`}
          </div>

          {parseError && (
            <p className="text-alert-coral-300 text-xs font-mono leading-relaxed">
              {parseError}
            </p>
          )}

          {schemaErrors.map((err, i) => (
            <p key={i} className="text-alert-coral-300 text-xs font-mono leading-relaxed">
              {err}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
