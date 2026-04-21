import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FieldDefinition, useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { AutoFormRenderer } from "@/components/inputbuilders/AutoFormRender";
import { ListRow, createEmptyRow } from "@/components/inputbuilders/Dynamiclistdict";
import { LoadingSpinner, SubmitBar } from "@/components/common/FormUtility";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";

export const StockAdjustmentForm: React.FC = () => {
  const navigate = useNavigate();
  const { fields, isLoading, fetchStockAdjustmentFields } = useInputBuilderContext();
  const { postData, loading: submitting, error } = useApi();

  const [values, setValues] = useState<Record<string, any>>({
    adjustment_date: new Date().toISOString().split("T")[0],
  });

  // "products" is the field_name from the API schema for STOCK-ADJUSTMENT
  const [productRows, setProductRows] = useState<ListRow[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => { fetchStockAdjustmentFields(); }, []);

  useEffect(() => {
    if (!fields || isReady) return;

    // The STOCK-ADJUSTMENT schema returns the LIST-DICT under the key "products"
    const listField = fields["products"];
    if (listField?.type === "LIST-DICT" && listField.values && !Array.isArray(listField.values)) {
      setProductRows([createEmptyRow(listField.values as Record<string, FieldDefinition>)]);
    }
    setIsReady(true);
  }, [fields, isReady]);

  const onChange = (name: string, value: any) =>
    setValues((p) => ({ ...p, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ─── Enforce strict data types before sending to API ───
    // Handles scenarios where state was prepopulated by APIs or barcodes as strings
    const listSchema = fields["products"]?.values as Record<string, FieldDefinition> | undefined;
    
    const coercedProducts = productRows.map((row) => {
      const formatted = { ...row };
      if (listSchema) {
        Object.keys(listSchema).forEach((key) => {
          const schema = listSchema[key];
          const val = formatted[key];
          
          // Skip empty values
          if (val === undefined || val === null || val === "") return;
          
          // Coerce based on schema type
          if (schema.type === "NUMBER" || schema.type === "DECIMAL") {
            formatted[key] = Number(val);
          } else if (schema.type === "BOOLEAN") {
            formatted[key] = val === "true" || val === true || val === 1;
          }
        });
      }
      return formatted;
    });

    const res = await postData(ENDPOINTS.S_ADJUSTMENTS, {
      shop_id: SHOP_ID,
      datas: { ...values, products: coercedProducts },
    });
    if (res) navigate("/inventory");
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
        listRows={{
          // Key must match the field_name returned by the API ("products")
          products: { rows: productRows, setRows: setProductRows },
        }}
      />
      <SubmitBar label={submitting ? "Saving…" : "Save Adjustment"} />
    </form>
  );
};

export default StockAdjustmentForm;