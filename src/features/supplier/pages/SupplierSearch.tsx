import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useHeader } from "@/context/HeaderContext";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { GradientButton } from "@/components/ui";
import { EntitySearchLayout } from "@/components/common/EntitySearchLayout";
import { useEffect } from "react";

const SupplierSearch = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <GradientButton onClick={() => navigate('/supplier/add')} icon={<Plus size={15} />}>
          Add Supplier
        </GradientButton>
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
        displayName: String((s as any).name || (s as any).id)
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
        placeholder="Search suppliers by name, email or phone..."
        className="w-full h-10 text-sm"
        onChange={(val) => val && navigate(`/supplier/${val}`)}
      />
    </EntitySearchLayout>
  );
};

export default SupplierSearch;
