import { useState, useEffect } from "react";
import { StoreFormData, SelectedProductConfig } from "@/features/digitalstore/type";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { inventoryCustomFieldsApi, inventoryApi } from "@/services/api/inventory";
import {
  Search, Package, Check, Settings2, Plus, Trash2,
  Loader2, IndianRupee, Layers, Tag, BarChart2, X, ShoppingBag,
} from "lucide-react";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";

interface Step3Props {
  form: StoreFormData;
  setForm: React.Dispatch<React.SetStateAction<StoreFormData>>;
}

// ─── Utilities (unchanged from original) ─────────────────────────────────────

const parseObjects = (val: any): any[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "object") return Object.values(val);
  return [];
};

const getProductStock = (p: any): number => {
  if (!p) return 0;
  const hasVariants = p.type_infos?.has_variant || (p.variants && Object.keys(p.variants).length > 0);
  const hasBatches = p.type_infos?.has_batch || (p.batch_infos && p.batch_infos.length > 0);

  if (hasVariants && p.variants) {
    const variantList = parseObjects(p.variants);
    return variantList.reduce((sum: number, v: any) => {
      const vBatches = parseObjects(v.batch_infos ?? v.batches);
      let vStock = Number(v.stock_infos?.available_stocks ?? v.stock_infos?.physical_stocks ?? v.stocks ?? 0);
      if (vBatches.length > 0 || vStock === 0) {
        const bSum = vBatches.reduce((acc: number, b: any) => acc + Number(b.stock_infos?.available_stocks ?? b.stock_infos?.physical_stocks ?? b.stocks ?? 0), 0);
        if (bSum > 0) vStock = bSum;
      }
      return sum + vStock;
    }, 0);
  }

  if (hasBatches && p.batch_infos && p.batch_infos.length > 0) {
    const bSum = parseObjects(p.batch_infos).reduce((sum: number, b: any) => {
      return sum + Number(b.stock_infos?.available_stocks ?? b.stock_infos?.physical_stocks ?? b.stocks ?? 0);
    }, 0);
    if (bSum > 0) return bSum;
  }

  return Number(p.stock_infos?.available_stocks ?? p.stock_infos?.physical_stocks ?? p.stocks ?? 0);
};

const getProductPrices = (p: any) => {
  if (!p) return { sellPrice: 0, onlinePrice: 0, buyPrice: 0 };
  const hasVariants = p.type_infos?.has_variant || (p.variants && Object.keys(p.variants).length > 0);
  const hasBatches = p.type_infos?.has_batch || (p.batch_infos && p.batch_infos.length > 0);

  let sellPrice = p.pricing_infos?.sell_price ?? p.sell_price;
  let onlinePrice = p.pricing_infos?.online_sell_price ?? p.online_sell_price;
  let buyPrice = p.pricing_infos?.buy_price ?? p.buy_price;

  if (hasVariants && p.variants && (sellPrice === undefined || sellPrice === null)) {
    const variantList = parseObjects(p.variants);
    const variantWithPrice = variantList.find((v: any) => (v.pricing_infos?.sell_price ?? v.sell_price) !== undefined);
    if (variantWithPrice) {
      sellPrice = variantWithPrice.pricing_infos?.sell_price ?? variantWithPrice.sell_price;
      onlinePrice = variantWithPrice.pricing_infos?.online_sell_price ?? variantWithPrice.online_sell_price;
      buyPrice = variantWithPrice.pricing_infos?.buy_price ?? variantWithPrice.buy_price;
    }
  }

  if (hasBatches && p.batch_infos && p.batch_infos.length > 0 && (sellPrice === undefined || sellPrice === null)) {
    const batchList = parseObjects(p.batch_infos);
    const batchWithPrice = batchList.find((b: any) => (b.pricing_infos?.sell_price ?? b.sell_price) !== undefined);
    if (batchWithPrice) {
      sellPrice = batchWithPrice.pricing_infos?.sell_price ?? batchWithPrice.sell_price;
      onlinePrice = batchWithPrice.pricing_infos?.online_sell_price ?? batchWithPrice.online_sell_price;
      buyPrice = batchWithPrice.pricing_infos?.buy_price ?? batchWithPrice.buy_price;
    }
  }

  const finalSell = Number(sellPrice ?? 0);
  const finalOnline = Number(onlinePrice ?? finalSell);
  const finalBuy = Number(buyPrice ?? 0);

  return { sellPrice: finalSell, onlinePrice: finalOnline, buyPrice: finalBuy };
};

