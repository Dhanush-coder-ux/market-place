import ToggleSelect from "@/components/common/ToggleSelect";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { options } from "@/features/billing/components/BillingHeader";
import { OrdersHeaderProps } from "../types";
import OrderDateFilter from "./OrderDateFilter";
import GradientButton from "@/components/ui/GradientButton";
import { Calendar as CalendarIcon} from "lucide-react";
import { useState } from "react";

const OrdersHeader: React.FC<OrdersHeaderProps> = ({
  orderType,
  setOrderType,
  orderTypeOptions,
  status,
  setStatus,
  selectedDate,
  setSelectedDate,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <div className="w-full space-y-4">

      {/* Header Row */}
      <div className="card p-6 card-hover flex items-center gap-6 justify-between">

        <ReusableSelect
          placeholder="Order Status"
          options={options}
          value={status}
          onValueChange={setStatus}
        />

        <ToggleSelect
          value={orderType}
          options={orderTypeOptions}
          onChange={setOrderType}
        />

        <GradientButton
          onClick={() => setShowCalendar((prev) => !prev)}
          icon={<CalendarIcon size={20} />}
        >
          Filter by Date
        </GradientButton>
      </div>

     
      <div
        className={`transition-all duration-300 overflow-hidden ${
          showCalendar ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="card p-4 w-full">

      
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm text-gray-700">
              Select Order Date
            </p>

            {selectedDate && (
              <button
                onClick={() => setSelectedDate(undefined)}
                className="text-xs text-red-500 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          <OrderDateFilter
            value={selectedDate}
            onChange={setSelectedDate}
          />
        </div>
      </div>
    </div>
  );
};

export default OrdersHeader;
