import { useState, useEffect, useMemo } from "react";
import { Search, Trash2, X, Edit, Bookmark, Users, Building2, Phone, Eye, ExternalLink } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { useNavigate, useLocation } from "react-router-dom";
import Loader from "@/components/common/Loader";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import type { SupplierRecord } from "@/types/api";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ColumnPicker } from "@/components/common/ColumnPicker";
import { StatCard } from "@/components/common/StatsCard";
import { useQuickCreate } from "@/features/common/QuickCreate/QuickCreateContext";


// Human-readable labels for every possible dynamic column key
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
};

const Supplier = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCleanMode = new URLSearchParams(location.search).get("mode") === "clean";

  const { getData, deleteData, loading, error, clearError } = useApi();
  const { setActions } = useHeader();
  const { showToast } = useToast();
  const { openQuickCreate } = useQuickCreate();

  const handleOpenNewTab = () => {
    window.open(`${window.location.pathname}?mode=clean`, "_blank", "noopener,noreferrer");
  };

  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierRecord | null>(null);

  // Dynamic Column State
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('supplier_table_columns');
    return saved ? JSON.parse(saved) : ["contact_person", "contact_email", "contact_mobile", "email", "mobile_number", "city"];
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
    const params: Record<string, string> = { limit: "50", offset: "1" };
    if (searchTerm) params.q = searchTerm;

    getData(`${ENDPOINTS.SUPPLIERS}/by/shop/${SHOP_ID}`, params).then((res) => {
      if (res) {
        const data: SupplierRecord[] = Array.isArray(res.data) ? res.data : [res.data];
        setSuppliers(data);

        // Detect unique keys from both root and datas field
        const keys = new Set<string>();
        data.forEach((s: any) => {
          if (!s) return;
          // Root level keys that we want in column picker
          const standardKeys = ["email", "mobile_number", "gst_no"];
          standardKeys.forEach(k => keys.add(k));

          // Map contact_info
          if (s.contact_info?.name) keys.add("contact_person");
          if (s.contact_info?.email) keys.add("contact_email");
          if (s.contact_info?.mobile_number) keys.add("contact_mobile");

          // Flatten address
          if (s.datas?.address) {
            if (s.datas.address.city) keys.add("city");
            if (s.datas.address.zipcode) keys.add("zipcode");
            if (s.datas.address.full_address) keys.add("address");
          }

          // Other data fields
          if (s.datas) {
            Object.keys(s.datas).forEach(k => {
              if (k !== "address" && k !== "internal_notes") keys.add(k);
            });
          }
        });
        const sortedKeys = Array.from(keys).sort();
        setAvailableKeys(sortedKeys);
      }
    });
  }, [refreshKey, searchTerm]);

  const handleDelete = async () => {
    if (!supplierToDelete) return;
    try {
      await deleteData(`${ENDPOINTS.SUPPLIERS}/${SHOP_ID}/${supplierToDelete.id}`);
      showToast("Supplier deleted successfully", "success");
      setRefreshKey(prev => prev + 1);
    } catch {
      showToast("Failed to delete supplier", "error");
    } finally {
      setIsDeleteDialogOpen(false);
      setSupplierToDelete(null);
    }
  };

  const stats = useMemo(() => {
    let active = 0;
    let contacts = 0;
    suppliers.forEach(s => {
      if (!s) return;
      if (s.is_active ?? s.datas?.is_active ?? true) active++;
      if (s.mobile_number || s.contact_info?.mobile_number || s.datas?.phone || s.email) contacts++;
    });
    return { active, contacts };
  }, [suppliers]);

  return (
    <div className="flex-1 flex flex-col min-h-0 font-sans w-full overflow-hidden relative">

      {/* Stats Section */}
      {!isCleanMode && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          <StatCard
            icon={Building2}
            label="Total Suppliers"
            value={suppliers.length.toString()}
            iconBg="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={Users}
            label="Active Partners"
            value={stats.active.toString()}
            iconBg="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            icon={Phone}
            label="Support Contacts"
            value={stats.contacts.toString()}
            iconBg="bg-amber-50 text-amber-600"
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
        <ColumnPicker
          availableKeys={availableKeys}
          selectedKeys={selectedKeys}
          onApply={setSelectedKeys}
          storageKey="supplier_table_columns"
          labelMap={COLUMN_LABELS}
          className="h-8 px-3 rounded-md border border-slate-200 text-slate-650 bg-white hover:bg-slate-50 active:scale-95 transition-all text-xs font-semibold shadow-sm shrink-0 flex items-center justify-center gap-1.5"
        />
      </div>

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
              <tr className="text-slate-400 text-[10px] font-bold  tracking-[0.15em] border-b border-slate-100">
                <th className="px-6 py-5 whitespace-nowrap min-w-[200px]">Supplier Details</th>
                {selectedKeys.map(key => (
                  <th key={key} className="px-6 py-5 whitespace-nowrap">
                    {COLUMN_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </th>
                ))}
                <th className="px-6 py-5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={selectedKeys.length + 2} className="py-20 text-center"><Loader /></td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={selectedKeys.length + 2} className="py-20 text-center text-slate-400 font-medium italic">No suppliers matching your filters.</td>
                </tr>
              ) : (
                suppliers.map((sup) => {
                  if (!sup) return null;
                  return (
                    <tr
                      key={sup.id}
                      className="group md:hover:bg-blue-50/30 md:transition-all cursor-pointer"
                      onClick={() => navigate(`/supplier/${sup.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-blue-100">
                            {(String(sup.name || 'S')).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700 tracking-tight">{String(sup.name)}</p>
                            <p className="text-[11px] font-semibold text-slate-400 font-mono">ID: {sup.id}</p>
                          </div>
                        </div>
                      </td>

                      {selectedKeys.map(key => {
                        let val: any = "—";

                        // Handle Specific Column Mappings
                        if (key === "contact_person") val = sup.contact_info?.name;
                        else if (key === "contact_email") val = sup.contact_info?.email;
                        else if (key === "contact_mobile") val = sup.contact_info?.mobile_number;
                        else if (key === "city") val = sup.datas?.address?.city;
                        else if (key === "zipcode") val = sup.datas?.address?.zipcode;
                        else if (key === "address") val = sup.datas?.address?.full_address;
                        else {
                          val = sup[key] ?? sup.contact_info?.[key] ?? sup.datas?.[key] ?? "—";
                        }

                        // Final safety check for any remaining objects
                        const displayVal = (val === null || val === undefined) ? "—" : (typeof val === 'object' ? JSON.stringify(val) : String(val));

                        return (
                          <td key={key} className="px-6 py-4 whitespace-nowrap">
                            <p className="text-[12px] font-semibold tracking-tight text-slate-600">
                              {displayVal}
                            </p>
                          </td>
                        );
                      })}

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/supplier/${sup.id}`); }}
                            className="p-2 text-slate-400 md:hover:text-blue-600 md:hover:bg-white rounded-lg md:transition-all shadow-sm md:active:scale-95"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/supplier/${sup.id}/edit`); }}
                            className="p-2 text-slate-400 md:hover:text-blue-600 md:hover:bg-white rounded-lg md:transition-all shadow-sm md:active:scale-95"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSupplierToDelete(sup); setIsDeleteDialogOpen(true); }}
                            className="p-2 text-slate-400 md:hover:text-rose-600 md:hover:bg-white rounded-lg md:transition-all shadow-sm md:active:scale-95"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
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
        description={`Are you sure you want to remove ${supplierToDelete?.datas?.supplier_name || 'this supplier'}? This action cannot be undone.`}
        confirmText="Remove Partner"
        type="danger"
      />
    </div>
  );
};

export default Supplier;


