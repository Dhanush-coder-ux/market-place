import { Search, Filter, Users, X, AlertCircle, ExternalLink, Eye, Pencil, MoreVertical, Trash2, Mail, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { StatCard } from '@/components/common/StatsCard';
import { ReusableSelect } from '@/components/ui/ReusableSelect';
import SkeletonLoader from "@/components/common/SkeletonLoader";
import { GradientButton } from '@/components/ui/GradientButton';
import { useApi } from '@/context/ApiContext';
import { ENDPOINTS, SHOP_ID } from '@/services/endpoints';
import type { EmployeeRecord } from '@/types/api';
import { useHeader } from '@/context/HeaderContext';
import { useToast } from '@/context/ToastContext';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ColumnPicker } from '@/components/common/ColumnPicker';
import { RightSidebarFilter } from '@/components/common/RightSidebarFilter';
import { employeeApi } from '@/services/api/employee';
import { useEffect, useMemo, useState } from 'react';

export default function Employee() {
  const { getData, deleteData, loading, error, clearError } = useApi();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isCleanMode = new URLSearchParams(location.search).get("mode") === "clean";

  const handleOpenNewTab = () => {
    window.open(`${window.location.pathname}?mode=clean`, "_blank", "noopener,noreferrer");
  };

  const { setActions, setBottomActions } = useHeader();

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeRecord | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Dynamic Column State
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('employee_table_columns');
    return saved ? JSON.parse(saved) : ["email", "mobile_number", "role"];
  });

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('clear-api-cache'));
            setRefreshKey(prev => prev + 1);
          }}
          className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-sm shrink-0"
          title="Refresh"
        >
          <RefreshCw size={13} />
        </button>
        {!isCleanMode && (
          <button
            onClick={handleOpenNewTab}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-sm shrink-0"
            title="Open in New Tab"
          >
            <ExternalLink size={13} />
          </button>
        )}

        <GradientButton path="/employee/add" className="h-8 flex items-center px-4 text-[12px] rounded-md">
          + Add Employee
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate, isCleanMode]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const params: Record<string, string> = { limit: "50", offset: "1" };
    // Fetch all and perform search locally to avoid backend issues

    getData(`${ENDPOINTS.EMPLOYEES}/by/shop/${SHOP_ID}`, params).then((res) => {
      if (res) {
        const data: EmployeeRecord[] = res.data?.datas ? res.data.datas : (Array.isArray(res.data) ? res.data : [res.data]);
        setEmployees(data);

        // Detect unique keys from both root and datas field
        const keys = new Set<string>();
        data.forEach((e: any) => {
          // Root level keys
          Object.keys(e).forEach(k => {
            if (!["id", "shop_id", "ui_id", "name", "datas", "created_at", "updated_at", "joined_date"].includes(k)) {
              keys.add(k);
            }
          });
          // Nested datas keys
          if (e.datas) {
            Object.keys(e.datas).forEach(k => {
              if (!["id", "shop_id", "name", "salary_range", "address"].includes(k)) {
                keys.add(k);
              }
            });
          }
          keys.add("joined_date");
        });
        const sortedKeys = Array.from(keys).sort();
        setAvailableKeys(sortedKeys);
      }
    });
  }, [refreshKey]); // Fetch only on refreshKey change

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    try {
      const targetId = String(employeeToDelete.employee_id || employeeToDelete.id);
      await deleteData(`${ENDPOINTS.EMPLOYEES}/${SHOP_ID}/${targetId}`);
      showToast("Employee deleted successfully", "success");
      setSelectedEmployees(prev => {
        const next = new Set(prev);
        next.delete(String(employeeToDelete.employee_id || employeeToDelete.id));
        return next;
      });
      setRefreshKey(prev => prev + 1);
    } catch (_err) {
      showToast("Failed to delete employee", "error");
    } finally {
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmployees.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete these ${selectedEmployees.size} employees?`)) return;
    try {
      for (const id of Array.from(selectedEmployees)) {
        await deleteData(`${ENDPOINTS.EMPLOYEES}/${SHOP_ID}/${id}`);
      }
      showToast("Selected employees deleted successfully", "success");
      setSelectedEmployees(new Set());
      setRefreshKey(prev => prev + 1);
    } catch {
      showToast("Failed to delete some employees", "error");
    }
  };

  const handleResendVerification = async (emp: EmployeeRecord) => {
    if (!(emp?.id || emp?.employee_id)) return;
    try {
      await employeeApi.resendVerificationEmail({
        id: String(emp.employee_id || emp.id),
        shop_id: emp.shop_id || SHOP_ID
      });
      showToast("Verification email sent again", "success");
    } catch (_err) {
      showToast("Failed to send verification email", "error");
    }
  };

  const toggleSelectEmployee = (id: string) => {
    setSelectedEmployees(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredEmployees = useMemo(() => {
    let result = employees;

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((emp: any) => {
        if (!emp) return false;
        const name = emp.name || "";
        const email = emp.email || "";
        const mobile = emp.mobile_number || "";
        const role = emp.role || "";
        const empId = emp.ui_id || emp.id || "";
        return name.toLowerCase().includes(q) ||
               email.toLowerCase().includes(q) ||
               mobile.toLowerCase().includes(q) ||
               role.toLowerCase().includes(q) ||
               empId.toLowerCase().includes(q) ||
               (emp.employee_id || "").toLowerCase().includes(q);
      });
    }

    result = result.filter((emp: any) => {
      if (!emp) return false;
      const matchesRole = roleFilter === 'All' || emp.role === roleFilter;
      return matchesRole;
    });

    return result;
  }, [employees, roleFilter, debouncedSearch]);

  const roles = useMemo(() => {
    const unique = new Set(employees.map(e => e.role).filter(Boolean));
    return [{ label: 'All roles', value: 'All' }, ...Array.from(unique).map(r => ({ label: String(r), value: String(r) }))];
  }, [employees]);

  useEffect(() => {
    if (selectedEmployees.size > 1) {
      setBottomActions(
        <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
              E
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-800 leading-tight">Selected {selectedEmployees.size} Employees</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="h-8 px-3 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-655 font-bold text-[11px] transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              Delete All
            </button>
          </div>
        </div>
      );
    } else {
      setBottomActions(null);
    }
  }, [selectedEmployees, setBottomActions]);

  if (loading && employees.length === 0 && !searchTerm && !debouncedSearch) {
    return (
      <div className="flex-1 p-6">
        <SkeletonLoader variant="list" rows={8} showStats={true} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-2.5 font-sans w-full overflow-hidden relative">
      <style>{`
        .pf-scroll::-webkit-scrollbar { width:6px; height:6px; } 
        .pf-scroll::-webkit-scrollbar-track { background:#f4f7fb } 
        .pf-scroll::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:3px }
        .pf-scroll::-webkit-scrollbar-thumb:hover { background:#94a3b8 }
      `}</style>

      {/* Stats Section */}
      {!isCleanMode && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          <StatCard
            icon={<Users size={18} />}
            iconBg="bg-blue-50 text-blue-650"
            label="Total Members"
            value={employees.length.toString()}
            subValue="active members"
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border border-slate-100 rounded-lg p-2.5 px-3.5 flex flex-wrap items-center gap-2 shadow-sm mt-2">
        <div className="relative w-80 shrink-0">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employee name, role…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
          />
        </div>
        <button
          onClick={() => setIsFilterOpen(true)}
          className={`h-8 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0 ${roleFilter !== "All" ? "border-blue-200 text-blue-600 bg-blue-50/50" : "border-slate-200 text-slate-650 bg-white hover:bg-slate-50"}`}
        >
          <Filter size={13} />
          {roleFilter !== "All" && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
        </button>
        <ColumnPicker
          availableKeys={availableKeys}
          selectedKeys={selectedKeys}
          onApply={setSelectedKeys}
          storageKey="employee_table_columns"
          className="h-8 px-3 rounded-md border border-slate-200 text-slate-655 bg-white hover:bg-slate-50 active:scale-95 transition-all text-xs font-semibold shadow-sm shrink-0 flex items-center justify-center gap-1.5"
        />
        <div className="flex-1" />
      </div>

      <RightSidebarFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => {}}
        onClear={() => setRoleFilter("All")}
        title="Employee Filters"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role</label>
            <ReusableSelect
              options={roles}
              value={roleFilter}
              onValueChange={setRoleFilter}
              placeholder="Role"
            />
          </div>
        </div>
      </RightSidebarFilter>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-rose-600">
            <AlertCircle size={20} />
            <p className="text-sm font-semibold">{error}</p>
          </div>
          <button onClick={clearError} className="p-1 hover:bg-rose-100 rounded-lg transition-colors text-rose-400">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 min-w-0 overflow-hidden flex flex-col flex-1 min-h-0 mt-2">
        <div className="overflow-x-auto overflow-y-auto flex-1 pf-scroll">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_#e2e8f0]">
              <tr>
                <th className="px-4 py-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredEmployees.length > 0 && filteredEmployees.every(emp => selectedEmployees.has(String(emp.employee_id || emp.id)))}
                    onChange={() => {
                      const allSelected = filteredEmployees.length > 0 && filteredEmployees.every(emp => selectedEmployees.has(String(emp.employee_id || emp.id)));
                      if (allSelected) {
                        setSelectedEmployees(new Set());
                      } else {
                        setSelectedEmployees(new Set(filteredEmployees.map(emp => String(emp.employee_id || emp.id))));
                      }
                    }}
                    className="rounded border-slate-350 text-blue-605 focus:ring-blue-500/20 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[200px]">Employee Name</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                {selectedKeys.map(key => (
                  <th key={key} className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{key.replace(/_/g, ' ')}</th>
                ))}
                <th className="px-4 py-3 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap w-24 sticky right-0 bg-white shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={selectedKeys.length + 5} className="py-20 text-center text-slate-400 font-medium italic">No employees matching your filters.</td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const empId = String(emp.employee_id || emp.id);
                  const isSelected = selectedEmployees.has(empId);

                  return (
                    <tr
                      key={empId}
                      className={`group transition-all cursor-default ${isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-slate-50/60"}`}
                    >
                      <td className="px-6 py-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectEmployee(empId)}
                          className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-700 tracking-tight">{emp.name || 'Unknown'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {emp.accepted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-sm bg-emerald-50 text-emerald-600 border-emerald-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Accepted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-sm bg-amber-50 text-amber-600 border-amber-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending
                          </span>
                        )}
                      </td>
                      {selectedKeys.map(key => {
                        const value = (emp.datas as any)?.[key] ?? (emp as any)[key];
                        const displayValue = value === undefined || value === null ? "—" :
                          typeof value === 'object' ? (Array.isArray(value) ? value.join(", ") : JSON.stringify(value)) :
                            String(value);
                        return (
                          <td key={key} className="px-6 py-4 whitespace-nowrap">
                            <p className={`text-[12px] font-semibold tracking-tight ${key === 'role' ? 'text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-md' : 'text-slate-650'}`}>
                              {displayValue}
                            </p>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-100 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)] transition-colors whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 relative">
                          <button
                            onClick={() => navigate(`/employee/${empId}`)}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                            title="View Employee"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => navigate(`/employee/${empId}/edit`)}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                            title="Edit Employee"
                          >
                            <Pencil size={15} />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setActiveMenuId(activeMenuId === empId ? null : empId)}
                              className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                              title="More actions"
                            >
                              <MoreVertical size={15} />
                            </button>
                            {activeMenuId === empId && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                                <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-left font-sans animate-in fade-in slide-in-from-top-1 duration-150">
                                  {!emp.accepted && (
                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        handleResendVerification(emp);
                                      }}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                      <Mail size={13} />
                                      Resend Invite
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setEmployeeToDelete(emp);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-red-650 hover:bg-red-50"
                                  >
                                    <Trash2 size={13} />
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Remove Employee"
        description={`Are you sure you want to remove ${employeeToDelete?.name}? This action cannot be undone.`}
        confirmText="Remove Member"
        type="danger"
      />
    </div>
  );
}
