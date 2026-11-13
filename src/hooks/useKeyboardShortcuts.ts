import { useEffect } from "react";
import { useKeyboardShortcuts } from "@/context/KeyboardShortcutsContext";

export { useKeyboardShortcuts } from "@/context/KeyboardShortcutsContext";

/**
 * Register a contextual shortcut action while a component is mounted.
 * Automatically unregisters when the component unmounts.
 */
export const useRegisterShortcut = (
  shortcutId: string,
  action: (e?: KeyboardEvent) => void,
  deps: any[] = []
) => {
  const { registerAction, unregisterAction } = useKeyboardShortcuts();

  useEffect(() => {
    registerAction(shortcutId, action);
    return () => {
      unregisterAction(shortcutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcutId, ...deps]);
};

