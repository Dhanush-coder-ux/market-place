import { useState, useEffect } from "react";
import { StoreFormData, SelectedProductConfig } from "@/features/digitalstore/type";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { Search, Package, Check, Settings, Plus, X } from "lucide-react";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";

interface Step3Props {
  form: StoreFormData;
  setForm: React.Dispatch<React.SetStateAction<StoreFormData>>;
}

export default function Step3Products({ form, setForm }: Step3Props) {
  const { getData, loading } = useApi();
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeProduct, setActiveProduct] = useState<any | null>(null);

  // Local state for the sidebar form
  const [sidebarConfig, setSidebarConfig] = useState<SelectedProductConfig | null>(null);

  useEffect(() => {
    getData(`${ENDPOINTS.INVENTORIES}/by/shop/${SHOP_ID}?limit=50&offset=1`).then((res) => {
      const items = res?.data || res?.datas || [];
      if (Array.isArray(items)) {
        setProducts(items);
      }
    });
  }, []);

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
          new_custom_fields: []
        };
      }
      return { ...prev, selectedProducts: newSelected };
    });
  };

  const openConfig = (product: any) => {
    setActiveProduct(product);
    const existingConfig = form.selectedProducts[product.id];
    if (existingConfig) {
      setSidebarConfig({ ...existingConfig });
    } else {
      setSidebarConfig({
        id: product.id,
        inventory_id: product.id,
        online_selling_price: product.sell_price || 0,
        online_reorder_point: product.reorder_point || 0,
        custom_fields: {},
        new_custom_fields: []
      });
    }
  };

  const handleApplyConfig = () => {
    if (!activeProduct || !sidebarConfig) return;
    setForm(prev => ({
      ...prev,
      selectedProducts: {
        ...prev.selectedProducts,
        [activeProduct.id]: sidebarConfig
      }
    }));
    setActiveProduct(null);
  };

  const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300 relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Select Products for Digital Store</h3>
          <p className="text-[11px] text-slate-500">Choose which products you want to feature online.</p>
        </div>
        <div className="text-[11px] font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
          {Object.keys(form.selectedProducts).length} Selected
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input 
          type="text" 
          placeholder="Search inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto min-h-[300px] border border-slate-100 rounded-xl custom-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center h-full text-xs text-slate-400">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex justify-center items-center h-full text-xs text-slate-400">No products found.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredProducts.map(p => {
              const isSelected = !!form.selectedProducts[p.id];
              return (
                <div key={p.id} className={`flex items-center justify-between p-3 transition-colors ${isSelected ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleToggleProduct(p)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-transparent'}`}
                    >
                      <Check size={12} strokeWidth={3} />
                    </button>
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                      <Package size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.sku || p.barcode || p.id?.slice(0,8)}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => openConfig(p)}
                    className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                    title="Configure Online Settings"
                  >
                    <Settings size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Configuration Sidebar */}
      <RightSidebarFilter
        isOpen={!!activeProduct}
        onClose={() => setActiveProduct(null)}
        onApply={handleApplyConfig}
        onClear={() => {}} // Not used
        title={`Configure ${activeProduct?.name}`}
      >
        {sidebarConfig && (
          <div className="space-y-5">
            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Online Selling Price</label>
              <input 
                type="number" 
                value={sidebarConfig.online_selling_price || ""} 
                onChange={(e) => setSidebarConfig(prev => prev ? {...prev, online_selling_price: e.target.value ? Number(e.target.value) : 0} : prev)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Online Reorder Point</label>
              <input 
                type="number" 
                value={sidebarConfig.online_reorder_point || ""} 
                onChange={(e) => setSidebarConfig(prev => prev ? {...prev, online_reorder_point: e.target.value ? Number(e.target.value) : 0} : prev)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-500 mb-2 block">Custom Fields</label>
              
              {sidebarConfig.new_custom_fields.map((cf, idx) => (
                <div key={idx} className="flex gap-2 items-start mb-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div className="flex-1 space-y-2">
                    <input 
                      type="text" 
                      placeholder="Field Name" 
                      value={cf.key}
                      onChange={(e) => {
                        const newCfs = [...sidebarConfig.new_custom_fields];
                        newCfs[idx].key = e.target.value;
                        setSidebarConfig(prev => prev ? {...prev, new_custom_fields: newCfs} : prev);
                      }}
                      className="w-full text-[11px] p-1.5 rounded border border-slate-200 outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text" 
                      placeholder="Value" 
                      value={cf.value}
                      onChange={(e) => {
                        const newCfs = [...sidebarConfig.new_custom_fields];
                        newCfs[idx].value = e.target.value;
                        setSidebarConfig(prev => prev ? {...prev, new_custom_fields: newCfs} : prev);
                      }}
                      className="w-full text-[11px] p-1.5 rounded border border-slate-200 outline-none focus:border-blue-500"
                    />
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 mt-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={cf.visible_online}
                        onChange={(e) => {
                          const newCfs = [...sidebarConfig.new_custom_fields];
                          newCfs[idx].visible_online = e.target.checked;
                          setSidebarConfig(prev => prev ? {...prev, new_custom_fields: newCfs} : prev);
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500 h-3 w-3 cursor-pointer"
                      />
                      Visible Online
                    </label>
                  </div>
                  <button 
                    onClick={() => {
                      const newCfs = sidebarConfig.new_custom_fields.filter((_, i) => i !== idx);
                      setSidebarConfig(prev => prev ? {...prev, new_custom_fields: newCfs} : prev);
                    }}
                    className="p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              <button 
                onClick={() => setSidebarConfig(prev => prev ? {...prev, new_custom_fields: [...prev.new_custom_fields, { key: "", value: "", visible_online: true }]} : prev)}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1.5 rounded-lg transition-colors mt-2"
              >
                <Plus size={12} /> Add Custom Field
              </button>
            </div>
          </div>
        )}
      </RightSidebarFilter>
    </div>
  );
}
