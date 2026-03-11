import React, { useState, useEffect } from "react";
import Input from "@/components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";

interface GRNStatusUpdateProps {
  grnData: any; 
  onClose: () => void;
  onUpdate: (updatedData: any) => void; // NEW: Function to send data back to table
}


export const GRNStatusUpdateForm: React.FC<GRNStatusUpdateProps> = ({ grnData, onClose, onUpdate }) => {
  const [status, setStatus] = useState(grnData?.status || "Partial");
  const [grnNumber, setGrnNumber] = useState(grnData?.grnNumber || "");
  const [partialInfo, setPartialInfo] = useState({ quantity: "", reason: "" });

  // Update form state if a different row is clicked
  useEffect(() => {
    setStatus(grnData?.status || "Pending");
    setGrnNumber(grnData?.grnNumber || "");
  }, [grnData]);

  const statusOptions = [
    { label: "Completed", value: "Completed" },
    { label: "Pending", value: "Pending" },
    { label: "Partial", value: "Partial" },
  ];

  const handleSubmit = () => {
    // Send the updated data back to the parent component
    onUpdate({
      ...grnData,
      status,
      grnNumber,
      // You can also pass partialInfo here if your table needs it
    });
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* --- Product Table View --- */}
      <div className="border border-slate-100 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Order Items (PO: {grnData?.poReference})</span>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-white text-[10px] font-bold text-slate-400 uppercase border-b">
            <tr>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2 text-right">Ordered Qty</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-50">
              <td className="px-4 py-3 text-slate-700 font-medium">{grnData?.product_name || "Wireless Headphones"}</td>
              <td className="px-4 py-3 text-right text-slate-600">{grnData?.quantity || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        {/* --- NEW: GRN Number Input --- */}
        <div>
          <Input 
            label="GRN Number" 
            placeholder="e.g., GRN-2024-001" 
            value={grnNumber} 
            onChange={(e) => setGrnNumber(e.target.value)} 
          />
        </div>

        {/* --- Status Selection --- */}
 {/* --- Status Selection --- */}
<div className="relative z-[9999]"> {/* ADDED RELATIVE AND Z-INDEX */}
  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
    Update Delivery Status
  </label>
  <ReusableSelect
    value={status}
    onValueChange={(val) => setStatus(val)}
    options={statusOptions}
    placeholder="Select status..."
  />
</div>

        {/* --- Conditional Partial Inputs --- */}
        {status === "Partial" && (
          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <Input
              label="Received Quantity"
              type="number"
              placeholder="Enter units received"
              value={partialInfo.quantity}
              onChange={(e) => setPartialInfo({ ...partialInfo, quantity: e.target.value })}
            />
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase block">Reason for Partial Delivery</label>
              <textarea
                className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all min-h-[100px]"
                placeholder="Describe the issue (e.g., Shortage, Damages)..."
                value={partialInfo.reason}
                onChange={(e) => setPartialInfo({ ...partialInfo, reason: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 flex gap-3">
        <button onClick={onClose} className="flex-1 py-2.5 text-sm font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
          Cancel
        </button>
        <GradientButton className="flex-[2] py-2.5 shadow-lg shadow-blue-200" onClick={handleSubmit}>
          Generate / Update GRN
        </GradientButton>
      </div>
    </div>
  );
};