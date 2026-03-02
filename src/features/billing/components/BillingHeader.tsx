import React, { useState, useMemo } from "react";
import {
  Phone, ScanBarcode, User, Receipt,
  UserCircle2, IndianRupee, ShoppingBag,
  Percent,  Sparkles
} from "lucide-react";
import Input from "@/components/ui/Input";

interface BillingHeaderProps {
  items: { qty: number; tprice: number }[];
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const GST_PERCENT = 18;

const BillingHeader: React.FC<BillingHeaderProps> = ({ items, setIsOpen }) => {
  const [includeGst, setIncludeGst] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");

  const totalQty = useMemo(() => items.reduce((s, i) => s + (i.qty || 0), 0), [items]);
  const totalAmount = useMemo(() => items.reduce((s, i) => s + (i.tprice || 0), 0), [items]);
  const gstAmount = (totalAmount * GST_PERCENT) / 100;
  const finalAmount = includeGst ? totalAmount + gstAmount : totalAmount;

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div
      className="w-full h-full bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
            <Receipt size={15} strokeWidth={2.5} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-800 tracking-tight leading-none">Invoice</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-none">Summary</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
          {today}
        </span>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 flex flex-col gap-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <ShoppingBag size={9} strokeWidth={3} /> Items
            </p>
            <p className="text-2xl font-black text-slate-800" style={{ fontVariantNumeric: "tabular-nums" }}>
              {totalQty}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 flex flex-col gap-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <IndianRupee size={9} strokeWidth={3} /> Base
            </p>
            <p className="text-2xl font-black text-slate-800" style={{ fontVariantNumeric: "tabular-nums" }}>
              {totalAmount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Total payable hero */}
        <div className="rounded-2xl z-0 bg-indigo-600 px-5 py-5 flex flex-col items-center relative overflow-hidden shadow-lg shadow-indigo-200">
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full bg-white/5" />

          <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-2 z-10">
            Total Payable
          </p>

          <div className="flex items-start z-10">
            <span className="text-xl font-bold text-indigo-300 mt-1.5 mr-0.5">₹</span>
            <span
              className="text-5xl font-black text-white tracking-tight"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {Math.floor(finalAmount).toLocaleString("en-IN")}
            </span>
            <span className="text-xl font-bold text-indigo-300 mt-auto mb-1 ml-0.5">
              .{String(Math.round((finalAmount % 1) * 100)).padStart(2, "0")}
            </span>
          </div>

          {/* GST line */}
          {includeGst && (
            <p className="text-[11px] font-semibold text-indigo-300 mt-1 z-10">
              Incl. GST ₹{gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          )}

          {/* GST toggle */}
          <div className="mt-4 flex items-center gap-2.5 z-10">
            <button
              onClick={() => setIncludeGst(!includeGst)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                includeGst ? "bg-white" : "bg-indigo-400/50"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full shadow ring-0 transition-transform duration-200 ${
                  includeGst ? "translate-x-4 bg-indigo-600" : "translate-x-0 bg-white"
                }`}
              />
            </button>
            <span className="text-[11px] font-bold text-indigo-200 flex items-center gap-1">
              <Percent size={10} strokeWidth={3} />
              {includeGst ? `GST ${GST_PERCENT}% included` : "Exclude GST"}
            </span>
          </div>
        </div>

        {/* GST breakdown (shown only when active) */}
        {includeGst && (
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 space-y-1.5">
            {[
              { label: "Subtotal", value: totalAmount },
              { label: `CGST (${GST_PERCENT / 2}%)`, value: gstAmount / 2 },
              { label: `SGST (${GST_PERCENT / 2}%)`, value: gstAmount / 2 },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-indigo-500">{label}</span>
                <span className="text-[12px] font-bold text-indigo-700" style={{ fontVariantNumeric: "tabular-nums" }}>
                  ₹{value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
            <div className="h-px bg-indigo-200 my-1" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-indigo-700">Grand Total</span>
              <span className="text-[13px] font-black text-indigo-700" style={{ fontVariantNumeric: "tabular-nums" }}>
                ₹{finalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* Customer section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <UserCircle2 size={15} strokeWidth={2.5} className="text-slate-400" />
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Customer</p>
          </div>
          <div className="space-y-2.5">
            <Input
              name="customerName"
              leftIcon={<User size={15} className="text-slate-400" />}
              placeholder="Customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-white h-10 text-sm rounded-xl border-slate-200 focus:border-indigo-400"
            />
            <Input
              name="customerPhone"
              type="tel"
              leftIcon={<Phone size={15} className="text-slate-400" />}
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-white h-10 text-sm rounded-xl border-slate-200 focus:border-indigo-400"
            />
          </div>
        </div>
      </div>

      {/* ── Footer actions ── */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/40 shrink-0 flex flex-col gap-2.5">
        <button
          type="button"
          className="
            w-full flex items-center justify-center gap-2
            px-4 py-2.5 rounded-xl
            border border-slate-200 bg-white
            text-[13px] font-bold text-slate-600
            hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50
            transition-all duration-150
          "
        >
          <ScanBarcode size={16} strokeWidth={2.5} />
          Scan Product
        </button>

        <button
          onClick={() => setIsOpen(true)}
          className="
            w-full flex items-center justify-center gap-2
            px-4 py-3 rounded-xl
            bg-indigo-600 hover:bg-indigo-700
            text-white text-[14px] font-black tracking-wide
            shadow-md shadow-indigo-200 hover:shadow-indigo-300
            transition-all duration-150 hover:-translate-y-0.5
          "
        >
          <Sparkles size={15} strokeWidth={2.5} />
          Generate Invoice
        </button>
      </div>
    </div>
  );
};

export default BillingHeader;