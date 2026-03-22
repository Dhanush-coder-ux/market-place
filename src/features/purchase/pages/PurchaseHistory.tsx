
import { useState } from "react";
import {
  Search,
  Calendar,
  Building2,
  Package,
  ChevronRight,
  ReceiptText,
  SlidersHorizontal,
  LayoutGrid,
  List,
  AlignJustify,
} from "lucide-react";
import DirectHeader from "../components/DirectHeader";
import { FloatingFormCard } from "@/components/common/FloatingFormCard"


/* ================= TYPES ================= */
export interface ProductItem {
  name: string;
  quantity: number;
}

export type PurchaseType = "Purchase" | "PO Purchase" | "Production";

export interface DirectPurchaseData {
  id: string;
  poNumber: string;
  date: string;
  time: string;
  vendor: string;
  products: ProductItem[];
  total_cost: number;
  purchaseType: PurchaseType; // Added new field
}

type ViewMode = "grid" | "horizontal" | "vertical";

/* ================= MOCK DATA ================= */
export const MOCK_DIRECT_PURCHASES: DirectPurchaseData[] = [
  {
    id: "po-1",
    poNumber: "PO-2024-001",
    date: "April 20, 2024",
    time: "4:20 PM",
    vendor: "Global Tech",
    products: [
      { name: "Wireless Headphones", quantity: 10 },
      { name: "USB-C Cables", quantity: 50 },
    ],
    total_cost: 1300,
    purchaseType: "Purchase",
  },
  {
    id: "po-2",
    poNumber: "PO-2024-002",
    date: "April 21, 2024",
    time: "10:15 AM",
    vendor: "Mainstream Inc",
    products: [
      { name: "Mechanical Keyboard", quantity: 5 },
      { name: "Ergonomic Mouse", quantity: 5 },
      { name: "27-inch Monitor", quantity: 2 },
      { name: "Docking Station", quantity: 10 },
      { name: "Laptop Stand", quantity: 5 },
      { name: "Webcam 1080p", quantity: 8 },
      { name: "Noise Cancelling Mic", quantity: 3 },
    ],
    total_cost: 45000,
    purchaseType: "PO Purchase",
  },
  {
    id: "po-3",
    poNumber: "PO-2024-003",
    date: "April 22, 2024",
    time: "09:00 AM",
    vendor: "Apex Wholesale",
    products: [{ name: "Ergonomic Chairs", quantity: 12 }],
    total_cost: 3200,
    purchaseType: "Production",
  },
];

/* ================= SCOPED STYLES ================= */
const STYLES = `
  .po-scrollbar::-webkit-scrollbar { width: 3px; }
  .po-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .po-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
  .po-scrollbar::-webkit-scrollbar-thumb:hover { background: #a1a1aa; }

  .po-scrollbar-h::-webkit-scrollbar { height: 3px; }
  .po-scrollbar-h::-webkit-scrollbar-track { background: transparent; }
  .po-scrollbar-h::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
  .po-scrollbar-h::-webkit-scrollbar-thumb:hover { background: #a1a1aa; }

  .po-card {
    transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  }
  .po-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px -4px rgba(0,0,0,0.08), 0 2px 8px -2px rgba(0,0,0,0.04);
    border-color: #bfdbfe;
  }
  .po-card-flat {
    transition: box-shadow 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
  }
  .po-card-flat:hover {
    box-shadow: 0 2px 8px -2px rgba(0,0,0,0.06);
    border-color: #bfdbfe;
    background-color: #fafbff;
  }
  .po-row:hover { background-color: #fafbff; }
  .po-arrow { transition: transform 0.2s ease, color 0.2s ease; }
  .po-card:hover .po-arrow,
  .po-card-flat:hover .po-arrow,
  .po-row:hover .po-arrow { transform: translateX(2px); color: #2563eb; }
  .po-footer { transition: background-color 0.2s ease; }
  .po-card:hover .po-footer { background-color: #f8faff; }
`;

/* ================= SHARED HELPERS ================= */
const fmt = (n: number) => `$${n.toLocaleString()}`;

