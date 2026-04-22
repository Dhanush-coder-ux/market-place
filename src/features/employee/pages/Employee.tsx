import { Search, Filter, Users, UserCheck, UserX, Trash2, Bookmark, Eye, Edit3, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@/components/common/StatsCard';
import { ReusableSelect } from '@/components/ui/ReusableSelect';
import Input from '@/components/ui/Input';
import Loader from '@/components/common/Loader';
import { GradientButton } from '@/components/ui/GradientButton';
import { useApi } from '@/context/ApiContext';
import { ENDPOINTS, SHOP_ID } from '@/services/endpoints';
import type { EmployeeRecord } from '@/types/api';
import { useHeader } from '@/context/HeaderContext';
import { useToast } from '@/context/ToastContext';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ColumnPicker } from '@/components/common/ColumnPicker';
import React, { useEffect, useMemo, useState } from 'react';

export default function Employee() {
  const { getData, deleteData, loading, error, clearError } = useApi();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { setActions } = useHeader();

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
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
        <button 
          onClick={() => navigate("/employee/drafts")}
          className="px-4 h-10 rounded-xl border border-blue-100 text-blue-600 font-bold text-[13px] bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2"
        >
          <Bookmark size={16} />
          Saved Drafts
        </button>
        <GradientButton path="/employee/add" className="h-10 flex items-center px-4 text-[13px]">+ Add Employee</GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => {
    const params: Record<string, string> = { limit: "50", offset: "1" };
    if (searchTerm) params.q = searchTerm;
    
    getData(ENDPOINTS.EMPLOYEES, params).then((res) => {
      if (res) {
        const data: EmployeeRecord[] = Array.isArray(res.data) ? res.data : [res.data];
        setEmployees(data);
        
        // Detect unique keys from the flat record
        const keys = new Set<string>();
        data.forEach((e: EmployeeRecord) => {
          Object.keys(e).forEach(k => {
            // Ignore system internal IDs and the primary name field
            if (!["id", "shop_id", "account_id", "name"].includes(k)) {
              keys.add(k);
            }
          });
        });
        const sortedKeys = Array.from(keys).sort();
        setAvailableKeys(sortedKeys);
      }
    });
  }, [refreshKey, searchTerm]);

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await deleteData(`${ENDPOINTS.EMPLOYEES}/${SHOP_ID}/${employeeToDelete.employee_id}`);
      showToast("Employee deleted successfully", "success");
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      showToast("Failed to delete employee", "error");
    } finally {
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesRole = roleFilter === 'All' || emp.role === roleFilter;
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [employees, roleFilter, searchTerm]);

  const roles = useMemo(() => {
    const r = new Set(employees.map(e => e.role));
    const uniqueRoles = Array.from(r);
    return [
      { label: 'All Roles', value: 'All' },
      ...uniqueRoles.map(role => ({ label: role.charAt(0).toUpperCase() + role.slice(1), value: role }))
    ];
  }, [employees]);

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          icon={Users} 
          label="Total Employees" 
          value={employees.length.toString()} 
        />
        <StatCard 
          icon={UserCheck} 
          label="Accepted" 
          value={employees.filter(e => e.is_accepted).length.toString()} 
          iconBg="bg-emerald-50" iconColor="text-emerald-600"
        />
        <StatCard 
          icon={UserX} 
          label="Pending" 
          value={employees.filter(e => !e.is_accepted).length.toString()} 
          iconBg="bg-amber-50" iconColor="text-amber-600"
        />
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Input
              leftIcon={<Search size={14} className='text-gray-400'/>}
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 text-sm"
            />
          </div>
          <ColumnPicker 
            availableKeys={availableKeys}
            selectedKeys={selectedKeys}
            onApply={setSelectedKeys}
            storageKey="employee_table_columns"
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100 transition-all shadow-sm">
            <Filter size={18} />
          </button>
          <ReusableSelect
            options={roles}
            value={roleFilter}
            onValueChange={setRoleFilter}
            placeholder="Filter by Role"
            className="w-48 h-11"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-rose-600">
            <AlertCircle size={20} />
            <p className="text-sm font-bold">{error}</p>
          </div>
          <button onClick={clearError} className="p-1 hover:bg-rose-100 rounded-lg transition-colors text-rose-400">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-100">
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
                    key={emp.employee_id} 
                    className="group hover:bg-blue-50/30 transition-all cursor-pointer"
                    onClick={() => navigate(`/employee/${emp.employee_id || emp.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-blue-100">
                          {emp.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 tracking-tight">{emp.name}</p>
                          <p className="text-[11px] font-bold text-slate-400 font-mono">ID: {emp.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                        emp.is_accepted 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${emp.is_accepted ? "bg-emerald-500" : "bg-amber-500"} ${!emp.is_accepted ? "animate-pulse" : ""}`} />
                        {emp.is_accepted ? "Accepted" : "Pending"}
                      </span>
                    </td>
                    {selectedKeys.map(key => (
                      <td key={key} className="px-6 py-4 whitespace-nowrap">
                        <p className={`text-[12px] font-bold tracking-tight ${key === 'role' ? 'text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-md' : 'text-slate-600'}`}>
                          {String(emp[key] ?? "—")}
                        </p>
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/employee/${emp.employee_id || emp.id}`); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/employee/${emp.employee_id || emp.id}/edit`); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEmployeeToDelete(emp); setIsDeleteDialogOpen(true); }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95"
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
