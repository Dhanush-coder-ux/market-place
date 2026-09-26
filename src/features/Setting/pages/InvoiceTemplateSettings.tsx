import React, { useState, useEffect } from "react";
import { LayoutTemplate, Check } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { InvoiceRenderer } from "../../billing/components/InvoiceRenderer";
import { INVOICE_TEMPLATES } from "../../billing/components/invoice-templates";
import type { BillingItem } from "../../billing/types";

const mockData = {
  shopData: {
    name: "Acme Corp",
    category_infos: { name: "Retail & Electronics" },
    address: { full_address: "123 Business Avenue, Tech Park, City - 400001" },
    business_infos: { gst_infos: { number: "27AADCB2230M1Z2" } }
  },
  orderId: "ORD-2023-001",
  dateStr: "15 Oct 2023",
  timeStr: "14:30",
  payments: [{ mode: "upi", amount: 1484 }],
  customerName: "Rahul Sharma",
  phone: "+91 98765 43210",
  items: [
    { name: "Premium Wireless Headphones - Black", qty: 2, price: 500, gst: 18, tprice: 1180, code: "WH-100" } as BillingItem,
    { name: "Ergonomic Mouse", qty: 1, price: 257.63, gst: 18, tprice: 304, code: "EM-200" } as BillingItem
  ],
  includeGst: true,
  totalAmount: 1257.63,
  gstAmount: 226.37,
  finalAmount: 1484,
};

export const InvoiceTemplateSettings: React.FC = () => {
  const { showToast } = useToast();
  const [activeTemplate, setActiveTemplate] = useState("minimal");

  useEffect(() => {
    const saved = localStorage.getItem("invoice_template");
    if (saved && INVOICE_TEMPLATES[saved]) {
      setActiveTemplate(saved);
    }
  }, []);

  const handleSelect = (id: string) => {
    setActiveTemplate(id);
    localStorage.setItem("invoice_template", id);
    showToast("Invoice template updated successfully", "success");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row h-[80vh] max-h-[900px] min-h-[600px]">
      {/* Left Column: Template Selection */}
      <div className="w-full md:w-5/12 lg:w-1/3 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <LayoutTemplate size={17} className="text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Invoice Templates
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Choose how your invoices look.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/30 custom-scrollbar">
          {Object.values(INVOICE_TEMPLATES).map((tmpl) => {
            const isActive = activeTemplate === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => handleSelect(tmpl.id)}
                className={`relative flex flex-col bg-white rounded-xl border-2 cursor-pointer transition-all duration-300 overflow-hidden group ${
                  isActive
                    ? "border-violet-500 shadow-md ring-4 ring-violet-500/10"
                    : "border-slate-200 hover:border-slate-300 shadow-sm hover:shadow"
                }`}
              >
                {/* Mini Preview Container */}
                <div className="h-40 bg-slate-100/50 overflow-hidden flex items-start justify-center pt-4 relative pointer-events-none">
                   <div className="w-[560px] origin-top transform scale-[0.45] transition-transform duration-300 group-hover:scale-[0.48]">
                      <InvoiceRenderer templateId={tmpl.id} {...mockData} scale={1} />
                   </div>
                   {/* Gradient Overlay for bottom fade */}
                   <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent opacity-80" />
                </div>
                
                <div className="p-4 border-t border-slate-100 z-10 bg-white">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-bold text-slate-800">{tmpl.name}</h4>
                    {isActive && (
                       <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center text-white">
                         <Check size={12} strokeWidth={3} />
                       </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{tmpl.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Live Preview */}
      <div className="w-full md:w-7/12 lg:w-2/3 bg-slate-100 flex flex-col items-center overflow-y-auto custom-scrollbar relative">
         <div className="sticky top-0 w-full px-6 py-4 bg-gradient-to-b from-slate-100 via-slate-100/90 to-transparent z-10 flex flex-col items-center pointer-events-none">
           <h4 className="text-[13px] font-semibold text-slate-700 bg-white/80 backdrop-blur px-4 py-1.5 rounded-full shadow-sm border border-slate-200/50">Live Invoice Preview</h4>
         </div>
         <div className="pb-12 pt-4 px-8 w-full flex justify-center">
            <div className="shadow-xl shadow-slate-300/50 rounded-lg overflow-hidden pointer-events-none ring-1 ring-slate-200/50 bg-white">
              <InvoiceRenderer templateId={activeTemplate} {...mockData} scale={1} />
            </div>
         </div>
      </div>
    </div>
  );
};
