import React, { useState, useEffect } from "react";
import { FieldDefinition, useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { AutoFormRenderer } from "@/components/inputbuilders/AutoFormRender";
import { ListRow, createEmptyRow } from "@/components/inputbuilders/Dynamiclistdict";
import { LoadingSpinner, SubmitBar } from "@/components/common/FormUtility";


export const StockAdjustmentForm: React.FC = () => {
  const { fields, isLoading, fetchStockAdjustmentFields } = useInputBuilderContext();
  const [values, setValues] = useState<Record<string, any>>({
    adjustment_date: new Date().toISOString().split("T")[0],
  });
  const [adjRows, setAdjRows] = useState<ListRow[]>([]);

  useEffect(() => { fetchStockAdjustmentFields(); }, []);


  useEffect(() => {
    if (!fields || adjRows.length > 0) return;
    const listField = fields["adjustment_products"];
    if (listField?.type === "LIST-DICT" && !Array.isArray(listField.values)) {
      setAdjRows([createEmptyRow(listField.values as Record<string, FieldDefinition>)]);
    }
  }, [fields]);

  const onChange = (name: string, value: string) =>
    setValues((p) => ({ ...p, [name]: value }));

  if (isLoading || !fields) return <LoadingSpinner />;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); console.log("StockAdj:", { values, adjRows }); }}
      className=" mx-auto p-6 space-y-5"
    >
      <AutoFormRenderer
        fields={fields}
        values={values}
        onChange={onChange}
        listRows={{
          adjustment_products: { rows: adjRows, setRows: setAdjRows },
        }}
      />
      <SubmitBar label="Save Adjustment" />
    </form>
  );
};