import { useState, useEffect, useMemo } from "react";
import { Search, Trash2, X, Edit, Bookmark, Users, Building2, Phone, Eye } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import Input from "@/components/ui/Input";
import { useNavigate } from "react-router-dom";
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


const Supplier = () => {
  const navigate = useNavigate();
  const { getData, deleteData, loading, error, clearError } = useApi();
  const { setActions } = useHeader();
  const { showToast } = useToast();
  const { openQuickCreate } = useQuickCreate();

  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierRecord | null>(null);

  // Dynamic Column State
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('supplier_table_columns');
    return saved ? JSON.parse(saved) : ["contact_person", "email", "mobile_number", "city"];
  });

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/supplier/drafts")}
          className="px-5 h-11 rounded-lg border border-blue-100 text-blue-600 font-semibold text-[14px] bg-blue-50/50 md:hover:bg-blue-100 md:transition-all flex items-center gap-2"
        >
          <Bookmark size={18} />
          Saved Drafts
        </button>
        <GradientButton
          onClick={() => navigate("/supplier/add")}
          className="h-11 flex items-center shadow-lg shadow-blue-100"
        >
          + Add Supplier
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate, openQuickCreate]);

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
    <div className="space-y-6 md:animate-in md:fade-in md:duration-500 custom-scrollbar">

      {/* Stats Section */}
      <div className="flex flex-nowrap overflow-x-auto custom-scrollbar gap-3 pb-2 -mx-2 px-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0 touch-pan-x">
        <StatCard
          icon={Building2}
          label="Total Suppliers"
          value={suppliers.length.toString()}
          iconBg="bg-blue-50 text-blue-600"
          className="flex-1"
        />
        <StatCard
          icon={Users}
          label="Active Partners"
          value={stats.active.toString()}
          iconBg="bg-emerald-50 text-emerald-600"
          className="flex-1"
        />
        <StatCard
          icon={Phone}
          label="Support Contacts"
          value={stats.contacts.toString()}
          iconBg="bg-amber-50 text-amber-600"
          className="flex-1"
        />
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-full sm:w-80">
            <Input
              leftIcon={<Search size={14} className='text-gray-400' />}
              type="text"
              placeholder="Search supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 text-sm rounded-lg"
            />
          </div>
          <ColumnPicker
            availableKeys={availableKeys}
            selectedKeys={selectedKeys}
            onApply={setSelectedKeys}
            storageKey="supplier_table_columns"
          />
        </div>
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
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden md:transition-all md:duration-300">
        <div className="overflow-x-auto overflow-y-auto h-[calc(100vh-220px)] pf-scroll">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm shadow-sm">
              <tr className="text-slate-400 text-[10px] font-bold  tracking-[0.15em] border-b border-slate-100">
                <th className="px-6 py-5 whitespace-nowrap min-w-[200px]">Supplier Details</th>
                {selectedKeys.map(key => (
                  <th key={key} className="px-6 py-5 capitalize whitespace-nowrap">{key.replace(/_/g, ' ')}</th>
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


