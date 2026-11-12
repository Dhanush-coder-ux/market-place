import React, { useState, useEffect, useMemo } from "react";
import {
  RotateCcw, Clock, CheckCircle2, XCircle, RefreshCw,
  Copy, Check, X, AlertCircle, ChevronLeft, ChevronRight, Eye,
  Inbox, Phone, User, Calendar, LayoutGrid, List,
  ExternalLink, IndianRupee, ListFilter, AlertTriangle, Loader2
} from "lucide-react";
import { orderApi } from "@/services/api/order";
import { customerApi } from "@/services/api/customer";
import { getShopId, SHOP_ID } from "@/services/endpoints";
import type { ReturnRequestRecord } from "../types";
import { ReturnRequestDetailDrawer } from "../components/ReturnRequestDetailDrawer";
import { ReturnRequestCard } from "../components/ReturnRequestCard";
import { DateFilter } from "../components/DateFilter";
import Drawer from "@/components/common/Drawer";
import OrderDetailView, { type OrderDetailType } from "../components/OrdersDetailView";
import { parseOrderForDetail } from "../utils/orderDetailParser";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import { StatCard } from "@/components/common/StatsCard";
import { SearchBar } from "@/components/ui";

export const ReturnRequestsPage: React.FC = () => {
  const rawId = getShopId() || localStorage.getItem("shop_id") || SHOP_ID || "";
  const currentShopId = rawId && rawId !== "string" ? rawId : "";

  // Data states
  const [requests, setRequests] = useState<ReturnRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "ACCEPTED" | "REJECTED">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null } | null>(null);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

  // View mode (List table vs Grid cards)
  const [viewMode, setViewMode] = useState<"list" | "grid">(() => (typeof window !== "undefined" && window.innerWidth < 768 ? "grid" : "list"));

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = viewMode === "list" ? 10 : 9;

  // Selected return request for Detail Drawer
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequestRecord | null>(null);
  const [isReturnDrawerOpen, setIsReturnDrawerOpen] = useState(false);

  // Selected original order for Order Detail Drawer
  const [selectedOrder, setSelectedOrder] = useState<OrderDetailType | null>(null);
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [customerMap, setCustomerMap] = useState<Record<string, { name: string; phone: string }>>({});

  // Fast Reject confirmation modal state
  const [rejectModalReq, setRejectModalReq] = useState<ReturnRequestRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Copy ID tooltip state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch customers for name/phone mapping in OrderDetailView
  useEffect(() => {
    if (!currentShopId) return;
    customerApi.getCustomersByShopId(currentShopId, { limit: "100", offset: "1" })
      .then((res: any) => {
        if (res?.data) {
          const m: Record<string, { name: string; phone: string }> = {};
          const custList = Array.isArray(res.data) ? res.data : (res.data.datas ?? []);
          custList.forEach((c: any) => {
            m[c.id] = {
              name: c.name || "Unknown",
              phone: c.contact_infos?.mobile_number || c.mobile_number || "—"
            };
          });
          setCustomerMap(m);
        }
      })
      .catch(() => {});
  }, [currentShopId]);

  // Fetch return requests from backend
  useEffect(() => {
    if (!currentShopId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

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

  // Compute Summary KPI Counts & Values
  const summaryCounts = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => (r.status || "").toUpperCase() === "PENDING").length;
    const accepted = requests.filter((r) => (r.status || "").toUpperCase() === "ACCEPTED").length;
    const rejected = requests.filter((r) => (r.status || "").toUpperCase() === "REJECTED").length;

    const totalRefundSum = requests.reduce((sum, r) => {
      const itmSum = (r.items || []).reduce(
        (acc, it) => acc + (Number(it.total_amount) || (Number(it.price || 0) * Number(it.quantity || 1))),
        0
      );
      return sum + itmSum;
    }, 0);

    return { total, pending, accepted, rejected, totalRefundSum };
  }, [requests]);

  // Filter and search
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const s = (req.status || "").toUpperCase();
      if (statusFilter !== "ALL" && s !== statusFilter) {
        return false;
      }

      // Date range filter
      if (dateRange?.startDate) {
        const reqDate = new Date(req.created_at);
        const start = new Date(dateRange.startDate);
        start.setHours(0, 0, 0, 0);
        if (reqDate < start) return false;
      }
      if (dateRange?.endDate) {
        const reqDate = new Date(req.created_at);
        const end = new Date(dateRange.endDate);
        end.setHours(23, 59, 59, 999);
        if (reqDate > end) return false;
      }

      // Text search
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
  }, [requests, statusFilter, searchTerm, dateRange]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  // Reset to page 1 on filter, search, or view mode change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, dateRange, viewMode]);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRowClick = (req: ReturnRequestRecord) => {
    setSelectedRequest(req);
    setIsReturnDrawerOpen(true);
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  // Open original order detail in drawer
  const handleOpenOrderById = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await orderApi.getOrderById(currentShopId, orderId);
      if (res?.data) {
        const fullOrder = Array.isArray(res.data)
          ? res.data[0]
          : (Array.isArray(res.data.datas) ? res.data.datas[0] : res.data);

        setSelectedOrder(parseOrderForDetail(fullOrder, fullOrder, customerMap));
        setIsOrderDrawerOpen(true);
      }
    } catch (err) {
      console.error("Failed to fetch order details for id:", orderId, err);
    }
  };

  // Quick Accept action
  const handleQuickAccept = async (requestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setActionLoading(true);
      await orderApi.updateReturnRequestStatus(requestId, {
        status: "ACCEPTED",
        admin_notes: "Return request accepted.",
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: "ACCEPTED", admin_notes: "Return request accepted." }
            : r
        )
      );
      handleRefresh();
    } catch (err: any) {
      console.error("Failed to accept return request:", err);
      setError(err?.message || "Failed to accept return request.");
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Reject button click
  const handleOpenRejectModal = (req: ReturnRequestRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setRejectModalReq(req);
    setRejectReason("");
    setActionError(null);
  };

  // Submit rejection with reason
  const handleConfirmReject = async () => {
    if (!rejectModalReq) return;
    if (!rejectReason.trim()) {
      setActionError("Please provide an explanation for rejecting this return request.");
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);
      await orderApi.updateReturnRequestStatus(rejectModalReq.id, {
        status: "REJECTED",
        admin_notes: rejectReason.trim(),
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === rejectModalReq.id
            ? { ...r, status: "REJECTED", admin_notes: rejectReason.trim() }
            : r
        )
      );
      setRejectModalReq(null);
      handleRefresh();
    } catch (err: any) {
      console.error("Failed to reject return request:", err);
      setActionError(err?.message || "Failed to update return request status.");
    } finally {
      setActionLoading(false);
    }
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
          <CheckCircle2 size={12} strokeWidth={2.5} />
          <span>Accepted</span>
        </span>
      );
    }
    if (s === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 shadow-xs">
          <XCircle size={12} strokeWidth={2.5} />
          <span>Rejected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span>Pending Review</span>
      </span>
    );
  };

  const pipelineTabs = [
    { label: "All Requests", value: "ALL" as const, icon: ListFilter, count: summaryCounts.total },
    { label: "Pending", value: "PENDING" as const, icon: Clock, count: summaryCounts.pending },
    { label: "Accepted", value: "ACCEPTED" as const, icon: CheckCircle2, count: summaryCounts.accepted },
    { label: "Rejected", value: "REJECTED" as const, icon: XCircle, count: summaryCounts.rejected },
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-50/60 font-sans p-4 sm:p-6 pb-12 space-y-4">
      {/* ── Top Actions ────────────────────────────────────────────── */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-xs shrink-0"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-blue-600" : "text-slate-500"} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Error Notification ─────────────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="shrink-0 text-red-400 hover:text-red-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Metric / KPI Cards (StatCard) ─────────────────────────── */}
      <div className="flex-none overflow-x-auto pb-1">
        <div className="flex gap-4 min-w-max">
          <StatCard
            label="Total Requests"
            value={summaryCounts.total}
            subValue={summaryCounts.totalRefundSum > 0 ? `₹${summaryCounts.totalRefundSum.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : undefined}
            icon={RotateCcw}
            iconBg="bg-slate-100"
            iconColor="text-slate-600"
            className={statusFilter === "ALL" ? "ring-2 ring-blue-500/20 border-blue-500 shadow-xs" : ""}
            onClick={() => setStatusFilter("ALL")}
          />
          <StatCard
            label="Pending Review"
            value={summaryCounts.pending}
            icon={Clock}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            valueColor="text-amber-700"
            className={statusFilter === "PENDING" ? "ring-2 ring-amber-500/20 border-amber-500 shadow-xs" : ""}
            onClick={() => setStatusFilter("PENDING")}
          />
          <StatCard
            label="Accepted"
            value={summaryCounts.accepted}
            icon={CheckCircle2}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            valueColor="text-emerald-700"
            className={statusFilter === "ACCEPTED" ? "ring-2 ring-emerald-500/20 border-emerald-500 shadow-xs" : ""}
            onClick={() => setStatusFilter("ACCEPTED")}
          />
          <StatCard
            label="Rejected"
            value={summaryCounts.rejected}
            icon={XCircle}
            iconBg="bg-red-50"
            iconColor="text-red-600"
            valueColor="text-red-700"
            className={statusFilter === "REJECTED" ? "ring-2 ring-red-500/20 border-red-500 shadow-xs" : ""}
            onClick={() => setStatusFilter("REJECTED")}
          />
        </div>
      </div>

      {/* ── Pipeline Segmented Tabs & Date Filter (matching OrdersHeader) ── */}
      <div className="w-full flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 font-sans">
        {/* Left: Segmented Tabs */}
        <div className="w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/60 min-w-max">
            {pipelineTabs.map((tab) => {
              const isActive = statusFilter === tab.value;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white text-blue-600 shadow-xs border border-slate-200/50"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"
                  }`}
                >
                  <Icon size={14} strokeWidth={isActive ? 2 : 1.5} />
                  <span>{tab.label}</span>
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Date Filter Button */}
        <button
          type="button"
          onClick={() => setIsDateFilterOpen(true)}
          className="w-full xl:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-xs hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-all text-[13px] font-medium shrink-0"
        >
          <Calendar size={15} strokeWidth={2} />
          <span>Filter by Date</span>
          {dateRange?.startDate && (
            <span className="w-2 h-2 rounded-full bg-blue-600" />
          )}
        </button>
      </div>

      {/* ── Secondary Controls: Count, Search & View Toggle (matching Order.tsx) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <p className="text-sm text-slate-500 font-medium">
            Showing{" "}
            <span className="font-bold text-slate-800">{filteredRequests.length}</span>{" "}
            return requests
          </p>

          {dateRange?.startDate && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <Calendar size={11} />
              <span>
                {dateRange.startDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                {dateRange.endDate &&
                  ` – ${dateRange.endDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`}
              </span>
              <button
                type="button"
                onClick={() => setDateRange(null)}
                className="hover:text-red-600 transition-colors ml-0.5 font-bold"
                title="Clear date filter"
              >
                <X size={11} />
              </button>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm("")}
            placeholder="Search order ID, customer, item..."
            size="sm"
            className="flex-1 min-w-0 sm:w-72 sm:flex-initial"
          />

          {/* List / Grid Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-xs shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-blue-50 text-blue-600 shadow-xs"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
              title="List table view"
            >
              <List size={16} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "grid"
                  ? "bg-blue-50 text-blue-600 shadow-xs"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
              title="Grid card view"
            >
              <LayoutGrid size={16} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content Area: Table / Grid ─────────────────────────────── */}
      {loading ? (
        <div className="p-6 bg-white rounded-xl border border-slate-200">
          <SkeletonLoader variant="table" rows={6} />
        </div>
      ) : paginatedRequests.length > 0 ? (
        viewMode === "list" ? (
          /* ── Modern Table View ── */
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Request ID</th>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Requested Products</th>
                    <th className="py-3 px-4 text-right">Refund Value</th>
                    <th className="py-3 px-4">Requested On</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRequests.map((req) => {
                    const displayOrderId = req.order_ui_id || req.order_id;
                    const totalRefundAmount = (req.items || []).reduce(
                      (acc, itm) =>
                        acc +
                        (Number(itm.total_amount) ||
                          Number(itm.price || 0) * Number(itm.quantity || 1)),
                      0
                    );
                    const firstItem = req.items?.[0];
                    const extraItemsCount = (req.items?.length || 1) - 1;
                    const isPending = (req.status || "PENDING").toUpperCase() === "PENDING";

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

                        {/* Order ID Link */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={(e) => handleOpenOrderById(req.order_id, e)}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors inline-flex items-center gap-1 group/btn"
                            title="Inspect full original order"
                          >
                            <span>#{displayOrderId}</span>
                            <ExternalLink size={11} className="opacity-0 group-hover/btn:opacity-100 text-blue-500 transition-opacity" />
                          </button>
                        </td>

                        {/* Customer Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0 text-slate-500">
                              <User size={13} strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 text-xs truncate">
                                {req.customer_name || "Customer"}
                              </p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone size={10} />
                                <span>{req.customer_phone || "—"}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Requested Products */}
                        <td className="py-3.5 px-4 max-w-[240px]">
                          {firstItem ? (
                            <div className="space-y-0.5">
                              <div className="truncate text-xs font-semibold text-slate-800">
                                {firstItem.product_name}
                                {extraItemsCount > 0 && (
                                  <span className="ml-1.5 text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                    +{extraItemsCount} more
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">
                                Qty: <b>{firstItem.quantity}</b>
                                {firstItem.reason && (
                                  <span className="ml-1 text-slate-400">
                                    • {firstItem.reason}
                                  </span>
                                )}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Refund Value */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-baseline gap-0.5 font-bold text-slate-900 text-xs">
                            <IndianRupee size={12} className="text-slate-600" />
                            <span>
                              {totalRefundAmount.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </td>

                        {/* Request Date */}
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(req.created_at)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderStatusBadge(req.status)}
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3.5 px-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1.5">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => handleQuickAccept(req.id, e)}
                                  className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-xs font-semibold transition-all shadow-2xs"
                                  title="Approve return request"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenRejectModal(req, e)}
                                  className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white text-xs font-semibold transition-all shadow-2xs"
                                  title="Decline return request"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRowClick(req)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center gap-1"
                              title="Inspect full return details"
                            >
                              <Eye size={12} />
                              <span>Review</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination inside table container */}
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
          </div>
        ) : (
          /* ── Grid Card View (matching Order.tsx grid style) ── */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedRequests.map((req) => (
                <ReturnRequestCard
                  key={req.id}
                  request={req}
                  viewMode="grid"
                  onViewOrder={(orderId) => handleOpenOrderById(orderId)}
                  onStatusChange={async (requestId, newStatus, notes) => {
                    await orderApi.updateReturnRequestStatus(requestId, {
                      status: newStatus,
                      admin_notes: notes,
                    });
                    handleRefresh();
                  }}
                />
              ))}
            </div>

            {/* Grid Pagination */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
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
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )
      ) : (
        /* ── Empty State ── */
        <div className="py-20 px-4 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
            <Inbox size={24} strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">No Return Requests Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {searchTerm
                ? `No requests match "${searchTerm}". Try resetting your search query.`
                : dateRange?.startDate
                ? "There are no return requests within the selected date range."
                : statusFilter !== "ALL"
                ? `There are currently no return requests with status "${statusFilter}".`
                : "No return requests have been submitted by customers yet."}
            </p>
          </div>
          {(searchTerm || statusFilter !== "ALL" || dateRange?.startDate) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setDateRange(null);
              }}
              className="mt-2 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* ── Detail Drawer for Return Request ───────────────────────── */}
      <ReturnRequestDetailDrawer
        isOpen={isReturnDrawerOpen}
        onClose={() => setIsReturnDrawerOpen(false)}
        request={selectedRequest}
        shopId={currentShopId}
        onStatusUpdated={handleRefresh}
        onViewOrder={(orderId) => {
          setIsReturnDrawerOpen(false);
          handleOpenOrderById(orderId);
        }}
      />

      {/* ── Original Order Detail Drawer (matching Order.tsx) ──────── */}
      <Drawer
        isOpen={isOrderDrawerOpen}
        onClose={() => setIsOrderDrawerOpen(false)}
        title={selectedOrder?.billNo ? `Order Details #${selectedOrder.billNo}` : "Order Details"}
      >
        {selectedOrder && (
          <OrderDetailView
            order={selectedOrder}
            onUpdateReturnStatus={async (requestId: string, status: "ACCEPTED" | "REJECTED") => {
              try {
                await orderApi.updateReturnRequestStatus(requestId, { status });
                handleRefresh();
              } catch (err) {
                console.error("Failed to update return status", err);
              }
            }}
          />
        )}
      </Drawer>

      {/* ── Date Filter Modal ──────────────────────────────────────── */}
      <DateFilter
        isOpen={isDateFilterOpen}
        onClose={() => setIsDateFilterOpen(false)}
        onApply={(range) => {
          setDateRange(range);
          setIsDateFilterOpen(false);
        }}
      />

      {/* ── Fast Reject Remarks Modal ──────────────────────────────── */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-full max-w-md space-y-4 animate-in fade-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200/80 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle size={20} strokeWidth={2.2} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Reject Return Request #{rejectModalReq.id.slice(0, 8).toUpperCase()}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Provide an explanation reason for declining this request. This will be recorded in the audit trail and visible in merchant notes.
                </p>
              </div>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Rejection Reason (Required)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Return window expired, item seal broken, or policy violation..."
                rows={3}
                className="w-full text-sm sm:text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 placeholder:text-slate-400 font-medium"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setRejectModalReq(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 shadow-xs transition-all flex items-center gap-1.5"
              >
                {actionLoading && <Loader2 size={13} className="animate-spin" />}
                <span>Confirm Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnRequestsPage;
