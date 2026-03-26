import { Plus, X, ArrowUp, ArrowDown } from 'lucide-react';

const INPUT_CLS =
  'flex-1 bg-ops-indigo-800 border border-ops-indigo-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-bot-teal-400/50 placeholder-cloud-gray-600';

const MAX_POINTS = 5;

/**
 * PointsEditor - Editable bullet point list for content slides
 */
export function PointsEditor({ points = [], onChange }) {
  const move = (from, to) => {
    if (to < 0 || to >= points.length) return;
    const next = [...points];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const update = (index, value) => {
    const next = [...points];
    next[index] = value;
    onChange(next);
  };

  const remove = (index) => {
    onChange(points.filter((_, i) => i !== index));
  };

  const add = () => {
    if (points.length >= MAX_POINTS) return;
    onChange([...points, '']);
  };

  return (
    <div className="space-y-2">
      {points.map((point, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => move(i, i - 1)}
              disabled={i === 0}
              className="text-cloud-gray-500 hover:text-cloud-gray-300 disabled:opacity-30 transition-colors p-0.5"
              title="Move up"
            >
              <ArrowUp size={12} />
            </button>
            <button
              type="button"
              onClick={() => move(i, i + 1)}
              disabled={i === points.length - 1}
              className="text-cloud-gray-500 hover:text-cloud-gray-300 disabled:opacity-30 transition-colors p-0.5"
              title="Move down"
            >
              <ArrowDown size={12} />
            </button>
          </div>
          <input
            type="text"
            value={point}
            onChange={(e) => update(i, e.target.value)}
            placeholder={`Point ${i + 1}`}
            className={INPUT_CLS}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-cloud-gray-500 hover:text-alert-coral-400 transition-colors p-1 shrink-0"
            title="Remove point"
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {points.length < MAX_POINTS ? (
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 text-bot-teal-400/70 hover:text-bot-teal-400 text-xs transition-colors py-1"
        >
          <Plus size={13} />
          Add point
        </button>
      ) : (
        <p className="text-cloud-gray-600 text-xs py-1">Maximum {MAX_POINTS} points reached</p>
      )}
    </div>
  );
}
