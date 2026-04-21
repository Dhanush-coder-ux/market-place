import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Title from "../../../components/common/Title";
import { UserCheck2 } from "lucide-react";
import { useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { AutoFormRenderer } from "@/components/inputbuilders/AutoFormRender";
import { LoadingSpinner, SubmitBar } from "@/components/common/FormUtility";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";

const ProfileForm = () => {
  const navigate = useNavigate();
  const { fields, isLoading, fetchFieldsByServiceName } = useInputBuilderContext();
  const { getData, putData, loading: submitting, error } = useApi();
  const [values, setValues] = useState<Record<string, any>>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => { fetchFieldsByServiceName("SHOP"); }, []);

  useEffect(() => {
    if (!fields || isReady) return;
    getData(ENDPOINTS.SHOPS + "/by/" + SHOP_ID).then(res => {
      if (res) {
        const d = Array.isArray(res.data) ? res.data[0] : res.data;
        if (d?.datas) setValues(d.datas);
      }
      setIsReady(true);
    });
  }, [fields]);

  const onChange = (name: string, value: string) =>
    setValues(p => ({ ...p, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await putData(ENDPOINTS.SHOPS, { id:SHOP_ID,datas: values });
    if (res) navigate("/profile");
  };

  if (isLoading || !isReady || !fields) return <LoadingSpinner />;

  return (
    <div className="pb-10">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/profile" viewTransition>
          <Title title="Profile" icon={<UserCheck2 size={30} />} />
        </Link>
        <Title title="/ Profile Management" />
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
        )}
        <AutoFormRenderer fields={fields} values={values} onChange={onChange} />
        <SubmitBar label={submitting ? "Saving…" : "Save Changes"} />
      </form>
    </div>
  );
};

export default ProfileForm;
