import React, { useState, useEffect } from "react";
import { Save, AlertCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { AutoFormRenderer } from "@/components/inputbuilders/AutoFormRender";
import {
  ProductVariantsSection,
  VariantType,
  VariantCombination,
} from "@/components/inputbuilders/ProductVaireintSection"
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import "@/components/FormRender.css";

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500">
    <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <span className="text-sm font-medium tracking-wide">Loading product fields...</span>
  </div>
);

const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-3 p-4 mx-auto mt-6 max-w-2xl bg-red-50 text-red-700 rounded-lg border border-red-200">
    <AlertCircle className="w-5 h-5 flex-shrink-0" />
    <p className="text-sm font-medium">{message}</p>
  </div>
);

const SubmitBar = ({ label = "Save", submitting }: { label?: string; submitting?: boolean }) => (
  <div className="flex justify-end pt-6 mt-8 border-t border-slate-200">
    <button
      type="submit"
      disabled={submitting}
      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all disabled:opacity-60"
    >
      <Save size={16} />
      {submitting ? "Saving…" : label}
    </button>
  </div>
);

export const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const { fields, isLoading, error: fieldError, fetchProductFields } = useInputBuilderContext();
  const { getData, postData, putData, loading: submitting, error: apiError } = useApi();

  const [values, setValues] = useState<Record<string, any>>({});
  const [dataLoading, setDataLoading] = useState(isEditMode);

  // ── Variant state ──────────────────────────────────────────
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [combinations, setCombinations] = useState<VariantCombination[]>([]);
  // ──────────────────────────────────────────────────────────

  useEffect(() => { fetchProductFields(); }, []);

  useEffect(() => {
    if (!isEditMode || !id) return;
    setDataLoading(true);
    getData(`${ENDPOINTS.PRODUCTS}/by/${id}`).then((res) => {
      if (res) {
        const record = Array.isArray(res.data) ? res.data[0] : res.data;
        const datas = record?.datas ?? {};
        setValues(datas);
        // Restore saved variant state if it exists
        if (datas.variantTypes)  setVariantTypes(datas.variantTypes);
        if (datas.combinations)  setCombinations(datas.combinations);
      }
      setDataLoading(false);
    });
  }, [id]);

  const onChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = (values.barcode as string) || "";
    const body = {
      id,
      barcode,
      stocks:values.stocks,
      shop_id:SHOP_ID,
      sell_price:values.sell_price,
      buy_price:values.buy_price,
      datas: {
        ...values,
        variantTypes,   // ← included in payload
        combinations,   // ← included in payload
      },
    };
    const res = isEditMode
      ? await postData(ENDPOINTS.INVENTORIES, body)
      : await postData(ENDPOINTS.INVENTORIES, body);
    if (res) navigate(isEditMode ? `/product/${id}` : "/product");
  };

  if (isLoading || dataLoading) return <LoadingSpinner />;
  if (fieldError) return <ErrorBanner message={fieldError} />;
  if (!fields) return null;

  return (
    <div className="mx-auto p-4 sm:p-6 lg:p-8">
      {apiError && <ErrorBanner message={apiError} />}

      <div className="bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-xl">
        <form onSubmit={handleSubmit} className="px-4 py-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">
            {isEditMode ? "Edit Product" : "Add Product"}
          </h2>

          {/* Main sections — variants override goes here */}
          <AutoFormRenderer
            fields={fields}
            values={values}
            onChange={onChange}
            excludeCategories={["Advanced Settings"]}
            customSections={{
              "Product Variants": (
                <ProductVariantsSection
                  hasVariants={!!values.hasVariants}
                  onHasVariantsChange={(v) => onChange("hasVariants", v)}
                  variantTypes={variantTypes}
                  onVariantTypesChange={setVariantTypes}
                  combinations={combinations}
                  onCombinationsChange={setCombinations}
                  category={values.category}
                  basePriceStr={values.sellingPrice}
                />
              ),
            }}
          />

          {/* Advanced Settings (collapsible) */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <AutoFormRenderer
              fields={fields}
              values={values}
              onChange={onChange}
              excludeCategories={["Basic Information", "Pricing & Sourcing", "Stock & Inventory", "Product Variants"]}
              sectionConfigs={{
                "Advanced Settings": {
                  collapsible: true,
                  defaultCollapsed: true,
                  includeHidden: true,
                },
              }}
            />
          </div>

          <SubmitBar label={isEditMode ? "Update Product" : "Save Product"} submitting={submitting} />
        </form>
      </div>
    </div>
  );
};

export default ProductForm;