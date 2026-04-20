import React, { useState, useEffect } from "react";
import { FieldDefinition, useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { AutoFormRenderer } from "@/components/inputbuilders/AutoFormRender";
import { ListRow, createEmptyRow } from "@/components/inputbuilders/Dynamiclistdict";
import { LoadingSpinner, SubmitBar } from "@/components/common/FormUtility";

export const ProductionForm: React.FC = () => {
  const { fields, isLoading, fetchProductionFields } = useInputBuilderContext();
  const [values, setValues] = useState<Record<string, any>>({
    production_date: new Date().toISOString().split("T")[0],
    status: "In Progress",
  });
  const [finishedRows, setFinishedRows] = useState<ListRow[]>([]);

  useEffect(() => { fetchProductionFields(); }, []);

  useEffect(() => {
    if (!fields || finishedRows.length > 0) return;
    const listField = fields["finished_products"];
    if (listField?.type === "LIST-DICT" && !Array.isArray(listField.values)) {
      setFinishedRows([createEmptyRow(listField.values as Record<string, FieldDefinition>)]);
    }
  }, [fields]);

  const onChange = (name: string, value: string) =>
    setValues((p) => ({ ...p, [name]: value }));

  if (isLoading || !fields) return <LoadingSpinner />;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); console.log("Production:", { values, finishedRows }); }}
      className="mx-auto p-6 space-y-5"
    >
      <AutoFormRenderer
        fields={fields}
        values={values}
        onChange={onChange}
        listRows={{
          finished_products: { rows: finishedRows, setRows: setFinishedRows },
        }}
      />
      <SubmitBar label="Save Production" />
    </form>
  );
};