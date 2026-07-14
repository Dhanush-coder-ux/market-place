import { CheckCircle2, Plus, ReceiptText } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { createPortal } from "react-dom";

interface PurchaseSuccessModalProps {
  open: boolean;
  onAddAnother: () => void;
  onViewPurchases: () => void;
  supplier?: string;
  total?: number;
  invoiceNo?: string;
}

export default function PurchaseSuccessModal({
  open,
  onAddAnother,
  onViewPurchases,
  supplier,
  total,
  invoiceNo,
}: PurchaseSuccessModalProps) {
  if (!open) return null;

  return createPortal(
     <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50 via-white to-blue-50 p-8 border-b border-slate-100">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 border border-emerald-200">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>

          <h2 className="mt-5 text-center text-2xl font-black text-slate-800">
            Purchase Saved Successfully
          </h2>

          <p className="mt-2 text-center text-sm text-slate-500">
            Inventory has been updated and purchase recorded.
          </p>
        </div>

        {/* Details */}
        <div className="p-6">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">
                Supplier
              </span>
              <span className="font-semibold text-slate-800">
                {supplier || "-"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">
                Invoice
              </span>
              <span className="font-semibold text-slate-800">
                {invoiceNo || "-"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">
                Total Amount
              </span>
              <span className="font-black text-emerald-600">
                ₹{typeof total === 'number' ? total.toFixed(2) : "0.00"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3">
            <GradientButton
              icon={<Plus size={16} />}
              onClick={onAddAnother}
              className="h-11 rounded-xl"
            >
              Add Another Purchase
            </GradientButton>

            <button
              onClick={onViewPurchases}
              className="h-11 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <ReceiptText size={16} />
              View Purchase History
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}