import { Filter, Search, RotateCw, ReceiptText, Banknote, MoreVertical, RotateCcw } from "lucide-react";
import { useState } from "react";
import Table from "@/components/common/Table";
import { SupplierRecordPaymentModal } from "@/features/supplier/components/SupplierRecordPaymentModal";
import { PurchaseReturnDialog } from "@/features/purchase/pages/PurchaseDetail";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { SHOP_ID } from "@/services/endpoints";

interface PurchaseItem {
  id: number;
  date: string;
  supplier: string;
  invoice: string;
  cost: string;
  original: number;
  returned: number;
  net: number;
  paid: number;
  outstanding: number;
  status: string;
  statusColor: string;
}

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const PurchaseHistory = () => {
  const [historyFilter, setHistoryFilter] = useState("All Items");
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  /* ================= MOCK DATA ================= */
  const PURCHASE_DATA: PurchaseItem[] = [
    { id: 1, date: "April 20, 2024", supplier: "XYZ Wholesalers", invoice: "INV-004", cost: "1,300", original: 1300, returned: 0, net: 1300, paid: 1300, outstanding: 0, status: "Paid", statusColor: "bg-emerald-50 text-emerald-600" },
    { id: 2, date: "Mar 15, 2024", supplier: "ABC Traders", invoice: "INV-003", cost: "1,100", original: 1100, returned: 0, net: 1100, paid: 1100, outstanding: 0, status: "Paid", statusColor: "bg-amber-50 text-amber-600" },
    { id: 3, date: "Feb 10, 2024", supplier: "ABC Traders", invoice: "INV-002", cost: "2,400", original: 2400, returned: 0, net: 2400, paid: 0, outstanding: 2400, status: "Due", statusColor: "bg-emerald-50 text-emerald-600" },
    { id: 4, date: "Jan 12, 2024", supplier: "ABC Traders", invoice: "INV-001", cost: "1,000", original: 1000, returned: 100, net: 900, paid: 900, outstanding: 0, status: "Paid", statusColor: "bg-amber-50 text-amber-600" },
  ];

  const [activePurchase, setActivePurchase] = useState<PurchaseItem>(PURCHASE_DATA[3]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [returnPurchase, setReturnPurchase] = useState<PurchaseItem | null>(null);

  /* ================= COLUMNS DEFINITION ================= */
  const PURCHASE_COLUMNS = [
    {
      key: "date",
      label: "Date",
      render: (value: string) => (
        <span className="text-sm text-slate-600 font-medium">{value}</span>
      ),
    },
    {
      key: "supplier",
      label: "Supplier",
      render: (value: string) => (
        <span className="text-sm text-slate-800 font-bold">{value}</span>
      ),
    },
    {
      key: "invoice",
      label: "Invoice No.",
      render: (value: string) => (
        <span className="text-sm text-slate-500 font-mono">{value}</span>
      ),
    },
    {
      key: "cost",
      label: "Total Cost",
      render: (_value: string, row: PurchaseItem) => {
        if (row.returned > 0) {
          return (
            <div className="relative group inline-flex items-center gap-1.5 cursor-help">
              <span className="text-sm text-slate-900 font-bold tabular-nums">
                {fmt(row.net)}
              </span>

              <div className="w-3.5 h-3.5 rounded-full bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center shrink-0">
                <RotateCw size={8} />
              </div>

              {/* Dark Tooltip */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 rounded-lg shadow-xl border border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] text-left flex flex-col p-3 pointer-events-none">
                <div className="flex justify-between items-center text-xs font-medium text-slate-400 mb-1">
                  <span>Original</span>
                  <span className="tabular-nums font-mono">{fmt(row.original)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-medium text-rose-400 mb-1.5">
                  <span>Returned</span>
                  <span className="tabular-nums font-mono">- {fmt(row.returned)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-white border-t border-slate-700 pt-2 mt-0.5">
                  <span>Net</span>
                  <span className="tabular-nums font-mono">{fmt(row.net)}</span>
                </div>
              </div>
            </div>
          );
        }
        return <span className="text-sm text-slate-900 font-bold">₹{row.cost}</span>;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value: string, row: any) => (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${row.statusColor}`}>
          {value}
        </span>
      ),
    },
    {
      key: "id",
      label: "Action",
      render: (_value: any, row: PurchaseItem) => (
        <div className="flex items-center justify-end gap-2">
          {row.outstanding > 0 && (
            <button
              onClick={() => {
                setActivePurchase(row);
                setShowPaymentModal(true);
              }}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
            >
              <Banknote size={13} />
              Record Payment
            </button>
          )}
          <button
            onClick={() => setActivePurchase(row)}
            className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700 transition-all active:scale-95"
          >
            View Details
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors outline-none cursor-pointer"
                title="More actions"
              >
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-left font-sans">
              <DropdownMenuItem
                onClick={() => {
                  setActivePurchase(row);
                  setReturnPurchase(row);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
              >
                <RotateCcw size={13} className="text-rose-600" />
                Return Purchase
              </DropdownMenuItem>
              {row.outstanding > 0 && (
                <DropdownMenuItem
                  onClick={() => {
                    setActivePurchase(row);
                    setShowPaymentModal(true);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
                >
                  <Banknote size={13} className="text-emerald-600" />
                  Record Payment
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const handleSelectionChange = (ids: (string | number)[]) => {
    setSelectedIds(ids);
    if (ids.length > 0) {
      const found = PURCHASE_DATA.find((p) => p.id === ids[ids.length - 1]);
      if (found) setActivePurchase(found);
    }
  };

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Table Card */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200/60 shadow-xl overflow-hidden">
          {/* Table Header / Search Area */}
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by invoice, supplier or date..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                <Filter size={16} /> Filter
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-4 border-b border-slate-100">
              {["All Items", "Low Stock", "Out of Stock"].map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={`pb-3 text-sm font-bold transition-all px-2 ${
                    historyFilter === f
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Reusable Table Component */}
          <Table
            columns={PURCHASE_COLUMNS}
            data={PURCHASE_DATA}
            rowKey="id"
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
          />

          {/* Pagination Footer */}
          <div className="p-6 flex items-center justify-between border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs font-bold text-slate-400 tracking-tighter">
              Showing 1 to {PURCHASE_DATA.length} of {PURCHASE_DATA.length} entries
            </p>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-600">Prev</button>
              <button className="w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-100">1</button>
              <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-600">Next</button>
            </div>
          </div>
        </div>

        {/* Payment Summary Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xl overflow-hidden sticky top-6">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <ReceiptText size={16} />
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                Payment Summary
              </h3>
            </div>
            <span className="text-[11px] font-mono font-semibold text-slate-500">
              {activePurchase.invoice}
            </span>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Status</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${activePurchase.statusColor}`}>
                {activePurchase.status}
              </span>
            </div>

            {/* Calculation Breakdown: Original, Returned, Net */}
            {activePurchase.returned > 0 ? (
              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/70 space-y-2.5">
                <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                  <span>Original</span>
                  <span className="tabular-nums font-mono text-slate-700">{fmt(activePurchase.original)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-rose-600">
                  <span>Returned</span>
                  <span className="tabular-nums font-mono">- {fmt(activePurchase.returned)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-900 border-t border-slate-200 pt-2 mt-0.5">
                  <span>Net</span>
                  <span className="tabular-nums font-mono text-slate-900">{fmt(activePurchase.net)}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                <span>Total Amount</span>
                <span className="tabular-nums font-mono font-bold text-slate-800">{fmt(activePurchase.original)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm font-semibold text-slate-600 pt-1">
              <span>Paid Amount</span>
              <span className="tabular-nums text-slate-800">{fmt(activePurchase.paid)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold pt-2.5 border-t border-slate-100">
              <span className="text-slate-600">Outstanding</span>
              <span className={`tabular-nums ${activePurchase.outstanding > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {fmt(activePurchase.outstanding)}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReturnPurchase(activePurchase)}
                className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RotateCcw size={13} className="text-rose-600" />
                Return Purchase
              </button>
              {activePurchase.outstanding > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Banknote size={14} />
                  Record Payment
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Record Payment Modal */}
      <SupplierRecordPaymentModal
        show={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        supplierId={String(activePurchase.id)}
        supplierName={activePurchase.supplier}
        initialPurchaseId={`INV-00${activePurchase.id}`}
        initialPurchase={{
          id: String(activePurchase.id),
          invoice_no: activePurchase.invoice,
          outstanding_amount: activePurchase.outstanding,
          outstanding: activePurchase.outstanding,
          total_cost: activePurchase.net,
        }}
        onSuccess={() => {
          setActivePurchase((prev) => ({
            ...prev,
            outstanding: 0,
            paid: prev.net,
            status: "Paid",
            statusColor: "bg-emerald-50 text-emerald-600",
          }));
        }}
      />

      {/* Return Purchase Dialog */}
      {returnPurchase && (
        <PurchaseReturnDialog
          isOpen={!!returnPurchase}
          onClose={() => setReturnPurchase(null)}
          onSuccess={() => {
            setReturnPurchase(null);
          }}
          purchaseId={String(returnPurchase.id)}
          shopId={localStorage.getItem("shop_id") || SHOP_ID}
          outstanding={returnPurchase.outstanding}
        />
      )}
    </div>
  );
};

export default PurchaseHistory;
