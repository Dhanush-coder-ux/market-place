import { Search, Filter, Users, Trash2, Bookmark, Eye, Edit3, X, AlertCircle, ExternalLink } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { StatCard } from '@/components/common/StatsCard';
import { ReusableSelect } from '@/components/ui/ReusableSelect';
import Loader from '@/components/common/Loader';
import { GradientButton } from '@/components/ui/GradientButton';
import { useApi } from '@/context/ApiContext';
import { ENDPOINTS, SHOP_ID } from '@/services/endpoints';
import type { EmployeeRecord } from '@/types/api';
import { useHeader } from '@/context/HeaderContext';
import { useToast } from '@/context/ToastContext';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ColumnPicker } from '@/components/common/ColumnPicker';
import { RightSidebarFilter } from '@/components/common/RightSidebarFilter';

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

  const { setActions } = useHeader();

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeRecord | null>(null);

  // Dynamic Column State
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('employee_table_columns');
    return saved ? JSON.parse(saved) : ["email", "mobile_number", "role"];
  });

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        {!isCleanMode && (
          <button
            onClick={handleOpenNewTab}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-sm shrink-0"
            title="Open in New Tab"
          >
            <ExternalLink size={13} />
          </button>
        )}
        <button
          onClick={() => navigate("/employee/drafts")}
          className="h-8 px-3 rounded-md border border-slate-200 text-slate-600 font-medium text-[12px] bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <Bookmark size={13} />
          Drafts
        </button>
        <GradientButton path="/employee/add" className="h-8 flex items-center px-4 text-[12px] rounded-md">
          + Add Employee
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate, isCleanMode]);

  useEffect(() => {
    const params: Record<string, string> = { limit: "50", offset: "1" };
    if (searchTerm) params.q = searchTerm;

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
          keys.add("department");
          keys.add("joined_date");
        });
        const sortedKeys = Array.from(keys).sort();
        setAvailableKeys(sortedKeys);
      }
    });
  }, [refreshKey, searchTerm]);

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await deleteData(`${ENDPOINTS.EMPLOYEES}/${SHOP_ID}/${employeeToDelete.id}`);
      showToast("Employee deleted successfully", "success");
      setRefreshKey(prev => prev + 1);
    } catch (_err) {
      showToast("Failed to delete employee", "error");
    } finally {
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (!emp) return false;
      const matchesRole = roleFilter === 'All' || emp.role === roleFilter;
      const matchesSearch = (emp.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [employees, roleFilter, searchTerm]);

  const roles = useMemo(() => {
    const r = new Set(employees.filter(Boolean).map(e => e.role));
    const uniqueRoles = Array.from(r).filter(Boolean);
    return [
      { label: 'All Roles', value: 'All' },
      ...uniqueRoles.map(role => ({ label: role.charAt(0).toUpperCase() + role.slice(1), value: role }))
    ];
  }, [employees]);

  return (
    <div className="flex-1 flex flex-col min-h-0 font-sans w-full overflow-hidden relative">
      {/* Stats Section */}
      {!isCleanMode && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          <StatCard
            icon={Users}
            label="Total Employees"
            value={employees.length.toString()}
          />
          <StatCard
            label="Departments"
            value={new Set(employees.filter(Boolean).map(e => e.department)).size.toString()}
            iconBg="bg-emerald-50" iconColor="text-emerald-600"
          />
          <StatCard
            icon={Bookmark}
            label="Active Roles"
            value={new Set(employees.filter(Boolean).map(e => e.role)).size.toString()}
            iconBg="bg-amber-50" iconColor="text-amber-600"
          />
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-white border border-slate-100 rounded-lg p-2.5 px-3.5 flex flex-nowrap items-center gap-2 shadow-sm overflow-x-auto scrollbar-none mt-2">
        <div className="relative w-80 shrink-0">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search employee…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
          />
        </div>
        

        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className={`h-8 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0 ${
            roleFilter !== "All"
              ? "border-slate-200 text-slate-650 bg-white hover:bg-slate-50"
              : "border-slate-200 text-slate-650 bg-white hover:bg-slate-50"
          }`}
          title="Filters"
        >
          <Filter size={13} />
          {roleFilter !== "All" && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          )}
        </button>
          <ColumnPicker
          availableKeys={availableKeys}
          selectedKeys={selectedKeys}
          onApply={setSelectedKeys}
          storageKey="employee_table_columns"
          className="h-8 px-3 rounded-md border border-slate-200 text-slate-650 bg-white hover:bg-slate-50 active:scale-95 transition-all text-xs font-semibold shadow-sm shrink-0 flex items-center justify-center gap-1.5"
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
      <div className="bg-white border border-slate-100 rounded-lg shadow-sm min-w-0 overflow-hidden flex flex-col flex-1 min-h-0 mt-2">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold  tracking-[0.15em] border-b border-slate-100">
                <th className="px-6 py-5 whitespace-nowrap min-w-[200px]">Employee Name</th>
                <th className="px-6 py-5 whitespace-nowrap">Status</th>
                {selectedKeys.map(key => (
                  <th key={key} className="px-6 py-5 capitalize whitespace-nowrap">{key.replace(/_/g, ' ')}</th>
                ))}
                <th className="px-6 py-5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={selectedKeys.length + 4} className="py-20"><Loader /></td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={selectedKeys.length + 4} className="py-20 text-center text-slate-400 font-medium italic">No employees matching your filters.</td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="group hover:bg-blue-50/30 transition-all cursor-pointer"
                    onClick={() => navigate(`/employee/${emp.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-100">
                          {(emp.name || 'Unknown').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 tracking-tight">{emp.name || 'Unknown'}</p>
                          <p className="text-[11px] font-semibold text-slate-400 font-mono">ID: {emp.ui_id || emp.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold   border shadow-sm bg-emerald-50 text-emerald-600 border-emerald-100`}>
                        <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500`} />
                        Accepted
                      </span>
                    </td>
                    {selectedKeys.map(key => {
                      const value = (emp.datas as any)?.[key] ?? (emp as any)[key];
                      const displayValue = value === undefined || value === null ? "—" :
                        typeof value === 'object' ? (Array.isArray(value) ? value.join(", ") : JSON.stringify(value)) :
                          String(value);
                      return (
                        <td key={key} className="px-6 py-4 whitespace-nowrap">
                          <p className={`text-[12px] font-semibold tracking-tight ${key === 'role' ? 'text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-md' : 'text-slate-600'}`}>
                            {displayValue}
                          </p>
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/employee/${emp.id}`); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-sm active:scale-95"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/employee/${emp.id}/edit`); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-sm active:scale-95"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEmployeeToDelete(emp); setIsDeleteDialogOpen(true); }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all shadow-sm active:scale-95"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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

