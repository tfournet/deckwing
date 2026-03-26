import { Plus, X } from 'lucide-react';

const INPUT_CLS =
  'w-full bg-ops-indigo-800 border border-ops-indigo-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-bot-teal-400/50 placeholder-cloud-gray-600';

const LABEL_CLS = 'text-cloud-gray-400 text-xs font-bold uppercase tracking-wider mb-1 block';

const MAX_METRICS = 4;

const COLOR_OPTIONS = [
  { value: 'text-bot-teal-400', label: 'Teal' },
  { value: 'text-trigger-amber-400', label: 'Amber' },
  { value: 'text-alert-coral-400', label: 'Coral' },
  { value: 'text-white', label: 'White' },
];

/**
 * MetricsEditor - Editable metrics for metric slides
 */
export function MetricsEditor({ metrics = [], onChange }) {
  const updateField = (index, field, value) => {
    const next = metrics.map((m, i) =>
      i === index ? { ...m, [field]: value } : m
    );
    onChange(next);
  };

  const remove = (index) => {
    onChange(metrics.filter((_, i) => i !== index));
  };

  const add = () => {
    if (metrics.length >= MAX_METRICS) return;
    onChange([...metrics, { value: '', label: '', color: 'text-bot-teal-400' }]);
  };

  return (
    <div className="space-y-3">
      {metrics.map((metric, i) => (
        <div
          key={i}
          className="bg-ops-indigo-800/40 border border-ops-indigo-700/40 rounded-lg p-3 space-y-2"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-cloud-gray-400 text-xs font-bold uppercase tracking-wider">
              Metric {i + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-cloud-gray-500 hover:text-alert-coral-400 transition-colors p-0.5"
              title="Remove metric"
            >
              <X size={13} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={LABEL_CLS}>Value</label>
              <input
                type="text"
                value={metric.value || ''}
                onChange={(e) => updateField(i, 'value', e.target.value)}
                placeholder="e.g. 99%"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Color</label>
              <select
                value={metric.color || 'text-bot-teal-400'}
                onChange={(e) => updateField(i, 'color', e.target.value)}
                className={`${INPUT_CLS} cursor-pointer`}
              >
                {COLOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Label</label>
            <input
              type="text"
              value={metric.label || ''}
              onChange={(e) => updateField(i, 'label', e.target.value)}
              placeholder="e.g. Uptime"
              className={INPUT_CLS}
            />
          </div>
        </div>
      ))}

      {metrics.length < MAX_METRICS ? (
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 text-bot-teal-400/70 hover:text-bot-teal-400 text-xs transition-colors py-1"
        >
          <Plus size={13} />
          Add metric
        </button>
      ) : (
        <p className="text-cloud-gray-600 text-xs py-1">Maximum {MAX_METRICS} metrics reached</p>
      )}
    </div>
  );
}
