import {
  Users, Search, Filter, Trash2, Edit3,
  Eye, Bookmark, Banknote, Wallet, ExternalLink
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useHeader } from "@/context/HeaderContext";
import { StatCard } from "@/components/common/StatsCard";

import { GradientButton } from "@/components/ui/GradientButton";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { SHOP_ID } from "@/services/endpoints";
import type { CustomerRecord } from "@/types/api";
import { useToast } from "@/context/ToastContext";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ColumnPicker } from "@/components/common/ColumnPicker";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";
import { useEffect, useMemo, useState } from "react";
import { RecordPaymentModal } from "@/features/customer/components/RecordPaymentModal";


export default function CustomerBalanceSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCleanMode = new URLSearchParams(location.search).get("mode") === "clean";

  const handleOpenNewTab = () => {
    window.open(`${window.location.pathname}?mode=clean`, "_blank", "noopener,noreferrer");
  };

  const { setActions } = useHeader();
  const { customer } = useBusinessApi();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerRecord | null>(null);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<CustomerRecord | null>(null);

  // Dynamic Column State
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem("customer_table_columns");
    return saved ? JSON.parse(saved) : ["email", "phone", "customer_type"];
  });

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        {!isCleanMode && (
          <button
            onClick={handleOpenNewTab}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-sm shrink-0"
            title="Open in New Tab"
          >
            <ExternalLink size={13} />
          </button>
        )}
        <button
          onClick={() => navigate("/customers/drafts")}
          className="h-8 px-3 rounded-md border border-slate-200 text-slate-600 font-medium text-[12px] bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <Bookmark size={13} />
          Drafts
        </button>
        <GradientButton path="/customers/add" className="h-8 flex items-center px-4 text-[12px] rounded-md">
          + Add Customer
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate, isCleanMode]);

  useEffect(() => {
    const params: Record<string, string> = { limit: "100", offset: "1" };
    if (searchTerm) params.q = searchTerm;
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;

    customer.getCustomersByShopId(SHOP_ID, params).then((res) => {
      if (res) {
        let actualData = res.data;
        if (actualData && typeof actualData === 'object' && !Array.isArray(actualData) && 'datas' in actualData) {
          actualData = actualData.datas;
        }
        const raw: CustomerRecord[] = Array.isArray(actualData) ? actualData : [actualData];
        const data: CustomerRecord[] = raw.filter(Boolean); // guard against null entries from API
        setCustomers(data);

        // Detect unique keys from both root and datas field
        const keys = new Set<string>();
        data.forEach((c: any) => {
          if (!c) return;
          // Root level keys from schema
          const rootKeys = ["email", "mobile_number", "outstanding", "credit_limit", "can_have_credit", "ui_id", "created_at", "updated_at"];
          rootKeys.forEach(k => keys.add(k));

          // Nested datas keys
          if (c.datas) {
            Object.keys(c.datas).forEach(k => {
              if (k !== "address") { // address is usually too long for a table cell
                keys.add(k);
              }
            });
          }
        });
        setAvailableKeys(Array.from(keys).sort());
      }
    });
  }, [refreshKey, searchTerm, fromDate, toDate]);

  const handleDelete = async () => {
    if (!customerToDelete) return;
    try {
      await customer.deleteCustomer(SHOP_ID, customerToDelete.id);
      showToast("Customer deleted successfully", "success");
      setRefreshKey(prev => prev + 1);
    } catch (_err) {
      showToast("Failed to delete customer", "error");
    } finally {
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };



  const stats = useMemo(() => {
    let creditCount = 0;
    let outstanding = 0;
    let credit = 0;
    customers.forEach(c => {
      if (!c) return;
      if (c.can_have_credit ?? c.datas?.can_have_credit ?? false) creditCount++;
      outstanding += Number(c.outstanding_infos?.amount ?? c.outstanding ?? c.datas?.outstanding_balance ?? 0);
      credit += Number((c as any).credit_infos?.limit ?? c.credit_limit ?? c.datas?.credit_limit ?? 0);
    });
    return { active: creditCount, outstanding, credit };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (!c) return false;
      const name = (c.name || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const mobile = (c.mobile_number || "").toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase()) ||
        email.includes(searchTerm.toLowerCase()) ||
        mobile.includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [customers, searchTerm]);

  const activeFilters = [
    fromDate,
    toDate
  ].filter(Boolean).length;

  return (
    <div className="flex-1 flex flex-col min-h-0 font-sans w-full overflow-hidden relative">
      {/* Stats Section */}
      {!isCleanMode && (
        <div className="flex flex-nowrap overflow-x-auto custom-scrollbar gap-3 pb-1 -mx-2 px-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0 touch-pan-x">
          <StatCard
            label="Total Customers"
            value={customers.length}
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            className="flex-1"
          />
          <StatCard
            label="Credit Customers"
            value={stats.active}
            icon={Users}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            className="flex-1"
          />
          <StatCard
            label="Outstanding Balance"
            value={stats.outstanding.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            prefix="₹"
            icon={Banknote}
            iconBg="bg-rose-50"
            iconColor="text-rose-500"
            className="flex-1"
          />
          <StatCard
            label="Total Credit Limit"
            value={stats.credit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            prefix="₹"
            icon={Wallet}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
            className="flex-1"
          />
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-lg p-2.5 px-3.5 flex flex-nowrap items-center gap-2 shadow-sm overflow-x-auto scrollbar-none mt-2">
        <div className="relative w-80 shrink-0">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search customer…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
          />
        </div>
        

        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className={`h-8 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0 ${
            activeFilters > 0
              ? "border-blue-200 text-blue-600 bg-blue-50"
              : "border-slate-200 text-slate-650 bg-white hover:bg-slate-50"
          }`}
          title="Filters"
        >
          <Filter size={13} />
          Filters
          {activeFilters > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-[9px] font-black">
              {activeFilters}
            </span>
          )}
        </button>

        <ColumnPicker
          availableKeys={availableKeys}
          selectedKeys={selectedKeys}
          onApply={setSelectedKeys}
          storageKey="customer_table_columns"
          className="h-8 px-3 rounded-md border border-slate-200 text-slate-650 bg-white hover:bg-slate-50 active:scale-95 transition-all text-xs font-semibold shadow-sm shrink-0 flex items-center justify-center gap-1.5"
        />

        <div className="flex-1" />
      </div>

      <RightSidebarFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => {}}
        onClear={() => { setFromDate(""); setToDate(""); }}
        title="Customer Filters"
      >
        <div className="space-y-4">

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

      <div className="bg-white rounded-b-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0 mt-2">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 pf-scroll">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm shadow-sm">
              <tr className="text-slate-400 text-[10px] font-bold border-b border-slate-100">
                <th className="px-6 py-4 whitespace-nowrap min-w-[200px]">Customer</th>
                {selectedKeys.map(key => (
                  <th key={key} className="px-6 py-4 whitespace-nowrap capitalize">{key.replace(/_/g, ' ')}</th>
                ))}
                <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCustomers.length === 0 ? (
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
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-100">
                          {String(c.name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 tracking-tight">
                            {String(c.name || "Untitled")}
                          </p>
                          {((c as any).contact_infos?.mobile_number || c.mobile_number || (c as any).contact_infos?.email || c.email) ? (
                            <div className="flex flex-col gap-0">
                              {((c as any).contact_infos?.mobile_number || c.mobile_number) && (
                                <p className="text-[11px] font-semibold text-slate-400">
                                  {String((c as any).contact_infos?.mobile_number || c.mobile_number)}
                                </p>
                              )}
                              {((c as any).contact_infos?.email || c.email) && (
                                <p className="text-[11px] font-medium text-slate-400 truncate max-w-[180px]">
                                  {String((c as any).contact_infos?.email || c.email)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] font-medium text-slate-300">—</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {selectedKeys.map(key => {
                      // Map column key aliases to actual data fields
                      let value: any;
                      if (key === 'phone' || key === 'mobile_number') {
                        value = (c as any).contact_infos?.mobile_number ?? c.mobile_number ?? c.datas?.mobile_number;
                      } else if (key === 'email') {
                        value = (c as any).contact_infos?.email ?? c.email ?? c.datas?.email;
                      } else if (key === 'credit_limit') {
                        value = (c as any).credit_infos?.limit ?? c.credit_limit ?? c.datas?.credit_limit;
                      } else {
                        value = (c as any).datas?.[key] ?? (c as any)[key];
                      }

                      let displayValue = value != null && value !== '' ? String(value) : '—';

                      if (key === 'can_have_credit') {
                        const hasCred = value ?? false;
                        return (
                          <td key={key} className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              hasCred
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${hasCred ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              {hasCred ? 'Yes' : 'No'}
                            </span>
                          </td>
                        );
                      } else if (key === 'outstanding') {
                        value = (c as any).outstanding_infos?.amount ?? c.outstanding ?? c.datas?.outstanding_balance ?? 0;
                        displayValue = `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      } else if ((key === 'created_at' || key === 'updated_at') && value) {
                        displayValue = new Date(value).toLocaleString("en-IN", {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        });
                      } else if ((key === 'outstanding' || key === 'credit_limit' || key === 'outstanding_balance') && value != null) {
                        displayValue = `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      }

                      return (
                        <td key={key} className="px-6 py-4 whitespace-nowrap">
                          <p className={`text-[12px] font-semibold tracking-tight ${key === 'customer_type' || key === 'payment_cycle' ? 'text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-md' : 'text-slate-600'}`}>
                            {displayValue}
                          </p>
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedCustomerForPayment(c); setShowPaymentModal(true); }}
                          disabled={Number(c.outstanding_infos?.amount ?? c.outstanding ?? c.datas?.outstanding_balance ?? 0) <= 0}
                          className={`p-2 rounded-lg transition-all shadow-sm ${
                            Number(c.outstanding_infos?.amount ?? c.outstanding ?? c.datas?.outstanding_balance ?? 0) > 0 
                              ? "active:scale-95 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50" 
                              : "text-slate-300 bg-slate-50 cursor-not-allowed"
                          }`}
                          title={Number(c.outstanding_infos?.amount ?? c.outstanding ?? c.datas?.outstanding_balance ?? 0) > 0 ? "Record Payment" : "No Outstanding"}
                        >
                          <Banknote size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}`); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-sm active:scale-95"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}/edit`); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-sm active:scale-95"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setCustomerToDelete(c); setIsDeleteDialogOpen(true); }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all shadow-sm active:scale-95"
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
        description={`Are you sure you want to remove ${customerToDelete?.name}? This action cannot be undone.`}
        confirmText="Remove Customer"
        type="danger"
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        show={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        customer={selectedCustomerForPayment}
        onSuccess={() => {
          setShowPaymentModal(false);
          setRefreshKey(prev => prev + 1);
        }}
      />
    </div>
  );
}

