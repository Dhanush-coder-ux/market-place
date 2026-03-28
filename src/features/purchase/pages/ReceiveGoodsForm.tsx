import React, { useState, useMemo } from 'react';
import { Search, Package, AlertCircle, Save, Building2, Calendar, FileText } from 'lucide-react';
// import toast from 'react-hot-toast'; // Assuming you use react-hot-toast for notifications

// Type Definitions
type PurchaseOrder = {
  id: string;
  supplier: string;
  po_date: string;
  expected_delivery: string;
  status: string;
  items: Array<{
    product_id: string;
    name: string;
    ordered: number;
    received: number;
  }>;
};

type GRNPayload = {
  po_id: string;
  received_date: string;
  received_by: string;
  warehouse: string;
  notes: string;
  received_items: Array<{
    product_id: string;
    received_qty: number;
    reason?: string;
  }>;
};

const WAREHOUSES = ["Main Hub (WH-01)", "East Wing (WH-02)", "Cold Storage (WH-03)"];
const REASONS = ["Damaged", "Missing", "Supplier Delay", "Other"];

// --- Sub-Component: PO Fetcher ---
const POFetcher = ({ onFetch, isLoading }: { onFetch: (id: string) => void, isLoading: boolean }) => {
  const [inputId, setInputId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputId.trim()) onFetch(inputId.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-end gap-4">
      <div className="flex-1 max-w-sm">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Purchase Order ID</label>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            placeholder="e.g. PO-2026-001"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            required
          />
        </div>
      </div>
      <button 
        type="submit" 
        disabled={isLoading || !inputId.trim()}
        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
      >
        {isLoading ? "Fetching..." : "Fetch PO"}
      </button>
    </form>
  );
};

// --- Sub-Component: The Main GRN Form ---
const GRNForm = ({ poData, onSubmit }: { poData: PurchaseOrder, onSubmit: (payload: GRNPayload) => void }) => {
  // Global Fields State
  const [globalData, setGlobalData] = useState({
    received_date: new Date().toISOString().split("T")[0],
    received_by: "Current Admin", // Mock auth user
    warehouse: "",
    notes: ""
  });

  // Table Items State
  const [items, setItems] = useState(() => poData.items.map(item => ({
    ...item,
    remaining: item.ordered - item.received,
    receiveNow: "", // empty string allows placeholder to show
    reason: "",
    customReason: ""
  })));

  // Handlers
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    // Clear reason if fully received
    if (field === "receiveNow" && Number(value) === newItems[index].remaining) {
      newItems[index].reason = "";
      newItems[index].customReason = "";
    }
    setItems(newItems);
  };

  // Validation & Calculations
  const stats = useMemo(() => {
    let totalOrdered = 0;
    let totalReceivedNow = 0;
    let totalRemainingAfter = 0;
    let isTableValid = true;

    items.forEach(item => {
      totalOrdered += item.ordered;
      const recNow = Number(item.receiveNow) || 0;
      totalReceivedNow += recNow;
      totalRemainingAfter += (item.remaining - recNow);

      // Validate quantity bounds
      if (item.receiveNow === "" || recNow < 0 || recNow > item.remaining) {
        isTableValid = false;
      }
      // Validate reason presence for partials
      if (recNow < item.remaining) {
        if (!item.reason || (item.reason === "Other" && !item.customReason.trim())) {
          isTableValid = false;
        }
      }
    });

    const isGlobalValid = !!globalData.warehouse && !!globalData.received_date && !!globalData.received_by;

    return { totalOrdered, totalReceivedNow, totalRemainingAfter, isValid: isTableValid && isGlobalValid };
  }, [items, globalData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stats.isValid) return;

    const payload: GRNPayload = {
      po_id: poData.id,
      ...globalData,
      received_items: items
        .filter(item => Number(item.receiveNow) > 0) // Only send items actually received
        .map(item => ({
          product_id: item.product_id,
          received_qty: Number(item.receiveNow),
          ...(Number(item.receiveNow) < item.remaining ? { 
            reason: item.reason === "Other" ? item.customReason : item.reason 
          } : {})
        }))
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* 1. PO Details Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-8 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Purchase Order</p>
            <h2 className="text-xl font-bold text-slate-900">{poData.id}</h2>
          </div>
        </div>
        
        <div className="flex gap-8">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Building2 size={12}/> Supplier</p>
            <p className="text-sm font-semibold text-slate-800">{poData.supplier}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar size={12}/> Expected By</p>
            <p className="text-sm font-semibold text-slate-800">{poData.expected_delivery}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
            <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${poData.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
              {poData.status}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 sticky top-0 bg-slate-50 z-10 w-1/3">Product</th>
                <th className="p-4 sticky top-0 bg-slate-50 z-10">Ordered</th>
                <th className="p-4 sticky top-0 bg-slate-50 z-10">Rcvd Prev.</th>
                <th className="p-4 sticky top-0 bg-slate-50 z-10 text-blue-600">Remaining</th>
                <th className="p-4 sticky top-0 bg-slate-50 z-10 w-48">Receive Now *</th>
                <th className="p-4 sticky top-0 bg-slate-50 z-10 w-64">Reason (If Partial)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => {
                if (item.remaining === 0) return null; // Hide already completed rows

                const recNow = Number(item.receiveNow) || 0;
                const isPartial = item.receiveNow !== "" && recNow < item.remaining;
                const isError = recNow > item.remaining || (item.receiveNow !== "" && recNow < 0);

                return (
                  <tr key={item.product_id} className={`transition-colors ${isPartial ? 'bg-orange-50/40' : 'hover:bg-slate-50/50'}`}>
                    <td className="p-4">
                      <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.product_id}</p>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600">{item.ordered}</td>
                    <td className="p-4 text-sm font-medium text-slate-600">{item.received}</td>
                    <td className="p-4 text-sm font-bold text-blue-600">{item.remaining}</td>
                    <td className="p-4">
                      <input 
                        type="number"
                        min="0"
                        max={item.remaining}
                        value={item.receiveNow}
                        onChange={(e) => handleItemChange(idx, "receiveNow", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm font-semibold outline-none transition-all ${isError ? 'border-red-400 focus:ring-red-500 ring-1 ring-red-400' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'}`}
                      />
                      {isError && <span className="text-[10px] text-red-500 font-bold mt-1 block">Max {item.remaining}</span>}
                    </td>
                    <td className="p-4">
                      {isPartial && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-200">
                          <select
                            value={item.reason}
                            onChange={(e) => handleItemChange(idx, "reason", e.target.value)}
                            className={`w-full px-2 py-2 border rounded-md text-xs outline-none ${!item.reason ? 'border-orange-400 ring-1 ring-orange-400' : 'border-slate-200'}`}
                          >
                            <option value="">Select reason...</option>
                            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          {item.reason === "Other" && (
                             <input 
                               type="text"
                               placeholder="Specify reason..."
                               value={item.customReason}
                               onChange={(e) => handleItemChange(idx, "customReason", e.target.value)}
                               className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-orange-400"
                             />
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Global Fields & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Global Details */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-5">
           <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Receiving Date *</label>
            <input type="date" required value={globalData.received_date} onChange={e => setGlobalData({...globalData, received_date: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Received By *</label>
            <input type="text" required value={globalData.received_by} onChange={e => setGlobalData({...globalData, received_by: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Warehouse Location *</label>
            <select required value={globalData.warehouse} onChange={e => setGlobalData({...globalData, warehouse: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Select Location...</option>
              {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Remarks / Notes</label>
            <textarea rows={1} value={globalData.notes} onChange={e => setGlobalData({...globalData, notes: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Optional notes..."/>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Receiving Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600"><span>Total Ordered:</span> <span className="font-semibold">{stats.totalOrdered}</span></div>
              <div className="flex justify-between text-slate-900 font-bold"><span>Receiving Now:</span> <span className="text-lg text-blue-600">{stats.totalReceivedNow}</span></div>
              <div className="flex justify-between text-slate-600"><span>Remaining After:</span> <span className="font-semibold">{stats.totalRemainingAfter}</span></div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-5 h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
               <div className="h-full bg-slate-400 transition-all" style={{ width: `${((stats.totalOrdered - stats.totalRemainingAfter - stats.totalReceivedNow) / stats.totalOrdered) * 100}%` }} title="Previously Received"/>
               <div className="h-full bg-blue-500 transition-all relative overflow-hidden" style={{ width: `${(stats.totalReceivedNow / stats.totalOrdered) * 100}%` }}>
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iNCI+PHBhdGggZD0iTS0xMCAzMCBMMzAgLTEwIE0wIDQwIEw0MCAwIE0xMCA1MCBMNTAgMTAiIC8+PC9nPjwvc3ZnPg==')] opacity-30" />
               </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={!stats.isValid}
            className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2 shadow-sm"
          >
            <Save size={18} /> Submit GRN
          </button>
        </div>

      </div>
    </form>
  );
};

// --- Main Page Component ---
export default function ReceiveGoodsPage() {
  const [poData, setPoData] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

const fetchPO = async (id: string) => {
    setIsLoading(true);
    setError("");
    try {
      // 1. Simulate a realistic network loading delay
      await new Promise(r => setTimeout(r, 600)); 
      
      // 2. Our dummy database
      const mockDatabase: Record<string, PurchaseOrder> = {
        "PO-2026-001": {
          id: "PO-2026-001", supplier: "Apex Industrial Supplies", po_date: "2026-03-15", expected_delivery: "2026-03-25", status: "Partial",
          items: [
            { product_id: "PROD-101", name: "Heavy Duty Racking", ordered: 50, received: 20 },
            { product_id: "PROD-102", name: "Pallet Jack (Manual)", ordered: 5, received: 5 }, // Fully received
            { product_id: "PROD-103", name: "Safety Helmets (Yellow)", ordered: 100, received: 0 }
          ]
        },
        "PO-2026-002": {
          id: "PO-2026-002", supplier: "TechDistro Global", po_date: "2026-03-20", expected_delivery: "2026-03-28", status: "Pending",
          items: [
            { product_id: "TECH-001", name: "Barcode Scanners", ordered: 25, received: 0 },
            { product_id: "TECH-002", name: "Thermal Label Printers", ordered: 10, received: 0 }
          ]
        },
        "PO-2026-003": {
          id: "PO-2026-003", supplier: "Office Essentials Co.", po_date: "2026-03-01", expected_delivery: "2026-03-10", status: "Partial",
          items: [
            { product_id: "OFF-99", name: "Ergonomic Chairs", ordered: 12, received: 10 },
          ]
        }
      };

      // 3. Search the dummy database
      const searchId = id.toUpperCase().trim();
      const foundPO = mockDatabase[searchId];

      if (!foundPO) {
        throw new Error("PO not found. Try 'PO-2026-001', 'PO-2026-002', or 'PO-2026-003'.");
      }
      
      setPoData(foundPO);
    } catch (err: any) {
      setError(err.message || "Failed to fetch PO");
      setPoData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const submitGRN = async (payload: GRNPayload) => {
    console.log("Submitting to FastAPI:", payload);
    // try {
    //   const response = await fetch('http://localhost:8000/grn/receive', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(payload)
    //   });
    //   if (!response.ok) throw new Error("Submission failed");
    //   toast.success("Goods Received Successfully!");
    //   setPoData(null); // Reset page
    // } catch (err) {
    //   toast.error("Failed to submit GRN");
    // }
    alert("GRN Payload logged to console! Success.");
    setPoData(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans text-slate-800 bg-slate-50/50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
          <Package className="text-blue-600" /> Goods Receipt Note (GRN)
        </h1>
        <p className="text-slate-500 mt-1">Record incoming inventory against an existing Purchase Order.</p>
      </div>

      <POFetcher onFetch={fetchPO} isLoading={isLoading} />

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2 font-medium">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {poData && <GRNForm poData={poData} onSubmit={submitGRN} />}
    </div>
  );
}