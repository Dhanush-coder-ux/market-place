import { X, Bookmark } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { useNavigate } from "react-router-dom";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS } from "@/services/endpoints";

const SupplierSearch = () => {
  const navigate = useNavigate();
  const { getData, error, clearError } = useApi();

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center gap-3">
        <button 
          onClick={() => navigate("/supplier/drafts")}
          className="px-4 h-10 rounded-xl border border-blue-100 text-blue-600 font-bold text-[13px] bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2"
        >
          <Bookmark size={16} />
          Saved Drafts
        </button>
        <GradientButton path="/supplier/add">+ Add Supplier</GradientButton>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <span>{error}</span>
          <button onClick={clearError} className="shrink-0 text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-blue-100 shadow-xl overflow-hidden flex flex-col p-12">
        <div className="w-full max-w-xl mx-auto flex flex-col items-center space-y-4">
          <h2 className="text-xl font-bold text-slate-700">Find a Supplier</h2>
          <p className="text-slate-500 text-sm text-center mb-4">Search by supplier name or contact person to view profiles, outstanding balances, and purchase history.</p>
          <SearchSelect
            labelKey="displayName"
            valueKey="id"
            fetchOptions={async (q) => {
              if (!q) return [];
              try {
                const res = await getData(ENDPOINTS.SUPPLIERS, { limit: "8", offset: "1", q });
                const data = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
                return data.map((s: any) => ({
                  ...s,
                  displayName: String(s.datas?.supplier_name ?? (s as any).supplier_name ?? s.id)
                }));
              } catch {
                return [];
              }
            }}
            onChange={(val) => {
              if (val) {
                navigate(`/supplier/${val}`);
              }
            }}
            placeholder="Search and select a supplier..."
            className="w-full h-12"
          />
        </div>
      </div>
    </div>
  );
};

export default SupplierSearch;
