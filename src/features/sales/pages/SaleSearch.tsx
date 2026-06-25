import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingBag, DollarSign, Clock, Users, 
  Filter, Plus, MoreVertical, 
  ChevronRight, CreditCard, Banknote, 
  Smartphone, Wallet, Receipt
} from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { StatsCard } from "@/components/common/StatsCard";

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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);


  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/sales')} className="h-9 px-4 bg-white border border-slate-200 rounded-md text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
          View All
        </button>
        <button onClick={() => navigate('/billing')} className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[13px] font-semibold transition-colors flex items-center gap-2 shadow-sm">
          <Plus size={14} />
          New Order
        </button>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const params: any = { from_date: todayStr, to_date: todayStr };
        if (debouncedSearch) params.q = debouncedSearch;
        if (statusFilter !== "All") params.status = statusFilter;
        if (paymentFilter !== "All") params.payment_method = paymentFilter;

        const [ordersRes, custRes] = await Promise.all([
          getData(`${ENDPOINTS.ORDERS}/${SHOP_ID}`, params),
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
  }, [getData, debouncedSearch, statusFilter, paymentFilter]);

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

  // Server-side filtering handles the data now

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const fetchSearchOptions = async (q: string) => {
    try {
      const res = await getData(`${ENDPOINTS.ORDERS}/search/${SHOP_ID}`, { limit: "10", q });
      const rawData = res?.data || [];
      const list = Array.isArray(rawData) ? rawData : (rawData.datas ?? [rawData]);
      return list.map((o: any) => ({
        ...o,
        displayName: String(o.id || o.datas?.customer_name)
      }));
    } catch {
      return [];
    }
  };

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
    <div className="h-screen bg-[#F8FAFC] font-sans overflow-hidden flex flex-col">


      {/* ── MAIN CONTENT ── */}
      <div className="px-4 md:px-10 space-y-6 flex-1 flex flex-col min-h-0 w-full pb-6">
        
        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
          <StatsCard
            label="Total Orders"
            value={stats.total.toLocaleString()}
            subValue="+18.6%"
            icon={ShoppingBag}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatsCard
            label="Total Revenue"
            value={formatCurrency(stats.revenue)}
            subValue="+12.5%"
            icon={DollarSign}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatsCard
            label="Pending Orders"
            value={stats.pending.toLocaleString()}
            subValue="-5.3%"
            icon={Clock}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
          />
          <StatsCard
            label="Customers"
            value={stats.customers.toLocaleString()}
            subValue="+8.9%"
            icon={Users}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
        </div>

        {/* TOOLBAR */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-3 shrink-0">
          <div className="relative flex-1 w-full min-w-[300px]">
            <SearchSelect
              labelKey="displayName"
              valueKey="id"
              fetchOptions={fetchSearchOptions}
              placeholder="Search by order ID, status, payment method or amount..."
              className="w-full h-9 border-none text-[13px] font-medium"
              onChange={(val) => val && navigate(`/sales/detail/${val}`)}
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
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            
            <select 
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-md text-[13px] font-medium text-slate-600 outline-none focus:border-blue-500 cursor-pointer w-full md:w-[140px] appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5NDk0OTQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWxpbmUgcG9pbnRzPSI2IDkgMTIgMTUgMTggOSI+PC9wb2x5bGluZT48L3N2Zz4=')] bg-no-repeat bg-[position:right_8px_center]"
            >
              <option value="All">Payment Method</option>
              <option value="Cash">Cash</option>
              <option value="Credit Card">Credit Card</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
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
              <h2 className="text-lg font-bold text-slate-800">Recent Orders</h2>
            </div>
          </div>

          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Order ID</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Customer</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Status</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Payment Method</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Amount</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Date</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">Actions</th>
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
                ) : orders.length > 0 ? (
                  orders.slice(0, 5).map((order) => {
                    const cust = order.customer_id ? customers[order.customer_id] : null;
                    const { date, time } = formatDate(order.created_at);
                    
                    return (
                      <tr 
                        key={order.id} 
                        className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/sales/${order.id}`)}
                      >
                        <td className="px-4 py-3">
                          <span className="text-[13px] font-bold text-blue-600">#ORD-{order.ui_id}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[13px] font-bold text-slate-800">{cust?.name || "Walk-in Customer"}</p>
                          {cust?.email && <p className="text-[11px] text-slate-400">{cust.email}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-flex ${getStatusStyle(order.status)}`}>
                            {order.status || "Completed"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            {getPaymentIcon(order.payment_method)}
                            <div>
                              <p className="text-[12px] font-semibold">{order.payment_method || "Other"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[13px] font-bold text-slate-800 tracking-tight">
                            {formatCurrency(order.total_sellprice)}
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
