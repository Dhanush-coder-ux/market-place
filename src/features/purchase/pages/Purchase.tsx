import { useState, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Filter, Search, X, ExternalLink, ChevronRight, ReceiptText } from "lucide-react";

import Table from "@/components/common/Table";
import PurchaseHeader from "@/features/purchase/components/PurchaseHeader";
import Loader from "@/components/common/Loader";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import type { PurchaseRecord } from "@/types/api";
import { useHeader } from "@/context/HeaderContext";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: PurchaseRecord) => ReactNode;
}

const PURCHASE_COLUMNS: Column[] = [
  {
    key: "date",
    label: "Purchase Date",
    render: (_, row) => (
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-700">
          {String(row.datas?.purchase_date ?? row.date ?? "—")}
        </span>
        <span className="text-[10px] text-slate-400 font-medium">{row.type}</span>
      </div>
    ),
  },
  {
    key: "supplier",
    label: "Supplier",
    render: (_, row) => (
      <span className="text-sm text-slate-600">{String(row.datas?.supplier ?? row.datas?.supplier_name ?? "—")}</span>
    ),
  },
  {
    key: "products",
    label: "Products",
    render: (_, row) => {
      const products = row.datas?.purchase_products as any[] | undefined;
      const first = products?.[0];
      const extra = (products?.length ?? 0) - 1;
      return (
        <div className="flex flex-col items-start">
          <span className="text-sm text-slate-700 font-medium">
            {first ? String(first.product_name ?? first.name ?? "Item") : "—"}
          </span>
          {extra > 0 && (
            <span className="mt-1 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-md">
              +{extra} more items
            </span>
          )}
        </div>
      );
    },
  },
  {
    key: "total_cost",
    label: "Total Cost",
    render: (_, row) => (
      <span className="text-sm text-slate-900 font-bold">
        ₹{Number(row.datas?.total_cost ?? row.datas?.grand_total ?? 0).toLocaleString()}
      </span>
    ),
  },
  {
    key: "id",
    label: "Reference",
    render: (_, row) => (
      <span className="text-xs font-mono text-slate-500">{row.ui_id || row.id.slice(0, 8)}</span>
    ),
  },
  {
    key: "actions",
    label: "",
    render: () => (
      <div className="flex justify-end">
        <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
      </div>
    ),
  },
];

const PurchaseHistoryTab = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCleanMode = new URLSearchParams(location.search).get("mode") === "clean";

  const handleOpenNewTab = () => {
    window.open(`${window.location.pathname}?mode=clean`, "_blank", "noopener,noreferrer");
  };

  const { setActions, setBottomActions } = useHeader();
  const { getData, loading, error, clearError } = useApi();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey] = useState(0);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRecord | null>(null);

  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const suppliersList = useMemo(() => Array.from(new Set(purchases.map(p => String(p.datas?.supplier ?? p.datas?.supplier_name ?? "")))).filter(Boolean), [purchases]);
  const activeFiltersCount = [filterSupplier, filterDate].filter(Boolean).length;

  const resetFilters = () => {
    setFilterSupplier("");
    setFilterDate("");
  };

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        {!isCleanMode && (
          <button
            onClick={handleOpenNewTab}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-sm shrink-0"
            title="Open in New Tab"
          >
            <ExternalLink size={13} />
          </button>
        )}
        <GradientButton path="/purchase/add" className="h-8 flex items-center px-4 text-[12px] rounded-md">
          + Add Purchase
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, isCleanMode]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const matchesSupplier = !filterSupplier || String(p.datas?.supplier ?? p.datas?.supplier_name ?? "") === filterSupplier;
      const matchesDate = !filterDate || String(p.datas?.purchase_date ?? p.date ?? "").includes(filterDate);
      return matchesSupplier && matchesDate;
    });
  }, [purchases, filterSupplier, filterDate]);

  useEffect(() => {
    const params: Record<string, string> = {
      view: "PURCHASE_VIEW",
      limit: "50",
      offset: "1",
    };
    if (searchTerm) params.q = searchTerm;
    getData(`${ENDPOINTS.PURCHASES}/by/shop/${SHOP_ID}`, params).then((res) => {
      if (res) setPurchases(Array.isArray(res.data) ? res.data : [res.data]);
    });
  }, [refreshKey, searchTerm]);

  useEffect(() => {
    if (selectedPurchase) {
      setBottomActions(
        <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
              <ReceiptText size={14} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-800 leading-tight">Reference: {selectedPurchase.ui_id || selectedPurchase.id.slice(0, 8)}</p>
              <p className="text-[10px] font-semibold text-slate-400 font-mono">
                {String(selectedPurchase.datas?.supplier ?? selectedPurchase.datas?.supplier_name ?? "—")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPurchase(null)}
              className="h-8 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-semibold text-[11px] transition-colors"
            >
              Deselect
            </button>
            <button
              onClick={() => navigate(`/purchase/detail/${selectedPurchase.id}`, { state: { po: selectedPurchase } })}
              className="h-8 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors flex items-center gap-1.5"
            >
              <ChevronRight size={13} />
              View Details
            </button>
          </div>
        </div>
      );
    } else {
      setBottomActions(null);
    }
  }, [selectedPurchase, setBottomActions, navigate]);

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-4 font-sans w-full overflow-hidden relative">
      {!isCleanMode && <PurchaseHeader />}

      {error && (
        <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          <span>{error}</span>
          <button onClick={clearError}><X size={14} /></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border border-slate-100 rounded-lg p-2.5 px-3.5 flex flex-nowrap items-center gap-2 shadow-sm overflow-x-auto scrollbar-none">
        <div className="relative w-56 shrink-0">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            className="w-full h-8 pl-8 pr-3 text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
            placeholder="Search by supplier or reference…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className={`h-8 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0 ${
            activeFiltersCount > 0
              ? "border-blue-200 text-blue-600 bg-blue-50/50"
              : "border-slate-200 text-slate-650 bg-white hover:bg-slate-50"
          }`}
          title="Filters"
        >
          <Filter size={13} />
          Filters
          {activeFiltersCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          )}
        </button>

        <div className="flex-1" />
      </div>

      <RightSidebarFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => {}}
        onClear={resetFilters}
        title="Purchase Invoice Filters"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Supplier</label>
            <ReusableSelect
              options={[
                { label: "All Suppliers", value: "" },
                ...suppliersList.map(supp => ({ label: supp, value: supp }))
              ]}
              value={filterSupplier}
              onValueChange={setFilterSupplier}
              placeholder="Supplier"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Purchase Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-750 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
            />
          </div>
        </div>
      </RightSidebarFilter>

      {/* Main table card */}
      <div className="bg-white border border-slate-100 rounded-lg shadow-sm min-w-0 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-auto pf-scroll">
          {loading ? (
            <div className="p-8"><Loader /></div>
          ) : (
            <Table
              columns={PURCHASE_COLUMNS}
              data={filteredPurchases}
              rowKey="id"
              selectedIds={selectedPurchase ? [selectedPurchase.id] : []}
              onRowClick={(row) => setSelectedPurchase(prev => prev?.id === row.id ? null : row)}
            />
          )}

          {!loading && filteredPurchases.length === 0 && !error && (
            <div className="text-center py-12 text-slate-500 text-sm">No direct purchases found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseHistoryTab;

