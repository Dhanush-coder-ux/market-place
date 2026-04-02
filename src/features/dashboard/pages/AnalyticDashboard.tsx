import { useState } from "react";
import { 
  Headphones, Cable, Link2, Armchair, Coffee, 
  IndianRupee, TrendingUp, ShoppingCart, Zap, 
  BarChart2, Globe, Star 
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
} from "recharts";
import { StatCard } from "../components/StatCard";
import { SectionCard } from "../components/SectionCard";
import { CustomTooltip } from "../components/CustomTooltip";

// ── DATA ────────────────────────────────────────────────────────────────────

const revenueData = [
  { month: "Jan", revenue: 120000, sales: 85000 },
  { month: "Feb", revenue: 145000, sales: 102000 },
  { month: "Mar", revenue: 132000, sales: 91000 },
  { month: "Apr", revenue: 168000, sales: 118000 },
  { month: "May", revenue: 155000, sales: 107000 },
  { month: "Jun", revenue: 190000, sales: 135000 },
  { month: "Jul", revenue: 210000, sales: 148000 },
  { month: "Aug", revenue: 198000, sales: 140000 },
  { month: "Sep", revenue: 225000, sales: 162000 },
  { month: "Oct", revenue: 248000, sales: 175000 },
  { month: "Nov", revenue: 270000, sales: 192000 },
  { month: "Dec", revenue: 300000, sales: 218000 },
];

const categoryData = [
  { name: "Electronics", value: 43, color: "#3b82f6" },
  { name: "Accessories", value: 28, color: "#8b5cf6" },
  { name: "Office Supplies", value: 18, color: "#06b6d4" },
  { name: "Furniture", value: 11, color: "#f59e0b" },
];

const paymentData = [
  { name: "Online", value: 45, color: "#3b82f6" },
  { name: "Offline", value: 35, color: "#e2e8f0" },
  { name: "COD", value: 20, color: "#8b5cf6" },
];

const productData = [
  { name: "Wireless Headphones", sales: 75, revenue: 12750, color: "#3b82f6" },
  { name: "Phone Charger 20W", sales: 95, revenue: 10450, color: "#8b5cf6" },
  { name: "USB-C Cable", sales: 125, revenue: 8500, color: "#06b6d4" },
  { name: "Ergonomic Chair", sales: 15, revenue: 7250, color: "#f59e0b" },
  { name: "Electric Kettle", sales: 40, revenue: 5920, color: "#10b981" },
];

const topProducts = [
  { name: "Wireless Headphones", price: "₹12,750", change: "+15", icon: <Headphones className="w-4 h-4 text-slate-500" /> },
  { name: "Phone Charger 20W", price: "₹10,450", change: "+8", icon: <Cable className="w-4 h-4 text-slate-500" /> },
  { name: "USB-C Cable", price: "₹8,500", change: "+22", icon: <Link2 className="w-4 h-4 text-slate-500" /> },
  { name: "Ergonomic Chair", price: "₹7,250", change: "+15", icon: <Armchair className="w-4 h-4 text-slate-500" /> },
  { name: "Electric Kettle", price: "₹5,920", change: "+40", icon: <Coffee className="w-4 h-4 text-slate-500" /> },
];

const digitalStoreData = [
  { month: "Jan", online: 65, offline: 45 },
  { month: "Feb", online: 80, offline: 52 },
  { month: "Mar", online: 72, offline: 48 },
  { month: "Apr", online: 95, offline: 60 },
  { month: "May", online: 88, offline: 55 },
  { month: "Jun", online: 110, offline: 70 },
  { month: "Jul", online: 125, offline: 78 },
  { month: "Aug", online: 115, offline: 72 },
];

// ── TYPES ────────────────────────────────────────────────────────────────────

type Range = "Today" | "7 Days" | "30 Days" | "Custom Range";



// ── MAIN COMPONENT ───────────────────────────────────────────────────────────

