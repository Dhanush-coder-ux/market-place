import { GradientButton } from "@/components/ui/GradientButton";
import Input from "@/components/ui/Input";
import {  Phone, ScanBarcode, User,  Receipt, UserCircle2 } from "lucide-react";
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
    <div className="w-full my-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Top Bar: Title & Status (Optional) */}
      <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2 text-slate-700">
           <Receipt size={18} className="text-blue-600" />
           <span className="font-semibold text-sm tracking-wide uppercase">New Invoice</span>
        </div>
        <div className="text-xs font-medium text-slate-400">
           {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* --- LEFT: CUSTOMER DETAILS (Span 5 cols) --- */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
             <UserCircle2 className="text-slate-400" size={20} />
             <h3 className="text-sm font-semibold text-slate-800">Customer Details</h3>
          </div>
          
          <div className="space-y-3">
             <Input
                name="customerName"
                type="text"
                leftIcon={<User size={18} className="text-slate-400"/>}
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-white"
             />
             <Input
                name="customerPhone"
                type="tel"
                leftIcon={<Phone size={18} className="text-slate-400"/>}
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-white"
             />
          </div>
        </div>

        {/* --- MIDDLE: VERTICAL DIVIDER (Hidden on mobile) --- */}
        <div className="hidden lg:block lg:col-span-1 h-full border-r border-slate-100 mx-auto w-px"></div>

        {/* --- RIGHT: PAYMENT SUMMARY & ACTIONS (Span 6 cols) --- */}
        <div className="lg:col-span-6 flex flex-col justify-between h-full">
          
          {/* Summary Stats */}
          <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-6 pb-6 border-b border-dashed border-slate-200">
             
             {/* Qty Badge */}
             <div className="text-center sm:text-left">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Items</p>
                <div className="inline-flex items-center justify-center bg-blue-50 text-blue-700 font-bold px-4 py-1.5 rounded-lg text-lg border border-blue-100">
                   {totalQty}
                </div>
             </div>

             {/* Total Price */}
             <div className="text-right">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Grand Total</p>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                  <span className="text-2xl align-top text-slate-400 font-medium mr-1">₹</span>
                  {finalAmount.toFixed(2)}
                </h1>
                
                {/* GST Toggle Switch */}
                <div className="flex items-center justify-end gap-2 mt-2">
                   <span className={`text-xs font-medium ${includeGst ? 'text-blue-600' : 'text-slate-400'}`}>
                      {includeGst ? '+ 18% GST Applied' : 'Tax Excluded'}
                   </span>
                   <button
                     onClick={() => setIncludeGst(!includeGst)}
                     className={`
                       relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                       transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 
                       focus-visible:ring-blue-600 focus-visible:ring-offset-2
                       ${includeGst ? 'bg-blue-600' : 'bg-slate-200'}
                     `}
                   >
                     <span
                       className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${includeGst ? 'translate-x-4' : 'translate-x-0'}`}
                     />
                   </button>
                </div>
             </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 justify-end">
            <GradientButton
               type="button"
               variant="outline"
               className="px-4"
               title="Scan Barcode"
            >
               <ScanBarcode size={20} className="text-slate-600" />
            </GradientButton>

            <GradientButton
               onClick={() => setIsOpen(true)}
               className="w-full sm:w-auto px-8"
            >
               Generate Invoice
            </GradientButton>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BillingHeader;