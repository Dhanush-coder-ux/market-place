import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  UserCheck, Users, Briefcase, Activity, 
  Filter, Plus, MoreVertical, Bookmark
} from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { StatsCard } from "@/components/common/StatsCard";

interface Employee {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  employee_id?: string;
  role?: string;
  status?: string;
  datas?: {
    name?: string;
    role?: string;
    department?: string;
  };
}

const EmployeeSearch = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData } = useApi();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/employee/drafts")}
          className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <Bookmark size={16} />
          Saved Drafts
        </button>
        <button onClick={() => navigate('/employee/add')} className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
          <Plus size={16} />
          Add Employee
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
        if (roleFilter !== "All") params.role = roleFilter;

        const res = await getData(`${ENDPOINTS.EMPLOYEES}/by/shop/${SHOP_ID}`, params);
        if (res?.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data.datas ?? [res.data]);
          setEmployees(list);
        }
      } catch (err) {
        console.error("Failed to fetch employees", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getData, debouncedSearch, statusFilter, roleFilter]);

  // Derived stats
  const stats = useMemo(() => {
    let active = 0;
    const uniqueRoles = new Set();
    
    employees.forEach(e => {
      if (!e.status || e.status?.toLowerCase() === "active") active++;
      const role = e.role || e.datas?.role || "Staff";
      uniqueRoles.add(role);
    });

    return {
      total: employees.length,
      active,
      inactive: employees.length - active,
      roles: uniqueRoles.size
    };
  }, [employees]);

  const fetchSearchOptions = async (q: string) => {
    try {
      const res = await getData(`${ENDPOINTS.EMPLOYEES}/by/shop/${SHOP_ID}`, { limit: "10", q });
      const rawData = res?.data || [];
      const list = Array.isArray(rawData) ? rawData : (rawData.datas ?? [rawData]);
      return list.map((e: any) => ({
        ...e,
        displayName: String(e.name || e.datas?.name || e.email || e.employee_id)
      }));
    } catch {
      return [];
    }
  };

  const getStatusStyle = (status: string) => {
    const s = (status || "active").toLowerCase();
    if (s === "active") return "bg-emerald-50 text-emerald-600 border border-emerald-100";
    if (s === "inactive" || s === "on leave") return "bg-orange-50 text-orange-600 border border-orange-100";
    if (s === "terminated") return "bg-rose-50 text-rose-600 border border-rose-100";
    return "bg-blue-50 text-blue-600 border border-blue-100";
  };

  return (
    <div className="h-screen bg-[#F8FAFC] font-sans overflow-hidden flex flex-col">


      {/* ── MAIN CONTENT ── */}
      <div className="px-4 md:px-10 space-y-6 flex-1 flex flex-col min-h-0 w-full pb-6">
        
        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
          <StatsCard
            label="Total Employees"
            value={stats.total.toLocaleString()}
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatsCard
            label="Active Employees"
            value={stats.active.toLocaleString()}
            icon={UserCheck}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatsCard
            label="On Leave / Inactive"
            value={stats.inactive.toLocaleString()}
            icon={Activity}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
          />
          <StatsCard
            label="Total Roles"
            value={stats.roles.toLocaleString()}
            icon={Briefcase}
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
              placeholder="Search by name, ID or role..."
              className="w-full h-9 border-none text-[13px] font-medium"
              onChange={(val) => val && navigate(`/employee/${val}`)}
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
              <option value="On Leave">On Leave</option>
            </select>

            <select 
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-md text-[13px] font-medium text-slate-600 outline-none focus:border-blue-500 cursor-pointer w-full md:w-[140px] appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5NDk0OTQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWxpbmUgcG9pbnRzPSI2IDkgMTIgMTUgMTggOSI+PC9wb2x5bGluZT48L3N2Zz4=')] bg-no-repeat bg-[position:right_8px_center]"
            >
              <option value="All">Role</option>
              {Array.from(new Set(employees.map(e => e.role || e.datas?.role || "Staff"))).map(r => (
                <option key={r as string} value={r as string}>{r as string}</option>
              ))}
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
              <h2 className="text-lg font-bold text-slate-800">All Employees</h2>
            </div>
          </div>

          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Employee</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Role</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Email</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Phone</th>
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
                ) : employees.length > 0 ? (
                  employees.slice(0, 5).map((employee) => {
                    const name = employee.name || employee.datas?.name || "Unnamed Employee";
                    const role = employee.role || employee.datas?.role || "Staff";
                    const empId = employee.employee_id || employee.id || "";
                    
                    return (
                      <tr 
                        key={employee.id} 
                        className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/employee/${employee.id}`)}
                      >
                        <td className="px-4 py-3">
                          <p className="text-[13px] font-bold text-slate-800">{name}</p>
                          <p className="text-[11px] text-slate-500">ID: {empId}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[12px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{role}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[13px] font-medium text-slate-700">{employee.email || "-"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[13px] font-medium text-slate-800">{employee.phone || "-"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-flex ${getStatusStyle(employee.status || "active")}`}>
                            {employee.status || "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/employee/${employee.id}`);
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
                      No employees found matching your criteria.
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

export default EmployeeSearch;

