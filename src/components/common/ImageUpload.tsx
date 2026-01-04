import { Upload } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { ImageUploadProps } from "../types";



const ImageUpload: React.FC<ImageUploadProps> = ({
  label = "Image",
  value,
  onChange,
  maxSizeMB = 10,
  accept = "image/png, image/jpeg",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

 
  useEffect(() => {
    if (!value) {
      setImagePreview(null);
      return;
    }

    const url = URL.createObjectURL(value);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [value]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Image must be under ${maxSizeMB}MB`);
      return;
    }

    onChange(file);
  };

  return (
    <div className="lg:w-1/3 flex flex-col items-center justify-start">
      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">
        {label}
      </label>

      <div
        className="relative w-full aspect-square max-w-[240px] group"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="absolute inset-0 bg-blue-500/5 rounded-[30px] border-2 border-dashed border-blue-200 group-hover:border-blue-400 group-hover:bg-blue-500/10 transition-all flex items-center justify-center cursor-pointer overflow-hidden">

          {imagePreview ? (
            <>
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover rounded-[28px]"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white">
                <span className="text-sm font-bold">Change Image</span>
                <span className="text-[10px] opacity-80 truncate px-4">
                  {value?.name}
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <Upload className="text-blue-600" size={28} />
              </div>
              <span className="text-sm font-bold text-blue-600">Upload Image</span>
              <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">
                PNG, JPG up to {maxSizeMB}MB
              </span>
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept={accept}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageUpload;
