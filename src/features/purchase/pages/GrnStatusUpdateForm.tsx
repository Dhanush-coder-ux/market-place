import React, { useState, useEffect } from "react";
import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";

interface GRNStatusUpdateProps {
  grnData: any;
  onClose: () => void;
  onUpdate: (updatedData: any) => void;
}

export const GRNStatusUpdateForm: React.FC<GRNStatusUpdateProps> = ({ grnData, onClose, onUpdate }) => {
  // State Management
  const [grnNumber, setGrnNumber] = useState(grnData?.grnNumber || "");
  const [status, setStatus] = useState(grnData?.status || "");
  const [partialInfo, setPartialInfo] = useState({ 
    quantity: grnData?.receivedQuantity || "", 
    reason: grnData?.partialReason || "" 
  });

  // Sync state if grnData prop changes externally
  useEffect(() => {
    if (grnData) {
      setGrnNumber(grnData.grnNumber || "");
      setStatus(grnData.status || "");
      setPartialInfo({
        quantity: grnData.receivedQuantity || "",
        reason: grnData.partialReason || ""
      });
    }
  }, [grnData]);

  const statusOptions = [
    { label: "Completed", value: "Completed" },
    { label: "Pending", value: "Pending" },
    { label: "Partial", value: "Partial" },
  ];

  const handleSubmit = () => {
    const updatedData = {
      ...grnData,
      status: status,
      grnNumber,
      ...(status === "Partial" && {
        receivedQuantity: partialInfo.quantity,
        partialReason: partialInfo.reason,
      }),
    };

    onUpdate(updatedData);
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* --- Product Table View --- */}
      <div className="border border-slate-100 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Order Items (PO: {grnData?.poReference || "N/A"})
          </span>
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
              <td className="px-4 py-3 text-slate-700 font-medium">
                {grnData?.product_name || "Wireless Headphones"}
              </td>
              <td className="px-4 py-3 text-right text-slate-600">
                {grnData?.quantity || 0}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        {/* --- GRN Number Input --- */}
        <div>
          <Input
            label="GRN Number"
            placeholder="e.g., GRN-2024-001"
            value={grnNumber}
            onChange={(e) => setGrnNumber(e.target.value)}
          />
        </div>

        {/* --- Status Selection (Native HTML Select) --- */}
        <div className="space-y-1"> 
          <label className="text-xs font-bold text-slate-500 uppercase block">
            Update Delivery Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
          >
            <option value="" disabled>Select status...</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
              <label className="text-xs font-bold text-slate-500 uppercase block">
                Reason for Partial Delivery
              </label>
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

      {/* --- Action Buttons --- */}
      <div className="pt-4 flex gap-3">
        <button 
          onClick={onClose} 
          className="flex-1 py-2.5 text-sm font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
        <GradientButton 
          className="flex-[2] py-2.5 shadow-lg shadow-blue-200" 
          onClick={handleSubmit}
        >
          Generate / Update GRN
        </GradientButton>
      </div>
    </div>
  );
};