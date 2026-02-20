import  { useState } from "react";
import { 
 Download, Printer, CheckCircle2, 
  Clock, Truck, Calendar, FileText, User 
} from "lucide-react";
import Table from "@/components/common/Table";

const PurchaseDetail = () => {
  const [status, setStatus] = useState("Paid"); // Mock state

  const productColumns = [
    { key: "item", label: "Item Details" },
    { key: "qty", label: "Quantity" },
    { key: "unit_price", label: "Unit Price", render: (v: number) => `₹${v}` },
    { key: "total", label: "Total", render: (v: number) => <span className="font-bold">₹{v}</span> },
  ];

  const purchaseItems = [
    { id: 1, item: "Wireless Headphones", qty: 10, unit_price: 130, total: 1300 },
  ];

  const handleChange = () => {
    setStatus("Not Paid")
  }
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
          
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                  Invoice {purchaseItems[0].id === 1 ? 'INV-004' : 'N/A'}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Purchase from XYZ Wholesalers</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
              <Printer size={16} /> Print
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
              <Download size={16} /> Download PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* MAIN CONTENT: Item List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={18} className="text-indigo-500" /> Order Items
                </h2>
                <span className="text-xs text-slate-400 font-medium">1 Item(s) included</span>
              </div>
              <Table columns={productColumns} data={purchaseItems} rowKey="id" />
              <div className="p-6 bg-slate-50/50 flex justify-end">
                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Subtotal</span>
                    <span className="text-slate-900 font-bold">₹1,300</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Tax (GST 0%)</span>
                    <span className="text-slate-900 font-bold">₹0</span>
                  </div>
                  <div className="border-t border-slate-200 pt-3 flex justify-between">
                    <span className="text-base font-black text-slate-900">Total Amount</span>
                    <span className="text-xl font-black text-indigo-600">₹1,300</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR: Order Info & Supplier */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Payment Status Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Payment Status</h3>
              <div className={`flex flex-col items-center p-4 rounded-2xl border ${
                status === 'Paid' ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'
              }`}>
                {status === 'Paid' ? (
                  <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                ) : (
                  <Clock size={32} className="text-orange-500 mb-2" />
                )}
                <span onClick={handleChange} className={`text-lg font-black ${status === 'Paid' ? 'text-emerald-700' : 'text-orange-700'}`}>
                  {status}
                </span>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Transaction ID: #TXN-9920</p>
              </div>
            </div>

            {/* Supplier Information */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 space-y-5">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <User size={16} className="text-indigo-500" /> Supplier Details
              </h3>
              <div className="space-y-4">
                <SidebarItem icon={Truck} label="Vendor" value="XYZ Wholesalers" />
                <SidebarItem icon={Calendar} label="Purchase Date" value="April 20, 2024" />
                <SidebarItem icon={FileText} label="Reference" value="INV-004 PU03TO-34" />
              </div>
              <button className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all border border-slate-100">
                View All Vendor Orders
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex gap-3">
    <div className="p-2 bg-slate-50 rounded-lg text-slate-400 shrink-0">
      <Icon size={16} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-700 truncate">{value}</p>
    </div>
  </div>
);

export default PurchaseDetail;