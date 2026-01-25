import React from "react";
import { OrdersHeaderProps } from "../types";
import { Calendar, ListFilter } from "lucide-react";
import ToggleSelect from "@/components/common/ToggleSelect";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";

const OrdersHeader: React.FC<OrdersHeaderProps> = ({
  orderType,
  setOrderType,
  orderTypeOptions,
  status,
  setStatus,
  setIsCalenderOpen,
}) => {
  return (
    <div className="w-full mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        
        {/* --- Left: Title & Icon --- */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gray-50 rounded-lg text-gray-500 border border-gray-100">
            <ListFilter size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              Filter Orders
            </h2>
            <p className="text-xs text-gray-400 font-medium">
              Refine your order list
            </p>
          </div>
        </div>

        {/* --- Right: Controls --- */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          
          {/* 1. Order Type Toggle */}
          <div className="w-full sm:w-auto">
            <ToggleSelect
              value={orderType}
              options={orderTypeOptions}
              onChange={setOrderType}
            />
          </div>

          {/* 2. Status Dropdown */}
          <div className="w-full sm:w-[180px]">
            <ReusableSelect
              placeholder="All Statuses"
              options={[
                { label: "Completed", value: "COMPLETED" },
                { label: "Pending", value: "PENDING" },
                { label: "Cancelled", value: "CANCELLED" },
              ]}
              value={status}
              onValueChange={setStatus}
            />
          </div>

          {/* 3. Calendar Filter Button */}
          <div className="w-full sm:w-auto">
            <GradientButton
              onClick={() => setIsCalenderOpen(true)}
              variant="outline"
              className="w-full justify-center sm:w-auto"
            >
              <Calendar size={18} className="mr-2 text-gray-500" />
            </GradientButton>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default OrdersHeader;