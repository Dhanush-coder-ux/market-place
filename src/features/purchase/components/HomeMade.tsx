import React, { useState } from "react";
import { Eye, Filter, Search, MoreHorizontal, CheckCircle2, PlayCircle, Clock } from "lucide-react";
import Table from "@/components/common/Table";
import { FloatingFormCard } from "@/components/common/FloatingFormCard";
import Input from "@/components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";

// --- 1. Types ---
type ProductionStatus = "Planned" | "In Progress" | "Completed" | "Cancelled";

interface ProductionRecord {
  id: string;
  batchNumber: string;
  productName: string;
  targetQuantity: number;
  startDate: string;
  estCost: number;
  status: ProductionStatus;
}

// --- 2. Floating Form Component for Production ---
const ProductionStatusUpdateForm: React.FC<{ record: ProductionRecord | null, onClose: () => void }> = ({ record, onClose }) => {
  const [status, setStatus] = useState<string>(record?.status || "");
  const [actualYield, setActualYield] = useState<string>("");

  return (
    <div className="space-y-6">
      {/* Read-only Context */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Product</p>
          <p className="text-sm font-bold text-slate-800">{record?.productName}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Qty</p>
          <p className="text-sm font-bold text-blue-600">{record?.targetQuantity} Units</p>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Production Status</label>
          <ReusableSelect
            value={status}
            onValueChange={setStatus}
            options={[
              { label: "Planned", value: "Planned" },
              { label: "In Progress", value: "In Progress" },
              { label: "Completed", value: "Completed" },
              { label: "Cancelled", value: "Cancelled" },
            ]}
            placeholder="Select phase..."
          />
        </div>

        {/* Dynamic Field: Only ask for yield if they finish production */}
        {status === "Completed" && (
          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-4 animate-in zoom-in-95 duration-200">
            <Input
              label="Actual Yield (Units Produced)"
              type="number"
              placeholder="e.g. 98"
              value={actualYield}
              onChange={(e) => setActualYield(e.target.value)}
            />
            <p className="text-xs text-emerald-600/70 font-medium italic">
              *Entering this will automatically update your available inventory stock.
            </p>
          </div>
        )}
      </div>

      <div className="pt-4 flex gap-3">
        <button onClick={onClose} className="flex-1 py-2.5 text-sm font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
          Cancel
        </button>
        <GradientButton className="flex-[2] py-2.5" onClick={() => {
            console.log("Updating Production:", { status, actualYield });
            onClose();
        }}>
          Save Progress
        </GradientButton>
      </div>
    </div>
  );
};

// --- 3. Main Page Component ---
const HomeMade = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ProductionRecord | null>(null);

  // Mock Data
  const productionData: ProductionRecord[] = [
    { id: "1", batchNumber: "MFG-2024-001", productName: "Premium Silk Thread", targetQuantity: 500, startDate: "2024-03-12", estCost: 1250, status: "In Progress" },
    { id: "2", batchNumber: "MFG-2024-002", productName: "Hand-poured Candle", targetQuantity: 150, startDate: "2024-03-15", estCost: 450, status: "Planned" },
    { id: "3", batchNumber: "MFG-2024-003", productName: "Organic Cotton Shirt", targetQuantity: 100, startDate: "2024-03-01", estCost: 2200, status: "Completed" },
  ];

  const getStatusStyle = (status: ProductionStatus) => {
    switch (status) {
      case "Completed": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "In Progress": return "bg-blue-50 text-blue-700 border-blue-100";
      case "Planned": return "bg-slate-50 text-slate-600 border-slate-200";
      case "Cancelled": return "bg-red-50 text-red-700 border-red-100";
      default: return "bg-gray-50 text-gray-700";
    }
  };

  const getStatusIcon = (status: ProductionStatus) => {
    switch (status) {
      case "Completed": return <CheckCircle2 size={12} className="mr-1 inline" />;
      case "In Progress": return <PlayCircle size={12} className="mr-1 inline" />;
      case "Planned": return <Clock size={12} className="mr-1 inline" />;
      default: return null;
    }
  };

  const handleOpenForm = (e: React.MouseEvent, record: ProductionRecord) => {
    e.stopPropagation();
    setSelectedRecord(record);
    setOpen(true);
  };

  /* ================= COLUMNS DEFINITION ================= */
  const COLUMNS = [
    {
      key: "batchNumber" as keyof ProductionRecord,
      label: "Batch Number",
      render: (value: string) => <span className="font-bold text-indigo-600">{value}</span>,
    },
    {
      key: "productName" as keyof ProductionRecord,
      label: "Product Name",
      render: (value: string) => <span className="font-semibold text-slate-800">{value}</span>,
    },
    {
      key: "targetQuantity" as keyof ProductionRecord,
      label: "Target Qty",
      render: (value: number) => <span className="text-slate-600">{value} Units</span>,
    },
    {
      key: "startDate" as keyof ProductionRecord,
      label: "Start Date",
      render: (value: string) => <span className="text-slate-500">{value}</span>,
    },
    {
      key: "estCost" as keyof ProductionRecord,
      label: "Est. Cost",
      render: (value: number) => <span className="font-medium text-slate-900">${value.toLocaleString()}</span>,
    },
    {
      key: "status" as keyof ProductionRecord,
      label: "Status",
      render: (value: ProductionStatus) => (
        <div className="flex justify-start">
          <span className={`flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${getStatusStyle(value)}`}>
            {getStatusIcon(value)}
            {value}
          </span>
        </div>
      ),
    },
    {
      key: "action" as any, 
      label: "Actions",
      render: (_:any, record: ProductionRecord) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={(e) => handleOpenForm(e, record)} 
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
            title="Update Production Phase"
          >
            <Eye size={18} />
          </button>
          <button 
            onClick={(e) => e.stopPropagation()} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      
      {/* FLOATING CARD MODAL */}
      <FloatingFormCard
        isOpen={open}
        onClose={() => setOpen(false)}
        title={selectedRecord ? `Update Batch: ${selectedRecord.batchNumber}` : "Update Production"}
        maxWidth="max-w-md"
      >
        <ProductionStatusUpdateForm record={selectedRecord} onClose={() => setOpen(false)} />
      </FloatingFormCard>

      {/* TOOLBAR */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Search Batch, Product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <Filter size={16} /> Filter
        </button>
      </div>

      {/* TABLE */}
      <Table 
        columns={COLUMNS}
        data={productionData}
        rowKey="id"
      />
    </div>
  );
};

export default HomeMade;