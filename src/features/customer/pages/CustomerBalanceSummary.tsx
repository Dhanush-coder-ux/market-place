import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, CreditCard, IndianRupee, Users, AlertCircle } from 'lucide-react';
import { BiLogoWhatsapp } from 'react-icons/bi';
import { StatCard } from '@/components/common/StatsCard';
import Title from '@/components/common/Title';
import { ReusableSelect } from '@/components/ui/ReusableSelect';
import Input from '@/components/ui/Input';

// --- Types ---
type Transaction = {
  id: string;
  date: string;
  description: string;
  type: 'billed' | 'paid';
  amount: number;
};

type CustomerBalance = {
  id: string;
  name: string;
  phone: string;
  totalCredit: number;
  totalPaid: number;
  outstanding: number;
  status: 'Overdue' | 'Pending' | 'Cleared';
  ledger: Transaction[];
  lastTransactionDate: string;
  creditLimit: number;
  overdueDays?: number; 
};

// --- Mock Data ---
const MOCK_CUSTOMERS: CustomerBalance[] = [
  {
    id: '1',
    name: 'Sharma ji',
    phone: '+91 98765 43210',
    totalCredit: 8000,
    totalPaid: 2000,
    outstanding: 6000,
    status: 'Overdue',
    lastTransactionDate: '12 Mar 2026',
    creditLimit: 20000,
    overdueDays: 15,
    ledger: [
      { id: 't1', date: '2026-02-15', description: 'Invoice #101 (Groceries)', type: 'billed', amount: 5000 },
      { id: 't2', date: '2026-03-01', description: 'Invoice #145 (Groceries)', type: 'billed', amount: 3000 },
      { id: 't3', date: '2026-03-12', description: 'Payment Received (Cash)', type: 'paid', amount: 2000 },
    ],
  },
  {
    id: '2',
    name: 'Deepak',
    phone: '+91 91234 56789',
    totalCredit: 12000,
    totalPaid: 12000,
    outstanding: 0,
    status: 'Cleared',
    lastTransactionDate: '11 Mar 2026',
    creditLimit: 15000,
    ledger: [
      { id: 't4', date: '2026-03-10', description: 'Invoice #140 (Electronics)', type: 'billed', amount: 12000 },
      { id: 't5', date: '2026-03-11', description: 'Payment Received (UPI)', type: 'paid', amount: 12000 },
    ],
  },
  {
    id: '3',
    name: 'Rajapandi',
    phone: '+91 99887 76655',
    totalCredit: 25000,
    totalPaid: 10000,
    outstanding: 15000,
    status: 'Pending',
    lastTransactionDate: '12 Mar 2026',
    creditLimit: 30000,
    ledger: [
      { id: 't6', date: '2026-03-12', description: 'Invoice #148 (Hardware)', type: 'billed', amount: 25000 },
      { id: 't7', date: '2026-03-12', description: 'Advance Payment', type: 'paid', amount: 10000 },
    ],
  },
];

