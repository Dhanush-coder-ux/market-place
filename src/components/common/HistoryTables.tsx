import { ArrowUp, ArrowDown, ShoppingCart, TrendingUp, RefreshCcw, FileText, ArrowRight, Banknote, Eye } from "lucide-react";

// ─── STOCK MOVEMENTS TABLE ──────────────────────────────────────────────────
export interface StockMovementRow {
  id: string;
  date: string;
  displayType: string;
  source?: string;
  isInc: boolean;
  variant: string | null;
  batch: string | null;
  stocks: number;
  receivedStocks: number;
  stocksBefore: number | null;
  description: string;
  serials?: string[];
  uiId?: string;
}

interface StockMovementsTableProps {
  rows: StockMovementRow[];
  loading: boolean;
  onNavigateToPurchase?: (id: string) => void;
}

export function StockMovementsTable({ rows, loading, onNavigateToPurchase }: StockMovementsTableProps) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">


      {/* Table Body Container with internal scroll only */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <RefreshCcw size={32} className="text-blue-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400">Loading stock ledger...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-24 text-center">
            <TrendingUp size={40} className="mx-auto text-slate-200 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Movements Recorded</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">This product does not have any inventory logs recorded yet.</p>
          </div>
        ) : (
          <div className="inline-block min-w-full align-middle">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 text-[9px] font-black text-slate-400 tracking-wider uppercase border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Movement Type</th>
                  <th className="px-5 py-3.5">Product / Variant / Batch</th>
                  <th className="px-5 py-3.5">Base Qty</th>
                  <th className="px-5 py-3.5">In / Out</th>
                  <th className="px-5 py-3.5">Stock Overview</th>
                  <th className="px-5 py-3.5">Details</th>
                  <th className="px-5 py-3.5 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => {
                  const currentStockVal = r.stocksBefore !== null 
                    ? (r.stocksBefore + (r.isInc ? r.receivedStocks : -r.receivedStocks)) 
                    : null;
                  return (
                    <tr 
                      key={`${r.id}-${i}`} 
                      className={`hover:bg-slate-50/80 transition-colors border-l-[3px] ${
                        r.source === 'purchase' ? 'border-l-indigo-400' : r.isInc ? 'border-l-emerald-400' : 'border-l-rose-400'
                      }`}
                    >
                      <td className="px-5 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                        {r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.source === 'purchase'
                            ? (r.displayType === 'PO Purchase' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200')
                            : r.isInc ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {r.isInc ? <ArrowUp size={10} className="stroke-[3]" /> : <ArrowDown size={10} className="stroke-[3]" />}
                          {r.displayType}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1 max-w-[200px]">
                          {r.variant && <span className="w-fit px-2 py-0.5 rounded-md text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-100 truncate">V: {r.variant}</span>}
                          {r.batch && <span className="w-fit px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 truncate">B: {r.batch}</span>}
                          {!r.variant && !r.batch && <span className="text-slate-300">—</span>}
                          {r.serials && r.serials.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              <span className="text-[9px] text-slate-400 font-bold">SN: </span>
                              {r.serials.slice(0, 2).map((s, si) => (
                                <span key={si} className="text-[9px] font-mono font-bold text-slate-500">{s}{si === 0 && r.serials!.length > 1 ? ',' : ''}</span>
                              ))}
                              {r.serials.length > 2 && <span className="text-[9px] font-bold text-slate-400">+{r.serials.length - 2}</span>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-black text-sm text-slate-700 tabular-nums">
                        {r.stocks}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-black text-sm tabular-nums">
                        <span className={r.isInc ? 'text-emerald-600' : 'text-rose-600'}>
                          {r.isInc ? '+' : '-'}{r.receivedStocks}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Opening</span>
                            <span className="text-xs font-bold text-slate-600">{r.stocksBefore ?? '—'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-blue-400 tracking-wider uppercase">Current</span>
                            <span className="text-xs font-black text-blue-600">
                              {currentStockVal !== null ? currentStockVal : '—'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 max-w-[220px] truncate" title={r.description}>
                        {r.description}
                      </td>
                      <td className="px-5 py-4">
                        {r.source === 'purchase' && onNavigateToPurchase && (
                          <button
                            onClick={() => onNavigateToPurchase(r.id)}
                            title="View Purchase Detail"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 border border-indigo-100 transition-all active:scale-95 shadow-sm"
                          >
                            <Eye size={13} strokeWidth={2.5} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── PRODUCT PURCHASES TABLE ────────────────────────────────────────────────
interface ProductPurchasesTableProps {
  rows: any[];
  loading: boolean;
  onNavigateToPurchase?: (id: string) => void;
}

export function ProductPurchasesTable({ rows, loading, onNavigateToPurchase }: ProductPurchasesTableProps) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">


      {/* Body */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <RefreshCcw size={32} className="text-indigo-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400">Loading purchase records...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-24 text-center">
            <ShoppingCart size={40} className="mx-auto text-slate-200 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Purchase History</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">There are no registered supplier purchases for this product.</p>
          </div>
        ) : (
          <div className="inline-block min-w-full align-middle">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 text-[9px] font-black text-slate-400 tracking-wider uppercase border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <th className="px-5 py-3.5">#</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Variant / Batch</th>
                  <th className="px-5 py-3.5">In / Out</th>
                  <th className="px-5 py-3.5">Stock Overview</th>
                  <th className="px-5 py-3.5">Financials</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Reference</th>
                  <th className="px-5 py-3.5">Storage Loc</th>
                  <th className="px-5 py-3.5">Supplier</th>
                  <th className="px-5 py-3.5 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => (
                  <tr key={`${r.id}-${i}`} className="hover:bg-indigo-50/20 transition-colors border-l-[3px] border-l-indigo-400">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-[10px] font-black text-slate-400 font-mono">#{r.uiId}</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                      {r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        r.displayType === 'PO Purchase' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        <ArrowUp size={10} className="stroke-[3]" />
                        {r.displayType}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1 max-w-[200px]">
                        {r.variant && <span className="w-fit px-2 py-0.5 rounded-md text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-100 truncate">V: {r.variant}</span>}
                        {r.batch && <span className="w-fit px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 truncate">B: {r.batch}</span>}
                        {!r.variant && !r.batch && <span className="text-slate-300">—</span>}
                        {r.serials && r.serials.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            <span className="text-[9px] text-slate-400 font-bold">SN: </span>
                            {r.serials.slice(0, 2).map((s: string, si: number) => (
                              <span key={si} className="text-[9px] font-mono font-bold text-slate-500">{s}{si === 0 && r.serials.length > 1 ? ',' : ''}</span>
                            ))}
                            {r.serials.length > 2 && <span className="text-[9px] font-bold text-slate-400">+{r.serials.length - 2}</span>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-black text-sm tabular-nums">
                      <span className={r.isInc !== false ? 'text-emerald-600' : 'text-rose-600'}>
                        {r.isInc !== false ? '+' : '-'}{r.receivedStocks}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                       <div className="flex flex-col gap-0.5">
                         <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Opening</span>
                           <span className="text-xs font-bold text-slate-600">{r.stocksBefore !== null ? r.stocksBefore : '—'}</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-blue-400 tracking-wider uppercase">Current</span>
                           <span className="text-xs font-black text-blue-600">
                             {r.stocksBefore !== null ? (r.stocksBefore + r.receivedStocks) : '—'}
                           </span>
                         </div>
                       </div>
                     </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Buy</span>
                          <span className="text-xs font-bold text-slate-600">₹{r.buyPrice ?? '—'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-emerald-400 tracking-wider uppercase">Sell</span>
                          <span className="text-xs font-black text-emerald-600">₹{r.sellPrice ?? '—'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md w-fit ${
                          r.paymentMethod === 'Cash' ? 'bg-emerald-50 text-emerald-700' :
                          r.paymentMethod === 'UPI' ? 'bg-violet-50 text-violet-700' :
                          'bg-slate-50 text-slate-600'
                        }`}>{r.paymentMethod}</span>
                        {r.amountPaid > 0 && (
                          <span className="text-[9px] text-slate-400 font-bold">Paid: ₹{r.amountPaid}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-mono text-slate-600">INV: {r.invoiceNo}</span>
                        <span className="text-[10px] font-mono text-slate-400">REF: {r.referenceNo}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-650 uppercase whitespace-nowrap">
                      {r.storageLocation || '—'}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 max-w-[150px] truncate" title={r.description}>
                      {r.description.replace('Supplier: ', '')}
                    </td>
                    <td className="px-5 py-4">
                      {onNavigateToPurchase && (
                        <button
                          onClick={() => onNavigateToPurchase(r.id)}
                          title="View Purchase Detail"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 border border-indigo-100 transition-all active:scale-95 shadow-sm"
                        >
                          <Eye size={13} strokeWidth={2.5} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── SUPPLIER PURCHASES TABLE ────────────────────────────────────────────────
interface SupplierPurchasesTableProps {
  rows: any[];
  loading: boolean;
}

export function SupplierPurchasesTable({ rows, loading }: SupplierPurchasesTableProps) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">


      {/* Body */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <RefreshCcw size={32} className="text-indigo-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400">Loading vendor purchases...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-24 text-center">
            <ShoppingCart size={40} className="mx-auto text-slate-200 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Purchases Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">There are no logged purchase acquisitions for this vendor.</p>
          </div>
        ) : (
          <div className="inline-block min-w-full align-middle">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 text-[9px] font-black text-slate-400 tracking-wider uppercase border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <th className="px-5 py-3.5">#</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">In / Out</th>
                  <th className="px-5 py-3.5">Stock Overview</th>
                  <th className="px-5 py-3.5">Buy Price</th>
                  <th className="px-5 py-3.5">Sell Price</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Invoice</th>
                  <th className="px-5 py-3.5">Reference</th>
                  <th className="px-5 py-3.5">Storage Location</th>
                  <th className="px-5 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => (
                  <tr key={`${r.purchaseId}-${i}`} className="hover:bg-indigo-50/20 transition-colors border-l-[3px] border-l-indigo-400">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-[10px] font-black text-slate-400 font-mono">#{r.uiId}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        r.type === 'DIRECT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        r.type?.includes('PO') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {r.type === 'DIRECT' ? 'Purchase' : (r.type || '—').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-700 whitespace-nowrap max-w-[150px] truncate" title={r.productName}>
                      {r.productName}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-black text-sm tabular-nums">
                      <span className={r.isInc !== false ? 'text-emerald-600' : 'text-rose-600'}>
                        {r.isInc !== false ? '+' : '-'}{r.receivedStocks}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                       <div className="flex flex-col gap-0.5">
                         <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Opening</span>
                           <span className="text-xs font-bold text-slate-600">{r.stocksBefore !== undefined && r.stocksBefore !== null ? r.stocksBefore : '—'}</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-blue-400 tracking-wider uppercase">Current</span>
                           <span className="text-xs font-black text-blue-600">
                             {r.stocksBefore !== undefined && r.stocksBefore !== null ? (r.stocksBefore + r.receivedStocks) : '—'}
                           </span>
                         </div>
                       </div>
                     </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-slate-700">
                      ₹{r.buy_price ?? '—'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-emerald-700">
                      ₹{r.sell_price ?? '—'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md w-fit ${
                          r.paymentMethod === 'Cash' ? 'bg-emerald-50 text-emerald-700' :
                          r.paymentMethod === 'UPI' ? 'bg-violet-50 text-violet-700' :
                          'bg-slate-50 text-slate-600'
                        }`}>{r.paymentMethod}</span>
                        {r.amountPaid > 0 && (
                          <span className="text-[9px] text-slate-400 font-bold">Paid: ₹{r.amountPaid}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                      {r.invoiceNo}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-slate-400 whitespace-nowrap">
                      {r.referenceNo}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-655 uppercase whitespace-nowrap">
                      {r.storageLocation || '—'}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                      {r.purchaseDate ? new Date(r.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CUSTOMER PURCHASES TABLE ────────────────────────────────────────────────
interface CustomerPurchasesTableProps {
  rows: any[];
  loading: boolean;
}

function LocalStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    Paid: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Partial: "bg-blue-50 text-blue-600 border-blue-100",
    Pending: "bg-amber-50 text-amber-600 border-amber-100",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
        colorMap[status] ?? "bg-slate-50 text-slate-500 border-slate-100"
      }`}
    >
      {status}
    </span>
  );
}

export function CustomerPurchasesTable({ rows, loading }: CustomerPurchasesTableProps) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <RefreshCcw size={32} className="text-indigo-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400">Loading order records...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-24 text-center">
            <ShoppingCart size={40} className="mx-auto text-slate-200 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Orders Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">When this customer makes a purchase, it will appear here.</p>
          </div>
        ) : (
          <div className="inline-block min-w-full align-middle">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 text-[9px] font-black text-slate-400 tracking-wider uppercase border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <th className="px-5 py-3.5">Invoice Identity</th>
                  <th className="px-5 py-3.5">Order Date</th>
                  <th className="px-5 py-3.5">Volume</th>
                  <th className="px-5 py-3.5">Financials</th>
                  <th className="px-5 py-3.5">Payment Summary</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((order, i) => {
                  const date = order.created_at || order.date
                    ? new Date(order.created_at || order.date).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })
                    : '—';
                  const total = Number(order.total_sellprice || order.grand_total || order.total_amount || 0);
                  const products = order.items || order.products || [];
                  const itemCount = order.total_quantity || products.length;
                  const invoiceId = order.ui_id ? `INV-${order.ui_id}` : `#${order.id.slice(0, 8).toUpperCase()}`;

                  return (
                    <tr key={`${order.id}-${i}`} className="hover:bg-indigo-50/20 transition-colors border-l-[3px] border-l-indigo-400">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <FileText size={14} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-700 font-mono tracking-tight">{invoiceId}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{order.type || "NORMAL"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                        {date}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-black text-slate-500">
                          {itemCount} {itemCount === 1 ? "Item" : "Units"}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-black text-sm text-slate-800 tabular-nums">
                        ₹{total.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1.5">
                          {order.payments && Object.entries(order.payments).map(([mode, amount]) => (
                            <div key={mode} className={`px-2 py-0.5 rounded text-[9px] font-black border flex items-center gap-1.5 ${
                              mode.toUpperCase() === 'CREDIT' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              mode.toUpperCase() === 'CASH' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              'bg-violet-50 text-violet-600 border-violet-100'
                            }`}>
                              <div className={`w-1 h-1 rounded-full ${
                                mode.toUpperCase() === 'CREDIT' ? 'bg-blue-400' :
                                mode.toUpperCase() === 'CASH' ? 'bg-emerald-400' :
                                'bg-violet-400'
                              }`} />
                              {mode.toUpperCase()}
                              <span className="opacity-40">₹{Number(amount).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                          {!order.payments && <span className="text-[9px] font-bold text-slate-300 italic">No payment record</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <LocalStatusBadge status={order.status || "Pending"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CUSTOMER COLLECTIONS TABLE ──────────────────────────────────────────────
interface CustomerCollectionsTableProps {
  rows: any[];
  loading: boolean;
}

export function CustomerCollectionsTable({ rows, loading }: CustomerCollectionsTableProps) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <RefreshCcw size={32} className="text-indigo-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400">Loading collection history...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-24 text-center">
            <Banknote size={40} className="mx-auto text-slate-200 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Collections Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">When you record a payment for this customer, it will appear here.</p>
          </div>
        ) : (
          <div className="inline-block min-w-full align-middle">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 text-[9px] font-black text-slate-400 tracking-wider uppercase border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <th className="px-5 py-3.5">Ref Identity</th>
                  <th className="px-5 py-3.5">Payment Date</th>
                  <th className="px-5 py-3.5">Cleared Amount</th>
                  <th className="px-5 py-3.5">Balance Transition</th>
                  <th className="px-5 py-3.5">Payment Breakdown</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((h, i) => {
                  const date = h.created_at
                    ? new Date(h.created_at).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })
                    : '—';
                  const clearedAmount = Number(h.cleared_amount || 0);
                  const refId = `#${String(h.id).padStart(3, '0')}`;

                  return (
                    <tr key={`${h.id}-${i}`} className="hover:bg-indigo-50/20 transition-colors border-l-[3px] border-l-emerald-500">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-xs font-black text-slate-700 font-mono tracking-tight">{refId}</span>
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                        {date}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-black text-sm text-slate-800 tabular-nums">
                        ₹{clearedAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400 line-through opacity-70">₹{Number(h.outstanding_before || 0).toLocaleString('en-IN')}</span>
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                          <span className="font-bold text-emerald-600">₹{Number(h.outstanding_after || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1.5">
                          {h.payments && Object.entries(h.payments).map(([method, amount]) => (
                            <div key={method} className="px-2 py-0.5 rounded text-[9px] font-black border border-slate-100 bg-slate-50 text-slate-600 flex items-center gap-1">
                              <span className="opacity-60 uppercase">{method}</span>
                              <span>₹{Number(amount).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-100">
                          Cleared
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
