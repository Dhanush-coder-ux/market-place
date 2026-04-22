import { X, Search, UserCircle, Bookmark } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { useNavigate } from "react-router-dom";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { useEffect } from "react";

const CustomerList = () => {
  const navigate = useNavigate();
  const { getData, error, clearError } = useApi();
  const { setActions } = useHeader();

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate("/customers/drafts")}
          className="px-5 h-11 rounded-xl border border-blue-100 text-blue-600 font-bold text-[14px] bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2"
        >
          <Bookmark size={18} />
          Saved Drafts
        </button>
        <GradientButton path="/customers/add" className="h-11 flex items-center">+ Add Customer</GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* ── ACTIONS REMOVED (now in global header) ── */}

      {error && (
        <div className="flex items-center justify-between gap-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-medium">
          <span>{error}</span>
          <button onClick={clearError} className="shrink-0 text-rose-400 hover:text-rose-600 transition-colors"><X size={18} /></button>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col p-8 md:p-16 lg:p-24 transition-all duration-300">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center space-y-8">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
            <Search size={32} />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Find a Customer</h2>
            <p className="text-slate-500 font-medium max-w-sm">Access the full customer database to view history, loyalty, and financial records.</p>
          </div>
          <SearchSelect
            labelKey="displayName"
            valueKey="id"
            fetchOptions={async (q) => {
              if (!q) return [];
              try {
                const res = await getData(ENDPOINTS.CUSTOMERS, { limit: "8", offset: "1", q });
                const data = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
                return data.map((c: any) => ({
                  ...c,
                  displayName: String(c.datas?.first_name ? `${c.datas.first_name} ${c.datas.last_name || ''}`.trim() : (c.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : (c.company || c.datas?.company || c.id)))
                }));
              } catch {
                return [];
              }
            }}
            onChange={(val) => {
              if (val) {
                navigate(`/customers/${val}`);
              }
            }}
            placeholder="Search and select a customer..."
            className="w-full h-14 rounded-2xl text-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerList;
