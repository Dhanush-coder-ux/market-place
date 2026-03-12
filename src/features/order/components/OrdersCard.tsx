import { 
  Phone, User, IndianRupee, Wifi, ArrowRight, 
  Inbox, CheckCircle, XCircle, Truck, PackageCheck 
} from "lucide-react";
import { ReusableSelect } from "@/components/ui/ReusableSelect";

// 1. New Order Lifecycle Configuration
const statusConfig = {
  INCOMING: { icon: Inbox, pill: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500", pulse: true },
  ACCEPTED: { icon: CheckCircle, pill: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500", pulse: false },
  REJECTED: { icon: XCircle, pill: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500", pulse: false },
  OUT_FOR_DELIVERY: { icon: Truck, pill: "bg-purple-50 text-purple-700 ring-purple-200", dot: "bg-purple-500", pulse: true },
  DELIVERED: { icon: PackageCheck, pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", pulse: false },
};

interface OrdersCardProps {
  order: any;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  viewMode?: "grid" | "list";
}

const OrdersCard: React.FC<OrdersCardProps> = ({ order, setIsOpen, viewMode = "grid" }) => {
  // Fallback to INCOMING if status is missing
  const status = statusConfig[order.status as keyof typeof statusConfig] ?? statusConfig.INCOMING;

  // ─── HORIZONTAL LIST VIEW ──────────────────────────────────────────────────
  if (viewMode === "list") {
    return (
      <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group font-sans flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
        
        {/* Left Section */}
        <div className="flex items-center gap-6 min-w-[240px]">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 mb-1.5 rounded-md text-[10px] font-medium tracking-wide bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100/50">
              <Wifi size={10} strokeWidth={2} />
              Online
            </span>
            <p className="text-xs font-normal text-slate-400 mb-0.5">#{order.billNo}</p>
            <div className="flex items-baseline gap-0.5">
              <IndianRupee size={14} className="text-slate-800" strokeWidth={2} />
              <span className="text-xl font-medium text-slate-800" >
                {order.totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
        <div>
           <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ring-1 ${status.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${status.pulse ? "animate-pulse" : ""}`} />
            {order.status.replace(/_/g, " ")}
          </span>
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
          <div className="w-40 hidden sm:block">
            <ReusableSelect
              options={[
                { label: "Incoming", value: "INCOMING" },
                { label: "Accepted", value: "ACCEPTED" },
                { label: "Rejected", value: "REJECTED" },
                { label: "Out for Delivery", value: "OUT_FOR_DELIVERY" },
                { label: "Delivered", value: "DELIVERED" },
              ]}
              value={order.status}
              onValueChange={() => {}}
              placeholder="Update Status"
            />
          </div>
          
          <span className={`sm:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ring-1 mr-auto ${status.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${status.pulse ? "animate-pulse" : ""}`} />
            {order.status.replace(/_/g, " ")}
          </span>

          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-200 whitespace-nowrap"
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
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group font-sans">
      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium tracking-wide bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100/50">
              <Wifi size={12} strokeWidth={2} />
              Online
            </span>
            <span className="text-xs font-normal text-slate-400">#{order.billNo}</span>
          </div>

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ring-1 ${status.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${status.pulse ? "animate-pulse" : ""}`} />
            {order.status.replace(/_/g, " ")}
          </span>
        </div>

        <div className="mb-5">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Total Amount</p>
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
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User size={12} strokeWidth={2} /> Customer
            </p>
            <p className="text-sm font-medium text-slate-800 truncate">{order.customerName}</p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Phone size={12} strokeWidth={2} /> Contact
            </p>
            <p className="text-sm font-medium text-slate-800 truncate">{order.phone}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <ReusableSelect
            options={[
              { label: "Incoming", value: "INCOMING" },
              { label: "Accepted", value: "ACCEPTED" },
              { label: "Rejected", value: "REJECTED" },
              { label: "Out for Delivery", value: "OUT_FOR_DELIVERY" },
              { label: "Delivered", value: "DELIVERED" },
            ]}
            value={order.status}
            onValueChange={() => {}}
            placeholder="Update Status"
          />

          <button
            onClick={() => setIsOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-200"
          >
            View Details
            <ArrowRight size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdersCard;