import React, { useState, useEffect } from "react";
import { 
  Zap,
  Calendar,
  BarChart2,
  Hash,
  Layers,
  CheckCircle2
} from "lucide-react";
import { InlineSerialManager } from "@/components/common/InlineSerialManager";
import { QuickCreateModal, QuickCreateStep } from "./QuickCreateModal";
import Input from "@/components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { useApi } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { Switch } from "@/components/ui/switch";
import { 
  VariantType, 
  VariantCombination, 
  VariantBuilder, 
  VariantMatrixTable, 
  generateCombinations 
} from "@/features/product/components/VariantManager";

// --- Constants (Shared with ProductForm) ---

const CATEGORY_CONFIGS: Record<string, { suggestedVariantTypes: string[]; supportsSerials: boolean; serialLabel: string }> = {
  "Mobile Phones": { suggestedVariantTypes: ["Storage", "Color", "Model"], supportsSerials: true, serialLabel: "IMEI Number" },
  "Laptops": { suggestedVariantTypes: ["RAM", "Storage", "Color"], supportsSerials: true, serialLabel: "Serial Number" },
  "Clothing": { suggestedVariantTypes: ["Size", "Color"], supportsSerials: false, serialLabel: "Serial Number" },
  "Footwear": { suggestedVariantTypes: ["Size", "Color"], supportsSerials: false, serialLabel: "Serial Number" },
  "Electronics": { suggestedVariantTypes: ["Color", "Wattage", "Model"], supportsSerials: true, serialLabel: "Serial Number" },
  "Accessories": { suggestedVariantTypes: ["Color", "Size"], supportsSerials: false, serialLabel: "Serial Number" },
  "Tablets": { suggestedVariantTypes: ["Storage", "Connectivity", "Color"], supportsSerials: true, serialLabel: "IMEI / Serial" },
};

const CATEGORIES = Object.keys(CATEGORY_CONFIGS);
const UNITS = ["Piece (pcs)", "Box", "Kilogram (kg)", "Gram (g)", "Litre (L)", "Metre (m)", "Set", "Pair"];
const GST_RATES = ["0%", "5%", "12%", "18%", "28%"];

interface QuickCreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  onSuccess: (product: any) => void;
}

