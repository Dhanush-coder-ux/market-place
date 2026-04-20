import React, { useState, useEffect } from "react";
import { useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { AutoFormRenderer } from "@/components/inputbuilders/AutoFormRender";
import { LoadingSpinner, SubmitBar } from "@/components/common/FormUtility";

export const EmployeeForm: React.FC = () => {
  const { fields, isLoading, fetchEmployeeFields } = useInputBuilderContext();
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => { 
    fetchEmployeeFields(); 
  }, []);

  const onChange = (name: string, value: string) =>
    setValues((p) => ({ ...p, [name]: value }));

  if (isLoading || !fields) return <LoadingSpinner />;

  return (
    <form
      onSubmit={(e) => { 
        e.preventDefault(); 
        console.log("Employee:", values); 
      }}
      className="max-w-7xl mx-auto p-6 space-y-5 bg-white"
    >
      <AutoFormRenderer fields={fields} values={values} onChange={onChange} />
      <SubmitBar label="Create Employee" />
    </form>
  );
};

export default EmployeeForm;