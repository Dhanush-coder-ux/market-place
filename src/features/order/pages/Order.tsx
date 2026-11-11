import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid, List, X, Inbox, RotateCcw
} from "lucide-react";
import OrdersHeader from "../components/OrdersHeader";
import OrdersCard from "../components/OrdersCard";
import Drawer from "@/components/common/Drawer";
import OrderDetailView, { type OrderDetailType } from "../components/OrdersDetailView";
import { DateFilter } from "../components/DateFilter";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import { useApi } from "@/context/ApiContext";
import { getShopId, SHOP_ID } from "@/services/endpoints";
import { orderApi } from "@/services/api/order";
import { customerApi } from "@/services/api/customer";
import type { OrderRecord } from "@/types/api";
import { VerifyDeliveryModal } from "../components/VerifyDeliveryModal";
import { ReturnRequestCard } from "../components/ReturnRequestCard";
import { CreateReturnRequestModal } from "../components/CreateReturnRequestModal";
import type { ReturnRequestRecord } from "../types";
import { toCardShape, parseOrderForDetail, isReturnDisallowedStatus } from "../utils/orderDetailParser";

const Order = () => {
  const navigate = useNavigate();
  const { loading, error, clearError } = useApi();
  const rawId = getShopId() || localStorage.getItem("shop_id") || SHOP_ID || "";
  const currentShopId = rawId && rawId !== "string" ? rawId : "";
  const [customerMap, setCustomerMap] = useState<Record<string, { name: string, phone: string }>>({});

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [status, setStatus] = useState("ALL");
  const [isOpen, setIsOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null } | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedOrder, setSelectedOrder] = useState<OrderDetailType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Return Requests state
  const [returnRequests, setReturnRequests] = useState<ReturnRequestRecord[]>([]);
  const [returnRequestsLoading, setReturnRequestsLoading] = useState(false);
  const [requestReturnModalOrder, setRequestReturnModalOrder] = useState<any | null>(null);

  const [statusCounts, setStatusCounts] = useState<{
    ALL: number;
    PENDING: number;
    ACCEPTED: number;
    OUT_FOR_DELIVERY: number;
    DELIVERED: number;
    CANCELED: number;
    RETURN_REQUESTS?: number;
  }>({
    ALL: 0,
    PENDING: 0,
    ACCEPTED: 0,
    OUT_FOR_DELIVERY: 0,
    DELIVERED: 0,
    CANCELED: 0,
    RETURN_REQUESTS: 0,
  });

  // Verify delivery state
  const [verifyingOrder, setVerifyingOrder] = useState<{ id: string; shopId?: string; billNo: string; customerName: string } | null>(null);

  useEffect(() => {
    if (!currentShopId || currentShopId === "string") return;
    customerApi.getCustomersByShopId(currentShopId, { limit: "100", offset: "1" })
      .then((res: any) => {
        if (res?.data) {
          const m: Record<string, { name: string, phone: string }> = {};
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
      .catch(console.error);
  }, [currentShopId]);

  // Fetch overall counts across all statuses (independent of active status tab filter)
  useEffect(() => {
    if (!currentShopId || currentShopId === "string") return;
    const countParams: any = {
      limit: "100",
      offset: "1",
      origin: "ONLINE",
      online_only: true,
      exclude_offline: true,
    };
    if (dateRange?.startDate) {
      countParams.from_date = dateRange.startDate.toISOString().split("T")[0];
    }
    if (dateRange?.endDate) {
      countParams.to_date = dateRange.endDate.toISOString().split("T")[0];
    }

    orderApi.getOrdersByShop(currentShopId, countParams).then((res: any) => {
      if (res?.data) {
        let list: OrderRecord[] = [];
        if (Array.isArray(res.data)) {
          list = res.data;
        } else if (Array.isArray(res.data.datas)) {
          list = res.data.datas;
        } else if (Array.isArray(res.data.orders)) {
          list = res.data.orders;
        } else if (typeof res.data === "object") {
          list = [res.data];
        }

        const online = list.filter((o) => {
          const origin = (o.origin || "").toUpperCase();
          return origin === "ONLINE" || Boolean((o as any).online_details) || Boolean((o as any).delivery_code) || Boolean((o as any).user_id) || !o.origin;
        });

        const isCanceled = (s: string) => s === "CANCELED" || s === "CANCELLED";

        setStatusCounts(prev => ({
          ALL: online.length,
          PENDING: online.filter((o) => (o.status || "").toUpperCase() === "PENDING").length,
          ACCEPTED: online.filter((o) => (o.status || "").toUpperCase() === "ACCEPTED").length,
          OUT_FOR_DELIVERY: online.filter((o) => (o.status || "").toUpperCase() === "OUT_FOR_DELIVERY").length,
          DELIVERED: online.filter((o) => (o.status || "").toUpperCase() === "DELIVERED").length,
          CANCELED: online.filter((o) => isCanceled((o.status || "").toUpperCase())).length,
          RETURN_REQUESTS: prev.RETURN_REQUESTS ?? 0,
        }));
      }
    }).catch(console.error);
  }, [refreshKey, dateRange, currentShopId]);

  // Fetch return requests
  useEffect(() => {
    if (!currentShopId || currentShopId === "string") return;
    setReturnRequestsLoading(true);
    orderApi.getReturnRequests(currentShopId, { status: "ALL" })
      .then((res: any) => {
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.datas) ? res.data.datas : []);
        setReturnRequests(list);
        const pendingCount = list.filter((r: any) => (r.status || "").toUpperCase() === "PENDING").length;
        setStatusCounts(prev => ({
          ...prev,
          RETURN_REQUESTS: pendingCount
        }));
      })
      .catch((err) => {
        console.error("Failed to fetch return requests", err);
      })
      .finally(() => {
        setReturnRequestsLoading(false);
      });
  }, [refreshKey, currentShopId]);

  const handleReturnRequestStatusChange = async (requestId: string, newStatus: "ACCEPTED" | "REJECTED", notes?: string) => {
    try {
      await orderApi.updateReturnRequestStatus(requestId, { status: newStatus, admin_notes: notes });
      setReturnRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus, admin_notes: notes } : r));
      setRefreshKey(k => k + 1);
    } catch (e) {
      console.error("Failed to update return request status", e);
    }
  };

  const handleOpenDetailsById = async (orderId: string) => {
    try {
      const res = await orderApi.getOrderById(currentShopId, orderId);
      if (res?.data) {
        const fullOrder = Array.isArray(res.data) 
            ? res.data[0] 
            : (Array.isArray(res.data.datas) ? res.data.datas[0] : res.data);

        setSelectedOrder(parseOrderForDetail(fullOrder, fullOrder, customerMap));
        setIsOpen(true);
        return;
      }
    } catch (e) {
      console.error("Failed to open order details for id", orderId, e);
    }
  };

  // Fetch orders according to the currently active status tab & filters
  useEffect(() => {
    if (!currentShopId || currentShopId === "string") return;
    if (status === "RETURN_REQUESTS") return;
    const params: any = {
      limit: "50",
      offset: "1",
      origin: "ONLINE",
      online_only: true,
      exclude_offline: true,
    };
    if (status && status !== "ALL") params.status = status;
    if (dateRange?.startDate) {
      params.from_date = dateRange.startDate.toISOString().split("T")[0];
    }
    if (dateRange?.endDate) {
      params.to_date = dateRange.endDate.toISOString().split("T")[0];
    }
    
    orderApi.getOrdersByShop(currentShopId, params).then((res: any) => {
      if (res?.data) {
        let orderList: OrderRecord[] = [];
        if (Array.isArray(res.data)) {
          orderList = res.data;
        } else if (Array.isArray(res.data.datas)) {
          orderList = res.data.datas;
        } else if (Array.isArray(res.data.orders)) {
          orderList = res.data.orders;
        } else if (typeof res.data === "object") {
          orderList = [res.data];
        }
        setOrders(orderList);
      } else {
        setOrders([]);
      }
    }).catch(console.error);
  }, [refreshKey, status, dateRange, currentShopId]);

  const handleStatusChange = async (newStatus: string, originalOrder: OrderRecord) => {
    try {
      const targetShopId = (originalOrder as any).shop_id || currentShopId;
      const existingAdd = (originalOrder as any).additional_infos || {};
      const isCanceling = ["CANCELED", "CANCELLED"].includes(String(newStatus || "").toUpperCase());
      const mergedAddInfos = {
        ...existingAdd,
        ...(isCanceling
          ? {
              cancelled_by_source: "INVENTQ",
              cancelled_by: "InventQ",
              cancelled_by_label: "Cancelled manually by InventQ",
            }
          : {}),
      };
      const payload = {
        id: originalOrder.id,
        shop_id: targetShopId,
        session_id: (originalOrder as any).session_id || "",
        customer_id: (originalOrder as any).customer_id || "",
        status: newStatus,
        origin: (originalOrder as any).origin || "ONLINE",
        type: (originalOrder as any).type || "",
        calculation_infos: (originalOrder as any).calculation_infos || {},
        charges_infos: (originalOrder as any).charges_infos || {},
        payment_infos: Array.isArray((originalOrder as any).payment_infos) ? {} : ((originalOrder as any).payment_infos || {}),
        additional_infos: mergedAddInfos
      };
      
      const res = await orderApi.updateOrderStatus(payload);
      if (res) {
        setOrders(prev => prev.map(o => o.id === originalOrder.id ? { ...o, status: newStatus, additional_infos: mergedAddInfos } : o));
        setRefreshKey(k => k + 1);
      }
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const handleOpenDetails = async (order: OrderRecord) => {
    try {
      const targetShopId = (order as any).shop_id || currentShopId;
      const res = await orderApi.getOrderById(targetShopId, order.id);
      if (res?.data) {
        const fullOrder = Array.isArray(res.data) 
            ? res.data[0] 
            : (Array.isArray(res.data.datas) ? res.data.datas[0] : res.data);

        setSelectedOrder(parseOrderForDetail(fullOrder, order, customerMap));
        setIsOpen(true);
        return;
      }
    } catch (e) {
      console.error("Failed to fetch full order details", e);
    }
    
    // Fallback if fetch fails
    setSelectedOrder(parseOrderForDetail(order, order, customerMap));
    setIsOpen(true);
  };

  const onlineOrders = orders.filter((o) => {
    const origin = (o.origin || "").toUpperCase();
    return origin === "ONLINE" || Boolean((o as any).online_details) || Boolean((o as any).delivery_code) || Boolean((o as any).user_id) || !o.origin;
  });
  const filteredOrders = onlineOrders;

  return (
    <div className="h-full overflow-y-auto bg-slate-50/60 font-sans pb-10">
      <div className="space-y-4">



        {error && (
          <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            <span>{error}</span>
            <button onClick={clearError} className="shrink-0 text-red-400 hover:text-red-600"><X size={14} /></button>
          </div>
        )}

        <OrdersHeader
          status={status}
          setStatus={setStatus}
          setIsDateFilterOpen={setOpen}
          orderType=""
          setOrderType={() => { }}
          orderTypeOptions={[]}
          counts={statusCounts}
        />

        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500 font-medium">
            Showing{" "}
            <span className="font-bold text-slate-800">
              {status === "RETURN_REQUESTS" ? returnRequests.length : filteredOrders.length}
            </span>{" "}
            {status === "RETURN_REQUESTS" ? "return requests" : "orders"}
            {dateRange?.startDate && dateRange?.endDate && (
              <span className="ml-2 text-xs text-blue-600 font-normal">
                (Filtered by Date)
                <button
                  onClick={() => setDateRange(null)}
                  className="ml-1 text-slate-400 hover:text-red-500 font-bold underline"
                >
                  Clear
                </button>
              </span>
            )}
          </p>

          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
            >
              <List size={16} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
            >
              <LayoutGrid size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {status === "RETURN_REQUESTS" ? (
          <div>
            <div className="mb-4 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs font-bold text-amber-900">
                <RotateCcw size={16} className="text-amber-700 shrink-0" />
                <span>Customer Return Requests</span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/orders/returns")}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                Open Return Management Dashboard →
              </button>
            </div>
            {returnRequestsLoading ? (
              <div className="p-3">
                <SkeletonLoader variant="card" rows={4} />
              </div>
            ) : returnRequests.length > 0 ? (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
                {returnRequests.map((req) => (
                  <ReturnRequestCard
                    key={req.id}
                    request={req}
                    onStatusChange={handleReturnRequestStatusChange}
                    onViewOrder={handleOpenDetailsById}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center bg-white rounded-lg border border-slate-200 shadow-sm py-20 gap-3">
                <div className="w-14 h-14 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                  <RotateCcw size={28} strokeWidth={2} />
                </div>
                <p className="text-sm font-bold text-slate-600">No return requests found</p>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="p-3">
            <SkeletonLoader variant="card" rows={6} />
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
            {filteredOrders.map((order) => {
              const cardData = toCardShape(order, customerMap);
              const allowReturn = !isReturnDisallowedStatus(cardData.status);
              return (
                <OrdersCard
                  key={order.id}
                  order={cardData}
                  setIsOpen={() => handleOpenDetails(order)}
                  viewMode={viewMode}
                  onStatusChange={(newStatus) => handleStatusChange(newStatus, order)}
                  onRequestReturn={allowReturn ? () => setRequestReturnModalOrder(order) : undefined}
                  onVerifyDelivery={() => setVerifyingOrder({ id: order.id, shopId: (order as any).shop_id || currentShopId, billNo: cardData.billNo, customerName: cardData.customerName })}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center bg-white rounded-lg border border-slate-200 shadow-sm py-20 gap-3">
            <div className="w-14 h-14 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
              <Inbox size={28} strokeWidth={2} />
            </div>
            <p className="text-sm font-bold text-slate-600">No orders found</p>
          </div>
        )}
      </div>

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Order Details">
        {selectedOrder && (
          <OrderDetailView
            order={selectedOrder}
            onRequestReturn={
              !isReturnDisallowedStatus(selectedOrder.status)
                ? () => {
                    const orig = orders.find(o => o.id === selectedOrder.id) || selectedOrder;
                    setRequestReturnModalOrder(orig);
                  }
                : undefined
            }
            onUpdateReturnStatus={handleReturnRequestStatusChange}
          />
        )}
      </Drawer>

      <DateFilter
        isOpen={open}
        onClose={() => setOpen(false)}
        onApply={(range) => {
          setDateRange(range);
          setOpen(false);
        }}
      />

      {/* Verify Delivery Modal */}
      <VerifyDeliveryModal
        isOpen={!!verifyingOrder}
        onClose={() => setVerifyingOrder(null)}
        orderId={verifyingOrder?.id || ""}
        shopId={verifyingOrder?.shopId || currentShopId}
        billNo={verifyingOrder?.billNo || ""}
        customerName={verifyingOrder?.customerName || ""}
        onVerified={() => {
          // Update order status in local state to DELIVERED
          setOrders(prev => prev.map(o => o.id === verifyingOrder?.id ? { ...o, status: "DELIVERED" } : o));
          setVerifyingOrder(null);
          setRefreshKey(k => k + 1);
        }}
      />

      {/* Create Return Request Modal */}
      <CreateReturnRequestModal
        isOpen={!!requestReturnModalOrder}
        onClose={() => setRequestReturnModalOrder(null)}
        order={requestReturnModalOrder}
        shopId={currentShopId}
        onSubmitted={() => {
          setRefreshKey(k => k + 1);
        }}
      />
    </div>
  );
};

export default Order;
