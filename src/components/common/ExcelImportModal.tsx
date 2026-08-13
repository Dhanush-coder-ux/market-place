/**
 * ExcelImportModal.tsx  (v2)
 *
 * Full-screen split-pane import modal:
 *   Left  → live scrollable data table of all uploaded rows
 *   Right → step panel (Template / Upload / Mapping & Preview / Result)
 *
 * For Inventory:
 *   • Fetches backend categories + units on open
 *   • Fuzzy-matches Excel "Category" + "Unit" columns to backend records
 *   • Unmatched values surface as mandatory dropdowns the user must resolve
 *   • Resolved category_id / unit_id are injected into every bulk payload row
 *
 * For Customer / Supplier: identical to v1 (no category/unit logic needed).
 */

import React, {
  FC,
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Table2,
  FileUp,
  Tag,
  Ruler,
  ArrowRight,
  Search,
  CheckCheck,
} from "lucide-react";
import {
  ImportColumnDef,
  EntityType,
  getColumnsForEntity,
  validateRow,
  transformRowToPayload,
} from "./excelImportSchemas";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { utilityApi } from "@/services/api/utility";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExcelImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entityType: EntityType;
}

type Step = "intro" | "upload" | "mapping" | "submitting" | "result";

interface ParsedRow {
  _rowIndex: number;
  [key: string]: any;
}

interface RowValidationError {
  rowIndex: number;
  errors: Record<string, string>;
}

interface BackendRecord { id: string; name: string; }

// ─── Entity meta ─────────────────────────────────────────────────────────────

const ENTITY_META = {
  customer: {
    label: "Customers",
    bulkEndpoint: ENDPOINTS.CUSTOMERS + "/bulk",
    gradientFrom: "#7c3aed",
    gradientTo: "#a855f7",
    hasCategoryUnit: false,
  },
  supplier: {
    label: "Suppliers",
    bulkEndpoint: ENDPOINTS.SUPPLIERS + "/bulk",
    gradientFrom: "#2563eb",
    gradientTo: "#3b82f6",
    hasCategoryUnit: false,
  },
  inventory: {
    label: "Products",
    bulkEndpoint: ENDPOINTS.INVENTORIES + "/bulk",
    gradientFrom: "#059669",
    gradientTo: "#10b981",
    hasCategoryUnit: true,
  },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function downloadSampleXlsx(columns: ImportColumnDef[], entityLabel: string, hasCategUnit = false) {
  const extraCols = hasCategUnit ? ["Category", "Unit"] : [];
  const headers = [...columns.map((c) => c.label), ...extraCols];
  const exampleRow = [
    ...columns.map((c) => c.example ?? ""),
    ...(hasCategUnit ? ["Electronics", "Pieces"] : []),
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  ws["!cols"] = headers.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, entityLabel);
  XLSX.writeFile(wb, `${entityLabel.toLowerCase()}_import_template.xlsx`);
}

function parseXlsxFile(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, {
          defval: "",
          raw: false,
        });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsBinaryString(file);
  });
}

function normalizeRows(
  rawRows: Record<string, any>[],
  columns: ImportColumnDef[],
  hasCategUnit: boolean
): ParsedRow[] {
  // Build label→key map from schema columns
  const labelToKey = Object.fromEntries(
    columns.map((c) => [c.label.toLowerCase().trim(), c.key])
  );
  // Also map category + unit column headers
  if (hasCategUnit) {
    labelToKey["category"] = "_category_text";
    labelToKey["unit"] = "_unit_text";
  }

  return rawRows.map((raw, i) => {
    const row: ParsedRow = { _rowIndex: i + 2 };
    for (const [rawKey, val] of Object.entries(raw)) {
      const normalized = rawKey.toLowerCase().trim();
      const colKey = labelToKey[normalized] || normalized;
      row[colKey] = val;
    }
    return row;
  });
}

/** Fuzzy match: lowercase trim comparison */
function fuzzyMatch(text: string, records: BackendRecord[]): BackendRecord | null {
  const needle = text.trim().toLowerCase();
  if (!needle) return null;
  // Exact match first
  const exact = records.find((r) => r.name.toLowerCase() === needle);
  if (exact) return exact;
  // Starts-with match
  const sw = records.find((r) => r.name.toLowerCase().startsWith(needle));
  if (sw) return sw;
  // Contains match
  const contains = records.find((r) => r.name.toLowerCase().includes(needle));
  if (contains) return contains;
  return null;
}

