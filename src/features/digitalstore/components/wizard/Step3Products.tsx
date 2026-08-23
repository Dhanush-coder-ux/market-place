import { useState, useEffect } from "react";
import { StoreFormData, SelectedProductConfig } from "@/features/digitalstore/type";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { inventoryCustomFieldsApi, inventoryApi } from "@/services/api/inventory";
import {
  Search, Package, Check, Settings, Plus, Trash2,
  Loader2, GripVertical,
} from "lucide-react";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";

interface Step3Props {
  form: StoreFormData;
  setForm: React.Dispatch<React.SetStateAction<StoreFormData>>;
}


// ═══════════════════════════════════════════════════════════════════════════════
export default function Step3Products({ form, setForm }: Step3Props) {
  const { getData, loading } = useApi();
  const [products, setProducts]             = useState<any[]>([]);
  const [searchTerm, setSearchTerm]         = useState("");
  const [activeProduct, setActiveProduct]   = useState<any | null>(null);
  const [sidebarConfig, setSidebarConfig]   = useState<SelectedProductConfig | null>(null);

  // Description in sidebar
  const [description, setDescription]       = useState("");

  const [fieldValues, setFieldValues]       = useState<Record<string, string>>({});

  const [savingDesc, setSavingDesc]         = useState(false);

  // Additional Details State
  const [additionalSections, setAdditionalSections] = useState<{ id: string; title: string; content: string }[]>([]);

  const addSection = () => {
    if (additionalSections.length >= 3) return;
    setAdditionalSections([...additionalSections, { id: Date.now().toString(), title: "", content: "" }]);
  };

  const updateSection = (id: string, field: 'title' | 'content', value: string) => {
    setAdditionalSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSection = (id: string) => {
    setAdditionalSections(prev => prev.filter(s => s.id !== id));
  };

  // Load products
  useEffect(() => {
    getData(`${ENDPOINTS.INVENTORIES}/by/shop/${SHOP_ID}?limit=50&offset=1`).then((res) => {
      const items = res?.data || res?.datas || [];
      if (Array.isArray(items)) setProducts(items);
    });
  }, []);

  // Load product-specific field values + description when opening sidebar
  const loadProductData = async (product: any) => {
    setDescription(product.description || "");
    try {
      const values = await inventoryCustomFieldsApi.getValuesByProduct(SHOP_ID, product.id);
      const map: Record<string, string> = {};
      values.forEach((v) => { map[v.field_id] = v.value; });
      setFieldValues(map);
    } catch {
      setFieldValues({});
    }
  };

  const handleToggleProduct = (product: any) => {
    setForm(prev => {
      const newSelected = { ...prev.selectedProducts };
      if (newSelected[product.id]) {
        delete newSelected[product.id];
      } else {
        newSelected[product.id] = {
          id: product.id,
          inventory_id: product.id,
          online_selling_price: product.sell_price || 0,
          online_reorder_point: product.reorder_point || 0,
          custom_fields: {},
          new_custom_fields: [],
        };
      }
      return { ...prev, selectedProducts: newSelected };
    });
  };

  const openConfig = (product: any) => {
    setActiveProduct(product);
    const existingConfig = form.selectedProducts[product.id];
    setSidebarConfig(existingConfig
      ? { ...existingConfig }
      : {
          id: product.id,
          inventory_id: product.id,
          online_selling_price: product.pricing_infos?.sell_price || 0,
          online_reorder_point: product.reorder_point || 0,
          custom_fields: {},
          new_custom_fields: [],
        }
    );
    setAdditionalSections((existingConfig as any)?.additional_sections || []);
    loadProductData(product);
  };

  const handleApplyConfig = async () => {
    if (!activeProduct || !sidebarConfig) return;

    // Save description if changed
    if (description !== (activeProduct.description || "")) {
      setSavingDesc(true);
      try {
        await inventoryApi.updateInventory({
          id: activeProduct.id,
          shop_id: SHOP_ID,
          description,
        });
      } catch (e) {
        console.error("Failed to save description", e);
      } finally {
        setSavingDesc(false);
      }
    }

    // Save custom field values
    const valuesToSave = Object.entries(fieldValues).map(([field_id, value]) => ({ field_id, value: String(value) }));
    if (valuesToSave.length > 0) {
      try {
        await inventoryCustomFieldsApi.bulkUpsertValues({
          shop_id: SHOP_ID,
          product_id: activeProduct.id,
          values: valuesToSave,
        });
      } catch (e) {
        console.error("Failed to save field values", e);
      }
    }

    setForm(prev => ({
      ...prev,
      selectedProducts: {
        ...prev.selectedProducts,
        [activeProduct.id]: {
          ...sidebarConfig,
          additional_sections: additionalSections,
        } as any,
      },
    }));
    setActiveProduct(null);
  };

  

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const MAX_DESC = 500;

  return (
    <div className="h-full overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-4 duration-300 relative">

      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Select Products for Digital Store</h3>
          <p className="text-[11px] text-slate-500">Choose which products to feature online, then configure each.</p>
        </div>
        <div className="text-[11px] font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full shrink-0">
          {Object.keys(form.selectedProducts).length} Selected
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input
          type="text"
          placeholder="Search inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
        />
      </div>

      {/* Product list */}
      <div className="flex-1 overflow-y-auto min-h-0 border border-slate-100 rounded-xl custom-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center h-full text-xs text-slate-400 gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex justify-center items-center h-full text-xs text-slate-400">No products found.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredProducts.map(p => {
              const isSelected = !!form.selectedProducts[p.id];
              return (
                <div key={p.id} className={`flex items-center justify-between p-3 transition-colors ${isSelected ? "bg-blue-50/30" : "hover:bg-slate-50"}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleProduct(p)}
                      className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 text-transparent"}`}
                    >
                      <Check size={12} strokeWidth={3} />
                    </button>
                    <div className="w-9 h-9 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                      {(Array.isArray(p.image_url) && p.image_url[0]) ? (
                        <img src={p.image_url[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={16} />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-700 leading-tight truncate">{p.name}</p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-[80px]">{p.sku || p.barcode || p.id?.slice(0, 8)}</p>
                        {p.category_infos?.name && (
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md whitespace-nowrap">{p.category_infos.name}</span>
                        )}
                        {p.type_infos?.has_variant && (
                          <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-semibold whitespace-nowrap">Variants</span>
                        )}
                        {p.description && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md whitespace-nowrap">Has description</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-slate-700">₹{p.pricing_infos?.sell_price?.toFixed(2) || "0.00"}</p>
                      <p className="text-[10px] text-slate-400">{p.stock_infos?.available_stocks || 0} {p.unit_infos?.name || "in stock"}</p>
                    </div>
                    <button
                      onClick={() => openConfig(p)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors shrink-0"
                      title="Configure Online Settings"
                    >
                      <Settings size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Configuration Sidebar ── */}
      <RightSidebarFilter
        isOpen={!!activeProduct}
        onClose={() => setActiveProduct(null)}
        onApply={handleApplyConfig}
        applyLabel={savingDesc ? "Saving…" : "Save Changes"}
        onClear={() => {}}
        title={`Configure ${activeProduct?.name ?? ""}`}
      >
        {sidebarConfig && (
          <div className="space-y-6 pb-4">

            {/* ── Online Price & Reorder ── */}
            <div className="space-y-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Online Settings</p>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block">Online Selling Price</label>
                <input
                  type="number"
                  value={sidebarConfig.online_selling_price || ""}
                  onChange={(e) => setSidebarConfig(prev => prev ? { ...prev, online_selling_price: e.target.value ? Number(e.target.value) : 0 } : prev)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-none focus:border-blue-500 bg-slate-50"
                  placeholder="e.g. 299"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block">Online Reorder Point</label>
                <input
                  type="number"
                  value={sidebarConfig.online_reorder_point || ""}
                  onChange={(e) => setSidebarConfig(prev => prev ? { ...prev, online_reorder_point: e.target.value ? Number(e.target.value) : 0 } : prev)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-none focus:border-blue-500 bg-slate-50"
                  placeholder="e.g. 5"
                />
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* ── Product Description ── */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Product Description</p>
              <textarea
                rows={4}
                maxLength={MAX_DESC}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short, friendly description converts better than a long one."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-none focus:border-blue-500 bg-slate-50 resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>A short, friendly description converts better than a long one.</span>
                <span className={`font-mono ${description.length > MAX_DESC * 0.9 ? "text-red-500" : ""}`}>
                  {description.length} / {MAX_DESC}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* ── Additional Details ── */}
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  ADDITIONAL DETAILS <span className="text-slate-400 font-normal normal-case ml-1">(optional, up to 3)</span>
                </p>
                <p className="text-[12px] text-slate-500 mt-1">
                  Add custom sections like ingredients, storage instructions, allergen info, or anything your customers should know.
                </p>
              </div>

              {additionalSections.map((section, index) => (
                <div key={section.id} className="border border-[#e5e2db] rounded-xl overflow-hidden bg-[#fdfaf5]">
                  <div className="px-3 py-2.5 flex items-center justify-between border-b border-[#e5e2db]">
                    <div className="flex items-center gap-3 flex-1">
                      <GripVertical size={14} className="text-slate-300 cursor-grab shrink-0" />
                      <div className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                        placeholder="Section heading (e.g. Storage instructions)"
                        className="bg-transparent border-none outline-none text-sm font-semibold text-slate-600 placeholder:text-slate-400 w-full"
                      />
                    </div>
                    <button
                      onClick={() => removeSection(section.id)}
                      className="text-slate-400 hover:text-red-500 shrink-0 ml-2"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="p-3 bg-[#fdfaf5]">
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                      placeholder="What should customers know? Keep it short and clear."
                      className="w-full h-20 resize-none border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
              ))}

              {additionalSections.length < 3 && (
                <button
                  onClick={addSection}
                  className="w-full py-3 border border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus size={16} /> Add another section
                </button>
              )}
            </div>
          </div>
        )}
      </RightSidebarFilter>
    </div>
  );
}
