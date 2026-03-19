import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Phone, ScanBarcode, User,
  UserCircle2, IndianRupee, ShoppingBag,
  Percent, Sparkles, Wallet, AlertCircle,
  PlusCircle, Loader2, CheckCircle2, CreditCard,
  Banknote, Smartphone, X, ChevronRight
} from "lucide-react";
import { BillingItem, InvoicePayload } from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CartItem {
  id: string;
  name: string;
  qty: number;
  tprice: number;
}

type PaymentMode = "cash" | "upi" | "credit";

interface CustomerData {
  id: string;
  name: string;
  phone: string;
  outstanding: number;
  creditLimit: number;
  totalSpent: number;
}



interface BillingHeaderProps {
  items:BillingItem[];
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onInvoiceReady?: (payload: InvoicePayload) => void;
}

interface ToastMessage {
  id: string;
  type: "error" | "warning" | "success";
  message: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GST_PERCENT = 18;
const PHONE_MIN_LENGTH = 10;
const DEBOUNCE_MS = 600;

// ─── Mock API ────────────────────────────────────────────────────────────────

const fetchCustomerByPhone = async (phone: string): Promise<CustomerData | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const DB: Record<string, CustomerData> = {
        "9988776655": { id: "3", name: "Rajapandi", phone: "9988776655", outstanding: 15000, creditLimit: 30000, totalSpent: 45000 },
        "9988776656": { id: "4", name: "Suresh",    phone: "9988776656", outstanding: 35000, creditLimit: 30000, totalSpent: 80000 },
        "9988776657": { id: "5", name: "Priya",     phone: "9988776657", outstanding: 0,     creditLimit: 20000, totalSpent: 12000 },
      };
      resolve(DB[phone] ?? null);
    }, DEBOUNCE_MS);
  });
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatINR = (amount: number, decimals = 2) =>
  amount.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const round2 = (n: number) => Math.round(n * 100) / 100;

const generateToastId = () => Math.random().toString(36).slice(2);

// ─── Sub-components ───────────────────────────────────────────────────────────

