import { useState } from "react";
import {
  Eye,
  Search,
  SlidersHorizontal,
  Package,
  Calendar,
  Building2,
  FileText,
  LayoutGrid,
  List,
  ArrowRight,
} from "lucide-react";

import { FloatingFormCard } from "@/components/common/FloatingFormCard"
import GrnHeader from "../components/GrnHeader";
import Input from "@/components/ui/Input";

/* ================= TYPES ================= */
type GRNStatus = "Completed" | "Pending" | "Partial";
type ViewMode  = "grid" | "horizontal" | "vertical";

export interface ProductItem {
  name: string;
  quantity: number;
}

interface GRNRecord {
  id: string;
  poReference: string;
  supplier: string;
  date: string;
  itemsCount: number;
  totalValue: number;
  status: GRNStatus;
  products: ProductItem[];
}

/* ================= MOCK DATA ================= */
const INITIAL_DATA: GRNRecord[] = [
  {
    id: "1", poReference: "PO-9921", supplier: "Global Tech", date: "2024-03-10",
    itemsCount: 15, totalValue: 12500, status: "Partial",
    products: [
      { name: "Wireless Headphones", quantity: 10 },
      { name: "Bluetooth Speaker",   quantity: 5  },
    ],
  },
  {
    id: "2", poReference: "PO-9925", supplier: "Mainstream Inc", date: "2024-03-11",
    itemsCount: 15, totalValue: 4200, status: "Pending",
    products: [
      { name: "Mechanical Keyboard", quantity: 5 },
      { name: "Ergonomic Mouse",     quantity: 5 },
      { name: "Desk Mat (Large)",    quantity: 5 },
    ],
  },
  {
    id: "3", poReference: "PO-9928", supplier: "Apex Wholesale", date: "2024-03-12",
    itemsCount: 42, totalValue: 8900, status: "Pending",
    products: [
      { name: "USB-C Hub",    quantity: 20 },
      { name: "HDMI Cable 2m", quantity: 15 },
      { name: "Webcam 1080p", quantity: 5  },
      { name: "Monitor Arm",  quantity: 2  },
    ],
  },
];

/* ================= STATUS CONFIG ================= */
const STATUS_CONFIG: Record<GRNStatus, { dot: string; badge: string }> = {
  Completed: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Pending:   { dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200" },
  Partial:   { dot: "bg-blue-400",    badge: "bg-blue-50 text-blue-700 border-blue-200" },
};

/* ================= SCOPED STYLES ================= */
const STYLES = `
  /* thin scrollbar */
  .grn-scroll::-webkit-scrollbar { width: 3px; height: 3px; }
  .grn-scroll::-webkit-scrollbar-track { background: transparent; }
  .grn-scroll::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 4px; }
  .grn-scroll:hover::-webkit-scrollbar-thumb { background: #d4d4d8; }

  /* grid card */
  .grn-grid-card {
    transition: box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
  }
  .grn-grid-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px -4px rgba(0,0,0,0.08);
    border-color: #bfdbfe;
  }

  /* flat card (horiz / vert) */
  .grn-flat-card {
    transition: background-color 0.12s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .grn-flat-card:hover {
    background-color: #fafbff;
    border-color: #bfdbfe;
    box-shadow: 0 2px 8px -2px rgba(0,0,0,0.06);
  }

  /* vert row */
  .grn-vert-row { transition: background-color 0.1s ease; }
  .grn-vert-row:hover { background-color: #fafbff; }
  .grn-vert-row:hover .grn-row-actions { opacity: 1; }
  .grn-row-actions { opacity: 0; transition: opacity 0.15s ease; }
`;

/* ================= SHARED: STATIC STATUS BADGE ================= */
const StatusBadge = ({ value }: { value: GRNStatus }) => {
  const cfg = STATUS_CONFIG[value];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border select-none ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {value}
    </div>
  );
};

/* ================= SHARED: PRODUCT PILL ================= */
const ProductPill = ({ name, qty }: { name: string; qty: number }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-full whitespace-nowrap">
    {name}
    <span className="text-zinc-400 font-semibold tabular-nums">×{qty}</span>
  </span>
);

/* ================= SHARED: ACTION BUTTONS ================= */
const ActionBtns = ({ onClick, cls = "" }: { onClick?: () => void; cls?: string }) => (
  <div className={`flex items-center gap-1 ${cls}`}>
    <button 
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      title="View Details" 
      className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
    >
      <Eye size={15} />
    </button>
    <button 
      onClick={(e) => e.stopPropagation()}
      title="More Options" 
      className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 border border-transparent hover:border-zinc-200 transition-all"
    >
      <ArrowRight size={15} />
    </button>
  </div>
);

