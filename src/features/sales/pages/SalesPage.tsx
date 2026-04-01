import { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  Eye,
  MoreHorizontal,
  TrendingUp,
  ShoppingCart,
  Wifi,
  WifiOff,
  ChevronDown,
  X,
  User,
  Calendar,
  CreditCard,
  Package,
  RotateCcw,
  Receipt,
} from "lucide-react";
import { StatCard } from "../../../components/common/StatsCard";

/* ═══════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════ */
type OriginType    = "Sales" | "Sales Return";
type SalesType     = "Online" | "Offline";
type PaymentMethod = "Cash" | "Card" | "UPI";
type SaleStatus    = "Completed" | "Pending" | "Cancelled";

interface SaleRecord {
  id: string;
  invoiceNumber: string;
  customerName: string;
  origin: OriginType;
  salesType: SalesType;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  itemsCount: number;
  date: string;
  status: SaleStatus;
}

/* ═══════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════ */
const MOCK_SALES: SaleRecord[] = [
  { id: "1",  invoiceNumber: "INV-2024-0041", customerName: "Arjun Mehta",       origin: "Sales",        salesType: "Online",  paymentMethod: "UPI",  totalAmount: 4850,  itemsCount: 3, date: "2024-04-22", status: "Completed"  },
  { id: "2",  invoiceNumber: "INV-2024-0042", customerName: "Walk-in Customer",  origin: "Sales",        salesType: "Offline", paymentMethod: "Cash", totalAmount: 1200,  itemsCount: 1, date: "2024-04-22", status: "Completed"  },
  { id: "3",  invoiceNumber: "INV-2024-0043", customerName: "Priya Nair",        origin: "Sales Return", salesType: "Online",  paymentMethod: "Card", totalAmount: 9300,  itemsCount: 5, date: "2024-04-21", status: "Pending"    },
  { id: "4",  invoiceNumber: "INV-2024-0044", customerName: "Walk-in Customer",  origin: "Sales",        salesType: "Offline", paymentMethod: "Cash", totalAmount: 650,   itemsCount: 2, date: "2024-04-21", status: "Completed"  },
  { id: "5",  invoiceNumber: "INV-2024-0045", customerName: "Rohan Sharma",      origin: "Sales Return", salesType: "Online",  paymentMethod: "UPI",  totalAmount: 2200,  itemsCount: 2, date: "2024-04-20", status: "Cancelled"  },
  { id: "6",  invoiceNumber: "INV-2024-0046", customerName: "Sneha Pillai",      origin: "Sales",        salesType: "Online",  paymentMethod: "Card", totalAmount: 15400, itemsCount: 8, date: "2024-04-20", status: "Completed"  },
  { id: "7",  invoiceNumber: "INV-2024-0047", customerName: "Walk-in Customer",  origin: "Sales",        salesType: "Offline", paymentMethod: "Cash", totalAmount: 480,   itemsCount: 1, date: "2024-04-20", status: "Completed"  },
  { id: "8",  invoiceNumber: "INV-2024-0048", customerName: "Vikram Iyer",       origin: "Sales Return", salesType: "Online",  paymentMethod: "UPI",  totalAmount: 7700,  itemsCount: 4, date: "2024-04-19", status: "Pending"    },
  { id: "9",  invoiceNumber: "INV-2024-0049", customerName: "Meera Joshi",       origin: "Sales",        salesType: "Offline", paymentMethod: "Card", totalAmount: 3100,  itemsCount: 3, date: "2024-04-19", status: "Completed"  },
  { id: "10", invoiceNumber: "INV-2024-0050", customerName: "Rahul Gupta",       origin: "Sales Return", salesType: "Online",  paymentMethod: "Card", totalAmount: 6200,  itemsCount: 4, date: "2024-04-18", status: "Cancelled"  },
  { id: "11", invoiceNumber: "INV-2024-0051", customerName: "Walk-in Customer",  origin: "Sales",        salesType: "Offline", paymentMethod: "Cash", totalAmount: 950,   itemsCount: 2, date: "2024-04-18", status: "Completed"  },
  { id: "12", invoiceNumber: "INV-2024-0052", customerName: "Divya Krishnan",    origin: "Sales",        salesType: "Online",  paymentMethod: "UPI",  totalAmount: 11200, itemsCount: 6, date: "2024-04-17", status: "Completed"  },
];

