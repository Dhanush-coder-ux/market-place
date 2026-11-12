import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { Button, GradientButton } from "@/components/ui";
import { EntitySearchLayout } from "@/components/common/EntitySearchLayout";
import { useEffect } from "react";

const SaleSearch = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData } = useApi();

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => navigate('/sales')}>
          View All
        </Button>
        <GradientButton onClick={() => navigate('/billing')} icon={<Plus size={15} />}>
          New Order
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  const fetchSearchOptions = async (q: string) => {
    try {
      const res = await getData(`${ENDPOINTS.ORDERS}/${SHOP_ID}`, { limit: "10", q, online_delivered_only: "true" });
      const rawData = res?.data || [];
      const list = Array.isArray(rawData) ? rawData : (rawData.datas ?? [rawData]);
      return list.map((o: any) => ({
        ...o,
        displayName: String(o.ui_id || o.id)
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
        placeholder="Search sales by ID, status, payment method or amount..."
        className="w-full h-10 text-sm"
        onChange={(val) => val && navigate(`/sales/detail/${val}`)}
      />
    </EntitySearchLayout>
  );
};

export default SaleSearch;