/** Collect unique unmatched category/unit text values from rows */
function collectUnmatchedValues(
  rows: ParsedRow[],
  field: "_category_text" | "_unit_text",
  records: BackendRecord[]
): string[] {
  const uniqueTexts = [...new Set(rows.map((r) => String(r[field] || "").trim()).filter(Boolean))];
  return uniqueTexts.filter((t) => !fuzzyMatch(t, records));
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const VISIBLE_STEPS = [
  { id: "intro" as Step, label: "Template" },
  { id: "upload" as Step, label: "Upload" },
  { id: "mapping" as Step, label: "Preview" },
  { id: "result" as Step, label: "Done" },
];

const StepIndicator: FC<{ current: Step; from: string; to: string }> = ({ current, from, to }) => {
  const currentIdx = VISIBLE_STEPS.findIndex((s) => s.id === current);
  const isDone = current === "result";

  return (
    <div className="flex items-center gap-0 w-full">
      {VISIBLE_STEPS.map((step, idx) => {
        const done = idx < currentIdx || isDone;
        const active = idx === currentIdx && !isDone;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${done || active ? "text-white" : "bg-slate-100 text-slate-400"
                  }`}
                style={
                  done || active
                    ? {
                      background: `linear-gradient(135deg, ${from}, ${to})`,
                      boxShadow: active ? `0 0 0 4px ${from}30` : undefined,
                    }
                    : {}
                }
              >
                {done ? <CheckCircle2 size={14} /> : idx + 1}
              </div>
              <span className={`text-[10px] font-semibold leading-none whitespace-nowrap ${active ? "text-slate-800" : done ? "text-slate-500" : "text-slate-400"}`}>
                {step.label}
              </span>
            </div>
            {idx < VISIBLE_STEPS.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-1 rounded-full transition-all duration-500"
                style={{ background: idx < currentIdx || isDone ? `linear-gradient(90deg, ${from}, ${to})` : "#e2e8f0" }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Data Table (left panel of preview/mapping step) ─────────────────────────

const DataTable: FC<{
  rows: ParsedRow[];
  columns: ImportColumnDef[];
  hasCategoryUnit: boolean;
  rowErrors: RowValidationError[];
  categories: BackendRecord[];
  units: BackendRecord[];
  categoryMapping: Record<string, string>;
  unitMapping: Record<string, string>;
  onRowChange?: (rowIndex: number, key: string, value: any) => void;
}> = ({ rows, columns, hasCategoryUnit, rowErrors, categories, units, categoryMapping, unitMapping, onRowChange }) => {
  const displayCols = columns.slice(0, 7);

  return (
    <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50 shrink-0">
        <div className="flex items-center gap-2">
          <Table2 size={14} className="text-slate-500" />
          <span className="text-[12px] font-bold text-slate-700">Uploaded Data</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
            {rows.length - rowErrors.length} valid
          </span>
          {rowErrors.length > 0 && (
            <span className="text-[11px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full">
              {rowErrors.length} errors
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-800 text-white">
              <th className="px-3 py-2.5 text-left font-semibold text-slate-300 whitespace-nowrap w-12">#</th>
              {/* Status column */}
              <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap w-16">Status</th>
              {displayCols.map((col) => (
                <th key={col.key} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">
                  {col.label}{col.required && <span className="text-red-400 ml-0.5">*</span>}
                </th>
              ))}
              {columns.length > 7 && (
                <th className="px-3 py-2.5 text-slate-400 text-left font-semibold">+{columns.length - 7} more</th>
              )}
              {hasCategoryUnit && (
                <>
                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">
                    <span className="flex items-center gap-1"><Tag size={10} />Category</span>
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">
                    <span className="flex items-center gap-1"><Ruler size={10} />Unit</span>
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowErr = rowErrors.find((e) => e.rowIndex === row._rowIndex);
              const isValid = !rowErr;

              // Category resolution for this row
              const catText = String(row._category_text || "").trim();
              const unitText = String(row._unit_text || "").trim();
              const resolvedCatId = catText
                ? (categoryMapping[catText] || fuzzyMatch(catText, categories)?.id || null)
                : null;
              const resolvedUnitId = unitText
                ? (unitMapping[unitText] || fuzzyMatch(unitText, units)?.id || null)
                : null;
              const catResolved = !catText || !!resolvedCatId;
              const unitResolved = !unitText || !!resolvedUnitId;
              const categoryName = resolvedCatId ? (categories.find(c => c.id === resolvedCatId)?.name || catText) : catText;
              const unitName = resolvedUnitId ? (units.find(u => u.id === resolvedUnitId)?.name || unitText) : unitText;

              return (
                <tr
                  key={row._rowIndex}
                  className={`border-t border-slate-100 transition-colors ${isValid && catResolved && unitResolved
                    ? "hover:bg-emerald-50/30"
                    : "bg-red-50/40 hover:bg-red-50/60"
                    }`}
                >
                  <td className="px-3 py-2 font-mono text-slate-400 text-[10px]">{row._rowIndex}</td>
                  <td className="px-3 py-2">
                    {isValid && catResolved && unitResolved ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                        <CheckCircle2 size={11} /> OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-500 font-bold text-[10px]">
                        <AlertTriangle size={11} /> Error
                      </span>
                    )}
                  </td>
                  {displayCols.map((col) => {
                    const cellErr = rowErr?.errors[col.key];
                    const val = row[col.key];

                    if (col.key === "stocks" && (val === 0 || val === "0" || val === "" || val === undefined || val === null)) {
                      return (
                        <td key={col.key} className="px-3 py-2 whitespace-nowrap">
                          <input
                            type="number"
                            className={`w-20 text-[11px] border ${cellErr ? 'border-red-400' : 'border-slate-200'} rounded px-2 py-1 focus:border-blue-400 focus:outline-none`}
                            value={val === undefined || val === null ? "" : val}
                            onChange={(e) => onRowChange && onRowChange(row._rowIndex, col.key, e.target.value)}
                            placeholder="Stock"
                          />
                        </td>
                      );
                    }

                    return (
                      <td key={col.key} className="px-3 py-2 whitespace-nowrap max-w-[160px]" title={cellErr || String(val || "")}>
                        {cellErr ? (
                          <span className="text-red-500 font-semibold flex items-center gap-1 truncate">
                            <AlertTriangle size={10} />
                            <span className="truncate">{cellErr.replace(`"${col.label}" `, "")}</span>
                          </span>
                        ) : val !== "" ? (
                          <span className="text-slate-700 font-medium truncate block">{String(val)}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                  {columns.length > 7 && <td className="px-3 py-2 text-slate-300 text-center">…</td>}
                  {hasCategoryUnit && (
                    <>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {catResolved ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                            <CheckCircle2 size={10} />{categoryName || "—"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                            <AlertTriangle size={10} />{catText || "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {unitResolved ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                            <CheckCircle2 size={10} />{unitName || "—"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                            <AlertTriangle size={10} />{unitText || "—"}
                          </span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length > 50 && (
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 font-semibold text-center">
            Showing all {rows.length} rows
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Category/Unit Mapping Panel ──────────────────────────────────────────────

const MappingPanel: FC<{
  unmatchedCategories: string[];
  unmatchedUnits: string[];
  categories: BackendRecord[];
  units: BackendRecord[];
  categoryMapping: Record<string, string>;
  unitMapping: Record<string, string>;
  onCategoryMap: (text: string, id: string) => void;
  onUnitMap: (text: string, id: string) => void;
  loadingDropdowns: boolean;
}> = ({
  unmatchedCategories,
  unmatchedUnits,
  categories,
  units,
  categoryMapping,
  unitMapping,
  onCategoryMap,
  onUnitMap,
  loadingDropdowns,
}) => {
    const [catSearch, setCatSearch] = useState("");
    const [unitSearch, setUnitSearch] = useState("");

    const filteredCats = useMemo(() =>
      categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())),
      [categories, catSearch]
    );
    const filteredUnits = useMemo(() =>
      units.filter(u => u.name.toLowerCase().includes(unitSearch.toLowerCase())),
      [units, unitSearch]
    );

    const allResolved =
      unmatchedCategories.every((t) => !!categoryMapping[t]) &&
      unmatchedUnits.every((t) => !!unitMapping[t]);

    if (loadingDropdowns) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <Loader2 className="animate-spin text-slate-400" size={24} />
          <p className="text-[12px] text-slate-400 font-medium">Loading categories & units…</p>
        </div>
      );
    }

    if (unmatchedCategories.length === 0 && unmatchedUnits.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <CheckCheck size={28} className="text-emerald-500" />
          </div>
          <div className="text-center">
            <p className="text-[14px] font-bold text-slate-800">All Matched!</p>
            <p className="text-[11px] text-slate-400 mt-1">Every category and unit was automatically resolved.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5 overflow-y-auto flex-1">
        {/* Unmatched Categories */}
        {unmatchedCategories.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag size={13} className="text-violet-500" />
              <span className="text-[12px] font-bold text-slate-700">
                Unmatched Categories ({unmatchedCategories.length})
              </span>
            </div>

            {/* Search categories */}
            <div className="relative mb-2">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search categories…"
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400 bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              {unmatchedCategories.map((text) => {
                const mappedId = categoryMapping[text];
                const mappedName = mappedId ? categories.find(c => c.id === mappedId)?.name : null;
                return (
                  <div key={text} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        From Excel: "{text}"
                      </span>
                      <ArrowRight size={12} className="text-slate-300" />
                      {mappedName ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          ✓ {mappedName}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Select below</span>
                      )}
                    </div>
                    <select
                      value={mappedId || ""}
                      onChange={(e) => onCategoryMap(text, e.target.value)}
                      className={`w-full text-[11px] border rounded-lg px-2.5 py-2 focus:outline-none transition-colors ${mappedId
                        ? "border-emerald-300 bg-emerald-50/50 text-emerald-800 focus:border-emerald-400"
                        : "border-amber-300 bg-amber-50/50 text-slate-700 focus:border-amber-400"
                        }`}
                    >
                      <option value="">— Choose category —</option>
                      {filteredCats.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Unmatched Units */}
        {unmatchedUnits.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Ruler size={13} className="text-blue-500" />
              <span className="text-[12px] font-bold text-slate-700">
                Unmatched Units ({unmatchedUnits.length})
              </span>
            </div>

            {/* Search units */}
            <div className="relative mb-2">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search units…"
                value={unitSearch}
                onChange={(e) => setUnitSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              {unmatchedUnits.map((text) => {
                const mappedId = unitMapping[text];
                const mappedName = mappedId ? units.find(u => u.id === mappedId)?.name : null;
                return (
                  <div key={text} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        From Excel: "{text}"
                      </span>
                      <ArrowRight size={12} className="text-slate-300" />
                      {mappedName ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          ✓ {mappedName}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Select below</span>
                      )}
                    </div>
                    <select
                      value={mappedId || ""}
                      onChange={(e) => onUnitMap(text, e.target.value)}
                      className={`w-full text-[11px] border rounded-lg px-2.5 py-2 focus:outline-none transition-colors ${mappedId
                        ? "border-emerald-300 bg-emerald-50/50 text-emerald-800 focus:border-emerald-400"
                        : "border-amber-300 bg-amber-50/50 text-slate-700 focus:border-amber-400"
                        }`}
                    >
                      <option value="">— Choose unit —</option>
                      {filteredUnits.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All resolved banner */}
        {allResolved && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <p className="text-[12px] font-bold text-emerald-700">All mappings resolved! Ready to import.</p>
          </div>
        )}
      </div>
    );
  };

// ─── Main Component ───────────────────────────────────────────────────────────

const ExcelImportModal: FC<ExcelImportModalProps> = ({
  open,
  onClose,
  onSuccess,
  entityType,
}) => {
  const { postData } = useApi();
  const meta = ENTITY_META[entityType];
  const columns = getColumnsForEntity(entityType);
  const hasCategoryUnit = meta.hasCategoryUnit;

  // Steps
  const [step, setStep] = useState<Step>("intro");

  // File / rows
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [rowErrors, setRowErrors] = useState<RowValidationError[]>([]);

  // Category / Unit backend data
  const [categories, setCategories] = useState<BackendRecord[]>([]);
  const [units, setUnits] = useState<BackendRecord[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Manual mappings: excelText → backendId
  const [categoryMapping, setCategoryMapping] = useState<Record<string, string>>({});
  const [unitMapping, setUnitMapping] = useState<Record<string, string>>({});

  // Submit result
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRowChange = useCallback((rowIndex: number, key: string, value: any) => {
    setRows((prev) => {
      const newRows = [...prev];
      const rowIdx = newRows.findIndex((r) => r._rowIndex === rowIndex);
      if (rowIdx > -1) {
        newRows[rowIdx] = { ...newRows[rowIdx], [key]: value };

        const newErr = validateRow(newRows[rowIdx], columns);
        setRowErrors((prevErrs) => {
          const otherErrs = prevErrs.filter((e) => e.rowIndex !== rowIndex);
          if (Object.keys(newErr).length > 0) {
            return [...otherErrs, { rowIndex, errors: newErr }];
          }
          return otherErrs;
        });
      }
      return newRows;
    });
  }, [columns]);

  // ── Reset on open/close ───────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setStep("intro");
      setFile(null);
      setRows([]);
      setRowErrors([]);
      setParseError(null);
      setSubmitResult(null);
      setCategoryMapping({});
      setUnitMapping({});
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ── Fetch categories + units when inventory modal opens ───────────────────
  useEffect(() => {
    if (!open || !hasCategoryUnit) return;
    setLoadingDropdowns(true);
    Promise.all([
      utilityApi.getShopCategories(SHOP_ID),
      utilityApi.getShopUnits(SHOP_ID),
    ])
      .then(([catRes, unitRes]) => {
        if (catRes?.data) {
          const cats = Array.isArray(catRes.data) ? catRes.data : (catRes.data?.datas ?? []);
          setCategories(cats.filter((c: any) => c?.id && c?.name));
        }
        if (unitRes?.data) {
          const uns = Array.isArray(unitRes.data) ? unitRes.data : (unitRes.data?.datas ?? []);
          setUnits(uns.filter((u: any) => u?.id && u?.name));
        }
      })
      .catch(() => { })
      .finally(() => setLoadingDropdowns(false));
  }, [open, hasCategoryUnit]);

  // ── Computed: unmatched values ────────────────────────────────────────────
  const unmatchedCategories = useMemo(() => {
    if (!hasCategoryUnit || rows.length === 0) return [];
    return collectUnmatchedValues(rows, "_category_text", categories).filter(
      (t) => !categoryMapping[t]
    );
  }, [rows, categories, categoryMapping, hasCategoryUnit]);

  const unmatchedUnits = useMemo(() => {
    if (!hasCategoryUnit || rows.length === 0) return [];
    return collectUnmatchedValues(rows, "_unit_text", units).filter(
      (t) => !unitMapping[t]
    );
  }, [rows, units, unitMapping, hasCategoryUnit]);

  const allMappingsDone = unmatchedCategories.length === 0 && unmatchedUnits.length === 0;

  // ── Valid row count ───────────────────────────────────────────────────────
  const validRowCount = rows.length - rowErrors.length;

  // ── File handling ─────────────────────────────────────────────────────────
  const handleFileSelect = useCallback(
    async (f: File) => {
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (!["xlsx", "xls", "csv"].includes(ext || "")) {
        setParseError("Please upload an .xlsx, .xls or .csv file.");
        return;
      }
      setParseError(null);
      setFile(f);
      try {
        const rawRows = await parseXlsxFile(f);
        if (rawRows.length === 0) {
          setParseError("The file appears to be empty or has no data rows.");
          return;
        }
        const normalized = normalizeRows(rawRows, columns, hasCategoryUnit);
        setRows(normalized);
        const errs: RowValidationError[] = [];
        normalized.forEach((row) => {
          const e = validateRow(row, columns);
          if (Object.keys(e).length > 0) errs.push({ rowIndex: row._rowIndex, errors: e });
        });
        setRowErrors(errs);
        setStep("mapping");
      } catch {
        setParseError("Failed to parse the file. Please use the provided sample template.");
      }
    },
    [columns, hasCategoryUnit]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFileSelect(f);
    },
    [handleFileSelect]
  );

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setStep("submitting");
    setSubmitProgress(0);

    const payloads = rows.map((row) => {
      const payload = transformRowToPayload(row, columns, SHOP_ID, entityType);

      if (hasCategoryUnit) {
        // Resolve category_id
        const catText = String(row._category_text || "").trim();
        const catId = catText
          ? (categoryMapping[catText] || fuzzyMatch(catText, categories)?.id || "")
          : "";
        payload.category_id = catId;

        // Resolve unit_id
        const unitText = String(row._unit_text || "").trim();
        const unitId = unitText
          ? (unitMapping[unitText] || fuzzyMatch(unitText, units)?.id || "")
          : "";
        payload.unit_id = unitId;
      }

      return payload;
    });

    try {
      let prog = 0;
      const interval = setInterval(() => {
        prog = Math.min(prog + 4, 88);
        setSubmitProgress(prog);
      }, 80);

      const res = await postData(meta.bulkEndpoint, payloads);

      clearInterval(interval);
      setSubmitProgress(100);

      if (res === null) {
        setSubmitResult({
          success: false,
          message: "The server rejected the request. Check your data and try again.",
        });
      } else {
        setSubmitResult({
          success: true,
          message: `Successfully imported ${rows.length} ${meta.label.toLowerCase()}.`,
          count: rows.length,
        });
        onSuccess();
      }
    } catch (err: any) {
      setSubmitResult({
        success: false,
        message: err?.message ?? "Unexpected error during import.",
      });
    }
    setStep("result");
  };

  if (!open) return null;

  const isMapping = step === "mapping";
  const isPreviewStep = isMapping || step === "submitting" || step === "result";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.72)", backdropFilter: "blur(10px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          width: isPreviewStep ? "min(96vw, 1400px)" : "min(94vw, 580px)",
          height: isPreviewStep ? "min(92vh, 860px)" : "auto",
          maxHeight: "92vh",
          animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          transition: "width 0.35s cubic-bezier(0.4,0,0.2,1), height 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* ── Gradient Header ── */}
        <div
          className="relative flex items-center justify-between px-6 py-5 shrink-0"
          style={{ background: `linear-gradient(135deg, ${meta.gradientFrom} 0%, ${meta.gradientTo} 100%)` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <FileSpreadsheet className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-white font-bold text-[15px] leading-tight">Import {meta.label}</h2>
              <p className="text-white/70 text-[11px] font-medium">Bulk import from Excel spreadsheet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X size={16} />
          </button>
          {/* Decorative blobs */}
          <div className="absolute right-24 top-1 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-14 top-5 w-12 h-12 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* ── Step indicator (hide during submitting/result when in split mode) ── */}
        {step !== "submitting" && (
          <div className="px-6 pt-4 pb-3 border-b border-slate-100 shrink-0">
            <StepIndicator current={step} from={meta.gradientFrom} to={meta.gradientTo} />
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex-1 min-h-0 flex overflow-hidden">

          {/* ═══ INTRO STEP ═══ */}
          {step === "intro" && (
            <div className="flex-1 p-6 overflow-y-auto space-y-5">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Table2 size={15} className="text-slate-500" />
                  <span className="text-[13px] font-bold text-slate-700">Required columns for {meta.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {columns.map((col) => (
                    <div key={col.key} className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${col.required ? "bg-red-400" : "bg-slate-300"}`} />
                      <span className="text-[11px] font-semibold text-slate-600 truncate">{col.label}</span>
                      {col.required && <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1 rounded shrink-0">REQ</span>}
                    </div>
                  ))}
                  {hasCategoryUnit && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-violet-400" />
                        <span className="text-[11px] font-semibold text-slate-600">Category</span>
                        <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-1 rounded shrink-0">MATCH</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-blue-400" />
                        <span className="text-[11px] font-semibold text-slate-600">Unit</span>
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 rounded shrink-0">MATCH</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {hasCategoryUnit && (
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 flex items-start gap-3">
                  <Tag size={15} className="text-violet-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-bold text-violet-800">Smart Category & Unit Matching</p>
                    <p className="text-[11px] text-violet-700/80 mt-1 leading-relaxed">
                      Add "Category" and "Unit" columns in your Excel. We'll automatically match them to your shop's categories and units.
                      For any unmatched values, you'll be prompted to select the correct one before importing.
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={15} />
                <div>
                  <p className="text-[12px] font-bold text-amber-800">Before you begin</p>
                  <ul className="mt-1 space-y-0.5 text-[11px] text-amber-700/80 list-disc list-inside">
                    <li>Download the sample template for the correct column structure</li>
                    <li>Fill in your data starting from Row 2 (Row 1 = headers)</li>
                    <li>Fields marked REQ must not be empty</li>
                    <li>Boolean fields: use <code className="bg-amber-100 px-0.5 rounded">true</code> or <code className="bg-amber-100 px-0.5 rounded">false</code></li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => downloadSampleXlsx(columns, meta.label, hasCategoryUnit)}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl border-2 border-dashed text-[13px] font-bold transition-all hover:scale-[1.01] active:scale-100"
                style={{ borderColor: meta.gradientFrom, color: meta.gradientFrom, background: `${meta.gradientFrom}08` }}
              >
                <Download size={16} />
                Download Sample Template (.xlsx)
              </button>
            </div>
          )}

          {/* ═══ UPLOAD STEP ═══ */}
          {step === "upload" && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-12 flex flex-col items-center gap-3"
                style={{
                  borderColor: isDragging ? meta.gradientFrom : "#cbd5e1",
                  background: isDragging ? `${meta.gradientFrom}08` : "#f8fafc",
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${meta.gradientFrom}, ${meta.gradientTo})` }}
                >
                  <FileUp className="text-white" size={28} />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-bold text-slate-700">
                    {isDragging ? "Drop your file here" : "Click to upload or drag & drop"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Supports .xlsx, .xls and .csv files</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
              </div>
              {parseError && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3">
                  <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-700 font-semibold">{parseError}</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ MAPPING + PREVIEW STEP (split pane) ═══ */}
          {step === "mapping" && (
            <>
              {/* Left: Full data table */}
              <div className="flex-1 min-w-0 border-r border-slate-100 flex flex-col overflow-hidden">
                <DataTable
                  rows={rows}
                  columns={columns}
                  hasCategoryUnit={hasCategoryUnit}
                  rowErrors={rowErrors}
                  categories={categories}
                  units={units}
                  categoryMapping={categoryMapping}
                  unitMapping={unitMapping}
                  onRowChange={handleRowChange}
                />
              </div>

              {/* Right: Mapping panel / stats */}
              <div className="w-80 shrink-0 flex flex-col overflow-hidden border-l border-slate-100">
                {/* File info bar */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 truncate">{file?.name}</span>
                    <button
                      onClick={() => { setFile(null); setRows([]); setRowErrors([]); setStep("upload"); }}
                      className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors shrink-0 ml-2"
                    >
                      Change
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-semibold">TOTAL</p>
                      <p className="text-[17px] font-black text-slate-800">{rows.length}</p>
                    </div>
                    <div className="w-px h-7 bg-slate-200" />
                    <div className="text-center">
                      <p className="text-[10px] text-emerald-500 font-semibold">VALID</p>
                      <p className="text-[17px] font-black text-emerald-600">{validRowCount}</p>
                    </div>
                    {rowErrors.length > 0 && (
                      <>
                        <div className="w-px h-7 bg-slate-200" />
                        <div className="text-center">
                          <p className="text-[10px] text-red-400 font-semibold">ERRORS</p>
                          <p className="text-[17px] font-black text-red-500">{rowErrors.length}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Mapping or success panel */}
                <div className="flex-1 overflow-y-auto p-4">
                  {hasCategoryUnit ? (
                    <>
                      {/* Header for mapping section */}
                      <div className="flex items-center gap-2 mb-4">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-black"
                          style={{ background: `linear-gradient(135deg, ${meta.gradientFrom}, ${meta.gradientTo})` }}
                        >
                          {unmatchedCategories.length + unmatchedUnits.length > 0
                            ? (unmatchedCategories.length + unmatchedUnits.length)
                            : "✓"}
                        </div>
                        <span className="text-[12px] font-bold text-slate-700">
                          {allMappingsDone ? "Mappings resolved" : "Resolve mappings"}
                        </span>
                      </div>
                      <MappingPanel
                        unmatchedCategories={unmatchedCategories}
                        unmatchedUnits={unmatchedUnits}
                        categories={categories}
                        units={units}
                        categoryMapping={categoryMapping}
                        unitMapping={unitMapping}
                        onCategoryMap={(text, id) => setCategoryMapping((prev) => ({ ...prev, [text]: id }))}
                        onUnitMap={(text, id) => setUnitMapping((prev) => ({ ...prev, [text]: id }))}
                        loadingDropdowns={loadingDropdowns}
                      />
                    </>
                  ) : (
                    <div className="space-y-3">
                      {/* Validation errors summary */}
                      {rowErrors.length > 0 && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={13} className="text-red-500" />
                            <p className="text-[12px] font-bold text-red-700">
                              {rowErrors.length} row{rowErrors.length > 1 ? "s have" : " has"} errors
                            </p>
                          </div>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {rowErrors.slice(0, 8).map((re) => (
                              <div key={re.rowIndex} className="text-[10px] text-red-600">
                                <span className="font-bold">Row {re.rowIndex}:</span>{" "}
                                {Object.values(re.errors).join(", ")}
                              </div>
                            ))}
                            {rowErrors.length > 8 && (
                              <p className="text-[10px] text-red-400 font-semibold">+{rowErrors.length - 8} more</p>
                            )}
                          </div>
                        </div>
                      )}
                      {rowErrors.length === 0 && (
                        <div className="flex flex-col items-center gap-2 py-6">
                          <CheckCheck size={28} className="text-emerald-400" />
                          <p className="text-[12px] font-bold text-slate-700">All rows are valid!</p>
                          <p className="text-[11px] text-slate-400">Click import to proceed.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ═══ SUBMITTING ═══ */}
          {step === "submitting" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl"
                style={{ background: `linear-gradient(135deg, ${meta.gradientFrom}, ${meta.gradientTo})` }}
              >
                <Loader2 className="text-white animate-spin" size={36} />
              </div>
              <div className="text-center">
                <p className="text-[16px] font-black text-slate-800">Importing {meta.label}…</p>
                <p className="text-[12px] text-slate-400 mt-1">Submitting {rows.length} records to the server</p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-500">Progress</span>
                  <span style={{ color: meta.gradientFrom }}>{submitProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${submitProgress}%`, background: `linear-gradient(90deg, ${meta.gradientFrom}, ${meta.gradientTo})` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═══ RESULT ═══ */}
          {step === "result" && submitResult && (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl ${submitResult.success ? "bg-gradient-to-br from-emerald-500 to-green-400" : "bg-gradient-to-br from-red-500 to-rose-400"
                  }`}
              >
                {submitResult.success ? (
                  <CheckCircle2 className="text-white" size={36} />
                ) : (
                  <AlertTriangle className="text-white" size={36} />
                )}
              </div>
              <div className="text-center max-w-sm">
                <p className="text-[17px] font-black text-slate-800">
                  {submitResult.success ? "Import Complete!" : "Import Failed"}
                </p>
                <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">{submitResult.message}</p>
              </div>
              {submitResult.success && (
                <div
                  className="flex items-center gap-3 px-5 py-3 rounded-xl border"
                  style={{ borderColor: `${meta.gradientFrom}40`, background: `${meta.gradientFrom}08`, color: meta.gradientFrom }}
                >
                  <CheckCircle2 size={16} />
                  <span className="text-[13px] font-bold">{submitResult.count} {meta.label} imported</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          {/* Left nav */}
          <div>
            {step === "upload" && (
              <button
                onClick={() => setStep("intro")}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}
            {step === "mapping" && (
              <button
                onClick={() => { setStep("upload"); setRows([]); setRowErrors([]); setFile(null); }}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {step !== "submitting" && step !== "result" && (
              <button
                onClick={onClose}
                className="h-9 px-4 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-semibold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            )}

            {step === "intro" && (
              <button
                onClick={() => setStep("upload")}
                className="h-9 px-5 rounded-lg text-white text-[12px] font-bold flex items-center gap-1.5 transition-all hover:opacity-90 active:scale-95"
                style={{ background: `linear-gradient(135deg, ${meta.gradientFrom}, ${meta.gradientTo})` }}
              >
                Next: Upload File <ChevronRight size={14} />
              </button>
            )}

            {step === "upload" && (
              <button
                disabled
                className="h-9 px-5 rounded-lg text-white text-[12px] font-bold flex items-center gap-1.5 opacity-40 cursor-not-allowed"
                style={{ background: `linear-gradient(135deg, ${meta.gradientFrom}, ${meta.gradientTo})` }}
              >
                <Upload size={14} /> Select a file to continue
              </button>
            )}

            {step === "mapping" && (
              <button
                onClick={handleSubmit}
                disabled={validRowCount === 0 || (hasCategoryUnit && !allMappingsDone)}
                title={hasCategoryUnit && !allMappingsDone ? "Resolve all category & unit mappings first" : ""}
                className="h-9 px-5 rounded-lg text-white text-[12px] font-bold flex items-center gap-1.5 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(135deg, ${meta.gradientFrom}, ${meta.gradientTo})` }}
              >
                <Upload size={14} />
                {hasCategoryUnit && !allMappingsDone
                  ? `Resolve ${unmatchedCategories.length + unmatchedUnits.length} mapping(s)`
                  : `Import ${validRowCount} ${meta.label}`}
              </button>
            )}

            {step === "result" && (
              <button
                onClick={onClose}
                className="h-9 px-5 rounded-lg text-white text-[12px] font-bold flex items-center gap-1.5 hover:opacity-90 transition-all"
                style={{ background: `linear-gradient(135deg, ${meta.gradientFrom}, ${meta.gradientTo})` }}
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0px); }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default ExcelImportModal;