const Toast: React.FC<{ toasts: ToastMessage[]; onDismiss: (id: string) => void }> = ({ toasts, onDismiss }) => {
  const colorMap = {
    error:   "bg-red-50 border-red-200 text-red-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };
  const iconMap = {
    error:   <AlertCircle size={14} className="shrink-0 mt-0.5" />,
    warning: <AlertCircle size={14} className="shrink-0 mt-0.5" />,
    success: <CheckCircle2 size={14} className="shrink-0 mt-0.5" />,
  };
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-[12px] font-semibold shadow-sm animate-in slide-in-from-right duration-200 ${colorMap[t.type]}`}>
          {iconMap[t.type]}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
};

interface InputFieldProps {
  label?: string;
  name: string;
  type?: string;
  maxLength?: number;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  icon: React.ReactNode;
  error?: string;
  rightElement?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({
  label, name, type = "text", maxLength, placeholder, value,
  onChange, disabled, icon, error, rightElement
}) => (
  <div className="flex flex-col gap-1">
    {label && <label htmlFor={name} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{label}</label>}
    <div className={`relative flex items-center rounded-xl border transition-all duration-150 bg-white ${
      error ? "border-red-300 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100"
             : "border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50"
    } ${disabled ? "opacity-60 bg-slate-50" : ""}`}>
      <span className="pl-3 text-slate-400 shrink-0">{icon}</span>
      <input
        id={name}
        name={name}
        type={type}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="flex-1 h-10 px-3 text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-300 disabled:cursor-not-allowed"
      />
      {rightElement && <span className="pr-3 shrink-0">{rightElement}</span>}
    </div>
    {error && <p className="text-[11px] text-red-500 font-medium pl-1 flex items-center gap-1"><AlertCircle size={10} />{error}</p>}
  </div>
);

interface PaymentButtonProps {
  mode: PaymentMode;
  active: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({ mode, active, disabled, icon, label, onClick }) => {
  const baseStyles = "flex-1 flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border transition-all duration-150 text-[11px] font-bold";
  const activeStyles: Record<PaymentMode, string> = {
    cash:   "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm shadow-emerald-100",
    upi:    "bg-violet-50 border-violet-300 text-violet-700 shadow-sm shadow-violet-100",
    credit: "bg-blue-50 border-blue-300 text-blue-700 shadow-sm shadow-blue-100",
  };
  const inactiveStyles = "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500";
  const disabledStyles = "opacity-40 cursor-not-allowed pointer-events-none";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${active ? activeStyles[mode] : inactiveStyles} ${disabled ? disabledStyles : ""}`}
    >
      {icon}
      {label}
      {active && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const BillingHeader: React.FC<BillingHeaderProps> = ({ items, setIsOpen, onInvoiceReady }) => {

  // ── Amount state
  const [includeGst, setIncludeGst] = useState(false);

  // ── Customer state
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [wasAutofilled, setWasAutofilled] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [customerNotFound, setCustomerNotFound] = useState(false);

  // ── Payment state
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");

  // ── Validation errors
  const [errors, setErrors] = useState<{ phone?: string; name?: string }>({});

  // ── Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // ── Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Computed values ────────────────────────────────────────────────────────

  const totalQty = useMemo(() => items.reduce((s, i) => s + (i.qty || 0), 0), [items]);
  const totalAmount = useMemo(() => items.reduce((s, i) => s + (i.tprice || 0), 0), [items]);
  const gstAmount = useMemo(() => round2((totalAmount * GST_PERCENT) / 100), [totalAmount]);
  const finalAmount = useMemo(() => includeGst ? round2(totalAmount + gstAmount) : totalAmount, [includeGst, totalAmount, gstAmount]);

  const creditRemaining = customerData ? Math.max(0, customerData.creditLimit - customerData.outstanding) : 0;
  const isCreditExceeded = customerData ? customerData.outstanding >= customerData.creditLimit : false;
  const isCreditAllowed = !!customerData && !isCreditExceeded;

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

  // ─── Toast helpers ──────────────────────────────────────────────────────────

  const pushToast = useCallback((type: ToastMessage["type"], message: string) => {
    const id = generateToastId();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Reset customer state ───────────────────────────────────────────────────

  const resetCustomer = useCallback(() => {
    setCustomerData(null);
    setCustomerNotFound(false);
    setIsLoadingCustomer(false);
    if (wasAutofilled) {
      setCustomerName("");
      setWasAutofilled(false);
    }
    // If credit was selected but customer is cleared, fall back to cash
    setPaymentMode((prev) => prev === "credit" ? "cash" : prev);
  }, [wasAutofilled]);

  // ─── Phone change handler ───────────────────────────────────────────────────

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(raw);
    setErrors((prev) => ({ ...prev, phone: undefined }));

    if (raw.length < PHONE_MIN_LENGTH) {
      resetCustomer();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    // Debounced lookup
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
          if (data.outstanding >= data.creditLimit) {
            pushToast("warning", `${data.name}'s credit limit is exceeded.`);
          }
        } else {
          setCustomerData(null);
          setCustomerNotFound(true);
        }
      } catch {
        pushToast("error", "Could not fetch customer. Try again.");
      } finally {
        setIsLoadingCustomer(false);
      }
    }, 0); // Already debounced by the outer setTimeout pattern
  };

  // ─── Cleanup debounce on unmount ────────────────────────────────────────────

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  // ─── Switch credit → cash if credit becomes unavailable ────────────────────

  useEffect(() => {
    if (paymentMode === "credit" && !isCreditAllowed) {
      setPaymentMode("cash");
    }
  }, [isCreditAllowed, paymentMode]);

  // ─── Invoice generation guard ───────────────────────────────────────────────

  const handleGenerateInvoice = () => {
    const newErrors: typeof errors = {};

    if (totalQty === 0) {
      pushToast("error", "Cart is empty. Add items before generating an invoice.");
      return;
    }

    if (!customerName.trim() && !phone.trim()) {
      newErrors.name = "Enter customer name or phone";
    }

    if (phone && phone.length < PHONE_MIN_LENGTH) {
      newErrors.phone = "Phone must be 10 digits";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      pushToast("error", "Please fix the errors before proceeding.");
      return;
    }

    if (paymentMode === "credit" && !isCreditAllowed) {
      pushToast("error", "Credit purchase not allowed. Customer has exceeded their credit limit.");
      return;
    }

    const payload: InvoicePayload = {
      customer: customerData,
      customerName: customerName.trim(),
      phone: phone.trim(),
      items,
      totalQty,
      totalAmount,
      gstAmount,
      finalAmount,
      includeGst,
      paymentMode,
      date: new Date().toISOString(),
    };

    onInvoiceReady?.(payload);
    setIsOpen(true);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Toast toasts={toasts} onDismiss={dismissToast} />

      <div className="w-full h-fullflex flex-col overflow-hidden font-sans">

        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
         
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
            {today}
          </span>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 border border-blue-200 px-4 py-3 flex flex-col gap-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <ShoppingBag size={9} strokeWidth={3} /> Items
              </p>
              <p className="text-2xl font-semibold text-slate-800 tabular-nums">{totalQty}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-blue-200  px-4 py-3 flex flex-col gap-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <IndianRupee size={9} strokeWidth={3} /> Base
              </p>
              <p className="text-2xl font-semibold text-slate-800 tabular-nums">{formatINR(totalAmount, 0)}</p>
            </div>
          </div>

          {/* Total payable hero */}
          <div className="rounded-2xl bg-white px-5 py-5 flex flex-col items-center relative overflow-hidden border border-blue-300">
            <p className="text-[10px] font-bold text-black uppercase tracking-widest mb-2">Total Payable</p>
            <div className="flex items-start">
              <span className="text-xl font-bold text-black mt-1.5 mr-0.5">₹</span>
              <span className="text-3xl font-semibold text-black tracking-tight tabular-nums">
                {Math.floor(finalAmount).toLocaleString("en-IN")}
              </span>
              <span className="text-xl font-bold text-black mt-auto mb-1 ml-0.5">
                .{String(Math.round((finalAmount % 1) * 100)).padStart(2, "0")}
              </span>
            </div>

            {includeGst && (
              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                Incl. GST ₹{formatINR(gstAmount)}
              </p>
            )}

            {/* GST toggle */}
            <div className="mt-4 flex items-center gap-2.5">
              <button
                onClick={() => setIncludeGst((v) => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  includeGst ? "bg-indigo-500" : "bg-slate-300"
                }`}
                aria-label="Toggle GST"
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                  includeGst ? "translate-x-4" : "translate-x-0"
                }`} />
              </button>
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Percent size={10} strokeWidth={3} />
                {includeGst ? `GST ${GST_PERCENT}% included` : "Exclude GST"}
              </span>
            </div>
          </div>

          {/* GST breakdown */}
          {includeGst && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 space-y-1.5">
              {[
                { label: "Subtotal",               value: totalAmount },
                { label: `CGST (${GST_PERCENT / 2}%)`, value: gstAmount / 2 },
                { label: `SGST (${GST_PERCENT / 2}%)`, value: gstAmount / 2 },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-indigo-500">{label}</span>
                  <span className="text-[12px] font-bold text-indigo-700 tabular-nums">₹{formatINR(value)}</span>
                </div>
              ))}
              <div className="h-px bg-indigo-200 my-1" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-indigo-700">Grand Total</span>
                <span className="text-[13px] font-black text-indigo-700 tabular-nums">₹{formatINR(finalAmount)}</span>
              </div>
            </div>
          )}

          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          {/* ── Customer Section ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCircle2 size={15} strokeWidth={2.5} className="text-slate-400" />
                <p className="text-[11px]  text-slate-400 uppercase tracking-widest">Customer</p>
              </div>
              {isLoadingCustomer && <Loader2 size={14} className="text-indigo-400 animate-spin" />}
              {customerData && !isLoadingCustomer && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={10} /> Verified
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {/* Phone */}
              <InputField
                name="customerPhone"
                type="tel"
                maxLength={10}
                icon={<Phone size={15} />}
                placeholder="10-digit phone number"
                value={phone}
                onChange={handlePhoneChange}
                error={errors.phone}
                rightElement={
                  phone.length === 10 && !isLoadingCustomer ? (
                    customerData
                      ? <CheckCircle2 size={14} className="text-emerald-500" />
                      : customerNotFound
                        ? <AlertCircle size={14} className="text-amber-400" />
                        : null
                  ) : null
                }
              />

              {/* Name */}
              <InputField
                name="customerName"
                icon={<User size={15} />}
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                disabled={!!customerData}
                error={errors.name}
              />

              {/* Not found */}
              {customerNotFound && (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <span className="text-[11px] text-amber-700 font-medium">No record found for this number.</span>
                  <button className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                    <PlusCircle size={12} strokeWidth={2.5} /> Add New
                  </button>
                </div>
              )}

              {/* Credit summary */}
              {customerData && (
                <div className={`p-3.5 rounded-xl border ${
                  isCreditExceeded ? "bg-red-50/60 border-red-200" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Wallet size={12} className="text-slate-400" /> Credit Summary
                    </p>
                    <span className="text-[10px] font-bold text-slate-400">#{customerData.id}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-2.5">
                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCreditExceeded ? "bg-red-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, (customerData.outstanding / customerData.creditLimit) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[9px] font-semibold text-slate-400">₹0</span>
                      <span className="text-[9px] font-semibold text-slate-400">₹{formatINR(customerData.creditLimit, 0)} limit</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      { label: "Outstanding",    value: customerData.outstanding,  color: "text-slate-700" },
                      { label: "Credit Limit",   value: customerData.creditLimit,  color: "text-slate-700" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">{label}</span>
                        <span className={`font-semibold tabular-nums ${color}`}>₹{formatINR(value, 0)}</span>
                      </div>
                    ))}
                    <div className="h-px bg-slate-200/60" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-bold">Remaining</span>
                      <span className={`font-black tabular-nums ${isCreditExceeded ? "text-red-600" : "text-emerald-600"}`}>
                        ₹{formatINR(creditRemaining, 0)}
                      </span>
                    </div>
                  </div>

                  {isCreditExceeded && (
                    <div className="mt-2.5 flex items-start gap-1.5 text-red-700 bg-red-100/60 p-2 rounded-lg">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" strokeWidth={2.5} />
                      <p className="text-[10px] font-bold leading-tight">
                        Credit limit exceeded. Clear dues before allowing credit purchase.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          {/* ── Payment Mode ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CreditCard size={15} strokeWidth={2.5} className="text-slate-400" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Payment Mode</p>
            </div>
            <div className="flex gap-2">
              <PaymentButton
                mode="cash"
                active={paymentMode === "cash"}
                icon={<Banknote size={16} strokeWidth={2} />}
                label="Cash"
                onClick={() => setPaymentMode("cash")}
              />
              <PaymentButton
                mode="upi"
                active={paymentMode === "upi"}
                icon={<Smartphone size={16} strokeWidth={2} />}
                label="UPI / Card"
                onClick={() => setPaymentMode("upi")}
              />
              <PaymentButton
                mode="credit"
                active={paymentMode === "credit"}
                disabled={!isCreditAllowed}
                icon={<Wallet size={16} strokeWidth={2} />}
                label="Credit"
                onClick={() => isCreditAllowed && setPaymentMode("credit")}
              />
            </div>
            {paymentMode === "credit" && customerData && (
              <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 pl-1">
                <ChevronRight size={12} /> Adding to khata · ₹{formatINR(creditRemaining, 0)} remaining
              </p>
            )}
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/40 shrink-0 flex flex-col gap-2.5">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-150"
          >
            <ScanBarcode size={16} strokeWidth={2.5} />
            Scan Product
          </button>

          <button
            type="button"
            onClick={handleGenerateInvoice}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-bold text-white transition-all duration-150 ${
              totalQty === 0
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm shadow-blue-200 active:scale-[0.98]"
            }`}
            disabled={totalQty === 0}
          >
            <Sparkles size={15} strokeWidth={2.5} />
            Generate Invoice
            {totalQty > 0 && (
              <span className="ml-auto bg-white/20 rounded-lg px-2 py-0.5 text-[11px]">
                ₹{formatINR(finalAmount, 0)}
              </span>
            )}
          </button>
        </div>

      </div>
    </>
  );
};

export default BillingHeader;

// ─── Usage Example ────────────────────────────────────────────────────────────
//
// const SAMPLE_ITEMS: CartItem[] = [
//   { id: "1", name: "Basmati Rice 5kg", qty: 2, tprice: 850 },
//   { id: "2", name: "Toor Dal 1kg",     qty: 3, tprice: 210 },
//   { id: "3", name: "Sunflower Oil 1L", qty: 1, tprice: 180 },
// ];
//
// <BillingHeader
//   items={SAMPLE_ITEMS}
//   setIsOpen={setModalOpen}
//   onInvoiceReady={(payload) => console.log("Invoice payload:", payload)}
// />
//
// Test phone numbers:
//   9988776655 → Rajapandi (credit ok)
//   9988776656 → Suresh    (credit exceeded)
//   9988776657 → Priya     (fresh account)
//   any other  → Not found → Add New prompt