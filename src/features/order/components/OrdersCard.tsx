import React from "react";
import { 
  Phone, 
  User, 
  IndianRupee, 
  Wifi, 
  Store, 
  Receipt, 
  ShoppingCart
} from "lucide-react";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";
import { OrderCardType } from "../types";

// Helper for status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case "COMPLETED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "PENDING": return "bg-amber-100 text-amber-700 border-amber-200";
    case "CANCELLED": return "bg-rose-100 text-rose-700 border-rose-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const OrdersCard: React.FC<{
  order: OrderCardType;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ order, setIsOpen }) => {
  
  const isOnline = order.orderType === "Online";

  return (
    <div 
      className="group relative z-0 w-full bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
    
      <div className={`h-1.5 w-full ${isOnline ? "bg-blue-500" : "bg-orange-500"}`} />

      <div className="flex flex-col md:flex-row">
        <div className="flex-1 p-5 relative">
          <div className="absolute right-0 bottom-0 z-0 opacity-[0.03] -mr-4 -mb-4 pointer-events-none">
            <ShoppingCart size={120} />
          </div>
          <div className="relative z-10"> 
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Bill #{order.billNo}
                  </span>

                  <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${isOnline ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-orange-50 text-orange-700 border-orange-100"}`}>
                    {isOnline ? <Wifi size={10} /> : <Store size={10} />}
                    {order.orderType}
                  </div>
                </div>
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-0.5">
                  <IndianRupee size={18} className="text-gray-400 mt-1" />
                  {order.totalAmount}
                </h3>
              </div>

              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div className="h-px w-full bg-gray-100 my-3" />

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gray-50 rounded-full text-gray-400">
                  <User size={14} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase">Customer</p>
                  <p className="text-sm font-semibold text-gray-700 leading-none">{order.customerName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gray-50 rounded-full text-gray-400">
                  <Phone size={14} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase">Contact</p>
                  <p className="text-sm font-semibold text-gray-700 leading-none">{order.phone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>


        <div className="md:w-[200px] bg-gray-50/50 p-4 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col gap-3 justify-center relative z-10">
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-1">Update Status</label>
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

          <div className="space-y-2">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-1">Order Type</label>
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

          <div className="pt-2">
            <GradientButton 
              onClick={() => setIsOpen(true)} 
              className="w-full text-xs h-9 shadow-sm"
            >
              View Details
            </GradientButton>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrdersCard;