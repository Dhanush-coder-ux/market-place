import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Truck, Bookmark, Filter,
  ChevronRight, Users, Phone, Mail,
  Loader2
} from "lucide-react";
import { useHeader } from "@/context/HeaderContext";
import { GradientButton } from "@/components/ui/GradientButton";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { StatCard } from "@/components/common/StatsCard";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

const SupplierSearch = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData } = useApi();

  /* ── State ── */
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  /* ── Header Actions ── */
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/supplier/drafts")}
          className="px-4 h-8 rounded-lg border border-blue-100 text-blue-600 font-bold text-[13px] bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-1.5"
        >
          <Bookmark size={16} />
          Saved Drafts
        </button>
        <GradientButton path="/supplier/add" className="h-8 flex items-center px-4 text-[13px] shadow-md shadow-blue-200">+ Add Supplier</GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  /* ── Fetch Page ── */
  const fetchPage = useCallback(async (limit: number, offset: number, filters: any) => {
    const params: any = {
      shop_id: SHOP_ID,
      limit: limit.toString(),
      offset: offset.toString()
    };
    if (filters.search) params.q = filters.search;
    if (filters.fromDate) params.from_date = filters.fromDate;
    if (filters.toDate) params.to_date = filters.toDate;

    const res = await getData(`${ENDPOINTS.SUPPLIERS}/by/shop/${SHOP_ID}`, params);

    let fetchedStats = null;
    if (res?.data?.overall_datas) {
      fetchedStats = res.data.overall_datas;
    }

    const dataList = Array.isArray(res?.data) ? res.data : (res?.data?.datas ?? []);

    return {
      items: dataList,
      hasMore: dataList.length === limit,
      stats: fetchedStats,
      total: fetchedStats?.total_suppliers || 0
    };
  }, [getData]);

  /* ── Filters ── */
  const filters = useMemo(() => ({
    search: debouncedSearch,
    fromDate,
    toDate
  }), [debouncedSearch, fromDate, toDate]);

  const { items: suppliers, loading, loadingMore, stats: overallStats, totalCount, lastElementRef } = useInfiniteScroll({
    fetchPage,
    filters,
    limit: 20
  });

  const activeFilters = [fromDate, toDate].filter(Boolean).length;
  const clearAll = () => { setFromDate(""); setToDate(""); setSearchTerm(""); };

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-2.5 font-sans w-full overflow-hidden relative">

      {/* ── KPI Row ── */}
      {overallStats && (
        <div className="flex gap-3 pb-1 overflow-x-auto scrollbar-none">
          <StatCard
            label="Total Suppliers"
            value={overallStats.total_suppliers || 0}
            icon={<Truck size={18} />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            subValue="All"
          />
          <StatCard
            label="Contact Persons"
            value={overallStats.contact_persons || 0}
            icon={<Users size={18} />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            subValue="Registered"
          />
        </div>
      )}

      {/* ── Search & Filter Bar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-400"
          />
        </div>

        <button
          onClick={() => setIsFilterOpen(true)}
          className={`h-9 px-3 flex items-center gap-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 ${activeFilters > 0
            ? "border-blue-200 bg-blue-50 text-blue-600"
            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
        >
          <Filter size={13} />
          Filters
          {activeFilters > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-[9px] font-black">{activeFilters}</span>
          )}
        </button>

        <span className="font-mono text-[11px] font-medium text-slate-400 shrink-0">{suppliers.length} {totalCount > 0 ? `/ ${totalCount}` : ''}</span>
      </div>

      {/* ── Filter Sidebar ── */}
      <RightSidebarFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => { }}
        onClear={clearAll}
        title="Supplier Filters"
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

      {/* ── Table Card ── */}
      <div className="bg-white border border-slate-100 rounded-lg shadow-sm min-w-0 overflow-hidden flex flex-col flex-1 min-h-0 mt-1">
        <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-100">
          <table className="w-full text-left min-w-[700px]">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Supplier</th>
                <th className="py-2.5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Contact</th>
                <th className="py-2.5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">GST No.</th>
                <th className="py-2.5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Contact Person</th>
                <th className="py-2.5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Created</th>
                <th className="py-2.5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Loader2 size={20} className="animate-spin" />
                      <p className="text-sm font-medium">Loading suppliers...</p>
                    </div>
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-slate-400 font-medium">
                    No suppliers found matching your filters.
                  </td>
                </tr>
              ) : (
                suppliers.map((s: any, idx: number) => {
                  const isLast = idx === suppliers.length - 1;
                  const name = s.name || "Unknown";
                  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                  const contactInfo = s.contact_info || {};
                  const createdDate = s.created_at ? new Date(s.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

                  return (
                    <tr
                      key={s.id}
                      ref={isLast ? lastElementRef : undefined}
                      onClick={() => navigate(`/supplier/${s.id}`)}
                      className="group cursor-pointer hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-[11px] font-black shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-slate-800 truncate">{name}</p>
                            <p className="text-[10px] font-semibold text-slate-400 font-mono">{s.ui_id || s.id?.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[12px] font-semibold text-slate-600 flex items-center gap-1.5 truncate">
                            <Mail size={11} className="text-slate-400 shrink-0" />
                            {s.email || "—"}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                            <Phone size={11} className="text-slate-400 shrink-0" />
                            {s.mobile_number || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[12px] font-bold text-slate-600 font-mono">{s.gst_no || "—"}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[12px] font-semibold text-slate-600">{contactInfo.name || "—"}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold text-slate-500">{createdDate}</span>
                      </td>
                      <td className="py-3 px-4">
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Loading more indicator */}
              {loadingMore && (
                <tr>
                  <td colSpan={6} className="py-4 text-center">
                    <Loader2 size={16} className="animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupplierSearch;
