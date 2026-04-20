/**
 * FormUsageExamples.tsx
 *
 * Shows how to use AutoFormRenderer for each of your 6 services.
 * Each example is a self-contained component.
 *
 * Common pattern:
 *   1. Call the correct fetch function from context
 *   2. Manage form values with useState
 *   3. Manage LIST-DICT rows with useState
 *   4. Pass everything into <AutoFormRenderer>
 */

import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";

import { useInputBuilderContext, FieldDefinition } from "./context/InputBuilderContext";
import { AutoFormRenderer, createEmptyRow, ListRow } from "./AutoFormRender";
import "./form-renderer.css";

/* ─── Shared submit button ───────────────────────────────── */
const SubmitBar: React.FC<{ label?: string }> = ({ label = "Save" }) => (
  <div className="flex justify-end pt-2">
    <button
      type="submit"
      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors"
    >
      <Save size={15} />
      {label}
    </button>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   1. PRODUCT FORM
══════════════════════════════════════════════════════════ */
export const ProductFormExample: React.FC = () => {
  const { fields, isLoading, fetchProductFields } = useInputBuilderContext();
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => { fetchProductFields(); }, []);

  const onChange = (name: string, value: string) =>
    setValues((p) => ({ ...p, [name]: value }));

  if (isLoading || !fields) return <LoadingSpinner />;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); console.log("Product:", values); }}
      className="max-w-4xl mx-auto p-6 space-y-5"
    >
      <AutoFormRenderer
        fields={fields}
        values={values}
        onChange={onChange}
        excludeCategories={["Advanced Settings"]} // handled separately below
      />

      {/* Advanced settings — collapsed by default */}
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

      <SubmitBar label="Save Product" />
    </form>
  );
};

/* ═══════════════════════════════════════════════════════════
   2. STOCK ADJUSTMENT FORM
══════════════════════════════════════════════════════════ */
export const StockAdjustmentFormExample: React.FC = () => {
  const { fields, isLoading, fetchStockAdjustmentFields } = useInputBuilderContext();
  const [values, setValues] = useState<Record<string, any>>({
    adjustment_date: new Date().toISOString().split("T")[0],
  });
  const [adjRows, setAdjRows] = useState<ListRow[]>([]);

  useEffect(() => { fetchStockAdjustmentFields(); }, []);

  // Initialise rows once fields load
  useEffect(() => {
    if (!fields || adjRows.length > 0) return;
    const listField = fields["adjustment_products"];
    if (listField?.type === "LIST-DICT" && !Array.isArray(listField.values)) {
      setAdjRows([createEmptyRow(listField.values as Record<string, FieldDefinition>)]);
    }
  }, [fields]);

  const onChange = (name: string, value: string) =>
    setValues((p) => ({ ...p, [name]: value }));

  if (isLoading || !fields) return <LoadingSpinner />;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); console.log("StockAdj:", { values, adjRows }); }}
      className="max-w-4xl mx-auto p-6 space-y-5"
    >
      <AutoFormRenderer
        fields={fields}
        values={values}
        onChange={onChange}
        listRows={{
          adjustment_products: { rows: adjRows, setRows: setAdjRows },
        }}
      />
      <SubmitBar label="Save Adjustment" />
    </form>
  );
};

/* ═══════════════════════════════════════════════════════════
   3. SUPPLIER FORM
══════════════════════════════════════════════════════════ */
export const SupplierFormExample: React.FC = () => {
  const { fields, isLoading, fetchSupplierFields } = useInputBuilderContext();
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => { fetchSupplierFields(); }, []);

  const onChange = (name: string, value: string) =>
    setValues((p) => ({ ...p, [name]: value }));

  if (isLoading || !fields) return <LoadingSpinner />;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); console.log("Supplier:", values); }}
      className="max-w-4xl mx-auto p-6 space-y-5"
    >
      <AutoFormRenderer fields={fields} values={values} onChange={onChange} />
      <SubmitBar label="Register Supplier" />
    </form>
  );
};

/* ═══════════════════════════════════════════════════════════
   4. PURCHASE FORM
══════════════════════════════════════════════════════════ */
export const PurchaseFormExample: React.FC = () => {
  const { fields, isLoading, fetchPurchaseFields } = useInputBuilderContext();
  const [values, setValues] = useState<Record<string, any>>({
    purchase_date: new Date().toISOString().split("T")[0],
  });
  const [productRows, setProductRows] = useState<ListRow[]>([]);

  useEffect(() => { fetchPurchaseFields(); }, []);

  useEffect(() => {
    if (!fields || productRows.length > 0) return;
    const listField = fields["purchase_products"];
    if (listField?.type === "LIST-DICT" && !Array.isArray(listField.values)) {
      setProductRows([createEmptyRow(listField.values as Record<string, FieldDefinition>)]);
    }
  }, [fields]);

  const onChange = (name: string, value: string) =>
    setValues((p) => ({ ...p, [name]: value }));

  if (isLoading || !fields) return <LoadingSpinner />;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); console.log("Purchase:", { values, productRows }); }}
      className="max-w-4xl mx-auto p-6 space-y-5"
    >
      <AutoFormRenderer
        fields={fields}
        values={values}
        onChange={onChange}
        listRows={{
          purchase_products: { rows: productRows, setRows: setProductRows },
        }}
      />
      <SubmitBar label="Save Purchase" />
    </form>
  );
};

/* ═══════════════════════════════════════════════════════════
   5. GRN FORM
══════════════════════════════════════════════════════════ */
export const GRNFormExample: React.FC = () => {
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
      className="max-w-4xl mx-auto p-6 space-y-5"
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

/* ═══════════════════════════════════════════════════════════
   6. PRODUCTION FORM
══════════════════════════════════════════════════════════ */
export const ProductionFormExample: React.FC = () => {
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
      className="max-w-4xl mx-auto p-6 space-y-5"
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

/* ═══════════════════════════════════════════════════════════
   7. CUSTOMER FORM
══════════════════════════════════════════════════════════ */
export const CustomerFormExample: React.FC = () => {
  const { fields, isLoading, fetchCustomerFields } = useInputBuilderContext();
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => { fetchCustomerFields(); }, []);

  const onChange = (name: string, value: string) =>
    setValues((p) => ({ ...p, [name]: value }));

  if (isLoading || !fields) return <LoadingSpinner />;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); console.log("Customer:", values); }}
      className="max-w-4xl mx-auto p-6 space-y-5"
    >
      <AutoFormRenderer fields={fields} values={values} onChange={onChange} />
      <SubmitBar label="Save Customer" />
    </form>
  );
};

/* ─── Loading spinner ─────────────────────────────────────── */
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-48 gap-3 text-slate-400">
    <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <span className="text-sm font-medium">Loading form…</span>
  </div>
);