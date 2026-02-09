import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  Bell, 
  Settings, 
  Store, 
  ChevronDown, 
  Check, 
  PlusCircle 
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const MY_STORES = [
  { id: "1", name: "Zenitsu Store" },
  { id: "2", name: "Tanjiro Mart" },
  { id: "3", name: "Inosuke Supply" },
];

const Navbar = () => {

  const [selectedStore, setSelectedStore] = useState(MY_STORES[0]);

  return (
    <div className="w-full flex items-center justify-between px-4 py-2 bg-white shadow-sm border-b border-gray-100">
      
  
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div 
         
              className="flex items-center gap-2 h-auto py-2 px-3 bg-gray-100 rounded-lg group"
            >
              {/* Store Icon */}
              <div className="p-1.5 bg-blue-50 rounded-md text-blue-600 group-hover:bg-blue-100 transition-colors">
                <Store className="w-5 h-5" />
              </div>
              
              {/* Store Name & Chevron */}
              <div className="flex flex-col items-start">
                <span className="text-gray-800 font-bold text-sm leading-tight">
                  {selectedStore.name}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                  Switch Store
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-xs font-normal text-gray-500 uppercase tracking-wider">
              My Stores
            </DropdownMenuLabel>
            
            {MY_STORES.map((store) => (
              <DropdownMenuItem 
                key={store.id}
                onClick={() => setSelectedStore(store)}
                className="flex items-center justify-between cursor-pointer py-2.5"
              >
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                      {store.name.charAt(0)}
                   </div>
                   <span className={selectedStore.id === store.id ? "font-semibold" : ""}>
                     {store.name}
                   </span>
                </div>
                {selectedStore.id === store.id && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            
            <Link to="/profile/add"><DropdownMenuItem  className="cursor-pointer text-blue-600 focus:text-blue-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Create New Store
            </DropdownMenuItem></Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

  
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:text-blue-600 transition-colors">
                 <Users className="w-5 h-5" />
            </button>
            <button className="text-gray-500 hover:text-blue-600 transition-colors relative">
                 <Bell className="w-5 h-5" />
     
                 <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <Link to={'/profile'} className="text-gray-500 hover:text-blue-600 transition-transform hover:rotate-90 duration-300">
                <Settings className="w-5 h-5" />
            </Link>
        </div>

        <div className="h-6 w-px bg-gray-200"></div>

        <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-blue-300 transition-all" />
      </div>

    </div>
  );
};

export default Navbar;