const AnalyticsDashboard = () => {
  const [activeRange, setActiveRange] = useState<Range>("7 Days");
  const [chartView, setChartView] = useState<"Daily" | "Weekly" | "Monthly">("Monthly");

  const ranges: Range[] = ["Today", "7 Days", "30 Days", "Custom Range"];

  return (
    <div className="min-h-screen bg-slate-50">

   

      <div className="p-6 space-y-5">

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { title: "Daily Revenue", value: "₹8,750", change: "12%", positive: true, subtitle: "Daily since yesterday", icon: <IndianRupee className="w-5 h-5 text-blue-600" />, accent: "bg-blue-50" },
            { title: "Monthly Revenue", value: "₹2,40,500", change: "18%", positive: true, subtitle: "36 days since last month", icon: <TrendingUp className="w-5 h-5 text-violet-600" />, accent: "bg-violet-50" },
            { title: "Today's Orders", value: "47", change: "7%", positive: false, subtitle: "3 sec. since yesterday", icon: <ShoppingCart className="w-5 h-5 text-amber-600" />, accent: "bg-amber-50" },
            { title: "Avg. Order Value", value: "₹186", change: "12%", positive: true, subtitle: "112% since yesterday", icon: <Zap className="w-5 h-5 text-emerald-600" />, accent: "bg-emerald-50" },
          ].map((s, i) => (
            <div key={s.title} className={`fade-up fade-up-${i + 1}`}>
              <StatCard {...s} />
            </div>
          ))}
        </div>
             {/* ── TOP BAR ── */}
      <div className="bg-white border-b border-slate-100 ">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="display-font text-xl font-bold text-slate-800">Overview</h1>
          
          </div>

          {/* Range Selector */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setActiveRange(r)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeRange === r
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
        {/* ── SALES PERFORMANCE LABEL ── */}
        <h2 className="display-font text-base font-bold text-slate-600 tracking-wide uppercase fade-up fade-up-2">
          Sales Performance
        </h2>

        {/* ── ROW 2: Revenue Trend + Right Panel ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 fade-up fade-up-3">

          {/* Revenue Trend – takes 2 cols */}
          <div className="xl:col-span-2">
            <SectionCard
              title="Sales & Revenue Trend"
              action={
                <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                  {(["Daily", "Weekly", "Monthly"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setChartView(v)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                        chartView === v ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="px-5 pb-5">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gRevenue)" dot={false} activeDot={{ r: 5, fill: "#3b82f6" }} />
                    <Area type="monotone" dataKey="sales" name="Sales" stroke="#8b5cf6" strokeWidth={2} fill="url(#gSales)" dot={false} activeDot={{ r: 4, fill: "#8b5cf6" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          {/* Right: Profitability + Growth */}
          <div className="flex flex-col gap-4">
            <SectionCard title="Profitability">
              <div className="px-5 pb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Today's Profit</p>
                    <p className="display-font text-xl font-bold text-slate-800">₹2,580</p>
                    <p className="text-xs text-emerald-500 font-semibold">+200 since yesterday · +8%</p>
                  </div>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-500 font-medium">Gross Margin</p>
                  <p className="font-bold text-slate-700">28.5%</p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: "28.5%" }} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Growth">
              <div className="px-5 pb-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <BarChart2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="display-font text-2xl font-bold text-emerald-500">28.5%</p>
                  <p className="text-xs text-slate-400">Improved</p>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* ── ROW 3: Four cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 fade-up fade-up-4">

          {/* Sales by Product */}
          <SectionCard title="Sales by Product">
            <div className="px-5 pb-5 space-y-3">
              {productData.map((p) => (
                <div key={p.name}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span className="truncate pr-2">{p.name}</span>
                    <span className="font-semibold text-slate-700 shrink-0">₹{p.revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${(p.revenue / 13000) * 100}%`, background: p.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Sales by Category */}
          <SectionCard title="Sales by Category">
            <div className="px-5 pb-5">
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={110} height={110}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" strokeWidth={0}>
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1">
                  {categoryData.map((c) => (
                    <div key={c.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="text-xs text-slate-500 truncate">{c.name}</span>
                      <span className="text-xs font-bold text-slate-700 ml-auto">{c.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Sales by Payment */}
          <SectionCard title="Sales by Payment">
            <div className="px-5 pb-4">
              <div className="flex items-center gap-3">
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" innerRadius={28} outerRadius={46} dataKey="value" strokeWidth={0}>
                      {paymentData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {paymentData.map((p) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                      <span className="text-xs text-slate-500">{p.name}</span>
                      <span className="text-xs font-bold ml-1">{p.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Digital Store Overview */}
          <SectionCard title="Digital Store">
            <div className="px-3 pb-4">
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={digitalStoreData} barSize={8} margin={{ top: 4, right: 4, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="online" name="Online" fill="#0c8a2b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="offline" name="Offline" fill="#f1c549" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-3 mt-1 px-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-2.5 h-2.5 rounded-sm bg-green-500" />Online</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-2.5 h-2.5 rounded-sm bg-yellow-500" />Offline</div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── ROW 4: Digital Store Insights + Top Selling ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 fade-up fade-up-5">

          {/* Digital Store Insights */}
          <SectionCard title="Digital Store Insights">
            <div className="px-5 pb-5 space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Online</p>
                    <p className="font-bold text-slate-700">₹920</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">160 orders</p>
                  <p className="text-xs font-semibold text-emerald-500">+2.5%</p>
                </div>
              </div>

              {[
                { label: "Conversion Rate", value: "4.3%", bar: 43, color: "#3b82f6" },
                { label: "Avg Session Time", value: "2m 18s", bar: 62, color: "#8b5cf6" },
                { label: "Return Rate", value: "1.8%", bar: 18, color: "#f59e0b" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-bold text-slate-700">{item.value}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${item.bar}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Top Selling Products */}
          <div className="xl:col-span-2">
            <SectionCard title="Top Selling Products">
              <div className="px-5 pb-5">
                <div className="space-y-2">
                  {topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                      <span className="w-7 h-7 flex items-center justify-center bg-slate-100 rounded-lg text-base shrink-0">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{p.name}</p>
                        <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5">
                          <div
                            className="h-1 rounded-full bg-blue-400 group-hover:bg-blue-500 transition-all"
                            style={{ width: `${100 - i * 18}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-700">{p.price}</p>
                        <p className="text-xs text-emerald-500 font-semibold">+{p.change}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom quick stats */}
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
                  {[
                    { label: "Gross Margin", value: "28.5%", icon: <TrendingUp className="w-5 h-5 mx-auto text-slate-500" /> },
                    { label: "Online Share", value: "2.5%", icon: <Globe className="w-5 h-5 mx-auto text-slate-500" /> },
                    { label: "Avg Rating", value: "4.9 ★", icon: <Star className="w-5 h-5 mx-auto text-amber-500" /> },
                  ].map((s) => (
                    <div key={s.label} className="text-center p-2.5 bg-slate-50 rounded-xl">
                      <div className="mb-1.5 flex justify-center">{s.icon}</div>
                      <p className="display-font text-sm font-bold text-slate-700">{s.value}</p>
                      <p className="text-xs text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;