import { useState, useEffect } from "react";
import {
  LayoutGrid, List, X, Inbox
} from "lucide-react";
import OrdersHeader from "../components/OrdersHeader";
import OrdersCard from "../components/OrdersCard";
import Drawer from "@/components/common/Drawer";
import OrderDetailView, { type OrderDetailType, type OrderItem } from "../components/OrdersDetailView";
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
  const chargesObj = anyOrder.charges_infos || {};

  const name = onlineObj.name || onlineObj.customer_name || anyOrder.customer_name || anyOrder.user_name || o.customer_name || custObj.customer_name || custObj.name || addObj.customer_name || addObj.name || dataObj.customer_name || dataObj.name || c?.name || "Customer";
  const phone = onlineObj.phone || onlineObj.customer_phone || anyOrder.customer_phone || anyOrder.customer_number || o.customer_number || custObj.mobile_number || custObj.phone || addObj.customer_phone || addObj.phone || dataObj.phone || dataObj.customer_phone || c?.phone || "—";
  
  let rawTotal = calcObj.total ?? calcObj.grand_total ?? o.total_amount ?? o.total ?? anyOrder.total_order_value ?? dataObj.total_amount;
  if (rawTotal === undefined || rawTotal === null || Number(rawTotal) === 0) {
    if (itemObj.total_order_amount !== undefined) {
      const base = Number(itemObj.total_order_amount) || 0;
      const gst = Number(itemObj.total_order_gst_amount) || 0;
      const delivery = Number(chargesObj.delivery_charge ?? chargesObj.delivery_charges ?? chargesObj.delivery_fee ?? 0) || 0;
      rawTotal = base + gst + delivery;
    } else {
      rawTotal = calcObj.sub_total ?? itemObj.total_order_amount ?? o.pending_amount ?? 0;
    }
  }
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
    status_updated_by: o.status_updated_by || addObj.status_updated_by || addObj.accepted_by || addObj.canceled_by || addObj.rejected_by || addObj.last_action_by || null,
    status_history: addObj.status_history || [],
    additional_infos: addObj,
  };
};

