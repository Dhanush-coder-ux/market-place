import React from "react";
import { FieldDefinition } from "./context/InputBuilderContext";

export interface DynamicFieldProps {
  field: FieldDefinition;
  value: any;
  onChange: (name: string, value: any) => void;
  className?: string;
  disabled?: boolean;
  hideLabel?: boolean; // Crucial for table layouts
}

const Label: React.FC<{ text: string; required?: boolean; hint?: string }> = ({ text, required, hint }) => (
  <label className="flex items-center text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
    {text}
    {required && <span className="text-red-500 ml-1">*</span>}
    {hint && (
      <div className="relative group ml-1.5 flex items-center cursor-help">
        {/* Info Icon */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={2} 
          stroke="currentColor" 
          className="w-4 h-4 text-slate-400 hover:text-blue-500 transition-colors"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-xs z-50">
          <div className="bg-slate-800 text-white text-[11px] font-normal normal-case tracking-normal rounded py-1.5 px-2.5 shadow-lg relative">
            {hint}
            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-800"></div>
          </div>
        </div>
      </div>
    )}
  </label>
);

// Modern, sleek Tailwind input classes
const baseInput =
  "block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 disabled:bg-slate-50 disabled:text-slate-500 disabled:ring-slate-200 transition-all";

const TextField: React.FC<DynamicFieldProps> = ({ field, value, onChange, disabled, hideLabel }) => (
  <div className={`w-full ${hideLabel ? '' : 'mb-4'}`}>
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
  </div>
);

const NumberField: React.FC<DynamicFieldProps> = ({ field, value, onChange, disabled, hideLabel }) => {
  const isPrice = field.category?.toLowerCase().includes("pric") || field.field_name.includes("cost") || field.field_name.includes("price");
  return (
    <div className={`w-full ${hideLabel ? '' : 'mb-4'}`}>
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
    </div>
  );
};

const DateField: React.FC<DynamicFieldProps> = ({ field, value, onChange, disabled, hideLabel }) => (
  <div className={`w-full ${hideLabel ? '' : 'mb-4'}`}>
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
  </div>
);

const DropdownField: React.FC<DynamicFieldProps> = ({ field, value, onChange, disabled, hideLabel }) => {
  const options = Array.isArray(field.values) ? (field.values as string[]) : [];
  return (
    <div className={`w-full ${hideLabel ? '' : 'mb-4'}`}>
      {!hideLabel && <Label text={field.label_name} required={field.required} hint={field.field_description} />}
      <select
        name={field.field_name}
        value={value ?? ""}
        required={field.required}
        disabled={disabled ?? !field.can_update}
        className={`${baseInput} appearance-none cursor-pointer bg-no-repeat`}
        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
        onChange={(e) => onChange(field.field_name, e.target.value)}
      >
        <option value="">{field.placeholder || "Select…"}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
};

const TextareaField: React.FC<DynamicFieldProps> = ({ field, value, onChange, disabled, hideLabel, className = "" }) => (
  <div className={`w-full ${className} ${hideLabel ? '' : 'mb-4'}`}>
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
  </div>
);

const BooleanField: React.FC<DynamicFieldProps> = ({ field, value, onChange, disabled, hideLabel }) => {
  const checked = value === true || value === "true" || value === 1;
  return (
    <div className={`w-full ${hideLabel ? '' : 'mb-4'}`}>
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
        <span className={`text-sm font-medium ${ checked ? "text-blue-600" : "text-slate-500" }`}>
          {checked ? "Yes" : "No"}
        </span>
      </div>
    </div>
  );
};

export const DynamicField: React.FC<DynamicFieldProps> = (props) => {
  const { field } = props;
  if (field.type === "LIST-DICT" || field.view_mode === "HIDE") return null;

  switch (field.type) {
    case "BOOLEAN":  return <BooleanField  {...props} />;
    case "DROP-DOWN": return <DropdownField {...props} />;
    case "TEXTAREA": return <TextareaField {...props} />;
    case "NUMBER": return <NumberField {...props} />;
    case "DECIMAL": return <NumberField {...props} />;
    case "DATE": return <DateField {...props} />;
    case "TEXT": return <TextField {...props} />;
    case "EMAIL": return <TextField {...props} />;
    case "DICT": return (
      // DICT fields are auto-calculated/read-only — show as informational placeholder
      <div className={`w-full ${props.hideLabel ? '' : 'mb-4'}`}>
        {!props.hideLabel && <Label text={field.label_name} hint={field.field_description} />}
        <div className="block w-full rounded-md border-0 py-2 px-3 text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 bg-slate-50 sm:text-sm italic">
          {field.placeholder || "Auto-calculated"}
        </div>
      </div>
    );
    default: return <TextField {...props} />;
  }
};

export default DynamicField;