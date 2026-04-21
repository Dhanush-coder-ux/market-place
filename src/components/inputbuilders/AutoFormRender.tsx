/**
 * AutoFormRenderer.tsx
 * 
 * Drop-in renderer that takes `fields` from InputBuilderContext and
 * auto-groups them by category, renders each category as a FormSection,
 * and handles LIST-DICT fields via DynamicListDict.
 *
 * You can:
 *  - Provide custom section configs (icon, title, subtitle, order)
 *  - Inject extra content into any section via `sectionExtras`
 *  - Control which categories are collapsed (collapsible)
 *
 * Minimal usage:
 *   <AutoFormRenderer fields={fields} values={values} onChange={handleChange} />
 */

import React, { useState, useMemo } from "react";
import {
  Package, DollarSign, BarChart2, Settings, Users, MapPin,
  Layers, FileText, ShoppingCart, Truck, Factory, ChevronDown,
} from "lucide-react";
import { FieldDefinition } from "./context/InputBuilderContext";
import { DynamicListDict, ListRow, createEmptyRow } from "./Dynamiclistdict";
import DynamicField from "./Dynamicfield";

/* ─── Types ─────────────────────────────────────────────── */

export interface SectionConfig {
  icon?: React.ReactNode;
  iconColor?: string;
  title?: string;
  subtitle?: string;
  order?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  gridCols?: string;
  includeHidden?: boolean;
}

export interface AutoFormRendererProps {
  /** Fields from context (flat Record) */
  fields: Record<string, FieldDefinition>;
  /** Current form values */
  values: Record<string, any>;
  /** onChange — receives field_name + new value */
  onChange: (name: string, value: any) => void;
  /**
   * LIST-DICT row state map: fieldName → { rows, setRows }
   * Supply this if you want to handle list fields.
   */
  listRows?: Record<string, {
    rows: ListRow[];
    setRows: (rows: ListRow[]) => void;
  }>;
  /** Per-category overrides */
  sectionConfigs?: Record<string, SectionConfig>;
  /** Extra ReactNode rendered inside a given category card */
  sectionExtras?: Record<string, React.ReactNode>;
  /** Categories to exclude entirely */
  excludeCategories?: string[];
  /** Card wrapper className */
  cardClassName?: string;
}

/* ─── Default section icon / colour map ─────────────────── */

const CATEGORY_DEFAULTS: Record<string, SectionConfig> = {
  "Basic Information": {
    icon: <Package size={18} />, iconColor: "bg-blue-50 text-blue-500",
    title: "Basic Information", subtitle: "Core identity and classification",
    order: 0,
  },
  "Pricing & Sourcing": {
    icon: <DollarSign size={18} />, iconColor: "bg-emerald-50 text-emerald-500",
    title: "Pricing & Sourcing", subtitle: "Cost structure and supplier details",
    order: 1,
  },
  "Stock & Inventory": {
    icon: <BarChart2 size={18} />, iconColor: "bg-amber-50 text-amber-500",
    title: "Stock & Inventory", subtitle: "Levels, location, and reorder alerts",
    order: 2,
  },
  "Advanced Settings": {
    icon: <Settings size={18} />, iconColor: "bg-slate-100 text-slate-500",
    title: "Advanced Settings", subtitle: "Batch tracking, expiry, warranty",
    order: 99, collapsible: true, defaultCollapsed: true,
  },
  "Supplier Identity": {
    icon: <Users size={18} />, iconColor: "bg-violet-50 text-violet-500",
    title: "Supplier Identity", subtitle: "Legal and contact information",
    order: 0,
  },
  "Location": {
    icon: <MapPin size={18} />, iconColor: "bg-sky-50 text-sky-500",
    title: "Location", subtitle: "Registered office and delivery details",
    order: 1,
  },
  "Personal Information": {
    icon: <Users size={18} />, iconColor: "bg-rose-50 text-rose-500",
    title: "Personal Information", subtitle: "Customer details",
    order: 0,
  },
  "Billing Address": {
    icon: <MapPin size={18} />, iconColor: "bg-sky-50 text-sky-500",
    title: "Billing Address", subtitle: "Postal address",
    order: 1,
  },
  "Contact": {
    icon: <FileText size={18} />, iconColor: "bg-teal-50 text-teal-500",
    title: "Contact", subtitle: "Email, phone",
    order: 2,
  },
  "Details": {
    icon: <Layers size={18} />, iconColor: "bg-indigo-50 text-indigo-500",
    title: "Details", subtitle: "Type and notes",
    order: 3,
  },
  "Purchase Details": {
    icon: <ShoppingCart size={18} />, iconColor: "bg-blue-50 text-blue-500",
    title: "Purchase Details", subtitle: "Supplier and invoice info",
    order: 0,
  },
  "Charges": {
    icon: <DollarSign size={18} />, iconColor: "bg-orange-50 text-orange-500",
    title: "Charges", subtitle: "Transport and other fees",
    order: 1,
  },
  "General Information": {
    icon: <FileText size={18} />, iconColor: "bg-slate-100 text-slate-500",
    title: "General Information", subtitle: "Reference and date",
    order: 0,
  },
  "Received Products": {
    icon: <Truck size={18} />, iconColor: "bg-emerald-50 text-emerald-500",
    title: "Received Products", subtitle: "Items in this delivery",
    order: 1,
  },
  "Adjustment Details": {
    icon: <FileText size={18} />, iconColor: "bg-amber-50 text-amber-500",
    title: "Adjustment Details", subtitle: "Date and notes",
    order: 0,
  },
  "Products to Adjust": {
    icon: <Package size={18} />, iconColor: "bg-red-50 text-red-500",
    title: "Products to Adjust", subtitle: "Items and adjustment reasons",
    order: 1,
  },
  "Production Details": {
    icon: <Factory size={18} />, iconColor: "bg-indigo-50 text-indigo-500",
    title: "Production Details", subtitle: "Batch, location, status",
    order: 0,
  },
  "Production Costs": {
    icon: <DollarSign size={18} />, iconColor: "bg-emerald-50 text-emerald-500",
    title: "Production Costs", subtitle: "Labor, overhead, packaging",
    order: 1,
  },
  "Finished Products": {
    icon: <Package size={18} />, iconColor: "bg-blue-50 text-blue-500",
    title: "Finished Products", subtitle: "Manufactured items",
    order: 2,
  },
  "Order Summary": {
    icon: <ShoppingCart size={18} />, iconColor: "bg-violet-50 text-violet-500",
    title: "Order Summary", subtitle: "Charges and totals",
    order: 3,
  },
  // Stock Adjustment categories
  "Summary": {
    icon: <BarChart2 size={18} />, iconColor: "bg-indigo-50 text-indigo-500",
    title: "Summary", subtitle: "Auto-calculated stock impact",
    order: 10, collapsible: true, defaultCollapsed: true,
  },
  "Product Catlog": {
    icon: <Package size={18} />, iconColor: "bg-blue-50 text-blue-500",
    title: "Product Catalog", subtitle: "Products being adjusted",
    order: 2,
  },
  "Basic Info": {
    icon: <FileText size={18} />, iconColor: "bg-slate-100 text-slate-500",
    title: "Basic Info", subtitle: "Item identity",
    order: 0,
  },
  "Product Variants": {
    icon: <Layers size={18} />, iconColor: "bg-purple-50 text-purple-500",
    title: "Product Variants", subtitle: "Variant configuration",
    order: 5, collapsible: true, defaultCollapsed: true,
  },
};

/* ─── Collapsible section wrapper ────────────────────────── */

const CollapsibleSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  iconColor?: string;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon, iconColor, defaultCollapsed = false, children, className = "" }) => {
  const [open, setOpen] = useState(!defaultCollapsed);

  return (
    <div className={`afr-card ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="afr-collapsible-trigger"
      >
        <div className="afr-section-header-inner">
          {icon && <div className={`afr-icon ${iconColor}`}>{icon}</div>}
          <div>
            <h2 className="afr-title">{title}</h2>
          </div>
        </div>
        <ChevronDown
          size={15}
          className={`afr-chevron ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="afr-collapsible-body">{children}</div>}
    </div>
  );
};

/* ─── AutoFormRenderer ───────────────────────────────────── */

