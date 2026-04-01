import React, { useState, useMemo } from "react";
import { 
  FileText, Package, DollarSign, BarChart2, 
  Palette, Settings, UploadCloud, X, Plus, Trash2, CheckCircle2, Info
} from "lucide-react";

import Input from "@/components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";

interface ProductFormProps {
  initialData?: any; 
  isLoading?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  initialData = {},
  isLoading = false,
}) => {
  // --- Form State ---
  const [formData, setFormData] = useState({
    id: initialData.id || 0,
    name: initialData.name || "",
    sku: initialData.sku || "",
    brand: initialData.brand || "",
    category: initialData.category || "",
    unit: initialData.unit || "Piece (pcs)",
    description: initialData.description || initialData.describtion || "",
    isActive: initialData.isActive ?? true,
    
    // Pricing
    cost_price: initialData.cost_price || initialData.avg_buying_cost || "",
    selling_price: initialData.selling_price || "",
    mrp: initialData.mrp || "",
    gst: initialData.gst || "18%",
    hsn: initialData.hsn || "",
    supplier: initialData.supplier || initialData.default_supplier || "",
    
    // Stock
    opening_stock: initialData.opening_stock || initialData.current_stock || "",
    reorder_point: initialData.reorder_point || initialData.min_threshold || 5,
    max_stock: initialData.max_stock || "",
    location: initialData.location || "",
    rack: initialData.rack || "",
    trackStock: initialData.trackStock ?? true,

    // Advanced
    batch: initialData.batch || "",
    expiry: initialData.expiry || "",
    warranty: initialData.warranty || "",
    weight: initialData.weight || "",
  });

  // --- Dynamic States ---
  const [variants, setVariants] = useState([{ id: "1", name: "", value: "" }]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // --- Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleToggle = (field: keyof typeof formData) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const addVariant = () => {
    setVariants([...variants, { id: Math.random().toString(), name: "", value: "" }]);
  };

  const updateVariant = (index: number, field: "name" | "value", val: string) => {
    const newVariants = [...variants];
    newVariants[index][field] = val;
    setVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  // --- Auto Calculations ---
  const marginStats = useMemo(() => {
    const cost = Number(formData.cost_price) || 0;
    const selling = Number(formData.selling_price) || 0;
    const profit = selling - cost;
    const marginPercent = selling > 0 ? ((profit / selling) * 100).toFixed(1) : "0.0";
    return { profit, marginPercent };
  }, [formData.cost_price, formData.selling_price]);

  // --- Submit ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, variants };
    console.log("Submitting Product:", payload);
  };

  // --- Reusable Toggle Component ---
  const ToggleSwitch = ({ active, onClick, label, hint }: { active: boolean, onClick: () => void, label: string, hint: string }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-semibold text-slate-800">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{hint}</div>
      </div>
      <button 
        type="button" 
        onClick={onClick}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-blue-600' : 'bg-slate-300'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-end gap-4">
        
        <div className="flex items-center gap-3">
          <button type="button" className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            Save as Draft
          </button>
          <GradientButton onClick={handleSubmit} disabled={isLoading} className="px-6 py-2.5">
            {isLoading ? "Saving..." : "Save Product"}
          </GradientButton>
        </div>
      </div>

      {/* Notice the items-start here is CRITICAL for the sticky sidebar to work */}
      <form onSubmit={handleSubmit} className="flex flex-col xl:flex-row gap-6 items-start">
        
        {/* ================= LEFT COLUMN (MAIN FORM) ================= */}
        <div className="flex-1 w-full space-y-6">
          
          {/* 1. Basic Information */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Package size={24} /></div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
                <p className="text-xs text-slate-500">Essential product details</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div className="md:col-span-2">
                <Input name="name" label="Product Name" required value={formData.name} onChange={handleChange} placeholder="e.g. Wireless Mouse" />
              </div>
              <div>
                <Input name="sku" label="SKU / Barcode" required value={formData.sku} onChange={handleChange} placeholder="Unique identifier" />
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 size={12}/> Available</p>
              </div>
              <Input name="brand" label="Brand" value={formData.brand} onChange={handleChange} placeholder="e.g. Logitech" />
              
              <ReusableSelect
                label="Category"
                required={true as any}
                value={formData.category}
                onValueChange={(val) => setFormData({...formData, category: val})}
                options={[{value: "Electronics", label: "Electronics"}, {value: "Accessories", label: "Accessories"}]}
                placeholder="Select category"
              />
              <ReusableSelect
                label="Unit of Measure"
                required={true as any}
                value={formData.unit}
                onValueChange={(val) => setFormData({...formData, unit: val})}
                options={[{value: "Piece (pcs)", label: "Piece (pcs)"}, {value: "Box", label: "Box"}, {value: "Kg", label: "Kilogram (kg)"}]}
                placeholder="Select unit"
              />
              
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 ml-0.5">Description</label>
                <div className="relative group">
                  <FileText className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full pl-10 p-3 bg-white rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none text-sm placeholder:text-slate-400"
                    placeholder="Describe material, dimensions, or key features..."
                  />
                </div>
              </div>
            </div>
            <ToggleSwitch active={formData.isActive} onClick={() => handleToggle('isActive')} label="Active Status" hint="Product is available for sale everywhere" />
          </div>

          {/* 2. Pricing & Sourcing */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><DollarSign size={24} /></div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Pricing & Sourcing</h2>
                <p className="text-xs text-slate-500">Manage costs, margins, and suppliers</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Input type="number" name="cost_price" label="Cost Price" required leftIcon={<span className="text-sm">₹</span>} value={formData.cost_price as any} onChange={handleChange} placeholder="0.00" />
              <Input type="number" name="selling_price" label="Selling Price" required leftIcon={<span className="text-sm">₹</span>} value={formData.selling_price as any} onChange={handleChange} placeholder="0.00" />
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 ml-0.5">Profit Margin</label>
                <div className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 font-semibold flex justify-between items-center">
                  <span>₹{marginStats.profit.toLocaleString()}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${marginStats.profit > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                    {marginStats.marginPercent}%
                  </span>
                </div>
              </div>

              <Input type="number" name="mrp" label="MRP" leftIcon={<span className="text-sm">₹</span>} value={formData.mrp as any} onChange={handleChange} placeholder="0.00" />
              <ReusableSelect
                label="GST / Tax %"
                required={true as any}
                value={formData.gst}
                onValueChange={(val) => setFormData({...formData, gst: val})}
                options={[{value: "0%", label: "0%"}, {value: "5%", label: "5%"}, {value: "12%", label: "12%"}, {value: "18%", label: "18%"}, {value: "28%", label: "28%"}]}
              />
              <Input name="hsn" label="HSN Code" value={formData.hsn} onChange={handleChange} placeholder="e.g. 8471" />
              
              <div className="md:col-span-3">
                <ReusableSelect
                  label="Primary Supplier"
                  value={formData.supplier}
                  onValueChange={(val) => setFormData({...formData, supplier: val})}
                  options={[{value: "TechDistro Global", label: "TechDistro Global"}, {value: "ABC Electronics", label: "ABC Electronics"}]}
                  placeholder="Select primary vendor"
                />
              </div>
            </div>
          </div>

          {/* 3. Stock & Inventory */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><BarChart2 size={24} /></div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Stock & Inventory</h2>
                <p className="text-xs text-slate-500">Manage stock levels and alerts</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <Input type="number" name="opening_stock" label="Opening Stock" value={formData.opening_stock as any} onChange={handleChange} placeholder="0" />
              <Input type="number" name="reorder_point" label="Reorder Point" required value={formData.reorder_point as any} onChange={handleChange} placeholder="0" />
              <Input type="number" name="max_stock" label="Max Stock Level" value={formData.max_stock as any} onChange={handleChange} placeholder="0" />
              
              <div className="md:col-span-2">
                <ReusableSelect
                  label="Storage Location"
                  required={true as any}
                  value={formData.location}
                  onValueChange={(val) => setFormData({...formData, location: val})}
                  options={[{value: "Shelf 1", label: "Shelf 1 - Main"}, {value: "Warehouse A", label: "Warehouse A"}]}
                  placeholder="Select location"
                />
              </div>
              <Input name="rack" label="Rack / Bin" value={formData.rack} onChange={handleChange} placeholder="e.g. A-12-3" />
            </div>
            <ToggleSwitch active={formData.trackStock} onClick={() => handleToggle('trackStock')} label="Track Stock Levels" hint="Monitor inventory and trigger low stock alerts automatically" />
          </div>

          {/* 4. Product Variants */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
             <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><Palette size={24} /></div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Product Variants</h2>
                <p className="text-xs text-slate-500">Colors, sizes, or other variations</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {variants.map((variant, index) => (
                <div key={variant.id} className="flex gap-3">
                  <div className="flex-1">
                    <Input placeholder="Variant (e.g., Color)" value={variant.name} onChange={(e) => updateVariant(index, "name", e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <Input placeholder="Value (e.g., Black)" value={variant.value} onChange={(e) => updateVariant(index, "value", e.target.value)} />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeVariant(index)}
                    disabled={variants.length === 1}
                    className="w-11 h-11 flex-shrink-0 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addVariant} className="w-full py-2.5 border border-dashed border-slate-300 rounded-lg text-sm font-semibold text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
              <Plus size={16} /> Add Another Variant
            </button>
          </div>

          {/* 5. Advanced Settings Toggle */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
               <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center"><Settings size={24} /></div>
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-slate-900">Advanced Settings</h2>
                  <p className="text-xs text-slate-500">Batch, Expiry, Warranty & Dimensions</p>
                </div>
              </div>
              <div className={`text-slate-400 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`}>▼</div>
            </button>
            
            {showAdvanced && (
              <div className="p-6 pt-0 border-t border-slate-100 animate-in fade-in slide-in-from-top-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                  <Input name="batch" label="Batch Number" value={formData.batch} onChange={handleChange} placeholder="e.g. BATCH-001" />
                  <Input type="date" name="expiry" label="Expiry Date" value={formData.expiry} onChange={handleChange} />
                  <Input name="warranty" label="Warranty Period" value={formData.warranty} onChange={handleChange} placeholder="e.g. 12 Months" />
                  <Input type="number" name="weight" label="Weight (kg)" value={formData.weight as any} onChange={handleChange} placeholder="0.00" />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* ================= RIGHT COLUMN (SIDEBAR) ================= */}
        <div className="w-full xl:w-96">
          
          {/* THE FIX IS HERE: The wrapper is sticky, keeping the cards neatly stacked while you scroll */}
          <div className="xl:sticky xl:top-0 space-y-6 pb-8">
            
            {/* Image Upload Area */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100">Product Images</h3>
              
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer group mb-4">
                <div className="w-16 h-16 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:text-blue-500 transition-colors">
                  <UploadCloud size={28} />
                </div>
                <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">Upload Images</p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB each</p>
              </div>

              {/* Mock Preview Area */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative aspect-square rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center text-xs text-slate-400 font-semibold group overflow-hidden">
                  Image 1
                  <button type="button" className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><X size={12} /></button>
                </div>
                <div className="relative aspect-square rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 cursor-pointer transition-colors">
                  <Plus size={24} />
                </div>
              </div>
            </div>

            {/* Real-time Summary Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100">Product Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">SKU</span>
                  <span className="font-bold text-slate-900">{formData.sku || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Category</span>
                  <span className="font-bold text-slate-900">{formData.category || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Cost Price</span>
                  <span className="font-bold text-slate-900">₹{Number(formData.cost_price || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Selling Price</span>
                  <span className="font-bold text-slate-900">₹{Number(formData.selling_price || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Profit Margin</span>
                  <span className={`font-bold ${marginStats.profit > 0 ? 'text-green-600' : 'text-slate-900'}`}>
                    ₹{marginStats.profit.toLocaleString()} ({marginStats.marginPercent}%)
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Status</span>
                  {formData.isActive ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 font-bold text-[11px] uppercase tracking-wider rounded">Active</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold text-[11px] uppercase tracking-wider rounded">Draft</span>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-3">
                <GradientButton type="submit" onClick={handleSubmit} disabled={isLoading} className="w-full py-3">
                  {isLoading ? "Saving..." : "💾 Save Product"}
                </GradientButton>
                <button type="button" className="w-full py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                  Save as Draft
                </button>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3 text-xs text-blue-800">
                <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p>Required fields marked with <span className="text-red-500 font-bold">*</span> must be filled before saving.</p>
              </div>
            </div>
            
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;