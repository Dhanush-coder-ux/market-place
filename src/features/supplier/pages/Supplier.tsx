import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Bookmark, Building2, Phone, ExternalLink, Filter, ChevronRight, Eye, Pencil, Trash2, MoreVertical, Plus } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { useNavigate, useLocation } from "react-router-dom";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import type { SupplierRecord } from "@/types/api";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ColumnPicker } from "@/components/common/ColumnPicker";
import { StatCard } from "@/components/common/StatsCard";
import { useQuickCreate } from "@/features/common/QuickCreate/QuickCreateContext";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import ActionMenu, { ActionMenuItem } from "@/components/common/ActionMenu";
import { ReusableSelect } from "@/components/ui/ReusableSelect";


const COLUMN_LABELS: Record<string, string> = {
  contact_person:  "Contact Person Name",
  contact_email:   "Contact Person Email",
  contact_mobile:  "Contact Person Mobile No.",
  email:           "Supplier Email",
  mobile_number:   "Supplier Mobile No.",
  gst_no:          "GST No.",
  city:            "City",
  zipcode:         "ZIP Code",
  address:         "Street Address",
  current_outstanding: "Current Outstanding",
};

const SupplierRow = ({ sup, isSelected, onSelect, onEdit, onView, onDelete, selectedKeys }: any) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <tr
      className={`group transition-all cursor-pointer ${isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : "md:hover:bg-blue-50/30"}`}
      onClick={() => onSelect(sup)}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black shadow-sm transition-colors ${isSelected ? "bg-blue-500 text-white shadow-blue-100" : "bg-gradient-to-br from-blue-600 to-blue-400 text-white shadow-blue-100"}`}>
            {(String(sup.name || 'S')).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 tracking-tight">{String(sup.name)}</p>
            <p className="text-[11px] font-semibold text-slate-400 font-mono">ID: {sup.ui_id || sup.id}</p>
          </div>
        </div>
      </td>

      {selectedKeys.map((key: string) => {
        let val: any = "—";
        if (key === "email") val = sup.contact_infos?.email ?? sup.email;
        else if (key === "mobile_number") val = sup.contact_infos?.mobile_number ?? sup.mobile_number;
        else if (key === "contact_person") val = sup.contact_person_infos?.name ?? sup.contact_info?.name;
        else if (key === "contact_email") val = sup.contact_person_infos?.email ?? sup.contact_info?.email;
        else if (key === "contact_mobile") val = sup.contact_person_infos?.mobile_number ?? sup.contact_info?.mobile_number;
        else if (key === "city") val = sup.location_infos?.city ?? sup.additional_infos?.city ?? sup.datas?.address?.city;
        else if (key === "zipcode") val = sup.location_infos?.zipcode ?? sup.datas?.address?.zipcode;
        else if (key === "address") val = sup.location_infos?.full_address ?? sup.datas?.address?.full_address;
        else if (key === "current_outstanding") {
          const amount = sup.outstanding_infos?.amount || 0;
          val = `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        else {
          val = (sup as any)[key] ?? (sup.contact_person_infos as any)?.[key] ?? (sup.contact_infos as any)?.[key] ?? (sup.contact_info as any)?.[key] ?? (sup.additional_infos as any)?.[key] ?? (sup.datas as any)?.[key] ?? "—";
        }
        const displayVal = (val === null || val === undefined) ? "—" : (typeof val === 'object' ? JSON.stringify(val) : String(val));
        return (
          <td key={key} className="px-6 py-4 whitespace-nowrap">
            <p className={`text-[12px] font-semibold tracking-tight ${key === 'current_outstanding' && (sup.outstanding_infos?.amount || 0) > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
              {displayVal}
            </p>
          </td>
        );
      })}

      <td className="px-6 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50/60 border-l border-slate-100 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)] transition-colors whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-2 relative">
          <button onClick={() => onView(sup.id)} className="text-emerald-500 hover:text-emerald-600 transition-colors p-1" title="View Supplier">
            <Eye size={15} />
          </button>
          <button onClick={() => onEdit(sup.id)} className="text-amber-400 hover:text-amber-500 transition-colors p-1" title="Edit Supplier">
            <Pencil size={15} />
          </button>
          <button onClick={() => onDelete(sup)} className="text-slate-400 hover:text-red-655 transition-colors p-1" title="Delete Supplier">
            <Trash2 size={15} />
          </button>
          
          <div className="relative">
            <button ref={menuTriggerRef} onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} className="text-slate-800 hover:text-slate-900 transition-colors p-1" title="More actions">
              <MoreVertical size={15} />
            </button>
            <ActionMenu
              triggerRef={menuTriggerRef}
              open={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              width={160}
            >
              <ActionMenuItem icon={<Plus size={13} />} onClick={() => { setIsMenuOpen(false); navigate(`/purchase/add`, { state: { supplier: sup } }); }}>
                Add Purchase
              </ActionMenuItem>
            </ActionMenu>
          </div>
        </div>
      </td>
    </tr>
  );
};

const Supplier = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCleanMode = new URLSearchParams(location.search).get("mode") === "clean";

  const { getData, deleteData, loading, error, clearError } = useApi();
  const { setActions, setBottomActions } = useHeader();
  const { showToast } = useToast();
  const { openQuickCreate } = useQuickCreate();

  const handleOpenNewTab = () => {
    window.open(`${window.location.pathname}?mode=clean`, "_blank", "noopener,noreferrer");
  };

  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "All",
    type: "All",
    city: "All",
    state: "All"
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierRecord | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const activeFilters = [
    fromDate,
    toDate,
    Object.values(filters).some(v => v !== "All") ? "true" : ""
  ].filter(Boolean).length;

  // Dynamic Column State
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('supplier_table_columns');
    const defaultCols = ["contact_person", "contact_email", "contact_mobile", "email", "mobile_number", "city", "current_outstanding"];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && !parsed.includes("current_outstanding") && !localStorage.getItem("supplier_outstanding_added")) {
          parsed.push("current_outstanding");
          localStorage.setItem("supplier_outstanding_added", "true");
          localStorage.setItem('supplier_table_columns', JSON.stringify(parsed));
          return parsed;
        }
        return parsed;
      } catch (e) {
        return defaultCols;
      }
    }
    return defaultCols;
  });

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        {!isCleanMode && (
          <button
            onClick={handleOpenNewTab}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-650 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-sm shrink-0"
            title="Open in New Tab"
          >
            <ExternalLink size={13} />
          </button>
        )}
        <button
          onClick={() => navigate("/supplier/drafts")}
          className="h-8 px-3 rounded-md border border-slate-200 text-slate-650 font-medium text-[12px] bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <Bookmark size={13} />
          Drafts
        </button>
        <GradientButton
          onClick={() => navigate("/supplier/add")}
          className="h-8 flex items-center px-4 text-[12px] rounded-md"
        >
          + Add Supplier
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate, openQuickCreate, isCleanMode]);

  useEffect(() => {
    if (selectedSupplier) {
      setBottomActions(
        <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
              {(String(selectedSupplier.name || 'S')).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-800 leading-tight">{String(selectedSupplier.name)}</p>
              <p className="text-[10px] font-semibold text-slate-400 font-mono">ID: {selectedSupplier.ui_id || selectedSupplier.id?.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedSupplier(null)}
              className="h-8 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-semibold text-[11px] transition-colors"
            >
              Deselect
            </button>
            <button
              onClick={() => { setSupplierToDelete(selectedSupplier); setIsDeleteDialogOpen(true); }}
              className="h-8 px-3 rounded-md border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 font-semibold text-[11px] transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => navigate(`/supplier/${selectedSupplier.id}/edit`)}
              className="h-8 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => navigate(`/supplier/${selectedSupplier.id}`)}
              className="h-8 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors flex items-center gap-1.5"
            >
              <ChevronRight size={13} />
              View Details
            </button>
          </div>
        </div>
      );
    } else {
      setBottomActions(null);
    }
  }, [selectedSupplier, setBottomActions, navigate]);

  const [analyticsStats, setAnalyticsStats] = useState<any>(null);

  useEffect(() => {
    getData(ENDPOINTS.ANALYTICS_SUPPLIER_OVERALL, { shop_id: SHOP_ID })
      .then((res) => {
        const data = res?.data ?? res;
        if (data) {
          setAnalyticsStats({ overview: { supplier: data } });
        }
      })
      .catch(() => {});
  }, [getData]);

  const fmt = (n: number | undefined | null) => {
    if (n === undefined || n === null || isNaN(n)) return "₹0.00";
    return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    const params: Record<string, string> = { limit: "50", offset: "1" };
    if (debouncedSearch) params.q = debouncedSearch;
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    if (filters.status === "Outstanding") params.has_outstanding = "true";
    if (filters.status === "Cleared") params.has_outstanding = "false";

    getData(`${ENDPOINTS.SUPPLIERS}/by/shop/${SHOP_ID}`, params).then((res) => {
      if (res) {
        const rawData = res.data;
        const data: SupplierRecord[] = Array.isArray(rawData) ? rawData : (rawData?.datas ?? []);
        
        setSuppliers(data);

        // Detect unique keys from both root and datas field
        const keys = new Set<string>();
        data.forEach((s: any) => {
          if (!s) return;
          // Root level keys that we want in column picker
          const standardKeys = ["email", "mobile_number", "gst_no", "current_outstanding"];
          standardKeys.forEach(k => keys.add(k));

          // Map contact_infos and contact_person_infos
          if (s.contact_person_infos?.name || s.contact_info?.name) keys.add("contact_person");
          if (s.contact_person_infos?.email || s.contact_info?.email) keys.add("contact_email");
          if (s.contact_person_infos?.mobile_number || s.contact_info?.mobile_number) keys.add("contact_mobile");

          // Map location_infos
          if (s.location_infos) {
            if (s.location_infos.city || s.datas?.address?.city || s.additional_infos?.city) keys.add("city");
            if (s.location_infos.zipcode) keys.add("zipcode");
            if (s.location_infos.full_address) keys.add("address");
          } else if (s.datas?.address) {
            if (s.datas.address.city) keys.add("city");
            if (s.datas.address.zipcode) keys.add("zipcode");
            if (s.datas.address.full_address) keys.add("address");
          }

          // Other data fields
          if (s.additional_infos || s.datas) {
            const dataObj = s.additional_infos || s.datas || {};
            Object.keys(dataObj).forEach(k => {
              if (k !== "address" && k !== "internal_notes") keys.add(k);
            });
          }
        });
        const sortedKeys = Array.from(keys).sort();
        setAvailableKeys(sortedKeys);
      }
    });
  }, [refreshKey, debouncedSearch, fromDate, toDate, filters.status]);

  const types = useMemo(() => {
    const s = new Set(suppliers.map((sup: any) => sup.additional_infos?.type || sup.datas?.type).filter(Boolean));
    return ["All", ...Array.from(s)];
  }, [suppliers]);

  const cities = useMemo(() => {
    const s = new Set(suppliers.map((sup: any) => sup.additional_infos?.city || sup.datas?.address?.city || sup.location_infos?.city).filter(Boolean));
    return ["All", ...Array.from(s)];
  }, [suppliers]);

  const states = useMemo(() => {
    const s = new Set(suppliers.map((sup: any) => sup.location_infos?.state || sup.datas?.address?.state).filter(Boolean));
    return ["All", ...Array.from(s)];
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    let result = suppliers;

    if (debouncedSearch) {
      const lower = debouncedSearch.toLowerCase();
      result = result.filter((sup: any) => {
        const name = sup.name?.toLowerCase() || "";
        const id = sup.ui_id?.toLowerCase() || "";
        const email = (sup.contact_infos?.email || sup.email || "")?.toLowerCase() || "";
        const mobile = (sup.contact_infos?.mobile_number || sup.mobile_number || "")?.toLowerCase() || "";
        const contactName = (sup.contact_person_infos?.name || "")?.toLowerCase() || "";
        const gst = (sup.gst_no || "")?.toLowerCase() || "";

        return (
          name.includes(lower) ||
          id.includes(lower) ||
          email.includes(lower) ||
          mobile.includes(lower) ||
          contactName.includes(lower) ||
          gst.includes(lower)
        );
      });
    }

    if (filters.status !== "All") {
      result = result.filter((sup: any) => {
        const outstanding = sup.outstanding_infos?.amount || 0;
        if (filters.status === "Outstanding") return outstanding > 0;
        if (filters.status === "Cleared") return outstanding <= 0;
        return true;
      });
    }

    if (filters.type !== "All") {
      result = result.filter((sup: any) => {
        const type = sup.additional_infos?.type || sup.datas?.type;
        return type === filters.type;
      });
    }

    if (filters.city !== "All") {
      result = result.filter((sup: any) => {
        const city = sup.additional_infos?.city || sup.datas?.address?.city || sup.location_infos?.city;
        return city === filters.city;
      });
    }

    if (filters.state !== "All") {
      result = result.filter((sup: any) => {
        const state = sup.location_infos?.state || sup.datas?.address?.state;
        return state === filters.state;
      });
    }
    
    if (fromDate) {
      const from = new Date(fromDate).getTime();
      result = result.filter((sup: any) => {
        if (!sup.created_at) return true;
        return new Date(sup.created_at).getTime() >= from;
      });
    }
    
    if (toDate) {
      const to = new Date(toDate).getTime() + 86400000;
      result = result.filter((sup: any) => {
        if (!sup.created_at) return true;
        return new Date(sup.created_at).getTime() <= to;
      });
    }

    return result;
  }, [suppliers, debouncedSearch, filters, fromDate, toDate]);

  const handleDelete = async () => {
    if (!supplierToDelete) return;
    try {
      await deleteData(`${ENDPOINTS.SUPPLIERS}/${SHOP_ID}/${supplierToDelete.id}`);
      showToast("Supplier deleted successfully", "success");
      setRefreshKey(prev => prev + 1);
      setSelectedSupplier(null);
    } catch {
      showToast("Failed to delete supplier", "error");
    } finally {
      setIsDeleteDialogOpen(false);
      setSupplierToDelete(null);
    }
  };

  if (loading && suppliers.length === 0 && !searchTerm && !debouncedSearch) {
    return (
      <div className="flex-1 p-6">
        <SkeletonLoader variant="list" rows={8} showStats={true} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 font-sans w-full overflow-hidden relative">

      {/* Stats Section */}
      {!isCleanMode && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          <StatCard
            icon={Building2}
            label="Total Suppliers"
            value={(analyticsStats?.overview?.supplier?.total_suppliers ?? suppliers.length).toString()}
            iconBg="bg-blue-50 text-blue-600"
            onClick={() => setFilters(prev => ({ ...prev, status: "All" }))}
            className={filters.status === "All" ? "ring-2 ring-blue-400 border-transparent shadow-sm" : ""}
          />
          <StatCard
            icon={Phone}
            label="Total Outstanding"
            value={fmt(analyticsStats?.overview?.supplier?.total_outstandings ?? 0)}
            iconBg="bg-rose-50 text-rose-600"
            onClick={() => setFilters(prev => ({ ...prev, status: prev.status === "Outstanding" ? "All" : "Outstanding" }))}
            className={filters.status === "Outstanding" ? "ring-2 ring-rose-400 border-transparent shadow-sm" : ""}
          />
          <StatCard
            icon={Phone}
            label="Total Cleared"
            value={fmt(analyticsStats?.overview?.supplier?.total_cleared_amounts ?? 0)}
            iconBg="bg-emerald-50 text-emerald-600"
            onClick={() => setFilters(prev => ({ ...prev, status: prev.status === "Cleared" ? "All" : "Cleared" }))}
            className={filters.status === "Cleared" ? "ring-2 ring-emerald-400 border-transparent shadow-sm" : ""}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border border-slate-100 rounded-lg p-2.5 px-3.5 flex flex-nowrap items-center gap-2 shadow-sm overflow-x-auto scrollbar-none mt-2">
        <div className="relative w-80 shrink-0">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search supplier…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
          />
        </div>
        
        <button
          onClick={() => setIsFilterOpen(true)}
          className={`h-8 px-3 flex items-center gap-1.5 rounded-md border text-xs font-semibold transition-all active:scale-95 shrink-0 ${activeFilters > 0
            ? "border-blue-200 bg-blue-50 text-blue-600"
            : "border-slate-200 bg-white text-slate-655 hover:bg-slate-50"
            }`}
        >
          <Filter size={13} />
          Filters
          {activeFilters > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-[9px] font-black">{activeFilters}</span>
          )}
        </button>

        <ColumnPicker
          availableKeys={availableKeys}
          selectedKeys={selectedKeys}
          onApply={setSelectedKeys}
          storageKey="supplier_table_columns"
          labelMap={COLUMN_LABELS}
          className="h-8 px-3 rounded-md border border-slate-200 text-slate-650 bg-white hover:bg-slate-50 active:scale-95 transition-all text-xs font-semibold shadow-sm shrink-0 flex items-center justify-center gap-1.5"
        />
      </div>

      {/* Filter Sidebar */}
      <RightSidebarFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => setIsFilterOpen(false)}
        onClear={() => { setFromDate(""); setToDate(""); setFilters({ status: "All", type: "All", city: "All", state: "All" }); }}
        title="Supplier Filters"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setFilters(prev => ({ ...prev, status: "All" }))}
                className={`flex-1 h-9 rounded-md text-xs font-semibold border transition-all ${filters.status === "All" ? "border-slate-800 bg-slate-800 text-white" : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilters(prev => ({ ...prev, status: "Outstanding" }))}
                className={`flex-1 h-9 rounded-md text-xs font-semibold border transition-all ${filters.status === "Outstanding" ? "border-rose-500 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"}`}
              >
                Outstanding
              </button>
              <button 
                onClick={() => setFilters(prev => ({ ...prev, status: "Cleared" }))}
                className={`flex-1 h-9 rounded-md text-xs font-semibold border transition-all ${filters.status === "Cleared" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"}`}
              >
                Cleared
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Supplier Type</label>
            <ReusableSelect
              value={filters.type}
              onValueChange={(val: string) => setFilters(prev => ({ ...prev, type: val }))}
              options={types.map((t: any) => ({ label: String(t), value: String(t) }))}
              placeholder="Supplier Type"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">City</label>
            <ReusableSelect
              value={filters.city}
              onValueChange={(val: string) => setFilters(prev => ({ ...prev, city: val }))}
              options={cities.map((c: any) => ({ label: String(c), value: String(c) }))}
              placeholder="City"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">State</label>
            <ReusableSelect
              value={filters.state}
              onValueChange={(val: string) => setFilters(prev => ({ ...prev, state: val }))}
              options={states.map((s: any) => ({ label: String(s), value: String(s) }))}
              placeholder="State"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="space-y-1.5 flex-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-750 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">To</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-750 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>
      </RightSidebarFilter>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-between md:animate-in md:fade-in md:slide-in-from-top-2">
          <p className="text-sm font-semibold text-rose-600">{error}</p>
          <button onClick={clearError} className="p-1 hover:bg-rose-100 rounded-lg transition-colors text-rose-400">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white border border-slate-100 rounded-lg shadow-sm min-w-0 overflow-hidden flex flex-col flex-1 min-h-0 mt-2">
        <div className="overflow-x-auto overflow-y-auto flex-1 pf-scroll">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm shadow-sm">
              <tr className="text-slate-800 text-[10px] font-bold  tracking-[0.15em] border-b border-slate-100">
                <th className="px-6 py-5 whitespace-nowrap min-w-[200px]">Supplier Details</th>
                {selectedKeys.map(key => (
                  <th key={key} className="px-6 py-5 whitespace-nowrap">
                    {COLUMN_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </th>
                ))}
                <th className="px-6 py-5 text-right whitespace-nowrap w-24 sticky right-0 bg-slate-50 border-l border-slate-200 z-30 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-55 bg-white">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={selectedKeys.length + 2} className="py-20 text-center text-slate-400 font-medium italic">No suppliers matching your filters.</td>
                </tr>
              ) : (
                filteredSuppliers.map((sup: any) => {
                  if (!sup) return null;
                  const isSelected = selectedSupplier?.id === sup.id;
                  return (
                    <SupplierRow
                      key={sup.id}
                      sup={sup}
                      isSelected={isSelected}
                      onSelect={(s: any) => setSelectedSupplier(prev => prev?.id === s.id ? null : s)}
                      onEdit={(id: string) => navigate(`/supplier/${id}/edit`)}
                      onView={(id: string) => navigate(`/supplier/${id}`)}
                      onDelete={(s: any) => { setSupplierToDelete(s); setIsDeleteDialogOpen(true); }}
                      selectedKeys={selectedKeys}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Remove Supplier"
        description={`Are you sure you want to remove ${supplierToDelete?.name || 'this supplier'}? This action cannot be undone.`}
        confirmText="Remove Partner"
        type="danger"
      />
    </div>
  );
};

export default Supplier;


