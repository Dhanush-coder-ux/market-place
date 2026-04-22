import { X } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { useNavigate } from "react-router-dom";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";

const EmployeeSearch = () => {
  const navigate = useNavigate();
  const { getData, error, clearError } = useApi();

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center gap-3">
        <GradientButton path="/employee/all" variant="outline">View All Employees</GradientButton>
        <GradientButton path="/employee/add">+ Add Employee</GradientButton>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <span>{error}</span>
          <button onClick={clearError} className="shrink-0 text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-blue-100 shadow-xl overflow-hidden flex flex-col p-12">
        <div className="w-full max-w-xl mx-auto flex flex-col items-center space-y-4">
          <h2 className="text-xl font-bold text-slate-700">Find an Employee</h2>
          <p className="text-slate-500 text-sm text-center mb-4">Search by name or email to view employee profiles, roles, and status.</p>
          <SearchSelect
            labelKey="displayName"
            valueKey="id"
            fetchOptions={async (q) => {
              if (!q) return [];
              try {
                const res = await getData(ENDPOINTS.EMPLOYEES, { limit: "8", offset: "1", q, shop_id: SHOP_ID });
                const data = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
                return data.map((e: any) => ({
                  ...e,
                  displayName: String(e.datas?.name ?? e.name ?? e.email ?? e.id)
                }));
              } catch {
                return [];
              }
            }}
            onChange={(val) => {
              if (val) {
                // For employees, we might open the drawer in the list page, but since this is a search page,
                // we should probably navigate to a detail page if it exists, or the list page with the ID.
                // Currently /employee is the list. Let's navigate to the list with the ID as a param if needed,
                // or just navigate to the employee page.
                navigate(`/employee?id=${val}`);
              }
            }}
            placeholder="Search and select an employee..."
            className="w-full h-12"
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeeSearch;
