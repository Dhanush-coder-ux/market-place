import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Users, Bookmark, Filter,
  AlertCircle, CreditCard,
  Loader2, Eye, Pencil, MoreVertical, Trash2, Plus, FileUp
} from "lucide-react";
import ExcelImportModal from "@/components/common/ExcelImportModal";
import ActionMenu, { ActionMenuItem, ActionMenuDivider } from "@/components/common/ActionMenu";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import { useHeader } from "@/context/HeaderContext";
import { GradientButton } from "@/components/ui/GradientButton";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { StatCard } from "@/components/common/StatsCard";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useToast } from "@/context/ToastContext";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const CustomerList = () => {
  const navigate = useNavigate();
  const { setActions, setBottomActions } = useHeader();
  const { customer } = useBusinessApi();
  const { showToast } = useToast();

  /* ── State ── */
  const [activeKpi, _setActiveKpi] = useState("All Customers");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOutstanding, setFilterOutstanding] = useState("All");
  const [isImportOpen, setIsImportOpen] = useState(false);

  const { getData, deleteData } = useApi();
  const [analyticsStats, setAnalyticsStats] = useState<any>(null);

  useEffect(() => {
    getData(ENDPOINTS.ANALYTICS_CUSTOMER_OVERALL, { shop_id: SHOP_ID })
      .then((res) => {
        const data = res?.data ?? res;
        if (data) {
          setAnalyticsStats(data);
        }
      })
      .catch(() => {});
  }, [getData, refreshKey]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
 
  /* ── Header Actions ── */
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsImportOpen(true)}
          className="h-8 px-3 rounded-md border border-slate-200 text-slate-650 font-medium text-[12px] bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <FileUp size={13} />
          Import
        </button>
        <button
          onClick={() => navigate("/customers/drafts")}
          className="h-8 px-3 rounded-md border border-slate-200 text-slate-650 font-medium text-[12px] bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <Bookmark size={13} />
          Drafts
        </button>
        <GradientButton path="/customers/add" className="h-8 flex items-center px-4 text-[12px] rounded-md">+ Add Customer</GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  /* ── Fetch Page ── */
  const fetchPage = useCallback(async (limit: number, offset: number, _filters: any) => {
    const params: any = {
      shop_id: SHOP_ID,
      limit: limit.toString(),
      offset: offset.toString()
    };
    // We will fetch all and filter locally as per user request to not modify backend code
    // if (filters.search) params.q = filters.search;
    // if (filters.fromDate) params.from_date = filters.fromDate;
    // if (filters.toDate) params.to_date = filters.toDate;

    const res = await customer.getCustomersByShopId(SHOP_ID, params);

    let fetchedStats = null;
    if (res?.data?.overall_datas) {
      fetchedStats = res.data.overall_datas;
    }

    const dataList = Array.isArray(res?.data) ? res.data : (res?.data?.datas ?? []);

    return {
      items: dataList,
      hasMore: dataList.length === limit,
      stats: fetchedStats,
      total: fetchedStats?.total_customers || 0
    };
  }, [customer]);

  /* ── API Filters ── */
  const apiFilters = useMemo(() => ({
    refreshKey
  }), [refreshKey]);

  const { items: customers, loading, loadingMore, totalCount, lastElementRef } = useInfiniteScroll({
    fetchPage,
    filters: apiFilters,
    limit: 50
  });

  /* ── Local Filters ── */
  const filteredCustomers = useMemo(() => {
    let result = customers;

    if (activeKpi === "Outstanding Due") {
      result = result.filter((c: any) => (c.dues || 0) > 0);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((c: any) => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.ui_id && c.ui_id.toLowerCase().includes(q)) ||
        (c.contact_infos?.mobile_number && c.contact_infos.mobile_number.includes(q)) ||
        (c.contact_infos?.email && c.contact_infos.email.toLowerCase().includes(q)) ||
        (c.location_infos?.full_address && c.location_infos.full_address.toLowerCase().includes(q))
      );
    }
    
    if (fromDate) {
      const from = new Date(fromDate).getTime();
      result = result.filter((c: any) => new Date(c.created_at).getTime() >= from);
    }
    
    if (toDate) {
      const to = new Date(toDate).getTime() + 86400000;
      result = result.filter((c: any) => new Date(c.created_at).getTime() <= to);
    }
    
    if (filterOutstanding === "Outstanding") {
      result = result.filter((c: any) => (c.outstanding_infos?.amount ?? c.outstanding ?? 0) > 0);
    } else if (filterOutstanding === "Cleared") {
      result = result.filter((c: any) => (c.outstanding_infos?.amount ?? c.outstanding ?? 0) <= 0);
    }

    return result;
  }, [customers, debouncedSearch, fromDate, toDate, filterOutstanding]);

  const activeFilters = [fromDate, toDate, filterOutstanding !== "All"].filter(Boolean).length;
  const clearAll = () => { setFromDate(""); setToDate(""); setSearchTerm(""); setFilterOutstanding("All"); };

  /* ── Row Selection ── */
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const toggleSelectCustomer = (id: string) => {
    setSelectedCustomers(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedCustomers.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete these ${selectedCustomers.size} customers?`)) return;
    try {
      for (const id of Array.from(selectedCustomers)) {
        await deleteData(`${ENDPOINTS.CUSTOMERS}/${SHOP_ID}/${id}`);
      }
      showToast("Selected customers deleted successfully", "success");
      setSelectedCustomers(new Set());
      setRefreshKey(prev => prev + 1);
    } catch {
      showToast("Failed to delete some customers", "error");
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await deleteData(`${ENDPOINTS.CUSTOMERS}/${SHOP_ID}/${id}`);
      showToast("Customer deleted successfully", "success");
      setSelectedCustomers(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setRefreshKey(prev => prev + 1);
    } catch {
      showToast("Failed to delete customer", "error");
    }
  };

  useEffect(() => {
    if (selectedCustomers.size > 1) {
      setBottomActions(
        <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
              C
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-800 leading-tight">Selected {selectedCustomers.size} Customers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="h-8 px-3 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-650 font-bold text-[11px] transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              Delete All
            </button>
          </div>
        </div>
      );
    } else {
      setBottomActions(null);
    }
  }, [selectedCustomers, setBottomActions]);

  if (loading && customers.length === 0 && !searchTerm && !debouncedSearch) {
    return (
      <div className="flex-1 p-6">
        <SkeletonLoader variant="list" rows={8} showStats={true} />
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0 gap-2.5 font-sans w-full overflow-hidden relative">

      {/* ── KPI Row ── */}
      <div className="flex gap-3 pb-1 overflow-x-auto scrollbar-none">
        <StatCard
          label="All Customers"
          value={analyticsStats?.total_customers ?? customers.length}
          icon={<Users size={18} />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          subValue="All registered customers"
          onClick={() => setFilterOutstanding("All")}
          className={filterOutstanding === "All" ? "ring-2 ring-blue-400 border-transparent shadow-sm" : ""}
        />
        <StatCard
          label="Outstanding Due"
          value={String(analyticsStats?.outstanding_customers_count ?? customers.filter((c: any) => (c.outstanding_infos?.amount ?? c.outstanding ?? 0) > 0).length)}
          icon={<AlertCircle size={18} />}
          iconBg="bg-rose-50"
          iconColor="text-rose-500"
          subValue="Customers with unpaid balances"
          onClick={() => setFilterOutstanding("Outstanding")}
          className={filterOutstanding === "Outstanding" ? "ring-2 ring-rose-400 border-transparent shadow-sm" : ""}
        />
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-55 transition-all placeholder:text-slate-400"
          />
        </div>

        <button
          onClick={() => setIsFilterOpen(true)}
          className={`h-9 px-3 flex items-center gap-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 ${activeFilters > 0
            ? "border-blue-200 bg-blue-50 text-blue-600"
            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-55"
            }`}
        >
          <Filter size={13} />
          Filters
          {activeFilters > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-[9px] font-black">{activeFilters}</span>
          )}
        </button>

        <span className="font-mono text-[11px] font-medium text-slate-400 shrink-0">{filteredCustomers.length} {totalCount > 0 ? `/ ${totalCount}` : ''}</span>
      </div>

      {/* ── Filter Sidebar ── */}
      <RightSidebarFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => { }}
        onClear={clearAll}
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
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-755 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Status</label>
            <select
              value={filterOutstanding}
              onChange={e => setFilterOutstanding(e.target.value)}
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
            >
              <option value="All">All Statuses</option>
              <option value="Outstanding">Has Outstanding</option>
              <option value="Cleared">Cleared</option>
            </select>
          </div>
        </div>
      </RightSidebarFilter>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 min-w-0 overflow-hidden flex flex-col flex-1 min-h-0 mt-1">
        <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-100">
          <table className="w-full text-left min-w-[700px] border-collapse relative">
            <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_#e2e8f0]">
              <tr>
                <th className="py-3 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredCustomers.length > 0 && filteredCustomers.every((c: any) => selectedCustomers.has(c.id))}
                    onChange={() => {
                      const allSelected = filteredCustomers.length > 0 && filteredCustomers.every((c: any) => selectedCustomers.has(c.id));
                      if (allSelected) {
                        setSelectedCustomers(new Set());
                      } else {
                        setSelectedCustomers(new Set(filteredCustomers.map((c: any) => c.id)));
                      }
                    }}
                    className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                <th className="py-3 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="py-3 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="py-3 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Credit Limit</th>
                <th className="py-3 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Outstanding</th>
                <th className="py-3 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">Credit</th>
                <th className="py-3 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                <th className="py-3 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right w-24 sticky right-0 bg-white shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-slate-400 font-medium">
                    No customers found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c: any, idx: number) => {
                  const isLast = idx === filteredCustomers.length - 1;
                  const isSelected = selectedCustomers.has(c.id);
                  const name = c.name || "Unknown";

                  const outstanding = c.outstanding_infos?.amount ?? c.outstanding ?? 0;
                  const customerEmail = c.contact_infos?.email || c.email || "";
                  const customerPhone = c.contact_infos?.mobile_number || c.mobile_number || "";
                  const customerCreditLimit = c.credit_infos?.limit ?? c.credit_limit ?? 0;
                  const createdDate = c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

                  return (
                    <tr
                      key={c.id}
                      ref={isLast ? lastElementRef : undefined}
                      className={`group transition-all cursor-default ${isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-slate-50/60"}`}
                    >
                      <td className="px-4 py-4 border-b border-slate-200 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectCustomer(c.id)}
                          className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-4 border-b border-slate-200">
                        <span className="text-[11px] font-mono font-semibold text-slate-700">{c.ui_id || c.id?.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-4 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-slate-800 truncate">{name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 border-b border-slate-200">
                        <p className="text-[12px] font-semibold text-slate-600 truncate">{customerEmail || "—"}</p>
                        <p className="text-[11px] font-medium text-slate-400">{customerPhone || "—"}</p>
                      </td>
                      <td className="px-4 py-4 border-b border-slate-200 text-right">
                        <span className="text-[13px] font-bold text-slate-700 font-mono">{fmt(customerCreditLimit)}</span>
                      </td>
                      <td className="px-4 py-4 border-b border-slate-200 text-right">
                        <span className={`text-[13px] font-bold font-mono ${outstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {fmt(outstanding)}
                        </span>
                      </td>
                      <td className="px-4 py-4 border-b border-slate-200 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          c.can_have_credit
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.can_have_credit ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {c.can_have_credit ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-4 border-b border-slate-200">
                        <span className="text-[11px] font-semibold text-slate-500">{createdDate}</span>
                      </td>
                      <td className="px-4 py-4 border-b border-slate-200 text-right sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-200 z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] transition-colors whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 relative">
                          <button
                            onClick={() => navigate(`/customers/${c.id}`)}
                            className="text-emerald-500 hover:text-emerald-600 transition-colors p-1"
                            title="View Customer"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => navigate(`/customers/${c.id}/edit`)}
                            className="text-amber-400 hover:text-amber-500 transition-colors p-1"
                            title="Edit Customer"
                          >
                            <Pencil size={15} />
                          </button>
                          <div className="relative">
                            <button
                              ref={activeMenuId === c.id ? menuBtnRef : undefined}
                              onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === c.id ? null : c.id); }}
                              className="text-slate-800 hover:text-slate-900 transition-colors p-1"
                              title="More actions"
                            >
                              <MoreVertical size={15} />
                            </button>
                            <ActionMenu
                              triggerRef={menuBtnRef}
                              open={activeMenuId === c.id}
                              onClose={() => setActiveMenuId(null)}
                              width={176}
                            >
                              <ActionMenuItem icon={<CreditCard size={13} />} onClick={() => { setActiveMenuId(null); alert("Record payment initiated!"); }}>
                                Record Payment
                              </ActionMenuItem>
                              <ActionMenuItem icon={<Plus size={13} />} onClick={() => { setActiveMenuId(null); navigate(`/billing?customer_id=${c.id}`); }}>
                                Record Sale
                              </ActionMenuItem>
                              <ActionMenuDivider />
                              <ActionMenuItem icon={<Trash2 size={13} />} danger onClick={() => { setActiveMenuId(null); handleDeleteCustomer(c.id); }}>
                                Delete
                              </ActionMenuItem>
                            </ActionMenu>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Loading more indicator */}
              {loadingMore && (
                <tr>
                  <td colSpan={8} className="py-4 text-center">
                    <Loader2 size={16} className="animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* ── Excel Import Modal ── */}
      <ExcelImportModal
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => { setIsImportOpen(false); setRefreshKey(prev => prev + 1); }}
        entityType="customer"
      />
    </>
  );
};

export default CustomerList;
