import { Outlet, useLocation } from "react-router-dom";
import Breadcrumb from "../common/BreadCrums";
import { Navbar } from "./Navbar";
import Sidebar from "./Sidebar";
import Title from "../common/Title"
import { sidebarLinks } from "@/utils/constants";
import { useHeader } from "@/context/HeaderContext";
import MobileBottomBar from "./MobileBottomBar";

const getPageHeaderInfo = (pathname: string) => {
  const routes: Record<string, { title: string; subtitle?: string; icon?: any }> = {
    "/": {
      title: "Analytics Dashboard",
      subtitle: "Overview of your key business metrics and performance.",
    },
    "/sales": {
      title: "Sales Management",
      subtitle: "Manage and track your sales invoices.",
    },
    "/product": {
      title: "Product Inventory",
      subtitle: "Manage and track your warehouse stock.",
    },
    "/product/detail": {
      title: "Product Details",
      subtitle: "View complete product information and history.",
    },
    "/product/add": {
      title: "Create Product",
      subtitle: "Add a new product to your inventory.",
    },
    "/product/all": {
      title: "Product Inventory",
      subtitle: "Full catalog of your products, variants and stock levels.",
    },
    "/product/drafts": {
      title: "Product Drafts",
      subtitle: "Manage your locally saved progress.",
    },
    "/purchase-order/add": {
      title: "Create Purchase Order",
      subtitle: "Generate a new purchase order for suppliers.",
    },
    "/po-grn": {
      title: "Goods Receipt Notes",
      subtitle: "Manage and review all received goods.",
    },
    "/po-grn/add": {
      title: "Create GRN",
      subtitle: "Record new goods receipt against purchase orders.",
    },
    "/po-grn/update": {
      title: "Update GRN",
      subtitle: "Update existing goods receipt notes.",
    },
    "/purchase-history": {
      title: "Purchase History",
      subtitle: "View all past purchase transactions.",
    },
    "/production-entry/add": {
      title: "Production Entry",
      subtitle: "Record completed manufacturing batches.",
    },
    "/purchase/detail": {
      title: "Purchase Details",
      subtitle: "View complete purchase order information.",
    },
    "/purchase/add": {
      title: "Direct Purchase",
      subtitle: "Record direct purchase without PO.",
    },
    "/supplier": {
      title: "Supplier Master",
      subtitle: "Manage your permanent vendor relationships and accounts.",
    },
    "/supplier/detail": {
      title: "Supplier Details",
      subtitle: "View complete supplier information and ledger.",
    },
    "/supplier/add": {
      title: "Add Supplier",
      subtitle: "Register a new vendor in the system.",
    },
    "/employee": {
      title: "Employee Management",
      subtitle: "Manage your staff, roles, and payroll.",
    },
    "/employee/add": {
      title: "Add Employee",
      subtitle: "Register a new employee in the system.",
    },
    "/inventory": {
      title: "Inventory Master",
      subtitle: "Overall view of your current stock levels.",
    },
    "/stock-movement": {
      title: "Stock Movement History",
      subtitle: "Track all inward and outward material flow.",
    },
    "/stock-adjustment": {
      title: "Stock Adjustment",
      subtitle: "Adjust inventory quantities and values manually.",
    },
    "/billing": {
      title: "Point of Sale (POS)",
      subtitle: "Quick retail billing and invoicing.",
    },
    "/orders": {
      title: "Order Management",
      subtitle: "Track and fulfill customer orders.",
    },
    "/profile": {
      title: "Profile Settings",
      subtitle: "Manage your personal and business profile.",
    },
    "/profile/add": {
      title: "Edit Profile",
      subtitle: "Update your profile details.",
    },
    "/create-digital-store": {
      title: "Digital Store Setup",
      subtitle: "Configure your online storefront.",
    },
    "/digital-store/profile": {
      title: "Digital Store",
      subtitle: "Your online storefront overview.",
    },
    "/customers": {
      title: "Customer Directory",
      subtitle: "Manage your clients and their details.",
    },
    "/customers-Summary": {
      title: "Customer Balances",
      subtitle: "Track outstanding payments and customer ledgers.",
    },
    "/customers/add": {
      title: "Add Customer",
      subtitle: "Register a new customer in the system.",
    },
    "/customers/drafts": {
      title: "Customer Drafts",
      subtitle: "Manage your locally saved progress.",
    },
  };

  // Dynamic match for Customer Profile
  if (pathname.match(/^\/customers\/[^/]+$/)) {
    return {
      title: "Customer Profile",
      subtitle: "View complete customer information and history.",
    };
  }

  // Dynamic match for Edit Customer
  if (pathname.match(/^\/customers\/[^/]+\/edit$/)) {
    return {
      title: "Update Customer",
      subtitle: "Modify existing customer details.",
    };
  }

  // Dynamic match for Employee Profile
  if (pathname.match(/^\/employee\/[^/]+$/)) {
    return {
      title: "Employee Profile",
      subtitle: "View complete staff information and status.",
    };
  }

  // Dynamic match for Edit Employee
  if (pathname.match(/^\/employee\/[^/]+\/edit$/)) {
    return {
      title: "Update Employee",
      subtitle: "Modify existing staff details.",
    };
  }

  // Dynamic match for Supplier Profile
  if (pathname.match(/^\/supplier\/[^/]+$/)) {
    return {
      title: "Supplier Profile",
      subtitle: "View complete supplier information and history.",
    };
  }

  // Dynamic match for Edit Supplier
  if (pathname.match(/^\/supplier\/[^/]+\/edit$/)) {
    return {
      title: "Update Supplier",
      subtitle: "Modify existing supplier details.",
    };
  }

  // Dynamic match for Product Profile
  if (pathname.match(/^\/product\/[^/]+$/)) {
    return {
      title: "Product Profile",
      subtitle: "View complete product information, variants and history.",
    };
  }

  // Dynamic match for Edit Product
  if (pathname.match(/^\/product\/[^/]+\/edit$/)) {
    return {
      title: "Update Product",
      subtitle: "Modify existing product details.",
    };
  }

  // Drafts Pages
  if (pathname === "/supplier/drafts") {
    return {
      title: "Supplier Drafts",
      subtitle: "Manage your locally saved vendor registrations.",
    };
  }

  if (pathname === "/employee/drafts") {
    return {
      title: "Employee Drafts",
      subtitle: "Manage your locally saved staff records.",
    };
  }

  return routes[pathname] || { 
    title: pathname.split("/").pop()?.replace("-", " ").toUpperCase() || "Home", 
    subtitle: "" 
  };
};

