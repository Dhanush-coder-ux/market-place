
import { 
  Phone, 
  User, 
  IndianRupee, 
  Wifi, 
  Store, 
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { OrderCardType } from "../types";

const statusConfig = {
  COMPLETED: {
    icon: CheckCircle2,
    bg: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200",
    dot: "bg-emerald-400",
    pulse: false,
    ctaOnline: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300",
    ctaOffline: "bg-orange-500 hover:bg-orange-600 shadow-orange-200 hover:shadow-orange-300",
  },
  PENDING: {
    icon: Clock,
    bg: "bg-amber-500",
    pill: "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
    dot: "bg-amber-400",
    pulse: true,
    ctaOnline: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300",
    ctaOffline: "bg-orange-500 hover:bg-orange-600 shadow-orange-200 hover:shadow-orange-300",
  },
  CANCELLED: {
    icon: XCircle,
    bg: "bg-rose-500",
    pill: "bg-rose-50 text-rose-600 ring-1 ring-rose-200",
    dot: "bg-rose-400",
    pulse: false,
    ctaOnline: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300",
    ctaOffline: "bg-orange-500 hover:bg-orange-600 shadow-orange-200 hover:shadow-orange-300",
  },
};

const OrdersCard: React.FC<{
  order: OrderCardType;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ order, setIsOpen }) => {
  const isOnline = order.orderType === "Online";
  const status = statusConfig[order.status as keyof typeof statusConfig] ?? statusConfig.PENDING;

  return (
    <div
      className="relative w-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Top dual-color accent bar */}
      <div className="flex items-stretch h-1">
        <div className={`flex-1 ${isOnline ? "bg-indigo-500" : "bg-orange-400"}`} />
        <div className={`w-14 ${status.bg}`} />
      </div>

      <div className="p-5 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide ${isOnline ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100" : "bg-orange-50 text-orange-600 ring-1 ring-orange-100"}`}>
              {isOnline ? <Wifi size={10} strokeWidth={2.5} /> : <Store size={10} strokeWidth={2.5} />}
              {order.orderType}
            </span>
            <span className="text-[11px] font-medium text-gray-400">#{order.billNo}</span>
          </div>

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${status.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${status.pulse ? "animate-pulse" : ""}`} />
            {order.status}
          </span>
        </div>

        {/* Amount */}
        <div className="mb-5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total Amount</p>
          <div className="flex items-baseline gap-0.5">
            <IndianRupee size={22} className="text-gray-900 mb-0.5" strokeWidth={2.5} />
            <span className="text-3xl font-black text-gray-900 tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>
              {order.totalAmount}
            </span>
          </div>
        </div>

        <div className="h-px bg-gray-100 mb-4" />

        {/* Customer info */}
        <div className="flex gap-4 mb-5">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <User size={9} strokeWidth={2.5} /> Customer
            </p>
            <p className="text-sm font-bold text-gray-800 truncate">{order.customerName}</p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Phone size={9} strokeWidth={2.5} /> Contact
            </p>
            <p className="text-sm font-bold text-gray-800 truncate">{order.phone}</p>
          </div>
        </div>

        {/* Selects */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <ReusableSelect
              options={[
                { label: "Completed", value: "COMPLETED" },
                { label: "Pending", value: "PENDING" },
                { label: "Cancelled", value: "CANCELLED" },
              ]}
              value={order.status}
              onValueChange={() => {}}
              placeholder="Status"
            />
          </div>
          <div className="flex-1">
            <ReusableSelect
              options={[
                { label: "Online", value: "Online" },
                { label: "Offline", value: "Offline" },
              ]}
              value={order.orderType}
              onValueChange={() => {}}
              placeholder="Type"
            />
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => setIsOpen(true)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold tracking-wide text-white transition-all duration-200 shadow-sm ${isOnline ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300 hover:shadow-md" : "bg-orange-500 hover:bg-orange-600 shadow-orange-200 hover:shadow-orange-300 hover:shadow-md"}`}
        >
          View Details
          <ArrowRight size={15} strokeWidth={2.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};

export default OrdersCard;