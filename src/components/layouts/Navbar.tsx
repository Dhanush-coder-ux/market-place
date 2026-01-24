import { Users, Bell, Settings, StoreIcon } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <div className="w-full flex items-center justify-between px-4 py-2 bg-white shadow-sm ">
   
      <div className="flex items-center gap-2 text-gray-800 font-semibold text-lg">
        <StoreIcon className="w-5 h-5 text-gray-700" />
        Zenitsu Store
      </div>

      <div className="flex items-center gap-6">

        <Users className="w-5 h-5 cursor-pointer hover:text-blue-600 transition-colors" />

        <Bell className="w-5 h-5 cursor-pointer hover:text-blue-600 transition-colors" />
        <Link to={'/profile'} className="group">
          <Settings className="w-5 h-5 cursor-pointer transition-transform group-hover:rotate-180" />
        </Link>
        <div className="w-9 h-9 bg-gray-200 rounded-full  cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all" />
      </div>

    </div>
  );
};

export default Navbar;
