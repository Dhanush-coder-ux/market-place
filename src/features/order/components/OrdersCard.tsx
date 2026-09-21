import { 
  Phone, User, IndianRupee, Wifi, ArrowRight, 
  Truck
} from "lucide-react";
import { AntBadge } from "@/components/ui/AntBadge";

const statusConfig: Record<string, string> = {
  PENDING: "pay-pending",
  PROCESSING: "lb-brand",
  COMPLETED: "ps-completed",
  ACCEPTED: "ps-completed",
  CANCELED: "ps-cancelled",
  REFUNDED: "ps-cancelled",
  EXCHANGED: "tx-adjustment",
  DELIVERED: "ps-completed",
  OUT_FOR_DELIVERY: "tx-adjustment",
};

interface OrdersCardProps {
  order: any;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  viewMode?: "grid" | "list";
  onStatusChange?: (newStatus: string) => void;
  onVerifyDelivery?: () => void;
}

const DeliveryBadge = ({ onClick }: { onClick?: () => void }) => (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    title="Verify Delivery — click to confirm"
    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-wider hover:bg-amber-100 hover:border-amber-300 transition-all duration-200 animate-pulse hover:animate-none"
  >
    <Truck size={10} strokeWidth={2.5} />
    Verify
  </button>
);

const OrdersCard: React.FC<OrdersCardProps> = ({ order, setIsOpen, viewMode = "grid", onStatusChange, onVerifyDelivery }) => {
  const variant = statusConfig[order.status] ?? "ps-draft";
  const showDeliveryVerify = order.origin === "ONLINE" && !["COMPLETED", "CANCELED", "REFUNDED", "DELIVERED"].includes(order.status);

  const renderActions = (isGrid: boolean) => {
    const btnBase = `flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95 ${isGrid ? 'flex-1' : ''}`;
    
    if (order.status === "PENDING") {
      return (
        <div className={`flex gap-2 ${isGrid ? 'w-full' : ''}`}>
          <button onClick={() => onStatusChange?.("ACCEPTED")} className={`${btnBase} bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-500 hover:text-white`}>Accept</button>
          <button onClick={() => onStatusChange?.("CANCELED")} className={`${btnBase} bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white`}>Cancel</button>
        </div>
      );
    }
    if (order.status === "ACCEPTED") {
      return (
        <div className={`flex gap-2 ${isGrid ? 'w-full' : ''}`}>
          <button onClick={() => onStatusChange?.("OUT_FOR_DELIVERY")} className={`${btnBase} bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-500 hover:text-white`}>Out for Delivery</button>
          <button onClick={() => onStatusChange?.("CANCELED")} className={`${btnBase} bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white`}>Cancel</button>
        </div>
      );
    }
    if (order.status === "OUT_FOR_DELIVERY") {
      return (
        <div className={`flex gap-2 ${isGrid ? 'w-full' : ''}`}>
          <button onClick={() => onStatusChange?.("DELIVERED")} className={`${btnBase} bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white`}>Delivered</button>
        </div>
      );
    }
    return null;
  };

  // ─── HORIZONTAL LIST VIEW ──────────────────────────────────────────────────
  if (viewMode === "list") {
    return (
      <div className="w-full bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group font-sans flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
        
        {/* Left Section */}
        <div className="flex items-center gap-6 min-w-[240px]">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <AntBadge variant="lb-brand" type="tag" icon={<Wifi size={10} strokeWidth={2} />}>Online</AntBadge>
              {showDeliveryVerify && <DeliveryBadge onClick={onVerifyDelivery} />}
            </div>
            <p className="text-xs font-normal text-slate-400 mb-0.5">#{order.billNo}</p>
            <div className="flex items-baseline gap-0.5">
              <IndianRupee size={14} className="text-slate-800" strokeWidth={2} />
              <span className="text-xl font-medium text-slate-800">
                {order.totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
        <div>
          <AntBadge variant={variant} type="pill" dot pulse={order.status === "PENDING"}>
            {order.status.replace(/_/g, " ")}
          </AntBadge>
        </div>
        {/* Middle Section: Customer */}
        <div className="flex flex-col gap-2 flex-1 md:border-l md:border-slate-100 md:pl-6 min-w-[200px]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <User size={12} className="text-slate-400" strokeWidth={2} />
            </div>
            <p className="text-sm font-medium text-slate-800 truncate">{order.customerName}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <Phone size={12} className="text-slate-400" strokeWidth={2} />
            </div>
            <p className="text-xs font-medium text-slate-500 truncate">{order.phone}</p>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-3 shrink-0 md:border-l md:border-slate-100 md:pl-6 w-full md:w-auto mt-2 md:mt-0">
          <div className="hidden sm:block">
            {renderActions(false)}
          </div>
          
          <div className="sm:hidden mr-auto">
            <AntBadge variant={variant} type="pill" dot pulse={order.status === "PENDING"}>
              {order.status.replace(/_/g, " ")}
            </AntBadge>
          </div>


          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200 whitespace-nowrap"
          >
            Details
            <ArrowRight size={14} strokeWidth={2} className="transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>

      </div>
    );
  }

  // ─── VERTICAL GRID VIEW ────────────────────────────────────────────────────
  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group font-sans">
      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <AntBadge variant="lb-brand" type="tag" icon={<Wifi size={10} strokeWidth={2} />}>Online</AntBadge>
            <span className="text-xs font-normal text-slate-400">#{order.billNo}</span>
            {showDeliveryVerify && <DeliveryBadge onClick={onVerifyDelivery} />}
          </div>

          <div>
            <AntBadge variant={variant} type="pill" dot pulse={order.status === "PENDING"}>
              {order.status.replace(/_/g, " ")}
            </AntBadge>
          </div>
        </div>

        <div className="mb-5">
          <p className="text-[10px] font-medium text-slate-400 mb-1">Total Amount</p>
          <div className="flex items-baseline gap-0.5">
            <IndianRupee size={20} className="text-slate-800" strokeWidth={2} />
            <span className="text-3xl font-medium text-slate-800 tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>
              {order.totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="h-px bg-slate-100 mb-4" />

        <div className="flex gap-4 mb-5">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
              <User size={12} strokeWidth={2} /> Customer
            </p>
            <p className="text-sm font-medium text-slate-800 truncate">{order.customerName}</p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Phone size={12} strokeWidth={2} /> Contact
            </p>
            <p className="text-sm font-medium text-slate-800 truncate">{order.phone}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {renderActions(true)}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200"
            >
              View Details
              <ArrowRight size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersCard;
