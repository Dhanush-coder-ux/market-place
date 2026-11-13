import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Users,
  Truck,
  Settings2,
  PlusCircle,
  FileText,
  Printer,
  Command,
  ArrowRight,
  HelpCircle,
  X,
  Store,
  Tag,
} from "lucide-react";
import { useKeyboardShortcuts } from "@/context/KeyboardShortcutsContext";
import KeyboardKey from "./KeyboardKey";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Quick Actions" | "Navigation" | "System";
  icon: React.ElementType;
  shortcutId?: string;
  explicitKey?: string;
  action: () => void;
  keywords?: string[];
}

export const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setCheatSheetOpen,
    shortcuts,
  } = useKeyboardShortcuts();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isCommandPaletteOpen]);

  // Lookup key combo for an action from the shortcuts context
  const getShortcutKey = (shortcutId?: string, fallback?: string): string | undefined => {
    if (!shortcutId) return fallback;
    const found = shortcuts.find((s) => s.id === shortcutId);
    return found ? found.currentKey : fallback;
  };

  const commandItems: CommandItem[] = useMemo(() => {
    return [
      // ── Quick Actions
      {
        id: "action_create_bill",
        title: "Create New Bill",
        subtitle: "Launch POS checkout counter",
        category: "Quick Actions",
        icon: Printer,
        shortcutId: "bill_new",
        action: () => {
          navigate("/billing");
          setCommandPaletteOpen(false);
        },
        keywords: ["pos", "invoice", "sale", "bill", "counter"],
      },
      {
        id: "action_add_product",
        title: "Add New Product",
        subtitle: "Register product item with SKU & price",
        category: "Quick Actions",
        icon: PlusCircle,
        shortcutId: "prod_add_new",
        action: () => {
          navigate("/product/add");
          setCommandPaletteOpen(false);
        },
        keywords: ["item", "inventory", "stock", "create"],
      },
      {
        id: "action_add_customer",
        title: "Add Customer",
        subtitle: "Create customer profile in directory",
        category: "Quick Actions",
        icon: Users,
        action: () => {
          navigate("/customers/add");
          setCommandPaletteOpen(false);
        },
        keywords: ["client", "user", "contact"],
      },
      {
        id: "action_add_supplier",
        title: "Add Supplier",
        subtitle: "Register vendor company details",
        category: "Quick Actions",
        icon: Truck,
        action: () => {
          navigate("/supplier/add");
          setCommandPaletteOpen(false);
        },
        keywords: ["vendor", "distributor", "purchase"],
      },
      {
        id: "action_new_purchase",
        title: "Add Purchase Order",
        subtitle: "Create new stock procurement order",
        category: "Quick Actions",
        icon: Boxes,
        action: () => {
          navigate("/purchase/add");
          setCommandPaletteOpen(false);
        },
        keywords: ["po", "procurement", "inventory"],
      },

      // ── Navigation
      {
        id: "nav_dashboard",
        title: "Dashboard",
        subtitle: "Overview metrics & recent activity",
        category: "Navigation",
        icon: LayoutDashboard,
        shortcutId: "nav_dashboard",
        action: () => {
          navigate("/dashboard");
          setCommandPaletteOpen(false);
        },
        keywords: ["home", "analytics", "stats"],
      },
      {
        id: "nav_products",
        title: "Products Catalog",
        subtitle: "Browse product list, bar codes & categories",
        category: "Navigation",
        icon: Tag,
        shortcutId: "nav_products",
        action: () => {
          navigate("/product/all");
          setCommandPaletteOpen(false);
        },
        keywords: ["items", "inventory", "sku"],
      },
      {
        id: "nav_inventory",
        title: "Inventory & Stocks",
        subtitle: "Stock levels, batches & reorder alerts",
        category: "Navigation",
        icon: Boxes,
        shortcutId: "nav_inventory",
        action: () => {
          navigate("/inventory");
          setCommandPaletteOpen(false);
        },
        keywords: ["stock", "warehouse", "quantity"],
      },
      {
        id: "nav_customers",
        title: "Customers Directory",
        subtitle: "Customer accounts, outstanding balance & history",
        category: "Navigation",
        icon: Users,
        shortcutId: "nav_customers",
        action: () => {
          navigate("/customers/all");
          setCommandPaletteOpen(false);
        },
        keywords: ["client", "contacts", "ledger"],
      },
      {
        id: "nav_suppliers",
        title: "Suppliers & Vendors",
        subtitle: "Vendor catalog, payments & purchase records",
        category: "Navigation",
        icon: Truck,
        shortcutId: "nav_suppliers",
        action: () => {
          navigate("/supplier/all");
          setCommandPaletteOpen(false);
        },
        keywords: ["vendor", "distributor"],
      },
      {
        id: "nav_orders",
        title: "Online Orders",
        subtitle: "Digital storefront incoming orders & deliveries",
        category: "Navigation",
        icon: ShoppingCart,
        shortcutId: "nav_orders",
        action: () => {
          navigate("/orders");
          setCommandPaletteOpen(false);
        },
        keywords: ["ecommerce", "delivery", "store"],
      },
      {
        id: "nav_sales",
        title: "Sales & Invoices",
        subtitle: "View generated tax invoices and return records",
        category: "Navigation",
        icon: FileText,
        shortcutId: "nav_sales",
        action: () => {
          navigate("/sales");
          setCommandPaletteOpen(false);
        },
        keywords: ["receipt", "history", "transactions"],
      },
      {
        id: "nav_billing",
        title: "POS Billing Counter",
        subtitle: "Barcode scanning and high-speed counter POS",
        category: "Navigation",
        icon: Printer,
        shortcutId: "nav_billing",
        action: () => {
          navigate("/billing");
          setCommandPaletteOpen(false);
        },
        keywords: ["pos", "checkout", "cashier"],
      },
      {
        id: "nav_digital_store",
        title: "Digital Storefront Profile",
        subtitle: "Online catalog, announcements, and store settings",
        category: "Navigation",
        icon: Store,
        action: () => {
          navigate("/profile");
          setCommandPaletteOpen(false);
        },
        keywords: ["online", "web", "shop"],
      },
      {
        id: "nav_settings",
        title: "Store Settings",
        subtitle: "Profile, GST, dropdowns, printer configuration",
        category: "Navigation",
        icon: Settings2,
        shortcutId: "nav_settings",
        action: () => {
          navigate("/settings");
          setCommandPaletteOpen(false);
        },
        keywords: ["config", "preferences", "gst", "printer"],
      },

      // ── System & Help
      {
        id: "system_shortcuts_help",
        title: "Keyboard Shortcuts Reference",
        subtitle: "View cheat sheet and hotkey mappings",
        category: "System",
        icon: HelpCircle,
        shortcutId: "shortcuts_help",
        action: () => {
          setCommandPaletteOpen(false);
          setCheatSheetOpen(true);
        },
        keywords: ["hotkeys", "cheat sheet", "help", "keys"],
      },
    ];
  }, [navigate, setCommandPaletteOpen, setCheatSheetOpen, shortcuts]);

  // Filter commands based on user query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return commandItems;
    const lower = query.toLowerCase().trim();
    return commandItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(lower);
      const matchSub = item.subtitle?.toLowerCase().includes(lower);
      const matchCategory = item.category.toLowerCase().includes(lower);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(lower));
      return matchTitle || matchSub || matchCategory || matchKeywords;
    });
  }, [commandItems, query]);

  // Handle arrow keys and enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? filteredItems.length - 1 : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setCommandPaletteOpen(false);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector<HTMLElement>(
        `[data-index="${selectedIndex}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  if (!isCommandPaletteOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 pt-[12vh] animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setCommandPaletteOpen(false);
        }
      }}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search pages..."
            className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium text-slate-800 placeholder:text-slate-400"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X size={15} />
            </button>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1">
              <KeyboardKey combo="esc" size="xs" />
              <span className="text-[11px] text-slate-400">to exit</span>
            </span>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar min-h-[220px]"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Command size={32} className="mx-auto opacity-30" />
              <p className="text-sm font-semibold text-slate-600">No matching commands found</p>
              <p className="text-xs text-slate-400">
                Try searching for "Billing", "Product", "Settings", or "Invoice"
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              const shortcutKey = getShortcutKey(item.shortcutId, item.explicitKey);

              return (
                <div
                  key={item.id}
                  data-index={idx}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-emerald-50 text-emerald-950 border border-emerald-200/80 shadow-xs"
                      : "hover:bg-slate-50 text-slate-700 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-bold truncate leading-tight">
                          {item.title}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            isSelected
                              ? "bg-emerald-100/70 text-emerald-800"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {shortcutKey && (
                      <KeyboardKey combo={shortcutKey} size="xs" />
                    )}
                    <ArrowRight
                      size={14}
                      className={`transition-transform ${
                        isSelected
                          ? "opacity-100 translate-x-0.5 text-emerald-600"
                          : "opacity-0 text-slate-300"
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <KeyboardKey combo="↑" size="xs" />
              <KeyboardKey combo="↓" size="xs" />
              <span>navigate</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <KeyboardKey combo="enter" size="xs" />
              <span>execute</span>
            </span>
          </div>
          <span className="font-semibold text-slate-500">
            InventQ Command Palette
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CommandPalette;
