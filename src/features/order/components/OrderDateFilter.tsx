import { Calendar } from "@/components/ui/calendar";



interface OrderDateFilterProps {
  value?: Date;
  onChange: (date?: Date) => void;
}

const OrderDateFilter: React.FC<OrderDateFilterProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      <Calendar
        mode="single"
        selected={value}
        onSelect={onChange}
     
          className="rounded-lg border [--cell-size:--spacing(11)] md:[--cell-size:--spacing(12)]"
      />

    </div>
  );
};

export default OrderDateFilter;
