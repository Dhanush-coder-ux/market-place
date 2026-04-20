import { useState } from "react";
import {
  Phone,
  Globe,
  MapPin,
  Mail,
  ShoppingBag,
  CreditCard,
  History,
  Info,
  Package,
  CheckCircle2,
} from "lucide-react";
import { StatsCard } from "@/components/common/StatsCard";

/* ================= TYPES ================= */
export interface SuppliedProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  status: "Active" | "Discontinued";
}

export interface PurchaseHistoryRecord {
  id: string;
  poNumber: string;
  date: string;
  itemsCount: number;
  totalAmount: number;
  status: "Delivered" | "In Transit" | "Processing";
}

export interface PaymentRecord {
  id: string;
  invoiceNumber: string;
  poReference: string;
  date: string;
  amount: number;
  method: string;
  status: "Paid" | "Pending" | "Overdue";
}

/* ================= MOCK DATA ================= */
export const MOCK_PRODUCTS: SuppliedProduct[] = [
  { id: "PROD-1", name: "Wireless Noise-Cancelling Headphones", sku: "WH-1000XM5", category: "Audio", unitPrice: 250.00, status: "Active" },
  { id: "PROD-2", name: "USB-C to USB-C Braided Cable (2m)", sku: "CBL-USBC-2M", category: "Accessories", unitPrice: 12.50, status: "Active" },
  { id: "PROD-3", name: "Mechanical Keyboard (Blue Switch)", sku: "KB-MECH-BLU", category: "Peripherals", unitPrice: 85.00, status: "Active" },
  { id: "PROD-4", name: "Ergonomic Office Mouse v1", sku: "MS-ERGO-V1", category: "Peripherals", unitPrice: 45.00, status: "Discontinued" },
];

export const MOCK_PURCHASES: PurchaseHistoryRecord[] = [
  { id: "PO-1", poNumber: "PO-2024-089", date: "Oct 24, 2024", itemsCount: 45, totalAmount: 12500.00, status: "Delivered" },
  { id: "PO-2", poNumber: "PO-2024-092", date: "Nov 02, 2024", itemsCount: 12, totalAmount: 3200.50, status: "Delivered" },
  { id: "PO-3", poNumber: "PO-2024-105", date: "Nov 15, 2024", itemsCount: 150, totalAmount: 24000.00, status: "In Transit" },
  { id: "PO-4", poNumber: "PO-2024-110", date: "Nov 18, 2024", itemsCount: 5, totalAmount: 850.00, status: "Processing" },
];

export const MOCK_PAYMENTS: PaymentRecord[] = [
  { id: "PAY-1", invoiceNumber: "INV-8890", poReference: "PO-2024-089", date: "Oct 28, 2024", amount: 12500.00, method: "Wire Transfer", status: "Paid" },
  { id: "PAY-2", invoiceNumber: "INV-8921", poReference: "PO-2024-092", date: "Nov 05, 2024", amount: 3200.50, method: "Credit Card", status: "Paid" },
  { id: "PAY-3", invoiceNumber: "INV-9005", poReference: "PO-2024-105", date: "Nov 15, 2024", amount: 24000.00, method: "ACH Routing", status: "Pending" },
];


// Refined Sidebar Item (Better rhythm, softer icons, subtle hover interaction)
const SidebarItem = ({ icon: Icon, label, value, isMono = false }: { icon: any, label: string, value: string, isMono?: boolean }) => (
  <div className="flex gap-4 items-start group">
    <div className="p-2 bg-gray-50/80 rounded-xl text-gray-400 shrink-0 mt-0.5 transition-colors group-hover:bg-blue-50 group-hover:text-blue-500">
      <Icon size={16} strokeWidth={1.5} />
    </div>
    <div className="min-w-0 space-y-0.5">
      <p className="text-[13px] font-medium text-gray-500">{label}</p>
      <p className={`text-sm font-medium text-gray-900 truncate ${isMono ? 'font-mono text-[13px] tracking-tight' : ''}`}>
        {value}
      </p>
    </div>
  </div>
);

/* ================= MAIN PAGE ================= */

