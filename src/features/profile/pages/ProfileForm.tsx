import { Link } from "react-router-dom";
import Title from "../../../components/common/Title";
import {  Upload, User, Mail, Phone, MapPin, Globe, FileText, UserCheck2 } from "lucide-react";
import FormCard from "@/components/common/FormCard";
import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import { useEffect, useRef, useState } from "react";

const ProfileForm = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<{
    image: File | null;
  }>({
    image: null,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setFormData((prev) => ({
      ...prev,
      image: file,
    }));

    setImagePreview(previewUrl);
  };
  useEffect(() => {
  return () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
  };
}, [imagePreview]);
  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link to={'/profile'} viewTransition>
          <Title title="Profile" icon={<UserCheck2 size={30} />} />
        </Link>
        <Title title="/ Profile Management" />
      </div>

      <form className="max-w-4xl mx-auto">
        <FormCard>
        <div className="flex items-center justify-center">
          {/* Profile Image Upload */}
                <div className="lg:w-1/3 flex flex-col items-center justify-start">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">
                Product Image
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
                        alt="Product Preview"
                        className="w-full h-full object-cover rounded-[28px]"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white">
                        <span className="text-sm font-bold">Change Image</span>
                        <span className="text-[10px] opacity-80 truncate px-4">
                          {formData.image?.name}
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
                        PNG, JPG up to 10MB
                      </span>
                    </div>
               )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/png, image/jpeg"
                  className="hidden"
                />
              </div>
            </div>
        </div>

       
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Name */}
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                <User size={16} /> Full Name
              </label>
              
              <Input
                value={""}
                onChange={()=>("")}
                name=""
                type="text"
                placeholder="Enter your full name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                <Mail size={16} /> Email Address
              </label>
              <Input
                value={""}
                onChange={()=>("")}
                name=""
                type="email"
                placeholder="Email address"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                <Phone size={16} /> Phone Number
              </label>
              <Input
                value={""}
                onChange={()=>("")}
                name=""
                type="text"
                placeholder="Phone number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Website */}
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                <Globe size={16} /> Website
              </label>
              <Input
                value={""}
                onChange={()=>("")}
                name=""
                type="text"
                placeholder="Website link"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                <MapPin size={16} /> Address
              </label>
                <Input
                value={""}
                onChange={()=>("")}
                name=""
                type="text"
                placeholder="House No, Street, Area"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Bio */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                <FileText size={16} /> Bio / About You
              </label>
              <textarea
                rows={4}
                placeholder="Write something about yourself..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3 mt-8">
            <GradientButton
              type="button"
              variant="outline"
            >
              Cancel
            </GradientButton>
            <GradientButton
              type="button"
            >
              Save Changes
            </GradientButton>

          
          </div>

        </FormCard>
      </form>
    </div>
  );
};

export default ProfileForm;
