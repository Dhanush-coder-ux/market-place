import {
  ReceiptText,
  User,
  CreditCard,
  Printer,
} from "lucide-react";
import { useState } from "react";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";
import { InfoCard } from "./InfoCard";

const BillingDetailView = () => {
  const [paymentType, setPaymentType] = useState<"Online" | "Offline">("Online");
  const [status, setStatus] = useState<"COMPLETED" | "PENDING" | "CANCELLED">(
    "COMPLETED"
  );

  const billingInfo = {
    billNo: "BILL-10245",
    date: "12 Jan 2025",
    customerName: "John Doe",
    phone: "+91 98765 43210",
    gstPercent: 18,
    items: [
      { code: "PRD001", name: "Blue T-Shirt", qty: 2, price: 499 },
      { code: "PRD003", name: "Formal Shoes", qty: 1, price: 1999 },
    ],
  };

  const subTotal = billingInfo.items.reduce(
    (sum, i) => sum + i.qty * i.price,
    0
  );
  const gstAmt = (subTotal * billingInfo.gstPercent) / 100;
  const totalAmt = subTotal + gstAmt;

  return (
    <div className="max-w-7xl mx-auto  space-y-8">

      {/* ===== Invoice Header ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-blue-500 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/70">
              Invoice
            </p>
            <h1 className="text-3xl font-black tracking-tight">
              {billingInfo.billNo}
            </h1>
            <p className="text-sm text-white/80 mt-1">
              Issued on {billingInfo.date}
            </p>
          </div>

          <span
            className={`self-start px-4 py-2 rounded-full text-xs font-black tracking-wide
            ${status === "COMPLETED" && "bg-green-400/20 text-green-200"}
            ${status === "PENDING" && "bg-orange-400/20 text-orange-200"}
            ${status === "CANCELLED" && "bg-red-400/20 text-red-200"}
          `}
          >
            ● {status}
          </span>
        </div>
      </div>

      {/* ===== Amount Hero ===== */}
      <div className="rounded-3xl bg-white shadow-lg border p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400">
            Total Payable
          </p>
          <h2 className="text-4xl font-black text-gray-900">
            ₹{totalAmt.toLocaleString()}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Includes ₹{gstAmt.toFixed(2)} GST ({billingInfo.gstPercent}%)
          </p>
        </div>

        <div className="flex gap-3">
          <GradientButton  icon={<Printer size={18} />} variant="outline">
              Generate Billing
          </GradientButton>
        </div>
      </div>

      {/* ===== Meta Info ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
     

        <InfoCard title="Customer" icon={<User size={20} />}>
          <p className="font-bold">{billingInfo.customerName}</p>
          <p className="text-xs text-gray-500">{billingInfo.phone}</p>
        </InfoCard>

           <InfoCard title="Billing Status" icon={<ReceiptText size={20} />}>
          <div className="flex justify-between text-sm">
     
          </div>
          <ReusableSelect
            placeholder="Status"
            value={status}
            onValueChange={(value: string) => setStatus(value as any)}
            options={[
              { label: "COMPLETED", value: "COMPLETED" },
              { label: "PENDING", value: "PENDING" },
              { label: "CANCELLED", value: "CANCELLED" },
            ]}
          />
        </InfoCard>
        <InfoCard title="Origin Status" icon={<CreditCard size={20} />}>
          <div className="flex bg-gray-100 rounded-full p-1">
            {["Online", "Offline"].map(type => (
              <button
                key={type}
                onClick={() => setPaymentType(type as any)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition
                  ${paymentType === type
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-500"
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </InfoCard>
      </div>

      {/* ===== Items Table ===== */}
      <div className="bg-white rounded-3xl shadow border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs text-gray-400">Code</th>
              <th className="px-6 py-4 text-left text-xs text-gray-400">
                Product
              </th>
              <th className="px-6 py-4 text-center text-xs text-gray-400">
                Qty
              </th>
              <th className="px-6 py-4 text-right text-xs text-gray-400">
                Price
              </th>
              <th className="px-6 py-4 text-right text-xs text-gray-400">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {billingInfo.items.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm text-blue-600 font-mono">
                  {item.code}
                </td>
                <td className="px-6 py-4 font-medium">{item.name}</td>
                <td className="px-6 py-4 text-center">{item.qty}</td>
                <td className="px-6 py-4 text-right text-gray-500">
                  ₹{item.price}
                </td>
                <td className="px-6 py-4 text-right font-semibold">
                  ₹{item.qty * item.price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ===== Sticky Total ===== */}
        <div className="sticky bottom-0 bg-white border-t p-6">
          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase">Grand Total</p>
              <p className="text-2xl font-black text-blue-600">
                ₹{totalAmt.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDetailView;
