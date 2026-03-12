import React, { useState, useMemo } from "react";
import { Plus, Trash2, Save, X } from "lucide-react";
import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import { ReusableSelect } from "@/components/ui/ReusableSelect";

interface POItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

// --- MOCK DATABASE ---
// Replace this with your actual API fetch logic later
const mockPOData: Record<string, { vendor: string, poDate: string, items: POItem[] }> = {
  "PO-1001": {
    vendor: "Global Tech",
    poDate: "2026-03-10",
    items: [
      { id: "m1", productName: "Wireless Keyboard", quantity: 10, unitPrice: 45 },
      { id: "m2", productName: "Optical Mouse", quantity: 10, unitPrice: 25 }
    ]
  },
  "PO-1002": {
    vendor: "Mainstream Inc",
    poDate: "2026-03-12",
    items: [
      { id: "m3", productName: "27-inch Monitor", quantity: 5, unitPrice: 250 }
    ]
  }
};

export const DirectPurchaseOrder: React.FC = () => {
  const [poRefNo, setPoRefNo] = useState("");
  const [vendor, setVendor] = useState("");
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<POItem[]>([
    { id: "1", productName: "", quantity: 1, unitPrice: 0 }
  ]);

  // Calculations
  const subtotal = useMemo(() => 
    items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0), 
  [items]);
  
  const tax = subtotal * 0.10; // Assuming 10% tax
  const total = subtotal + tax;

  // Handlers
  const handlePoRefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPoRefNo(value);

    // Auto-populate logic if the PO Ref No matches our mock database
    if (mockPOData[value]) {
      const data = mockPOData[value];
      setVendor(data.vendor);
      setPoDate(data.poDate);
      setItems(data.items);
    }
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), productName: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof POItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
console.log(vendor);

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Create Direct Purchase Order</h1>
          <p className="text-sm text-slate-500">Issue a new PO directly to a vendor</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-2">
            <X size={16} /> Cancel
          </button>
          <GradientButton
            icon={<Save size={16} />}
            className="flex items-center gap-2 shadow-md">
            Save Purchase Order
          </GradientButton>
        </div>
      </div>

      {/* Changed grid to 4 columns to accommodate the PO Ref No field */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Input 
          label="PO Ref No" 
          type="text" 
          value={poRefNo} 
          onChange={handlePoRefChange} 
          placeholder="e.g. PO-1001"
        />

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase">Suppler</label>
        <ReusableSelect
        options={[
          { value: "Global Tech", label: "Global Tech" },
          { value: "Mainstream Inc", label: "Mainstream Inc" },
          { value: "Acme Corp", label: "Acme Corp" },
        ]}
        onValueChange={(val) => setVendor(val)}
        placeholder="Select Supplier.."
        />
        </div>
        
        <Input label="PO Date" type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} />
        <Input value={""} onChange={() => {}} label="Expected Delivery" type="date" />
      </div>

      {/* Items Table */}
      <div className="border border-slate-100 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-100">
            <tr>
              <th className="px-4 py-3">Product Description</th>
              <th className="px-4 py-3 w-32">Quantity</th>
              <th className="px-4 py-3 w-40">Unit Price ($)</th>
              <th className="px-4 py-3 w-32 text-right">Amount ($)</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item) => (
              <tr key={item.id} className="group hover:bg-slate-50/30 transition-colors">
                <td className="px-4 py-3">
                  <input 
                    type="text" 
                    placeholder="Search product..."
                    className="w-full bg-transparent outline-none focus:text-blue-600"
                    value={item.productName}
                    onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                  />
                </td>
                <td className="px-4 py-3">
                  <input 
                    type="number" 
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-400"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                  />
                </td>
                <td className="px-4 py-3">
                  <input 
                    type="number" 
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-400"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-700">
                  {(item.quantity * item.unitPrice).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <button 
          onClick={addItem}
          className="w-full py-4 text-sm font-medium text-blue-600 bg-white hover:bg-blue-50/50 flex items-center justify-center gap-2 border-t border-slate-100 transition-all"
        >
          <Plus size={16} /> Add Another Item
        </button>
      </div>

      {/* Summary Footer */}
      <div className="flex flex-col md:flex-row justify-between gap-8 pt-4">
        <div className="flex-1 space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase">Notes / Instructions</label>
          <textarea 
            className="w-full p-3 border border-slate-200 rounded-xl text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Any special instructions for the vendor..."
          />
        </div>
        
        <div className="w-full md:w-72 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal:</span>
            <span>${subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Tax (10%):</span>
            <span>${tax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-slate-800 pt-2 border-t border-slate-200">
            <span>Total:</span>
            <span>${total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};