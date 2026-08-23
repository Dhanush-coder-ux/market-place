import { useEffect, useState } from "react";
import { Store, ShoppingCart } from "lucide-react";
import { shopApi } from "@/services/api/shop";
import { SHOP_ID } from "@/services/endpoints";

export const BusinessCategorySettings = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await shopApi.getShopById(SHOP_ID);
        const shop = res?.data ?? res;
        if (shop && shop.categories) {
          setCategories(shop.categories);
        }
      } catch (err) {
        console.error("Failed to fetch shop categories", err);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, []);

  return (
    <div className="mb-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Business & Product Categories</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Your business type seeds your product categories. Everything here is yours to rename, add, or remove — a category can only be deleted once no products are using it.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Store className="text-slate-600" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-800">Business type</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Add or remove business types — each seeds its own product categories
            </p>
          </div>
        </div>
        
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-4 overflow-x-auto">
          {loading ? (
            <div className="text-sm text-slate-500 py-2">Loading business categories...</div>
          ) : categories.length > 0 ? (
            categories.map((category, idx) => (
              <div 
                key={idx} 
                className={`relative bg-indigo-50/50 border ${idx === 0 ? 'border-indigo-300' : 'border-indigo-100'} rounded-xl p-4 min-w-[220px] flex items-center gap-4`}
              >
                {idx === 0 && (
                  <span className="absolute -top-2.5 left-4 bg-indigo-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    PRIMARY
                  </span>
                )}
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-indigo-600 shrink-0">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm capitalize">{category}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Business category</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500 py-2">No business categories configured.</div>
          )}
        </div>
      </div>
    </div>
  );
};
