import  { useState, useMemo } from "react";
import { Trash2, PlusCircle, FileText, ShoppingCart, Home } from "lucide-react";
import Input from "@/components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";
import Title from "@/components/common/Title";
import { Switch } from "@/components/ui/switch";

// --- Types ---
type PurchaseType = "direct" | "grn" | "homemade";

interface LineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  batchNumber?: string; // Specific for GRN
}

const PurchaseManagement = () => {
  const [activeTab, setActiveTab] = useState<PurchaseType>("homemade");
  const [grnComplete, setGrnComplete] = useState(false);
const [grnNumber, setGrnNumber] = useState("");
  
  // 1. Form Metadata (Changes based on Tab)
  const [metaData, setMetaData] = useState({
    invoiceNumber: "",
    refNumber: "",
    paymentMethod: "cash",
  });

  // 2. State for the "Current Selection" row
  const [selection, setSelection] = useState({
    productId: "",
    supplierName: "",
    quantity: 0,
    unitPrice: 0,
    batchNumber: "",
  });

  // 3. State for the Table
  const [items, setItems] = useState<LineItem[]>([]);

  // Mock Data
  const productOptions = [
    { label: "Raw Cotton (Grade A)", value: "p1", price: 12.50 },
    { label: "Silk Thread", value: "p2", price: 45.00 },
  ];

  // --- Handlers ---
  const handleProductSelect = (val: string) => {
    const selected = productOptions.find((p) => p.value === val);
    setSelection((prev) => ({
      ...prev,
      productId: val,
      unitPrice: selected?.price || 0,
    }));
  };
// 1. Updated Mock Data (Adding labels)
  const SupplierOptions = [
    { label: "XYZ Supplies", value: "XyZ" },
    { label: "ABCD Manufacturing", value: "Abcd" },
  ];

  // 2. The Correct Handler
  const handleSupplierSelect = (val: string) => {
    // Find the supplier object if you need to extract more data (like an ID)
    // const selected = SupplierOptions.find((s) => s.value === val);
    
    setSelection((prev) => ({
      ...prev,
      supplierName: val, 
    }));
  };

  const addToList = () => {
    if (!selection.productId || selection.quantity <= 0) return;

    const selectedProduct = productOptions.find(p => p.value === selection.productId);
    
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: selectedProduct?.label || "Unknown",
      quantity: selection.quantity,
      unitPrice: selection.unitPrice,
      batchNumber: selection.batchNumber,
    };

    setItems([...items, newItem]);
    setSelection({ productId: "", supplierName: "", quantity: 0, unitPrice: 0, batchNumber: "" });
  };

  const removeItem = (id: string) => setItems(items.filter((i) => i.id !== id));

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [items]);

  return (
    <div className="p-8 ">
      <header className="mb-8">
        <Title
        title="Purchase Management"
        subtitle="Manage inventory intake via Direct, GRN, or Internal production."
        />
      
      </header>

      {/* --- TAB NAVIGATION --- */}
      <div className="flex gap-4 border-b mb-8 text-sm font-semibold">
        {[
          { id: "direct", label: "Direct Purchase", icon: ShoppingCart },
          { id: "grn", label: "GRN Purchase", icon: FileText },
          { id: "homemade", label: "Home-made Purchase", icon: Home },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as PurchaseType); setItems([]); }}
            className={`flex items-center gap-2 pb-3 px-2 transition-all border-b-2 ${
              activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- TOP META DATA (Changes by Tab) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
        {activeTab === "direct" && (
          <>
            <Input label="Invoice Number" placeholder="INV-2024-001" value={metaData.invoiceNumber} onChange={(e) => setMetaData({...metaData, invoiceNumber: e.target.value})} />
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-2">Payment Method</label>
              <ReusableSelect 
                options={[{label: "Cash", value: "cash"}, {label: "Bank Transfer", value: "bank"}]} 
                value={metaData.paymentMethod} 
                onValueChange={(v) => setMetaData({...metaData, paymentMethod: v})} 
              />
            </div>
          </>
        )}
     {activeTab === "grn" && (
  <>
    <Input
      label="PO Reference Number"
      placeholder="PO-88271"
      value={metaData.refNumber}
      onChange={(e) =>
        setMetaData({ ...metaData, refNumber: e.target.value })
      }
    />

    {/* GRN Complete Toggle */}
    <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
      <div>
        <p className="text-xs font-semibold text-gray-700">GRN Complete</p>
        <p className="text-[10px] text-gray-400">
          Toggle when goods are fully received
        </p>
      </div>

      <Switch
        checked={grnComplete}
        onCheckedChange={(val) => setGrnComplete(val)}
      />
    </div>

    {/* GRN Number Field */}
    {grnComplete && (
      <Input
        label="GRN Number"
        placeholder="GRN-2026-001"
        value={grnNumber}
        onChange={(e) => setGrnNumber(e.target.value)}
      />
    )}
  </>
)}
<div className="flex flex-col">
    <label className="text-[10px] font-bold text-gray-500 uppercase mb-2">
      Supplier/Warehouse Name
    </label>
    <ReusableSelect 
      value={selection.supplierName} 
      onValueChange={handleSupplierSelect} 
      options={SupplierOptions} 
      placeholder="Choose a supplier..." 
    />
  </div>
      </div>

      {/* --- ITEM SELECTION ROW --- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-blue-50/30 p-4 rounded-lg mb-8 border border-blue-100">
        <div className="md:col-span-4">
          <label className="text-[10px] font-bold text-blue-600 uppercase mb-2 block">Product Selection</label>
          <ReusableSelect value={selection.productId} onValueChange={handleProductSelect} options={productOptions} placeholder="Choose a product..." />
        </div>
        
     

        <div className={activeTab === "grn" ? "md:col-span-2" : "md:col-span-3"}>
          <label className="text-[10px] font-bold text-blue-600 uppercase mb-2 block">Quantity</label>
          <Input type="number" placeholder="0.00" value={selection.quantity} onChange={(e) => setSelection({...selection, quantity: Number(e.target.value)})} />
        </div>

        <div className={activeTab === "grn" ? "md:col-span-2" : "md:col-span-3"}>
          <label className="text-[10px] font-bold text-blue-600 uppercase mb-2 block">Unit Price ($)</label>
          <Input type="number" placeholder="0.00" value={selection.unitPrice} onChange={(e) => setSelection({...selection, unitPrice: Number(e.target.value)})} />
        </div>

        <button onClick={addToList}  className="md:col-span-2 bg-blue-500 hover:bg-blue-600 text-white font-bold h-[42px] rounded-md flex items-center justify-center gap-2 transition-all active:scale-95">
          <PlusCircle size={18} />  Add Item
        </button>
       
      </div>

      {/* --- TABLE --- */}
      <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-bold tracking-widest border-b">
            <tr>
              <th className="px-6 py-4">Line Item</th>
              <th className="px-6 py-4">Qty</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Subtotal</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {items.length === 0 ? (
              <tr><td colSpan={6} className="py-10 text-center text-gray-400 italic">No items added to the list yet.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-800">{item.name}</td>

                  <td className="px-6 py-4">{item.quantity.toFixed(2)}</td>
                  <td className="px-6 py-4">${item.unitPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">${(item.quantity * item.unitPrice).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="bg-gray-50 px-6 py-5 flex justify-end items-center gap-10 border-t">
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Grand Total</p>
            <p className="text-2xl font-black text-blue-600">${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="mt-10 flex justify-end gap-4">
        <button className="px-8 py-2.5 text-gray-500 font-bold text-sm hover:text-gray-800 transition-colors">Cancel</button>
        <GradientButton className="px-14 py-3 shadow-lg shadow-blue-100">Confirm {activeTab === "grn" ? "GRN" : "Purchase"}</GradientButton>
      </div>
    </div>
  );
};

export default PurchaseManagement;