/* ================= VIEW TOGGLE ================= */
const ViewToggle = ({ current, onChange }: { current: ViewMode; onChange: (v: ViewMode) => void }) => {
  const opts = [
    { mode: "grid"       as ViewMode, icon: <LayoutGrid size={13} />,   label: "Grid" },
 
    { mode: "vertical"   as ViewMode, icon: <List size={13} />,         label: "Vertical" },
  ];
  return (
    <div className="inline-flex items-center bg-zinc-100 rounded-lg p-0.5 gap-0.5">
      {opts.map(({ mode, icon, label }) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          title={`${label} view`}
          className={`flex items-center justify-center w-8 h-8 rounded-md transition-all ${
            current === mode
              ? "bg-white shadow-sm text-blue-600 border border-zinc-200"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
};

/* ================= GRID CARD ================= */
const GridCard = ({
  row,
  onClick
}: {
  row: GRNRecord;
  onClick: () => void;
}) => (
  <div 
    onClick={onClick}
    className="grn-grid-card bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col group cursor-pointer"
  >
    {/* Header */}
    <div className="px-4 py-3.5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
          <FileText size={13} className="text-blue-600" />
        </div>
        <span className="text-sm font-semibold text-zinc-800 tracking-tight truncate">{row.poReference}</span>
      </div>
      <StatusBadge value={row.status} />
    </div>

    {/* Meta */}
    <div className="px-4 py-3.5 grid grid-cols-2 gap-3 border-b border-zinc-100">
      <div className="flex items-start gap-2">
        <Building2 size={13} className="text-zinc-400 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">Supplier</p>
          <p className="text-sm font-medium text-zinc-700 truncate">{row.supplier}</p>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Calendar size={13} className="text-zinc-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">Date</p>
          <p className="text-sm font-medium text-zinc-700">{row.date}</p>
        </div>
      </div>
    </div>

    {/* Products */}
    <div className="px-4 py-3.5 flex-1 bg-zinc-50/30">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Package size={13} className="text-zinc-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Products</span>
        </div>
        <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
          {row.products.length} types
        </span>
      </div>
      <div className="grn-scroll max-h-[90px] overflow-y-auto pr-1 space-y-2">
        {row.products.map((p, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-zinc-600 truncate pr-2">{p.name}</span>
            <span className="shrink-0 text-xs font-semibold text-zinc-500 tabular-nums bg-white border border-zinc-100 px-2 py-0.5 rounded-md shadow-sm">
              ×{p.quantity}
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* Footer */}
    <div className="px-4 py-3.5 border-t border-zinc-100 flex items-center justify-between bg-white mt-auto">
      <div className="flex gap-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">Total Value</p>
          <p className="text-base font-semibold text-zinc-900 tabular-nums">${row.totalValue.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">Total Qty</p>
          <p className="text-base font-semibold text-zinc-700 tabular-nums">{row.itemsCount}</p>
        </div>
      </div>
      <ActionBtns onClick={onClick} />
    </div>
  </div>
);



/* ================= VERTICAL TABLE VIEW ================= */
const VerticalTable = ({ data, onClick }: { data: GRNRecord[]; onClick: (row: GRNRecord) => void }) => {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-zinc-50/80 border-b border-zinc-200">
              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">PO Ref</th>
              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Supplier</th>
              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Date</th>
              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hidden md:table-cell">Products</th>
              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</th>
              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Total Qty</th>
              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Total Value</th>
              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 w-16 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.map((row) => (
              <tr
                key={row.id}
                onClick={() => onClick(row)}
                className="grn-vert-row group cursor-pointer transition-colors hover:bg-zinc-50/60"
              >
                {/* PO Ref */}
                <td className="px-5 py-4 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-800">{row.poReference}</span>
                  </div>
                </td>

                {/* Supplier */}
                <td className="px-5 py-4 align-middle">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                    <Building2 size={14} className="text-zinc-400 shrink-0" />
                    {row.supplier}
                  </div>
                </td>

                {/* Date */}
                <td className="px-5 py-4 align-middle">
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <Calendar size={14} className="text-zinc-400 shrink-0" />
                    {row.date}
                  </div>
                </td>

                {/* Products */}
                <td className="px-5 py-4 align-middle hidden md:table-cell max-w-[280px]">
                  <div className="flex flex-wrap gap-1.5">
                    {row.products.slice(0, 2).map((p, idx) => (
                      <ProductPill key={idx} name={p.name} qty={p.quantity} />
                    ))}
                    {row.products.length > 2 && (
                      <span className="inline-flex items-center text-xs font-medium text-zinc-500 bg-zinc-100/80 px-2.5 py-1 rounded-full whitespace-nowrap">
                        +{row.products.length - 2} more
                      </span>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-5 py-4 align-middle">
                  <StatusBadge value={row.status} />
                </td>

                {/* Quantity */}
                <td className="px-5 py-4 align-middle text-right">
                  <span className="text-sm font-semibold text-zinc-700 tabular-nums">
                    {row.itemsCount}
                  </span>
                </td>

                {/* Total */}
                <td className="px-5 py-4 align-middle text-right">
                  <span className="text-sm font-bold text-zinc-900 tabular-nums tracking-tight">
                    ${row.totalValue.toLocaleString()}
                  </span>
                </td>

                {/* Action */}
                <td className="px-5 py-4 align-middle text-right">
                  <div className=" flex justify-end">
                    <ActionBtns onClick={() => onClick(row)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
const GRNCardView = () => {
  const [records, setRecords]   = useState<GRNRecord[]>(INITIAL_DATA);
  const [search,  setSearch]    = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // State to handle modal visibility and data
  const [selectedGRN, setSelectedGRN] = useState<GRNRecord | null>(null);

  const handleCardClick = (record: GRNRecord) => {
    setSelectedGRN(record);
    setRecords([]);
  };

  const filtered = records.filter(
    (r) =>
      r.poReference.toLowerCase().includes(search.toLowerCase()) ||
      r.supplier.toLowerCase().includes(search.toLowerCase()) ||
      r.products.some((p) => p.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <style>{STYLES}</style>

      <div className="space-y-5 pb-12">
        <GrnHeader />

        {/* ── Toolbar ── */}
        <div className="bg-white px-4 py-3.5 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Input
            leftIcon={<Search size={14} className="text-zinc-400" />}
              placeholder="Search PO, supplier, product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm whitespace-nowrap">
            <SlidersHorizontal size={14} className="text-zinc-400" />
            Filters
          </button>

          {search && (
            <span className="self-center text-xs font-medium text-zinc-400 px-3 py-1 bg-zinc-100 rounded-full whitespace-nowrap">
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
            </span>
          )}

          <div className="flex-1" />

          {/* View toggle */}
          <ViewToggle current={viewMode} onChange={setViewMode} />
        </div>

        {/* ── Empty state ── */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center bg-white border border-dashed border-zinc-200 rounded-xl">
            <Search size={28} className="mx-auto mb-3 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-600">No records found</p>
            <p className="text-xs text-zinc-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === "grid" ? (

          /* ── GRID ── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((row) => (
              <GridCard key={row.id} row={row} onClick={() => handleCardClick(row)} />
            ))}
          </div>

        ) : (

          /* ── VERTICAL (TABLE) ── */
          <VerticalTable data={filtered} onClick={handleCardClick} />
          
        )}
      </div>

      {/* ── MODAL COMPONENT ── */}
      <FloatingFormCard
        isOpen={!!selectedGRN}
        onClose={() => setSelectedGRN(null)}
        title={selectedGRN ? `GRN Details: ${selectedGRN.poReference}` : "Details"}
        maxWidth="max-w-2xl"
      >
        {selectedGRN && (
          <div className="space-y-6">
            
            {/* Meta Information Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Supplier</p>
                <p className="text-sm font-semibold text-zinc-800">{selectedGRN.supplier}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Date</p>
                <p className="text-sm font-semibold text-zinc-800">{selectedGRN.date}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Status</p>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${STATUS_CONFIG[selectedGRN.status].badge}`}>
                   {selectedGRN.status}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Value</p>
                <p className="text-lg font-bold text-blue-600">${selectedGRN.totalValue.toLocaleString()}</p>
              </div>
            </div>

            {/* Products List */}
            <div>
              <div className="flex items-center gap-2 mb-3 border-b border-zinc-100 pb-2">
                <Package size={16} className="text-zinc-400" />
                <h3 className="heading-label text-zinc-800">Received Products</h3>
                <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full ml-auto">
                  {selectedGRN.itemsCount} Total Units
                </span>
              </div>
              
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 grn-scroll">
                {selectedGRN.products.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                    <span className="text-sm font-medium text-zinc-700">{product.name}</span>
                    <span className="text-sm font-bold text-zinc-600 bg-white px-3 py-1 rounded-md border border-zinc-200 shadow-sm">
                      x{product.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
              <button 
                onClick={() => setSelectedGRN(null)}
                className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm rounded-lg transition-colors">
                Process GRN
              </button>
            </div>
            
          </div>
        )}
      </FloatingFormCard>
    </>
  );
};

export default GRNCardView;