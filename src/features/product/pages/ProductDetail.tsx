import { useState } from "react";
import { 
  Headphones, Edit3, Package, Download, Upload, DollarSign, 
  AlertTriangle, Tag, BarChart2, ShoppingCart, Target, ArrowRightLeft
} from "lucide-react";

// ── Mock Data ──────────────────────────────────────────────────────────────
const generalInfo = {
  sku: "WH-2024-BLK",
  category: "Electronics",
  brand: "SoundCore",
  barcode: "-",
  unitCost: "₹45.00",
  sellingPrice: "₹89.99",
  profitMargin: "100% (₹44.99)",
  taxRate: "Standard GST (12%)",
  currentStock: "20 Units",
  reorderLevel: "10 Pcs",
  location: "Shelf A-12",
  lastRestocked: "April 18, 2024",
  description:
    "Premium wireless headphones with active noise cancellation, 30-hour battery life, and foldable design. Compatible with all Bluetooth 5.0 devices.",
};

const purchaseHistory = [
  { id: "PO-2024-156", date: "Apr 18, 2024", supplier: "ABC Traders", qty: 60, cost: "₹45.00", total: "₹2,700", status: "Received" },
  { id: "PO-2024-132", date: "Mar 28, 2024", supplier: "Global Tech", qty: 50, cost: "₹43.50", total: "₹2,175", status: "Received" },
  { id: "PO-2024-095", date: "Mar 10, 2024", supplier: "ABC Traders", qty: 70, cost: "₹44.00", total: "₹3,080", status: "Received" },
];

const stockMovements = [
  { date: "Apr 24, 2024", type: "Sale", ref: "INV-2024-189", qty: 5, balance: 20 },
  { date: "Apr 22, 2024", type: "Sale", ref: "INV-2024-178", qty: 8, balance: 25 },
  { date: "Apr 18, 2024", type: "Purchase", ref: "PO-2024-156", qty: 60, balance: 33 },
  { date: "Apr 15, 2024", type: "Adjustment", ref: "ADJ-2024-012", qty: -5, balance: -27 },
];

const suppliers = [
  { name: "ABC Traders", contact: "+91 98765-43210", price: "₹45.00 / unit", total: "130 units (₹5,850)", date: "April 18, 2024" },
  { name: "Global Tech", contact: "+91 98765-11122", price: "₹43.50 / unit", total: "50 units (₹2,175)", date: "March 28, 2024" },
];

// ── Sub-components ─────────────────────────────────────────────────────────

const GeneralInfoTab = () => (
  <div className="p-5 animate-in fade-in duration-300">
    {/* Alert Box */}
    <div className="flex items-start gap-2 bg-amber-50/50 border border-amber-100 p-3 rounded-lg mb-5">
      <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} strokeWidth={1.5} />
      <div>
        <h4 className="font-semibold text-slate-700 text-xs">Low Stock Alert</h4>
        <p className="text-xs text-slate-500 mt-0.5">Current stock (20 units) is at the reorder level. Consider restocking soon.</p>
      </div>
    </div>

    <h2 className="text-sm font-semibold text-slate-700 mb-4">Product Information</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Col 1 */}
      <div className="space-y-4">
        {[
          ["SKU", generalInfo.sku],
          ["Category", generalInfo.category],
          ["Brand", generalInfo.brand],
          ["Barcode", generalInfo.barcode],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm font-medium text-slate-700">{value}</p>
          </div>
        ))}
      </div>

      {/* Col 2 */}
      <div className="space-y-4">
        {[
          ["Unit Cost", generalInfo.unitCost],
          ["Selling Price", generalInfo.sellingPrice],
          ["Profit Margin", generalInfo.profitMargin],
          ["Tax Rate", generalInfo.taxRate],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm font-medium text-slate-700">{value}</p>
          </div>
        ))}
      </div>

      {/* Col 3 */}
      <div className="space-y-4">
        {[
          ["Current Stock", generalInfo.currentStock],
          ["Reorder Level", generalInfo.reorderLevel],
          ["Warehouse Location", generalInfo.location],
          ["Last Restocked", generalInfo.lastRestocked],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm font-medium text-slate-700">{value}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PurchaseHistoryTab = () => (
  <div className="p-5 overflow-x-auto animate-in fade-in duration-300">
    <h2 className="text-sm font-semibold text-slate-700 mb-4">Purchase History</h2>
    <table className="w-full text-xs text-left">
      <thead className="bg-slate-50/50">
        <tr>
          {["PO Number", "Date", "Supplier", "Quantity", "Unit Cost", "Total", "Status"].map((h) => (
            <th key={h} className="text-[11px] font-medium text-slate-400 uppercase tracking-wider py-2 px-3 border-b border-slate-100">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {purchaseHistory.map((row) => (
          <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="py-2.5 px-3 font-medium text-blue-500">{row.id}</td>
            <td className="py-2.5 px-3 text-slate-600">{row.date}</td>
            <td className="py-2.5 px-3 font-medium text-slate-700">{row.supplier}</td>
            <td className="py-2.5 px-3 text-slate-600">{row.qty} units</td>
            <td className="py-2.5 px-3 text-slate-600">{row.cost}</td>
            <td className="py-2.5 px-3 text-slate-600">{row.total}</td>
            <td className="py-2.5 px-3">
              <span className="inline-flex bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider">
                {row.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const StockMovementTab = () => (
  <div className="p-5 overflow-x-auto animate-in fade-in duration-300">
    <h2 className="text-sm font-semibold text-slate-700 mb-4">Stock Movement</h2>
    <table className="w-full text-xs text-left">
      <thead className="bg-slate-50/50">
        <tr>
          {["Date", "Transaction", "Reference", "Quantity", "Type", "Balance"].map((h) => (
            <th key={h} className="text-[11px] font-medium text-slate-400 uppercase tracking-wider py-2 px-3 border-b border-slate-100">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {stockMovements.map((row, i) => {
          const isSale = row.type === "Sale";
          const isPurchase = row.type === "Purchase";
          
          return (
            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-2.5 px-3 text-slate-600">{row.date}</td>
              <td className="py-2.5 px-3 text-slate-600">{row.type}</td>
              <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{row.ref}</td>
              <td className="py-2.5 px-3 text-slate-600">{row.qty > 0 && !isSale ? "+" : ""}{row.qty} units</td>
              <td className="py-2.5 px-3">
                <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-medium uppercase tracking-wider ${
                  isSale ? "bg-red-50 text-red-500 border-red-100" : 
                  isPurchase ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                  "bg-amber-50 text-amber-600 border-amber-100"
                }`}>
                  {isSale ? "Out" : isPurchase ? "In" : "Adjusted"}
                </span>
              </td>
              <td className="py-2.5 px-3 text-slate-600">{row.balance} units</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const SuppliersTab = () => (
  <div className="p-5 overflow-x-auto animate-in fade-in duration-300">
    <h2 className="text-sm font-semibold text-slate-700 mb-4">Suppliers</h2>
    <table className="w-full text-xs text-left">
      <thead className="bg-slate-50/50">
        <tr>
          {["Supplier Name", "Contact", "Last Purchase Price", "Total Purchased", "Last Order Date"].map((h) => (
            <th key={h} className="text-[11px] font-medium text-slate-400 uppercase tracking-wider py-2 px-3 border-b border-slate-100">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {suppliers.map((row, i) => (
          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
            <td className="py-2.5 px-3 font-medium text-slate-700">{row.name}</td>
            <td className="py-2.5 px-3 text-slate-600">{row.contact}</td>
            <td className="py-2.5 px-3 text-slate-600">{row.price}</td>
            <td className="py-2.5 px-3 text-slate-600">{row.total}</td>
            <td className="py-2.5 px-3 text-slate-600">{row.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);


// ── Main Page ──────────────────────────────────────────────────────────────
const ProductDetail = () => {
  const [activeTab, setActiveTab] = useState("General Info");
  const tabs = ["General Info", "Purchase History", "Stock Movement", "Suppliers"];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <div className="space-y-4">
        
        {/* ── Product Header Card ── */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col md:flex-row gap-5 shadow-sm">
          {/* Icon Container - Scaled down and muted */}
          <div className="w-24 h-24 shrink-0 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Headphones size={36} className="text-slate-400" strokeWidth={1.5} />
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-700">Wireless Headphones</h1>
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-medium tracking-wider uppercase">
                  Active
                </span>
              </div>
              <button className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg font-medium text-xs transition-all shrink-0">
                <Edit3 size={14} strokeWidth={1.5} /> Edit
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">SKU: WH-2024-BLK</p>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-4 max-w-2xl">
              {generalInfo.description}
            </p>

            {/* Quick Stats Row */}
            <div className="flex flex-wrap gap-6 pt-1 border-t border-slate-50 mt-3">
              <div className="flex flex-col mt-2">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Category</span>
                <span className="text-sm font-semibold text-slate-600">Electronics</span>
              </div>
              <div className="flex flex-col mt-2">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Brand</span>
                <span className="text-sm font-semibold text-slate-600">SoundCore</span>
              </div>
              <div className="flex flex-col mt-2">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Selling Price</span>
                <span className="text-sm font-semibold text-slate-600">₹89.99</span>
              </div>
              <div className="flex flex-col mt-2">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Warehouse</span>
                <span className="text-sm font-semibold text-slate-600">Shelf A-12</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4-Card Stats Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1 */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
              <Package size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Current Stock</p>
              <p className="text-lg font-bold text-slate-700">20</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
              <Download size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Purchases</p>
              <p className="text-lg font-bold text-slate-700">180</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
              <Upload size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Total Sales</p>
              <p className="text-lg font-bold text-slate-700">160</p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
              <DollarSign size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Stock Value</p>
              <p className="text-lg font-bold text-slate-700">₹900</p>
            </div>
          </div>
        </div>

        {/* ── Tabs & Content Area ── */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Tab Header */}
          <div className="flex border-b border-slate-100 bg-slate-50/30 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-5 text-xs font-medium text-center transition-colors whitespace-nowrap border-b-2 -mb-[1px] ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div className="min-h-[250px]">
            {activeTab === "General Info" && <GeneralInfoTab />}
            {activeTab === "Purchase History" && <PurchaseHistoryTab />}
            {activeTab === "Stock Movement" && <StockMovementTab />}
            {activeTab === "Suppliers" && <SuppliersTab />}
          </div>
        </div>

        {/* ── Sticky Bottom Action Bar ── */}
        <div 
          className="sticky -bottom-4 md:-bottom-6 lg:-bottom-8 -mx-4 md:-mx-6 lg:-mx-8 -mb-4 md:-mb-6 lg:-mb-8 mt-auto bg-white border-t-2 border-slate-200 px-8 py-4 flex justify-between items-center shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-[100]"
        >
          <div className="text-xs font-medium text-slate-500 hidden md:block px-2">
            Quick actions
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-xs transition-all shadow-sm">
              <Tag size={14} strokeWidth={1.5} /> Label
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-xs transition-all shadow-sm">
              <BarChart2 size={14} strokeWidth={1.5} /> Report
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-xs transition-all shadow-sm">
              <ArrowRightLeft size={14} strokeWidth={1.5} /> Adjust
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-xs transition-all shadow-sm">
              <Target size={14} strokeWidth={1.5} /> PO
            </button>
            <button className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-xs transition-all shadow-sm active:scale-95">
              <ShoppingCart size={14} strokeWidth={1.5} /> Sale
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;