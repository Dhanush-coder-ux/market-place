import { Link } from "react-router-dom";
import Title from "../../../components/common/Title";
import { User, Mail, Phone, MapPin, Globe, FileText, UserCheck2 } from "lucide-react";
import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import ImageUpload from "@/components/common/ImageUpload";
import { useState } from "react";

const ProfileForm = () => {
  const [image, setImage] = useState<File | null>(null);
  return (
    <div className="pb-10">

      <div className="flex items-center gap-2 mb-6">
        <Link to={'/profile'} viewTransition>
          <Title title="Profile" icon={<UserCheck2 size={30} />} />
        </Link>
        <Title title="/ Profile Management" />
      </div>

      <form className="max-w-4xl mx-auto">
       
          <div className="flex items-center justify-center">
            {/* Profile Image Upload */}
            <ImageUpload
              label="Profile Image"
              value={image}
              onChange={setImage}
            />
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Name */}
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                <User size={16} /> Full Name
              </label>

              <Input
                value={""}
                onChange={() => ("")}
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
                onChange={() => ("")}
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
                onChange={() => ("")}
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
                onChange={() => ("")}
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
                onChange={() => ("")}
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
      </form>
    </div>
  );
};

export default ProfileForm;