const ProductPill = ({ name, qty }: { name: string; qty: number }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-full whitespace-nowrap">
    {name}
    <span className="text-zinc-400 font-semibold tabular-nums">×{qty}</span>
  </span>
);

const ArrowBtn = () => (
  <div className="w-7 h-7 rounded-full border border-zinc-200 bg-white flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50 transition-all shadow-sm shrink-0">
    <ChevronRight size={14} className="po-arrow text-zinc-400" />
  </div>
);

const PurchaseTypeBadge = ({ type }: { type: PurchaseType }) => {
  let colors = "bg-zinc-100 text-zinc-600 border-zinc-200"; // Fallback
  
  if (type === "Purchase") colors = "bg-blue-50 text-blue-700 border-blue-100";
  if (type === "PO Purchase") colors = "bg-purple-50 text-purple-700 border-purple-100";
  if (type === "Production") colors = "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${colors}`}>
      {type}
    </span>
  );
};

/* ================= GRID CARD ================= */
const GridCard = ({ po, onClick }: { po: DirectPurchaseData; onClick: () => void }) => {
  const totalQty = po.products.reduce((s, i) => s + i.quantity, 0);
  return (
    <div
      onClick={onClick}
      className="po-card group bg-white rounded-xl border border-zinc-200 shadow-sm cursor-pointer flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
            <ReceiptText size={14} className="text-blue-600" />
          </div>
          <span className="text-sm font-semibold text-zinc-800 tracking-tight">{po.poNumber}</span>
          <PurchaseTypeBadge type={po.purchaseType} />
        </div>
        <span className="shrink-0 text-xs font-medium text-zinc-400 bg-white border border-zinc-200 px-2.5 py-0.5 rounded-full">
          {po.products.length} item{po.products.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 px-5 py-4 border-b border-zinc-100">
        <div className="flex items-start gap-2.5">
          <Building2 size={14} className="text-zinc-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">Vendor</p>
            <p className="text-sm font-medium text-zinc-700 truncate">{po.vendor}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Calendar size={14} className="text-zinc-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">Date</p>
            <p className="text-sm font-medium text-zinc-700">{po.date}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">{po.time}</p>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="px-5 py-4 flex-grow flex flex-col">
        <div className="flex items-center gap-1.5 mb-3">
          <Package size={13} className="text-zinc-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Products Ordered</span>
        </div>
        <div className="po-scrollbar max-h-[7.5rem] overflow-y-auto space-y-1.5 pr-1">
          {po.products.map((p, idx) => (
            <div key={idx} className="flex items-center justify-between py-0.5 text-sm">
              <span className="text-zinc-600 truncate pr-3 group-hover:text-zinc-800 transition-colors">{p.name}</span>
              <span className="shrink-0 text-xs font-semibold text-zinc-500 tabular-nums bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-md">
                ×{p.quantity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="po-footer px-5 py-4 border-t border-zinc-100 bg-zinc-50/60 flex items-center justify-between gap-4 mt-auto">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">Total Amount</p>
          <p className="text-xl font-semibold text-zinc-900 tracking-tight tabular-nums">{fmt(po.total_cost)}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">Qty</p>
            <p className="text-sm font-semibold text-zinc-700 tabular-nums">{totalQty}</p>
          </div>
          <div className="w-8 h-8 rounded-full border border-zinc-200 bg-white flex items-center justify-center shadow-sm group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
            <ChevronRight size={15} className="po-arrow text-zinc-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= HORIZONTAL CARD ================= */
const HorizontalCard = ({ po, onClick }: { po: DirectPurchaseData; onClick: () => void }) => {
  const totalQty = po.products.reduce((s, i) => s + i.quantity, 0);
  return (
    <div
      onClick={onClick}
      className="po-card-flat group bg-white rounded-xl border border-zinc-200 shadow-sm cursor-pointer overflow-hidden"
    >
      <div className="flex flex-wrap md:flex-nowrap items-center gap-4 px-5 py-4 border-b border-zinc-100">
        {/* PO icon + number + badge */}
        <div className="flex items-center gap-3 w-full md:w-auto md:min-w-[14rem] shrink-0">
          <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
            <ReceiptText size={14} className="text-blue-600" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 min-w-0">
            <span className="text-sm font-semibold text-zinc-800 truncate">{po.poNumber}</span>
            <PurchaseTypeBadge type={po.purchaseType} />
          </div>
        </div>

        <div className="hidden md:block h-8 w-px bg-zinc-100 shrink-0" />

        {/* Vendor */}
        <div className="flex items-center gap-2 w-36 shrink-0">
          <Building2 size={13} className="text-zinc-400 shrink-0" />
          <span className="text-sm font-medium text-zinc-700 truncate">{po.vendor}</span>
        </div>

        <div className="hidden md:block h-8 w-px bg-zinc-100 shrink-0" />

        {/* Date */}
        <div className="flex items-center gap-2 w-44 shrink-0">
          <Calendar size={13} className="text-zinc-400 shrink-0" />
          <div>
            <span className="text-sm text-zinc-600">{po.date}</span>
            <span className="text-xs text-zinc-400 ml-2">{po.time}</span>
          </div>
        </div>

        <div className="hidden lg:block h-8 w-px bg-zinc-100 shrink-0" />

        {/* Items + qty */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <Package size={13} className="text-zinc-400" />
            <span className="text-xs text-zinc-500">{po.products.length} types</span>
          </div>
          <span className="text-zinc-300">·</span>
          <span className="text-xs text-zinc-500 tabular-nums">{totalQty} units</span>
        </div>

        <div className="flex-1" />

        {/* Total */}
        <div className="shrink-0 text-right mr-2 ml-auto md:ml-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">Total</p>
          <p className="text-base font-semibold text-zinc-900 tabular-nums tracking-tight">{fmt(po.total_cost)}</p>
        </div>

        <ArrowBtn />
      </div>

      {/* Scrollable product pills */}
      <div className="po-scrollbar-h flex items-center gap-2 px-5 py-3 overflow-x-auto bg-zinc-50/40">
        {po.products.map((p, idx) => (
          <ProductPill key={idx} name={p.name} qty={p.quantity} />
        ))}
      </div>
    </div>
  );
};

/* ================= VERTICAL ROW ================= */
const VerticalCard = ({ po, onClick }: { po: DirectPurchaseData; onClick: () => void }) => {
  const totalQty = po.products.reduce((s, i) => s + i.quantity, 0);
  return (
    <div
      onClick={onClick}
      className="po-row group flex items-center gap-5 px-5 py-4 cursor-pointer transition-colors"
    >
      {/* Icon */}
      <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
        <ReceiptText size={14} className="text-blue-600" />
      </div>

      {/* PO + vendor + badge */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-zinc-800">{po.poNumber}</p>
          <PurchaseTypeBadge type={po.purchaseType} />
        </div>
        <div className="flex items-center gap-2.5 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Building2 size={11} className="text-zinc-400" /> {po.vendor}
          </span>
          <span className="text-zinc-300">·</span>
          <span className="flex items-center gap-1">
            <Calendar size={11} className="text-zinc-400" /> {po.date}
          </span>
        </div>
      </div>

      {/* Product pills (desktop) */}
      <div className="hidden lg:flex flex-wrap gap-1.5 max-w-sm">
        {po.products.slice(0, 3).map((p, idx) => (
          <ProductPill key={idx} name={p.name} qty={p.quantity} />
        ))}
        {po.products.length > 3 && (
          <span className="text-xs font-medium text-zinc-400 bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-full">
            +{po.products.length - 3} more
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="shrink-0 flex items-center gap-6">
        <div className="hidden sm:block text-right">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Qty</p>
          <p className="text-sm font-semibold text-zinc-700 tabular-nums">{totalQty}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Total</p>
          <p className="text-sm font-semibold text-zinc-900 tabular-nums">{fmt(po.total_cost)}</p>
        </div>
        <ArrowBtn />
      </div>
    </div>
  );
};

/* ================= VIEW TOGGLE ================= */
const ViewToggle = ({
  current,
  onChange,
}: {
  current: ViewMode;
  onChange: (v: ViewMode) => void;
}) => {
  const options: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: "grid",       icon: <LayoutGrid size={14} />,   label: "Grid view" },
    { mode: "horizontal", icon: <AlignJustify size={14} />, label: "Horizontal view" },
    { mode: "vertical",   icon: <List size={14} />,         label: "Vertical view" },
  ];

  return (
    <div className="inline-flex items-center bg-zinc-100 rounded-lg p-0.5 gap-0.5">
      {options.map(({ mode, icon, label }) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          title={label}
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

/* ================= MAIN COMPONENT ================= */
const PurchaseHistory = () => {

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedPO, setSelectedPO] = useState<DirectPurchaseData | null>(null);

const handleCardClick = (po: DirectPurchaseData) => {
    setSelectedPO(po);
  };

  const filtered = MOCK_DIRECT_PURCHASES.filter(
    (po) =>
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <style>{STYLES}</style>

      <div className="space-y-6 pb-12">
        <DirectHeader />

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
            <input
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm"
              placeholder="Search PO number or vendor…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm whitespace-nowrap">
            <SlidersHorizontal size={14} className="text-zinc-400" />
            Filters
          </button>

          {searchTerm && (
            <span className="self-center text-xs text-zinc-400 font-medium px-3 py-1 bg-zinc-100 rounded-full whitespace-nowrap">
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
            </span>
          )}

          <div className="flex-1" />

          <ViewToggle current={viewMode} onChange={setViewMode} />
        </div>

        {/* ── Content ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <ReceiptText size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No purchase orders found</p>
            <p className="text-xs mt-1">Try adjusting your search term</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((po) => (
              <GridCard key={po.id} po={po} onClick={() => handleCardClick(po)} />
            ))}
          </div>
        ) : viewMode === "horizontal" ? (
          <div className="flex flex-col gap-3">
            {filtered.map((po) => (
              <HorizontalCard key={po.id} po={po} onClick={() => handleCardClick(po)} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden divide-y divide-zinc-100">
            {filtered.map((po) => (
              <VerticalCard key={po.id} po={po} onClick={() => handleCardClick(po)} />
            ))}
          </div>
        )}
      </div>
      <FloatingFormCard
        isOpen={!!selectedPO} // Opens if selectedPO is not null
        onClose={() => setSelectedPO(null)} // Closes and clears state
        title={selectedPO ? `Purchase Details: ${selectedPO.poNumber}` : "Details"}
        maxWidth="max-w-2xl"
      >
        {selectedPO && (
          <div className="space-y-6">
            
            {/* Meta Information Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Vendor</p>
                <p className="text-sm font-semibold text-zinc-800">{selectedPO.vendor}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Date</p>
                <p className="text-sm font-semibold text-zinc-800">{selectedPO.date}</p>
                <p className="text-[10px] text-zinc-500">{selectedPO.time}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Type</p>
                {/* Reusing your beautiful badge here! */}
                <PurchaseTypeBadge type={selectedPO.purchaseType} /> 
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Cost</p>
                <p className="text-lg font-bold text-blue-600">${selectedPO.total_cost.toLocaleString()}</p>
              </div>
            </div>

            {/* Products List */}
            <div>
              <div className="flex items-center gap-2 mb-3 border-b border-zinc-100 pb-2">
                <Package size={16} className="text-zinc-400" />
                <h3 className="text-sm font-bold text-zinc-800">Products Ordered</h3>
                <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full ml-auto">
                  {selectedPO.products.reduce((s, i) => s + i.quantity, 0)} Total Units
                </span>
              </div>
              
              <div className="space-y-2">
                {selectedPO.products.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                    <span className="text-sm font-medium text-zinc-700">{product.name}</span>
                    <span className="text-sm font-bold text-zinc-600 bg-white px-3 py-1 rounded-md border border-zinc-200 shadow-sm">
                      x{product.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons (Optional) */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
              <button 
                onClick={() => setSelectedPO(null)}
                className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm rounded-lg transition-colors">
                Print Invoice
              </button>
            </div>
            
          </div>
        )}
      </FloatingFormCard>
    </>
  );
};

export default PurchaseHistory;