import React from "react";
import { Phone, User, ShoppingBag, IndianRupee, Percent, Truck, Tag } from "lucide-react";
import { AntBadge } from "@/components/ui/AntBadge";

export type OrderItem = {
  name: string;
  qty: number;
  price: number;
  total: number;
  gst?: string;
  gstRate?: number;
  gstAmount?: number;
};

export type OrderDetailType = {
  billNo: string;
  customerName: string;
  phone: string;
  status: string;
  orderType: string;
  items: OrderItem[];
  subtotal: number;
  gstPercent: number;
  gstPercentLabel?: string;
  gstAmount: number;
  cgst?: number;
  sgst?: number;
  deliveryCharge?: number;
  discount?: number;
  grandTotal: number;
  online_details?: any;
  status_updated_by?: string;
  additional_infos?: any;
};

const OrderDetailView: React.FC<{ order: OrderDetailType }> = ({ order }) => {
  const gstAmt = Number(order.gstAmount || 0);
  const hasGst = gstAmt > 0;
  const cgstVal = order.cgst !== undefined ? order.cgst : Number((gstAmt / 2).toFixed(2));
  const sgstVal = order.sgst !== undefined ? order.sgst : Number((gstAmt / 2).toFixed(2));

  return (
    <div className="space-y-5 p-2 font-sans">

      {/* HEADER */}
      <div className="border-b border-slate-100 pb-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            Order #{order.billNo}
          </h2>
          <AntBadge variant="lb-brand" type="tag" className="uppercase font-mono font-bold text-xs">
            {order.orderType}
          </AntBadge>
        </div>
        <p className="text-slate-400 text-xs mt-0.5">Order summary, item breakdown and tax details</p>
      </div>

      {/* CUSTOMER DETAILS */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Customer Information
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2.5">
            <User className="text-slate-400 shrink-0" size={16} />
            <span className="font-semibold text-slate-800">{order.customerName}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Phone className="text-slate-400 shrink-0" size={16} />
            <span className="font-mono text-slate-700">{order.phone}</span>
          </div>
          
          {order.online_details?.full_address && (
            <div className="flex items-start gap-2.5 pt-2.5 border-t border-slate-100 text-xs text-slate-600">
              <span className="font-semibold text-slate-500 shrink-0">Address:</span>
              <span className="leading-relaxed">
                {order.online_details.full_address}
                {order.online_details.city ? `, ${order.online_details.city}` : ""}
                {order.online_details.state ? `, ${order.online_details.state}` : ""}
                {order.online_details.pincode ? ` - ${order.online_details.pincode}` : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ORDER SUMMARY */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Order Overview & Taxes
        </h3>

        <div className="grid grid-cols-2 gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Status:</span>
            <AntBadge 
              variant={
                order.status === "PENDING"
                  ? "pay-pending"
                  : order.status === "COMPLETED" || order.status === "DELIVERED"
                  ? "ps-completed"
                  : order.status === "CANCELED" || order.status === "REFUNDED"
                  ? "ps-cancelled"
                  : "tx-adjustment"
              } 
              type="pill" 
              dot
            >
              {order.status}
            </AntBadge>
          </div>

          <div>
            <span className="text-slate-500">Subtotal: </span>
            <span className="font-bold text-slate-800">₹{(order.subtotal || 0).toFixed(2)}</span>
          </div>

          <div className="col-span-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Percent size={13} className={hasGst ? "text-blue-500" : "text-slate-400"} />
                <span className="font-medium text-slate-600">
                  GST {order.gstPercentLabel ? `(${order.gstPercentLabel})` : ""}:
                </span>
              </div>
              <span className={`font-bold ${hasGst ? "text-blue-700" : "text-slate-500"}`}>
                {hasGst ? `₹${gstAmt.toFixed(2)}` : "₹0.00 (Non-GST)"}
              </span>
            </div>

            {hasGst && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                <span>Central Tax (CGST): <strong className="text-slate-700">₹{(cgstVal || 0).toFixed(2)}</strong></span>
                <span>State Tax (SGST): <strong className="text-slate-700">₹{(sgstVal || 0).toFixed(2)}</strong></span>
              </div>
            )}
          </div>
          {order.status_updated_by && (
            <div className="col-span-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span className="font-semibold text-slate-700">Updated by:</span> {order.status_updated_by}
            </div>
          )}
        </div>
      </div>

      {/* ORDER ITEMS */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-blue-600" size={16} />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Items Ordered ({order.items.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold">
                <th className="py-2.5 px-3.5">Product</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-2 text-right">Price</th>
                <th className="py-2.5 px-2 text-center">GST</th>
                <th className="py-2.5 px-3.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3.5 font-medium text-slate-800 max-w-[140px] truncate" title={item.name}>
                      {item.name}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-slate-600">
                      {item.qty}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-slate-600">
                      ₹{(item.price || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.gstRate && item.gstRate > 0
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {item.gst || (item.gstRate ? `${item.gstRate}%` : "0%")}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-bold text-slate-800 text-right font-mono">
                      ₹{(item.total || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No items available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GRAND TOTAL SUMMARY */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Billing Breakdown
        </h3>

        <div className="space-y-2 text-xs text-slate-600 pb-3 border-b border-slate-100">
          <div className="flex justify-between items-center">
            <span>Items Base Subtotal:</span>
            <span className="font-semibold text-slate-800 font-mono">₹{(order.subtotal || 0).toFixed(2)}</span>
          </div>

          {order.deliveryCharge !== undefined && order.deliveryCharge > 0 && (
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-slate-600">
                <Truck size={13} className="text-slate-400" />
                Delivery Fee:
              </span>
              <span className="font-semibold text-slate-800 font-mono">₹{(order.deliveryCharge || 0).toFixed(2)}</span>
            </div>
          )}

          {order.discount !== undefined && order.discount > 0 && (
            <div className="flex justify-between items-center text-emerald-600 font-medium">
              <span className="flex items-center gap-1.5">
                <Tag size={13} />
                Discount:
              </span>
              <span className="font-mono font-bold">-₹{(order.discount || 0).toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <Percent size={13} className="text-slate-400" />
              Total GST {order.gstPercentLabel ? `(${order.gstPercentLabel})` : ""}:
            </span>
            <span className="font-bold text-slate-800 font-mono">₹{gstAmt.toFixed(2)}</span>
          </div>

          {hasGst && (
            <div className="flex justify-between items-center text-[11px] text-slate-400 pl-4">
              <span>CGST: ₹{(cgstVal || 0).toFixed(2)}</span>
              <span>SGST: ₹{(sgstVal || 0).toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center text-base font-bold text-slate-900 pt-1">
          <span>Total Payable:</span>
          <span className="flex items-center gap-0.5 text-xl font-extrabold text-blue-600 font-mono">
            <IndianRupee size={18} strokeWidth={2.5} />
            {(order.grandTotal || 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailView;


