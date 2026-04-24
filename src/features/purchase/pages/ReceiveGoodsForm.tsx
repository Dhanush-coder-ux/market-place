import React, { useState, useMemo } from 'react';
import {
  Search, Package, AlertCircle, Save, Building2, Calendar, FileText,
  Banknote, Smartphone, CreditCard, Landmark
} from 'lucide-react';
import { GradientButton } from '@/components/ui/GradientButton';
import { useApi } from '@/context/ApiContext';
import { ENDPOINTS, SHOP_ID } from '@/services/endpoints';
import { useHeader } from '@/context/HeaderContext';
import { useEffect } from 'react';

// --- Type Definitions ---
type PaymentMethod = "Cash" | "UPI" | "Card" | "Bank";

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
    unit_price: number; // Added to calculate the subtotal
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

// --- Sub-Component: Input ---
const Input = ({ label, type = "text", placeholder, leftIcon, value, onChange, className = "" }: any) => (
  <div>
    {label && <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>}
    <div className="relative">
      {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{leftIcon}</div>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full ${leftIcon ? 'pl-8' : 'px-3'} py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${className}`}
      />
    </div>
  </div>
);

// --- Sub-Component: PO Fetcher ---
const POFetcher = ({ onFetch, isLoading }: { onFetch: (id: string) => void, isLoading: boolean }) => {
  const [inputId, setInputId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputId.trim() && !isLoading) onFetch(inputId.trim());
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
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            required
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="transition-opacity" style={{ opacity: isLoading ? 0.7 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
        <GradientButton icon={<Search size={16} />}>
          {isLoading ? 'Fetching...' : 'Fetch PO'}
        </GradientButton>
      </div>
    </form>
  );
};

// --- Sub-Component: The Main GRN Form ---
const GRNForm = ({ poData, onSubmit }: { poData: PurchaseOrder, onSubmit: (payload: GRNPayload) => void }) => {
  const { setBottomActions } = useHeader();
  // Global Fields State
  const [globalData, setGlobalData] = useState({
    received_date: new Date().toISOString().split("T")[0],
    received_by: "Current Admin",
    warehouse: "",
    notes: ""
  });

  // Financial & Payment State
  const [charges, setCharges] = useState<{ transport: number | string, other: number | string }>({ transport: "", other: "" });
  const [payment, setPayment] = useState<{ method: PaymentMethod, amountPaid: number | string }>({ method: "Cash", amountPaid: "" });
  const [costMethod, setCostMethod] = useState<string>("By Unit");

  // Table Items State
  const [items, setItems] = useState(() => poData.items.map(item => ({
    ...item,
    remaining: item.ordered - item.received,
    receiveNow: "",
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
    let subtotal = 0;
    let isTableValid = true;

    items.forEach(item => {
      totalOrdered += item.ordered;
      const recNow = Number(item.receiveNow) || 0;
      totalReceivedNow += recNow;
      totalRemainingAfter += (item.remaining - recNow);
      subtotal += recNow * item.unit_price;

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

    // Financial Math
    const transportCost = Number(charges.transport) || 0;
    const otherCost = Number(charges.other) || 0;
    const gstAmount = subtotal * 0.18; // Assuming 18% GST
    const grandTotal = subtotal + transportCost + otherCost + gstAmount;
    const outstanding = grandTotal - (Number(payment.amountPaid) || 0);

    const isGlobalValid = !!globalData.warehouse && !!globalData.received_date && !!globalData.received_by;

    return { 
      totalOrdered, 
      totalReceivedNow, 
      totalRemainingAfter, 
      isValid: isTableValid && isGlobalValid,
      subtotal,
      gstAmount,
      grandTotal,
      outstanding,
      totalQty: totalReceivedNow
    };
  }, [items, globalData, charges, payment]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!stats.isValid) return;

    const payload: GRNPayload = {
      po_id: poData.id,
      ...globalData,
      received_items: items
        .filter(item => Number(item.receiveNow) > 0)
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

  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="hidden md:flex flex-col items-end mr-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Grand Total</span>
          <span className="text-xl font-black text-slate-900 leading-none">₹{stats.grandTotal.toLocaleString()}</span>
        </div>
        <GradientButton 
          onClick={handleSubmit}
          disabled={!stats.isValid}
          className="rounded-xl shadow-md text-xs px-8 h-8 flex items-center"
          icon={<Save size={18} />}
        >
          Submit GRN
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, stats, globalData, items]);

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT SIDE: Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden flex flex-col h-full">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Order Summary</h2>
          </div>

          <div className="p-6 space-y-5 flex-1">
            <div className="flex justify-between items-center text-slate-600">
              <span className="text-sm font-medium">Subtotal (Product Cost)</span>
              <span className="font-semibold text-slate-800">
                ₹{stats.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
              <Input
                label="Transport Charges"
                type="number"
                placeholder="0.00"
                leftIcon={<span className="text-slate-400 text-sm font-medium">₹</span>}
                value={charges.transport as any}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCharges({ ...charges, transport: e.target.value ? Number(e.target.value) : "" })}
              />

              <Input
                label="Other Charges (Loading etc.)"
                type="number"
                placeholder="0.00"
                leftIcon={<span className="text-slate-400 text-sm font-medium">₹</span>}
                value={charges.other as any}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCharges({ ...charges, other: e.target.value ? Number(e.target.value) : "" })}
              />
            </div>

          </div>

          <div className="p-6 bg-white text-black mt-auto">
            <span className="block text-black-400 text-xs font-bold uppercase tracking-widest mb-1">Total Purchase Cost</span>
            <span className="text-4xl font-bold tracking-tight">
              ₹{stats.grandTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* RIGHT SIDE: Payment Details & Distributor */}
        <div className="space-y-6 h-full flex flex-col">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden flex-1">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-5 w-1 bg-emerald-500 rounded-full"></div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Payment Details</h2>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { id: "Cash", icon: <Banknote size={20} strokeWidth={1.5} /> },
                { id: "UPI", icon: <Smartphone size={20} strokeWidth={1.5} /> },
                { id: "Card", icon: <CreditCard size={20} strokeWidth={1.5} /> },
                { id: "Bank", icon: <Landmark size={20} strokeWidth={1.5} /> }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPayment({ ...payment, method: m.id as PaymentMethod })}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${
                    payment.method === m.id
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="mb-1.5">{m.icon}</div>
                  <span className="text-xs font-bold">{m.id}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 bg-slate-50/80 p-5 rounded-xl border border-slate-100 items-center">
              <div className="flex-1 w-full">
                <Input
                  label="Amount Paid Now (₹)"
                  type="number"
                  className="!text-lg !font-bold !text-blue-700 placeholder:!text-blue-300"
                  value={payment.amountPaid as any}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPayment({ ...payment, amountPaid: e.target.value ? Number(e.target.value) : "" })}
                  placeholder={stats.grandTotal.toString()}
                />
              </div>
              <div className="w-px h-12 bg-slate-200 hidden sm:block"></div>
              <div className="flex-1 w-full flex flex-col justify-center sm:items-end sm:text-right">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Outstanding
                </span>
                <span className={`text-2xl font-bold ${stats.outstanding > 0 ? "text-orange-500" : "text-emerald-500"}`}>
                  ₹{stats.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Distributor Cost Card */}
          <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col gap-4 text-black">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Distributor Cost Split
              </span>
              
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="flex items-center bg-white p-1 rounded-lg border border-slate-700">
                  {["By Unit", "By Value"].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setCostMethod(method)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
                        costMethod === method 
                          ? "bg-blue-500 text-white shadow-sm" 
                          : "text-slate-400 hover:text-black hover:bg-white"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                <button type="button" className="px-5 py-2 text-xs font-bold text-slate-900 bg-white border border-transparent rounded-lg shadow-sm hover:bg-slate-100 active:bg-slate-200 transition-all duration-200 flex items-center gap-2">
                  Distributor Cost
                </button>
              </div>
            </div>

            <div className="flex items-baseline mt-2">
              <span className="text-3xl font-bold tracking-tight">
                ₹{stats.grandTotal.toLocaleString()}
              </span>
              {costMethod === "By Unit" && (
                <span className="ml-3 text-sm font-medium text-blue-300 bg-blue-500/20 px-2.5 py-1 rounded-md border border-blue-500/30">
                  ~₹{stats.totalQty > 0 ? (stats.grandTotal / stats.totalQty).toLocaleString(undefined, { maximumFractionDigits: 2 }) : 0} <span className="text-blue-400/70 text-xs">/ unit</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 sticky top-0 bg-slate-50 z-10 w-1/4">Product</th>
                <th className="p-4 sticky top-0 bg-slate-50 z-10">Ordered</th>
                <th className="p-4 sticky top-0 bg-slate-50 z-10">Rcvd Prev.</th>
                <th className="p-4 sticky top-0 bg-slate-50 z-10 text-blue-600">Remaining</th>
                <th className="p-4 sticky top-0 bg-slate-50 z-10 w-32">Receive Now *</th>
                <th className="p-4 sticky top-0 bg-slate-50 z-10">Base Cost</th>
                <th className="p-4 sticky top-0 bg-slate-50 z-10 w-40">Allocated</th>
                <th className="p-4 sticky top-0 bg-slate-50 z-10 w-48">Reason (If Partial)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => {
                if (item.remaining === 0) return null;

                const recNow = Number(item.receiveNow) || 0;
                const isPartial = item.receiveNow !== "" && recNow < item.remaining;
                const isError = recNow > item.remaining || (item.receiveNow !== "" && recNow < 0);

                // Calculate allocations for this row
                const baseCost = Number(item.unit_price) || 0;
                const transportCost = Number(charges.transport) || 0;
                const otherCost = Number(charges.other) || 0;
                const totalCharges = transportCost + otherCost;
                
                let allocated = 0;
                if (costMethod === "By Unit" && stats.totalQty > 0) {
                  allocated = totalCharges / stats.totalQty;
                } else if (costMethod === "By Value" && stats.subtotal > 0) {
                  allocated = (baseCost / stats.subtotal) * totalCharges;
                }
                const finalCost = baseCost + allocated;

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
                    <td className="p-4 text-sm font-medium text-slate-600">
                      ₹{baseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600">
                      {recNow > 0 ? (
                        <div className="flex flex-col justify-center text-xs text-slate-500 bg-white/80 px-2.5 py-2 rounded-lg border border-slate-200 shadow-sm w-full">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400">Alloc</span> 
                            <span className="font-medium">₹{allocated.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-slate-100 gap-2">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400">Final</span> 
                            <span className="font-bold text-blue-600">₹{finalCost.toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-slate-300 font-medium">-</div>
                      )}
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
      </div>
    </form>
  );
};

// --- Main Page Component ---
export default function ReceiveGoodsPage() {
  const { getData, postData } = useApi();
  const [poData, setPoData] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPO = async (id: string) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getData(ENDPOINTS.PURCHASES, {
        type: "PO CREATE",
        shop_id: SHOP_ID,
        q: id,
        limit: "10",
        offset: "1",
      });
      if (!res) throw new Error("Failed to fetch PO");
      const records: any[] = Array.isArray(res.data) ? res.data : [res.data];
      const match = records.find(r => r.id.startsWith(id) || r.id.slice(0, 8).toUpperCase() === id.toUpperCase());
      if (!match) throw new Error(`No GRN purchase found for "${id}". Enter a valid PO ID prefix.`);
      const products: any[] = match.datas?.grn_products ?? match.datas?.purchase_products ?? [];
      setPoData({
        id: match.id.slice(0, 8).toUpperCase(),
        supplier: String(match.datas?.supplier ?? "—"),
        po_date: String(match.datas?.receipt_date ?? match.datas?.purchase_date ?? "—"),
        expected_delivery: String(match.datas?.expected_delivery ?? "—"),
        status: String(match.datas?.status ?? "Pending"),
        items: products.map((p: any, i: number) => ({
          product_id: String(p.barcode ?? p.product_id ?? `ITEM-${i + 1}`),
          name: String(p.product_name ?? p.name ?? "Item"),
          ordered: Number(p.quantity ?? p.qty ?? 0),
          received: 0,
          unit_price: Number(p.unit_price ?? p.price ?? 0),
        })),
      });
    } catch (err: any) {
      setError(err.message || "Failed to fetch PO");
      setPoData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const submitGRN = async (payload: GRNPayload) => {
    const res = await postData(ENDPOINTS.PURCHASES, {
      shop_id: SHOP_ID,
      type: "PO_UPDATE",
      datas: payload,
    });
    if (res) {
      setPoData(null);
      setError("");
    }
  };

  return (
    <div className="max-w-7xl mx-auto font-sans text-slate-800 bg-slate-50/50 min-h-screen p-6">
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