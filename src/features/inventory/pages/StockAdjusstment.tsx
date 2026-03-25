import { useState, useMemo } from 'react';
import { 
  Save, 
  AlertTriangle, 
  ClipboardList, 
  Barcode, 
  Package, 
  Plus, 
  Trash2, 
  Info,
  Search
} from 'lucide-react';

// Assuming these are your import paths based on your previous messages
import { GradientButton } from '@/components/ui/GradientButton'; 
import Input from '@/components/ui/Input';
import { ReusableSelect } from "@/components/ui/ReusableSelect";

// Type definitions
interface AdjustmentItem {
  id: string;
  product: string;
  currentStock: number;
  type: 'increase' | 'decrease';
  quantity: number | ''; // Allow empty string for clearing input
  reason: string;
  notes: string;
}

// Mock Product Database (to simulate pulling current stock)
const PRODUCT_DB: Record<string, number> = {
  'Wireless Headphones': 34,
  'Ergonomic Mouse': 28,
  'USB-C Cable': 170,
  'Mechanical Keyboard': 15,
  'Monitor Stand': 42,
};

// Dropdown Options formatted for your ReusableSelect
const productOptions = Object.keys(PRODUCT_DB).map(key => ({ value: key, label: key }));

const typeOptions = [
  { value: 'increase', label: 'Increase (+)' },
  { value: 'decrease', label: 'Decrease (−)' }
];

const reasonOptions = [
  { value: 'Damaged', label: 'Damaged' },
  { value: 'Expired', label: 'Expired' },
  { value: 'Lost / Stolen', label: 'Lost / Stolen' },
  { value: 'Stock Correction', label: 'Stock Correction' },
  { value: 'Returned (Defective)', label: 'Returned (Defective)' },
];

