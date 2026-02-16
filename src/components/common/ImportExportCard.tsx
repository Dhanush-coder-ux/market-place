import { FC, useRef, ChangeEvent, useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  X,
  FileUp,
  AlertCircle
} from "lucide-react";

interface ImportExportFloatingCardProps {
  onClose: () => void;
  onImport?: (file: File) => void;
  onExport?: (type: "xlsx" | "docx") => void;
}

const ImportExportFloatingCard: FC<ImportExportFloatingCardProps> = ({
  onClose,
  onImport,
  onExport
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) onImport(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onImport) onImport(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Data Management</h2>
            <p className="text-xs text-gray-500">Import or export your project data</p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Import Section - Drag & Drop */}
          <section>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Import Files</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 ${
                isDragging 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30"
              } p-8 text-center`}
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200 group-hover:scale-110 transition-transform">
                <FileUp className={`h-6 w-6 ${isDragging ? "text-blue-600" : "text-gray-400"}`} />
              </div>
              <p className="text-sm font-medium text-gray-700">
                Click to upload or drag and drop
              </p>
              <p className="mt-1 text-xs text-gray-500">XLSX or DOCX (max. 10MB)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.docx"
              hidden
              onChange={handleFileChange}
            />
          </section>

          {/* Export Section */}
          <section>
            <label className="mb-3 block text-sm font-semibold text-gray-700">Quick Export</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onExport?.("xlsx")}
                className="group flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 transition-all hover:border-green-200 hover:bg-green-50"
              >
                <div className="rounded-lg bg-green-100 p-2 text-green-600 group-hover:bg-green-200">
                  <FileSpreadsheet size={20} />
                </div>
                <span className="text-xs font-bold text-gray-600">Excel Format</span>
              </button>

              <button
                onClick={() => onExport?.("docx")}
                className="group flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 transition-all hover:border-blue-200 hover:bg-blue-50"
              >
                <div className="rounded-lg bg-blue-100 p-2 text-blue-600 group-hover:bg-blue-200">
                  <FileText size={20} />
                </div>
                <span className="text-xs font-bold text-gray-600">Word Document</span>
              </button>
            </div>
          </section>

          {/* Template Info */}
          <footer className="flex items-start gap-3 rounded-xl bg-amber-50 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" />
            <div>
              <p className="text-xs font-medium text-amber-900">Using a template?</p>
              <p className="mb-2 text-[11px] text-amber-800/80">Ensure your data matches our structure for a smooth import.</p>
              <div className="flex gap-4">
                <a href="/samples/sample.xlsx" download className="text-[11px] font-bold text-amber-700 underline hover:text-amber-800">Download XLSX Template</a>
                <a href="/samples/sample.docx" download className="text-[11px] font-bold text-amber-700 underline hover:text-amber-800">Download DOCX Template</a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ImportExportFloatingCard;