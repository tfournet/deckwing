import { useState } from 'react';
import { FolderOpen } from 'lucide-react';

/**
 * First-launch screen — asks the user to pick a project folder.
 * Shown when no settings file exists.
 *
 * Props:
 *   onFolderSelected(path) — called with the chosen folder path
 */
export function WelcomeScreen({ onFolderSelected }) {
  const [status, setStatus] = useState('idle'); // idle | picking | error
  const [errorMsg, setErrorMsg] = useState(null);

  const defaultFolder = (typeof window !== 'undefined' && window.deckwing?.defaultFolder)
    || `~/Documents/DeckWing`;

  const pickFolder = async () => {
    setStatus('picking');
    setErrorMsg(null);

    try {
      // Electron: use IPC to open native dialog
      if (window.deckwing?.pickFolder) {
        const folder = await window.deckwing.pickFolder();
        if (folder) {
          onFolderSelected(folder);
        } else {
          setStatus('idle'); // cancelled
        }
        return;
      }

      // Browser: use File System Access API
      if ('showDirectoryPicker' in window) {
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        onFolderSelected(handle.name); // store handle name, actual persistence handled elsewhere
        return;
      }

      // Fallback: just use the default
      onFolderSelected(defaultFolder);
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus('idle'); // user cancelled
      } else {
        setStatus('error');
        setErrorMsg("Couldn't access that folder. Please choose another.");
      }
    }
  };

  const useDefault = () => {
    onFolderSelected(defaultFolder);
  };

  return (
    <div className="w-screen h-screen bg-ops-indigo-950 flex items-center justify-center">
      <div className="max-w-md w-full px-8 text-center space-y-6">
        {/* Logo */}
        <div>
          <h1 className="font-display font-bold text-white text-2xl">DeckWing</h1>
          <p className="text-bot-teal-400 text-sm mt-1">
            Powered by Deckster, your AI presentation assistant
          </p>
        </div>

        {/* Welcome */}
        <div className="mt-8">
          <h2 className="text-xl font-display font-bold text-white">Welcome to DeckWing</h2>
          <p className="text-sm text-cloud-gray-400 leading-relaxed mt-3">
            DeckWing saves your presentations as .deckwing files in a folder you choose.
            Pick a folder to get started — you can change it later.
          </p>
        </div>

        {/* Default path display */}
        <div className="bg-ops-indigo-900 border border-ops-indigo-700/50 rounded-lg px-3 py-2">
          <span className="font-mono text-sm text-cloud-gray-300">{defaultFolder}</span>
        </div>

        {/* Error message */}
        {errorMsg && (
          <p className="text-xs text-alert-coral-400">{errorMsg}</p>
        )}

        {/* Primary action */}
        <button
          className="btn-primary text-sm px-6 py-3 w-full flex items-center justify-center gap-2"
          onClick={pickFolder}
          disabled={status === 'picking'}
        >
          <FolderOpen size={16} />
          {status === 'picking' ? 'Waiting for selection...' : 'Choose Folder'}
        </button>

        {/* Secondary action */}
        <button
          className="text-sm text-bot-teal-400 hover:text-bot-teal-300 underline underline-offset-2"
          onClick={useDefault}
        >
          Use suggested folder
        </button>

        {/* Privacy note */}
        <p className="text-xs text-cloud-gray-600 mt-6">
          Your files stay on your computer. Nothing is uploaded.
        </p>
      </div>
    </div>
  );
}
