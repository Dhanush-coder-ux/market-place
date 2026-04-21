import React, { useCallback } from "react";
import { FieldDefinition } from "./context/InputBuilderContext";
import { SearchSelect } from "./SearchSelect"; // ← your existing component

export interface DynamicFieldProps {
  field: FieldDefinition;
  value: any;
  onChange: (name: string, value: any) => void;
  className?: string;
  disabled?: boolean;
  /** Set true inside table rows — hides the label row */
  hideLabel?: boolean;
}

/* ─── Label ─────────────────────────────────────────────── */

const Label: React.FC<{ text: string; required?: boolean; hint?: string }> = ({
  text,
  required,
  hint,
}) => (
  <label className="flex items-center text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
    {text}
    {required && <span className="text-red-500 ml-1">*</span>}
    {hint && (
      <div className="relative group ml-1.5 flex items-center cursor-help">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4 text-slate-400 hover:text-blue-500 transition-colors"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-xs z-50">
          <div className="bg-slate-800 text-white text-[11px] font-normal normal-case tracking-normal rounded py-1.5 px-2.5 shadow-lg relative">
            {hint}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-800" />
          </div>
        </div>
      </div>
    )}
  </label>
);

/* ─── Shared input base classes ─────────────────────────── */

const baseInput =
  "block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 disabled:bg-slate-50 disabled:text-slate-500 disabled:ring-slate-200 transition-all";

/* ─── Wrapper helper ─────────────────────────────────────── */

const FieldWrapper: React.FC<{
  hideLabel?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ hideLabel, className = "", children }) => (
  <div className={`w-full ${hideLabel ? "" : "mb-4"} ${className}`}>{children}</div>
);

/* ─── Primitive fields ───────────────────────────────────── */

const TextField: React.FC<DynamicFieldProps> = ({ field, value, onChange, disabled, hideLabel }) => (
  <FieldWrapper hideLabel={hideLabel}>
    {!hideLabel && <Label text={field.label_name} required={field.required} hint={field.field_description} />}
    <input
      type={field.type === "EMAIL" ? "email" : "text"}
      name={field.field_name}
      value={value ?? ""}
      placeholder={field.placeholder}
      required={field.required}
      disabled={disabled ?? !field.can_update}
      className={baseInput}
      onChange={(e) => onChange(field.field_name, e.target.value)}
    />
  </FieldWrapper>
);

const NumberField: React.FC<DynamicFieldProps> = ({ field, value, onChange, disabled, hideLabel }) => {
  const isPrice =
    field.category?.toLowerCase().includes("pric") ||
    field.field_name.includes("cost") ||
    field.field_name.includes("price");

  return (
    <FieldWrapper hideLabel={hideLabel}>
      {!hideLabel && <Label text={field.label_name} required={field.required} hint={field.field_description} />}
      <div className="relative rounded-md shadow-sm">
        {isPrice && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-slate-500 sm:text-sm">₹</span>
          </div>
        )}
        <input
          type="number"
          name={field.field_name}
          value={value ?? ""}
          placeholder={field.placeholder || "0"}
          step={field.type === "DECIMAL" ? "0.01" : "1"}
          required={field.required}
          disabled={disabled ?? !field.can_update}
          className={`${baseInput} ${isPrice ? "pl-7" : ""}`}
          onChange={(e) => {
            const v = e.target.value;
            onChange(field.field_name, v === "" ? "" : Number(v));
          }}
        />
      </div>
    </FieldWrapper>
  );
};

const DateField: React.FC<DynamicFieldProps> = ({ field, value, onChange, disabled, hideLabel }) => (
  <FieldWrapper hideLabel={hideLabel}>
    {!hideLabel && <Label text={field.label_name} required={field.required} hint={field.field_description} />}
    <input
      type="date"
      name={field.field_name}
      value={value ?? ""}
      required={field.required}
      disabled={disabled ?? !field.can_update}
      className={baseInput}
      onChange={(e) => onChange(field.field_name, e.target.value)}
    />
  </FieldWrapper>
);

const DropdownField: React.FC<DynamicFieldProps> = ({ field, value, onChange, disabled, hideLabel }) => {
  const options = Array.isArray(field.values) ? (field.values as string[]) : [];
  return (
    <FieldWrapper hideLabel={hideLabel}>
      {!hideLabel && <Label text={field.label_name} required={field.required} hint={field.field_description} />}
      <select
        name={field.field_name}
        value={value ?? ""}
        required={field.required}
        disabled={disabled ?? !field.can_update}
        className={`${baseInput} appearance-none cursor-pointer bg-no-repeat`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: "right 0.5rem center",
          backgroundSize: "1.5em 1.5em",
          paddingRight: "2.5rem",
        }}
        onChange={(e) => onChange(field.field_name, e.target.value)}
      >
        <option value="">{field.placeholder || "Select…"}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
};

const TextareaField: React.FC<DynamicFieldProps> = ({ field, value, onChange, disabled, hideLabel }) => (
  <FieldWrapper hideLabel={hideLabel}>
    {!hideLabel && <Label text={field.label_name} required={field.required} hint={field.field_description} />}
    <textarea
      name={field.field_name}
      value={value ?? ""}
      placeholder={field.placeholder}
      required={field.required}
      disabled={disabled ?? !field.can_update}
      rows={2}
      className={`${baseInput} resize-y`}
      onChange={(e) => onChange(field.field_name, e.target.value)}
    />
  </FieldWrapper>
);

