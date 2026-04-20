import { AlertCircle, Save } from "lucide-react";

export const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500">
    <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <span className="text-sm font-medium tracking-wide">Loading product fields...</span>
  </div>
);

export const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-3 p-4 mx-auto mt-6 max-w-2xl bg-red-50 text-red-700 rounded-lg border border-red-200">
    <AlertCircle className="w-5 h-5 flex-shrink-0" />
    <p className="text-sm font-medium">{message}</p>
  </div>
);

export const SubmitBar = ({ label = "Save" }) => (
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