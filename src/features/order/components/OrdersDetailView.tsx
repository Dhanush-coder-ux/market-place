import React from "react";
import { Phone, User, ShoppingBag, IndianRupee } from "lucide-react";
import { AntBadge } from "@/components/ui/AntBadge";

type OrderItem = {
  name: string;
  qty: number;
  price: number;
  total: number;
};

type OrderDetailType = {
  billNo: string;
  customerName: string;
  phone: string;
  status: string;
  orderType: string;
  items: OrderItem[];
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  grandTotal: number;
};

const OrderDetailView: React.FC<{ order: OrderDetailType }> = ({ order }) => {
  return (
    <div className="space-y-6 p-2">

      {/* HEADER */}
      <div className="mb-4 border-b pb-3">
        <h2 className="text-2xl font-bold text-gray-800">
          Order Details – {order.billNo}
        </h2>
        <p className="text-gray-500 text-sm">View customer order summary</p>
      </div>

      {/* CUSTOMER DETAILS */}
      <div className="bg-white rounded-lg shadow border p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-400  ">
          Customer Details
        </h3>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="text-gray-500" size={18} />
            <span className="font-medium text-gray-700">{order.customerName}</span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="text-gray-500" size={18} />
            <span className="font-medium text-gray-700">{order.phone}</span>
          </div>
        </div>
      </div>

      {/* ORDER SUMMARY */}
      <div className="bg-white rounded-lg shadow border p-5 space-y-3">
        <h3 className="text-sm font-bold text-gray-400  ">
          Order Summary
        </h3>

        <div className="grid grid-cols-2 gap-4 text-gray-700 text-sm items-center">
          <p className="flex items-center gap-2">Status: 
            <AntBadge 
              variant={order.status === "PENDING" ? "pay-pending" : order.status === "COMPLETED" ? "ps-completed" : order.status === "CANCELED" || order.status === "REFUNDED" ? "ps-cancelled" : order.status === "EXCHANGED" ? "tx-adjustment" : "lb-brand"} 
              type="pill" 
              dot
            >
              {order.status}
            </AntBadge>
          </p>
          <p className="flex items-center gap-2">Type: 
            <AntBadge variant="lb-brand" type="tag">{order.orderType}</AntBadge>
          </p>
          <p>Subtotal: <span className="font-semibold">₹{order.subtotal}</span></p>
          <p>GST: <span className="font-semibold">{order.gstPercent}% (₹{order.gstAmount})</span></p>
        </div>
      </div>

      {/* ORDER ITEMS */}
      <div className="bg-white rounded-lg shadow border p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="text-blue-500" size={18} />
          <h3 className="text-sm font-bold text-gray-400  ">
            Order Items
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-sm">
                <th className="p-3 font-semibold">Product</th>
                <th className="p-3 font-semibold">Qty</th>
                <th className="p-3 font-semibold">Price</th>
                <th className="p-3 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.qty}</td>
                  <td className="p-3">₹{item.price}</td>
                  <td className="p-3 font-semibold">₹{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GRAND TOTAL */}
      <div className="bg-white rounded-lg shadow border p-5">
        <h3 className="text-sm font-bold text-gray-400   mb-2">
          Grand Total
        </h3>

        <div className="flex justify-between items-center text-lg font-bold text-gray-900">
          <span>Total Payable:</span>
          <span className="flex items-center gap-1">
            <IndianRupee size={20} />
            {order.grandTotal}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailView;

