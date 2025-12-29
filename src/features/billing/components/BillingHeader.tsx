import GradientButton from "@/components/ui/GradientButton";
import Input from "@/components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { Check, Clock, ScanBarcode, XCircle } from "lucide-react";
import React, { useState, useMemo } from "react";

interface BillingHeaderProps {
  items: {
    qty: number;
    tprice: number;
  }[];
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const options = [
    
    { label: "Completed", value: "COMPLETED", icon: <Check size={16} color="green" /> },
    { label: "Pending", value: "PENDING", icon: <Clock size={16} color="orange" />   },
    { label: "Cancelled", value: "CANCELLED", icon: <XCircle size={16} color="red" /> },
]

const BillingHeader: React.FC<BillingHeaderProps> = ({ items,setIsOpen }) => {
  const [includeGst, setIncludeGst] = useState(false);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("COMPLETED");

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
    <div className="w-full my-5 p-5 border-l-4 border-r-4 border-blue-400 bg-white rounded-2xl shadow-lg border flex flex-wrap items-center justify-between gap-6">

      {/* --- TOTAL QUANTITY BOX --- */}
      <div className="flex flex-col items-start bg-gray-50 p-4 rounded-xl border w-[180px]">
        <span className="text-gray-500 text-sm tracking-wide font-semibold">
          TOTAL QUANTITY
        </span>
        <span className="text-3xl font-bold mt-1 text-gray-800">{totalQty}</span>
      </div>

      {/* --- TOTAL PRICE BOX --- */}
      <div className="flex flex-col bg-gray-50 p-4 rounded-xl border w-[220px]">
        <span className="text-gray-500 text-sm tracking-wide font-semibold">
          TOTAL PRICE
        </span>

        <span className="text-3xl font-bold mt-1 text-gray-900">
          ₹{finalAmount.toFixed(2)}
        </span>

        {/* GST Toggle */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-green-500 text-xs">
            {includeGst ? `Including GST (${GST_PERCENT}%)` : "Excluding GST"}
        </span>

        <label className="relative inline-flex cursor-pointer">
            <input
            type="checkbox"
            className="sr-only peer"
            checked={includeGst}
            onChange={() => setIncludeGst(!includeGst)}
            />

            <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:bg-blue-500 transition-all"></div>

            <span className="absolute w-4 h-4 bg-white rounded-full top-0.5 left-1 peer-checked:translate-x-5 transition-all shadow"></span>
        </label>
        </div>

      </div>

      {/* VERTICAL DIVIDER */}
      <div className="w-[1px] h-16 bg-blue-300 hidden md:block"></div>

      {/* PHONE INPUT */}
      <div className="flex flex-col w-[280px]">
        <Input
        type="tel"
        placeholder="Enter mobile number"
        value={phone}
        onChange={(e)=> setPhone(e.target.value)}
        />
      </div>

      {/* ORDER STATUS */}
      <div className="flex flex-col">
        
        <ReusableSelect
        placeholder="Order Status"
        options={options}
        value={status}
        onValueChange={setStatus}
        />
      </div>

      {/* BUTTONS */}
      <div className="flex gap-3">
        
        <GradientButton
        onClick={()=>setIsOpen(true)}
        >
            Generate Bill
        </GradientButton>

        <GradientButton 
        type="submit"
      
        >
          <ScanBarcode size={30}/>
        </GradientButton>

        
      </div>
    </div>
  );
};

export default BillingHeader;
