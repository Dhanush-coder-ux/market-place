import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {

  Bell,
  Settings,
  Search,
  ArrowRight,
  Store,
  ChevronDown,
  Check,
  PlusCircle,
  LayoutDashboard,
  Package,
  UserPlus,
  Boxes,
  Receipt,
  History,
  Truck,
  RefreshCw,
  Plus,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"; // adjust path if needed

// -----------------------------
// Store Data
// -----------------------------
const MY_STORES = [
  { id: 1, name: "Vaathi Mart" },
  { id: 2, name: "Chennai Super Store" },
  { id: 3, name: "Digital Bazaar" },
];

// -----------------------------
// Route Config
// -----------------------------
const SEARCHABLE_ROUTES = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Products", path: "/product", icon: Package },
  { name: "Add Employee", path: "/employee/add", icon: UserPlus },
  { name: "Inventory", path: "/inventory", icon: Boxes },
  { name: "Billing & Invoices", path: "/billing", icon: Receipt },
  { name: "Purchase History", path: "/purchase", icon: History },
  { name: "Suppliers", path: "/supplier", icon: Truck },
  { name: "Digital Store", path: "/digital-store", icon: Store },
  { name: "Refill Inventory", path: "/inventory/re-fill", icon: RefreshCw },
  { name: "Create Digital Store", path: "/create-digital-store", icon: Plus },
  { name: "Digital Store Profile", path: "/digital-store/profile", icon: Store },
];

// -----------------------------
// Navbar Component
// -----------------------------
export const Navbar = () => {
  const [selectedStore, setSelectedStore] = useState(MY_STORES[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  // Filter routes
  const filteredRoutes = SEARCHABLE_ROUTES.filter((route) =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  return (
    <div className="w-full flex items-center justify-between px-4 py-2 md:p-1 bg-white shadow-sm border-b border-gray-100">

      {/* LEFT - Store Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-2 h-auto py-2 px-3 bg-gray-100 rounded-lg cursor-pointer group">
            <div className="p-1.5 bg-blue-50 rounded-md text-blue-600 group-hover:bg-blue-100 transition-colors">
              <Store className="w-5 h-5" />
            </div>

            <div className="flex flex-col items-start">
              <span className="text-gray-800 font-bold text-sm">
                {selectedStore.name}
              </span>
              <span className="text-[10px] text-gray-400">
                Switch Store
              </span>
            </div>

            <ChevronDown className="w-4 h-4 text-gray-400 ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider">
            My Stores
          </DropdownMenuLabel>

          {MY_STORES.map((store) => (
            <DropdownMenuItem
              key={store.id}
              onClick={() => setSelectedStore(store)}
              className="flex items-center justify-between cursor-pointer py-2.5"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">
                  {store.name.charAt(0)}
                </div>
                <span
                  className={
                    selectedStore.id === store.id
                      ? "font-semibold"
                      : ""
                  }
                >
                  {store.name}
                </span>
              </div>

              {selectedStore.id === store.id && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <Link to="/profile/add">
            <DropdownMenuItem className="cursor-pointer text-blue-600">
              <PlusCircle className="w-4 h-4 mr-2" />
              Create New Store
            </DropdownMenuItem>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* CENTER - Global Search */}
      <div
        className="relative flex-1 max-w-md mx-8"
        ref={searchRef}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search pages..."
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsSearchOpen(true);
          }}
          onFocus={() => setIsSearchOpen(true)}
        />

        {isSearchOpen && searchQuery && (
          <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
            {filteredRoutes.length > 0 ? (
              <>
                <p className="px-4 py-1 text-[10px] font-semibold text-gray-400 uppercase">
                  Quick Navigation
                </p>

                {filteredRoutes.map((route) => {
                  const Icon = route.icon;
                  return (
                    <button
                      key={route.path}
                      onClick={() =>
                        handleNavigate(route.path)
                      }
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 text-sm group"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        <span className="group-hover:text-blue-600 font-medium">
                          {route.name}
                        </span>
                      </div>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-600" />
                    </button>
                  );
                })}
              </>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                No pages found
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT - Actions */}
      <div className="flex items-center gap-5">
        <Link to={'/create-digital-store'} className="text-sm text-gray-500 px-2 bg-gray-50 hover:bg-gray-100 rounded-lg flex hover:text-blue-600 transition-colors">
          <Plus className="w-5 h-5" />
          <span className="ml-1 text-sm hidden sm:inline">Create Digital Store</span>
        </Link>

        <button className="text-gray-500 hover:text-blue-600 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <Settings className="w-5 h-5 text-gray-500 hover:text-blue-600 cursor-pointer transition-transform hover:rotate-90 duration-300" />

        <div className="h-6 w-px bg-gray-200"></div>

        <Link
          to="/profile"
          className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full hover:ring-2 hover:ring-offset-2 hover:ring-blue-300 transition-all"
        />
      </div>
    </div>
  );
};