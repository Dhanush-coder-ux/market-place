import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Phone, MapPin, Mail, History, CheckCircle2,
  Search, Edit2, X, User, Briefcase, Shield, LucideIcon
} from "lucide-react";
import { StatsCard } from "@/components/common/StatsCard";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import Loader from "@/components/common/Loader";
import type { EmployeeRecord } from "@/types/api";

// ── Quick-search bar ────────────────────────────────────────────────────────
const EmployeeSearch = () => {
  const navigate = useNavigate();
  const { getData } = useApi();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EmployeeRecord[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      getData(ENDPOINTS.EMPLOYEES, { limit: "8", offset: "1", q: query, shop_id: SHOP_ID })
        .then((res) => {
          if (res?.data) {
            setResults(Array.isArray(res.data) ? res.data : [res.data]);
          }
        })
        .catch(console.error);
    }, 300);

    return () => clearTimeout(t);
  }, [query, getData]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
        <Search size={14} className="text-gray-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder="Search employee by name / ID…"
          className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400 min-w-0"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] overflow-hidden">
          {results.map((e) => (
            <button
              key={e.employee_id}
              onClick={() => {
                navigate(`/employee/${e.employee_id}`);
                setQuery("");
                setOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b last:border-0 border-gray-100 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900 truncate">
                {e.name || (e as any).datas?.name || e.email || "—"}
              </p>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5 truncate">
                {e.employee_id}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Sidebar item ────────────────────────────────────────────────────────────
interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  value: string;
  isMono?: boolean;
}

const SidebarItem = ({ icon: Icon, label, value, isMono = false }: SidebarItemProps) => (
  <div className="flex gap-4 items-start group">
    <div className="p-2 bg-gray-50/80 rounded-xl text-gray-400 shrink-0 mt-0.5 transition-colors group-hover:bg-blue-50 group-hover:text-blue-500">
      <Icon size={16} strokeWidth={1.5} />
    </div>
    <div className="min-w-0 space-y-0.5">
      <p className="text-[13px] font-medium text-gray-500">{label}</p>
      <p className={`text-sm font-medium text-gray-900 break-words ${isMono ? "font-mono text-[13px] tracking-tight" : ""}`}>
        {value}
      </p>
    </div>
  </div>
);

// ── Main page ───────────────────────────────────────────────────────────────
const EmployeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getData } = useApi();

  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("General Info");
  
  const tabs = ["General Info"];

  useEffect(() => {
    if (!id) return;
    
    setRecordLoading(true);
    getData(`${ENDPOINTS.EMPLOYEES}/by/${id}`)
      .then((res) => {
        if (res?.data) {
          setEmployee(Array.isArray(res.data) ? res.data[0] : res.data);
        } else {
          setEmployee(null);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch employee:", error);
        setEmployee(null);
      })
      .finally(() => {
        setRecordLoading(false);
      });
  }, [id, getData]);

  if (recordLoading) {
    return (
      <div className="p-12 flex justify-center items-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-gray-500 font-medium">Employee not found.</p>
        <div className="flex justify-center">
          <EmployeeSearch />
        </div>
      </div>
    );
  }

  const datas = (employee as any).datas || {};
  
  const getVal = (keys: string[], fallback = "—") => {
    for (const key of keys) {
      const val = (employee as any)[key] ?? datas[key];
      if (val !== undefined && val !== null && val !== "") return String(val);
    }
    return fallback;
  };

  const name = getVal(["name", "full_name"], "Unknown Employee");
  const phone = getVal(["mobile_number", "phone", "mobile"]);
  const email = getVal(["email", "email_address"]);
  const address = getVal(["address", "location", "home_address"]);

  const infoFields = [
    { label: "Full Name", value: name },
    { label: "Email", value: email },
    { label: "Mobile Number", value: phone },
    { label: "Role", value: getVal(["role", "access_role"]) },
    { label: "Employee ID", value: getVal(["employee_id", "emp_id"]) },
    { label: "Added By", value: getVal(["added_by"]) },
    { label: "Account ID", value: getVal(["account_id"]) },
    { label: "Shop ID", value: getVal(["shop_id"]) },
    { label: "Join Date", value: getVal(["joinDate", "joining_date"]) },
    { label: "System ID", value: employee.employee_id || "—" },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 md:pt-10 font-sans selection:bg-blue-100">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2.5 flex-1 min-w-0">
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${(employee as any).is_accepted ? "bg-emerald-50/50 border-emerald-100/50 text-emerald-600" : "bg-amber-50/50 border-amber-100/50 text-amber-600"}`}>
              <CheckCircle2 size={13} strokeWidth={2} />
              <span className="text-[11px] font-medium tracking-wide uppercase">
                {(employee as any).is_accepted ? "Active Employee" : "Pending Employee"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight truncate">
              {name}
            </h1>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <EmployeeSearch />
            <button
              onClick={() => navigate(`/employee/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm whitespace-nowrap"
            >
              <Edit2 size={14} /> Edit
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatsCard iconBg="bg-blue-50" iconColor="text-blue-600" label="Performance Score" value={getVal(["performance_score", "score"], "N/A")} icon={Briefcase} />
          <StatsCard iconBg="bg-amber-50" iconColor="text-amber-600" label="Current Task" value={getVal(["current_task", "active_task"], "0")} icon={History} />
          <StatsCard iconBg="bg-purple-50" iconColor="text-purple-600" label="Tasks Completed" value={getVal(["tasks_completed", "completed"], "0")} icon={CheckCircle2} />
          <StatsCard iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Attendance Rate" value={getVal(["attendance_rate", "attendance"], "100") + "%"} icon={CheckCircle2} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-base font-semibold text-gray-900 pb-4 border-b border-gray-100">
                Identity & Contact
              </h3>
              <div className="space-y-5">
                <SidebarItem icon={Phone} label="Mobile" value={phone} />
                <SidebarItem icon={Mail} label="Email" value={email} />
                <SidebarItem icon={Shield} label="Access Role" value={employee.role || datas.role || "UNKNOWN"} />
                <SidebarItem icon={MapPin} label="Address" value={address} />
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="border-b border-gray-200/80">
              <nav className="flex gap-6 overflow-x-auto hide-scrollbar">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 relative -mb-px ${
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

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
              {activeTab === "General Info" && (
                <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2.5 pb-4 border-b border-gray-50">
                    <User size={18} className="text-blue-500" strokeWidth={2} />
                    <h2 className="text-lg font-semibold text-gray-900">Professional Profile</h2>
                  </div>
                  {infoFields.length === 0 ? (
                    <p className="text-sm text-gray-500">No profile data available.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {infoFields.map((f) => (
                        <div key={f.label}>
                          <p className="text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                            {f.label}
                          </p>
                          <div className="bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-100/60 text-sm text-gray-700 hover:border-gray-200 transition-colors truncate">
                            {f.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetail;