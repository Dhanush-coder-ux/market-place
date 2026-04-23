import { Modal } from "@/features/customer/pages/CustomerDetailComponents";
import { LucideIcon, AlertCircle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  type?: "danger" | "warning" | "info";
  icon?: LucideIcon;
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  type = "danger",
  icon: Icon = AlertCircle
}: ConfirmDialogProps) => {
  
  const typeStyles = {
    danger: {
      bg: "bg-rose-50",
      text: "text-rose-500",
      btn: "bg-rose-500 hover:bg-rose-600 shadow-rose-100",
    },
    warning: {
      bg: "bg-amber-50",
      text: "text-amber-500",
      btn: "bg-amber-500 hover:bg-amber-600 shadow-amber-100",
    },
    info: {
      bg: "bg-blue-50",
      text: "text-blue-500",
      btn: "bg-blue-500 hover:bg-blue-600 shadow-blue-100",
    }
  };

  const style = typeStyles[type];

  return (
    <Modal
      show={isOpen}
      onClose={() => !loading && onClose()}
      title={title}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 px-5 py-2.5 ${style.btn} text-white rounded-lg text-sm font-semibold shadow-lg disabled:opacity-50 transition-all active:scale-95`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center p-4">
        <div className={`w-16 h-16 ${style.bg} rounded-full flex items-center justify-center ${style.text} mb-4 animate-in zoom-in-50 duration-300`}>
          <Icon size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed max-w-[280px] mx-auto">
          {description}
        </p>
      </div>
    </Modal>
  );
};
