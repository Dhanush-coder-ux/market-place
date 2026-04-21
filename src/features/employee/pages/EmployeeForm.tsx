import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { AutoFormRenderer } from "@/components/inputbuilders/AutoFormRender";
import { LoadingSpinner, SubmitBar } from "@/components/common/FormUtility";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";

export const EmployeeForm: React.FC = () => {
  const navigate = useNavigate();
  const { fields, isLoading, fetchEmployeeFields } = useInputBuilderContext();
  const { postData, loading: submitting, error } = useApi();
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => { fetchEmployeeFields(); }, []);

  const onChange = (name: string, value: string) =>
    setValues((p) => ({ ...p, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await postData(ENDPOINTS.EMPLOYEES, { shop_id: SHOP_ID, datas: values });
    if (res) navigate("/employee");
  };

  if (isLoading || !fields) return <LoadingSpinner />;

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto p-6 space-y-5 bg-white">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
      )}
      <AutoFormRenderer fields={fields} values={values} onChange={onChange} />
      <SubmitBar label={submitting ? "Saving…" : "Create Employee"} />
    </form>
  );
};

export default EmployeeForm;
