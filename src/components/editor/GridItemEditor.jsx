import { Plus, X, ArrowUp, ArrowDown } from 'lucide-react';

const INPUT_CLS =
  'w-full bg-ops-indigo-800 border border-ops-indigo-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-bot-teal-400/50 placeholder-cloud-gray-600';

const LABEL_CLS = 'text-cloud-gray-400 text-xs font-bold uppercase tracking-wider mb-1 block';

/**
 * GridItemEditor - Editable grid items for grid slides
 */
export function GridItemEditor({ items = [], onChange }) {
  const move = (from, to) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const updateField = (index, field, value) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(next);
  };

  const remove = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...items, { title: '', description: '', icon: '' }]);
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="bg-ops-indigo-800/40 border border-ops-indigo-700/40 rounded-lg p-3 space-y-2"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-cloud-gray-400 text-xs font-bold uppercase tracking-wider">
              Item {i + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                className="text-cloud-gray-500 hover:text-cloud-gray-300 disabled:opacity-30 transition-colors p-0.5"
                title="Move up"
              >
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                onClick={() => move(i, i + 1)}
                disabled={i === items.length - 1}
                className="text-cloud-gray-500 hover:text-cloud-gray-300 disabled:opacity-30 transition-colors p-0.5"
                title="Move down"
              >
                <ArrowDown size={13} />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-cloud-gray-500 hover:text-alert-coral-400 transition-colors p-0.5 ml-1"
                title="Remove item"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Title</label>
            <input
              type="text"
              value={item.title || ''}
              onChange={(e) => updateField(i, 'title', e.target.value)}
              placeholder="Item title"
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label className={LABEL_CLS}>Description</label>
            <textarea
              value={item.description || ''}
              onChange={(e) => updateField(i, 'description', e.target.value)}
              placeholder="Item description"
              rows={2}
              className={`${INPUT_CLS} resize-none`}
            />
          </div>

          <div>
            <label className={LABEL_CLS}>Icon (Lucide name)</label>
            <input
              type="text"
              value={item.icon || ''}
              onChange={(e) => updateField(i, 'icon', e.target.value)}
              placeholder="e.g. Zap, Play, Star"
              className={INPUT_CLS}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 text-bot-teal-400/70 hover:text-bot-teal-400 text-xs transition-colors py-1"
      >
        <Plus size={13} />
        Add item
      </button>
    </div>
  );
}
