import { Upload } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { ImageUploadProps } from "../types";

const ImageUpload: React.FC<ImageUploadProps> = ({
  label = "Image",
  value,
  onChange,
  maxSizeMB = 5,
  accept = "image/png, image/jpeg",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!value) return setPreview(null);
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

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
    <div className="flex flex-col items-center gap-2 w-[160px]">
      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
        {label}
      </label>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer overflow-hidden group"
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
