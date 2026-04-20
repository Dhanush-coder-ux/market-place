import React, { useState, useEffect } from "react";
import { FieldDefinition, useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { AutoFormRenderer } from "@/components/inputbuilders/AutoFormRender";
import { ListRow, createEmptyRow } from "@/components/inputbuilders/Dynamiclistdict";
import { LoadingSpinner, SubmitBar } from "@/components/common/FormUtility";

export const GRNForm: React.FC = () => {
  const { fields, isLoading, fetchGrnFields } = useInputBuilderContext();
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

  if (isLoading || !fields) return <LoadingSpinner />;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); console.log("GRN:", { values, productRows }); }}
      className="mx-auto p-6 space-y-5"
    >
      <AutoFormRenderer
        fields={fields}
        values={values}
        onChange={onChange}
        listRows={{
          grn_products: { rows: productRows, setRows: setProductRows },
        }}
      />
      <SubmitBar label="Save GRN" />
    </form>
  );
};