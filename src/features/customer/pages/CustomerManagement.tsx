import { StatCard } from "@/components/common/StatsCard";
import {
  ArrowLeft,
  Phone,
  Mail,
  Download,
  Plus,
} from "lucide-react";
import { BiLogoWhatsapp } from "react-icons/bi";

export default function CustomerProfile() {
  const customer = {
    name: "Rajapandi",
    phone: "+91 99887 76655",
    email: "rajapandi@example.com",
    outstanding: 15000,
    creditLimit: 30000,
    invoices: [
      {
        id: "1",
        invoiceNumber: "INV-001",
        date: "01 Mar",
        dueDate: "10 Mar",
        amount: 5000,
        balance: 5000,
        status: "Overdue",
      },
      {
        id: "2",
        invoiceNumber: "INV-002",
        date: "12 Mar",
        dueDate: "20 Mar",
        amount: 10000,
        balance: 10000,
        status: "Pending",
      },
      {
        id: "3",
        invoiceNumber: "INV-003",
        date: "15 Feb",
        dueDate: "25 Feb",
        amount: 10000,
        balance: 0,
        status: "Paid",
      },
    ],
  };

  const statusColor = (status: string) => {
    if (status === "Overdue") return "text-red-600 bg-red-50";
    if (status === "Pending") return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <div className="p-4 mx-auto">

      {/* Back */}
      <a
        href="/customers"
        className="flex items-center gap-1 text-gray-600 text-sm mb-4"
      >
        <ArrowLeft size={16} /> Back
      </a>

      {/* Customer Info */}
      <div className="border rounded-md p-4 mb-4 flex justify-between items-center">
        <div>
          <div className="text-lg">{customer.name}</div>

          <div className="flex gap-4 text-sm text-gray-600 mt-1">
            <span className="flex items-center gap-1">
              <Phone size={14} /> {customer.phone}
            </span>

            <span className="flex items-center gap-1">
              <Mail size={14} /> {customer.email}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-3 py-1 text-sm border border-blue-300 rounded">
            <BiLogoWhatsapp className="text-green-400" size={16} />
            Reminder
          </button>

          <button className="flex items-center gap-1 px-3 py-1 text-sm border border-blue-300 rounded">
            <Plus size={16} />
            Invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm max-w-2xl">

        <StatCard
        label="Outstanding"
        value={customer.outstanding}

        valueColor="red"
        />
        <StatCard
        label="Credit Limit"
        value={customer.creditLimit}
        valueColor=""
        />

      </div>

      {/* Invoice Table */}
      <div className="border rounded-md overflow-hidden">

        <div className="px-4 py-2 border-b text-sm bg-gray-50">
          Invoices
        </div>

        <table className="w-full text-sm">

          <thead className="text-gray-500 border-b">
            <tr>
              <th className="px-4 py-2 text-left">Invoice</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Amount</th>
              <th className="px-4 py-2 text-left">Balance</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>

          <tbody>
            {customer.invoices.map((inv) => (
              <tr key={inv.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 text-blue-600 cursor-pointer">
                  {inv.invoiceNumber}
                </td>

                <td className="px-4 py-2">
                  {inv.date}
                  <div className="text-xs text-gray-400">
                    Due {inv.dueDate}
                  </div>
                </td>

                <td className="px-4 py-2">₹{inv.amount}</td>

                <td className="px-4 py-2">
                  {inv.balance > 0 ? `₹${inv.balance}` : "-"}
                </td>

                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${statusColor(
                      inv.status
                    )}`}
                  >
                    {inv.status}
                  </span>
                </td>

                <td className="px-4 py-2 text-right">
                  <Download size={16} className="text-gray-500" />
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}