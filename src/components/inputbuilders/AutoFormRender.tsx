/**
 * AutoFormRenderer.tsx
 *
 * Key addition: `customSections` prop.
 * If a category key exists in customSections, the entire section
 * (flat fields + LIST-DICT tables) is replaced with your custom ReactNode.
 * This is how ProductVariantsSection plugs in without changing the renderer.
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
  fields: Record<string, FieldDefinition>;
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  listRows?: Record<string, { rows: ListRow[]; setRows: (rows: ListRow[]) => void }>;
  sectionConfigs?: Record<string, SectionConfig>;
  sectionExtras?: Record<string, React.ReactNode>;
  excludeCategories?: string[];
  cardClassName?: string;
  /**
   * Full section override per category.
   * When a key is present, AutoFormRenderer wraps your ReactNode in the
   * standard section card (with icon/title/collapsible) but skips all
   * auto-generated fields and LIST-DICT tables for that category.
   *
   * Usage:
   *   customSections={{
   *     "Product Variants": (
   *       <ProductVariantsSection
   *         hasVariants={values.hasVariants}
   *         onHasVariantsChange={(v) => handleChange("hasVariants", v)}
   *         variantTypes={variantTypes}
   *         onVariantTypesChange={setVariantTypes}
   *         combinations={combinations}
   *         onCombinationsChange={setCombinations}
   *         category={values.category}
   *         basePriceStr={values.sellingPrice}
   *       />
   *     ),
   *   }}
   */
  customSections?: Record<string, React.ReactNode>;
}

/* ─── Default category metadata ─────────────────────────── */

const CATEGORY_DEFAULTS: Record<string, SectionConfig> = {
  "Basic Information":    { icon: <Package      size={18}/>, iconColor: "bg-blue-50 text-blue-500",       title: "Basic Information",    subtitle: "Core identity and classification",       order: 0  },
  "Pricing & Sourcing":   { icon: <DollarSign   size={18}/>, iconColor: "bg-emerald-50 text-emerald-500", title: "Pricing & Sourcing",   subtitle: "Cost structure and supplier details",    order: 1  },
  "Stock & Inventory":    { icon: <BarChart2    size={18}/>, iconColor: "bg-amber-50 text-amber-500",     title: "Stock & Inventory",    subtitle: "Levels, location, and reorder alerts",   order: 2  },
  "Advanced Settings":    { icon: <Settings     size={18}/>, iconColor: "bg-slate-100 text-slate-500",    title: "Advanced Settings",    subtitle: "Batch tracking, expiry, warranty",       order: 99, collapsible: true, defaultCollapsed: true },
  "Supplier Identity":    { icon: <Users        size={18}/>, iconColor: "bg-violet-50 text-violet-500",   title: "Supplier Identity",    subtitle: "Legal and contact information",           order: 0  },
  "Location":             { icon: <MapPin       size={18}/>, iconColor: "bg-sky-50 text-sky-500",         title: "Location",             subtitle: "Registered office and delivery details",  order: 1  },
  "Personal Information": { icon: <Users        size={18}/>, iconColor: "bg-rose-50 text-rose-500",       title: "Personal Information", subtitle: "Customer details",                        order: 0  },
  "Billing Address":      { icon: <MapPin       size={18}/>, iconColor: "bg-sky-50 text-sky-500",         title: "Billing Address",      subtitle: "Postal address",                         order: 1  },
  "Contact":              { icon: <FileText     size={18}/>, iconColor: "bg-teal-50 text-teal-500",       title: "Contact",              subtitle: "Email, phone",                           order: 2  },
  "Details":              { icon: <Layers       size={18}/>, iconColor: "bg-indigo-50 text-indigo-500",   title: "Details",              subtitle: "Type and notes",                         order: 3  },
  "Purchase Details":     { icon: <ShoppingCart size={18}/>, iconColor: "bg-blue-50 text-blue-500",       title: "Purchase Details",     subtitle: "Supplier and invoice info",               order: 0  },
  "Charges":              { icon: <DollarSign   size={18}/>, iconColor: "bg-orange-50 text-orange-500",   title: "Charges",              subtitle: "Transport and other fees",                order: 1  },
  "General Information":  { icon: <FileText     size={18}/>, iconColor: "bg-slate-100 text-slate-500",    title: "General Information",  subtitle: "Reference and date",                     order: 0  },
  "Received Products":    { icon: <Truck        size={18}/>, iconColor: "bg-emerald-50 text-emerald-500", title: "Received Products",    subtitle: "Items in this delivery",                  order: 1  },
  "Adjustment Details":   { icon: <FileText     size={18}/>, iconColor: "bg-amber-50 text-amber-500",     title: "Adjustment Details",   subtitle: "Date and notes",                         order: 0  },
  "Products to Adjust":   { icon: <Package      size={18}/>, iconColor: "bg-red-50 text-red-500",         title: "Products to Adjust",   subtitle: "Items and adjustment reasons",            order: 1  },
  "Production Details":   { icon: <Factory      size={18}/>, iconColor: "bg-indigo-50 text-indigo-500",   title: "Production Details",   subtitle: "Batch, location, status",                 order: 0  },
  "Production Costs":     { icon: <DollarSign   size={18}/>, iconColor: "bg-emerald-50 text-emerald-500", title: "Production Costs",     subtitle: "Labor, overhead, packaging",              order: 1  },
  "Finished Products":    { icon: <Package      size={18}/>, iconColor: "bg-blue-50 text-blue-500",       title: "Finished Products",    subtitle: "Manufactured items",                     order: 2  },
  "Order Summary":        { icon: <ShoppingCart size={18}/>, iconColor: "bg-violet-50 text-violet-500",   title: "Order Summary",        subtitle: "Charges and totals",                     order: 3  },
  "Summary":              { icon: <BarChart2    size={18}/>, iconColor: "bg-indigo-50 text-indigo-500",   title: "Summary",              subtitle: "Auto-calculated stock impact",            order: 10, collapsible: true, defaultCollapsed: true },
  "Product Catlog":       { icon: <Package      size={18}/>, iconColor: "bg-blue-50 text-blue-500",       title: "Product Catalog",      subtitle: "Products being adjusted",                 order: 2  },
  "Basic Info":           { icon: <FileText     size={18}/>, iconColor: "bg-slate-100 text-slate-500",    title: "Basic Info",           subtitle: "Item identity",                           order: 0  },
  // Product Variants — starts open so the builder is immediately visible
  "Product Variants":     { icon: <Layers       size={18}/>, iconColor: "bg-violet-50 text-violet-500",   title: "Product Variants",     subtitle: "Colors, sizes, storage and more",        order: 5, collapsible: false },
};

/* ─── Collapsible wrapper ─────────────────────────────────── */

const CollapsibleSection: React.FC<{
  title: string; subtitle?: string;
  icon?: React.ReactNode; iconColor?: string;
  defaultCollapsed?: boolean; children: React.ReactNode; className?: string;
}> = ({ title, subtitle, icon, iconColor, defaultCollapsed = false, children, className = "" }) => {
  const [open, setOpen] = useState(!defaultCollapsed);
  return (
    <div className={`afr-card ${className}`}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="afr-collapsible-trigger">
        <div className="afr-section-header-inner">
          {icon && <div className={`afr-icon ${iconColor}`}>{icon}</div>}
          <div>
            <h2 className="afr-title">{title}</h2>
            {subtitle && <p className="afr-subtitle">{subtitle}</p>}
          </div>
        </div>
        <ChevronDown size={15} className={`afr-chevron transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="afr-collapsible-body">{children}</div>}
    </div>
  );
};

/* ─── Static section card ─────────────────────────────────── */

const StaticSection: React.FC<{ cfg: SectionConfig; cardClassName?: string; children: React.ReactNode }> = ({
  cfg, cardClassName = "", children,
}) => (
  <div className={`afr-card ${cardClassName}`}>
    {(cfg.icon || cfg.title || cfg.subtitle) && (
      <div className="afr-section-header">
        {cfg.icon && <div className={`afr-icon ${cfg.iconColor ?? "bg-slate-100 text-slate-500"}`}>{cfg.icon}</div>}
        <div>
          {cfg.title    && <h2 className="afr-title">{cfg.title}</h2>}
          {cfg.subtitle && <p className="afr-subtitle">{cfg.subtitle}</p>}
        </div>
      </div>
    )}
    {children}
  </div>
);

/* ─── SectionShell ───────────────────────────────────────── */

const SectionShell: React.FC<{ cfg: SectionConfig; cardClassName?: string; children: React.ReactNode }> = ({
  cfg, cardClassName, children,
}) => {
  if (cfg.collapsible) {
    return (
      <CollapsibleSection
        title={cfg.title ?? ""}
        subtitle={cfg.subtitle}
        icon={cfg.icon}
        iconColor={cfg.iconColor}
        defaultCollapsed={cfg.defaultCollapsed}
        className={cardClassName}
      >
        {children}
      </CollapsibleSection>
    );
  }
  return <StaticSection cfg={cfg} cardClassName={cardClassName}>{children}</StaticSection>;
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
  customSections = {},
}) => {
  const categories = useMemo(() => {
    const seen = new Set<string>();
    Object.values(fields).forEach((f) => { if (f.category) seen.add(f.category); });
    return Array.from(seen)
      .filter((c) => !excludeCategories.includes(c))
      .sort((a, b) => {
        const oa = sectionConfigs[a]?.order ?? CATEGORY_DEFAULTS[a]?.order ?? 50;
        const ob = sectionConfigs[b]?.order ?? CATEGORY_DEFAULTS[b]?.order ?? 50;
        return oa - ob;
      });
  }, [fields, excludeCategories, sectionConfigs]);

  return (
    <div className="afr-root">
      {categories.map((cat) => {
        const cfg: SectionConfig = { ...CATEGORY_DEFAULTS[cat], ...sectionConfigs[cat] };

        /* ── Custom override: wrap in shell, skip auto-render ── */
        if (customSections[cat] !== undefined) {
          return (
            <SectionShell key={`custom-${cat}`} cfg={cfg} cardClassName={cardClassName}>
              {customSections[cat]}
            </SectionShell>
          );
        }

        /* ── Auto-render: flat fields + LIST-DICT tables ── */
        const flatFields = Object.entries(fields).filter(
          ([, f]) => f.category === cat && f.type !== "LIST-DICT" && (cfg.includeHidden || f.view_mode !== "HIDE")
        );
        const listDictFields = Object.entries(fields).filter(
          ([, f]) => f.category === cat && f.type === "LIST-DICT" && f.view_mode !== "HIDE"
        );

        if (flatFields.length === 0 && listDictFields.length === 0) return null;

        const gridCols = cfg.gridCols ?? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

        return (
          <SectionShell key={`auto-${cat}`} cfg={cfg} cardClassName={cardClassName}>
            {flatFields.length > 0 && (
              <div className={`grid gap-4 ${gridCols}`}>
                {flatFields
                  .sort(([, a], [, b]) =>
                    a.required !== b.required ? (a.required ? -1 : 1) : a.label_name.localeCompare(b.label_name)
                  )
                  .map(([key, field]) => (
                    <DynamicField key={key} field={field} value={values[key]} onChange={onChange} />
                  ))}
              </div>
            )}

            {sectionExtras[cat] && <div className="afr-extra mt-4">{sectionExtras[cat]}</div>}

            {listDictFields.map(([key, field]) => {
              const listState = listRows[key];
              if (!listState || !field.values || typeof field.values !== "object" || Array.isArray(field.values)) return null;
              return (
                <div key={key} className="mt-6">
                  <DynamicListDict listField={field} rows={listState.rows} onRowsChange={listState.setRows} />
                </div>
              );
            })}
          </SectionShell>
        );
      })}
    </div>
  );
};

export { createEmptyRow };
export type { ListRow };
export default AutoFormRenderer;