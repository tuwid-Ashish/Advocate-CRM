'use client';

import { useEffect } from 'react';

/**
 * useHotkeys — lightweight keyboard shortcut hook.
 * @param {Object} keyMap - { 'key': handler } e.g. { '/': () => searchRef.current?.focus() }
 * @param {boolean} enabled - whether shortcuts are active
 */
export function useHotkeys(keyMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Don't fire when user is typing in an input, textarea, select, etc.
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = ['input', 'textarea', 'select'].includes(tag) ||
        document.activeElement?.isContentEditable;

      const handler = keyMap[e.key];
      if (!handler) return;

      // Allow Escape even while typing (to close modals / clear search)
      if (isTyping && e.key !== 'Escape') return;

      e.preventDefault();
      handler(e);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyMap, enabled]);
}