export const QuickCreateProductModal: React.FC<QuickCreateProductModalProps> = ({
  isOpen,
  onClose,
  initialName = "",
  onSuccess,
}) => {
  const { postData } = useApi();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // --- Form State ---
  const [form, setForm] = useState({
    name: initialName,
    barcode: "",
    brand: "",
    category: "Electronics",
    unit: "Piece (pcs)",
    description: "",
    is_active: true,
    buy_price: "",
    sell_price: "",
    mrp: "",
    gst: "18%",
    hsn: "",
    opening_stock: "0",
    reorder_point: "5",
    batch_tracking: false,
    serial_tracking: false,
    has_variants: false,
    batch_name: "",
    mfg_date: "",
    exp_date: "",
  });
  const [baseSerials, setBaseSerials] = useState<string[]>([]);

  // --- Variant State ---
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [combinations, setCombinations] = useState<VariantCombination[]>([]);

  const config = CATEGORY_CONFIGS[form.category] || {
    suggestedVariantTypes: [],
    supportsSerials: false,
    serialLabel: "Serial Number"
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Sync combinations when variant types or base prices change
  useEffect(() => {
    if (form.has_variants) {
      setCombinations(prev => generateCombinations(
        variantTypes,
        prev,
        { buy_price: form.buy_price, sell_price: form.sell_price, mrp: form.mrp }
      ));
    }
  }, [variantTypes, form.has_variants, form.buy_price, form.sell_price, form.mrp]);

  const steps: QuickCreateStep[] = [
    {
      id: 1,
      title: "Product Identity",
      subtitle: "Basic identification",
      isValid: !!form.name,
      content: (
        <div className="space-y-6">
          <Input
            label="Product Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. iPhone 15 Pro"
            className="h-12 font-bold text-slate-700"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Barcode / SKU" name="barcode" value={form.barcode} onChange={handleChange} leftIcon={<Hash size={16} />} />
            <Input label="Brand" name="brand" value={form.brand} onChange={handleChange} placeholder="e.g. Apple" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
              <ReusableSelect
                value={form.category}
                onValueChange={(val) => setForm(p => ({ ...p, category: val }))}
                options={CATEGORIES.map(c => ({ label: c, value: c }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label>
              <ReusableSelect
                value={form.unit}
                onValueChange={(val) => setForm(p => ({ ...p, unit: val }))}
                options={UNITS.map(u => ({ label: u, value: u }))}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Tracking & Inventory",
      subtitle: "Management settings",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Input label="Opening Stock" type="number" name="opening_stock" value={form.opening_stock} onChange={handleChange} />
             <Input label="Reorder Point" type="number" name="reorder_point" value={form.reorder_point} onChange={handleChange} />
          </div>
          
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3 md:p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                  <BarChart2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Batch Tracking</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Track expiry & manufacture</p>
                </div>
              </div>
              <Switch checked={form.batch_tracking} onCheckedChange={(val) => setForm(f => ({ ...f, batch_tracking: val }))} />
            </div>

            <div className="flex items-center justify-between p-3 md:p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-violet-600 shadow-sm border border-slate-100">
                  <Layers size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Serial Tracking</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Track unique IDs / IMEIs</p>
                </div>
              </div>
              <Switch checked={form.serial_tracking} onCheckedChange={(val) => setForm(f => ({ ...f, serial_tracking: val }))} />
            </div>

            {/* Conditional Tracking Inputs */}
            {form.batch_tracking && !form.has_variants && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-blue-600" />
                  <span className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Initial Batch Information</span>
                </div>
                <Input label="Batch Name" name="batch_name" value={form.batch_name} onChange={handleChange} placeholder="e.g. BATCH-001" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Mfg Date" name="mfg_date" type="date" value={form.mfg_date} onChange={handleChange} />
                  <Input label="Expiry Date" name="exp_date" type="date" value={form.exp_date} onChange={handleChange} />
                </div>
              </div>
            )}

            {form.serial_tracking && !form.has_variants && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-2 mb-2">
                  <Hash size={14} className="text-violet-600" />
                  <span className="text-[10px] font-black uppercase text-slate-800 tracking-widest">{config.serialLabel} Management</span>
                </div>
                <InlineSerialManager
                  serials={baseSerials}
                  serialLabel={config.serialLabel}
                  limit={Number(form.opening_stock) || 0}
                  onUpdate={setBaseSerials}
                />
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Pricing & Tax",
      subtitle: "Financial details",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="Buy Price" type="number" name="buy_price" value={form.buy_price} onChange={handleChange} placeholder="0.00" />
            <Input label="Sell Price" type="number" name="sell_price" value={form.sell_price} onChange={handleChange} placeholder="0.00" />
            <Input label="MRP" type="number" name="mrp" value={form.mrp} onChange={handleChange} placeholder="0.00" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GST Rate</label>
              <ReusableSelect
                value={form.gst}
                onValueChange={(val) => setForm(p => ({ ...p, gst: val }))}
                options={GST_RATES.map(r => ({ label: r, value: r }))}
              />
            </div>

          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Variants",
      subtitle: "Product attributes & combinations",
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 md:p-5 rounded-[1.5rem] bg-indigo-50 border border-indigo-100 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-indigo-900 uppercase tracking-tight">Enable Variants</p>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Multiple sizes, colors, etc.</p>
              </div>
            </div>
            <Switch checked={form.has_variants} onCheckedChange={(val) => setForm(f => ({ ...f, has_variants: val }))} />
          </div>

          {form.has_variants && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <VariantBuilder
                variantTypes={variantTypes}
                onChange={setVariantTypes}
                suggestedTypes={config.suggestedVariantTypes}
              />
              
              {variantTypes.some(t => t.values.length > 0) && (
                <div className="pt-4 border-t border-slate-100">
                  <VariantMatrixTable
                    combinations={combinations}
                    variantTypes={variantTypes}
                    supportsSerials={form.serial_tracking}
                    supportsBatch={form.batch_tracking}
                    serialLabel={config.serialLabel}
                    onChange={setCombinations}
                  />
                </div>
              )}
            </div>
          )}

          {!form.has_variants && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-50 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-[2rem] bg-slate-100 flex items-center justify-center text-slate-300">
                <Layers size={32} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">No Variants Enabled</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider max-w-[200px]">
                  Enable variants to add multiple versions of this product
                </p>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 5,
      title: "Overview",
      subtitle: "Review details before creating",
      content: (
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 border border-slate-100 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight">{form.name || "Untitled Product"}</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{form.category} • {form.brand || "No Brand"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Stock</p>
                <p className="text-base md:text-xl font-black text-blue-600">
                  {form.has_variants 
                    ? combinations.reduce((s, c) => s + (Number(c.stock) || 0), 0)
                    : (Number(form.opening_stock) || 0)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-slate-200/60">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buy Price</p>
                <p className="text-sm font-bold text-slate-700">₹{Number(form.buy_price).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sell Price</p>
                <p className="text-sm font-bold text-slate-700">₹{Number(form.sell_price).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax (GST)</p>
                <p className="text-sm font-bold text-slate-700">{form.gst}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              {form.has_variants && (
                <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-widest">
                  {combinations.length} Variants
                </span>
              )}
              {form.batch_tracking && (
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest">
                  Batch Tracked
                </span>
              )}
              {form.serial_tracking && (
                <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-[9px] font-black uppercase tracking-widest">
                  Serial Tracked
                </span>
              )}
            </div>
          </div>

          {/* NEW: Detailed Breakdown for Tracking & Variants */}
          {form.has_variants && combinations.filter(c => c.active).length > 0 && (
            <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Variants Details</h3>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  {combinations.filter(c => c.active).length} Active
                </span>
              </div>
              <div className="divide-y divide-slate-50">
                {combinations.filter(c => c.active).map((combo, idx) => (
                  <div key={combo.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                          {Object.values(combo.attributes).join(" / ")}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SKU: {combo.barcode || "N/A"}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Stock: {combo.stock}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {form.batch_tracking && combo.batch?.name && (
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                            Batch: {combo.batch.name}
                          </span>
                          <span className="text-[8px] text-slate-400 mt-0.5 uppercase tracking-tighter">Exp: {combo.batch.expiry_date || 'N/A'}</span>
                        </div>
                      )}
                      {form.serial_tracking && combo.serials.length > 0 && (
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-violet-600 uppercase tracking-widest bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
                            {combo.serials.length} Serials
                          </span>
                          <div className="flex gap-1 mt-1">
                             {combo.serials.slice(0, 2).map((s, i) => (
                               <span key={i} className="text-[8px] font-mono text-slate-400 bg-slate-100 px-1 rounded truncate max-w-[50px]">{s.serial}</span>
                             ))}
                             {combo.serials.length > 2 && <span className="text-[8px] text-slate-300">+{combo.serials.length - 2}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!form.has_variants && (form.batch_tracking || form.serial_tracking) && (
            <div className="p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracking Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.batch_tracking && form.batch_name && (
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Active Batch</p>
                    <p className="text-sm font-bold text-slate-800">{form.batch_name}</p>
                    <div className="flex gap-3 mt-2">
                       <div>
                         <p className="text-[8px] text-slate-400 uppercase font-black">MFG</p>
                         <p className="text-[10px] font-bold text-slate-600">{form.mfg_date || 'N/A'}</p>
                       </div>
                       <div>
                         <p className="text-[8px] text-slate-400 uppercase font-black">EXP</p>
                         <p className="text-[10px] font-bold text-slate-600">{form.exp_date || 'N/A'}</p>
                       </div>
                    </div>
                  </div>
                )}
                {form.serial_tracking && baseSerials.length > 0 && (
                  <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100">
                    <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-2">{baseSerials.length} Registered Serials</p>
                    <div className="flex flex-wrap gap-1">
                      {baseSerials.slice(0, 5).map((s, i) => (
                        <span key={i} className="text-[9px] font-mono bg-white border border-violet-100 text-violet-500 px-1.5 py-0.5 rounded-md">{s}</span>
                      ))}
                      {baseSerials.length > 5 && <span className="text-[9px] text-violet-300 font-bold">+{baseSerials.length - 5} more</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-blue-50/50 border border-blue-100 flex gap-3 md:gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-blue-800 uppercase tracking-widest">Ready for Creation</p>
              <p className="text-[10px] font-bold text-blue-600 leading-relaxed uppercase tracking-wider">
                Click complete below to finalize the registration of this product into your inventory.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleSubmit = async () => {
    if (!form.name) return showToast("Product name is required", "error");

    setSubmitting(true);
    try {
      const mappedVariants = form.has_variants ? combinations.filter(c => c.active).map(combo => {
        const buyPrice = Number(combo.buy_price) || Number(form.buy_price) || 0;
        const sellPrice = Number(combo.price) || Number(form.sell_price) || 0;
        const mrp = Number(combo.mrp) || Number(form.mrp) || 0;
        const stocks = Number(combo.stock) || 0;
        const variantName = Object.values(combo.attributes).join(" / ");

        return {
          name: variantName,
          buy_price: buyPrice,
          sell_price: sellPrice,
          stocks: stocks,
          serial_numbers: combo.serials.map(s => s.serial),
          datas: {
            barcode: combo.barcode,
            mrp: mrp,
            attributes: combo.attributes,
          },
          batch: combo.batch?.name ? {
            name: combo.batch.name,
            expiry_date: combo.batch.expiry_date,
            manufacturing_date: combo.batch.manufacturing_date,
            stocks: stocks,
            serial_numbers: combo.serials.length > 0 ? {
              serial_numbers: combo.serials.map(s => s.serial)
            } : null
          } : null
        };
      }) : [];

      const payload = {
        shop_id: SHOP_ID,
        name: form.name,
        category: form.category,
        description: form.description,
        buy_price: Number(form.buy_price) || 0,
        sell_price: Number(form.sell_price) || 0,
        stocks: form.has_variants 
          ? combinations.reduce((s, c) => s + (Number(c.stock) || 0), 0)
          : (Number(form.opening_stock) || 0),
        barcode: form.barcode,
        has_variant: form.has_variants,
        has_serialno: form.serial_tracking,
        has_batch: form.batch_tracking,
        variants: mappedVariants,
        serial_numbers: !form.has_variants ? baseSerials : [],
        batch: (!form.has_variants && form.batch_tracking) ? {
          name: form.batch_name,
          manufacturing_date: form.mfg_date,
          expiry_date: form.exp_date,
          serial_numbers: baseSerials.length > 0 ? {
            serial_numbers: baseSerials
          } : null
        } : null,
        datas: {
          brand: form.brand,
          unit: form.unit,
          mrp: Number(form.mrp) || 0,
          gst: form.gst,
          hsn: form.hsn,
          reorder_point: Number(form.reorder_point) || 0,
          opening_stock: Number(form.opening_stock) || 0,
          description: form.description,
          is_active: form.is_active,
          variant_types: form.has_variants ? variantTypes : [],
        }
      };

      const res = await postData(ENDPOINTS.INVENTORIES, payload);
      
      if (res) {
        showToast("Product created successfully", "success");
        onSuccess(res.data || res);
        onClose();
      }
    } catch (error) {
      showToast("Failed to create product", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <QuickCreateModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Product"
      steps={steps}
      onSubmit={handleSubmit}
      isSubmitting={submitting}
      submitLabel="Complete Creation"
      size="xl"
    />
  );
};