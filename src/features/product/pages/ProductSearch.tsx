import { X } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { useNavigate } from "react-router-dom";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";

const ProductSearch = () => {
  const navigate = useNavigate();
  const { getData, error, clearError } = useApi();

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center gap-3">
        <GradientButton path="/product/all" variant="outline">View All Products</GradientButton>
        <GradientButton path="/product/add">+ Add Product</GradientButton>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <span>{error}</span>
          <button onClick={clearError} className="shrink-0 text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-blue-100 shadow-xl overflow-hidden flex flex-col p-12">
        <div className="w-full max-w-xl mx-auto flex flex-col items-center space-y-4">
          <h2 className="text-xl font-bold text-slate-700">Find a Product</h2>
          <p className="text-slate-500 text-sm text-center mb-4">Search by name, barcode, or category to view detailed inventory and stock movement.</p>
          <SearchSelect
            labelKey="displayName"
            valueKey="id"
            fetchOptions={async (q) => {
              if (!q) return [];
              try {
                const res = await getData(ENDPOINTS.INVENTORIES, { limit: "8", offset: "0", q, shop_id: SHOP_ID });
                const data = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
                return data.map((p: any) => ({
                  ...p,
                  displayName: String(p.datas?.name ?? p.name ?? p.barcode ?? p.id)
                }));
              } catch {
                return [];
              }
            }}
            onChange={(val) => {
              if (val) {
                navigate(`/product/${val}`);
              }
            }}
            placeholder="Search and select a product..."
            className="w-full h-12"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductSearch;
