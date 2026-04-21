import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FieldDefinition, useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { AutoFormRenderer } from "@/components/inputbuilders/AutoFormRender";
import { ListRow, createEmptyRow } from "@/components/inputbuilders/Dynamiclistdict";
import { LoadingSpinner, SubmitBar } from "@/components/common/FormUtility";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";

export const PurchaseForm: React.FC = () => {
  const navigate = useNavigate();
  const { fields, isLoading, fetchPurchaseFields } = useInputBuilderContext();
  const { postData, loading: submitting, error } = useApi();

  const [values, setValues] = useState<Record<string, any>>({
    purchase_date: new Date().toISOString().split("T")[0],
  });
  const [productRows, setProductRows] = useState<ListRow[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => { fetchPurchaseFields(); }, []);

  useEffect(() => {
    if (!fields || isReady) return;
    const listField = fields["purchase_products"];
    if (listField?.type === "LIST-DICT" && listField.values && !Array.isArray(listField.values)) {
      setProductRows([createEmptyRow(listField.values as Record<string, FieldDefinition>)]);
    }
    setIsReady(true);
  }, [fields, isReady]);

  const onChange = (name: string, value: any) =>
    setValues((p) => ({ ...p, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await postData(ENDPOINTS.PURCHASES, {
      shop_id: SHOP_ID,
      type: "DIRECT",
      datas: { ...values, products: productRows },
    });
    if (res) navigate("/po-grn");
  };

  if (isLoading || !isReady || !fields) return <LoadingSpinner />;

  return (
    <form onSubmit={handleSubmit} className="mx-auto p-6 space-y-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
      )}
      <AutoFormRenderer
        fields={fields}
        values={values}
        onChange={onChange}
        listRows={{ purchase_products: { rows: productRows, setRows: setProductRows } }}
      />
      <SubmitBar label={submitting ? "Saving…" : "Save Purchase"} />
    </form>
  );
};

export default PurchaseForm;
