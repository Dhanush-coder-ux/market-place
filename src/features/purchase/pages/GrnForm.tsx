import React, { useState, useMemo } from "react";
import {
  Save,
  Plus,
  Trash2,
  Settings,
  ScanLine,
  Search,

  X
} from "lucide-react";

// Adjust these imports to match your folder structure
import Input from "@/components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";

// --- Types ---
type GRNStatus = "Completed" | "Pending" | "Partial";

export interface ProductItem {
  id: string;
  name: string;
  quantity: number | "";
  sellingPrice: number | "";
  // Advanced GRN fields (hidden behind settings toggle)
  storageLoc: string;
  batchNum: string;
  remarks: string;
}

interface GRNFormData {
  poReference: string;
  supplier: string;
  date: string;
  status: GRNStatus;
}

interface GRNFormProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

const supplierOptions = [
  { value: "sup-1", label: "Global Tech" },
  { value: "sup-2", label: "Mainstream Inc" },
  { value: "sup-3", label: "Apex Wholesale" },
];

const productOptions = [
  { value: "Wireless Headphones", label: "Wireless Headphones" },
  { value: "Mechanical Keyboard", label: "Mechanical Keyboard" },
  { value: "USB-C Hub", label: "USB-C Hub" }
];

const GRNForm: React.FC<GRNFormProps> = ({ onSubmit, onCancel }) => {
  // --- State Management ---
  const [grnDetails, setGrnDetails] = useState<GRNFormData>({
    poReference: "",
    supplier: "",
    date: new Date().toISOString().split("T")[0],
    status: "Pending",
  });

  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: Date.now().toString(),
      name: "",
      quantity: "",
      sellingPrice: "",
      storageLoc: "",
      batchNum: "",
      remarks: ""
    }
  ]);

  const [expandedProductIndex, setExpandedProductIndex] = useState<number | null>(null);

  // --- Calculations ---
  const stats = useMemo(() => {
    let totalQty = 0;
    let totalValue = 0;

    products.forEach(p => {
      const q = Number(p.quantity) || 0;
      const sp = Number(p.sellingPrice) || 0;
      totalQty += q;
      totalValue += (q * sp);
    });

    return { totalQty, totalValue, itemsCount: products.length };
  }, [products]);

  // --- Handlers ---
  const handleProductChange = (index: number, field: keyof ProductItem, value: any) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  const addProduct = () => {
    setProducts([...products, {
      id: Math.random().toString(),
      name: "",
      quantity: "",
      sellingPrice: "",
      storageLoc: "",
      batchNum: "",
      remarks: ""
    }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const toggleAdvanced = (index: number) => {
    setExpandedProductIndex(expandedProductIndex === index ? null : index);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      ...grnDetails,
      itemsCount: stats.itemsCount,
      totalValue: stats.totalValue,
      products
    };
    if (onSubmit) onSubmit(finalData);
    console.log("GRN Submitted:", finalData);
  };

  return (
    <div className="min-h-screen  font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Create New GRN</h1>
          <p className="text-sm text-slate-500">
            Receipt Note for PO: <span className="font-semibold text-slate-700">{grnDetails.poReference || "Unassigned"}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <GradientButton icon={<X size={16} />} variant="outline" onClick={onCancel}>
            Cancel
          </GradientButton>
         
          <GradientButton icon={<Save size={16} />} onClick={handleSubmit}>
            Save Record
          </GradientButton>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* ================= LEFT COLUMN (MAIN FORM) ================= */}
        <div className="flex-1 space-y-6">
          
          {/* 1. General Information */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">General Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Input 
                label="PO Reference"
                required
                placeholder="e.g. PO-9921"
                value={grnDetails.poReference}
                onChange={(e) => setGrnDetails({...grnDetails, poReference: e.target.value})}
              />
              <ReusableSelect
                label="Supplier"
                required={true as any}
                options={supplierOptions}
                value={grnDetails.supplier}
                onValueChange={(val) => setGrnDetails({...grnDetails, supplier: val})}
                placeholder="Select Supplier..."
              />
              <Input 
                label="Receipt Date"
                required
                type="date"
                value={grnDetails.date}
                onChange={(e) => setGrnDetails({...grnDetails, date: e.target.value})}
              />
            </div>
          </div>

          {/* 2. Quick Add Bar */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 shadow-inner flex items-center gap-4">
            <button className="p-3 bg-white text-blue-600 rounded-lg shadow-sm border border-blue-200 hover:bg-blue-50 transition flex items-center gap-2 font-semibold whitespace-nowrap">
              <ScanLine size={18} /> <span className="hidden sm:inline">Scan Barcode</span>
            </button>
            <div className="flex-1">
              <Input 
                onChange={() => {}}
                value={""}
                type="text" 
                placeholder="Type product name to add quickly..." 
                leftIcon={<Search size={18} />}
                className="!border-transparent focus:!border-blue-400 focus:!ring-blue-100 text-blue-900 placeholder:text-blue-300"
              />
            </div>
          </div>

          {/* 3. Product Entry */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Received Products</h2>
              <button type="button" onClick={addProduct} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 flex items-center gap-1">
                <Plus size={14} /> Add Row
              </button>
            </div>
            
            <div className="p-0">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500">
                <div className="col-span-5">Product Name</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-3">Selling Price ($)</div>
                <div className="col-span-2 text-right">Total ($)</div>
              </div>

              {/* Product Rows */}
              {products.map((product, index) => {
                const rowTotal = (Number(product.quantity) || 0) * (Number(product.sellingPrice) || 0);
                const isExpanded = expandedProductIndex === index;

                return (
                  <div key={product.id} className="border-b border-slate-100 last:border-0">
                    <div className="grid grid-cols-12 gap-3 p-4 items-center hover:bg-slate-50/50 transition-colors">
                      <div className="col-span-5">
                        <ReusableSelect
                          value={product.name}
                          onValueChange={(val) => handleProductChange(index, "name", val)}
                          options={productOptions}
                          placeholder="Select Product..."
                          className="!h-[42px] !py-2"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input 
                          type="number" 
                          placeholder="0" 
                          value={product.quantity as any} 
                          onChange={(e) => handleProductChange(index, "quantity", e.target.value)} 
                        />
                      </div>
                      <div className="col-span-3">
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          value={product.sellingPrice as any} 
                          onChange={(e) => handleProductChange(index, "sellingPrice", e.target.value)} 
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-3 h-[42px]">
                        <span className="font-semibold text-slate-700 text-sm">${rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <button type="button" onClick={() => toggleAdvanced(index)} className={`p-1.5 rounded-md transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}>
                          <Settings size={16} />
                        </button>
                        <button type="button" onClick={() => removeProduct(index)} disabled={products.length === 1} className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-md disabled:opacity-30">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Advanced Settings Panel for GRN */}
                    {isExpanded && (
                      <div className="p-5 bg-slate-50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-inner">
                        <Input label="Storage Location" placeholder="e.g. Warehouse A, Shelf 3" value={product.storageLoc} onChange={(e) => handleProductChange(index, "storageLoc", e.target.value)} />
                        <Input label="Batch Number" placeholder="BATCH-001" value={product.batchNum} onChange={(e) => handleProductChange(index, "batchNum", e.target.value)} />
                        <Input label="Remarks" placeholder="Any damage or notes?" value={product.remarks} onChange={(e) => handleProductChange(index, "remarks", e.target.value)} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

      

        </div>

        {/* ================= RIGHT COLUMN (SIDEBAR) ================= */}
        <div className="w-full xl:w-96 space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
              <div className="text-3xl font-semibold text-slate-700">{stats.itemsCount}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">Unique Items</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
              <div className="text-3xl font-black text-slate-700">{stats.totalQty}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Total Qty Received</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Value Summary</h2>
            </div>
            
            <div className="p-5 text-black">
              <div className="flex justify-between items-end">
                <div>
                  <span className="block text-slate-400 text-xs font-semibold uppercase mb-1">Total GRN Value</span>
                  <span className="font-semibold text-3xl">${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            
            <div className="p-5 bg-slate-50 border-t border-slate-100">
               <p className="text-xs text-slate-500 leading-relaxed">
                 This value is calculated automatically based on the received product quantities multiplied by their assigned selling prices.
               </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default GRNForm;