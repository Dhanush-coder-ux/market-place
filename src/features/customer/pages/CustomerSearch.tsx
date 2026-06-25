import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, UserCheck, Star, Activity, 
  Filter, Plus, MoreVertical, Bookmark
} from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { StatsCard } from "@/components/common/StatsCard";

interface Customer {
  id: string;
  name?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  status?: string;
  total_orders?: number;
  total_spent?: number;
}

const CustomerSearch = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData } = useApi();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/customers/drafts")}
          className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <Bookmark size={16} />
          Saved Drafts
        </button>
        <button onClick={() => navigate('/customers/add')} className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
          <Plus size={16} />
          Add Customer
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

        const res = await getData(`${ENDPOINTS.CUSTOMERS}/by/shop/${SHOP_ID}`, params);
        if (res?.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data.datas ?? [res.data]);
          setCustomers(list);
        }
      } catch (err) {
        console.error("Failed to fetch customers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getData, debouncedSearch, statusFilter]);

  // Derived stats
  const stats = useMemo(() => {
    let active = 0;
    let vip = 0;
    customers.forEach(c => {
      if (!c.status || c.status?.toLowerCase() === "active") active++;
      if ((c.total_orders || 0) > 5) vip++;
    });

    return {
      total: customers.length,
      active,
      vip,
      newThisMonth: Math.floor(customers.length * 0.15)
    };
  }, [customers]);

  const fetchSearchOptions = async (q: string) => {
    try {
      const res = await getData(`${ENDPOINTS.CUSTOMERS}/search/${SHOP_ID}`, { limit: "10", q });
      const rawData = res?.data || [];
      const list = Array.isArray(rawData) ? rawData : (rawData.datas ?? [rawData]);
      return list.map((c: any) => ({
        ...c,
        displayName: String(c.name || c.id)
      }));
    } catch {
      return [];
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const getStatusStyle = (status: string) => {
    const s = (status || "active").toLowerCase();
    if (s === "active") return "bg-emerald-50 text-emerald-600 border border-emerald-100";
    if (s === "inactive") return "bg-slate-50 text-slate-600 border border-slate-200";
    if (s === "blocked") return "bg-rose-50 text-rose-600 border border-rose-100";
    return "bg-blue-50 text-blue-600 border border-blue-100";
  };

  return (
    <div className="h-screen bg-[#F8FAFC] font-sans overflow-hidden flex flex-col">


      {/* ── MAIN CONTENT ── */}
      <div className="px-4 md:px-10 space-y-6 flex-1 flex flex-col min-h-0 w-full pb-6">
        
        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
          <StatsCard
            label="Total Customers"
            value={stats.total.toLocaleString()}
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatsCard
            label="Active Customers"
            value={stats.active.toLocaleString()}
            icon={UserCheck}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatsCard
            label="VIP Customers"
            value={stats.vip.toLocaleString()}
            icon={Star}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
          />
          <StatsCard
            label="New This Month"
            value={stats.newThisMonth.toLocaleString()}
            icon={Activity}
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
              placeholder="Search by name, email or phone..."
              className="w-full h-9 border-none text-[13px] font-medium"
              onChange={(val) => val && navigate(`/customers/${val}`)}
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
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

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
              <Users size={20} className="text-blue-500" />
              <h2 className="text-lg font-bold text-slate-800">All Customers</h2>
            </div>
          </div>

          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Customer</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Contact</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Total Orders</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Total Spent</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Status</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-4 py-5">
                        <div className="flex gap-4 items-center">
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-32"></div>
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-24"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : customers.length > 0 ? (
                  customers.slice(0, 5).map((customer) => {
                    const name = customer.name || "Unnamed Customer";
                    const orders = customer.total_orders || 0;
                    const spent = customer.total_spent || 0;

                    return (
                      <tr 
                        key={customer.id} 
                        className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/customers/${customer.id}`)}
                      >
                        <td className="px-4 py-3">
                          <p className="text-[13px] font-bold text-slate-800">{name}</p>
                          <p className="text-[11px] text-slate-500">ID: {customer.id}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="block text-[13px] font-medium text-slate-700">{customer.email || "-"}</span>
                          <span className="block text-[12px] text-slate-500">{customer.mobile || customer.phone || "-"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[13px] font-semibold text-slate-800">{orders}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[13px] font-bold text-slate-800 tracking-tight">
                            {formatCurrency(spent)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-flex ${getStatusStyle(customer.status || "active")}`}>
                            {customer.status || "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/customers/${customer.id}`);
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
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      No customers found matching your criteria.
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

export default CustomerSearch;
