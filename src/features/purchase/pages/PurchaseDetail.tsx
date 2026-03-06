import  { useState } from "react";
import { 
  Download, Printer, CheckCircle2, 
  Clock, Truck, Calendar, FileText, User,
  LucideIcon
} from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";

const PurchaseDetail = () => {
  const [status, setStatus] = useState("Paid");

  const purchaseItems = [
    { id: 1, item: "Wireless Headphones", qty: 10, unit_price: 130, total: 1300 },
    { id: 2, item: "Silicone Protective Case", qty: 5, unit_price: 12, total: 60 },
  ];

  const toggleStatus = () => {
    setStatus(prev => prev === "Paid" ? "Pending" : "Paid");
  };

  return (
    <div className="min-h-screen p-3 animate-in fade-in duration-500">
      <div className="space-y-4">
        
        {/* ── Header Action Bar ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
             
              <span className="text-[11px] font-bold text-blue-600 bg-indigo-50/50 border border-indigo-100 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                Purchase Order · INV-004
              </span>
            </div>
            <h1 className="text-3xl font-medium text-slate-900">
              XYZ Wholesalers
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">Ref: PU03TO-348821</p>
          </div>

          <div className="flex items-center gap-3">
            <GradientButton
            icon={<Printer size={16}/>}
            variant="outline"
            >
              Print
            </GradientButton>
            <GradientButton
            icon={  <Download size={16} /> }
            variant="outline"
            >
             Download PDF
            </GradientButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ── MAIN CONTENT: Item List ── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
                <h2 className="font-bold text-slate-800 flex items-center gap-2.5 text-lg">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <FileText size={20} className="text-indigo-500" />
                  </div>
                  Order Items
                </h2>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{purchaseItems.length} Item(s)</span>
              </div>

              <div className="overflow-x-auto">
               <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden">
  <thead>
    <tr className="bg-slate-50 border-b border-slate-200">
      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-200">
        Item Details
      </th>
      <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-200">
        Quantity
      </th>
      <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right border-r border-slate-200">
        Unit Price
      </th>
      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
        Total
      </th>
    </tr>
  </thead>

  <tbody className="divide-y divide-slate-200">
    {purchaseItems.map((item) => (
      <tr
        key={item.id}
        className="group hover:bg-slate-50 transition-colors"
      >
        <td className="px-8 py-5 border-r border-slate-200">
          <p className="font-bold text-slate-800">{item.item}</p>
          <p className="text-[10px] text-slate-400 font-mono">
            ID: {item.id}0029
          </p>
        </td>

        <td className="px-4 py-5 text-sm text-slate-600 font-medium border-r border-slate-200">
          {item.qty} pcs
        </td>

        <td className="px-4 py-5 text-sm text-slate-600 text-right border-r border-slate-200">
          ₹{item.unit_price.toLocaleString()}
        </td>

        <td className="px-8 py-5 text-sm font-black text-slate-900 text-right">
          ₹{item.total.toLocaleString()}
        </td>
      </tr>
    ))}
  </tbody>
</table>
              </div>

              {/* Summary Footer */}
              <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                <div className="w-full md:w-72 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-semibold tracking-tight">Subtotal</span>
                    <span className="text-slate-900 font-bold">₹1,360</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-semibold tracking-tight">Tax (GST 0%)</span>
                    <span className="text-slate-900 font-bold">₹0</span>
                  </div>
                  <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                    <span className="text-base font-black text-slate-900">Total Amount</span>
                    <span className="text-2xl font-black text-blue-400 tracking-tighter">₹1,360</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SIDEBAR: Order Info & Supplier ── */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Payment Status Card */}
            <div className="bg-white p-6 ">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 text-center">Payment Status</h3>
              <div 
                onClick={toggleStatus}
                className={`flex flex-col items-center p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group ${
                  status === 'Paid' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/50 border-amber-100'
                }`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-sm transition-colors ${
                  status === 'Paid' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {status === 'Paid' ? <CheckCircle2 size={28} /> : <Clock size={28} />}
                </div>
                <span className={`text-xl font-black tracking-tight ${status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {status}
                </span>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-60 group-hover:opacity-100">Click to change</p>
              </div>
            </div>

            {/* Supplier Information */}
            <div className="bg-white p-6 space-y-6">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2.5 uppercase tracking-wider">
                <User size={18} className="text-indigo-500" /> Supplier Details
              </h3>
              <div className="space-y-5">
                <SidebarItem icon={Truck} label="Vendor" value="XYZ Wholesalers" />
                <SidebarItem icon={Calendar} label="Purchase Date" value="April 20, 2024" />
                <SidebarItem icon={FileText} label="Reference" value="INV-004 PU03TO-34" />
              </div>
              <button className="w-full py-3.5 bg-slate-50 text-slate-500 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100">
                View All Vendor Orders
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, value }:{icon:LucideIcon,label:string,value:string}) => (
  <div className="flex gap-4 group">
    <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">{label}</p>
      <p className="text-sm font-bold text-slate-700 truncate tracking-tight">{value}</p>
    </div>
  </div>
);

export default PurchaseDetail;