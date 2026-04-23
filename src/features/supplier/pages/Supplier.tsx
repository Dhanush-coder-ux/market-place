import { useState, useEffect } from "react";
import { Search, Trash2, X, Edit, Bookmark, Users, Building2, Phone, Filter, Eye } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import Input from "@/components/ui/Input";
import { useNavigate } from "react-router-dom";
import Loader from "@/components/common/Loader";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS } from "@/services/endpoints";
import type { SupplierRecord } from "@/types/api";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ColumnPicker } from "@/components/common/ColumnPicker";
import { StatCard } from "@/components/common/StatsCard";


const Supplier = () => {
  const navigate = useNavigate();
  const { getData, deleteData, loading, error, clearError } = useApi();
  const { setActions } = useHeader();
  const { showToast } = useToast();

  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierRecord | null>(null);

  // Dynamic Column State
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('supplier_table_columns');
    return saved ? JSON.parse(saved) : ["contact_person", "email", "phone", "city"];
  });

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate("/supplier/drafts")}
          className="px-5 h-11 rounded-xl border border-blue-100 text-blue-600 font-bold text-[14px] bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2"
        >
          <Bookmark size={18} />
          Saved Drafts
        </button>
        <GradientButton path="/supplier/add" className="h-11 flex items-center">+ Add Supplier</GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => {
    const params: Record<string, string> = { limit: "50", offset: "1" };
    if (searchTerm) params.q = searchTerm;
    
    getData(ENDPOINTS.SUPPLIERS, params).then((res) => {
      if (res) {
        const data: SupplierRecord[] = Array.isArray(res.data) ? res.data : [res.data];
        setSuppliers(data);
        
        // Detect unique keys from both root and datas field
        const keys = new Set<string>();
        data.forEach((s: SupplierRecord) => {
          // Root level keys
          Object.keys(s).forEach(k => {
            if (!["datas", "supplier_name", "id", "shop_id"].includes(k)) {
              keys.add(k);
            }
          });
          // Nested datas keys
          if (s.datas) {
            Object.keys(s.datas).forEach(k => {
              if (!["supplier_name", "id", "shop_id", "type"].includes(k)) {
                keys.add(k);
              }
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
      await deleteData(`${ENDPOINTS.SUPPLIERS}/${supplierToDelete.id}`);
      showToast("Supplier deleted successfully", "success");
      setRefreshKey(prev => prev + 1);
    } catch {
      showToast("Failed to delete supplier", "error");
    } finally {
      setIsDeleteDialogOpen(false);
      setSupplierToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Stats Section */}
      <div className="flex gap-x-2">
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
          value={suppliers.length.toString()} 
          iconBg="bg-emerald-50 text-emerald-600"
          className="flex-1"
        />
        <StatCard 
          icon={Phone} 
          label="Support Contacts" 
          value={suppliers.filter(s => s.datas?.phone).length.toString()} 
          iconBg="bg-amber-50 text-amber-600"
          className="flex-1"
        />
      </div>

      {/* Filter & Search Section */}
      <div className="bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-full sm:w-80">
            <Input
              leftIcon={<Search size={14} className='text-gray-400'/>}
              type="text"
              placeholder="Filter by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 text-sm"
            />
          </div>
          <ColumnPicker 
            availableKeys={availableKeys}
            selectedKeys={selectedKeys}
            onApply={setSelectedKeys}
            storageKey="supplier_table_columns"
          />
        </div>

        <div className="flex items-center gap-3">
          <Input
            leftIcon={<Search size={14} className='text-gray-400'/>}
            type="text"
            placeholder="Filter by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 text-sm w-48"
          />
          <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100 transition-all shadow-sm">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <p className="text-sm font-bold text-rose-600">{error}</p>
          <button onClick={clearError} className="p-1 hover:bg-rose-100 rounded-lg transition-colors text-rose-400">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-100">
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
                suppliers.map((sup) => (
                  <tr 
                    key={sup.id} 
                    className="group hover:bg-blue-50/30 transition-all cursor-pointer"
                    onClick={() => navigate(`/supplier/${sup.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-blue-100">
                          {(String(sup.datas?.supplier_name || (sup as any).supplier_name || 'S')).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 tracking-tight">{String(sup.datas?.supplier_name || (sup as any).supplier_name)}</p>
                          <p className="text-[11px] font-bold text-slate-400 font-mono">ID: {sup.id}</p>
                        </div>
                      </div>
                    </td>
                    
                    {selectedKeys.map(key => (
                      <td key={key} className="px-6 py-4 whitespace-nowrap">
                        <p className="text-[12px] font-bold tracking-tight text-slate-600">
                          {String(sup.datas?.[key] ?? sup[key] ?? "—")}
                        </p>
                      </td>
                    ))}

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/supplier/${sup.id}`); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/supplier/${sup.id}/edit`); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSupplierToDelete(sup); setIsDeleteDialogOpen(true); }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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

