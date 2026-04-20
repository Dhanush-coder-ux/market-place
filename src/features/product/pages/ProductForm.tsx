import React, { useState, useEffect } from "react";
import { Save, AlertCircle } from "lucide-react";
import { useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { AutoFormRenderer } from "@/components/inputbuilders/AutoFormRender";
import "@/components/FormRender.css";
// --- Subcomponents ---

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

const SubmitBar = ({ label = "Save" }) => (
  <div className="flex justify-end pt-6 mt-8 border-t border-slate-200">
    <button
      type="submit"
      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all"
    >
      <Save size={16} />
      {label}
    </button>
  </div>
);

// --- Main Form Component ---

export const ProductForm: React.FC = () => {
  // 1. Destructure the full context, including 'error'
  const { fields, isLoading, error, fetchProductFields } = useInputBuilderContext();
  
  const [values, setValues] = useState<Record<string, any>>({});

  // 2. Fetch fields on mount
  useEffect(() => {
    fetchProductFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting Product:", values);
  };

  // 3. Handle Context States safely
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!fields) return null;

  // 4. Render with premium dashboard layout
  return (
    <div className="mx-auto p-4 sm:p-6 lg:p-8">


      {/* Form Container */}
      <div className="bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-xl">
        <form onSubmit={handleSubmit} className="px-4 py-6 sm:p-8 space-y-6">
          
          <AutoFormRenderer
            fields={fields}
            values={values}
            onChange={onChange}
            excludeCategories={["Advanced Settings"]} 
          />

          {/* Advanced settings — collapsed by default */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <AutoFormRenderer
              fields={fields}
              values={values}
              onChange={onChange}
              excludeCategories={["Basic Information", "Pricing & Sourcing", "Stock & Inventory"]}
              sectionConfigs={{
                "Advanced Settings": {
                  collapsible: true,
                  defaultCollapsed: true,
                  includeHidden: true,
                },
              }}
            />
          </div>

          <SubmitBar label="Save Product" />
        </form>
      </div>
    </div>
  );
};

export default ProductForm;