const parseOrderForDetail = (
  rawOrder: any,
  fallbackCardOrder?: OrderRecord,
  customerMap?: Record<string, { name: string; phone: string }>
): OrderDetailType => {
  const o = rawOrder || fallbackCardOrder || {};
  const cardShape = fallbackCardOrder ? toCardShape(fallbackCardOrder, customerMap) : toCardShape(o, customerMap);

  const calc = o.calculation_infos || o.calculations || {};
  const itemInfos = o.item_infos || {};
  const addInfos = o.additional_infos || {};
  const charges = o.charges_infos || {};
  const dataObj = o.datas || {};

  // Extract items from fullOrder.items or calculation_infos.items or fallback
  const rawItems: any[] = Array.isArray(o.items) && o.items.length > 0 
    ? o.items 
    : (Array.isArray(calc.items) ? calc.items : []);

  const calcItemsList: any[] = Array.isArray(calc.items) ? calc.items : [];

  const mappedItems: OrderItem[] = rawItems.map((i: any, index: number) => {
    // Attempt to match with calcItems if needed
    const calcItem = calcItemsList.find(
      (ci: any) =>
        (ci.product_id && (ci.product_id === i.product_id || ci.product_id === i.id)) ||
        (ci.inventoryId && ci.inventoryId === i.product_id)
    ) || (calcItemsList.length > index && !calcItemsList[index].product_id ? calcItemsList[index] : null);

    let itemName =
      i.product_name ||
      i.name ||
      calcItem?.name ||
      i.datas?.product_name ||
      i.additional_infos?.product_name ||
      i.additional_infos?.name ||
      (i.product_id ? `Item ${String(i.product_id).slice(-4)}` : `Item #${index + 1}`);

    const varName =
      i.variant_infos?.variant_name ||
      i.variant_info?.variant_name ||
      i.variant_name ||
      calcItem?.variant_name;
    if (varName) {
      itemName += ` (${varName})`;
    }

    const qty = Number(i.quantity ?? i.qty ?? calcItem?.qty ?? i.entered_qty ?? 1) || 1;
    const price = Number(i.sell_price ?? i.unit_price ?? i.price ?? calcItem?.price ?? 0);
    const lineTotal = Number(
      i.total_amount ??
      i.line_total ??
      calcItem?.final_inclusive ??
      calcItem?.taxable_value ??
      (price * qty)
    );

    // GST rate resolution
    let gstRate = 0;
    if (calcItem?.gst_rate !== undefined && !isNaN(Number(calcItem.gst_rate))) {
      gstRate = Number(calcItem.gst_rate);
    } else if (i.gstRate !== undefined && !isNaN(Number(i.gstRate))) {
      gstRate = Number(i.gstRate);
    } else if (i.gst !== undefined && i.gst !== null) {
      if (typeof i.gst === "number") {
        gstRate = i.gst <= 1 && i.gst > 0 ? Number((i.gst * 100).toFixed(2)) : i.gst;
      } else if (typeof i.gst === "string") {
        const parsed = parseFloat(i.gst.replace("%", "").trim());
        gstRate = isNaN(parsed) ? 0 : parsed;
      }
    }

    // GST amount resolution
    let gstAmount = 0;
    if (calcItem?.gst_amount !== undefined && !isNaN(Number(calcItem.gst_amount))) {
      gstAmount = Number(calcItem.gst_amount);
    } else if (i.gst_amount !== undefined && !isNaN(Number(i.gst_amount))) {
      gstAmount = Number(i.gst_amount);
    } else if (gstRate > 0) {
      gstAmount = lineTotal * (gstRate / 100);
    }

    const gstLabel = gstRate > 0 ? `${gstRate}%` : (i.gst ? String(i.gst) : "0%");

    return {
      name: itemName,
      qty,
      price: Number(price.toFixed(2)),
      total: Number(lineTotal.toFixed(2)),
      gst: gstLabel,
      gstRate,
      gstAmount: Number(gstAmount.toFixed(2)),
    };
  });

  // Calculate or retrieve total GST
  const sumItemsGst = mappedItems.reduce((acc, it) => acc + (it.gstAmount || 0), 0);
  const rawGstAmount =
    calc.gst_amount ??
    itemInfos.total_order_gst_amount ??
    calc.total_tax ??
    calc.tax_amount ??
    addInfos.gst_amount ??
    charges.gst_amount ??
    (sumItemsGst > 0 ? sumItemsGst : 0);

  const gstAmount = Number(Number(rawGstAmount || 0).toFixed(2));

  // Determine GST percentage label
  const positiveRates = Array.from(new Set(mappedItems.map((it) => it.gstRate).filter((r): r is number => Boolean(r && r > 0))));
  let gstPercentLabel = "";
  if (calc.tax_groups && typeof calc.tax_groups === "object" && Object.keys(calc.tax_groups).length > 0) {
    gstPercentLabel = Object.keys(calc.tax_groups).map((k) => `${k}%`).join(", ");
  } else if (positiveRates.length > 0) {
    gstPercentLabel = positiveRates.map((r) => `${r}%`).join(", ");
  } else if (calc.tax_rate) {
    gstPercentLabel = `${calc.tax_rate}%`;
  }

  // CGST / SGST
  const cgst = calc.cgst !== undefined ? Number(calc.cgst) : Number((gstAmount / 2).toFixed(2));
  const sgst = calc.sgst !== undefined ? Number(calc.sgst) : Number((gstAmount / 2).toFixed(2));

  // Delivery Charge
  const deliveryCharge = Number(
    (charges.delivery_charge ??
      charges.delivery_charges ??
      charges.delivery_fee ??
      charges.shipping_charge ??
      addInfos.delivery_charge ??
      0)
  );

  // Discount
  const discount = Number(
    (calc.discount_amount ??
      calc.total_discount_given ??
      calc.discount ??
      charges.discount ??
      addInfos.discount_amount ??
      0)
  );

  // Subtotal (Taxable / Base amount excl. GST)
  const itemsSum = mappedItems.reduce((acc, it) => acc + it.total, 0);
  const rawSubtotal =
    calc.taxable_amount ??
    calc.base_subtotal ??
    calc.subtotal ??
    calc.sub_total ??
    itemInfos.total_order_amount ??
    (itemsSum > 0 ? itemsSum : (o.total_amount ?? o.total_sellprice ?? cardShape.totalAmount ?? 0));
  const subtotal = Number(Number(rawSubtotal).toFixed(2));

  // Grand Total
  let rawGrandTotal =
    calc.grand_total ??
    calc.total ??
    calc.gross ??
    o.total_sellprice ??
    o.total_amount ??
    dataObj.total_amount;

  if (rawGrandTotal === undefined || rawGrandTotal === null || Number(rawGrandTotal) === 0) {
    rawGrandTotal = subtotal + gstAmount + deliveryCharge - discount;
  } else {
    // If rawGrandTotal equals subtotal and GST was not included in it
    const numGrand = Number(rawGrandTotal);
    if (gstAmount > 0 && Math.abs(numGrand - subtotal) < 0.01) {
      rawGrandTotal = subtotal + gstAmount + deliveryCharge - discount;
    }
  }

  const grandTotal = Number(Number(rawGrandTotal).toFixed(2));

  return {
    ...cardShape,
    orderType: o.origin || cardShape.origin || "ONLINE",
    items: mappedItems,
    subtotal: isNaN(subtotal) ? 0 : subtotal,
    gstPercent: positiveRates[0] || 0,
    gstPercentLabel,
    gstAmount: isNaN(gstAmount) ? 0 : gstAmount,
    cgst: isNaN(cgst) ? 0 : cgst,
    sgst: isNaN(sgst) ? 0 : sgst,
    deliveryCharge: isNaN(deliveryCharge) ? 0 : deliveryCharge,
    discount: isNaN(discount) ? 0 : discount,
    grandTotal: isNaN(grandTotal) ? 0 : grandTotal,
    online_details:
      (o.online_details && Object.keys(o.online_details).length > 0)
        ? o.online_details
        : cardShape.online_details,
    status_updated_by: o.status_updated_by || addInfos.status_updated_by || addInfos.accepted_by || addInfos.canceled_by || addInfos.rejected_by || cardShape.status_updated_by || null,
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
  const [selectedOrder, setSelectedOrder] = useState<OrderDetailType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusCounts, setStatusCounts] = useState<{
    ALL: number;
    PENDING: number;
    ACCEPTED: number;
    OUT_FOR_DELIVERY: number;
    DELIVERED: number;
    CANCELED: number;
  }>({
    ALL: 0,
    PENDING: 0,
    ACCEPTED: 0,
    OUT_FOR_DELIVERY: 0,
    DELIVERED: 0,
    CANCELED: 0,
  });

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

  // Fetch overall counts across all statuses (independent of active status tab filter)
  useEffect(() => {
    if (!currentShopId) return;
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

        setStatusCounts({
          ALL: online.length,
          PENDING: online.filter((o) => (o.status || "").toUpperCase() === "PENDING").length,
          ACCEPTED: online.filter((o) => (o.status || "").toUpperCase() === "ACCEPTED").length,
          OUT_FOR_DELIVERY: online.filter((o) => (o.status || "").toUpperCase() === "OUT_FOR_DELIVERY").length,
          DELIVERED: online.filter((o) => (o.status || "").toUpperCase() === "DELIVERED").length,
          CANCELED: online.filter((o) => isCanceled((o.status || "").toUpperCase())).length,
        });
      }
    }).catch(console.error);
  }, [refreshKey, dateRange, currentShopId]);

  // Fetch orders according to the currently active status tab & filters
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
