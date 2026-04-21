import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FieldDefinition, useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { AutoFormRenderer } from "@/components/inputbuilders/AutoFormRender";
import { ListRow, createEmptyRow } from "@/components/inputbuilders/Dynamiclistdict";
import { LoadingSpinner, SubmitBar } from "@/components/common/FormUtility";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";

export const GRNForm: React.FC = () => {
  const navigate = useNavigate();
  const { fields, isLoading, fetchGrnFields } = useInputBuilderContext();
  const { postData, loading: submitting, error } = useApi();
  const [values, setValues] = useState<Record<string, any>>({
    receipt_date: new Date().toISOString().split("T")[0],
    status: "Pending",
  });
  const [productRows, setProductRows] = useState<ListRow[]>([]);

  useEffect(() => { fetchGrnFields(); }, []);

  useEffect(() => {
    if (!fields || productRows.length > 0) return;
    const listField = fields["grn_products"];
    if (listField?.type === "LIST-DICT" && !Array.isArray(listField.values)) {
      setProductRows([createEmptyRow(listField.values as Record<string, FieldDefinition>)]);
    }
  }, [fields]);

  const onChange = (name: string, value: string) =>
    setValues((p) => ({ ...p, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await postData(ENDPOINTS.PURCHASES, {
      shop_id: SHOP_ID,
      type: "PO CREATE",
      datas: { ...values, grn_products: productRows },
    });
    if (res) navigate("/po-grn");
  };

  if (isLoading || !fields) return <LoadingSpinner />;

  return (
    <form onSubmit={handleSubmit} className="mx-auto p-6 space-y-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
      )}
      <AutoFormRenderer
        fields={fields}
        values={values}
        onChange={onChange}
        listRows={{
          grn_products: { rows: productRows, setRows: setProductRows },
        }}
      />
      <SubmitBar label={submitting ? "Saving…" : "Save GRN"} />
    </form>
  );
};