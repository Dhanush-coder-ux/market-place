import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { AutoFormRenderer } from "@/components/inputbuilders/AutoFormRender";
import { LoadingSpinner, SubmitBar } from "@/components/common/FormUtility";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";

export const SupplierForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const { fields, isLoading, fetchSupplierFields } = useInputBuilderContext();
  const { getData, postData, putData, loading: submitting, error } = useApi();

  const [values, setValues] = useState<Record<string, any>>({});
  const [dataLoading, setDataLoading] = useState(isEditMode);

  useEffect(() => { fetchSupplierFields(); }, []);

  useEffect(() => {
    if (!isEditMode || !id) return;
    setDataLoading(true);
    getData(`${ENDPOINTS.SUPPLIERS}/by/${id}`).then((res) => {
      if (res) {
        const record = Array.isArray(res.data) ? res.data[0] : res.data;
        setValues(record?.datas ?? {});
      }
      setDataLoading(false);
    });
  }, [id]);

  const onChange = (name: string, value: string) =>
    setValues((p) => ({ ...p, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { id,shop_id: SHOP_ID, datas: values };
    const res = isEditMode
      ? await putData(`${ENDPOINTS.SUPPLIERS}`, body)
      : await postData(ENDPOINTS.SUPPLIERS, body);
    if (res) navigate(isEditMode ? `/supplier/${id}` : "/supplier");
  };

  if (isLoading || dataLoading || !fields) return <LoadingSpinner />;

  return (
    <form onSubmit={handleSubmit} className="mx-auto p-6 space-y-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-slate-800">
          {isEditMode ? "Edit Supplier" : "Register Supplier"}
        </h2>
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
      )}
      <AutoFormRenderer fields={fields} values={values} onChange={onChange} />
      <SubmitBar label={submitting ? "Saving…" : isEditMode ? "Update Supplier" : "Register Supplier"} />
    </form>
  );
};

export default SupplierForm;
