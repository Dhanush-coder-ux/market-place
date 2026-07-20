import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Breadcrumb from "../common/BreadCrums";
import { Navbar } from "./Navbar";
import Sidebar from "./Sidebar";
import Title from "../common/Title"
import { sidebarLinks } from "@/utils/constants";
import { useHeader } from "@/context/HeaderContext";
import MobileBottomBar from "./MobileBottomBar";

const getPageHeaderInfo = (pathname: string) => {
  const routes: Record<string, { title: string; icon?: any }> = {
    "/": {
      title: "Dashboard",
    },
    "/sales": {
      title: "Sales List",
    },
    "/sales/detail": {
      title: "Sale Detail",
    },
    "/product": {
      title: "Product Detail",
    },
    "/product/detail": {
      title: "Product Detail",
    },
    "/product/add": {
      title: "Add Product",
    },
    "/product/all": {
      title: "Products List",
    },
    "/product/drafts": {
      title: "Product Drafts",
    },
    "/purchase-order/add": {
      title: "Add Purchase Order",
    },
    "/po-grn": {
      title: "Purchase Order List",
    },
    "/po-grn/add": {
      title: "Add Purchase Order",
    },
    "/po-grn/update": {
      title: "Update Purchase Order",
    },
    "/purchase-history": {
      title: "Purchase History",
    },
    "/production-entry/add": {
      title: "Production Entry",
    },
    "/purchase": {
      title: "Purchase Detail",
    },
    "/purchase/detail": {
      title: "Purchase Detail",
    },
    "/purchase/add": {
      title: "Add Purchase",
    },
    "/supplier/all": {
      title: "Suppliers List",
    },
    "/supplier": {
      title: "Supplier Details",
    },
    "/supplier/detail": {
      title: "Supplier Details",
    },
    "/supplier/add": {
      title: "Add Suppliers",
    },
    "/employee": {
      title: "Employee Details",
    },
    "/employee/all": {
      title: "Employee List",
    },
    "/employee/add": {
      title: "Add Employee",
    },
    "/inventory": {
      title: "Stock Levels",
    },
    "/stock-movement": {
      title: "Stock Movements",
    },
    "/stock-adjustment": {
      title: "Stock Adjustments",
    },
    "/billing": {
      title: "Billing",
    },
    "/orders": {
      title: "Online Orders",
    },
    "/settings": {
      title: "Settings",
    },
    "/settings/add": {
      title: "Update Profile",
    },
    "/create-shop": {
      title: "Create Shop",
    },
    "/setup-digital-store": {
      title: "Setup Digital Store",
    },
    "/profile": {
      title: "Digital Storefront",
    },
    "/customers": {
      title: "Customer Details",
    },
    "/customers/all": {
      title: "Customers List",
    },
    "/customers-Summary": {
      title: "Customers List",
    },
    "/customers/add": {
      title: "Add Customer",
    },
    "/customers/drafts": {
      title: "Customer Drafts",
    },
  };

  if (routes[pathname]) return routes[pathname];

  // Dynamic match for Customer Profile
  if (pathname.match(/^\/customers\/[^/]+$/)) {
    return { title: "Customer Details" };
  }

  if (pathname.match(/^\/sales\/[^/]+$/)) {
    return { title: "Sale Detail" };
  }
  // Dynamic match for Edit Customer
  if (pathname.match(/^\/customers\/[^/]+\/edit$/)) {
    return { title: "Edit Customer" };
  }

  // Dynamic match for Employee Profile
  if (pathname.match(/^\/employee\/[^/]+$/)) {
    return { title: "Employee Details" };
  }

  // Dynamic match for Edit Employee
  if (pathname.match(/^\/employee\/[^/]+\/edit$/)) {
    return { title: "Edit Employee" };
  }

  // Dynamic match for Supplier Profile
  if (pathname.match(/^\/supplier\/[^/]+$/)) {
    return { title: "Supplier Details" };
  }

  // Dynamic match for Edit Supplier
  if (pathname.match(/^\/supplier\/[^/]+\/edit$/)) {
    return { title: "Edit Supplier" };
  }

  // Dynamic match for Product Profile
  if (pathname.match(/^\/product\/[^/]+$/)) {
    return { title: "Product Detail" };
  }

  // Dynamic match for Edit Product
  if (pathname.match(/^\/product\/[^/]+\/edit$/)) {
    return { title: "Edit Product" };
  }

  // Dynamic match for Edit Purchase
  if (pathname.match(/^\/purchase\/edit\/[^/]+$/)) {
    return { title: "Edit Purchase" };
  }

  // Drafts Pages
  if (pathname === "/supplier/drafts") {
    return { title: "Vendor Drafts" };
  }

  if (pathname === "/employee/drafts") {
    return { title: "Employee Drafts" };
  }

  return routes[pathname] || {
    title: pathname.split("/").pop()?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Home",
  };
};

const isDetailsRoute = (pathname: string) => {
  // Explicitly ignore Search pages that happen to use "detail" in the URL
  if (pathname === "/sales/detail" || pathname === "/purchase/detail" || pathname === "/product/detail" || pathname === "/supplier/detail") {
    return false;
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 2) {
    const [entity, id] = parts;
    const standardActions = ["add", "drafts", "all", "history", "detail"];
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

  if (pathname.startsWith("/purchase/detail/") || pathname.startsWith("/product/detail/")) {
    return true;
  }

  return false;
};

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { actions, bottomActions } = useHeader();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const sessionId = localStorage.getItem("session_id");

    if (!token && !sessionId) {
      navigate("/login");
    } else if (!token && sessionId && location.pathname !== "/shop-select" && location.pathname !== "/create-shop") {
      navigate("/shop-select");
    }
  }, [location.pathname, navigate]);

  const isStorePage =
    location.pathname === "/digital-store" ||
    location.pathname === "/profile" ||
    location.pathname === "/";

  const isBillingPage = location.pathname === "/billing";
  const isCleanMode = new URLSearchParams(location.search).get("mode") === "clean";
  const hideNav = isCleanMode || isBillingPage;

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
  const { title, icon } = getPageHeaderInfo(location.pathname);

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
          <div className={`flex-1 flex flex-col min-h-0 overflow-hidden relative ${hideNav ? (isBillingPage ? "p-0" : "p-2.5 md:p-4") : isStorePage ? "p-0 pb-20 md:pb-0" : isBillingPage ? "pl-6 pr-3.5 pt-4 pb-2 md:pl-8 lg:pl-10 lg:pr-6" : "p-1.5 md:p-2 lg:p-2.5"} ${!bottomActions && "pb-20 md:pb-0"}`}>

            {!isStorePage && (
              <div className="">
                {!hideNav && !isDetails && <Breadcrumb />}

                {!hideNav && !isDetails && (
                  <div className={isBillingPage ? "pl-3.5 pt-1" : ""}>
                    <Title title={title} icon={icon} actions={actions} />
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
            <div className="flex-shrink-0 h-16 md:h-12 flex items-center justify-between px-4 md:px-8 gap-3
              fixed bottom-[calc(60px+env(safe-area-inset-bottom))] left-0 right-0 
              md:relative md:bottom-0
              bg-white/95 backdrop-mobile
              border-t border-slate-200/80
              shadow-[0_-8px_30px_rgba(0,0,0,0.08)]
              z-[65] md:animate-in md:slide-in-from-bottom-full md:duration-500
              gpu-layer">
              <div className="flex items-center gap-2 w-full justify-end">
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
