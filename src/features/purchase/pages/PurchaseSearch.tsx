import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, DollarSign, Clock, Users, 
  Filter, Plus, MoreVertical, 
  ChevronRight, Receipt, History
} from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { StatsCard } from "@/components/common/StatsCard";

interface PurchaseOrder {
  id: string;
  invoice_no?: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  supplier?: {
    supplier_name: string;
  };
}

const PurchaseSearch = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData } = useApi();

  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/purchase-history")}
          className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <History size={16} />
          History
        </button>
        <button onClick={() => navigate('/purchase/add')} className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
          <Plus size={16} />
          Add Purchase
        </button>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params: any = { limit: "100" };
        if (debouncedSearch) params.q = debouncedSearch;
        if (statusFilter !== "All") params.status = statusFilter;
        if (paymentFilter !== "All") params.payment_status = paymentFilter;

        const res = await getData(`${ENDPOINTS.PURCHASES}/search/${SHOP_ID}`, params);
        if (res?.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data.datas ?? [res.data]);
          setPurchases(list);
        }
      } catch (err) {
        console.error("Failed to fetch purchase data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getData, debouncedSearch, statusFilter, paymentFilter]);

  // Derived stats
  const stats = useMemo(() => {
    let spent = 0;
    let pending = 0;
    const uniqueSuppliers = new Set();

    purchases.forEach(p => {
      if (p.status?.toLowerCase() === "completed" || p.status?.toLowerCase() === "received") spent += (p.total_amount || 0);
      if (p.status?.toLowerCase() === "pending") pending++;
      if (p.supplier?.supplier_name) uniqueSuppliers.add(p.supplier.supplier_name);
    });

    return {
      total: purchases.length,
      spent,
      pending,
      suppliers: uniqueSuppliers.size
    };
  }, [purchases]);

  const fetchSearchOptions = async (q: string) => {
    try {
      const res = await getData(`${ENDPOINTS.PURCHASES}/search/${SHOP_ID}`, { limit: "10", q });
      const rawData = res?.data || [];
      return rawData.map((po: any) => {
        const poLabel = po.invoice_no || po.id;
        const vendor = po.supplier?.supplier_name || "Unknown Vendor";
        return {
          ...po,
          displayName: `${poLabel} · ${vendor}`
        };
      });
    } catch (err) {
      console.error("Failed to fetch purchases for search:", err);
      return [];
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  const formatDate = (isoStr: string) => {
    if (!isoStr) return { date: "-", time: "-" };
    const d = new Date(isoStr);
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    };
  };

  const getStatusStyle = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "completed" || s === "received") return "bg-emerald-50 text-emerald-600 border border-emerald-100";
    if (s === "pending") return "bg-orange-50 text-orange-600 border border-orange-100";
    if (s === "processing") return "bg-blue-50 text-blue-600 border border-blue-100";
    if (s === "cancelled") return "bg-rose-50 text-rose-600 border border-rose-100";
    return "bg-slate-100 text-slate-600 border border-slate-200";
  };

  return (
    <div className="h-screen bg-[#F8FAFC] font-sans overflow-hidden flex flex-col">


      {/* ── MAIN CONTENT ── */}
      <div className="px-4 md:px-10 space-y-6 flex-1 flex flex-col min-h-0 w-full pb-6">
        
        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
          <StatsCard
            label="Total Purchases"
            value={stats.total.toLocaleString()}
            icon={FileText}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatsCard
            label="Total Spent"
            value={formatCurrency(stats.spent)}
            icon={DollarSign}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatsCard
            label="Pending POs"
            value={stats.pending.toLocaleString()}
            icon={Clock}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
          />
          <StatsCard
            label="Total Suppliers"
            value={stats.suppliers.toLocaleString()}
            icon={Users}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
        </div>

        {/* TOOLBAR */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-2 shrink-0">
          <div className="relative flex-1 w-full min-w-[200px]">
            <SearchSelect
              labelKey="displayName"
              valueKey="id"
              fetchOptions={fetchSearchOptions}
              placeholder="Search by PO number or vendor..."
              className="w-full h-9 border-none text-[13px] font-medium"
              onChange={(val) => val && navigate(`/purchase/detail/${val}`)}
              onSearchChange={setSearch}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-md text-[13px] font-medium text-slate-600 outline-none focus:border-blue-500 cursor-pointer w-full md:w-[120px] appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5NDk0OTQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWxpbmUgcG9pbnRzPSI2IDkgMTIgMTUgMTggOSI+PC9wb2x5bGluZT48L3N2Zz4=')] bg-no-repeat bg-[position:right_8px_center]"
            >
              <option value="All">Status</option>
              <option value="Received">Received</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            
            <select 
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-md text-[13px] font-medium text-slate-600 outline-none focus:border-blue-500 cursor-pointer w-full md:w-[140px] appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5NDk0OTQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWxpbmUgcG9pbnRzPSI2IDkgMTIgMTUgMTggOSI+PC9wb2x5bGluZT48L3N2Zz4=')] bg-no-repeat bg-[position:right_8px_center]"
            >
              <option value="All">Payment</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
            </select>

            <button className="h-9 px-3 bg-white border border-slate-200 rounded-md text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-between w-full md:w-[150px]">
              Select Date Range
              <ChevronRight size={14} className="text-slate-400 rotate-90" />
            </button>

            <button className="h-9 px-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-md text-[13px] font-bold hover:bg-blue-100 transition-colors flex items-center gap-2 shrink-0">
              <Filter size={14} />
              Filters
            </button>
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col min-h-0 flex-1">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2">
              <Receipt size={20} className="text-blue-500" />
              <h2 className="text-lg font-bold text-slate-800">Recent Purchases</h2>
            </div>
          </div>

          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">PO Number</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Supplier</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Status</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Payment</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Amount</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Date</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-4 py-5">
                        <div className="flex gap-4 items-center">
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-16"></div>
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-32"></div>
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-24"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : purchases.length > 0 ? (
                  purchases.slice(0, 5).map((purchase) => {

                    const { date, time } = formatDate(purchase.created_at);
                    
                    return (
                      <tr 
                        key={purchase.id} 
                        className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/purchase/detail/${purchase.id}`)}
                      >
                        <td className="px-4 py-3">
                          <span className="text-[13px] font-bold text-blue-600">{purchase.invoice_no || `#${purchase.id}`}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[13px] font-bold text-slate-800">{purchase.supplier?.supplier_name || "Unknown Vendor"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-flex ${getStatusStyle(purchase.status)}`}>
                            {purchase.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[12px] font-semibold text-slate-700 capitalize">{purchase.payment_status || "Unpaid"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[13px] font-bold text-slate-800 tracking-tight">
                            {formatCurrency(purchase.total_amount || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[12px] font-medium text-slate-700">{date}</p>
                          <p className="text-[10px] font-medium text-slate-400">{time}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/purchase/detail/${purchase.id}`);
                            }}
                          >
                            <MoreVertical size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      No purchases found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PurchaseSearch;
