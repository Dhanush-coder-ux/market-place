import { GradientButton } from "@/components/ui/GradientButton";
import Input from "@/components/ui/Input";
import { Phone, ScanBarcode, User, Receipt, UserCircle2 } from "lucide-react";
import React, { useState, useMemo } from "react";

interface BillingHeaderProps {
  items: {
    qty: number;
    tprice: number;
  }[];
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const BillingHeader: React.FC<BillingHeaderProps> = ({ items, setIsOpen }) => {
  const [includeGst, setIncludeGst] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");

  const GST_PERCENT = 18;

  const totalQty = useMemo(
    () => items.reduce((sum, item) => sum + (item.qty || 0), 0),
    [items]
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + (item.tprice || 0), 0),
    [items]
  );

  const finalAmount = includeGst
    ? totalAmount + (totalAmount * GST_PERCENT) / 100
    : totalAmount;

  return (
    // Added h-full to fill the sidebar height
    <div className="w-full h-full bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">

      {/* Header Title */}
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2 text-slate-700">
          <Receipt size={18} className="text-blue-600" />
          <span className="font-bold text-sm tracking-wide uppercase">Invoice Summary</span>
        </div>
        <div className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded">
          {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Scrollable Content inside sidebar (if customer form gets too long) */}
      <div className="p-5 flex-1 flex flex-col gap-6 overflow-y-auto">

        {/* Customer Details */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <UserCircle2 className="text-slate-400" size={18} />
            <h3 className="text-sm font-semibold text-slate-800">Customer</h3>
          </div>
          <div className="space-y-3">
            <Input
              name="customerName"
              leftIcon={<User size={16} className="text-slate-400" />}
              placeholder="Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-white h-10 text-sm"
            />
            <Input
              name="customerPhone"
              type="tel"
              leftIcon={<Phone size={16} className="text-slate-400" />}
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-white h-10 text-sm"
            />
          </div>
        </div>

        <hr className="border-dashed border-slate-200" />

        {/* Payment Summary */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Items</p>
              <p className="text-xl font-bold text-blue-600">{totalQty}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Base</p>
              <p className="text-xl font-bold text-slate-700">₹{totalAmount}</p>
            </div>
          </div>

          <div className="text-center p-5 bg-blue-50/50 rounded-xl border border-blue-100 border-dashed">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Payable</p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              <span className="text-2xl align-top text-slate-400 font-medium mr-1">₹</span>
              {finalAmount.toFixed(0)}
              <span className="text-lg text-slate-400 font-medium">.00</span>
            </h1>

            {/* GST Toggle */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setIncludeGst(!includeGst)}
                className={`
                       relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                       transition-colors duration-200 ease-in-out focus:outline-none 
                       ${includeGst ? 'bg-blue-600' : 'bg-slate-200'}
                     `}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${includeGst ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
              <span className={`text-xs font-semibold ${includeGst ? 'text-blue-600' : 'text-slate-400'}`}>
                {includeGst ? 'GST (18%) Added' : 'Tax Excluded'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions - Pushed to bottom via flex-col structure */}
      <div className="p-5 border-t border-slate-100 bg-slate-50/50 shrink-0 flex flex-col gap-3">
        <GradientButton
          type="button"
          variant="outline"
          className="w-full justify-center bg-white"
          title="Scan Barcode"
          icon={<ScanBarcode size={18} className="text-slate-600 mr-2" />}
        >

          Scan Product
        </GradientButton>

        <GradientButton
          onClick={() => setIsOpen(true)}
          className="w-full justify-center py-3text-lg shadow-blue-200 shadow-lg"
        >
          Generate Invoice
        </GradientButton>
      </div>

    </div>
  );
};

export default BillingHeader;