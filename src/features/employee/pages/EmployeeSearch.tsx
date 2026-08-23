import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { useEffect } from "react";

const EmployeeSearch = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData } = useApi();

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3">

        <button onClick={() => navigate('/employee/add')} className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
          <Plus size={16} />
          Add Employee
        </button>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  const fetchSearchOptions = async (q: string) => {
    try {
      const res = await getData(`${ENDPOINTS.EMPLOYEES}/by/shop/${SHOP_ID}`, { limit: "10", q });
      const rawData = res?.data || [];
      const list = Array.isArray(rawData) ? rawData : (rawData.datas ?? [rawData]);
      return list.map((e: any) => ({
        ...e,
        displayName: String(e.name || e.datas?.name || e.email || e.employee_id)
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
          <h2 className="text-xl font-bold text-slate-800">Search Employees</h2>
          <p className="text-slate-500 text-sm">Find employees by name, ID or role</p>
        </div>
        
        <SearchSelect
          labelKey="displayName"
          valueKey="id"
          fetchOptions={fetchSearchOptions}
          placeholder="Search employees..."
          className="w-full h-12 text-[15px]"
          onChange={(val) => val && navigate(`/employee/${val}`)}
        />
      </div>
    </div>
  );
};

export default EmployeeSearch;

