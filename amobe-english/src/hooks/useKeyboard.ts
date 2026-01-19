import { useEffect, useCallback } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface KeyboardOptions {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  preventDefault?: boolean;
}

/**
 * Custom hook for handling keyboard shortcuts
 * @param options - Keyboard options including key and modifiers
 * @param callback - Function to call when the key combination is pressed
 * @param deps - Dependencies array for the callback
 */
export function useKeyboard(
  options: KeyboardOptions | string,
  callback: KeyHandler,
  deps: React.DependencyList = []
): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const opts = typeof options === 'string' ? { key: options } : options;

      const keyMatches = event.key.toLowerCase() === opts.key.toLowerCase();
      const ctrlMatches = opts.ctrlKey ? event.ctrlKey : true;
      const shiftMatches = opts.shiftKey ? event.shiftKey : !event.shiftKey || opts.shiftKey === undefined;
      const altMatches = opts.altKey ? event.altKey : !event.altKey || opts.altKey === undefined;
      const metaMatches = opts.metaKey ? event.metaKey : !event.metaKey || opts.metaKey === undefined;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
        if (opts.preventDefault !== false) {
          event.preventDefault();
        }
        callback(event);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options, callback, ...deps]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Custom hook for handling Escape key press
 */
export function useEscapeKey(callback: () => void, deps: React.DependencyList = []): void {
  useKeyboard('Escape', callback, deps);
}

/**
 * Custom hook for handling Enter key press
 */
export function useEnterKey(callback: KeyHandler, deps: React.DependencyList = []): void {
  useKeyboard('Enter', callback, deps);
}

export default useKeyboard;
