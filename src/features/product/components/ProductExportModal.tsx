import React, { useState } from "react";
import { X, FileSpreadsheet, FileText, Download, CheckCircle2, Loader2, Layers, Filter } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { inventoryApi, ProductExportPayload } from "@/services/api/inventory";
import { getShopId, SHOP_ID } from "@/services/endpoints";

export interface ProductExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalProductsCount: number;
  visibleProductsCount: number;
  visibleProductIds?: string[];
  activeFilters: {
    search?: string;
    category?: string;
    brand?: string;
    status?: string;
    tracking?: string;
    stockStatus?: string;
    fromDate?: string;
    toDate?: string;
  };
  availableCategories?: string[];
}

type ExportFormat = "xlsx" | "csv";
type ExportScope = "all" | "visible" | "custom";

export const ProductExportModal: React.FC<ProductExportModalProps> = ({
  isOpen,
  onClose,
  totalProductsCount,
  visibleProductsCount,
  visibleProductIds = [],
  activeFilters,
}) => {
  const { showToast } = useToast();
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [scope, setScope] = useState<ExportScope>("all");
  const [fromRecord, setFromRecord] = useState<number>(1);
  const [toRecord, setToRecord] = useState<number>(Math.min(totalProductsCount || 1000, 1000));
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const activeShopId = getShopId() || localStorage.getItem("shop_id") || SHOP_ID || "";
      if (!activeShopId) {
        showToast("Active Shop ID is missing", "error");
        setIsExporting(false);
        return;
      }

      const payload: ProductExportPayload = {
        shop_id: activeShopId,
        format,
        query: activeFilters.search ? activeFilters.search.trim() : undefined,
        from_date: activeFilters.fromDate || undefined,
        to_date: activeFilters.toDate || undefined,
        category_id: activeFilters.category && activeFilters.category !== "All" ? activeFilters.category : undefined,
        stock_status: activeFilters.stockStatus && activeFilters.stockStatus !== "All" ? activeFilters.stockStatus : undefined,
      };

      if (activeFilters.status === "Active") payload.is_active = true;
      else if (activeFilters.status === "Inactive") payload.is_active = false;

      if (activeFilters.tracking === "Tracking") payload.have_tracking = true;
      else if (activeFilters.tracking === "Non-Tracking") payload.have_tracking = false;

      if (scope === "visible" && visibleProductIds.length > 0) {
        payload.product_ids = visibleProductIds;
      } else if (scope === "custom") {
        payload.from_record = Math.max(1, fromRecord);
        payload.to_record = Math.max(fromRecord, toRecord);
      } else {
        // "all" matching
        payload.from_record = 1;
        payload.to_record = Math.max(totalProductsCount || 5000, 5000);
      }

      // Backend-generated file download
      const { blob, filename } = await inventoryApi.downloadProductExport(payload);

      if (!blob || blob.size === 0) {
        throw new Error("Received empty export file from server");
      }

      // Trigger download in browser
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const defaultFilename = `products_${activeShopId}_${new Date().toISOString().slice(0, 10)}.${format}`;
      a.download = filename || defaultFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      showToast(`Products successfully exported as ${format.toUpperCase()}`, "success");
      onClose();
    } catch (err: any) {
      console.error("Product export error:", err);
      showToast(err?.message || "Failed to export products from backend", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const hasActiveFilters = Boolean(
    activeFilters.search ||
    (activeFilters.category && activeFilters.category !== "All") ||
    (activeFilters.brand && activeFilters.brand !== "All") ||
    (activeFilters.status && activeFilters.status !== "All") ||
    (activeFilters.tracking && activeFilters.tracking !== "All") ||
    activeFilters.fromDate ||
    activeFilters.toDate
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-all transform animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/60">
              <Download size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Export Products</h3>
              <p className="text-xs text-slate-500 font-medium">Download product catalog generated directly by backend</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              File Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("xlsx")}
                className={`p-3.5 rounded-xl border flex flex-col gap-1.5 text-left transition-all relative ${
                  format === "xlsx"
                    ? "border-emerald-500 bg-emerald-50/40 text-emerald-950 shadow-sm ring-1 ring-emerald-500"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className={format === "xlsx" ? "text-emerald-600" : "text-slate-400"} size={18} />
                    <span className="font-bold text-xs">Excel Spreadsheet</span>
                  </div>
                  {format === "xlsx" && <CheckCircle2 size={16} className="text-emerald-600" />}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">.xlsx format with structured styling & headers</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`p-3.5 rounded-xl border flex flex-col gap-1.5 text-left transition-all relative ${
                  format === "csv"
                    ? "border-blue-500 bg-blue-50/40 text-blue-950 shadow-sm ring-1 ring-blue-500"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <FileText className={format === "csv" ? "text-blue-600" : "text-slate-400"} size={18} />
                    <span className="font-bold text-xs">CSV File</span>
                  </div>
                  {format === "csv" && <CheckCircle2 size={16} className="text-blue-600" />}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">.csv lightweight format for general tools</span>
              </button>
            </div>
          </div>

          {/* Scope Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Export Scope
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScope("all")}
                className={`h-9 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  scope === "all"
                    ? "border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-xs"
                    : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                }`}
              >
                All Products ({totalProductsCount})
              </button>
              <button
                type="button"
                onClick={() => setScope("visible")}
                className={`h-9 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  scope === "visible"
                    ? "border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-xs"
                    : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                }`}
              >
                Visible ({visibleProductsCount})
              </button>
              <button
                type="button"
                onClick={() => setScope("custom")}
                className={`h-9 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  scope === "custom"
                    ? "border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-xs"
                    : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                }`}
              >
                Custom Range
              </button>
            </div>
          </div>

          {/* Custom Range Inputs */}
          {scope === "custom" && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in">
              <span className="text-xs font-semibold text-slate-700">Record Range (1-indexed)</span>
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium">From Record</span>
                  <input
                    type="number"
                    min={1}
                    value={fromRecord}
                    onChange={(e) => setFromRecord(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium">To Record</span>
                  <input
                    type="number"
                    min={fromRecord}
                    value={toRecord}
                    onChange={(e) => setToRecord(Math.max(fromRecord, parseInt(e.target.value) || fromRecord))}
                    className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Context */}
          {hasActiveFilters && (
            <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-blue-700">
                <Filter size={13} />
                <span className="text-xs font-bold">Applied Filter Constraints:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeFilters.search && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white text-blue-800 border border-blue-200">
                    Search: "{activeFilters.search}"
                  </span>
                )}
                {activeFilters.category && activeFilters.category !== "All" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white text-blue-800 border border-blue-200">
                    Category: {activeFilters.category}
                  </span>
                )}
                {activeFilters.brand && activeFilters.brand !== "All" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white text-blue-800 border border-blue-200">
                    Brand: {activeFilters.brand}
                  </span>
                )}
                {activeFilters.status && activeFilters.status !== "All" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white text-blue-800 border border-blue-200">
                    Status: {activeFilters.status}
                  </span>
                )}
                {activeFilters.tracking && activeFilters.tracking !== "All" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white text-blue-800 border border-blue-200">
                    Tracking: {activeFilters.tracking}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Information box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-slate-600">
            <Layers size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-slate-700">Included Fields: </span>
              Product Name, SKU, Barcode, Category, Brand, Unit, Sell Price, MRP, Buy Price, Cost to Make, GST Rate, Current Stock, Physical Stock, Reserved Stock, Reorder Point, Variants/Batches/Serial Flags, and Status.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="h-9 px-4 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="h-9 px-5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-sm flex items-center gap-2 disabled:opacity-60"
          >
            {isExporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Generating Export...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Export Products ({format.toUpperCase()})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductExportModal;
