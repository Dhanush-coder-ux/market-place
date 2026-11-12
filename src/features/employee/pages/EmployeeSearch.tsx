import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { GradientButton } from "@/components/ui";
import { EntitySearchLayout } from "@/components/common/EntitySearchLayout";
import { useEffect } from "react";

const EmployeeSearch = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData } = useApi();

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <GradientButton onClick={() => navigate('/employee/add')} icon={<Plus size={15} />}>
          Add Employee
        </GradientButton>
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
    <EntitySearchLayout>
      <SearchSelect
        labelKey="displayName"
        valueKey="id"
        fetchOptions={fetchSearchOptions}
        placeholder="Search employees by name, ID or role..."
        className="w-full h-10 text-sm"
        onChange={(val) => val && navigate(`/employee/${val}`)}
      />
    </EntitySearchLayout>
  );
};

export default EmployeeSearch;

