import { Upload } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
export interface ImageUploadProps {
  label?: string;
  value: File | null;
  onChange: (file: File) => void;
  maxSizeMB?: number;
  accept?: string;
  initialPreview?: string | null;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  label = "Image",
  value,
  onChange,
  maxSizeMB = 5,
  accept = "image/png, image/jpeg",
  initialPreview = null,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialPreview);

  useEffect(() => {
    if (!value) {
      setPreview(initialPreview);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value, initialPreview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Max ${maxSizeMB}MB allowed`);
      return;
    }

    onChange(file);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center gap-1.5 ml-0.5">
        <label className="text-xs font-semibold text-slate-600">
          {label}
        </label>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative w-full aspect-square rounded-lg border border-slate-200 border-dashed bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer overflow-hidden group shadow-sm"
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white">
              <span className="text-xs font-semibold">Change</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Upload className="text-blue-600" size={22} />
            <span className="text-[11px] font-semibold text-blue-600 mt-1">
              Upload
            </span>
            <span className="text-[9px] text-gray-400">
              PNG / JPG
            </span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;

