import { ReceiptText, User, CreditCard,  Download, Printer, CircleDot } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import { useState } from "react";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { options } from "./BillingHeader";

const BillingDetailView = () => {
  const [paymentType, setPaymentType] = useState<"Online" | "Offline">("Online"); // Toggle state
  const [status, setStatus] = useState("COMPLETED");

  const billingInfo = {
    billNo: "BILL-10245",
    date: "2025-01-12",
    customerName: "John Doe",
    phone: "+91 98765 43210",
    paymentMethod: "Online Payment",
    status: "Completed",
    gstPercent: 18,
    items: [
      { code: "PRD001", name: "Blue T-Shirt", qty: 2, price: 499, tprice: 998 },
      { code: "PRD003", name: "Formal Shoes", qty: 1, price: 1999, tprice: 1999 },
    ],
  };
  
  const subTotal = billingInfo.items.reduce((sum, i) => sum + i.tprice, 0);
  const gstAmt = (subTotal * billingInfo.gstPercent) / 100;
  const totalAmt = subTotal + gstAmt;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-full">Invoice Detail</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            {billingInfo.billNo}
          </h2>
          <p className="text-gray-500 text-sm">Issued on {billingInfo.date}</p>
        </div>

        <div>
              <ReusableSelect
                placeholder="Order Status"
                options={options}
                value={status}
                onValueChange={setStatus}
                />
        </div>
        {/* Payment Type Toggle Buttons */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setPaymentType("Offline")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              paymentType === "Offline" 
                ? "bg-white text-gray-900 shadow-md" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <CircleDot size={16} className={paymentType === "Offline" ? "text-orange-500" : "text-transparent"} />
            Offline
          </button>
          <button
            onClick={() => setPaymentType("Online")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              paymentType === "Online" 
                ? "bg-white text-gray-900 shadow-md" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <CircleDot size={16} className={paymentType === "Online" ? "text-green-500" : "text-transparent"} />
            Online
          </button>
        </div>
      </div>

       <div className="flex items-center justify-center gap-4">
        <GradientButton icon={ <Printer size={18} />}>
         
          Generate Invoice
        </GradientButton>
        <GradientButton icon={ <Download size={18} />}>
         
          Generate Bill
        </GradientButton>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Bill Info */}
        <div className="relative group p-6 bg-white rounded-[24px] shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="absolute top-6 right-6 p-2 bg-blue-50 rounded-lg text-blue-500">
            <ReceiptText size={20} />
          </div>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Billing Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Bill Number</span>
              <span className="font-bold text-gray-800">{billingInfo.billNo}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Status</span>
               <span className={`px-3 py-1 bg-green-50 ${status==="COMPLETED" ? "text-green-600" : status==="PENDING" ? "text-orange-500" : status==="CANCELLED" ?  "text-red-600" : ''} rounded-full text-[10px] font-black uppercase`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="relative group p-6 bg-white rounded-[24px] shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="absolute top-6 right-6 p-2 bg-purple-50 rounded-lg text-purple-500">
            <User size={20} />
          </div>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Customer</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm font-bold text-gray-800">
              {billingInfo.customerName}
            </div>
            <div className="text-xs text-gray-500">{billingInfo.phone}</div>
          </div>
        </div>

        {/* Final Amount */}
        <div className="relative group p-6 bg-gray-900 rounded-[24px] shadow-xl text-white">
          <div className="absolute top-6 right-6 p-2 bg-white/10 rounded-lg text-white">
            <CreditCard size={20} />
          </div>
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Amount Due</h3>
          <div className="space-y-1">
            <div className="text-3xl font-black italic">₹{totalAmt.toLocaleString()}</div>
            <div className="text-[10px] text-white/50 tracking-tight">Includes ₹{gstAmt.toFixed(2)} GST ({billingInfo.gstPercent}%)</div>
          </div>
        </div>
      </div>


      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
          <h3 className="font-bold text-gray-800 uppercase tracking-tight text-sm">Purchased Items</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Code</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Qty</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Price</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {billingInfo.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-blue-600">{item.code}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-gray-100 rounded-md font-bold text-xs">{item.qty}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500 font-medium">₹{item.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-black text-gray-900">₹{item.tprice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      
        <div className="bg-gray-50 p-6 flex flex-col items-end gap-2 border-t border-gray-100">
           <div className="flex justify-between w-full max-w-[240px] text-sm text-gray-500">
             <span>Subtotal</span>
             <span className="font-bold text-gray-800">₹{subTotal.toFixed(2)}</span>
           </div>
           <div className="flex justify-between w-full max-w-[240px] text-sm text-gray-500">
             <span>GST ({billingInfo.gstPercent}%)</span>
             <span className="font-bold text-gray-800">₹{gstAmt.toFixed(2)}</span>
           </div>
           <div className="h-[1px] w-full max-w-[240px] bg-gray-200 my-1" />
           <div className="flex justify-between w-full max-w-[240px] text-lg font-black text-blue-600">
             <span>Grand Total</span>
             <span>₹{totalAmt.toFixed(2)}</span>
           </div>
        </div>
      </div>

   
     

    </div>
  );
};

export default BillingDetailView;