import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Bookmark } from "lucide-react";
import { useHeader } from "@/context/HeaderContext";
import { GradientButton } from "@/components/ui/GradientButton";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";

const ProductSearch = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData } = useApi();

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate("/product/drafts")}
          className="px-5 h-11 rounded-xl border border-blue-100 text-blue-600 font-bold text-[14px] bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2"
        >
          <Bookmark size={18} />
          Saved Drafts
        </button>
        <GradientButton path="/product/add" className="h-11 flex items-center px-6 text-[14px] shadow-lg shadow-blue-200">+ Add Product</GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  const fetchProducts = async (q: string) => {
    if (!q) return [];
    try {
      const res = await getData(ENDPOINTS.INVENTORIES, { limit: "10", offset: "1", q, shop_id: SHOP_ID });
      const data = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      return data.map((p: any) => ({
        ...p,
        displayName: String(p.datas?.name || p.name || p.id)
      }));
    } catch {
      return [];
    }
  };

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center px-4 animate-in fade-in duration-500">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-200 mb-6">
            <Package size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Product Directory</h1>
          <p className="text-slate-500 font-medium text-lg">Search for products, SKUs or manage your catalog.</p>
        </div>

        <div className="relative group">
          <div className="absolute bg-gradient-to-r from-blue-100 to-indigo-200 blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white shadow-md rounded-2xl">
            <SearchSelect
              labelKey="displayName"
              valueKey="id"
              fetchOptions={fetchProducts}
              placeholder="Search by name, category or SKU..."
              className="w-full h-16 border-none text-lg font-medium"
              onChange={(val) => val && navigate(`/product/${val}`)}
            />
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default ProductSearch;
