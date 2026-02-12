import { Upload, Download } from "lucide-react";

export default function ExportImportButton({ onClick }:{ onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 active:scale-95"
    >
      <div className="flex items-center gap-1 text-gray-500 group-hover:text-blue-600">
        <Upload className="text-red-500" size={16} />
        <Download  className="text-green-700" size={16} />
      </div>

      <span className="relative">
        Export / Import
        {/* <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-blue-500 transition-all duration-300 group-hover:w-full" /> */}
      </span>
    </button>
  );
}
