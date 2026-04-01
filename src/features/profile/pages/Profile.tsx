import { Link } from "react-router-dom";
import Title from "../../../components/common/Title";
import { 
  Store, XCircle, FileText, MapPin, 
  Edit3,  ShieldCheck, Phone, Mail, Globe, FileTextIcon, 
  UserCheck2,
  LogOut
} from "lucide-react";
import { Switch } from "@/components/ui/switch";


const Profile = () => {
  return (
    <div>
      <Title icon={<UserCheck2 size={30} />} title="Profile Info" />

      <div >
        <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-4 md:p-5 max-w-4xl mx-auto">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">

            {/* Left */}
            <div className="flex items-start gap-3 md:gap-4">

              {/* Static Image Box */}
              <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                  <div className="flex flex-col items-center text-gray-300">
                    <Store size={24} className="md:w-6 md:h-6" />
                    <p className="text-[10px] mt-1">No Image</p>
                  </div>
                </div>

                {/* Static Badge */}
                <div className="absolute -top-1 -right-1 bg-gray-400 rounded-full p-0.5 border-2 border-white">
                  <XCircle size={14} className="text-white" />
                </div>
              </div>

              {/* Static Shop Info */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg md:text-xl font-semibold text-gray-900 truncate max-w-[200px] md:max-w-xs">
                    Shop Name
                  </h1>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <XCircle size={12} />
                    Unverified
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="truncate max-w-[180px] md:max-w-sm">
                    Address not available
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    Retail
                  </span>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                    <FileText size={12} />
                    GST Registered
                  </span>
                </div>
              </div>
            </div>

            {/* Right Buttons */}
            <div className="flex items-center gap-2">
              <Link to={'/profile/add'} className="p-2 rounded-lg bg-white border border-gray-300 text-gray-600 hover:bg-gray-50">
                <Edit3 size={18} />
              </Link>

              <button className="p-2 rounded-lg bg-white border border-gray-300 text-gray-600 ">
                <LogOut  color="red" size={18}/>
              </button>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex gap-2">
              <Switch  id="show-on-app"/>
              <label htmlFor="show-on-app" className="text-sm font-medium text-gray-700">
                Show On App
              </label>
          </div>

          <div className="border-t border-gray-200 my-4"></div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* About Section */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Store size={16} className="text-gray-400" />
                  About Store
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                  No description added for this shop.
                </p>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-white rounded border border-gray-200">
                      <FileText size={14} className="text-blue-500" />
                    </div>
                    <span className="text-xs font-medium text-gray-500">GST Number</span>
                  </div>
                  <p className="font-medium text-gray-900 text-sm">N/A</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-white rounded border border-gray-200">
                      <ShieldCheck size={14} className="text-purple-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500">Business Type</span>
                  </div>
                  <p className="font-medium text-gray-900 text-sm">N/A</p>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                Contact Details
              </h3>

              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="p-1.5 bg-blue-100 rounded border border-blue-200">
                    <Phone size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900 text-sm">N/A</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="p-1.5 bg-blue-100 rounded border border-blue-200">
                    <MapPin size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Landmark</p>
                    <p className="font-medium text-gray-900 text-sm">N/A</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="p-1.5 bg-blue-100 rounded border border-blue-200">
                    <FileTextIcon size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Zipcode</p>
                    <p className="font-medium text-gray-900 text-sm">N/A</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 my-4"></div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail size={14} className="text-gray-400" />
              <span>No Email</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Globe size={14} className="text-gray-400" />
              <span className="text-blue-600">No Website</span>
            </div>
          </div>
        </div>

        {/* Bulk Data Upload Box */}
        {/* <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-4 md:p-5 max-w-4xl mx-auto mt-5">
          <BulkDataUI />
        </div> */}
      </div>
    </div>
  );
};

export default Profile;