const getProductImage = (p: any): string | null => {
  if (!p) return null;
  if (Array.isArray(p.image_url) && p.image_url.length > 0 && p.image_url[0]) return p.image_url[0];
  if (typeof p.image_url === "string" && p.image_url) return p.image_url;
  if (Array.isArray(p.images) && p.images.length > 0 && p.images[0]) return p.images[0];
  return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────

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

  // Local string state for Online Sell Price — shows "" when 0 so typing clears it
  const [onlinePriceStr, setOnlinePriceStr] = useState<string>("");

  // Additional Details State (up to 3 sections, with heading and free text field)
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
    getData(`${ENDPOINTS.INVENTORIES}/by/shop/${SHOP_ID}?limit=50&offset=1&active=true`).then((res) => {
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
        const { onlinePrice } = getProductPrices(product);
        newSelected[product.id] = {
          id: product.id,
          inventory_id: product.id,
          online_selling_price: onlinePrice,
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
    const { onlinePrice } = getProductPrices(product);
    const existingConfig = form.selectedProducts[product.id];
    const resolvedPrice = existingConfig?.online_selling_price ?? onlinePrice;
    setSidebarConfig(existingConfig
      ? { ...existingConfig, online_selling_price: existingConfig.online_selling_price ?? onlinePrice }
      : {
          id: product.id,
          inventory_id: product.id,
          online_selling_price: onlinePrice,
          online_reorder_point: product.reorder_point || 0,
          custom_fields: {},
          new_custom_fields: [],
        }
    );
    // Show "" for 0 so typing immediately clears it; otherwise show the saved value
    setOnlinePriceStr(resolvedPrice === 0 ? "" : String(resolvedPrice));
    setAdditionalSections((existingConfig as any)?.additional_sections || []);
    loadProductData(product);
  };

  const handleApplyConfig = async () => {
    if (!activeProduct || !sidebarConfig) return;

    // Save description and online price to backend
    setSavingDesc(true);
    try {
      const { buyPrice, sellPrice } = getProductPrices(activeProduct);
      await inventoryApi.updateInventory({
        id: activeProduct.id,
        shop_id: SHOP_ID,
        visible_online: true,
        buy_price: buyPrice,
        sell_price: sellPrice,
        online_sell_price: sidebarConfig.online_selling_price,
        description,
      });
    } catch (e) {
      console.error("Failed to save product details to backend", e);
    } finally {
      setSavingDesc(false);
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

  const selectedCount = Object.keys(form.selectedProducts).length;
  const MAX_DESC = 500;

  return (
    <div className="h-full overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-4 duration-300 relative">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4 gap-3 shrink-0">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-slate-800">Product Catalog</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Select products to feature online and configure their online pricing.</p>
        </div>
        <div className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full border text-[12px] font-bold transition-all
          ${selectedCount > 0 ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-slate-100 text-slate-500 border-slate-200"}`}
        >
          <ShoppingBag size={13} />
          {selectedCount} Selected
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input
          type="text"
          placeholder="Search products by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-sm py-2.5 pl-10 pr-10 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all bg-white"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors"
          >
            <X size={11} className="text-slate-600" />
          </button>
        )}
      </div>

      {/* ── Product list ── */}
      <div className="flex-1 overflow-y-auto min-h-0 rounded-xl border border-slate-200 bg-white custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12 text-slate-400">
            <Loader2 size={22} className="animate-spin text-blue-400" />
            <p className="text-xs font-medium">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Package size={22} className="text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">No products found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {searchTerm ? `No results for "${searchTerm}"` : "Your inventory appears to be empty."}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProducts.map(p => {
              const isSelected = !!form.selectedProducts[p.id];
              const { sellPrice, onlinePrice } = getProductPrices(p);
              const totalStock = getProductStock(p);
              const imgUrl = getProductImage(p);
              const categoryName = p.category_infos?.name || p.category_id || "";
              const unitName = p.unit_infos?.name || "";
              const variantCount = p.variants && typeof p.variants === "object" ? Object.keys(p.variants).length : 0;
              const batchCount = Array.isArray(p.batch_infos) ? p.batch_infos.length : 0;
              const hasPriceOverride = isSelected && form.selectedProducts[p.id]?.online_selling_price !== undefined &&
                form.selectedProducts[p.id]?.online_selling_price !== onlinePrice;

              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 px-4 py-3.5 transition-colors cursor-pointer select-none
                    ${isSelected ? "bg-blue-50/60 hover:bg-blue-50" : "hover:bg-slate-50"}`}
                  onClick={() => handleToggleProduct(p)}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all
                    ${isSelected
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>

                  {/* Product image */}
                  <div className={`w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center
                    ${isSelected ? "ring-2 ring-blue-400 ring-offset-1" : "bg-slate-100 text-slate-400"}`}
                  >
                    {imgUrl ? (
                      <img src={imgUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <Package size={18} className="text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-tight truncate ${isSelected ? "text-blue-800" : "text-slate-700"}`}>
                      {p.name}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      <p className="text-[10px] text-slate-400 font-mono">{p.sku || p.barcode || p.ui_id || p.id?.slice(0, 8)}</p>
                      {categoryName && categoryName.trim() !== "" && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-medium">{categoryName}</span>
                      )}
                      {(p.type_infos?.has_variant || variantCount > 0) && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-semibold">
                          <Layers size={9} className="inline mr-0.5" />
                          {variantCount > 0 ? `${variantCount}V` : "Variants"}
                        </span>
                      )}
                      {(p.type_infos?.has_batch || batchCount > 0) && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-semibold">
                          {batchCount > 0 ? `${batchCount}B` : "Batches"}
                        </span>
                      )}
                      {hasPriceOverride && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-semibold">
                          Price Set
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & Stock */}
                  <div className="shrink-0 text-right mr-1">
                    <p className={`text-sm font-bold ${isSelected ? "text-blue-700" : "text-slate-700"}`}>
                      ₹{sellPrice.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-end gap-0.5">
                      <BarChart2 size={9} />
                      {p.have_tracking === false ? "Untracked" : `${totalStock} ${unitName || "units"}`}
                    </p>
                  </div>

                  {/* Configure button */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openConfig(p); }}
                    title="Configure Online Settings"
                    className={`p-2 rounded-lg border transition-all shrink-0
                      ${isSelected
                        ? "border-blue-300 bg-blue-100 text-blue-600 hover:bg-blue-200"
                        : "border-slate-200 bg-white text-slate-400 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                      }`}
                  >
                    <Settings2 size={14} />
                  </button>
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

            {/* ── PRICING ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <IndianRupee size={14} className="text-slate-500" />
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Pricing Settings</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Store sell price (non-editable) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wide">
                    Store Sell Price
                  </label>
                  <div className="flex items-center h-10 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden cursor-not-allowed opacity-80">
                    <div className="h-full px-3 flex items-center justify-center border-r border-slate-200 bg-slate-100 text-slate-500 text-xs font-bold">
                      ₹
                    </div>
                    <input
                      type="number"
                      disabled
                      readOnly
                      value={Number(getProductPrices(activeProduct).sellPrice).toFixed(2)}
                      className="w-full bg-transparent px-3 text-sm font-semibold text-slate-500 cursor-not-allowed outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">From inventory (read-only)</p>
                </div>

                {/* Online sell price (editable) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1.5 block uppercase tracking-wide">
                    Online Sell Price
                  </label>
                  <div className="flex items-center h-10 rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <div className="h-full px-3 flex items-center justify-center border-r border-slate-200 bg-slate-50 text-slate-600 text-xs font-bold">
                      ₹
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      min="0"
                      value={onlinePriceStr}
                      onChange={(e) => {
                        const raw = e.target.value;
                        // Allow digits, one dot, up to 2 decimal places
                        if (raw === "" || /^\d*\.?\d{0,2}$/.test(raw)) {
                          setOnlinePriceStr(raw);
                          setSidebarConfig(prev => prev ? { ...prev, online_selling_price: raw === "" ? 0 : Number(raw) } : prev);
                        }
                      }}
                      onFocus={() => {
                        // Clear "0" when user focuses so they can type fresh
                        if (onlinePriceStr === "0" || onlinePriceStr === "0.00") setOnlinePriceStr("");
                      }}
                      onBlur={() => {
                        // On blur, restore "0" if empty
                        if (onlinePriceStr === "") setOnlinePriceStr("0");
                      }}
                      className="w-full bg-transparent px-3 text-sm font-bold text-slate-800 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Set the price for your online store</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* ── Product Description ── */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag size={13} className="text-slate-500" />
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Product Description
                </label>
              </div>
              <textarea
                rows={4}
                maxLength={MAX_DESC}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter product description..."
                className="w-full text-sm p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white leading-relaxed resize-none"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Clear, concise descriptions convert better.</span>
                <span className={`font-mono ${description.length > MAX_DESC * 0.9 ? "text-red-500 font-bold" : ""}`}>
                  {description.length} / {MAX_DESC}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* ── Additional Fields ── */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <Layers size={13} className="text-slate-500" />
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Additional Fields <span className="text-slate-400 font-normal normal-case ml-1">({additionalSections.length}/3)</span>
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Add custom info sections (e.g. Ingredients, Care instructions, Allergen info).
                </p>
              </div>

              {additionalSections.map((section, index) => (
                <div key={section.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-700">Section {index + 1}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSection(section.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                      title="Remove section"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Heading</label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                      placeholder="e.g. Storage instructions"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Details</label>
                    <textarea
                      rows={3}
                      value={section.content}
                      onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                      placeholder="What should customers know? Keep it short and clear."
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 resize-none text-slate-700"
                    />
                  </div>
                </div>
              ))}

              {additionalSections.length < 3 && (
                <button
                  type="button"
                  onClick={addSection}
                  className="w-full py-2.5 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Add Additional Field
                </button>
              )}
            </div>
          </div>
        )}
      </RightSidebarFilter>
    </div>
  );
}
