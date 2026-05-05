import React, { useCallback, useMemo, useState } from "react";
import { Select, Spin, Empty } from "antd";
import { Plus } from "lucide-react"; 
import { useSearchSelect } from "../../hooks/UseSearchSelect";
import { HighlightText } from "./HighLightText";

// Type constraint to ensure our generic T is an object
export type BaseOption = Record<string, unknown>;

export interface SearchSelectProps<T extends BaseOption> {
  value?: string | number | string[] | number[];
  onChange?: (value: string | number | string[] | number[], options?: T | T[]) => void;

  // Data props
  fetchOptions?: (query: string, signal: AbortSignal) => Promise<T[]>;
  options?: T[];

  // Key mapping
  labelKey: keyof T;
  valueKey: keyof T;

  // Display & Mode props
  multiple?: boolean;
  tags?: boolean;
  label?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;

  // Custom rendering
  renderOption?: (option: T, searchValue: string) => React.ReactNode;
  
  // NEW: Callback to trigger creation modal
  onCreateNew?: (searchValue: string) => void;
}

const EMPTY_ARRAY: any[] = [];

export function SearchSelect<T extends BaseOption>({
  value,
  onChange,
  fetchOptions,
  options: staticOptions = EMPTY_ARRAY,
  labelKey,
  valueKey,
  label,
  required,
  multiple = false,
  tags = false,
  placeholder = "Search...",
  disabled = false,
  allowClear = true,
  className,
  renderOption,
  onCreateNew,
}: SearchSelectProps<T>) {
  const [searchValue, setSearchValue] = useState("");
  const id = React.useId();

  // Initialize smart hook
  const { options, loading, handleSearch } = useSearchSelect<T>(
    fetchOptions,
    staticOptions
  );

  const isAsync = !!fetchOptions;
  const mode = tags ? "tags" : multiple ? "multiple" : undefined;

  const onSearch = useCallback((val: string) => {
    setSearchValue(val);
    handleSearch(val);
  }, [handleSearch]);

  // Map generic objects to Ant Design Option format
  const formattedOptions = useMemo(() => {
    return options.map((opt) => {
      const labelStr = String(opt[labelKey]);
      const val = opt[valueKey] as string | number;

      return {
        value: val,
        label: renderOption ? (
          renderOption(opt, searchValue)
        ) : (
          <HighlightText text={labelStr} highlight={searchValue} />
        ),
        // Storing the raw object so we can pass it back in onChange
        rawOption: opt,
      };
    });
  }, [options, labelKey, valueKey, renderOption, searchValue]);

  // Check if an exact match exists so we hide the "Create" button if it does
  const exactMatchExists = useMemo(() => {
    if (!searchValue) return true; 
    return options.some(
      (opt) => String(opt[labelKey]).toLowerCase() === searchValue.toLowerCase().trim()
    );
  }, [options, labelKey, searchValue]);

  // Clear search value when value prop changes externally (e.g. after quick create)
  React.useEffect(() => {
    setSearchValue("");
  }, [value]);

  // Ant Design expects standard values in onChange. We intercept it to also pass the raw T object back.
  const handleChange = useCallback((val: any, antdOption: any) => {
    setSearchValue(""); // Clear on select
    if (!onChange) return;

    if (Array.isArray(antdOption)) {
      const rawOptions = antdOption.map((o) => o.rawOption as T);
      onChange(val, rawOptions);
    } else {
      onChange(val, antdOption?.rawOption as T);
    }
  }, [onChange]);

  const dropdownRender = useCallback(
    (menu: React.ReactNode) => (
      <>
        {menu}
        {onCreateNew && searchValue && !exactMatchExists && (
          <div className="p-2 border-t border-slate-100 bg-slate-50 mt-1">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => onCreateNew(searchValue)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Create "{searchValue}"
            </button>
          </div>
        )}
      </>
    ),
    [onCreateNew, searchValue, exactMatchExists]
  );

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-600 ml-0.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Select
        id={id}
        className={className}
        mode={mode}
        showSearch
        allowClear={allowClear}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        options={formattedOptions}
        onSearch={onSearch}
        onChange={handleChange}
        filterOption={
          isAsync
            ? false
            : (input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
        }
        notFoundContent={
          loading ? (
            <div className="flex justify-center items-center py-4 text-gray-400">
              <Spin size="small" className="mr-2" /> Searching...
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No results found"
            />
          )
        }
        dropdownRender={dropdownRender}
      />
    </div>
  );
}