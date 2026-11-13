import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";

export type ShortcutCategory =
  | "general"
  | "navigation"
  | "billing"
  | "inventory"
  | "customers"
  | "orders";

export interface ShortcutItem {
  id: string;
  label: string;
  description: string;
  category: ShortcutCategory;
  defaultKey: string;
  currentKey: string;
  allowInInputs?: boolean;
  isCustomizable?: boolean;
  navigationPath?: string;
}

export interface ShortcutConflict {
  hasConflict: boolean;
  conflictingShortcut?: ShortcutItem;
  message?: string;
}

interface KeyboardShortcutsContextType {
  shortcuts: ShortcutItem[];
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  isCheatSheetOpen: boolean;
  setCheatSheetOpen: (open: boolean) => void;
  updateShortcut: (id: string, newKey: string) => ShortcutConflict;
  resetShortcut: (id: string) => void;
  resetAllShortcuts: () => void;
  checkConflict: (id: string, newKey: string) => ShortcutConflict;
  registerAction: (id: string, action: (e?: KeyboardEvent) => void) => void;
  unregisterAction: (id: string) => void;
  getShortcutByKey: (keyCombo: string) => ShortcutItem | undefined;
  getShortcutById: (id: string) => ShortcutItem | undefined;
}

const STORAGE_CUSTOM_KEY = "inventq_custom_shortcuts";
const STORAGE_ENABLED_KEY = "inventq_shortcuts_enabled";

