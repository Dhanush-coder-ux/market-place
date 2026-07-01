import { useNavigate } from "react-router-dom";
import { Plus, Bookmark, Search } from "lucide-react";
import { useHeader } from "@/context/HeaderContext";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { useEffect } from "react";

const SupplierSearch = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/supplier/drafts")}
          className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <Bookmark size={16} />
          Saved Drafts
        </button>
        <button onClick={() => navigate('/supplier/add')} className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
          <Plus size={16} />
          Add Supplier
        </button>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  const fetchSearchOptions = async (q: string) => {
    try {
      const { supplierApi } = await import("@/services/api/supplier");
      const data = await supplierApi.searchSuppliers(q);
      return data.map((s: any) => ({
        ...s,
        displayName: String(s.name || s.id)
      }));
    } catch {
      return [];
    }
  };

  return (
    <div className="h-full w-full bg-[#F8FAFC] font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col gap-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Search Suppliers</h2>
          <p className="text-slate-500 text-sm">Find suppliers by name, email or phone</p>
        </div>
        
        <SearchSelect
          labelKey="displayName"
          valueKey="id"
          fetchOptions={fetchSearchOptions}
          placeholder="Search suppliers..."
          className="w-full h-12 text-[15px]"
          onChange={(val) => val && navigate(`/supplier/${val}`)}
        />
      </div>
    </div>
  );
};

export default SupplierSearch;
