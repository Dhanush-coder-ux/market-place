import GradientButton from "@/components/ui/GradientButton";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { options } from "@/features/billing/components/BillingHeader";
import { Phone, User, IndianRupee, CircleDot, Printer } from "lucide-react";
import React from "react";
import { OrderCardType } from "../types";


const OrdersCard: React.FC<{
   order: OrderCardType,
   setIsOpen : React.Dispatch<React.SetStateAction<boolean>>
  }> = ({ order, setIsOpen }) => {

  return (

      <div
        className={`bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 
          p-6 flex items-start justify-between gap-6 relative overflow-hidden`}
      >
        <div
          className={`absolute left-0 top-0 w-2 h-full rounded-l-2xl ${
            order.orderType === "Online" ? "bg-green-500" : "bg-orange-500"
          }`}
        />

        {/* Left Section */}
        <div className="space-y-4 w-full">
          {/* Order Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Printer size={22} className="text-blue-600" />
              <p className="text-gray-800 text-lg font-semibold">
                Bill No: {order.billNo}
              </p>
            </div>

            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                order.orderType === "Online"
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {order.orderType}
            </span>
          </div>

          {/* Customer Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User size={18} className="text-gray-500" />
              <span className="font-medium text-gray-700">{order.customerName}</span>
            </div>

            <div className="flex items-center gap-2">
              <Phone size={18} className="text-gray-500" />
              <span className="font-medium text-gray-700">{order.phone}</span>
            </div>

            <div className="flex items-center gap-2">
              <IndianRupee size={18} className="text-gray-500" />
              <span className="font-semibold text-gray-800 text-base">
                Total Amount: {order.totalAmount}
              </span>
            </div>
          </div>
        </div>

        {/* Right side select options */}
        <div className="flex flex-col gap-3 min-w-[180px]">
          <ReusableSelect
            options={options}
            value={order.status}
            onValueChange={() => ""}
            placeholder="Select Status"
          />

          <ReusableSelect
            options={[
              {
                label: "Online",
                value: "Online",
                icon: <CircleDot size={16} color="green" />,
              },
              {
                label: "Offline",
                value: "Offline",
                icon: <CircleDot size={16} color="orange" />,
              },
            ]}
            value={order.orderType}
            onValueChange={() => ("")}
            placeholder="Select Origin"
          />

          <GradientButton onClick={()=> setIsOpen(true)} className="w-full mt-1">View More...</GradientButton>
        </div>
      </div>

  );
};

export default OrdersCard;