const MainLayout = () => {
  const location = useLocation();
  const { actions, bottomActions } = useHeader();
  const isStorePage = 
    location.pathname === "/digital-store" || 
    location.pathname === "/digital-store/profile" || 
    location.pathname === "/";

  // 3. Extract the current title info based on the URL
  const { title, subtitle, icon } = getPageHeaderInfo(location.pathname);

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-50">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — hidden on mobile, visible on md+ */}
        <div className="hidden md:flex">
          <Sidebar links={sidebarLinks} />
        </div>
        
        <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
          <div className={`flex-1 overflow-y-auto custom-scrollbar mobile-scroll relative ${isStorePage ? "p-0 pb-20 md:pb-0" : "p-2 md:p-3 lg:p-4 pb-36 md:pb-0"} ${!bottomActions && "pb-20 md:pb-0"}`}>
            
            {!isStorePage && (
              <div className="mb-2 sm:mb-4">
                <Breadcrumb />
               
                <div className="mt-2 sm:mt-4">
                  <Title title={title} subtitle={subtitle} icon={icon} actions={actions} />
                </div>
              </div>
            )}
            
            <Outlet />
          </div>

          {/* Global Bottom Action Bar (Glassmorphism) */}
          {bottomActions && (
            <div className="flex-shrink-0 h-16 md:h-12 flex items-center justify-end px-4 md:px-8 gap-3
              fixed bottom-[calc(60px+env(safe-area-inset-bottom))] left-0 right-0 
              md:relative md:bottom-0
              bg-white/95 backdrop-mobile
              border-t border-slate-200/80
              shadow-[0_-8px_30px_rgba(0,0,0,0.08)]
              z-[65] md:animate-in md:slide-in-from-bottom-full md:duration-500
              gpu-layer">
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {bottomActions}
              </div>
            </div>
)}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomBar />
    </div>
  );
};

export default MainLayout;