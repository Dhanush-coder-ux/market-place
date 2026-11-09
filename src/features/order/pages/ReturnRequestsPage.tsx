import React, { useState, useEffect, useMemo } from "react";
import {
  RotateCcw, Clock, CheckCircle2, XCircle, Search, RefreshCw,
  Copy, Check, AlertCircle, ChevronLeft, ChevronRight, Eye,
  Inbox, Phone, X
} from "lucide-react";
import { orderApi } from "@/services/api/order";
import { getShopId, SHOP_ID } from "@/services/endpoints";
import type { ReturnRequestRecord } from "../types";
import { ReturnRequestDetailDrawer } from "../components/ReturnRequestDetailDrawer";
import SkeletonLoader from "@/components/common/SkeletonLoader";

export const ReturnRequestsPage: React.FC = () => {
  const rawId = getShopId() || localStorage.getItem("shop_id") || SHOP_ID || "";
  const currentShopId = rawId && rawId !== "string" ? rawId : "";

  const [requests, setRequests] = useState<ReturnRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "ACCEPTED" | "REJECTED">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected request for Detail Drawer
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequestRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Copy ID tooltip state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch return requests from backend
  useEffect(() => {
    if (!currentShopId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch all for current shop to get true counts and filter locally or query backend
    orderApi.getReturnRequests(currentShopId, {
      status: "ALL",
      limit: 100,
      offset: 1,
    })
      .then((res: any) => {
        let list: ReturnRequestRecord[] = [];
        if (Array.isArray(res?.data)) {
          list = res.data;
        } else if (Array.isArray(res?.data?.datas)) {
          list = res.data.datas;
        } else if (Array.isArray(res?.data?.items)) {
          list = res.data.items;
        } else if (Array.isArray(res)) {
          list = res;
        }
        setRequests(list);
      })
      .catch((err: any) => {
        console.error("Failed to fetch return requests:", err);
        setError(err?.message || "Failed to load return requests from server.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentShopId, refreshKey]);

  // Compute Summary Counts from real backend data
  const summaryCounts = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => (r.status || "").toUpperCase() === "PENDING").length,
      accepted: requests.filter((r) => (r.status || "").toUpperCase() === "ACCEPTED").length,
      rejected: requests.filter((r) => (r.status || "").toUpperCase() === "REJECTED").length,
    };
  }, [requests]);

  // Filter and search
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const s = (req.status || "").toUpperCase();
      if (statusFilter !== "ALL" && s !== statusFilter) {
        return false;
      }

      if (!searchTerm.trim()) return true;

      const q = searchTerm.toLowerCase().trim();
      const orderId = (req.order_ui_id || req.order_id || "").toLowerCase();
      const reqId = (req.id || "").toLowerCase();
      const customerName = (req.customer_name || "").toLowerCase();
      const customerPhone = (req.customer_phone || "").toLowerCase();
      const itemsMatch = (req.items || []).some((i) => (i.product_name || "").toLowerCase().includes(q));

      return (
        orderId.includes(q) ||
        reqId.includes(q) ||
        customerName.includes(q) ||
        customerPhone.includes(q) ||
        itemsMatch
      );
    });
  }, [requests, statusFilter, searchTerm]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRowClick = (req: ReturnRequestRecord) => {
    setSelectedRequest(req);
    setIsDrawerOpen(true);
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const formatDate = (raw?: string) => {
    if (!raw) return "—";
    try {
      const dt = new Date(raw);
      return dt.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return raw;
    }
  };

  const renderStatusBadge = (status: string) => {
    const s = (status || "PENDING").toUpperCase();
    if (s === "ACCEPTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} strokeWidth={2.5} />
          Accepted
        </span>
      );
    }
    if (s === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
          <XCircle size={12} strokeWidth={2.5} />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock size={12} strokeWidth={2.5} />
        Pending
      </span>
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50/60 font-sans p-4 sm:p-6 space-y-6">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
              <RotateCcw size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Return Requests
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Review and manage customer returns and exchange requests
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-amber-600" : "text-slate-500"} />
          Refresh
        </button>
      </div>

      {/* ── Summary KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Requests */}
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all shadow-xs hover:shadow-sm ${
            statusFilter === "ALL" ? "border-slate-800 ring-2 ring-slate-800/10" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Requests</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <RotateCcw size={14} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{summaryCounts.total}</p>
          <span className="text-[11px] text-slate-400 font-medium">All historical requests</span>
        </div>

        {/* Pending Requests */}
        <div
          onClick={() => setStatusFilter("PENDING")}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all shadow-xs hover:shadow-sm ${
            statusFilter === "PENDING" ? "border-amber-500 ring-2 ring-amber-500/10" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Review</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Clock size={14} />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{summaryCounts.pending}</p>
          <span className="text-[11px] text-amber-600 font-medium">Requires merchant action</span>
        </div>

        {/* Accepted Requests */}
        <div
          onClick={() => setStatusFilter("ACCEPTED")}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all shadow-xs hover:shadow-sm ${
            statusFilter === "ACCEPTED" ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Accepted</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{summaryCounts.accepted}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Approved for return/refund</span>
        </div>

        {/* Rejected Requests */}
        <div
          onClick={() => setStatusFilter("REJECTED")}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all shadow-xs hover:shadow-sm ${
            statusFilter === "REJECTED" ? "border-red-500 ring-2 ring-red-500/10" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">Rejected</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <XCircle size={14} />
            </div>
          </div>
          <p className="text-2xl font-black text-red-700 mt-2">{summaryCounts.rejected}</p>
          <span className="text-[11px] text-red-600 font-medium">Declined by merchant</span>
        </div>
      </div>

      {/* ── Filters & Search Bar ───────────────────────────────────── */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Tab Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(["ALL", "PENDING", "ACCEPTED", "REJECTED"] as const).map((st) => {
            const isSelected = statusFilter === st;
            const count =
              st === "ALL"
                ? summaryCounts.total
                : st === "PENDING"
                ? summaryCounts.pending
                : st === "ACCEPTED"
                ? summaryCounts.accepted
                : summaryCounts.rejected;

            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{st === "ALL" ? "All Requests" : st.charAt(0) + st.slice(1).toLowerCase()}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Order ID, customer, item..."
            className="w-full text-xs pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all font-medium placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Error Notification ─────────────────────────────────────── */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Return Requests Table ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <SkeletonLoader variant="table" rows={6} />
          </div>
        ) : paginatedRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Requested Products</th>
                  <th className="py-3 px-4 text-center">Return Qty</th>
                  <th className="py-3 px-4">Request Date</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRequests.map((req) => {
                  const displayOrderId = req.order_ui_id || req.order_id;
                  const totalReturnQty = (req.items || []).reduce(
                    (sum, itm) => sum + (Number(itm.quantity) || 1),
                    0
                  );
                  const firstItem = req.items?.[0];
                  const extraItemsCount = (req.items?.length || 1) - 1;

                  return (
                    <tr
                      key={req.id}
                      onClick={() => handleRowClick(req)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Request ID */}
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <span>#{req.id.slice(0, 8).toUpperCase()}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(req.id, e)}
                            title="Copy full Request ID"
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                          >
                            {copiedId === req.id ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} className="text-slate-400" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Order ID */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          #{displayOrderId}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{req.customer_name || "Customer"}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone size={10} />
                            {req.customer_phone || "—"}
                          </p>
                        </div>
                      </td>

                      {/* Products */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        {firstItem ? (
                          <div className="truncate text-xs">
                            <span className="font-semibold text-slate-800">
                              {firstItem.product_name || "Product"}
                            </span>
                            {extraItemsCount > 0 && (
                              <span className="ml-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-full">
                                +{extraItemsCount} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800 text-xs">
                        {totalReturnQty}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(req.created_at)}
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-[150px] truncate">
                        {firstItem?.reason || req.description || "—"}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(req.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleRowClick(req)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye size={12} />
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
              <Inbox size={26} strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No Return Requests Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {searchTerm
                  ? `No requests match "${searchTerm}". Try resetting your search query.`
                  : statusFilter !== "ALL"
                  ? `There are currently no return requests with status "${statusFilter}".`
                  : "No return requests have been submitted by customers yet."}
              </p>
            </div>
            {(searchTerm || statusFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                }}
                className="mt-2 px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* ── Pagination Bar ─────────────────────────────────────────── */}
        {!loading && filteredRequests.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
            <span>
              Showing{" "}
              <b>
                {Math.min(filteredRequests.length, (currentPage - 1) * pageSize + 1)}–
                {Math.min(filteredRequests.length, currentPage * pageSize)}
              </b>{" "}
              of <b>{filteredRequests.length}</b> return requests
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Previous page"
              >
                <ChevronLeft size={14} />
              </button>

              <span className="px-2 text-slate-700 font-bold">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      <ReturnRequestDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        request={selectedRequest}
        shopId={currentShopId}
        onStatusUpdated={handleRefresh}
      />
    </div>
  );
};

export default ReturnRequestsPage;
