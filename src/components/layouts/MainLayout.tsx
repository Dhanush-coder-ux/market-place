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
      subtitle: "Insights into your key business performance and metrics.",
    },
    "/sales": {
      title: "Sales Management",
      subtitle: "Comprehensive tracking and management of sales invoices.",
    },
    "/product": {
      title: "Inventory Catalog",
      subtitle: "Oversee product specifications, variants, and stock.",
    },
    "/product/detail": {
      title: "Product Details",
      subtitle: "In-depth overview of product history and performance.",
    },
    "/product/add": {
      title: "Create Product",
      subtitle: "Register new inventory items into the system.",
    },
    "/product/all": {
      title: "Unified Inventory",
      subtitle: "Complete view of products across all locations.",
    },
    "/product/drafts": {
      title: "Product Drafts",
      subtitle: "Review and finalize pending product entries.",
    },
    "/purchase-order/add": {
      title: "Purchase Order",
      subtitle: "Generate official procurement requests for vendors.",
    },
    "/po-grn": {
      title: "Goods Receiving",
      subtitle: "Manage and verify Goods Receipt Notes (GRN).",
    },
    "/po-grn/add": {
      title: "Record Receipt",
      subtitle: "Acknowledge and process incoming shipments.",
    },
    "/po-grn/update": {
      title: "Edit Receipt",
      subtitle: "Update existing goods receipt documentation.",
    },
    "/purchase-history": {
      title: "Purchase History",
      subtitle: "Archival record of all procurement transactions.",
    },
    "/production-entry/add": {
      title: "Production Entry",
      subtitle: "Log completed manufacturing and assembly batches.",
    },
    "/purchase/detail": {
      title: "Purchase Details",
      subtitle: "Review transaction specifics and itemized costs.",
    },
    "/purchase/add": {
      title: "Direct Purchase",
      subtitle: "Execute immediate procurement without a purchase order.",
    },
    "/supplier": {
      title: "Vendor Directory",
      subtitle: "Manage supplier relationships and contact information.",
    },
    "/supplier/detail": {
      title: "Vendor Profile",
      subtitle: "Detailed ledger and transaction history for this vendor.",
    },
    "/supplier/add": {
      title: "Register Vendor",
      subtitle: "Onboard a new supplier to your procurement network.",
    },
    "/employee": {
      title: "Employee Directory",
      subtitle: "Manage staff profiles, roles, and permissions.",
    },
    "/employee/add": {
      title: "New Employee",
      subtitle: "Register a new staff member to the organization.",
    },
    "/inventory": {
      title: "Inventory Master",
      subtitle: "Strategic overview of stock levels and valuations.",
    },
    "/stock-movement": {
      title: "Stock Movement",
      subtitle: "Audit trail of all material transfers and adjustments.",
    },
    "/stock-adjustment": {
      title: "Stock Adjustment",
      subtitle: "Reconcile system inventory with physical counts.",
    },
    "/billing": {
      title: "Point of Sale",
      subtitle: "Process retail transactions and generate invoices.",
    },
    "/orders": {
      title: "Order Management",
      subtitle: "Track, fulfill, and manage customer orders.",
    },
    "/profile": {
      title: "User Settings",
      subtitle: "Manage your account preferences and security.",
    },
    "/profile/add": {
      title: "Edit Profile",
      subtitle: "Update your personal and professional information.",
    },
    "/create-digital-store": {
      title: "Storefront Setup",
      subtitle: "Configure your digital sales and brand presence.",
    },
    "/digital-store/profile": {
      title: "Digital Storefront",
      subtitle: "Overview of your online business operations.",
    },
    "/customers": {
      title: "Customer Directory",
      subtitle: "Centralized database of your client relationships.",
    },
    "/customers-Summary": {
      title: "Customer Details",
      subtitle: "Monitor outstanding receivables and credit status.",
    },
    "/customers/add": {
      title: "Add Customer",
      subtitle: "Register a new client profile in the directory.",
    },
    "/customers/drafts": {
      title: "Customer Drafts",
      subtitle: "Manage partially completed customer registrations.",
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
      title: "Vendor Profile",
      subtitle: "View complete supplier information and history.",
    };
  }

  // Dynamic match for Edit Supplier
  if (pathname.match(/^\/supplier\/[^/]+\/edit$/)) {
    return {
      title: "Update Vendor",
      subtitle: "Modify existing supplier details.",
    };
  }

  // Dynamic match for Product Profile
  if (pathname.match(/^\/product\/[^/]+$/)) {
    return {
      title: "Product Details",
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
      title: "Vendor Drafts",
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
    title: pathname.split("/").pop()?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Home",
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

  const isBillingPage = location.pathname === "/billing";
  const isCleanMode = isBillingPage && new URLSearchParams(location.search).get("mode") === "clean";
  const hideNav = isCleanMode;

  // 3. Extract the current title info based on the URL
  const { title, subtitle, icon } = getPageHeaderInfo(location.pathname);

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-50">
      {!hideNav && <Navbar />}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — hidden on mobile, visible on md+ */}
        {!hideNav && (
          <div className="hidden md:flex">
            <Sidebar links={sidebarLinks} />
          </div>
        )}

        <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
          <div className={`flex-1 overflow-y-auto custom-scrollbar mobile-scroll relative ${hideNav ? "p-0" : isStorePage ? "p-0 pb-20 md:pb-0" : "p-2 md:p-3 lg:p-4 pb-36 md:pb-0"} ${!bottomActions && "pb-20 md:pb-0"}`}>

            {!isStorePage && !hideNav && (
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
      {!hideNav && <MobileBottomBar />}
    </div>
  );
};

export default MainLayout;