export default function StockAdjustmentPage() {
  // Initial dynamic state
  const [items, setItems] = useState<AdjustmentItem[]>([
    {
      id: 'item-1',
      product: 'Wireless Headphones',
      currentStock: PRODUCT_DB['Wireless Headphones'],
      type: 'decrease',
      quantity: 3,
      reason: 'Stock Correction',
      notes: '',
    },
    {
      id: 'item-2',
      product: 'Ergonomic Mouse',
      currentStock: PRODUCT_DB['Ergonomic Mouse'],
      type: 'increase',
      quantity: 5,
      reason: 'Stock Correction',
      notes: 'Found during audit',
    },
  ]);
  const [searchProduct, setSearchProduct] = useState('');

  // --- Actions & Handlers ---

  const handleAddItem = () => {
    const newItem: AdjustmentItem = {
      id: `item-${Date.now()}`,
      product: '',
      currentStock: 0,
      type: 'decrease',
      quantity: 1,
      reason: 'Stock Correction',
      notes: '',
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof AdjustmentItem, value: any) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;

      const updatedItem = { ...item, [field]: value };
      
      // Auto-update current stock when a product is selected
      if (field === 'product' && typeof value === 'string') {
        updatedItem.currentStock = PRODUCT_DB[value] || 0;
      }
      
      return updatedItem;
    }));
  };

  // --- Derived Data for Summary (Updates Automatically) ---

  const summary = useMemo(() => {
    let netChange = 0;
    const impactList: { name: string; change: number; type: string }[] = [];
    const reasons: Record<string, number> = {};
    let validProductCount = 0;

    items.forEach(item => {
      if (!item.product) return;
      validProductCount++;

      const qty = Number(item.quantity) || 0;
      const changeAmt = item.type === 'increase' ? qty : -qty;
      netChange += changeAmt;
      
      impactList.push({
        name: item.product,
        change: changeAmt,
        type: item.type
      });

      if (item.reason) {
        reasons[item.reason] = (reasons[item.reason] || 0) + 1;
      }
    });

    return { netChange, impactList, reasons, validProductCount };
  }, [items]);

  return (
    <div className="flex min-h-screen  font-sans text-slate-800 antialiased">
      <main className="flex-1 p-2 lg:p-4 max-w-[1600px] mx-auto">
        
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-5">
          <div>
            <h1 className="mb-1 text-2xl font-bold text-slate-800">Stock Adjustment</h1>
            <p className="text-sm text-slate-500">Manually adjust inventory for damaged, expired, lost, or miscounted items</p>
          </div>
          <div className="flex gap-3">
            <GradientButton variant="outline">
              Cancel
            </GradientButton>
            <GradientButton variant="primary" icon={<Save className="h-4 w-4" />}>
              Save Adjustment
            </GradientButton>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_380px]">
          {/* Left Column */}
          <div className="flex flex-col gap-5">
            
            {/* Alert */}
            <div className="flex items-start gap-3 rounded-xl border border-[#FDE68A] bg-[#FEF3C7] p-4 text-[13px] leading-relaxed text-[#92400E]">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#D97706]" />
              <div>
                <strong>Important:</strong> Stock adjustments do not create purchase entries or affect cost history. Use this only for physical inventory corrections like damaged, expired, lost, or found items.
              </div>
            </div>

            {/* Adjustment Details Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8EFFF] text-[#4F7CFF]">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Adjustment Details</h2>
                    <p className="mt-0.5 text-[13px] text-slate-500">Basic adjustment information</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <Input 
                  label="Adjustment Date" 
                  type="date" 
                  value="2025-03-14" // You'd typically link this to state
                  required 
                  onChange={() => {}} 
                />
                <Input 
                  label="Reference Number" 
                  type="text" 
                  value="ADJ-2025-0045" 
                  disabled 
                  onChange={() => {}} 
                />
                
                {/* Note: Kept native textarea as Input component doesn't handle multi-line yet */}
                <div className="col-span-2 flex flex-col">
                  <label className="text-xs font-semibold text-gray-700 ml-0.5 mb-1.5">Adjustment Notes</label>
                  <textarea 
                    placeholder="Reason for this adjustment (e.g., Physical inventory count revealed discrepancies...)" 
                    className="min-h-[80px] w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" 
                  />
                </div>
              </div>
            </div>

            {/* Quick Add Product */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input 
                    type="text" 
                    placeholder="Search product name to add..." 
                    leftIcon={<Search className="h-4 w-4" />}
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                  />
                </div>
                <GradientButton variant="primary" icon={<Barcode className="h-5 w-5" />}>
                  Scan Barcode
                </GradientButton>
              </div>
            </div>

            {/* Adjustment Items List */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#D97706]">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Products to Adjust</h2>
                    <p className="mt-0.5 text-[13px] text-slate-500">Select items and adjustment reasons</p>
                  </div>
                </div>
                <GradientButton variant="outline" icon={<Plus className="h-4 w-4" />} onClick={handleAddItem}>
                  Add Product
                </GradientButton>
              </div>

              {/* Dynamic Items Array */}
              {items.map((item, index) => {
                // Calculate expected new stock based on selection
                const qtyNum = Number(item.quantity) || 0;
                const newStock = item.product 
                  ? (item.type === 'increase' ? item.currentStock + qtyNum : Math.max(0, item.currentStock - qtyNum))
                  : 0;

                return (
                  <div key={item.id} className="mb-4 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8EFFF] font-bold text-[#4F7CFF]">{index + 1}</div>
                      <GradientButton variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => handleRemoveItem(item.id)}>
                        Remove
                      </GradientButton>
                    </div>

                    <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1.5fr] items-start gap-4">
                      
                      {/* Product Field */}
                      <div>
                        <ReusableSelect 
                          label="Product" 
                          required 
                          options={productOptions} 
                          value={item.product}
                          onValueChange={(val) => updateItem(item.id, 'product', val)}
                          placeholder="Select Product"
                        />
                        {item.product && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                              Current: {item.currentStock}
                            </span>
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ${item.type === 'increase' ? 'bg-[#D1FAE5] text-[#10B981]' : 'bg-[#FEE2E2] text-[#EF4444]'}`}>
                              New: {newStock}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Type Field */}
                      <ReusableSelect 
                        label="Type" 
                        required 
                        options={typeOptions} 
                        value={item.type}
                        onValueChange={(val) => updateItem(item.id, 'type', val)}
                        className={item.type === 'increase' ? 'border-[#10B981]' : 'border-[#EF4444]'}
                      />

                      {/* Quantity Field */}
                      <Input 
                        label="Quantity" 
                        required 
                        type="number" 
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                        className={item.type === 'increase' ? 'border-[#10B981]' : 'border-[#EF4444]'}
                      />

                      {/* Reason Field */}
                      <ReusableSelect 
                        label="Reason" 
                        required 
                        options={reasonOptions} 
                        value={item.reason}
                        onValueChange={(val) => updateItem(item.id, 'reason', val)}
                      />

                      {/* Notes Field */}
                      <Input 
                        label="Notes" 
                        type="text" 
                        placeholder="Optional"
                        value={item.notes}
                        onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                      />
                      
                    </div>
                  </div>
                );
              })}
              
              {items.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No products added yet. Click "Add Product" to begin.
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Summary Sidebar */}
          <div className="sticky top-6 flex flex-col gap-5">
            {/* Quick Stats */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-5 border-b border-slate-200 pb-4 text-lg font-bold text-slate-800">Adjustment Summary</h3>
              
              <div className="mb-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Products</div>
                  <div className="tabular-nums text-2xl font-bold text-slate-800">{summary.validProductCount}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Net Change</div>
                  <div className={`tabular-nums text-2xl font-bold ${summary.netChange > 0 ? 'text-[#10B981]' : summary.netChange < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                    {summary.netChange > 0 ? '+' : ''}{summary.netChange}
                  </div>
                </div>
              </div>

              <div className="mb-5 space-y-3">
                {summary.impactList.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center italic">Add items to see impact.</p>
                ) : (
                  summary.impactList.map((stat, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <span className="text-[13px] font-medium text-slate-800 truncate pr-4">{stat.name}</span>
                      <span className={`tabular-nums text-sm font-bold shrink-0 ${stat.type === 'increase' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {stat.change > 0 ? '+' : ''}{stat.change} units
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reason Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-slate-800">Reason Breakdown</h3>
              <div>
                {Object.keys(summary.reasons).length === 0 ? (
                   <p className="text-sm text-gray-400 text-center italic">No reasons recorded.</p>
                ) : (
                  Object.entries(summary.reasons).map(([reason, count]) => (
                    <div key={reason} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0 last:pb-0">
                      <span className="text-[13px] font-medium text-slate-800">{reason}</span>
                      <span className="tabular-nums text-sm font-bold text-slate-800">{count} item{count > 1 ? 's' : ''}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Info Alert */}
            <div className="flex items-start gap-3 rounded-xl border border-[#93C5FD] bg-[#DBEAFE] p-4 text-[13px] leading-relaxed text-[#1E40AF]">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#2563EB]" />
              <div>
                <strong>Note:</strong> This adjustment will update stock levels immediately but will NOT create purchase entries or affect product cost history.
              </div>
            </div>

            {/* Actions */}
            <div className="mt-2 flex flex-col gap-3">
              <GradientButton variant="primary" icon={<Save className="h-5 w-5" />} className="h-[52px] w-full text-[15px]">
                Save Adjustment
              </GradientButton>
              <GradientButton variant="outline" className="h-[52px] w-full text-[15px]">
                Save as Draft
              </GradientButton>
              <GradientButton variant="ghost" onClick={() => setItems([])} className="h-[40px] w-full">
                Clear Form
              </GradientButton>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}