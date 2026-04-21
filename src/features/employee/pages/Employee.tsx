import { useState, useEffect } from "react";
import { Trash, X, UserCheck, UserX } from "lucide-react";
import EmployeeHeader from "../components/EmployeeHeader";
import Table from "@/components/common/Table";
import Drawer from "@/components/common/Drawer";
import DetailView from "@/components/common/DetaileView";
import Loader from "@/components/common/Loader";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import type { EmployeeRecord } from "@/types/api";
import type { ReactNode } from "react";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: EmployeeRecord) => ReactNode;
}

const EMPLOYEE_COLUMNS: Column[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "mobile_number", label: "Mobile" },
  { key: "role", label: "Role", render: (v) => (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">{v}</span>
  )},
  { key: "is_accepted", label: "Status", render: (v) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
      v ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
    }`}>
      {v ? <UserCheck size={11} /> : <UserX size={11} />}
      {v ? "Accepted" : "Pending"}
    </span>
  )},
];

const Employee = () => {
  const { getData, deleteData, loading, error, clearError } = useApi();

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EmployeeRecord | null>(null);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    getData(ENDPOINTS.EMPLOYEES, { limit: "50", offset: "1" }).then((res) => {
      if (res) setEmployees(Array.isArray(res.data) ? res.data : [res.data]);
    });
  }, [refreshKey]);

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedRows.length} employee(s)?`)) return;
    await Promise.all(
      selectedRows.map((id) => deleteData(`${ENDPOINTS.EMPLOYEES}/${SHOP_ID}/${id}`))
    );
    setSelectedRows([]);
    setRefreshKey((k) => k + 1);
  };

  const handleRowClick = (row: EmployeeRecord) => {
    setSelectedItem(row);
    setIsOpen(true);
  };

  const detailSections = selectedItem ? [
    {
      title: "Personal Info",
      fields: [
        { label: "Full Name", value: selectedItem.name },
        { label: "Email", value: selectedItem.email },
        { label: "Mobile", value: selectedItem.mobile_number },
        { label: "Role", value: selectedItem.role },
      ].map(f => ({ icon: null as any, label: f.label, value: f.value })),
    },
    {
      title: "System Info",
      fields: [
        { label: "Employee ID", value: selectedItem.employee_id },
        { label: "Status", value: selectedItem.is_accepted ? "Accepted" : "Pending" },
        { label: "Added By", value: selectedItem.added_by },
        { label: "Account ID", value: selectedItem.account_id },
      ].map(f => ({ icon: null as any, label: f.label, value: f.value })),
    },
  ] : [];

  return (
    <div>
      <EmployeeHeader
        accepted={employees.filter(e => e.is_accepted).length}
        notAccepted={employees.filter(e => !e.is_accepted).length}
        searchValue=""
        onSearchChange={() => ""}
      />

      {error && (
        <div className="flex items-center justify-between gap-2 p-3 mt-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <span>{error}</span>
          <button onClick={clearError} className="shrink-0 text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      {selectedRows.length > 0 && (
        <div className="p-3 my-5 flex justify-between items-center bg-blue-50 text-blue-800 rounded-lg border border-blue-200 shadow-sm">
          <p>{selectedRows.length} items selected for action</p>
          <button onClick={handleDeleteSelected}>
            <Trash size={18} className="text-red-400 hover:text-red-600" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-5"><Loader /></div>
      ) : (
        <Table
          className="mt-5"
          columns={EMPLOYEE_COLUMNS}
          data={employees}
          onRowClick={(row) => handleRowClick(row)}
          selectedIds={selectedRows}
          onSelectionChange={setSelectedRows}
          rowKey="employee_id"
        />
      )}

      {!loading && employees.length === 0 && !error && (
        <div className="text-center py-12 text-slate-500 text-sm">No employees found.</div>
      )}

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Employee Details">
        {selectedItem && (
          <DetailView
            title="Employee Details"
            sections={detailSections}
            onEdit={() => console.log("Edit")}
            onDelete={async () => {
              if (!confirm("Delete this employee?")) return;
              await deleteData(`${ENDPOINTS.EMPLOYEES}/${selectedItem.shop_id}/${selectedItem.employee_id}`);
              setIsOpen(false);
              setRefreshKey((k) => k + 1);
            }}
          />
        )}
      </Drawer>
    </div>
  );
};

export default Employee;
