import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Bookmark } from "lucide-react";
import { useHeader } from "@/context/HeaderContext";
import { GradientButton } from "@/components/ui/GradientButton";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS } from "@/services/endpoints";

const CustomerList = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData } = useApi();

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
        <GradientButton path="/customers/add" className="h-11 flex items-center px-6 text-[14px] shadow-lg shadow-blue-200">+ Add Customer</GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  const fetchCustomers = async (q: string) => {
    if (!q) return [];
    try {
      const res = await getData(ENDPOINTS.CUSTOMERS, { limit: "10", offset: "1", q });
      const data = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      return data.map((c: any) => ({
        ...c,
        displayName: String(
          c.datas?.first_name
            ? `${c.datas.first_name} ${c.datas.last_name || ""}`.trim()
            : c.first_name
            ? `${c.first_name} ${c.last_name || ""}`.trim()
            : c.datas?.company || c.company || c.id
        )
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
            <Users size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Customer Directory</h1>
          <p className="text-slate-500 font-medium text-lg">Access the full customer database to view history, loyalty, and financial records.</p>
        </div>

        <div className="relative group">
          <div className="absolute bg-gradient-to-r from-blue-100 to-indigo-200 blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white shadow-md rounded-2xl">
            <SearchSelect
              labelKey="displayName"
              valueKey="id"
              fetchOptions={fetchCustomers}
              placeholder="Search and select a customer..."
              className="w-full h-16 border-none text-lg font-medium"
              onChange={(val) => val && navigate(`/customers/${val}`)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerList;