const SupplierDetail = () => {
  const [activeTab, setActiveTab] = useState("General Info");
  const tabs = ["General Info", "Products Supplied", "Purchase History", "Payment History"];

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 md:pt-10 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* 1. Header & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50/50 border border-blue-100/50 text-blue-600">
              <CheckCircle2 size={13} strokeWidth={2} />
              <span className="text-[11px] font-medium tracking-wide uppercase">Verified Supplier</span>
            </div>
            <h1 className="heading-page text-gray-900 tracking-tight">
              ABC Traders
            </h1>
          </div>
          {/* Subtle Secondary Button instead of heavy primary block */}
          <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all duration-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-2 focus:ring-gray-200">
            Edit Vendor
          </button>
        </div>

        {/* 2. Top Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatsCard iconBg="bg-blue-50" iconColor="text-blue-600" label="Total Items Bought" value="120" icon={Package} />
          <StatsCard iconBg="bg-red-50" iconColor="text-red-600" label="Pending Amount" value="₹50,000" icon={CreditCard} />
          <StatsCard iconBg="bg-green-50" iconColor="text-green-600" label="Total Purchases" value="₹2,45,000" icon={ShoppingBag} />
          <StatsCard iconBg="bg-yellow-50" iconColor="text-yellow-600" label="Last Order" value="14 Days Ago" icon={History} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          
          {/* 3. Sidebar: Contact & Identity */}
          <div className="lg:col-span-1">
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] space-y-6">
              <h3 className="heading-label text-gray-900 pb-4 border-b border-gray-100">
                Identity & Contact
              </h3>
              <div className="space-y-5">
                <SidebarItem icon={Phone} label="Phone Number" value="+91 98765-43210" />
                <SidebarItem icon={Mail} label="Email Address" value="orders@abctraders.com" />
                <SidebarItem icon={Globe} label="GSTIN" value="27AAACB1234F1Z5" isMono />
                <SidebarItem icon={MapPin} label="Location" value="Mumbai, Maharashtra" />
              </div>
            </div>
          </div>

          {/* 4. Main Content Area: Tabs & Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Minimal Underline Tabs */}
            <div className="border-b border-gray-200/80">
              <nav className="flex gap-6 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-2 relative -mb-px ${
                      activeTab === tab
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {/* Flat Content Card with subtle elevation */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] overflow-hidden min-h-[400px]">
              
              {/* TAB CONTENT: General Info */}
              {activeTab === "General Info" && (
                <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2.5 pb-4 border-b border-gray-50">
                    <Info size={18} className="text-blue-500" strokeWidth={2} />
                    <h2 className="heading-section text-gray-900">Business Profile</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-3">
                      <p className="text-[13px] font-medium text-gray-500 uppercase tracking-wide">Payment Terms</p>
                      <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100/60 text-sm font-normal text-gray-700 leading-relaxed hover:border-gray-200 transition-colors duration-200">
                        Net 30 — Payment required within 30 days of invoice date.
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-[13px] font-medium text-gray-500 uppercase tracking-wide">Lead Time</p>
                      <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100/60 text-sm font-normal text-gray-700 leading-relaxed hover:border-gray-200 transition-colors duration-200">
                        Typically 3-5 business days depending on location.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: Products Supplied */}
              {activeTab === "Products Supplied" && (
                <div className="animate-in fade-in duration-300 overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Product Details</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">SKU</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-right">Unit Price</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {MOCK_PRODUCTS.map((prod) => (
                        <tr key={prod.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900">{prod.name}</p>
                            <p className="text-[13px] text-gray-500 mt-0.5">{prod.category}</p>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-600">{prod.sku}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">${prod.unitPrice.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                              prod.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {prod.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB CONTENT: Purchase History */}
              {activeTab === "Purchase History" && (
                <div className="animate-in fade-in duration-300 overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">PO Number</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Date</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-right">Items</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-right">Amount</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {MOCK_PURCHASES.map((po) => (
                        <tr key={po.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{po.poNumber}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{po.date}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-right">{po.itemsCount}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">${po.totalAmount.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                              po.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700' : 
                              po.status === 'In Transit' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {po.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB CONTENT: Payment History */}
              {activeTab === "Payment History" && (
                <div className="animate-in fade-in duration-300 overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Invoice Details</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Date</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Method</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-right">Amount</th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {MOCK_PAYMENTS.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900">{payment.invoiceNumber}</p>
                            <p className="text-[12px] font-mono text-gray-500 mt-0.5">Ref: {payment.poReference}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{payment.date}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{payment.method}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">${payment.amount.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                              payment.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 
                              payment.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default SupplierDetail;