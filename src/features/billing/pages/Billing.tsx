import { useState, useCallback, useRef, useEffect } from "react";
import { 
   Phone, User, Loader2, 
  CheckCircle2, AlertCircle, PlusCircle, Wallet 
} from "lucide-react";

import Title from "../../../components/common/Title";
import BillingTable, { createEmptyRow } from "../components/BillingTable";
import BillingHeader from "../components/BillingHeader";
import BillingDetailView from "../components/BillingDetailView";
import Drawer from "@/components/common/Drawer";

import { BillingItem, InvoicePayload } from "../types";

// ─── Types & Mock API ────────────────────────────────────────────────────────
export interface CustomerData {
  id: string;
  name: string;
  phone: string;
  outstanding: number;
  creditLimit: number;
  totalSpent: number;
}

const formatINR = (amount: number, decimals = 2) =>
  amount.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fetchCustomerByPhone = async (phone: string): Promise<CustomerData | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const DB: Record<string, CustomerData> = {
        "9988776655": { id: "3", name: "Rajapandi", phone: "9988776655", outstanding: 15000, creditLimit: 30000, totalSpent: 45000 },
        "9988776656": { id: "4", name: "Suresh",    phone: "9988776656", outstanding: 35000, creditLimit: 30000, totalSpent: 80000 },
        "9988776657": { id: "5", name: "Priya",     phone: "9988776657", outstanding: 0,     creditLimit: 20000, totalSpent: 12000 },
      };
      resolve(DB[phone] ?? null);
    }, 600);
  });
};

const Billing = () => {
  // ── Table State
  const [items, setItems] = useState<BillingItem[]>([createEmptyRow()]);
  const [isOpen, setIsOpen] = useState(false);

  // ── Customer State
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [customerNotFound, setCustomerNotFound] = useState(false);
  const [wasAutofilled, setWasAutofilled] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived Credit Info
  const isCreditExceeded = customerData ? customerData.outstanding >= customerData.creditLimit : false;
  const creditRemaining = customerData ? Math.max(0, customerData.creditLimit - customerData.outstanding) : 0;

  // ── Handlers
  const handleItemsChange = useCallback((next: BillingItem[]) => setItems(next), []);

  const resetCustomer = useCallback(() => {
    setCustomerData(null);
    setCustomerNotFound(false);
    setIsLoadingCustomer(false);
    if (wasAutofilled) {
      setCustomerName("");
      setWasAutofilled(false);
    }
  }, [wasAutofilled]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(raw);

    if (raw.length < 10) {
      resetCustomer();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoadingCustomer(true);
      setCustomerNotFound(false);
      try {
        const data = await fetchCustomerByPhone(raw);
        if (data) {
          setCustomerData(data);
          setCustomerName(data.name);
          setWasAutofilled(true);
          setCustomerNotFound(false);
        } else {
          setCustomerData(null);
          setCustomerNotFound(true);
        }
      } catch {
        console.error("Failed to fetch customer");
      } finally {
        setIsLoadingCustomer(false);
      }
    }, 0);
  };

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleInvoiceReady = useCallback((payload: InvoicePayload) => {
    console.log("[Billing] Invoice payload ready:", payload);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] gap-4">
      {/* 1. Page Header */}
      <div className="shrink-0 flex justify-between">
        <Title title="Billing" subtitle="Manage and track your billing details" />
    
      </div>

      {/* 2. Customer Details Section (Top) */}
      <div className="shrink-0 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row gap-6">
        
        {/* Left: Inputs */}
        <div className="flex-1 flex flex-col gap-4 justify-center">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={15} /> Customer Details
            </h3>
            {isLoadingCustomer && <Loader2 size={14} className="text-indigo-400 animate-spin" />}
            {customerData && !isLoadingCustomer && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={10} /> Verified
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone Input */}
            <div className="relative flex items-center rounded-xl border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition-all bg-white h-11">
              <span className="pl-3 text-slate-400"><Phone size={16} /></span>
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit phone number"
                value={phone}
                onChange={handlePhoneChange}
                className="flex-1 h-full px-3 text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-300"
              />
              <span className="pr-3 shrink-0">
                {phone.length === 10 && !isLoadingCustomer && (
                  customerData ? <CheckCircle2 size={16} className="text-emerald-500" />
                  : customerNotFound ? <AlertCircle size={16} className="text-amber-400" />
                  : null
                )}
              </span>
            </div>

            {/* Name Input */}
            <div className="relative flex items-center rounded-xl border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition-all bg-white h-11">
              <span className="pl-3 text-slate-400"><User size={16} /></span>
              <input
                type="text"
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={!!customerData}
                className="flex-1 h-full px-3 text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-300 disabled:opacity-60 disabled:bg-slate-50"
              />
            </div>
          </div>

          {customerNotFound && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-3">
              <span className="text-[11px] text-amber-700 font-medium">No record found for this number.</span>
              <button className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700">
                <PlusCircle size={12} strokeWidth={2.5} /> Add New
              </button>
            </div>
          )}
        </div>

        {/* Right: Credit Summary */}
        <div className="w-full md:w-[320px] shrink-0">
          {customerData ? (
            <div className={`h-full p-4 rounded-xl border flex flex-col justify-center ${
              isCreditExceeded ? "bg-red-50/60 border-red-200" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet size={12} className="text-slate-400" /> Credit Summary
                </p>
                <span className="text-[10px] font-bold text-slate-400">#{customerData.id}</span>
              </div>

              <div className="mb-3">
                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isCreditExceeded ? "bg-red-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(100, (customerData.outstanding / customerData.creditLimit) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] font-semibold text-slate-500">
                  <span>Out: ₹{formatINR(customerData.outstanding, 0)}</span>
                  <span>Limit: ₹{formatINR(customerData.creditLimit, 0)}</span>
                </div>
              </div>

              {isCreditExceeded ? (
                <div className="flex items-start gap-1.5 text-red-700 bg-red-100/60 p-2 rounded-lg">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" strokeWidth={2.5} />
                  <p className="text-[10px] font-bold leading-tight">Credit limit exceeded. Clear dues to allow credit.</p>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                  <span className="text-slate-600 font-bold">Remaining Credit</span>
                  <span className="font-black tabular-nums text-emerald-600">₹{formatINR(creditRemaining, 0)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center p-4">
              <p className="text-xs text-slate-400 font-medium text-center">Enter a valid phone number to view credit limits.</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Split Content Area */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden gap-6 pb-4">
        
        {/* Left: Line-item table */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <BillingTable items={items} onItemsChange={handleItemsChange} />
        </div>

        {/* Right: Invoice Summary & Payment */}
        <div className="w-full lg:w-[380px] shrink-0 h-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <BillingHeader
            items={items}
            customerData={customerData}
            customerName={customerName}
            phone={phone}
            onInvoiceReady={handleInvoiceReady}
            setIsOpen={setIsOpen}
          />
        </div>
      </div>

      <Drawer isOpen={isOpen} title="Billing Details" onClose={() => setIsOpen(false)}>
        <BillingDetailView />
      </Drawer>
    </div>
  );
};

export default Billing;