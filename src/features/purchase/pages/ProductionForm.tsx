import  { useState, useMemo } from 'react';
import { 
  Factory, Package, Banknote, 
  Save, Settings, Trash2, Plus, 
  CheckCircle2
} from 'lucide-react';

// Adjust these imports to match your project structure
import Input from '@/components/ui/Input'; 
import { ReusableSelect } from '@/components/ui/ReusableSelect';
import { GradientButton } from '@/components/ui/GradientButton';

// --- Types ---
interface FinishedProduct {
  id: string;
  product: string;
  qty: number;
  unitCost: number;
  sellingPrice: number;
  showAdvanced: boolean;
  expiry: string;
  storage: string;
  grade: string;
  reorder: number;
  unit: string;
  variant: string;
}

export default function ProductionEntryPage() {
  // --- State Management ---
  
  // 1. Production Details
  const [details, setDetails] = useState({
    date: '2025-03-14',
    reference: 'PRD-2025-0089',
    location: 'Workshop A',
    supervisor: 'Sarah Johnson',
    batch: 'BATCH-2025-001',
    status: 'Completed',
    notes: '',
  });

  // 2. Finished Products Array
  const [products, setProducts] = useState<FinishedProduct[]>([
    {
      id: 'prod-1',
      product: 'Handmade Soap Bar',
      qty: 100,
      unitCost: 45.00,
      sellingPrice: 99.00,
      showAdvanced: false,
      expiry: '2026-03-14',
      storage: 'Storage Room A',
      grade: 'Grade A',
      reorder: 20,
      unit: 'Piece',
      variant: 'Lavender',
    }
  ]);

  // 3. Production Costs
  const [costs, setCosts] = useState({
    labor: 1500.00,
    overhead: 500.00,
    packaging: 300.00,
    equipment: 200.00,
    other: 150.00,
  });

  // --- Handlers ---
  const handleDetailChange = (field: string, value: any) => setDetails(prev => ({ ...prev, [field]: value }));
  const handleCostChange = (field: string, value: string) => setCosts(prev => ({ ...prev, [field]: Number(value) || 0 }));

  // Product Handlers
  const addProduct = () => {
    setProducts([...products, {
      id: `prod-${Date.now()}`, product: '', qty: 1, unitCost: 0, sellingPrice: 0, showAdvanced: true,
      expiry: '', storage: '', grade: '', reorder: 0, unit: 'Piece', variant: ''
    }]);
  };
  const updateProduct = (id: string, field: keyof FinishedProduct, value: any) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  const removeProduct = (id: string) => setProducts(products.filter(p => p.id !== id));
  const toggleAdvanced = (id: string) => updateProduct(id, 'showAdvanced', !products.find(p => p.id === id)?.showAdvanced);

  // --- Calculations ---
  const summary = useMemo(() => {
    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, p) => sum + (Number(p.qty) || 0), 0);
    const productValue = products.reduce((sum, p) => sum + ((Number(p.qty) || 0) * (Number(p.sellingPrice) || 0)), 0);
    const totalProductionCost = costs.labor + costs.overhead + costs.packaging + costs.equipment + costs.other;

    return { totalProducts, totalUnits, productValue, totalProductionCost };
  }, [products, costs]);

  // --- Options ---
  const locationOptions = [{ value: 'Workshop A', label: 'Workshop A' }, { value: 'Factory Floor 1', label: 'Factory Floor 1' }];
  const supervisorOptions = [{ value: 'Sarah Johnson', label: 'Sarah Johnson' }, { value: 'Mike Wilson', label: 'Mike Wilson' }];
  const statusOptions = [{ value: 'In Progress', label: 'In Progress' }, { value: 'Completed', label: 'Completed' }];
  const productOptions = [{ value: 'Handmade Soap Bar', label: 'Handmade Soap Bar' }, { value: 'Organic Face Cream', label: 'Organic Face Cream' }];
  const storageOptions = [{ value: 'Storage Room A', label: 'Storage Room A' }, { value: 'Warehouse A', label: 'Warehouse A' }];
  const gradeOptions = [{ value: 'Grade A', label: 'Grade A' }, { value: 'Grade B', label: 'Grade B' }];
  const unitOptions = [{ value: 'Piece', label: 'Piece' }, { value: 'Box', label: 'Box' }, { value: 'Kg', label: 'Kg' }];

  return (
    <div className="flex min-h-screen bg-[#F5F6FA] font-sans text-slate-800 antialiased">
      <main className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-5">
          <div>
            <h1 className="mb-1 text-2xl font-bold text-slate-800">Production Entry</h1>
            <p className="text-sm text-slate-500">Record self-produced items and update stock automatically</p>
          </div>
          <div className="flex gap-3">
            <GradientButton variant="outline">Cancel</GradientButton>
            <GradientButton variant="outline">Save as Draft</GradientButton>
            <GradientButton variant="primary" icon={<Save size={16} />}>
              Save & Add to Stock
            </GradientButton>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_400px]">
          
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            
            {/* 1. Production Details */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8EFFF] text-[#4F7CFF]">
                  <Factory size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Production Details</h2>
                  <p className="text-[13px] text-slate-500">Basic production information</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Production Date" required type="date" value={details.date} onChange={(e) => handleDetailChange('date', e.target.value)} />
                <Input label="Reference Number" value={details.reference} disabled onChange={() => {}} />
                <ReusableSelect label="Location" required options={locationOptions} value={details.location} onValueChange={(val) => handleDetailChange('location', val)} />
                <ReusableSelect label="Supervisor" options={supervisorOptions} value={details.supervisor} onValueChange={(val) => handleDetailChange('supervisor', val)} />
                <Input label="Batch Number" required value={details.batch} onChange={(e) => handleDetailChange('batch', e.target.value)} />
                <ReusableSelect label="Production Status" options={statusOptions} value={details.status} onValueChange={(val) => handleDetailChange('status', val)} />
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Production Notes</label>
                  <textarea 
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" 
                    rows={3} 
                    value={details.notes}
                    onChange={(e) => handleDetailChange('notes', e.target.value)}
                    placeholder="Optional notes about this production batch..."
                  />
                </div>
              </div>
            </div>

            {/* 2. Finished Products */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8EFFF] text-[#4F7CFF]">
                    <Package size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Finished Products</h2>
                    <p className="text-[13px] text-slate-500">Products being manufactured</p>
                  </div>
                </div>
                <GradientButton variant="outline" icon={<Plus size={16} />} onClick={addProduct}>Add Product</GradientButton>
              </div>

              {products.map((product, index) => (
                <div key={product.id} className="mb-4 rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8EFFF] font-bold text-[#4F7CFF]">{index + 1}</div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleAdvanced(product.id)} className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${product.showAdvanced ? 'bg-[#E8EFFF] border-[#4F7CFF] text-[#4F7CFF]' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                        <Settings size={16} />
                      </button>
                      <button onClick={() => removeProduct(product.id)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-red-500 hover:bg-red-50 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                      <ReusableSelect label="Product *" options={productOptions} value={product.product} onValueChange={(val) => updateProduct(product.id, 'product', val)} />
                    </div>
                    <Input label="Quantity *" type="number" value={product.qty} onChange={(e) => updateProduct(product.id, 'qty', e.target.value)} />
                    <Input label="Unit Cost *" type="number" value={product.unitCost} onChange={(e) => updateProduct(product.id, 'unitCost', e.target.value)} />
                    <Input label="Total" disabled value={`₹${(product.qty * product.unitCost).toLocaleString()}`} onChange={() => {}} />
                  </div>

                  {product.showAdvanced && (
                    <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                      <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2"><Settings size={14}/> Advanced Settings</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Input label="Expiry Date" type="date" value={product.expiry} onChange={(e) => updateProduct(product.id, 'expiry', e.target.value)} />
                        <ReusableSelect label="Storage Location" options={storageOptions} value={product.storage} onValueChange={(val) => updateProduct(product.id, 'storage', val)} />
                        <ReusableSelect label="Quality Grade" options={gradeOptions} value={product.grade} onValueChange={(val) => updateProduct(product.id, 'grade', val)} />
                        <Input label="Reorder Point" type="number" value={product.reorder} onChange={(e) => updateProduct(product.id, 'reorder', e.target.value)} />
                        <ReusableSelect label="Unit" options={unitOptions} value={product.unit} onValueChange={(val) => updateProduct(product.id, 'unit', val)} />
                        <Input label="Color/Variant" placeholder="e.g. Lavender" value={product.variant} onChange={(e) => updateProduct(product.id, 'variant', e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 3. Production Costs */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D1FAE5] text-[#10B981]">
                  <Banknote size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Production Costs</h2>
                  <p className="text-[13px] text-slate-500">Labor, overhead, and other costs</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                <Input label="Labor Cost" type="number" value={costs.labor} onChange={(e) => handleCostChange('labor', e.target.value)} />
                <Input label="Overhead Cost" type="number" value={costs.overhead} onChange={(e) => handleCostChange('overhead', e.target.value)} />
                <Input label="Packaging Cost" type="number" value={costs.packaging} onChange={(e) => handleCostChange('packaging', e.target.value)} />
                <Input label="Equipment Cost" type="number" value={costs.equipment} onChange={(e) => handleCostChange('equipment', e.target.value)} />
                <Input label="Other Costs" type="number" value={costs.other} onChange={(e) => handleCostChange('other', e.target.value)} />
              </div>
            </div>

          </div>

          {/* Right Column - Summary Sidebar */}
          <div className="sticky top-6 flex flex-col gap-6">
            
            {/* Quick Stats Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-5 border-b border-slate-200 pb-4 text-lg font-bold text-slate-800">Production Summary</h3>
              
              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Products</div>
                  <div className="tabular-nums text-2xl font-bold text-slate-800">{summary.totalProducts}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Units</div>
                  <div className="tabular-nums text-2xl font-bold text-slate-800">{summary.totalUnits}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-medium text-slate-500">Product Value</span>
                  <span className="tabular-nums text-sm font-bold text-slate-800">₹{summary.productValue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-medium text-slate-500">Labor Cost</span>
                  <span className="tabular-nums text-sm font-bold text-slate-800">₹{costs.labor.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-medium text-slate-500">Overhead</span>
                  <span className="tabular-nums text-sm font-bold text-slate-800">₹{costs.overhead.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-medium text-slate-500">Packaging</span>
                  <span className="tabular-nums text-sm font-bold text-slate-800">₹{costs.packaging.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-medium text-slate-500">Equipment</span>
                  <span className="tabular-nums text-sm font-bold text-slate-800">₹{costs.equipment.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-medium text-slate-500">Other Costs</span>
                  <span className="tabular-nums text-sm font-bold text-slate-800">₹{costs.other.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t-2 border-slate-200">
                  <span className="text-[15px] font-bold text-slate-800">Total Prod Cost</span>
                  <span className="tabular-nums text-2xl font-black text-[#4F7CFF]">₹{summary.totalProductionCost.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Production Info Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-slate-800">Production Info</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-medium text-slate-500">Batch</span>
                  <span className="tabular-nums text-sm font-bold text-slate-800">{details.batch}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-medium text-slate-500">Location</span>
                  <span className="text-sm font-bold text-slate-800">{details.location}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-medium text-slate-500">Supervisor</span>
                  <span className="text-sm font-bold text-slate-800">{details.supervisor}</span>
                </div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[13px] font-medium text-slate-500">Status</span>
                  <span className="bg-[#EDE9FE] text-[#8B5CF6] px-2 py-0.5 rounded text-[11px] font-bold uppercase">{details.status}</span>
                </div>
              </div>
            </div>

            {/* Success Alert */}
            <div className="flex items-start gap-3 rounded-xl border border-[#86EFAC] bg-[#D1FAE5] p-4 text-[13px] font-medium text-[#047857]">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>Stock will be updated automatically when you save.</div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <GradientButton variant="primary" icon={<Save className="h-5 w-5" />} className="h-[52px] w-full text-[15px]">
                Save & Add to Stock
              </GradientButton>
              <GradientButton variant="outline" className="h-[52px] w-full text-[15px]">
                Save as Draft
              </GradientButton>
              <GradientButton variant="ghost" className="h-[40px] w-full">
                Clear Form
              </GradientButton>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}