export default function CustomerBalanceSummary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // --- Derived State for KPIs and Filtering ---
  const filteredCustomers = useMemo(() => {
    return MOCK_CUSTOMERS.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const totalOutstanding = useMemo(() => MOCK_CUSTOMERS.reduce((sum, c) => sum + c.outstanding, 0), []);
  const overdueBalance = useMemo(() => MOCK_CUSTOMERS.filter(c => c.status === 'Overdue').reduce((sum, c) => sum + c.outstanding, 0), []);
  const activeDefaulters = useMemo(() => MOCK_CUSTOMERS.filter(c => c.outstanding > 0).length, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Overdue': return 'bg-red-100 text-red-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Cleared': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="mx-auto min-h-screen">
      <div className="flex items-start justify-between gap-4">
        <Title
          title="Customer Balance Summary"
          subtitle="Track pending payments and customer accounts"
        />
      </div>

      {/* Stats row */}
      <div className='flex-none overflow-x-auto px-6 py-2.5 bg-accent rounded-xl mt-4'>
        <div className="flex gap-2.5 min-w-max">
          <StatCard
            label="Total Customers"
            value={MOCK_CUSTOMERS.length}
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            label="Total Outstanding"
            value={totalOutstanding}
            icon={IndianRupee}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <StatCard
            label="Overdue Balances"
            value={overdueBalance}
            icon={AlertCircle}
            iconBg="bg-rose-50"
            iconColor="text-rose-600"
          />
          <StatCard
            label="Active Credit"
            value={activeDefaulters}
            icon={CreditCard}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-t-xl border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center mt-6">
        <div className="relative w-full sm:w-96">
          <Input
            leftIcon={<Search size={16} className='text-gray-400'/>}
            type="text"
            placeholder="Search by customer or phone..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
              { label: "Overdue", value: "Overdue" },
              { label: "Pending", value: "Pending" },
              { label: "Cleared", value: "Cleared" },
            ]}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-50 text-gray-700 text-sm border-b border-gray-200">
                <th className="px-6 py-4 font-semibold">Customer Details</th>
                <th className="px-6 py-4 font-semibold">Credit Limit</th>
                <th className="px-6 py-4 font-semibold">Outstanding</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <React.Fragment key={customer.id}>
                    {/* Main Row */}
                    <tr className={`hover:bg-gray-50 transition ${expandedId === customer.id ? 'bg-gray-50' : ''}`}>
                      
                      {/* 1. Customer Details & Link */}
                      <td className="px-6 py-4">
                        {/* Note: If using Next.js, replace <a> with <Link href={`/customers/${customer.id}`}> */}
                        {/* Note: If using React Router, replace <a> with <Link to={`/customers/${customer.id}`}> */}
                        <a 
                         
                          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition text-base"
                        >
                          {customer.name}
                        </a>
                        <div className="text-sm text-gray-500 mt-0.5">{customer.phone}</div>
                        <div className="text-xs text-gray-400 mt-1">Last Purchase: {customer.lastTransactionDate}</div>
                      </td>

                      {/* 2. Credit Limit */}
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        ₹{customer.creditLimit.toLocaleString('en-IN')}
                        {customer.outstanding >= customer.creditLimit && (
                          <span className="block text-[10px] text-rose-500 mt-0.5 font-semibold">Limit Reached</span>
                        )}
                      </td>

                      {/* 3. Outstanding Balance */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-base">₹{customer.outstanding.toLocaleString('en-IN')}</div>
                        <div className="text-xs text-gray-500 mt-1">Total Paid: ₹{customer.totalPaid.toLocaleString('en-IN')}</div>
                      </td>

                      {/* 4. Status & Overdue Days */}
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(customer.status)}`}>
                          {customer.status}
                        </span>
                        {customer.status === 'Overdue' && customer.overdueDays && (
                          <div className="text-xs text-red-600 font-medium mt-1.5 ml-1">
                            {customer.overdueDays} days
                          </div>
                        )}
                      </td>

                      {/* 5. Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {customer.outstanding > 0 && (
                            <>
                              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition shadow-sm">
                                <CreditCard size={14} /> Pay
                              </button>
                              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-sm rounded-md hover:bg-[#20bd5a] transition shadow-sm">
                                <BiLogoWhatsapp size={14} /> WhatsApp
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => toggleExpand(customer.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition"
                          >
                            {expandedId === customer.id ? (
                              <>Hide <ChevronUp size={14} /></>
                            ) : (
                              <>View <ChevronDown size={14} /></>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Ledger Row */}
                    {expandedId === customer.id && (
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <td colSpan={5} className="px-6 py-6">
                          <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Recent Ledger (Last 30 Days)</h4>
                            <div className="space-y-3">
                              {customer.ledger.map((tx) => (
                                <div key={tx.id} className="flex justify-between items-center text-sm px-2 py-1 rounded hover:bg-gray-50">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-800">{tx.description}</span>
                                    <span className="text-gray-500 text-xs">{tx.date}</span>
                                  </div>
                                  <span className={`font-semibold ${tx.type === 'billed' ? 'text-red-600' : 'text-green-600'}`}>
                                    {tx.type === 'billed' ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center font-bold text-gray-900 px-2">
                              <span>Total Outstanding Balance:</span>
                              <span className="text-lg">₹{customer.outstanding.toLocaleString('en-IN')}</span>
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
      </div>
    </div>
  );
}