export const AutoFormRenderer: React.FC<AutoFormRendererProps> = ({
  fields,
  values,
  onChange,
  listRows = {},
  sectionConfigs = {},
  sectionExtras = {},
  excludeCategories = [],
  cardClassName = "",
}) => {
  /* Collect unique categories */
  const categories = useMemo(() => {
    const seen = new Set<string>();
    Object.values(fields).forEach((f) => {
      if (f.category) seen.add(f.category);
    });

    return Array.from(seen)
      .filter((c) => !excludeCategories.includes(c))
      .sort((a, b) => {
        const orderA =
          (sectionConfigs[a]?.order ?? CATEGORY_DEFAULTS[a]?.order) ?? 50;
        const orderB =
          (sectionConfigs[b]?.order ?? CATEGORY_DEFAULTS[b]?.order) ?? 50;
        return orderA - orderB;
      });
  }, [fields, excludeCategories, sectionConfigs]);

  /* Find LIST-DICT fields */
  const listDictFields = useMemo(
    () =>
      Object.entries(fields).filter(
        ([, f]) => f.type === "LIST-DICT" && f.view_mode !== "HIDE"
      ),
    [fields]
  );

  return (
    <div className="afr-root">
      {/* ── Flat category sections ── */}
      {categories.map((cat) => {
        const defaults = CATEGORY_DEFAULTS[cat] ?? {};
        const overrides = sectionConfigs[cat] ?? {};
        const cfg: SectionConfig = { ...defaults, ...overrides };

        const hasFields = Object.values(fields).some(
          (f) =>
            f.category === cat &&
            f.type !== "LIST-DICT" &&
            (cfg.includeHidden || f.view_mode !== "HIDE")
        );
        if (!hasFields) return null;

        const sectionContent = (
          <>
            <div className={`grid gap-4 ${cfg.gridCols ?? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
              {Object.entries(fields)
                .filter(
                  ([, f]) =>
                    f.category === cat &&
                    f.type !== "LIST-DICT" &&
                    (cfg.includeHidden || f.view_mode !== "HIDE")
                )
                .sort(([, a], [, b]) =>
                  a.required !== b.required
                    ? a.required ? -1 : 1
                    : a.label_name.localeCompare(b.label_name)
                )
                .map(([key, field]) => (
                  <DynamicField key={key} field={field} value={values[key]} onChange={onChange} />
                ))}
            </div>
            {sectionExtras[cat] && (
              <div className="afr-extra">{sectionExtras[cat]}</div>
            )}
          </>
        );

        if (cfg.collapsible) {
          return (
            <CollapsibleSection
              key={cat}
              title={cfg.title ?? cat}
              icon={cfg.icon}
              iconColor={cfg.iconColor}
              defaultCollapsed={cfg.defaultCollapsed}
              className={cardClassName}
            >
              {sectionContent}
            </CollapsibleSection>
          );
        }

        return (
          <div key={cat} className={`afr-card ${cardClassName}`}>
            {(cfg.icon || cfg.title || cfg.subtitle) && (
              <div className="afr-section-header">
                {cfg.icon && (
                  <div className={`afr-icon ${cfg.iconColor ?? "bg-slate-100 text-slate-500"}`}>
                    {cfg.icon}
                  </div>
                )}
                <div>
                  {cfg.title && <h2 className="afr-title">{cfg.title}</h2>}
                  {cfg.subtitle && <p className="afr-subtitle">{cfg.subtitle}</p>}
                </div>
              </div>
            )}
            {sectionContent}
          </div>
        );
      })}

      {/* ── LIST-DICT fields ── */}
  {listDictFields.map(([key, field]) => {
        const listState = listRows[key];
        
        // 🚨 FIX: Ensure listState exists AND field.values is a valid object
        if (!listState || !field.values || typeof field.values !== 'object' || Array.isArray(field.values)) {
          return null; 
        }

        return (
          <div key={key} className={`afr-card ${cardClassName}`}>
            <DynamicListDict
              listField={field}
              rows={listState.rows}
              onRowsChange={listState.setRows}
            />
          </div>
        );
      })}
    </div>
  );
};
export { createEmptyRow };
export type { ListRow };

export default AutoFormRenderer;

