import { X } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { useNavigate } from "react-router-dom";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS } from "@/services/endpoints";

const CustomerList = () => {
  const navigate = useNavigate();
  const { getData, error, clearError } = useApi();

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center">
        <GradientButton path="/customers/add">+ Add Customer</GradientButton>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <span>{error}</span>
          <button onClick={clearError} className="shrink-0 text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-blue-100 shadow-xl overflow-hidden flex flex-col p-12">
        <div className="w-full max-w-xl mx-auto flex flex-col items-center space-y-4">
          <h2 className="text-xl font-bold text-slate-700">Find a Customer</h2>
          <p className="text-slate-500 text-sm text-center mb-4">Search by name or ID to view their profile, history, and payment details.</p>
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
            className="w-full h-12"
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerList;
