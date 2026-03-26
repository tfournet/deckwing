import { useState, useCallback } from 'react';

const SETTINGS_KEY = 'deckwing-settings';

const DEFAULTS = {
  version: 1,
  projectFolder: null,
  recentFiles: [],
  selectedModel: 'sonnet',
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULTS };
}

function persistSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export function useSettings() {
  const [settings, setSettingsState] = useState(loadSettings);

  const updateSettings = useCallback((changes) => {
    setSettingsState(prev => {
      const next = { ...prev, ...changes };
      persistSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
