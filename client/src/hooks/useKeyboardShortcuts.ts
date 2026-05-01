import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

const shortcuts: KeyboardShortcut[] = [];

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    shortcuts.push(shortcut);
    return () => {
      const idx = shortcuts.indexOf(shortcut);
      if (idx > -1) shortcuts.splice(idx, 1);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in input fields
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          (e.target as HTMLElement).isContentEditable) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return { registerShortcut };
}

export function KeyboardShortcutsHelp() {
  const shortcutsList = [
    { key: '?', description: 'Show keyboard shortcuts', show: true },
    { key: 'g then h', description: 'Go to Dashboard', show: false },
    { key: 'g then r', description: 'Go to Research', show: false },
    { key: 'g then f', description: 'Go to Flashcards', show: false },
    { key: 'g then s', description: 'Go to Study OS', show: false },
    { key: 'n', description: 'New research session', show: false },
    { key: 'e', description: 'Export current content', show: false },
    { key: '/', description: 'Focus search', show: false },
    { key: 'Escape', description: 'Close modal/dialog', show: true },
  ];

  return (
    <div className="cut-card bg-graphite/50 border border-smoke/40 p-4">
      <h4 className="text-chalk font-medium mb-3 text-sm">Keyboard Shortcuts</h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {shortcutsList.filter(s => s.show).map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-graphite rounded text-silver font-mono">{s.key}</kbd>
            <span className="text-ash">{s.description}</span>
          </div>
        ))}
      </div>
      <p className="text-ash/50 text-xs mt-3">Press ? to see all shortcuts</p>
    </div>
  );
}