import { useState, useEffect } from "react";
import Table from "@/components/common/Table";
import { Search, Trash2, X } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import Input from "@/components/ui/Input";
import { useNavigate } from "react-router-dom";
import Loader from "@/components/common/Loader";
import { useApi } from "@/context/ApiContext";
import { useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { ENDPOINTS } from "@/services/endpoints";
import type { CustomerRecord } from "@/types/api";

const CustomerList = () => {
  const navigate = useNavigate();
  const { getData, deleteData, loading, error, clearError } = useApi();
  const { fields, fetchCustomerFields } = useInputBuilderContext();

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { fetchCustomerFields(); }, []);

  useEffect(() => {
    const params: Record<string, string> = { limit: "50", offset: "1" };
    if (searchTerm) params.q = searchTerm;
    getData(ENDPOINTS.CUSTOMERS, params).then((res) => {
      if (res) setCustomers(Array.isArray(res.data) ? res.data : [res.data]);
    });
  }, [refreshKey, searchTerm]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    await deleteData(`${ENDPOINTS.CUSTOMERS}/${id}`);
    setRefreshKey((k) => k + 1);
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedIds.length} customer(s)?`)) return;
    await Promise.all(selectedIds.map((id) => deleteData(`${ENDPOINTS.CUSTOMERS}/${id}`)));
    setSelectedIds([]);
    setRefreshKey((k) => k + 1);
  };

  const dynamicColumns = fields
    ? Object.entries(fields)
        .filter(([, def]) => def.view_mode === "SHOW")
        .map(([fieldName, def]) => ({
          key: fieldName,
          label: def.label_name,
          render: (_: any, row: CustomerRecord) => String(row.datas?.[fieldName] ?? "—"),
        }))
    : [{ key: "id", label: "ID", render: (_: any, row: CustomerRecord) => row.id }];

  const columns = [
    ...dynamicColumns,
    {
      key: "_actions",
      label: "",
      render: (_: any, row: CustomerRecord) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center">
        <GradientButton path="/customers/add">+ Add Customer</GradientButton>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <span>{error}</span>
          <button onClick={clearError} className="shrink-0 text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-blue-100 shadow-xl overflow-hidden flex flex-col">
        <div className="p-6 flex flex-col md:flex-row gap-4 justify-between items-center border-b border-blue-50 bg-white">
          <div className="w-full max-w-md">
            <Input
              leftIcon={<Search size={18} className="text-blue-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name..."
            />
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="px-6 py-2.5 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200 transition-all active:scale-95 hover:bg-red-100"
            >
              Delete Selected ({selectedIds.length})
            </button>
          )}
        </div>

        <div className="flex-1">
          {loading ? (
            <div className="p-8"><Loader /></div>
          ) : (
            <Table
              columns={columns}
              data={customers}
              rowKey="id"
              selectedIds={selectedIds}
              onSelectionChange={(ids) => setSelectedIds(ids)}
              onRowClick={(row) => navigate(`/customers/${row.id}`)}
            />
          )}
          {!loading && customers.length === 0 && !error && (
            <div className="text-center py-12 text-slate-500 text-sm">No customers found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerList;
