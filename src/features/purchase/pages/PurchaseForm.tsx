import React, { useState, useEffect } from "react";
import { FieldDefinition, useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { AutoFormRenderer } from "@/components/inputbuilders/AutoFormRender";
import { ListRow, createEmptyRow } from "@/components/inputbuilders/Dynamiclistdict";
import { LoadingSpinner, SubmitBar } from "@/components/common/FormUtility";

export const PurchaseForm: React.FC = () => {
  const { fields, isLoading, fetchPurchaseFields } = useInputBuilderContext();
  const [values, setValues] = useState<Record<string, any>>({
    purchase_date: new Date().toISOString().split("T")[0],
  });
  
  const [productRows, setProductRows] = useState<ListRow[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    fetchPurchaseFields();
  }, []);

  useEffect(() => {
    // Only proceed if fields are loaded and we haven't initialized rows yet
    if (!fields || isReady) return;

    const listField = fields["purchase_products"];
    
    if (listField?.type === "LIST-DICT" && listField.values && !Array.isArray(listField.values)) {
      const initialRow = createEmptyRow(listField.values as Record<string, FieldDefinition>);
      setProductRows([initialRow]);
      setIsReady(true);
    } else if (fields) {
      // If the field isn't a LIST-DICT or is missing, we are still "ready" to show the rest of the form
      setIsReady(true);
    }
  }, [fields, isReady]);

  const onChange = (name: string, value: string) =>
    setValues((p) => ({ ...p, [name]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Final Submission Payload:", { 
        ...values, 
        purchase_products: productRows 
    });
  };

  // Block rendering until metadata AND initial row state are prepared
  if (isLoading || !isReady || !fields) {
    return <LoadingSpinner />;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto p-6 space-y-5"
    >
      <AutoFormRenderer
        fields={fields}
        values={values}
        onChange={onChange}
        listRows={{
          purchase_products: { 
            rows: productRows, 
            setRows: setProductRows 
          },
        }}
      />
      <SubmitBar label="Save Purchase" />
    </form>
  );
};

export default PurchaseForm;