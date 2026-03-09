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
  ShoppingCart,
  Command,
  Settings2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
  { name: "Orders", path: "/orders", icon: ShoppingCart },
  { name: "Products", path: "/product", icon: Package },
  { name: "Add Products", path: "/product/add",icon:PlusCircle},
  { name: "Add Employee", path: "/employee/add", icon: UserPlus },
  { name: "Add Inventory", path: "/inventory/add",icon:PlusCircle},
  { name: "Inventory", path: "/inventory", icon: Boxes },
  { name: "Billing & Invoices", path: "/billing", icon: Receipt },
  { name: "Purchase History", path: "/purchase", icon: History },
  { name: "Suppliers", path: "/supplier", icon: Truck },
  { name: "Add Suppliers" , path: "/supplier/add",icon:PlusCircle},
  { name: "Refill Inventory", path: "/inventory/re-fill", icon: RefreshCw },
  { name: "Create Digital Store", path: "/create-digital-store", icon: Plus },
  { name: "Digital Store Profile", path: "/digital-store/profile", icon: Store },
  { name: "Settings", path: "/profile", icon: Settings2}
];

export const Navbar = () => {
  const [selectedStore, setSelectedStore] = useState(MY_STORES[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter routes
  const filteredRoutes = SEARCHABLE_ROUTES.filter((route) =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard Shortcuts (Cmd+K / Ctrl+K and Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Cmd (Mac) or Ctrl (Windows) AND the 'k' key are pressed
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault(); // Prevents the browser's default search bar from opening
        inputRef.current?.focus(); // Focus your search input
      }
      
      // Pressing 'Escape' closes the search menu and unfocuses
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  return (
    <div className="sticky top-0 z-40 w-full flex items-center justify-between px-4 lg:px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
      
      {/* LEFT - Store Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 py-1.5 px-2 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 group">
            <div className="w-9 h-9 flex items-center justify-center bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
              <Store className="w-4 h-4" />
            </div>
            <div className="flex flex-col items-start text-left hidden sm:flex">
              <span className="text-slate-800 font-bold text-sm leading-tight">
                {selectedStore.name}
              </span>
              <span className="text-[11px] font-medium text-slate-400 leading-tight">
                Switch Workspace
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors hidden sm:block" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64 p-1.5 rounded-2xl shadow-xl border-slate-100">
          <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1.5">
            My Workspaces
          </DropdownMenuLabel>
          
          {MY_STORES.map((store) => (
            <DropdownMenuItem
              key={store.id}
              onClick={() => setSelectedStore(store)}
              className={`flex items-center justify-between cursor-pointer rounded-xl px-2.5 py-2 my-0.5 transition-colors ${
                selectedStore.id === store.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${
                  selectedStore.id === store.id ? "bg-white border-indigo-200 text-indigo-600" : "bg-slate-100 border-slate-200 text-slate-500"
                }`}>
                  {store.name.charAt(0)}
                </div>
                <span className="font-semibold text-sm">{store.name}</span>
              </div>
              {selectedStore.id === store.id && <Check className="w-4 h-4 text-indigo-600" />}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator className="bg-slate-100 my-1.5" />

          <Link to="/profile/add">
            <DropdownMenuItem className="cursor-pointer text-indigo-600 rounded-xl px-2.5 py-2 hover:bg-indigo-50 font-medium">
              <PlusCircle className="w-4 h-4 mr-2" />
              Create New Store
            </DropdownMenuItem>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* CENTER - Global Search (Command Palette Style) */}
      <div className="relative flex-1 max-w-lg mx-4 lg:mx-8 hidden md:block" ref={searchRef}>
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, orders, products..."
            className="w-full pl-10 pr-12 py-2 bg-slate-100/70 border border-slate-200/60 rounded-full text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
          />
          {/* Fake shortcut hint */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
            <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-medium text-slate-400 shadow-sm">
              <Command size={10} /> K
            </kbd>
          </div>
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchQuery && (
          <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
            {filteredRoutes.length > 0 ? (
              <div className="p-1.5">
                <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Quick Navigation
                </p>
                {filteredRoutes.map((route) => {
                  const Icon = route.icon;
                  return (
                    <button
                      key={route.path}
                      onClick={() => handleNavigate(route.path)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-indigo-50 text-sm group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-slate-100 group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-sm transition-all">
                          <Icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                        </div>
                        <span className="text-slate-700 group-hover:text-indigo-700 font-semibold">
                          {route.name}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 text-indigo-600 transition-all duration-200" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No results found</p>
                <p className="text-xs text-slate-400 mt-1">Try searching for something else.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT - Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* Create Store Button (Hidden on very small screens) */}
        <Link 
          to={'/create-digital-store'} 
          className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Digital Store</span>
        </Link>

        {/* Action Icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button className="relative p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
          <Link to={'/profile'}>
          <button className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors group">
            <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
          </button>
          </Link>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-slate-200 mx-1"></div>

        {/* Profile Avatar */}
        <Link
          to="/profile"
          className="relative w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 hover:scale-105 transition-transform cursor-pointer shadow-md"
        >
          <div className="w-full h-full bg-white rounded-full p-0.5">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
              alt="Profile" 
              className="w-full h-full rounded-full bg-slate-100 object-cover"
            />
          </div>
        </Link>
        
      </div>
    </div>
  );
};