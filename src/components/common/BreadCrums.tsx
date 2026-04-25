import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const Breadcrumb = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const paths = location.pathname.split("/").filter(Boolean);

  // Helper to format path segment into user-friendly titles
  const formatSegment = (segment: string) => {
    const customLabels: Record<string, string> = {
      profile: "Settings",
      inventory: "Inventory",
      sales: "Sales",
      billing: "Billing",
      customers: "Customers",
      supplier: "Suppliers",
      employee: "Employees",
      "po-grn": "Purchase Orders",
    };
    return customLabels[segment.toLowerCase()] || segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <nav className="flex items-center gap-2.5 text-[11px] font-medium text-slate-400 mb-3 overflow-x-auto scrollbar-hide py-1">
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
            BACK
          </button>
          <ChevronRight size={10} className="shrink-0 opacity-40" />
        </>
      )}

      {/* Current Path */}
      {paths.map((path, index) => {
        const isLast = index === paths.length - 1;
        const href = "/" + paths.slice(0, index + 1).join("/");

        return (
          <div key={href} className="flex items-center gap-2.5">
            {isLast ? (
              <span className="text-blue-600 font-bold whitespace-nowrap uppercase tracking-wider">
                {formatSegment(path)}
              </span>
            ) : (
              <>
                <button
                  onClick={() => navigate(href)}
                  className="hover:text-blue-600 transition-colors whitespace-nowrap"
                >
                  {formatSegment(path)}
                </button>
                <ChevronRight size={10} className="shrink-0 opacity-40" />
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
