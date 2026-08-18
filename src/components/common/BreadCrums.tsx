import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useHeader } from "@/context/HeaderContext";

const Breadcrumb = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const paths = location.pathname.split("/").filter(Boolean);

  // Full-path overrides for compound paths (checked before segment-level)
  const fullPathLabels: Record<string, string> = {
    "/product/all": "Products List",
    "/product/add": "Add Product",
    "/product/drafts": "Product Drafts",
    "/supplier/all": "Suppliers List",
    "/supplier/add": "Add Suppliers",
    "/supplier/drafts": "Vendor Drafts",
    "/customers/all": "Customers List",
    "/customers/add": "Add Customer",
    "/customers/drafts": "Customer Drafts",
    "/employee/all": "Employee List",
    "/employee/add": "Add Employee",
    "/employee/drafts": "Employee Drafts",
    "/purchase/add": "Add Purchase",
    "/purchase/detail": "Purchase Detail",
    "/purchase-history": "Purchase History",
    "/po-grn": "Purchase Order List",
    "/po-grn/add": "Add Purchase Order",
    "/po-grn/update": "Update Purchase Order",
    "/production-entry/add": "Production Entry",
    "/stock-movement": "Stock Movements",
    "/stock-adjustment": "Stock Adjustments",
    "/purchase-order/add": "Add Purchase Order",
  };

  // Segment-level label overrides (for path portions)
  const formatSegment = (segment: string) => {
    const segmentLabels: Record<string, string> = {
      profile: "Digital Storefront",
      inventory: "Stock Levels",
      sales: "Sales List",
      billing: "Billing",
      customers: "Customers",
      supplier: "Suppliers",
      employee: "Employees",
      "po-grn": "Purchase Order List",
      "purchase-history": "Purchase History",
      "stock-movement": "Stock Movements",
      "stock-adjustment": "Stock Adjustments",
      orders: "Online Orders",
      product: "Products",
      purchase: "Purchases",
      all: "List",
      add: "Add",
      drafts: "Drafts",
      detail: "Detail",
      settings: "Settings",
    };
    return segmentLabels[segment.toLowerCase()] || segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const { breadcrumbOverride } = useHeader();

  // Get the final (current page) label — use full-path override if available
  const getLastLabel = () => {
    if (breadcrumbOverride) return breadcrumbOverride;
    const fullPath = "/" + paths.join("/");
    if (fullPathLabels[fullPath]) return fullPathLabels[fullPath];
    return formatSegment(paths[paths.length - 1] || "");
  };

  return (
    <nav className="flex items-center gap-2.5 text-[11px] font-medium text-slate-400 mb-2 overflow-x-auto scrollbar-hide py-1">
      {/* Home Link */}
      <button 
        onClick={() => navigate("/")}
        className="flex items-center gap-1.5 hover:text-blue-600 transition-colors shrink-0"
      >
        <Home size={12} />
        <span className="hidden sm:inline">Dashboard</span>
      </button>

      {paths.length > 0 && <ChevronRight size={10} className="shrink-0 opacity-40" />}

      {/* Dedicated Back Link if we are not at home */}
      {paths.length > 0 && (
        <>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-sm text-[10px] text-slate-500 font-bold"
          >
            <ChevronLeft size={10} />
            Back
          </button>
          <ChevronRight size={10} className="shrink-0 opacity-40" />
        </>
      )}

      {/* Current Path — only show the last (current) segment */}
      {paths.length > 0 && (
        <span className="text-blue-600 font-bold whitespace-nowrap">
          {getLastLabel()}
        </span>
      )}
    </nav>
  );
};

export default Breadcrumb;
