import { useState, useEffect } from "react";
import { StoreFormData, SelectedProductConfig } from "@/features/digitalstore/type";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { inventoryCustomFieldsApi, inventoryApi } from "@/services/api/inventory";
import type { InventoryCustomFieldDefinition } from "@/features/inventory/types";
import {
  Search, Package, Check, Settings, Plus, Trash2,
  Loader2, ChevronDown, X, Save,
} from "lucide-react";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";

interface Step3Props {
  form: StoreFormData;
  setForm: React.Dispatch<React.SetStateAction<StoreFormData>>;
}

// ─── Field type label ─────────────────────────────────────────────────────────
const TYPE_LABEL: Record<string, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  boolean: "Yes / No",
};

// ─── Type badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  return (
    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
      {TYPE_LABEL[type] ?? type}
    </span>
  );
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

  // Custom field definitions (shop-wide)
  const [fieldDefs, setFieldDefs]           = useState<InventoryCustomFieldDefinition[]>([]);
  const [fieldValues, setFieldValues]       = useState<Record<string, string>>({});
  const [loadingFields, setLoadingFields]   = useState(false);

  // "Add Field" mini-form inside the sidebar
  const [showAddField, setShowAddField]     = useState(false);
  const [newFieldLabel, setNewFieldLabel]   = useState("");
  const [newFieldName, setNewFieldName]     = useState("");
  const [newFieldType, setNewFieldType]     = useState("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldVisible, setNewFieldVisible]   = useState(true);
  const [creatingField, setCreatingField]   = useState(false);
  const [savingDesc, setSavingDesc]         = useState(false);

  // Load products
  useEffect(() => {
    getData(`${ENDPOINTS.INVENTORIES}/by/shop/${SHOP_ID}?limit=50&offset=1`).then((res) => {
      const items = res?.data || res?.datas || [];
      if (Array.isArray(items)) setProducts(items);
    });
  }, []);

  // Load global custom field definitions
  useEffect(() => {
    inventoryCustomFieldsApi.getAllFields(SHOP_ID).then(setFieldDefs);
  }, []);

  const reloadFieldDefs = async () => {
    const defs = await inventoryCustomFieldsApi.getAllFields(SHOP_ID);
    setFieldDefs(defs);
  };

  // Load product-specific field values + description when opening sidebar
  const loadProductData = async (product: any) => {
    setLoadingFields(true);
    setDescription(product.description || "");
    try {
      const values = await inventoryCustomFieldsApi.getValuesByProduct(SHOP_ID, product.id);
      const map: Record<string, string> = {};
      values.forEach((v) => { map[v.field_id] = v.value; });
      setFieldValues(map);
    } catch {
      setFieldValues({});
    } finally {
      setLoadingFields(false);
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
    setShowAddField(false);
    setNewFieldLabel(""); setNewFieldName(""); setNewFieldType("text");
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
        [activeProduct.id]: sidebarConfig,
      },
    }));
    setActiveProduct(null);
  };

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim() || !newFieldName.trim()) return;
    setCreatingField(true);
    try {
      await inventoryCustomFieldsApi.createField({
        shop_id: SHOP_ID,
        field_infos: [{
          field_name: newFieldName,
          label_name: newFieldLabel,
          type: newFieldType,
          required: newFieldRequired,
          visible_online: newFieldVisible,
        }],
      });
      await reloadFieldDefs();
      setShowAddField(false);
      setNewFieldLabel(""); setNewFieldName(""); setNewFieldType("text");
      setNewFieldRequired(false); setNewFieldVisible(true);
    } catch (e) {
      console.error("Failed to create field", e);
    } finally {
      setCreatingField(false);
    }
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

            {/* ── Custom Fields ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Additional Details
                    <span className="text-slate-300 font-normal normal-case ml-1">(optional, up to 3)</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Add custom sections like ingredients, storage, allergen info.
                  </p>
                </div>
                {!showAddField && fieldDefs.length < 3 && (
                  <button
                    onClick={() => setShowAddField(true)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus size={12} /> Add Field
                  </button>
                )}
              </div>

              {/* Add new field form */}
              {showAddField && (
                <form
                  onSubmit={handleCreateField}
                  className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-blue-700">New Custom Field</span>
                    <button type="button" onClick={() => setShowAddField(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X size={13} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-medium text-slate-500">Field Label</label>
                      <input
                        type="text"
                        value={newFieldLabel}
                        onChange={(e) => {
                          const v = e.target.value;
                          setNewFieldLabel(v);
                          setNewFieldName(v.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "_"));
                        }}
                        placeholder="e.g. Ingredients"
                        required
                        className="w-full mt-1 h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-medium text-slate-500">DB Name (auto)</label>
                        <input
                          type="text"
                          value={newFieldName}
                          disabled
                          className="w-full mt-1 h-8 px-2.5 text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-500">Data Type</label>
                        <div className="relative mt-1">
                          <select
                            value={newFieldType}
                            onChange={(e) => setNewFieldType(e.target.value)}
                            className="w-full h-8 pl-2.5 pr-7 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 appearance-none cursor-pointer"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="boolean">Yes / No</option>
                          </select>
                          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={newFieldRequired} onChange={(e) => setNewFieldRequired(e.target.checked)} className="rounded" />
                        Required
                      </label>
                      <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={newFieldVisible} onChange={(e) => setNewFieldVisible(e.target.checked)} className="rounded" />
                        Visible Online
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={creatingField || !newFieldLabel.trim()}
                    className="w-full h-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {creatingField
                      ? <><Loader2 size={12} className="animate-spin" /> Creating…</>
                      : <><Save size={12} /> Save Field</>
                    }
                  </button>
                </form>
              )}

              {/* Existing fields */}
              {loadingFields ? (
                <div className="flex items-center justify-center py-4 gap-2 text-xs text-slate-400">
                  <Loader2 size={13} className="animate-spin" /> Loading fields…
                </div>
              ) : fieldDefs.length === 0 ? (
                <div className="text-center py-5 rounded-xl border border-dashed border-slate-200">
                  <p className="text-[11px] text-slate-400">No custom fields yet.</p>
                  <button
                    onClick={() => setShowAddField(true)}
                    className="mt-1 text-[11px] font-semibold text-blue-500 hover:text-blue-700 cursor-pointer"
                  >
                    Create your first field
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {fieldDefs.map((field, idx) => (
                    <div
                      key={field.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                    >
                      {/* Field header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">
                            {field.label_name}
                            {field.required && <span className="text-red-400 ml-0.5">*</span>}
                          </span>
                          <TypeBadge type={field.type} />
                          {field.visible_online && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">Online</span>
                          )}
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await inventoryCustomFieldsApi.deleteField(SHOP_ID, field.id);
                              await reloadFieldDefs();
                              const newVals = { ...fieldValues };
                              delete newVals[field.id];
                              setFieldValues(newVals);
                            } catch (e) {
                              console.error("Failed to delete field", e);
                            }
                          }}
                          title="Delete field"
                          className="w-6 h-6 rounded-md flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

                      {/* Field value input */}
                      {field.type === "boolean" ? (
                        <div className="flex gap-2">
                          {["true", "false"].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setFieldValues(prev => ({ ...prev, [field.id]: val }))}
                              className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium cursor-pointer transition-colors ${
                                fieldValues[field.id] === val
                                  ? "bg-blue-50 border-blue-200 text-blue-600"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {val === "true" ? "Yes" : "No"}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          rows={field.type === "text" ? 3 : 1}
                          value={fieldValues[field.id] || ""}
                          onChange={(e) => setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                          placeholder={`Enter ${field.label_name.toLowerCase()}…`}
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 resize-none leading-relaxed"
                        />
                      )}
                    </div>
                  ))}

                  {/* Add more fields button */}
                  {!showAddField && fieldDefs.length < 3 && (
                    <button
                      onClick={() => setShowAddField(true)}
                      className="w-full py-2 rounded-xl border border-dashed border-slate-300 text-[11px] font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus size={12} /> Add another field
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </RightSidebarFilter>
    </div>
  );
}