const TODAY = "2024-04-22";

/* ═══════════════════════════════════════════════
   BADGE CONFIGS
═══════════════════════════════════════════════ */
const ORIGIN_CFG: Record<OriginType, { cls: string; dot: string; icon: React.ReactNode }> = {
  "Sales":        { cls: "bg-blue-50 text-blue-700 border-blue-100",     dot: "bg-blue-400",   icon: <ShoppingCart size={10} /> },
  "Sales Return": { cls: "bg-orange-50 text-orange-700 border-orange-100", dot: "bg-orange-400", icon: <RotateCcw size={10} /> },
};

const SALES_TYPE_CFG: Record<SalesType, { cls: string; dot: string; icon: React.ReactNode }> = {
  Online:  { cls: "bg-blue-50 text-blue-700 border-blue-100",   dot: "bg-blue-400",   icon: <Wifi size={10} />    },
  Offline: { cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", icon: <WifiOff size={10} /> },
};

const PAYMENT_CFG: Record<PaymentMethod, { cls: string; dot: string }> = {
  Cash: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-400" },
  Card: { cls: "bg-purple-50 text-purple-700 border-purple-100",    dot: "bg-purple-400"  },
  UPI:  { cls: "bg-indigo-50 text-indigo-700 border-indigo-100",    dot: "bg-indigo-400"  },
};

const STATUS_CFG: Record<SaleStatus, { cls: string; dot: string }> = {
  Completed: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  Pending:   { cls: "bg-amber-50 text-amber-700 border-amber-100",       dot: "bg-amber-400"   },
  Cancelled: { cls: "bg-red-50 text-red-600 border-red-100",             dot: "bg-red-400"     },
};

/* ═══════════════════════════════════════════════
   SCOPED STYLES
═══════════════════════════════════════════════ */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  .sales-root { font-family: 'DM Sans', sans-serif; }
  .sales-mono { font-family: 'DM Mono', monospace; }

  .sales-row { transition: background-color 0.1s ease; }
  .sales-row:hover { background-color: #f8fafc; }
  .sales-row:hover .sales-row-actions { opacity: 1; }
  .sales-row-actions { opacity: 0; transition: opacity 0.15s ease; }

  .sales-stat {
    transition: box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
  }
  .sales-stat:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px -4px rgba(0,0,0,0.08);
    border-color: #e2e8f0;
  }

  .sales-filter-btn {
    transition: background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease;
  }
  .sales-filter-btn.active {
    background-color: #eff6ff;
    border-color: #bfdbfe;
    color: #1d4ed8;
  }

  .sales-dropdown {
    animation: salesDrop 0.12s ease forwards;
    transform-origin: top left;
  }
  @keyframes salesDrop {
    from { opacity: 0; transform: scale(0.96) translateY(-4px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
`;

/* ═══════════════════════════════════════════════
   SMALL COMPONENTS
═══════════════════════════════════════════════ */
const Badge = ({ cls, dot, label }: { cls: string; dot: string; label: string }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
    {label}
  </span>
);

/* ═══════════════════════════════════════════════
   FILTER DROPDOWN (generic)
═══════════════════════════════════════════════ */
const FilterDropdown = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const active = value !== "";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`sales-filter-btn inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg transition-all ${
          active
            ? "bg-blue-50 border-blue-200 text-blue-700"
            : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
        }`}
      >
        {active ? value : label}
        {active ? (
          <X
            size={11}
            className="text-blue-500"
            onClick={(e) => { e.stopPropagation(); onChange(""); setOpen(false); }}
          />
        ) : (
          <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <div className="sales-dropdown absolute top-full left-0 mt-1.5 min-w-[130px] bg-white border border-zinc-200 rounded-lg shadow-lg z-20 py-1 overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt === value ? "" : opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-zinc-50 ${
                opt === value ? "text-blue-600 bg-blue-50" : "text-zinc-700"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
const SalesListPage = () => {
  const [search,        setSearch]        = useState("");
  const [filterOrigin,    setFilterOrigin]    = useState<string>("");
  const [filterType,      setFilterType]      = useState<string>("");
  const [filterPayment, setFilterPayment] = useState<string>("");
  const [filterStatus,  setFilterStatus]  = useState<string>("");
  const [filterDate,    setFilterDate]    = useState<string>("");

  /* ── SIDEBAR STATE ── */
  const [selectedSale, setSelectedSale]   = useState<SaleRecord | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /* ── Derived stats ── */
  const totalRevenue   = MOCK_SALES.filter(s => s.status === "Completed").reduce((a, b) => a + b.totalAmount, 0);
  const salesCount         = MOCK_SALES.filter(s => s.origin === "Sales").length;
  const salesReturnCount   = MOCK_SALES.filter(s => s.origin === "Sales Return").length;
  const onlineSales        = MOCK_SALES.filter(s => s.salesType === "Online").length;
  const offlineSales       = MOCK_SALES.filter(s => s.salesType === "Offline").length;
  const todayRevenue   = MOCK_SALES.filter(s => s.date === TODAY && s.status === "Completed").reduce((a, b) => a + b.totalAmount, 0);

  /* ── Filtering ── */
  const filtered = useMemo(() => {
    return MOCK_SALES.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch  = !q || s.invoiceNumber.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q);
      const matchOrigin  = !filterOrigin  || s.origin         === filterOrigin;
      const matchType    = !filterType    || s.salesType      === filterType;
      const matchPayment = !filterPayment || s.paymentMethod  === filterPayment;
      const matchStatus  = !filterStatus  || s.status         === filterStatus;
      const matchDate    = !filterDate    || s.date            === filterDate;
      return matchSearch && matchOrigin && matchType && matchPayment && matchStatus && matchDate;
    });
  }, [search, filterOrigin, filterType, filterPayment, filterStatus, filterDate]);

  const activeFilters = [filterOrigin, filterType, filterPayment, filterStatus, filterDate].filter(Boolean).length;

  const clearAll = () => {
    setFilterOrigin(""); setFilterType(""); setFilterPayment(""); setFilterStatus(""); setFilterDate(""); setSearch("");
  };

  const openSidebar = (sale: SaleRecord) => {
    setSelectedSale(sale);
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <>
      <style>{STYLES}</style>

      <div className="sales-root min-h-screen bg-zinc-50/50 space-y-6 relative overflow-x-hidden">


        {/* ── Summary Cards ── */}
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <div className="flex gap-3 min-w-max">
            <StatCard
              label="Total Revenue"
              value={totalRevenue}
              prefix="₹"
              icon={TrendingUp}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              label="Total Orders"
              value={MOCK_SALES.length}
              icon={ShoppingCart}
              iconBg="bg-zinc-100"
              iconColor="text-zinc-600"
            />
            <StatCard
              label="Total Sales"
              value={salesCount}
              icon={ShoppingCart}
              iconBg="bg-sky-50"
              iconColor="text-sky-600"
            />
            <StatCard
              label="Sales Returns"
              value={salesReturnCount}
              icon={RotateCcw}
              iconBg="bg-orange-50"
              iconColor="text-orange-600"
            />
            <StatCard
              label="Online Sales"
              value={onlineSales}
              icon={Wifi}
              iconBg="bg-sky-50"
              iconColor="text-sky-600"
            />
            <StatCard
              label="Offline Sales"
              value={offlineSales}
              icon={WifiOff}
              iconBg="bg-slate-100"
              iconColor="text-slate-600"
            />
            <StatCard
              label="Revenue Today"
              value={todayRevenue}
              prefix="₹"
              icon={TrendingUp}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm px-4 py-3.5 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
              placeholder="Search invoice or customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Date filter */}
          <div className="relative">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className={`sales-filter-btn px-3 py-2 text-xs font-medium border rounded-lg outline-none cursor-pointer transition-all ${
                filterDate
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            />
          </div>

          {/* Filter dropdowns */}
          <FilterDropdown label="Origin" options={["Sales", "Sales Return"]} value={filterOrigin} onChange={setFilterOrigin} />
          <FilterDropdown label="Type" options={["Online", "Offline"]} value={filterType} onChange={setFilterType} />
          <FilterDropdown label="Payment" options={["Cash", "Card", "UPI"]} value={filterPayment} onChange={setFilterPayment} />
          <FilterDropdown label="Status" options={["Completed", "Pending", "Cancelled"]} value={filterStatus} onChange={setFilterStatus} />

          {/* Active filter indicator */}
          {activeFilters > 0 && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
            >
              <X size={11} /> Clear all ({activeFilters})
            </button>
          )}

          <div className="flex-1" />

          {/* Results count */}
          <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">
            {filtered.length} of {MOCK_SALES.length} records
          </span>

          {/* Advanced filter button */}
          <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
            <SlidersHorizontal size={13} className="text-zinc-400" />
            More
          </button>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">

              {/* Head */}
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  {[
                    { label: "Invoice",        cls: "pl-5 text-left"  },
                    { label: "Customer",       cls: "text-left"       },
                    { label: "Type",         cls: "text-left"       },
                    { label: "Origin",           cls: "text-left"       },
                    { label: "Payment",        cls: "text-left"       },
                    { label: "Date",           cls: "text-left"       },
                    { label: "Items",          cls: "text-center"     },
                    { label: "Amount",         cls: "text-right"      },
                    { label: "Status",         cls: "text-left"       },
                    { label: "",               cls: "pr-5 text-right" },
                  ].map(({ label, cls }, i) => (
                    <th
                      key={i}
                      className={`py-3 px-4 first:pl-5 last:pr-5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 whitespace-nowrap ${cls}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-zinc-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2 text-zinc-400">
                        <Receipt size={28} className="opacity-25 mb-1" />
                        <p className="text-sm font-medium text-zinc-600">No sales found</p>
                        <p className="text-xs">Try adjusting your search or filters</p>
                        {activeFilters > 0 && (
                          <button
                            onClick={clearAll}
                            className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((sale) => {
                    const oCfg = ORIGIN_CFG[sale.origin];
                    const tCfg = SALES_TYPE_CFG[sale.salesType];
                    const pCfg = PAYMENT_CFG[sale.paymentMethod];
                    const sCfg = STATUS_CFG[sale.status];
                    return (
                      <tr key={sale.id} className="sales-row">

                        {/* Invoice */}
                        <td className="py-3.5 pl-5 pr-4">
                          <span className="sales-mono text-xs font-medium text-zinc-700 tracking-tight">
                            {sale.invoiceNumber}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="text-sm font-medium text-zinc-800 whitespace-nowrap">
                              {sale.customerName}
                            </p>
                            {sale.customerName === "Walk-in Customer" && (
                              <p className="text-[10px] text-zinc-400 mt-0.5">No account</p>
                            )}
                          </div>
                        </td>

                        {/* Origin */}
                        <td className="py-3.5 px-4">
                          <Badge cls={oCfg.cls} dot={oCfg.dot} label={sale.origin} />
                        </td>

                        {/* Sales Type */}
                        <td className="py-3.5 px-4">
                          <Badge cls={tCfg.cls} dot={tCfg.dot} label={sale.salesType} />
                        </td>

                        {/* Payment */}
                        <td className="py-3.5 px-4">
                          <Badge cls={pCfg.cls} dot={pCfg.dot} label={sale.paymentMethod} />
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-sm text-zinc-500 whitespace-nowrap tabular-nums">
                          {sale.date}
                        </td>

                        {/* Items */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-sm font-medium text-zinc-600 tabular-nums">
                            {sale.itemsCount}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="sales-mono text-sm font-semibold text-zinc-900 tabular-nums">
                            ₹{sale.totalAmount.toLocaleString()}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <Badge cls={sCfg.cls} dot={sCfg.dot} label={sale.status} />
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 pl-4 pr-5">
                          <div className="sales-row-actions flex items-center justify-end gap-1">
                            {/* ── TRIGGER SIDEBAR HERE ── */}
                            <button
                              onClick={() => openSidebar(sale)}
                              title="View sale"
                              className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              title="Return Order"
                              className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <RotateCcw size={15} />
                            </button>
                            <button
                              title="More options"
                              className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all"
                            >
                              <MoreHorizontal size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Table Footer ── */}
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between gap-4">
              <p className="text-xs text-zinc-400">
                Showing <span className="font-medium text-zinc-600">{filtered.length}</span> of{" "}
                <span className="font-medium text-zinc-600">{MOCK_SALES.length}</span> records
              </p>

              {/* Revenue summary for filtered set */}
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>
                  Filtered revenue:{" "}
                  <span className="font-semibold text-zinc-800 tabular-nums sales-mono">
                    ₹{filtered
                      .filter(s => s.status === "Completed")
                      .reduce((a, b) => a + b.totalAmount, 0)
                      .toLocaleString()}
                  </span>
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      className={`w-7 h-7 rounded-md text-xs font-medium transition-all ${
                        n === 1
                          ? "bg-white border border-zinc-200 text-zinc-800 shadow-sm"
                          : "text-zinc-400 hover:bg-zinc-100"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          SIDEBAR / DRAWER COMPONENT
      ═══════════════════════════════════════════════ */}
      {/* Backdrop overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sliding Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out border-l border-zinc-200 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedSale && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">Sale Details</h2>
                <p className="text-xs text-zinc-500 sales-mono mt-0.5">{selectedSale.invoiceNumber}</p>
              </div>
              <button
                onClick={closeSidebar}
                className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Grand Total Area */}
              <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-100 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Total Amount</span>
                <span className="text-4xl font-semibold text-zinc-900 sales-mono tracking-tight">
                  ₹{selectedSale.totalAmount.toLocaleString()}
                </span>
                <div className="mt-3">
                  <Badge 
                    cls={STATUS_CFG[selectedSale.status].cls} 
                    dot={STATUS_CFG[selectedSale.status].dot} 
                    label={selectedSale.status} 
                  />
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Customer */}
                <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-zinc-400 mb-2">
                    <User size={14} />
                    <span className="text-[11px] font-semibold uppercase tracking-widest">Customer</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-900">{selectedSale.customerName}</p>
                </div>

                {/* Date */}
                <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-zinc-400 mb-2">
                    <Calendar size={14} />
                    <span className="text-[11px] font-semibold uppercase tracking-widest">Date</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-900 tabular-nums">{selectedSale.date}</p>
                </div>

                {/* Payment Method */}
                <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-zinc-400 mb-2">
                    <CreditCard size={14} />
                    <span className="text-[11px] font-semibold uppercase tracking-widest">Payment</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-900">{selectedSale.paymentMethod}</p>
                </div>

                {/* Origin */}
                <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-zinc-400 mb-2">
                    {selectedSale.origin === "Sales" ? <ShoppingCart size={14} /> : <RotateCcw size={14} />}
                    <span className="text-[11px] font-semibold uppercase tracking-widest">Origin</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-900">{selectedSale.origin}</p>
                </div>

                {/* Sales Type */}
                <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-zinc-400 mb-2">
                    {selectedSale.salesType === "Online" ? <Wifi size={14} /> : <WifiOff size={14} />}
                    <span className="text-[11px] font-semibold uppercase tracking-widest">Type</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-900">{selectedSale.salesType}</p>
                </div>
              </div>

              {/* Items Summary */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">Order Summary</h3>
                <div className="border border-zinc-100 rounded-xl divide-y divide-zinc-100 overflow-hidden">
                  {Array.from({ length: selectedSale.itemsCount }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center text-zinc-400">
                          <Package size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-800">Sample Product {i + 1}</p>
                          <p className="text-xs text-zinc-500">Qty: 1</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-zinc-900 tabular-nums">
                        ₹{Math.round(selectedSale.totalAmount / selectedSale.itemsCount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex gap-3">
              <button className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold hover:bg-zinc-50 transition-colors shadow-sm">
                Download PDF
              </button>
              <button className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                Print Receipt
              </button>
              <button className="flex-1 py-2.5 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors shadow-sm">
                Return
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default SalesListPage;