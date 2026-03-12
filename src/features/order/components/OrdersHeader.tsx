import React from "react";
import { OrdersHeaderProps } from "../types";
import { 
  Calendar, 
  ListFilter, 
  Inbox, 
  CheckCircle, 
  Truck, 
  PackageCheck, 
  XCircle 
} from "lucide-react";

// Define the pipeline stages with corresponding icons
const pipelineTabs = [
  { label: "All Orders", value: "ALL", icon: ListFilter },
  { label: "Incoming", value: "INCOMING", icon: Inbox },
  { label: "Accepted", value: "ACCEPTED", icon: CheckCircle },
  { label: "Out for Delivery", value: "OUT_FOR_DELIVERY", icon: Truck },
  { label: "Delivered", value: "DELIVERED", icon: PackageCheck },
  { label: "Rejected", value: "REJECTED", icon: XCircle },
];

const OrdersHeader: React.FC<OrdersHeaderProps> = ({
  status,
  setStatus,
  setIsDateFilterOpen 
}) => {
  // Treat an empty or null status as "ALL"
  const currentStatus = status || "ALL";

  return (
    <div className="w-full flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 font-sans">
      
      {/* --- Left: Segmented Pipeline Tabs --- */}
      <div className="w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/60 min-w-max">
          {pipelineTabs.map((tab) => {
            const isActive = currentStatus === tab.value;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value === "ALL" ? "" : tab.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"
                }`}
              >
                <Icon size={14} strokeWidth={isActive ? 2 : 1.5} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- Right: Date Filter Button --- */}
      <button
        onClick={() => setIsDateFilterOpen(true)}
        className="w-full xl:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-all text-[13px] font-medium shrink-0"
      >
        <Calendar size={16} strokeWidth={2} />
        <span>Filter by Date</span>
      </button>

    </div>
  );
};

export default OrdersHeader;