const BooleanField: React.FC<DynamicFieldProps> = ({ field, value, onChange, disabled, hideLabel }) => {
  const checked = value === true || value === "true" || value === 1;
  return (
    <FieldWrapper hideLabel={hideLabel}>
      {!hideLabel && <Label text={field.label_name} required={field.required} hint={field.field_description} />}
      <div className="flex items-center gap-3 py-1">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled ?? !field.can_update}
          onClick={() => onChange(field.field_name, !checked)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
            checked ? "bg-blue-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
              checked ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${checked ? "text-blue-600" : "text-slate-500"}`}>
          {checked ? "Yes" : "No"}
        </span>
      </div>
    </FieldWrapper>
  );
};

/* ─── SEARCH-SELECT field ────────────────────────────────── */
/**
 * Bridges FieldDefinition → SearchSelect.
 *
 * How the backend can configure this field:
 *
 *   // Static list (strings)
 *   { type: "SEARCH-SELECT", values: ["Apple","Banana"], search_config: { labelKey: "label", valueKey: "value" } }
 *
 *   // Static list (objects)
 *   { type: "SEARCH-SELECT", values: [{ id: 1, name: "Unit A" }], search_config: { labelKey: "name", valueKey: "id" } }
 *
 *   // Async (server-side search)
 *   { type: "SEARCH-SELECT", search_config: { labelKey: "name", valueKey: "id", fetch_url: "/api/products/search" } }
 */
const SearchSelectField: React.FC<DynamicFieldProps> = ({ field, value, onChange, disabled, hideLabel }) => {
  const cfg = field.search_config ?? { labelKey: "label", valueKey: "value" };
  const isDisabled = disabled ?? !field.can_update;

  /* ── Normalise static options ── */
  const staticOptions = (() => {
    if (!field.values || !Array.isArray(field.values)) return [];

    // string[] → [{ label: "X", value: "X" }]
    if (typeof field.values[0] === "string") {
      return (field.values as string[]).map((s) => ({ label: s, value: s }));
    }

    // object[] → use as-is (labelKey / valueKey come from search_config)
    return field.values as Record<string, unknown>[];
  })();

  /* ── Optional async fetcher ── */
  const fetchOptions = useCallback(
    async (query: string, signal: AbortSignal): Promise<Record<string, unknown>[]> => {
      if (!cfg.fetch_url) return [];
      const url = new URL(cfg.fetch_url, window.location.origin);
      url.searchParams.set("q", query);
      const res = await fetch(url.toString(), { signal });
      if (!res.ok) throw new Error("Search failed");
      return res.json() as Promise<Record<string, unknown>[]>;
    },
    [cfg.fetch_url]
  );

  // Only pass fetchOptions to SearchSelect when a fetch_url is configured
  const asyncFetch = cfg.fetch_url ? fetchOptions : undefined;

  const handleChange = (val: string | number | string[] | number[]) => {
    onChange(field.field_name, val);
  };

  return (
    <FieldWrapper hideLabel={hideLabel}>
      {!hideLabel && (
        <Label text={field.label_name} required={field.required} hint={field.field_description} />
      )}
      {/* Ant Design Select needs a wrapper with relative positioning for dropdowns */}
      <div className="ant-search-select-wrapper">
        <SearchSelect
          value={value ?? (cfg.multiple ? [] : undefined)}
          onChange={handleChange}
          fetchOptions={asyncFetch}
          options={staticOptions}
          labelKey={cfg.labelKey as keyof Record<string, unknown>}
          valueKey={cfg.valueKey as keyof Record<string, unknown>}
          multiple={cfg.multiple}
          placeholder={field.placeholder || "Search…"}
          disabled={isDisabled}
          allowClear
          className="w-full [&_.ant-select-selector]:!rounded-md [&_.ant-select-selector]:!border-0 [&_.ant-select-selector]:!ring-1 [&_.ant-select-selector]:!ring-inset [&_.ant-select-selector]:!ring-slate-200 [&_.ant-select-selector]:!shadow-sm [&_.ant-select-focused_.ant-select-selector]:!ring-2 [&_.ant-select-focused_.ant-select-selector]:!ring-blue-600 [&_.ant-select-selector]:!py-1 [&_.ant-select-selector]:!px-3 [&_.ant-select-selector]:!text-sm [&_.ant-select-disabled_.ant-select-selector]:!bg-slate-50 [&_.ant-select-disabled_.ant-select-selector]:!text-slate-500"
        />
      </div>
    </FieldWrapper>
  );
};

/* ─── Dispatcher ─────────────────────────────────────────── */

export const DynamicField: React.FC<DynamicFieldProps> = (props) => {
  const { field } = props;

  // Hidden or list fields are handled outside this component
  if (field.type === "LIST-DICT" || field.view_mode === "HIDE") return null;

  switch (field.type) {
    case "BOOLEAN":       return <BooleanField      {...props} />;
    case "DROP-DOWN":     return <DropdownField      {...props} />;
    case "TEXTAREA":      return <TextareaField      {...props} />;
    case "NUMBER":        return <NumberField        {...props} />;
    case "DECIMAL":       return <NumberField        {...props} />;
    case "DATE":          return <DateField          {...props} />;
    case "TEXT":          return <TextField          {...props} />;
    case "EMAIL":         return <TextField          {...props} />;
    case "SEARCH-SELECT": return <SearchSelectField  {...props} />;   // ← NEW

    case "DICT":
      // Read-only auto-calculated field
      return (
        <FieldWrapper hideLabel={props.hideLabel}>
          {!props.hideLabel && (
            <Label text={field.label_name} hint={field.field_description} />
          )}
          <div className="block w-full rounded-md border-0 py-2 px-3 text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 bg-slate-50 sm:text-sm italic">
            {field.placeholder || "Auto-calculated"}
          </div>
        </FieldWrapper>
      );

    default:
      return <TextField {...props} />;
  }
};

export default DynamicField;