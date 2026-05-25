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
      title: "Products Directory",
      subtitle: "Browse and manage your entire product catalog.",
    },
    "/product/detail": {
      title: "Product Details",
      subtitle: "In-depth overview of product history and performance.",
    },
    "/product/add": {
      title: "Create Product",
      subtitle: "Register and onboard a new product to your inventory.",
    },
    "/product/all": {
      title: "Products List",
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
      title: "Update Receipt",
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
    "/purchase": {
      title: "Purchase Management",
      subtitle: "Monitor supplier invoices, and payment statuses.",
    },
    "/purchase/detail": {
      title: "Purchase Details",
      subtitle: "Review transaction specifics and itemized costs.",
    },
    "/purchase/add": {
      title: "Create Purchase",
      subtitle: "Execute immediate procurement without a purchase order.",
    },
    "/supplier/all": {
      title: "Suppliers List",
      subtitle: "Browse and manage your vendor relationships.",
    },
    "/supplier": {
      title: "Suppliers Directory",
      subtitle: "Browse and manage your entire supplier catalog.",
    },
    "/supplier/detail": {
      title: "Supplier Details",
      subtitle: "Detailed ledger and transaction history for this vendor.",
    },
    "/supplier/add": {
      title: "Create Supplier",
      subtitle: "Register and onboard a new supplier to your procurement network.",
    },
    "/employee": {
      title: "Employees Diectory",
      subtitle: "Browse and manage your staff directory.",
    },
    "/employee/all": {
      title: "Employees List",
      subtitle: "Browse and manage your entire staff catalog.",
    },
    "/employee/add": {
      title: "Create Employee",
      subtitle: "Onboard and register a new staff member to the organization.",
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
      title: "Update Profile",
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
      title: "Customers List",
      subtitle: "Browse customer balances, credit limits, and outstanding receivables.",
    },
    "/customers/add": {
      title: "Create Customer",
      subtitle: "Register and onboard a new customer profile in the directory.",
    },
    "/customers/drafts": {
      title: "Customer Drafts",
      subtitle: "Manage partially completed customer registrations.",
    },
  };

  if (routes[pathname]) return routes[pathname];

  // Dynamic match for Customer Profile
  if (pathname.match(/^\/customers\/[^/]+$/)) {
    return {
      title: "Customer Details",
      subtitle: "Comprehensive view of customer ledger, balance history, and info.",
    };
  }

  if (pathname.match(/^\/sales\/[^/]+$/)) {
    return {
      title: "Customer Details",
      subtitle: "Comprehensive view of customer ledger, balance history, and info.",
    };
  }
  // Dynamic match for Edit Customer
  if (pathname.match(/^\/customers\/[^/]+\/edit$/)) {
    return {
      title: "Edit Customer",
      subtitle: "Modify and update customer profile details.",
    };
  }

  // Dynamic match for Employee Profile
  if (pathname.match(/^\/employee\/[^/]+$/)) {
    return {
      title: "Employee Details",
      subtitle: "Comprehensive view of staff credentials, history, and status.",
    };
  }

  // Dynamic match for Edit Employee
  if (pathname.match(/^\/employee\/[^/]+\/edit$/)) {
    return {
      title: "Edit Employee",
      subtitle: "Modify and update staff settings.",
    };
  }

  // Dynamic match for Supplier Profile
  if (pathname.match(/^\/supplier\/[^/]+$/)) {
    return {
      title: "Supplier Details",
      subtitle: "Comprehensive view of supplier ledger, purchases, and logs.",
    };
  }

  // Dynamic match for Edit Supplier
  if (pathname.match(/^\/supplier\/[^/]+\/edit$/)) {
    return {
      title: "Edit Supplier",
      subtitle: "Modify and update existing vendor details.",
    };
  }

  // Dynamic match for Product Profile
  if (pathname.match(/^\/product\/[^/]+$/)) {
    return {
      title: "Product Details",
      subtitle: "Comprehensive view of product specifications, variants, and logs.",
    };
  }

  // Dynamic match for Edit Product
  if (pathname.match(/^\/product\/[^/]+\/edit$/)) {
    return {
      title: "Edit Product",
      subtitle: "Modify and update existing product details.",
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

const isDetailsRoute = (pathname: string) => {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 2) {
    const [entity, id] = parts;
    const standardActions = ["add", "drafts", "all", "history"];
    if (["customers", "employee", "supplier", "product", "sales", "stock-movement", "stock-adjustment"].includes(entity)) {
      return !standardActions.includes(id);
    }
  }
  
  if (parts.length >= 2 && parts[1] === "detail") {
    return true;
  }
  
  if (pathname.startsWith("/purchase/detail/") || pathname.startsWith("/product/detail/")) {
    return true;
  }

  const staticDetails = ["/purchase/detail", "/product/detail", "/supplier/detail"];
  return staticDetails.includes(pathname);
};

const MainLayout = () => {
  const location = useLocation();
  const { actions, bottomActions } = useHeader();
  const isStorePage =
    location.pathname === "/digital-store" ||
    location.pathname === "/digital-store/profile" ||
    location.pathname === "/";

  const isBillingPage = location.pathname === "/billing";
  const isCleanMode = new URLSearchParams(location.search).get("mode") === "clean";
  const hideNav = isCleanMode;

  const listPaths = [
    "/billing",
    "/sales",
    "/purchase-history",
    "/purchase",
    "/supplier",
    "/supplier/all",
    "/employee",
    "/employee/all",
    "/inventory",
    "/stock-movement",
    "/customers-Summary",
    "/product",
    "/product/all",
    "/orders",
    "/po-grn"
  ];
  const isListPage = listPaths.includes(location.pathname);

  const isDetails = isDetailsRoute(location.pathname);
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
          <div className={`flex-1 flex flex-col min-h-0 overflow-hidden relative ${hideNav ? (isBillingPage ? "p-0" : "p-2.5 md:p-4") : isStorePage ? "p-0 pb-20 md:pb-0" : "p-1.5 md:p-2 lg:p-2.5"} ${!bottomActions && "pb-20 md:pb-0"}`}>

            {!isStorePage && (
              <div className="">
                {!hideNav && !isDetails && <Breadcrumb />}

                {!isDetails && (
                  <div className="">
                    <Title title={title} subtitle={subtitle} icon={icon} actions={actions} />
                  </div>
                )}
              </div>
            )}

            {isListPage || isDetails ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <Outlet />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar mobile-scroll pb-16 md:pb-6">
                <Outlet />
              </div>
            )}
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
