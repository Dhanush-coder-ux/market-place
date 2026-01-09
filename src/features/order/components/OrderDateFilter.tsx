import { Calendar } from "@/components/ui/calendar";
import React from "react";
import { type DateRange } from "react-day-picker";

interface OrderDateFilterProps {
  value?: Date;
  onChange: (date?: Date) => void;
}

const OrderDateFilter: React.FC<OrderDateFilterProps> = ({
 
}) => {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
   { from: new Date(), to: new Date()}
  );
  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      <Calendar
        mode="range"
        selected={dateRange}
        onSelect={setDateRange}
        defaultMonth={dateRange?.from}
        numberOfMonths={2}
          className="rounded-lg border [--cell-size:--spacing(11)] md:[--cell-size:--spacing(12)]"
      />

    </div>
  );
};

export default OrderDateFilter;
