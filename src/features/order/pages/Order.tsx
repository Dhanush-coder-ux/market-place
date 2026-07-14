import { useState, useEffect } from "react";
import {
  Package, LayoutGrid, List, Inbox, Truck, PackageCheck, X,
} from "lucide-react";
import OrdersHeader from "../components/OrdersHeader";
import OrdersCard from "../components/OrdersCard";
import Drawer from "@/components/common/Drawer";
import OrderDetailView from "../components/OrdersDetailView";
import { DateFilter } from "../components/DateFilter";
import { StatCard } from "@/components/common/StatsCard";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import { useApi } from "@/context/ApiContext";
import { SHOP_ID } from "@/services/endpoints";
import { orderApi } from "@/services/api/order";
import type { OrderRecord } from "@/types/api";

const toCardShape = (o: OrderRecord) => ({
  billNo: o.ui_id || o.id,
  customerName: o.customer_name ?? String(o.datas?.customer_name ?? "Unknown"),
  phone: o.customer_number ?? String(o.datas?.phone ?? "—"),
  totalAmount: Number(o.datas?.total_amount ?? 0),
  status: o.status ?? "INCOMING",
});

const Order = () => {
  const { loading, error, clearError } = useApi();

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [status, setStatus] = useState("INCOMING");
  const [isOpen, setIsOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [refreshKey] = useState(0);

  useEffect(() => {
    orderApi.getOrdersByShop(SHOP_ID, { limit: "50", offset: "1" }).then((res: any) => {
      if (res) setOrders(Array.isArray(res.data) ? res.data : [res.data]);
    }).catch(console.error);
  }, [refreshKey]);

  const handleStatusChange = async (newStatus: string, originalOrder: OrderRecord) => {
    try {
      const payload = {
        shop_id: SHOP_ID,
        session_id: (originalOrder as any).session_id || "",
        customer_id: (originalOrder as any).customer_id || "",
        status: newStatus,
        origin: (originalOrder as any).origin || "ONLINE",
        type: (originalOrder as any).type || "",
        calculation_infos: (originalOrder as any).calculation_infos || {},
        charges_infos: (originalOrder as any).charges_infos || {},
        payment_infos: (originalOrder as any).payment_infos || [],
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

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;
    try {
      const res = await orderApi.deleteOrder(SHOP_ID, orderId);
      if (res) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
      }
    } catch (e) {
      console.error("Failed to delete order", e);
    }
  };

  const handleOpenDetails = async (order: OrderRecord) => {
    try {
      const res = await orderApi.getOrderById(SHOP_ID, order.id);
      if (res?.data) {
        const fullOrder = Array.isArray(res.data) ? res.data[0] : res.data;
        const mappedItems = (fullOrder.items || []).map((i: any) => ({
          name: i.product_name || i.datas?.product_name || `Item ${i.product_id?.slice(-4)}`,
          qty: i.quantity,
          price: i.sell_price || 0,
          total: (i.sell_price || 0) * i.quantity
        }));
        
        setSelectedOrder({
          ...toCardShape(order),
          orderType: fullOrder.origin || "ONLINE",
          items: mappedItems,
          subtotal: Number(fullOrder.calculation_infos?.sub_total || order.datas?.total_amount || 0),
          gstPercent: 0,
          gstAmount: Number(fullOrder.calculation_infos?.total_tax || 0),
          grandTotal: Number(fullOrder.calculation_infos?.grand_total || order.datas?.total_amount || 0),
        });
        setIsOpen(true);
        return;
      }
    } catch (e) {
      console.error("Failed to fetch full order details", e);
    }
    
    // Fallback if fetch fails
    setSelectedOrder({
      ...toCardShape(order),
      orderType: order.origin || "ONLINE",
      items: [],
      subtotal: Number(order.datas?.total_amount || 0),
      gstPercent: 0,
      gstAmount: 0,
      grandTotal: Number(order.datas?.total_amount || 0),
    });
    setIsOpen(true);
  };

  const filteredOrders = status === "ALL"
    ? orders
    : orders.filter((o) => o.status === status);

  const totalOrders = orders.length;
  const incoming = orders.filter((o) => o.status === "INCOMING").length;
  const outForDelivery = orders.filter((o) => o.status === "OUT_FOR_DELIVERY").length;
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans">
      <div className="space-y-4">

        <div className="flex-none overflow-x-auto pb-1">
          <div className="flex gap-4 min-w-max">
            <StatCard label="Total Orders" value={totalOrders} icon={Package} iconBg="bg-slate-100" iconColor="text-slate-600" />
            <StatCard label="Incoming" value={incoming} icon={Inbox} iconBg="bg-amber-50" iconColor="text-amber-600" />
            <StatCard label="Out for Delivery" value={outForDelivery} icon={Truck} iconBg="bg-purple-50" iconColor="text-purple-600" />
            <StatCard label="Delivered" value={delivered} icon={PackageCheck} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          </div>
        </div>

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
        />

        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{filteredOrders.length}</span> orders
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
            {filteredOrders.map((order) => (
              <OrdersCard
                key={order.id}
                order={toCardShape(order)}
                setIsOpen={() => handleOpenDetails(order)}
                viewMode={viewMode}
                onStatusChange={(newStatus) => handleStatusChange(newStatus, order)}
                onDeleteClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }}
              />
            ))}
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

      <DateFilter isOpen={open} onClose={() => setOpen(false)} onApply={(range) => { console.log(range); setOpen(false); }} />
    </div>
  );
};

export default Order;

