import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { GradientButton } from "@/components/ui";
import { EntitySearchLayout } from "@/components/common/EntitySearchLayout";
import { useEffect } from "react";

const CustomerSearch = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { customer } = useBusinessApi();

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <GradientButton onClick={() => navigate('/customers/add')} icon={<Plus size={15} />}>
          Add Customer
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  const fetchSearchOptions = async (q: string) => {
    try {
      const res = await customer.getCustomersByShopId(localStorage.getItem('shop_id') || SHOP_ID, { limit: '10', q });
      const rawData = res?.data || [];
      const list = Array.isArray(rawData) ? rawData : (rawData.datas ?? [rawData]);
      return list.map((c: any) => ({
        ...c,
        displayName: String(c.name || c.id)
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
        placeholder="Search customers by name, email or phone..."
        className="w-full h-10 text-sm"
        onChange={(val) => val && navigate(`/customers/${val}`)}
      />
    </EntitySearchLayout>
  );
};

export default CustomerSearch;