export const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  // ── General
  {
    id: "cmd_palette",
    label: "Command Palette",
    description: "Search pages, actions, and navigate quickly",
    category: "general",
    defaultKey: "ctrl+k",
    currentKey: "ctrl+k",
    allowInInputs: true,
    isCustomizable: true,
  },
  {
    id: "shortcuts_help",
    label: "Shortcuts Reference",
    description: "Open keyboard shortcuts cheat sheet",
    category: "general",
    defaultKey: "ctrl+/",
    currentKey: "ctrl+/",
    allowInInputs: true,
    isCustomizable: true,
  },
  {
    id: "quick_create",
    label: "Quick Create",
    description: "Open quick record creation menu",
    category: "general",
    defaultKey: "alt+n",
    currentKey: "alt+n",
    allowInInputs: false,
    isCustomizable: true,
  },
  {
    id: "close_overlay",
    label: "Close Overlay",
    description: "Dismiss modal, drawer or active popup safely",
    category: "general",
    defaultKey: "esc",
    currentKey: "esc",
    allowInInputs: true,
    isCustomizable: false,
  },

  // ── Navigation
  {
    id: "nav_dashboard",
    label: "Go to Dashboard",
    description: "Navigate to main overview dashboard",
    category: "navigation",
    defaultKey: "alt+d",
    currentKey: "alt+d",
    allowInInputs: false,
    isCustomizable: true,
    navigationPath: "/dashboard",
  },
  {
    id: "nav_products",
    label: "Go to Products",
    description: "View product catalog & stock listings",
    category: "navigation",
    defaultKey: "alt+p",
    currentKey: "alt+p",
    allowInInputs: false,
    isCustomizable: true,
    navigationPath: "/product/all",
  },
  {
    id: "nav_inventory",
    label: "Go to Inventory",
    description: "View inventory stock list and batches",
    category: "navigation",
    defaultKey: "alt+i",
    currentKey: "alt+i",
    allowInInputs: false,
    isCustomizable: true,
    navigationPath: "/inventory",
  },
  {
    id: "nav_customers",
    label: "Go to Customers",
    description: "View customer ledger and directory",
    category: "navigation",
    defaultKey: "alt+c",
    currentKey: "alt+c",
    allowInInputs: false,
    isCustomizable: true,
    navigationPath: "/customers/all",
  },
  {
    id: "nav_suppliers",
    label: "Go to Suppliers",
    description: "View vendor accounts and supplies",
    category: "navigation",
    defaultKey: "alt+s",
    currentKey: "alt+s",
    allowInInputs: false,
    isCustomizable: true,
    navigationPath: "/supplier/all",
  },
  {
    id: "nav_orders",
    label: "Go to Orders",
    description: "View online storefront customer orders",
    category: "navigation",
    defaultKey: "alt+o",
    currentKey: "alt+o",
    allowInInputs: false,
    isCustomizable: true,
    navigationPath: "/orders",
  },
  {
    id: "nav_sales",
    label: "Go to Sales & Invoices",
    description: "View sales register, tax invoices, and returns",
    category: "navigation",
    defaultKey: "alt+r",
    currentKey: "alt+r",
    allowInInputs: false,
    isCustomizable: true,
    navigationPath: "/sales",
  },
  {
    id: "nav_billing",
    label: "Open POS Billing",
    description: "Switch to high-speed billing counter",
    category: "navigation",
    defaultKey: "alt+b",
    currentKey: "alt+b",
    allowInInputs: false,
    isCustomizable: true,
    navigationPath: "/billing",
  },
  {
    id: "nav_settings",
    label: "Go to Settings",
    description: "Open store profile and configuration",
    category: "navigation",
    defaultKey: "alt+,",
    currentKey: "alt+,",
    allowInInputs: false,
    isCustomizable: true,
    navigationPath: "/settings",
  },

  // ── Billing & Invoicing
  {
    id: "bill_new",
    label: "Create New Bill",
    description: "Start a fresh invoice session or clear POS cart",
    category: "billing",
    defaultKey: "ctrl+n",
    currentKey: "ctrl+n",
    allowInInputs: false,
    isCustomizable: true,
    navigationPath: "/billing",
  },
  {
    id: "bill_complete",
    label: "Complete / Save Bill",
    description: "Process checkout and generate final invoice",
    category: "billing",
    defaultKey: "ctrl+enter",
    currentKey: "ctrl+enter",
    allowInInputs: true,
    isCustomizable: true,
  },
  {
    id: "bill_print",
    label: "Print Invoice",
    description: "Trigger thermal receipt or PDF print",
    category: "billing",
    defaultKey: "ctrl+p",
    currentKey: "ctrl+p",
    allowInInputs: true,
    isCustomizable: true,
  },
  {
    id: "bill_focus_search",
    label: "Focus Product Search",
    description: "Jump focus to item lookup or barcode scanner",
    category: "billing",
    defaultKey: "f2",
    currentKey: "f2",
    allowInInputs: true,
    isCustomizable: true,
  },
  {
    id: "bill_attach_customer",
    label: "Select / Attach Customer",
    description: "Open customer search & attachment modal",
    category: "billing",
    defaultKey: "f4",
    currentKey: "f4",
    allowInInputs: true,
    isCustomizable: true,
  },
  {
    id: "bill_discount",
    label: "Apply Discount",
    description: "Focus bill discount or item discount dialog",
    category: "billing",
    defaultKey: "f8",
    currentKey: "f8",
    allowInInputs: true,
    isCustomizable: true,
  },
  {
    id: "bill_clean_mode",
    label: "Clean Billing View",
    description: "Toggle full-screen streamlined billing mode",
    category: "billing",
    defaultKey: "ctrl+shift+n",
    currentKey: "ctrl+shift+n",
    allowInInputs: false,
    isCustomizable: true,
    navigationPath: "/billing?mode=clean",
  },

  // ── Products & Inventory
  {
    id: "prod_add_new",
    label: "Add New Product",
    description: "Open create product entry form",
    category: "inventory",
    defaultKey: "ctrl+shift+p",
    currentKey: "ctrl+shift+p",
    allowInInputs: false,
    isCustomizable: true,
    navigationPath: "/product/add",
  },
  {
    id: "inventory_movement",
    label: "Stock Movement",
    description: "View inbound and outbound stock logs",
    category: "inventory",
    defaultKey: "alt+m",
    currentKey: "alt+m",
    allowInInputs: false,
    isCustomizable: true,
    navigationPath: "/stock-movement",
  },
  {
    id: "focus_page_search",
    label: "Focus Search Filter",
    description: "Focus search bar on current table or page",
    category: "general",
    defaultKey: "ctrl+f",
    currentKey: "ctrl+f",
    allowInInputs: false,
    isCustomizable: true,
  },
];

