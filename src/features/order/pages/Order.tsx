import { useState, useEffect } from "react";
import {
  LayoutGrid, List, X, Inbox
} from "lucide-react";
import OrdersHeader from "../components/OrdersHeader";
import OrdersCard from "../components/OrdersCard";
import Drawer from "@/components/common/Drawer";
import OrderDetailView from "../components/OrdersDetailView";
import { DateFilter } from "../components/DateFilter";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import { useApi } from "@/context/ApiContext";
import { getShopId, SHOP_ID } from "@/services/endpoints";
import { orderApi } from "@/services/api/order";
import { customerApi } from "@/services/api/customer";
import type { OrderRecord } from "@/types/api";
import { VerifyDeliveryModal } from "../components/VerifyDeliveryModal";

const toCardShape = (o: OrderRecord, customerMap?: Record<string, { name: string, phone: string }>) => {
  const c = o.customer_id && customerMap ? customerMap[o.customer_id] : null;
  const anyOrder = o as any;
  const custObj = anyOrder.customer || {};
  const onlineObj = anyOrder.online_details || {};
  const addObj = anyOrder.additional_infos || {};
  const calcObj = anyOrder.calculation_infos || {};
  const dataObj = anyOrder.datas || {};
  const itemObj = anyOrder.item_infos || {};

  const name = onlineObj.name || onlineObj.customer_name || anyOrder.customer_name || anyOrder.user_name || o.customer_name || custObj.customer_name || custObj.name || addObj.customer_name || addObj.name || dataObj.customer_name || dataObj.name || c?.name || "Customer";
  const phone = onlineObj.phone || onlineObj.customer_phone || anyOrder.customer_phone || anyOrder.customer_number || o.customer_number || custObj.mobile_number || custObj.phone || addObj.customer_phone || addObj.phone || dataObj.phone || dataObj.customer_phone || c?.phone || "—";
  
  const rawTotal = calcObj.total ?? calcObj.grand_total ?? calcObj.sub_total ?? o.total_amount ?? o.total ?? anyOrder.total_order_value ?? dataObj.total_amount ?? itemObj.total_order_amount ?? o.pending_amount ?? 0;
  const totalAmount = Number(Number(rawTotal).toFixed(2));

  return {
    id: o.id,
    billNo: o.ui_id || o.id,
    customerName: name,
    phone: phone,
    totalAmount: isNaN(totalAmount) ? 0 : totalAmount,
    status: (o.status ?? "PENDING").toUpperCase(),
    origin: (o.origin || "ONLINE").toUpperCase(),
    deliveryCode: anyOrder.delivery_code || onlineObj.delivery_code || addObj.delivery_code || null,
    online_details: Object.keys(onlineObj).length > 0 ? onlineObj : (addObj.user_id || addObj.full_address || addObj.address_id ? addObj : {}),
  };
};

const Order = () => {
  const { loading, error, clearError } = useApi();
  const currentShopId = getShopId() || localStorage.getItem("shop_id") || SHOP_ID || "";
  const [customerMap, setCustomerMap] = useState<Record<string, { name: string, phone: string }>>({});

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [status, setStatus] = useState("ALL");
  const [isOpen, setIsOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null } | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Verify delivery state
  const [verifyingOrder, setVerifyingOrder] = useState<{ id: string; shopId?: string; billNo: string; customerName: string } | null>(null);

  useEffect(() => {
    if (!currentShopId) return;
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

  useEffect(() => {
    if (!currentShopId) return;
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
        additional_infos: (originalOrder as any).additional_infos || {}
      };
      
      const res = await orderApi.updateOrderStatus(payload);
      if (res) {
        setOrders(prev => prev.map(o => o.id === originalOrder.id ? { ...o, status: newStatus } : o));
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
        const mappedItems = (fullOrder.items || []).map((i: any) => {
          let itemName = i.product_name || i.name || i.datas?.product_name || `Item ${i.product_id?.slice(-4)}`;
          if (i.variant_infos?.variant_name) {
            itemName += ` (${i.variant_infos.variant_name})`;
          }
          return {
            name: itemName,
            qty: i.quantity ?? i.qty ?? 1,
            price: Number((i.unit_price ?? i.sell_price ?? 0).toFixed(2)),
            total: Number((i.line_total ?? i.total_amount ?? ((i.unit_price ?? i.sell_price ?? 0) * (i.quantity ?? i.qty ?? 1))).toFixed(2))
          };
        });
        
        setSelectedOrder({
          ...toCardShape(order, customerMap),
          orderType: fullOrder.origin || "ONLINE",
          items: mappedItems,
          subtotal: Number(Number(fullOrder.calculation_infos?.sub_total ?? fullOrder.calculation_infos?.total ?? fullOrder.total_amount ?? order.datas?.total_amount ?? fullOrder.item_infos?.total_order_amount ?? fullOrder.pending_amount ?? 0).toFixed(2)),
          gstPercent: 0,
          gstAmount: Number(Number(fullOrder.calculation_infos?.total_tax || 0).toFixed(2)),
          grandTotal: Number(Number(fullOrder.calculation_infos?.grand_total ?? fullOrder.calculation_infos?.total ?? fullOrder.total_amount ?? order.datas?.total_amount ?? fullOrder.item_infos?.total_order_amount ?? fullOrder.pending_amount ?? 0).toFixed(2)),
        });
        setIsOpen(true);
        return;
      }
    } catch (e) {
      console.error("Failed to fetch full order details", e);
    }
    
    // Fallback if fetch fails
    setSelectedOrder({
      ...toCardShape(order, customerMap),
      orderType: order.origin || "ONLINE",
      items: [],
      subtotal: Number(Number(order.calculation_infos?.sub_total ?? order.calculation_infos?.total ?? order.total_amount ?? order.datas?.total_amount ?? order.item_infos?.total_order_amount ?? order.pending_amount ?? 0).toFixed(2)),
      gstPercent: 0,
      gstAmount: 0,
      grandTotal: Number(Number(order.calculation_infos?.grand_total ?? order.calculation_infos?.total ?? order.total_amount ?? order.datas?.total_amount ?? order.item_infos?.total_order_amount ?? order.pending_amount ?? 0).toFixed(2)),
    });
    setIsOpen(true);
  };

  const onlineOrders = orders.filter((o) => {
    const origin = (o.origin || "").toUpperCase();
    return origin === "ONLINE" || Boolean((o as any).online_details) || Boolean((o as any).delivery_code) || Boolean((o as any).user_id) || !o.origin;
  });
  const filteredOrders = onlineOrders;
  const totalOrders = onlineOrders.length;
  const pending = onlineOrders.filter((o) => (o.status || "").toUpperCase() === "PENDING").length;
  const accepted = onlineOrders.filter((o) => (o.status || "").toUpperCase() === "ACCEPTED").length;
  const outForDelivery = onlineOrders.filter((o) => (o.status || "").toUpperCase() === "OUT_FOR_DELIVERY").length;
  const delivered = onlineOrders.filter((o) => (o.status || "").toUpperCase() === "DELIVERED").length;

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
          counts={{
            ALL: totalOrders,
            PENDING: pending,
            ACCEPTED: accepted,
            OUT_FOR_DELIVERY: outForDelivery,
            DELIVERED: delivered,
            CANCELED: onlineOrders.filter((o) => (o.status || "").toUpperCase() === "CANCELED").length
          }}
        />

        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{filteredOrders.length}</span> orders
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

        {loading ? (
          <div className="p-3">
            <SkeletonLoader variant="card" rows={6} />
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
            {filteredOrders.map((order) => {
              const cardData = toCardShape(order, customerMap);
              return (
                <OrdersCard
                  key={order.id}
                  order={cardData}
                  setIsOpen={() => handleOpenDetails(order)}
                  viewMode={viewMode}
                  onStatusChange={(newStatus) => handleStatusChange(newStatus, order)}
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
        {selectedOrder && <OrderDetailView order={selectedOrder} />}
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
    </div>
  );
};

export default Order;
