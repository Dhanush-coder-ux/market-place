import { Link } from "react-router-dom";
import Title from "../../../components/common/Title";
import {  Upload, User, Mail, Phone, MapPin, Globe, FileText, UserCheck2 } from "lucide-react";
import FormCard from "@/components/common/FormCard";
import Input from "@/components/ui/Input";

const ProfileForm = () => {
  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link to={'/profile'} viewTransition>
          <Title title="Profile" icon={<UserCheck2 size={30} />} />
        </Link>
        <Title title="/ Profile Management" />
      </div>

      {/* FORM */}
      <form className="max-w-4xl mx-auto">
        <FormCard>

          {/* Profile Image Upload */}
          <div className="flex flex-col items-center gap-3 pb-6 border-b border-gray-200 mb-6">
            <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border">
              <User size={40} className="text-gray-400" />
            </div>

            <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Upload size={16} />
              Upload Profile Photo
              <input type="file" className="hidden" />
            </label>
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
            <button
              type="button"
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm shadow-sm"
            >
              Save Changes
            </button>
          </div>

        </FormCard>
      </form>
    </div>
  );
};

export default ProfileForm;
