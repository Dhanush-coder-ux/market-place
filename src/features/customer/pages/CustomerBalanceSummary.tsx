import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, IndianRupee, Users, AlertCircle, CreditCard, X, Trash2 } from 'lucide-react';
import { BiLogoWhatsapp } from 'react-icons/bi';
import { StatCard } from '@/components/common/StatsCard';
import { ReusableSelect } from '@/components/ui/ReusableSelect';
import Input from '@/components/ui/Input';
import Loader from '@/components/common/Loader';
import { GradientButton } from '@/components/ui/GradientButton';
import { useApi } from '@/context/ApiContext';
import { useInputBuilderContext } from '@/components/inputbuilders/context/InputBuilderContext';
import { ENDPOINTS, SHOP_ID } from '@/services/endpoints';
import type { CustomerRecord } from '@/types/api';

export default function CustomerBalanceSummary() {
  const { getData, deleteData, loading, error, clearError } = useApi();
  const { fields, fetchCustomerFields } = useInputBuilderContext();

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  const filteredCustomers = useMemo(() => {
    if (statusFilter === 'All') return customers;
    return customers;
  }, [customers, statusFilter]);

  // Derive visible field keys from InputBuilderContext for rendering datas
  const visibleFields = useMemo(() => {
    if (!fields) return [];
    return Object.entries(fields)
      .filter(([, def]) => def.view_mode === 'SHOW')
      .slice(0, 4);
  }, [fields]);

  return (
    <div className="mx-auto min-h-screen">
      <div className="flex justify-end mb-4">
        <GradientButton path="/customers/add">+ Add Customer</GradientButton>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <span>{error}</span>
          <button onClick={clearError} className="shrink-0 text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      <div className='flex-none overflow-x-auto px-6 py-2.5 bg-accent rounded-xl mt-4'>
        <div className="flex gap-2.5 min-w-max">
          <StatCard label="Total Customers" value={customers.length} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <StatCard label="Shop" value={SHOP_ID.slice(0, 8) + "…"} icon={IndianRupee} iconBg="bg-green-50" iconColor="text-green-600" />
          <StatCard label="API Source" value="Live" icon={AlertCircle} iconBg="bg-rose-50" iconColor="text-rose-600" />
          <StatCard label="Showing" value={filteredCustomers.length} icon={CreditCard} iconBg="bg-amber-50" iconColor="text-amber-600" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-t-xl border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center mt-6">
        <div className="relative w-full sm:w-96">
          <Input
            leftIcon={<Search size={16} className='text-gray-400'/>}
            type="text"
            placeholder="Search by customer or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="text-gray-400" size={20} />
          <ReusableSelect
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val)}
            options={[
              { label: "All Statuses", value: "All" },
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8"><Loader /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-50 text-gray-700 text-sm border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  {visibleFields.map(([fieldName, def]) => (
                    <th key={fieldName} className="px-6 py-4 font-semibold">{def.label_name}</th>
                  ))}
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={visibleFields.length + 2} className="px-6 py-12 text-center text-gray-500">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <React.Fragment key={customer.id}>
                      <tr className={`hover:bg-gray-50 transition ${expandedId === customer.id ? 'bg-gray-50' : ''}`}>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-blue-600 text-base">
                            {String(customer.datas?.name ?? customer.id)}
                          </span>
                          <div className="text-sm text-gray-500 mt-0.5">{String(customer.datas?.phone ?? "—")}</div>
                          <div className="text-xs text-gray-400 mt-1">Shop: {customer.shop_id}</div>
                        </td>
                        {visibleFields.map(([fieldName]) => (
                          <td key={fieldName} className="px-6 py-4 text-gray-600">
                            {String(customer.datas?.[fieldName] ?? "—")}
                          </td>
                        ))}
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-sm rounded-md hover:bg-[#20bd5a] transition shadow-sm">
                              <BiLogoWhatsapp size={14} /> WhatsApp
                            </button>
                            <button
                              onClick={() => setExpandedId(expandedId === customer.id ? null : customer.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition"
                            >
                              {expandedId === customer.id ? <>Hide <ChevronUp size={14} /></> : <>View <ChevronDown size={14} /></>}
                            </button>
                            <button
                              onClick={() => handleDelete(customer.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expandedId === customer.id && (
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <td colSpan={visibleFields.length + 2} className="px-6 py-6">
                            <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                              <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">All Fields</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(customer.datas).map(([key, val]) => (
                                  <div key={key}>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">{key}</p>
                                    <p className="text-sm font-medium text-gray-800">{String(val ?? "—")}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