export const normalizeKeyCombo = (combo: string): string => {
  const parts = combo
    .toLowerCase()
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean);

  const modifiers: string[] = [];
  let mainKey = "";

  for (const part of parts) {
    if (part === "ctrl" || part === "control" || part === "cmd" || part === "command" || part === "meta") {
      if (!modifiers.includes("ctrl")) modifiers.push("ctrl");
    } else if (part === "alt" || part === "option") {
      if (!modifiers.includes("alt")) modifiers.push("alt");
    } else if (part === "shift") {
      if (!modifiers.includes("shift")) modifiers.push("shift");
    } else {
      mainKey = part;
    }
  }

  return [...modifiers, mainKey].filter(Boolean).join("+");
};

export const eventToKeyCombo = (e: KeyboardEvent): string => {
  const parts: string[] = [];

  if (e.ctrlKey || e.metaKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");

  let key = e.key.toLowerCase();
  if (key === "escape") key = "esc";
  if (key === " ") key = "space";
  if (key === "control" || key === "alt" || key === "shift" || key === "meta") {
    // Only modifier pressed so far
    return parts.join("+");
  }

  parts.push(key);
  return parts.join("+");
};

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

export const KeyboardShortcutsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [enabled, setEnabledState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_ENABLED_KEY);
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CUSTOM_KEY);
      if (stored) {
        const customMap = JSON.parse(stored) as Record<string, string>;
        return DEFAULT_SHORTCUTS.map((item) => ({
          ...item,
          currentKey: customMap[item.id] || item.defaultKey,
        }));
      }
    } catch (e) {
      console.warn("Could not load custom shortcuts", e);
    }
    return DEFAULT_SHORTCUTS;
  });

  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isCheatSheetOpen, setCheatSheetOpen] = useState(false);

  // Dynamic actions registered by active pages/components (e.g. Billing.tsx)
  const actionsRegistryRef = useRef<Map<string, (e?: KeyboardEvent) => void>>(new Map());

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    try {
      localStorage.setItem(STORAGE_ENABLED_KEY, JSON.stringify(value));
    } catch (e) {
      console.warn("Could not save shortcuts enabled state", e);
    }
  }, []);

  const checkConflict = useCallback(
    (id: string, newKey: string): ShortcutConflict => {
      const normalized = normalizeKeyCombo(newKey);
      if (!normalized) {
        return { hasConflict: false };
      }
      const conflicting = shortcuts.find(
        (s) => s.id !== id && normalizeKeyCombo(s.currentKey) === normalized
      );
      if (conflicting) {
        return {
          hasConflict: true,
          conflictingShortcut: conflicting,
          message: `Already assigned to "${conflicting.label}"`,
        };
      }
      return { hasConflict: false };
    },
    [shortcuts]
  );

  const updateShortcut = useCallback(
    (id: string, newKey: string): ShortcutConflict => {
      const conflict = checkConflict(id, newKey);
      if (conflict.hasConflict) {
        return conflict;
      }

      setShortcuts((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, currentKey: normalizeKeyCombo(newKey) } : s));
        try {
          const mapToSave = next.reduce((acc, curr) => {
            if (curr.currentKey !== curr.defaultKey) {
              acc[curr.id] = curr.currentKey;
            }
            return acc;
          }, {} as Record<string, string>);
          localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(mapToSave));
        } catch (e) {
          console.warn("Could not persist custom shortcuts", e);
        }
        return next;
      });

      return { hasConflict: false };
    },
    [checkConflict]
  );

  const resetShortcut = useCallback((id: string) => {
    setShortcuts((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, currentKey: s.defaultKey } : s));
      try {
        const mapToSave = next.reduce((acc, curr) => {
          if (curr.currentKey !== curr.defaultKey) {
            acc[curr.id] = curr.currentKey;
          }
          return acc;
        }, {} as Record<string, string>);
        localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(mapToSave));
      } catch (e) {
        console.warn("Could not persist shortcuts reset", e);
      }
      return next;
    });
  }, []);

  const resetAllShortcuts = useCallback(() => {
    setShortcuts(DEFAULT_SHORTCUTS);
    try {
      localStorage.removeItem(STORAGE_CUSTOM_KEY);
    } catch (e) {
      console.warn("Could not clear custom shortcuts", e);
    }
  }, []);

  const registerAction = useCallback((id: string, action: (e?: KeyboardEvent) => void) => {
    actionsRegistryRef.current.set(id, action);
  }, []);

  const unregisterAction = useCallback((id: string) => {
    actionsRegistryRef.current.delete(id);
  }, []);

  const getShortcutByKey = useCallback(
    (keyCombo: string) => {
      const normalized = normalizeKeyCombo(keyCombo);
      return shortcuts.find((s) => normalizeKeyCombo(s.currentKey) === normalized);
    },
    [shortcuts]
  );

  const getShortcutById = useCallback(
    (id: string) => {
      return shortcuts.find((s) => s.id === id);
    },
    [shortcuts]
  );

  // ── Global Keyboard Event Listener with Context Awareness ─────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Detect if target is in an interactive text input
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // Handle Escape for modal close globally
      if (e.key === "Escape") {
        if (isCommandPaletteOpen) {
          e.preventDefault();
          setCommandPaletteOpen(false);
          return;
        }
        if (isCheatSheetOpen) {
          e.preventDefault();
          setCheatSheetOpen(false);
          return;
        }
        const registeredEscape = actionsRegistryRef.current.get("close_overlay");
        if (registeredEscape) {
          registeredEscape(e);
          return;
        }
      }

      // Convert pressed keys to normalized combo
      const combo = eventToKeyCombo(e);
      if (!combo) return;

      // Find matched shortcut
      const matched = shortcuts.find((s) => normalizeKeyCombo(s.currentKey) === combo);
      if (!matched) return;

      // If user is typing in an input field and the shortcut is NOT allowed in inputs, skip!
      if (isInput && !matched.allowInInputs) {
        return;
      }

      // ── Core System Shortcuts ───────────────────────────────────────────
      if (matched.id === "cmd_palette") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (matched.id === "shortcuts_help") {
        e.preventDefault();
        setCheatSheetOpen((prev) => !prev);
        return;
      }

      // ── Page-specific or dynamically registered action ───────────────────
      const customAction = actionsRegistryRef.current.get(matched.id);
      if (customAction) {
        e.preventDefault();
        customAction(e);
        return;
      }

      // ── Navigation Shortcut Execution ────────────────────────────────────
      if (matched.navigationPath) {
        e.preventDefault();
        navigate(matched.navigationPath);
        return;
      }

      // ── Focus search shortcut (Ctrl+F) ──────────────────────────────────
      if (matched.id === "focus_page_search") {
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]'
        );
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, shortcuts, isCommandPaletteOpen, isCheatSheetOpen, navigate, location.pathname]);

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        shortcuts,
        enabled,
        setEnabled,
        isCommandPaletteOpen,
        setCommandPaletteOpen,
        isCheatSheetOpen,
        setCheatSheetOpen,
        updateShortcut,
        resetShortcut,
        resetAllShortcuts,
        checkConflict,
        registerAction,
        unregisterAction,
        getShortcutByKey,
        getShortcutById,
      }}
    >
      {children}
    </KeyboardShortcutsContext.Provider>
  );
};

export const useKeyboardShortcuts = () => {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error("useKeyboardShortcuts must be used within a KeyboardShortcutsProvider");
  }
  return context;
};

