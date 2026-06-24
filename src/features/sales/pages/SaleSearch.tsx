import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingBag, DollarSign, Clock, Users, 
  Search, Filter, Download, Plus, MoreVertical, 
  ChevronLeft, ChevronRight, CreditCard, Banknote, 
  Smartphone, Wallet, Receipt
} from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";

interface Order {
  id: string;
  ui_id: number | string;
  customer_id?: string;
  status: string;
  payment_method: string;
  total_sellprice: number;
  created_at: string;
}

const SaleSearch = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData } = useApi();

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Record<string, { name: string; email: string }>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setActions(null);
    return () => setActions(null);
  }, [setActions]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const [ordersRes, custRes] = await Promise.all([
          getData(`${ENDPOINTS.ORDERS}/${SHOP_ID}`, { from_date: todayStr, to_date: todayStr }),
          getData(`${ENDPOINTS.CUSTOMERS}/by/shop/${SHOP_ID}`)
        ]);

        if (ordersRes?.data) {
          const list = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data.datas ?? [ordersRes.data]);
          setOrders(list);
        }

        if (custRes?.data) {
          const cMap: Record<string, { name: string; email: string }> = {};
          const cList = Array.isArray(custRes.data) ? custRes.data : (custRes.data.datas ?? []);
          cList.forEach((c: any) => {
            cMap[c.id] = { name: c.name, email: c.email || `${c.phone || c.id}@customer.local` };
          });
          setCustomers(cMap);
        }
      } catch (err) {
        console.error("Failed to fetch sales data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getData]);

  // Derived stats
  const stats = useMemo(() => {
    let revenue = 0;
    let pending = 0;
    orders.forEach(o => {
      if (o.status?.toLowerCase() === "completed") revenue += (o.total_sellprice || 0);
      if (o.status?.toLowerCase() === "pending") pending++;
    });
    return {
      total: orders.length,
      revenue,
      pending,
      customers: Object.keys(customers).length || new Set(orders.map(o => o.customer_id)).size
    };
  }, [orders, customers]);

  // Filtering
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = !search || 
        String(o.ui_id).includes(search) || 
        String(o.total_sellprice).includes(search) ||
        (o.customer_id && customers[o.customer_id]?.name.toLowerCase().includes(search.toLowerCase()));
      
      const matchesStatus = statusFilter === "All" || o.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchesPayment = paymentFilter === "All" || o.payment_method?.toLowerCase() === paymentFilter.toLowerCase();
      
      return matchesSearch && matchesStatus && matchesPayment;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, search, statusFilter, paymentFilter, customers]);

  // No pagination needed if we only show recent orders
  const currentOrders = filteredOrders;

  const fetchSales = async (q: string) => {
    try {
      const res = await getData(`${ENDPOINTS.ORDERS}/${SHOP_ID}`);
      const dataList = res?.data ? (Array.isArray(res.data) ? res.data : (res.data.datas ?? [res.data])) : [];
      
      const query = q.toLowerCase().trim();
      const filtered = dataList.filter((s: any) => {
        if (!query) return true;
        const invStr = `Order #${s.ui_id}`.toLowerCase();
        const idStr = String(s.id).toLowerCase();
        const custStr = String(s.customer_id || "").toLowerCase();
        const cashierStr = String(s.cashier_id || "").toLowerCase();
        const statusStr = String(s.status || "").toLowerCase();
        const totalStr = String(s.total_sellprice || "").toLowerCase();
        const originStr = String(s.origin || "").toLowerCase();
        const methodStr = String(s.payment_method || "").toLowerCase();
        
        return (
          invStr.includes(query) ||
          idStr.includes(query) ||
          custStr.includes(query) ||
          cashierStr.includes(query) ||
          statusStr.includes(query) ||
          totalStr.includes(query) ||
          originStr.includes(query) ||
          methodStr.includes(query)
        );
      });

      return filtered.slice(0, 10).map((s: any) => {
        const invLabel = `Order #${s.ui_id}`;
        const totalLabel = `₹${Number(s.total_sellprice).toLocaleString("en-IN")}`;
        const statusLabel = s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1).toLowerCase() : "Completed";
        const dateLabel = s.created_at ? new Date(s.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "";
        return {
          ...s,
          displayName: `${invLabel} · ${statusLabel} · ${totalLabel} (${dateLabel})`
        };
      });
    } catch (err) {
      console.error("Failed to fetch sales for search:", err);
      return [];
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    };
  };

  const getStatusStyle = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "completed") return "bg-emerald-50 text-emerald-600 border border-emerald-100";
    if (s === "pending") return "bg-orange-50 text-orange-600 border border-orange-100";
    if (s === "processing" || s === "exchanged") return "bg-blue-50 text-blue-600 border border-blue-100";
    if (s === "cancelled" || s === "refunded") return "bg-rose-50 text-rose-600 border border-rose-100";
    return "bg-slate-100 text-slate-600 border border-slate-200";
  };

  const getPaymentIcon = (method: string) => {
    const m = (method || "").toLowerCase();
    if (m.includes("card") || m.includes("credit")) return <CreditCard size={16} className="text-slate-500" />;
    if (m.includes("bank") || m.includes("transfer")) return <Banknote size={16} className="text-slate-500" />;
    if (m.includes("upi") || m.includes("online")) return <Smartphone size={16} className="text-slate-500" />;
    return <Wallet size={16} className="text-slate-500" />;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans overflow-x-hidden">
      {/* ── HERO BANNER ── */}
      <div className="relative bg-gradient-to-r from-[#1E293B] via-[#2E3A59] to-[#3B4C85] pt-12 pb-28 px-6 md:px-10 rounded-b-[2.5rem] md:rounded-b-[3rem] overflow-hidden shadow-xl">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full" />
          <div className="absolute right-[20%] top-[30%] w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full" />
          <div className="absolute left-10 top-10 w-32 h-32 bg-white/5 blur-[40px] rounded-full" />
          
          {/* 3D-like Mock Icons */}
          <div className="hidden lg:block absolute right-32 top-1/2 -translate-y-1/2 drop-shadow-2xl">
            <div className="relative w-48 h-56 bg-gradient-to-b from-[#60A5FA] to-[#3B82F6] rounded-2xl border border-blue-400/30 flex flex-col items-center pt-8 shadow-[0_20px_50px_rgba(37,99,235,0.5)] transform rotate-12 transition-transform duration-700 hover:rotate-6">
              <div className="w-20 h-4 bg-white/20 rounded-full mb-6 shadow-inner" />
              <DollarSign size={64} className="text-white opacity-90 drop-shadow-lg" />
              <div className="mt-8 space-y-3 w-3/4">
                <div className="h-2 bg-white/20 rounded w-full" />
                <div className="h-2 bg-white/20 rounded w-5/6" />
                <div className="h-2 bg-white/20 rounded w-4/6" />
              </div>
              
              {/* Floating Coins */}
              <div className="absolute -left-10 top-10 w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full border-4 border-yellow-200/50 flex items-center justify-center shadow-xl transform -rotate-12">
                <DollarSign size={24} className="text-yellow-700/50" />
              </div>
              <div className="absolute -right-8 bottom-12 w-12 h-12 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full border-4 border-yellow-200/50 flex items-center justify-center shadow-xl transform rotate-45">
                <DollarSign size={20} className="text-yellow-700/50" />
              </div>
              <div className="absolute right-10 -top-8 w-10 h-10 bg-gradient-to-br from-blue-300 to-blue-500 rounded-full flex items-center justify-center shadow-lg" />
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 drop-shadow-sm">Sales Directory</h1>
          <p className="text-blue-100/80 font-medium text-lg max-w-xl leading-relaxed">
            Search, track and manage orders, customer transactions and sales performance.
          </p>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-10 -mt-16 space-y-6">
        
        {/* STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex items-start gap-4 transition-transform hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <ShoppingBag size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-500 mb-1">Total Orders</p>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-black text-slate-800">{stats.total.toLocaleString()}</h3>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mb-1">+18.6%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">vs last month</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex items-start gap-4 transition-transform hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <DollarSign size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-500 mb-1">Total Revenue</p>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-black text-slate-800">{formatCurrency(stats.revenue)}</h3>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mb-1">+12.5%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">vs last month</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex items-start gap-4 transition-transform hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <Clock size={24} className="text-orange-500" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-500 mb-1">Pending Orders</p>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-black text-slate-800">{stats.pending.toLocaleString()}</h3>
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded mb-1">-5.3%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">vs last month</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex items-start gap-4 transition-transform hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <Users size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-500 mb-1">Customers</p>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-black text-slate-800">{stats.customers.toLocaleString()}</h3>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mb-1">+8.9%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">vs last month</p>
            </div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full min-w-[300px]">
            <SearchSelect
              labelKey="displayName"
              valueKey="id"
              fetchOptions={fetchSales}
              placeholder="Search by order ID, status, payment method or amount..."
              className="w-full h-11 border-none text-sm font-medium"
              onChange={(val) => val && navigate(`/sales/${val}`)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 outline-none focus:border-blue-500 cursor-pointer w-full md:w-[140px] appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5NDk0OTQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWxpbmUgcG9pbnRzPSI2IDkgMTIgMTUgMTggOSI+PC9wb2x5bGluZT48L3N2Zz4=')] bg-no-repeat bg-[position:right_12px_center]"
            >
              <option value="All">Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            
            <select 
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 outline-none focus:border-blue-500 cursor-pointer w-full md:w-[160px] appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5NDk0OTQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWxpbmUgcG9pbnRzPSI2IDkgMTIgMTUgMTggOSI+PC9wb2x5bGluZT48L3N2Zz4=')] bg-no-repeat bg-[position:right_12px_center]"
            >
              <option value="All">Payment Method</option>
              <option value="Cash">Cash</option>
              <option value="Credit Card">Credit Card</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>

            <button className="h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-between w-full md:w-[180px]">
              Select Date Range
              <ChevronRight size={14} className="text-slate-400 rotate-90" />
            </button>

            <button className="h-11 px-4 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors flex items-center gap-2 shrink-0">
              <Filter size={16} />
              Filters
            </button>
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <Receipt size={20} className="text-blue-500" />
              <h2 className="text-lg font-bold text-slate-800">Recent Orders</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/sales')} className="h-9 px-4 bg-white border border-slate-200 rounded-md text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
                View All
              </button>
              <button onClick={() => navigate('/billing')} className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[13px] font-semibold transition-colors flex items-center gap-2 shadow-sm">
                <Plus size={14} />
                New Order
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Order ID</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Customer</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Status</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Payment Method</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Amount</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Date</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-6 py-5">
                        <div className="flex gap-4 items-center">
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-16"></div>
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-32"></div>
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-24"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : currentOrders.length > 0 ? (
                  currentOrders.map((order) => {
                    const cust = order.customer_id ? customers[order.customer_id] : null;
                    const { date, time } = formatDate(order.created_at);
                    
                    return (
                      <tr 
                        key={order.id} 
                        className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/sales/${order.id}`)}
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-blue-600">#ORD-{order.ui_id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[14px] font-bold text-slate-800">{cust?.name || "Walk-in Customer"}</p>
                          {cust?.email && <p className="text-[12px] text-slate-400">{cust.email}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider inline-flex ${getStatusStyle(order.status)}`}>
                            {order.status || "Completed"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-700">
                            {getPaymentIcon(order.payment_method)}
                            <div>
                              <p className="text-[13px] font-semibold">{order.payment_method || "Other"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] font-bold text-slate-800 tracking-tight">
                            {formatCurrency(order.total_sellprice)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[13px] font-medium text-slate-700">{date}</p>
                          <p className="text-[11px] font-medium text-slate-400">{time}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/sales/${order.id}`);
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
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No orders found matching your criteria.
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

export default SaleSearch;
