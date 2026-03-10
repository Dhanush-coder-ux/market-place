import  { useState } from "react";
import { Edit3, Package, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

// ── Mock Data ──────────────────────────────────────────────────────────────
const generalInfo = {
  sku: "WH-2024-BLK",
  category: "Electronics",
  brand: "SoundCore",
  unitCost: "$45.00",
  sellingPrice: "$89.99",
  reorderLevel: "10 Pcs",
  location: "Shelf A-12",
  description:
    "Premium wireless headphones with active noise cancellation, 30-hour battery life, and foldable design. Compatible with all Bluetooth 5.0 devices.",
};

const purchaseHistory = [
  { id: "PO-0041", date: "Jun 12, 2025", supplier: "TechSupply Co.", qty: 50, cost: "$2,250", status: "Received" },
  { id: "PO-0035", date: "Apr 28, 2025", supplier: "Global Parts Ltd.", qty: 30, cost: "$1,350", status: "Received" },
  { id: "PO-0029", date: "Feb 14, 2025", supplier: "TechSupply Co.", qty: 20, cost: "$900", status: "Received" },
  { id: "PO-0021", date: "Jan 03, 2025", supplier: "AudioHub Inc.", qty: 40, cost: "$1,800", status: "Received" },
];

const stockMovements = [
  { date: "Jul 01, 2025", type: "Sale", ref: "SO-1092", qty: -5, balance: 20 },
  { date: "Jun 28, 2025", type: "Sale", ref: "SO-1087", qty: -3, balance: 25 },
  { date: "Jun 12, 2025", type: "Purchase", ref: "PO-0041", qty: +50, balance: 28 },
  { date: "Jun 08, 2025", type: "Sale", ref: "SO-1071", qty: -8, balance: -22 },
  { date: "May 19, 2025", type: "Adjustment", ref: "ADJ-003", qty: +2, balance: 30 },
];

// ── Sub-components ─────────────────────────────────────────────────────────
const GeneralInfoTab = () => (
  <div className="flex gap-4 p-4">
               <div className="bg-white mt-8 w-45 h-45  border border-slate-100 p-6 shadow-sm ring-1 ring-slate-200/50">
              <div className="w-full aspect-square bg-gradient-to-br from-slate-50 to-indigo-50/50 rounded-2xl flex items-center justify-center mb-5 border border-slate-50">
                <Package size={56} className="text-indigo-200" />
              </div>
            
            </div>

  <div className="p-8 space-y-8 animate-in fade-in duration-300">
    
    <p className="text-sm text-slate-500 leading-relaxed max-w-xl">{generalInfo.description}</p>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6">
      
      {[
        ["SKU", generalInfo.sku],
        ["Category", generalInfo.category],
        ["Brand", generalInfo.brand],
        ["Unit Cost", generalInfo.unitCost],
        ["Selling Price", generalInfo.sellingPrice],
        ["Reorder Level", generalInfo.reorderLevel],
        ["Warehouse Location", generalInfo.location],
      ].map(([label, value]) => (
        <div key={label}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
          <p className="text-sm  text-slate-800">{value}</p>
        </div>
      ))}
    </div>
  </div>
  </div>
);

const PurchaseHistoryTab = () => (
  <div className="p-8 overflow-x-auto animate-in fade-in duration-300">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100">
          {["Order ID", "Date", "Supplier", "Qty", "Total Cost", "Status"].map((h) => (
            <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-3 pr-4 last:pr-0">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {purchaseHistory.map((row) => (
          <tr key={row.id} className="group hover:bg-slate-50/70 transition-colors">
            <td className="py-3.5 pr-4 font-mono text-xs text-indigo-500">{row.id}</td>
            <td className="py-3.5 pr-4 text-slate-500">{row.date}</td>
            <td className="py-3.5 pr-4 text-slate-700 font-medium">{row.supplier}</td>
            <td className="py-3.5 pr-4 text-slate-700">{row.qty} pcs</td>
            <td className="py-3.5 pr-4 text-slate-800 font-semibold">{row.cost}</td>
            <td className="py-3.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
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
  <div className="p-8 overflow-x-auto animate-in fade-in duration-300">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100">
          {["Date", "Type", "Reference", "Qty Change", "Balance"].map((h) => (
            <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-3 pr-4 last:pr-0">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {stockMovements.map((row, i) => {
          const isIn = row.qty > 0;
          const isNeutral = row.type === "Adjustment";
          return (
            <tr key={i} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3.5 pr-4 text-slate-500">{row.date}</td>
              <td className="py-3.5 pr-4">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isNeutral ? "bg-amber-50 text-amber-600 border border-amber-100" : 
                  isIn ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : 
                  "bg-rose-50 text-rose-500 border border-rose-100"
                }`}>
                  {row.type}
                </span>
              </td>
              <td className="py-3.5 pr-4 font-mono text-xs text-slate-400">{row.ref}</td>
              <td className="py-3.5 pr-4">
                <span className={`flex items-center gap-1 font-bold ${
                  isNeutral ? "text-amber-500" : isIn ? "text-emerald-600" : "text-rose-500"
                }`}>
                  {isNeutral ? <Minus size={13} /> : isIn ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {isIn ? "+" : ""}{row.qty} pcs
                </span>
              </td>
              <td className="py-3.5 text-slate-800 font-semibold">{row.balance} pcs</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────
const ProductDetail = () => {
  const [activeTab, setActiveTab] = useState("General Info");
  const tabs = ["General Info", "Purchase History", "Stock Movement", "Suppliers"];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-slate-50 to-indigo-50/30 p-4 font-sans selection:bg-indigo-100">
 

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-10 gap-6">
          <div>
       
            <div className="flex items-center gap-4">
              <h1 className="text-2xl  text-slate-900 tracking-tight">
                Wireless Headphones
              </h1>
              <span className="text-[10px] font-bold tracking-widest uppercase bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 shadow-sm">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">SKU: WH-2024-BLK</p>
          </div>
          
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-200 active:scale-95">
            <Edit3 size={16} /> Edit Product
          </button>
        </div>


       

          {/* RIGHT — Tabs + Content */}
          <div className="flex flex-col min-h-[450px]">
            {/* Tab Bar */}
             <nav className="flex gap-2 p-1.5 bg-slate-100/80 backdrop-blur rounded-2xl border border-slate-200/50 w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-xl text-sm transition-all ${activeTab === tab
                      ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
                      : "text-slate-500 hover:text-slate-900"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            {/* Tab Panel */}
            <div className="bg-white rounded-b-3xl rounded-tr-3xl border border-slate-100 shadow-xl shadow-slate-200/40 border-t-0 flex-grow">
              {activeTab === "General Info" && <GeneralInfoTab />}
              {activeTab === "Purchase History" && <PurchaseHistoryTab />}
              {activeTab === "Stock Movement" && <StockMovementTab />}
              {activeTab === "Suppliers" && (
                <div className="flex flex-col items-center justify-center p-20 text-center animate-in fade-in duration-500">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Package size={24} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-400 italic">No suppliers linked yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

  );
};

export default ProductDetail;