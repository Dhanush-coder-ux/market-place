import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { GradientButton } from "@/components/ui";
import { EntitySearchLayout } from "@/components/common/EntitySearchLayout";
import { useEffect } from "react";

const ProductSearch = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData } = useApi();

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <GradientButton onClick={() => navigate('/product/add')} icon={<Plus size={15} />}>
          Add Product
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  const fetchSearchOptions = async (q: string) => {
    try {
      const res = await getData(`${ENDPOINTS.INVENTORIES}/by/shop/${SHOP_ID}`, { limit: "10", q });
      const rawData = res?.data || [];
      const list = Array.isArray(rawData) ? rawData : (rawData.datas ?? [rawData]);
      return list.map((p: any) => {
        return {
          ...p,
          displayName: String(p.datas?.name || p.name || p.id)
        };
      });
    } catch (err) {
      console.error("Failed to fetch products for search:", err);
      return [];
    }
  };

  return (
    <EntitySearchLayout>
      <SearchSelect
        labelKey="displayName"
        valueKey="id"
        fetchOptions={fetchSearchOptions}
        placeholder="Search products by name, category or SKU..."
        className="w-full h-10 text-sm"
        onChange={(val) => val && navigate(`/product/${val}`)}
      />
    </EntitySearchLayout>
  );
};

export default ProductSearch;

