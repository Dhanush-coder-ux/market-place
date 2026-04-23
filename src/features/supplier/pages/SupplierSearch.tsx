import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, Bookmark } from "lucide-react";
import { useHeader } from "@/context/HeaderContext";
import { GradientButton } from "@/components/ui/GradientButton";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS } from "@/services/endpoints";

const SupplierSearch = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData } = useApi();

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/supplier/drafts")}
          className="px-5 h-11 rounded-xl border border-blue-100 text-blue-600 font-bold text-[14px] bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2"
        >
          <Bookmark size={18} />
          Saved Drafts
        </button>
        <GradientButton path="/supplier/add" className="h-11 flex items-center px-6 text-[14px] shadow-lg shadow-blue-200">+ Add Supplier</GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  const fetchSuppliers = async (q: string) => {
    if (!q) return [];
    try {
      const res = await getData(ENDPOINTS.SUPPLIERS, { limit: "10", offset: "1", q });
      const data = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      return data.map((s: any) => ({
        ...s,
        displayName: String(s.datas?.supplier_name ?? s.datas?.name ?? s.supplier_name ?? s.id)
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
            <Truck size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Supplier Directory</h1>
          <p className="text-slate-500 font-medium text-lg">Search by supplier name to view profiles, balances, and purchase history.</p>
        </div>

        <div className="relative group">
          <div className="absolute bg-gradient-to-r from-blue-100 to-indigo-200 blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white shadow-md rounded-2xl">
            <SearchSelect
              labelKey="displayName"
              valueKey="id"
              fetchOptions={fetchSuppliers}
              placeholder="Search by supplier name or contact..."
              className="w-full h-16 border-none text-lg font-medium"
              onChange={(val) => val && navigate(`/supplier/${val}`)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierSearch;
