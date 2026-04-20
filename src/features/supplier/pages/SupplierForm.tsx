import React, { useState, useEffect } from "react";
import { useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { AutoFormRenderer } from "@/components/inputbuilders/AutoFormRender";
import { LoadingSpinner, SubmitBar } from "@/components/common/FormUtility";

export const SupplierForm: React.FC = () => {
  const { fields, isLoading, fetchSupplierFields } = useInputBuilderContext();
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => { fetchSupplierFields(); }, []);

  const onChange = (name: string, value: string) =>
    setValues((p) => ({ ...p, [name]: value }));

  if (isLoading || !fields) return <LoadingSpinner />;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); console.log("Supplier:", values); }}
      className="mx-auto p-6 space-y-5"
    >
      <AutoFormRenderer fields={fields} values={values} onChange={onChange} />
      <SubmitBar label="Register Supplier" />
    </form>
  );
};
