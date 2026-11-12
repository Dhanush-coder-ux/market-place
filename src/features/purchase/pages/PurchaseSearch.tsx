import { useNavigate } from "react-router-dom";
import { Plus, History } from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { Button, GradientButton } from "@/components/ui";
import { EntitySearchLayout } from "@/components/common/EntitySearchLayout";
import { useEffect } from "react";

const PurchaseSearch = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData } = useApi();

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => navigate("/purchase-history")}>
          <History size={15} />
          History
        </Button>
        <GradientButton onClick={() => navigate('/purchase/add')} icon={<Plus size={15} />}>
          Add Purchase
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  const fetchSearchOptions = async (q: string) => {
    try {
      const res = await getData(`${ENDPOINTS.PURCHASES}/by/shop/${SHOP_ID}`, { limit: "10", q });
      const rawData = res?.data || [];
      return rawData.map((po: any) => {
        const poLabel = po.invoice_no || po.ui_id || po.purchase_id || po.id;
        const vendor = po.supplier?.supplier_name || "Unknown Vendor";
        return {
          ...po,
          id: po.purchase_id || po.id,
          displayName: `${poLabel} · ${vendor}`
        };
      });
    } catch (err) {
      console.error("Failed to fetch purchases for search:", err);
      return [];
    }
  };

  return (
    <EntitySearchLayout>
      <SearchSelect
        labelKey="displayName"
        valueKey="id"
        fetchOptions={fetchSearchOptions}
        placeholder="Search purchases by PO number or vendor..."
        className="w-full h-10 text-sm"
        onChange={(val) => val && navigate(`/purchase/detail/${val}`)}
      />
    </EntitySearchLayout>
  );
};

export default PurchaseSearch;
