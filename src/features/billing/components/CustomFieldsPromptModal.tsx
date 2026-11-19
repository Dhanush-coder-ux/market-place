import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Receipt, FileText, CheckCircle2 } from "lucide-react";
import type { CustomFieldDefinition } from "../utils/customFieldsHelper";

interface CustomFieldsPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "BILL" | "INVOICE";
  fields: CustomFieldDefinition[];
  initialValues: Record<string, string>;
  onConfirm: (values: Record<string, string>) => void;
}

export const CustomFieldsPromptModal: React.FC<CustomFieldsPromptModalProps> = ({
  isOpen,
  onClose,
  type,
  fields,
  initialValues,
  onConfirm,
}) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValues({ ...initialValues });
      setErrorMsg(null);
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const isInvoice = type === "INVOICE";

  const handleChange = (fieldId: string, val: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: val }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleConfirm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const missing = fields.find((f) => f.required && !(values[f.id] || "").trim());
    if (missing) {
      setErrorMsg(`Please enter required detail: "${missing.label}"`);
      return;
    }
    onConfirm(values);
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isInvoice ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {isInvoice ? <FileText size={20} /> : <Receipt size={20} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {isInvoice ? "Invoice Additional Details" : "Bill Additional Details"}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isInvoice
                  ? "Enter custom attributes for this tax invoice"
                  : "Enter custom attributes for this thermal receipt"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleConfirm} className="p-5 space-y-3.5">
          {errorMsg && (
            <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {fields.map((f, idx) => (
              <div key={f.id} className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>
                    {f.label}
                    {f.required && <span className="text-rose-500 ml-0.5">*</span>}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-normal">
                    {f.placement === "customer" ? "Top / Header" : f.placement === "below" ? "Below Items" : "Item"}
                  </span>
                </label>
                <input
                  ref={idx === 0 ? firstInputRef : undefined}
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  value={values[f.id] ?? ""}
                  onChange={(e) => handleChange(f.id, e.target.value)}
                  placeholder={`Enter ${f.label}`}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-medium transition-all"
                />
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all active:scale-95 ${
                isInvoice
                  ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
              }`}
            >
              <CheckCircle2 size={14} />
              <span>{isInvoice ? "Confirm & Generate Invoice" : "Confirm & Complete Bill"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
