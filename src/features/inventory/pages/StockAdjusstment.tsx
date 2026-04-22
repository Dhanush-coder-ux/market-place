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

// Adjust these imports to match your project structure
import { GradientButton } from '@/components/ui/GradientButton'; 
import Input from '@/components/ui/Input';
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { inventoryApi } from "@/services/api/inventory";
import { SHOP_ID } from "@/services/endpoints";
import Loader from "@/components/common/Loader";

// --- Type definitions ---
interface AdjustmentItem {
  id: string;
  product: string;
  barcode: string;
  currentStock: number;
  type: 'increase' | 'decrease';
  quantity: number | ''; 
  reason: string;
  notes: string;
}



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
  const [items, setItems] = useState<AdjustmentItem[]>([
    {
      id: 'item-1',
      product: 'Wireless Headphones',
      barcode: '',
      currentStock: 34,
      type: 'decrease',
      quantity: 3,
      reason: 'Stock Correction',
      notes: '',
    },
    {
      id: 'item-2',
      product: 'Ergonomic Mouse',
      barcode: '',
      currentStock: 28,
      type: 'increase',
      quantity: 5,
      reason: 'Stock Correction',
      notes: 'Found during audit',
    },
  ]);
  
  const [searchProduct, setSearchProduct] = useState('');
  const [adjustmentDate, setAdjustmentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [referenceNumber] = useState(`ADJ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --- Actions & Handlers ---

  const handleAddItem = () => {
    const newItem: AdjustmentItem = {
      id: `item-${Date.now()}`,
      product: '',
      barcode: '',
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
    setItems(prevItems => prevItems.map(item => {
      if (item.id !== id) return item;
      return { ...item, [field]: value };
    }));
  };

  const updateMultiple = (id: string, updates: Partial<AdjustmentItem>) => {
    setItems(prevItems => prevItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Map the products array to fit the backend expectation
      const products = items.map(item => ({
        id: item.id, // Or whichever ID corresponds to the actual product ID
        name: item.product,
        barcode: item.barcode,
        currentStock: item.currentStock,
        type: item.type === 'increase' ? 'INCREMENT' : 'DECREMENT',
        quantity: item.quantity,
        reason: item.reason,
        notes: item.notes
      }));

      const payload = {
        shop_id: SHOP_ID,
        type: "STOCK_ADJUSTMENT",
        date: adjustmentDate,
        referenceNumber,
        notes,
        products
      };

      await inventoryApi.createStockAdjustment(payload);
      
      // Clear form on success
      setItems([]);
      setNotes('');
      alert("Stock Adjustment saved successfully!");
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to save adjustment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Derived State (Summary) ---

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
      <main className="flex-1 p-4 lg:p-6 max-w-[1600px] mx-auto">
        

        {/* Main Grid */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_380px]">
          
          {/* --- Left Column --- */}
          <div className="flex flex-col gap-6">
            
            {/* Alert */}
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13.5px] leading-relaxed text-amber-800 shadow-sm">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <strong className="font-semibold">Important:</strong> Stock adjustments do not create purchase entries or affect cost history. Use this only for physical inventory corrections like damaged, expired, lost, or found items.
              </div>
            </div>

            {/* Adjustment Details Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Adjustment Details</h2>
                  <p className="text-[13px] text-slate-500">Basic adjustment information</p>
                </div>
              </div>

              {/* Fixed Grid Alignment for Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input 
                  label="Adjustment Date" 
                  type="date" 
                  value={adjustmentDate} 
                  required 
                  onChange={(e) => setAdjustmentDate(e.target.value)} 
                />
                <Input 
                  label="Reference Number" 
                  type="text" 
                  value={referenceNumber} 
                  disabled 
                  onChange={() => {}} 
                />
                
                {/* Standardized Textarea to match Input spacing */}
                <div className="md:col-span-2 flex flex-col">
                  <label className="mb-1.5 text-[13px] font-semibold text-slate-700">Adjustment Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reason for this adjustment (e.g., Physical inventory count revealed discrepancies...)" 
                    className="min-h-[80px] w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400" 
                  />
                </div>
              </div>
            </div>

            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 shadow-sm">
                <strong>Error:</strong> {submitError}
              </div>
            )}

            {/* Quick Add Product */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input 
                    type="text" 
                    placeholder="Search product name to add..." 
                    leftIcon={<Search className="h-4 w-4" />}
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                  />
                </div>
                <GradientButton variant="primary" icon={<Barcode className="h-5 w-5" />} className="shrink-0">
                  Scan Barcode
                </GradientButton>
              </div>
            </div>

            {/* Adjustment Items List */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Products to Adjust</h2>
                    <p className="text-[13px] text-slate-500">Select items and adjustment reasons</p>
                  </div>
                </div>
                <GradientButton variant="outline" icon={<Plus className="h-4 w-4" />} onClick={handleAddItem}>
                  Add Product
                </GradientButton>
              </div>

              {/* Dynamic Items Array */}
              <div className="space-y-4">
                {items.map((item, index) => {
                  const qtyNum = Number(item.quantity) || 0;
                  const newStock = item.product 
                    ? (item.type === 'increase' ? item.currentStock + qtyNum : Math.max(0, item.currentStock - qtyNum))
                    : 0;

                  return (
                    <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 transition-all hover:bg-white hover:shadow-md">
                      
                      {/* Item Header */}
                      <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 font-semibold text-blue-600">
                          {index + 1}
                        </div>
                        <GradientButton variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => handleRemoveItem(item.id)}>
                          Remove
                        </GradientButton>
                      </div>

                      {/* PERFECT ALIGNMENT GRID
                          Using standard 12-column spans guarantees the inputs 
                          never squish horizontally and `items-start` keeps labels aligned 
                      */}
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12 xl:items-start">
                        
                        {/* Product Field */}
                        <div className="xl:col-span-3">
                          <div className="flex flex-col gap-1.5 pt-0.5">
                            <label className="text-sm font-semibold text-slate-700">Product *</label>
                            <SearchSelect 
                              fetchOptions={async (q) => await inventoryApi.searchInventories(q)}
                              value={item.product}
                              labelKey="name"
                              valueKey="id"
                              onChange={(val, opt: any) => {
                                 if (opt) {
                                    updateMultiple(item.id, { 
                                      product: opt.name || opt.label || String(val),
                                      barcode: opt.barcode || '',
                                      currentStock: opt.stocks || opt.stock || 0 
                                    });
                                 } else {
                                    updateItem(item.id, 'product', String(val));
                                 }
                              }}
                              placeholder="Search Product"
                              className="w-full"
                            />
                          </div>
                          {item.product && (
                            <div className="mt-2.5 flex items-center gap-2">
                              <span className="inline-flex items-center rounded-md bg-slate-200/60 px-2 py-1 text-[11px] font-semibold text-slate-600">
                                Current: {item.currentStock}
                              </span>
                              <span className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ${item.type === 'increase' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                New: {newStock}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Type Field */}
                        <div className="xl:col-span-2">
                          <ReusableSelect 
                            label="Type" 
                            required 
                            options={typeOptions} 
                            value={item.type}
                            onValueChange={(val) => updateItem(item.id, 'type', val)}
                            className={item.type === 'increase' ? 'border-emerald-500' : 'border-red-500'}
                          />
                        </div>

                        {/* Quantity Field */}
                        <div className="xl:col-span-2">
                          <Input 
                            label="Quantity" 
                            required 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                            className={item.type === 'increase' ? 'border-emerald-500' : 'border-red-500'}
                          />
                        </div>

                        {/* Reason Field */}
                        <div className="xl:col-span-3">
                          <ReusableSelect 
                            label="Reason" 
                            required 
                            options={reasonOptions} 
                            value={item.reason}
                            onValueChange={(val) => updateItem(item.id, 'reason', val)}
                          />
                        </div>

                        {/* Notes Field */}
                        <div className="xl:col-span-2">
                          <Input 
                            label="Notes" 
                            type="text" 
                            placeholder="Optional"
                            value={item.notes}
                            onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {items.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
                  No products added yet. Click "Add Product" to begin.
                </div>
              )}
            </div>
          </div>

          {/* --- Right Column (Summary Sidebar) --- */}
          <div className="sticky top-6 flex flex-col gap-6">
            
            {/* Quick Stats */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-5 border-b border-slate-100 pb-4 text-lg font-semibold text-slate-900">Adjustment Summary</h3>
              
              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4 text-center border border-slate-100">
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Products</div>
                  <div className="tabular-nums text-2xl font-semibold text-slate-900">{summary.validProductCount}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-center border border-slate-100">
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Net Change</div>
                  <div className={`tabular-nums text-2xl font-semibold ${summary.netChange > 0 ? 'text-emerald-500' : summary.netChange < 0 ? 'text-red-500' : 'text-slate-900'}`}>
                    {summary.netChange > 0 ? '+' : ''}{summary.netChange}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {summary.impactList.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center italic">Add items to see impact.</p>
                ) : (
                  summary.impactList.map((stat, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <span className="text-[13.5px] font-medium text-slate-800 truncate pr-4">{stat.name}</span>
                      <span className={`tabular-nums text-[13.5px] font-semibold shrink-0 ${stat.type === 'increase' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {stat.change > 0 ? '+' : ''}{stat.change} units
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reason Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-5 border-b border-slate-100 pb-4 text-lg font-semibold text-slate-900">Reason Breakdown</h3>
              <div>
                {Object.keys(summary.reasons).length === 0 ? (
                   <p className="text-sm text-slate-400 text-center italic">No reasons recorded.</p>
                ) : (
                  Object.entries(summary.reasons).map(([reason, count]) => (
                    <div key={reason} className="flex items-center justify-between border-b border-slate-100 py-3 first:pt-0 last:border-0 last:pb-0">
                      <span className="text-[13.5px] font-medium text-slate-800">{reason}</span>
                      <span className="tabular-nums text-[13.5px] font-semibold text-slate-900">{count} item{count > 1 ? 's' : ''}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Info Alert */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-[13px] leading-relaxed text-blue-800 shadow-sm">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <strong className="font-semibold">Note:</strong> This adjustment will update stock levels immediately but will NOT create purchase entries or affect product cost history.
              </div>
            </div>

            {/* Actions */}
            <div className="mt-2 flex flex-col gap-3">
              <GradientButton 
                variant="primary" 
                icon={isSubmitting ? <Loader className="h-5 w-5" /> : <Save className="h-5 w-5" />} 
                className="h-[52px] w-full text-[15px] shadow-sm"
                onClick={handleSubmit}
                disabled={isSubmitting || items.length === 0}
              >
                {isSubmitting ? "Saving..." : "Save Adjustment"}
              </GradientButton>
              <GradientButton variant="outline" className="h-[52px] w-full text-[15px]">
                Save as Draft
              </GradientButton>
              <button 
                onClick={() => setItems([])} 
                className="mt-2 h-[40px] w-full rounded-lg text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
              >
                Clear Form
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}