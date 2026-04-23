import { 
  Users, Search, Filter, Download, Upload, Trash2, Edit3, 
  Eye, IndianRupee, CreditCard, AlertCircle, Bookmark, CheckCircle, 
  MapPin, Phone, Mail, Building2, Tag, DollarSign, Wallet
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHeader } from "@/context/HeaderContext";
import { StatCard } from "@/components/common/StatsCard";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";
import Input from "@/components/ui/Input";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import type { CustomerRecord } from "@/types/api";
import { useToast } from "@/context/ToastContext";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ColumnPicker } from "@/components/common/ColumnPicker";
import React, { useEffect, useMemo, useState } from "react";

export default function CustomerBalanceSummary() {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData, deleteData, loading } = useApi();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerRecord | null>(null);

  // Dynamic Column State
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem("customer_table_columns");
    return saved ? JSON.parse(saved) : ["email", "phone", "customer_type"];
  });

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <button 
          onClick={() => navigate("/customers/drafts")}
          className="px-4 h-10 rounded-xl border border-blue-100 text-blue-600 font-bold text-[13px] bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2"
        >
          <Bookmark size={16} />
          Saved Drafts
        </button>
        <GradientButton path="/customers/add" className="h-10 flex items-center px-4 text-[13px]">+ Add Customer</GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => {
    const params: Record<string, string> = { limit: "100", offset: "1" };
    if (searchTerm) params.q = searchTerm;
    
    getData(ENDPOINTS.CUSTOMERS, params).then((res) => {
      if (res) {
        const data: CustomerRecord[] = Array.isArray(res.data) ? res.data : [res.data];
        setCustomers(data);
        
        // Detect unique keys from both root and datas field
        const keys = new Set<string>();
        data.forEach((c: CustomerRecord) => {
          // Root level keys
          Object.keys(c).forEach(k => {
            if (!["datas", "id", "shop_id"].includes(k)) {
              keys.add(k);
            }
          });
          // Nested datas keys
          if (c.datas) {
            Object.keys(c.datas).forEach(k => {
              if (!["first_name", "last_name", "id", "shop_id", "type"].includes(k)) {
                keys.add(k);
              }
            });
          }
        });
        setAvailableKeys(Array.from(keys).sort());
      }
    });
  }, [refreshKey, searchTerm]);

  const handleDelete = async () => {
    if (!customerToDelete) return;
    try {
      await deleteData(`${ENDPOINTS.CUSTOMERS}/${SHOP_ID}/${customerToDelete.id}`);
      showToast("Customer deleted successfully", "success");
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      showToast("Failed to delete customer", "error");
    } finally {
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const name = `${c.datas?.first_name || ""} ${c.datas?.last_name || ""}`.toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase()) || 
                           String(c.datas?.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [customers, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="flex gap-x-2">
        <StatCard label="Total Customers" value={customers.length} icon={Users} className="flex-1"/>
        <StatCard label="Shop" value={SHOP_ID.slice(0, 8) + "…"} icon={IndianRupee} iconBg="bg-green-50" iconColor="text-green-600" className="flex-1"/>
        <StatCard label="API Source" value="Live" icon={AlertCircle} iconBg="bg-rose-50" iconColor="text-rose-600" className="flex-1"/>
        <StatCard label="Showing" value={filteredCustomers.length} icon={CreditCard} iconBg="bg-amber-50" iconColor="text-amber-600" className="flex-1"/>
      </div>

      <div className="bg-white p-3 rounded-t-xl border-b border-gray-200 flex flex-col sm:flex-row gap-3 justify-between items-center mt-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Input
              leftIcon={<Search size={14} className='text-gray-400'/>}
              type="text"
              placeholder="Search customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 text-sm"
            />
          </div>
          <ColumnPicker 
            availableKeys={availableKeys}
            selectedKeys={selectedKeys}
            onApply={setSelectedKeys}
            storageKey="customer_table_columns"
          />
        </div>
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <Filter className="text-slate-400" size={14} />
          <div className="scale-75 origin-right -mr-2">
            <ReusableSelect
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val)}
              options={[
                { label: "All Statuses", value: "All" },
              ]}
              placeholder="Filter"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-b-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4 whitespace-nowrap min-w-[200px]">Customer</th>
                {selectedKeys.map(key => (
                  <th key={key} className="px-6 py-4 whitespace-nowrap capitalize">{key.replace(/_/g, ' ')}</th>
                ))}
                <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={selectedKeys.length + 2} className="py-20 text-center text-slate-400 italic">Loading customers...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={selectedKeys.length + 2} className="py-20 text-center text-slate-400 italic font-medium">No customers found.</td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr 
                    key={c.id} 
                    className="group hover:bg-blue-50/30 transition-all cursor-pointer"
                    onClick={() => navigate(`/customers/${c.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-blue-100">
                          {String(c.datas?.first_name || c.datas?.company || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 tracking-tight">
                            {String(c.datas?.first_name || "")} {String(c.datas?.last_name || "")}
                          </p>
                          <p className="text-[11px] font-bold text-slate-400">
                            {String(c.datas?.phone || "No phone")}
                          </p>
                        </div>
                      </div>
                    </td>
                    {selectedKeys.map(key => (
                      <td key={key} className="px-6 py-4 whitespace-nowrap">
                        <p className={`text-[12px] font-bold tracking-tight ${key === 'customer_type' ? 'text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-md' : 'text-slate-600'}`}>
                          {String(c.datas?.[key] ?? c[key] ?? "—")}
                        </p>
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}`); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}/edit`); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCustomerToDelete(c); setIsDeleteDialogOpen(true); }}
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
        title="Remove Customer"
        description={`Are you sure you want to remove ${customerToDelete?.datas?.first_name}? This action cannot be undone.`}
        confirmText="Remove Customer"
        type="danger"
      />
    </div>
  );
}
