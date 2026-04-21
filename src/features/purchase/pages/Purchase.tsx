import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Search, X } from "lucide-react";

import Table from "@/components/common/Table";
import PurchaseHeader from "@/features/purchase/components/PurchaseHeader";
import Loader from "@/components/common/Loader";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import type { PurchaseRecord } from "@/types/api";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: PurchaseRecord) => ReactNode;
}

const PURCHASE_COLUMNS: Column[] = [
  {
    key: "date",
    label: "Purchase Date",
    render: (_, row) => (
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-700">
          {String(row.datas?.purchase_date ?? row.date ?? "—")}
        </span>
        <span className="text-[10px] text-slate-400 font-medium">{row.type}</span>
      </div>
    ),
  },
  {
    key: "supplier",
    label: "Supplier",
    render: (_, row) => (
      <span className="text-sm text-slate-600">{String(row.datas?.supplier ?? row.datas?.supplier_name ?? "—")}</span>
    ),
  },
  {
    key: "products",
    label: "Products",
    render: (_, row) => {
      const products = row.datas?.purchase_products as any[] | undefined;
      const first = products?.[0];
      const extra = (products?.length ?? 0) - 1;
      return (
        <div className="flex flex-col items-start">
          <span className="text-sm text-slate-700 font-medium">
            {first ? String(first.product_name ?? first.name ?? "Item") : "—"}
          </span>
          {extra > 0 && (
            <span className="mt-1 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-md">
              +{extra} more items
            </span>
          )}
        </div>
      );
    },
  },
  {
    key: "total_cost",
    label: "Total Cost",
    render: (_, row) => (
      <span className="text-sm text-slate-900 font-bold">
        ₹{Number(row.datas?.total_cost ?? row.datas?.grand_total ?? 0).toLocaleString()}
      </span>
    ),
  },
  {
    key: "id",
    label: "Reference",
    render: (_, row) => (
      <span className="text-xs font-mono text-slate-500">{row.id.slice(0, 8)}…</span>
    ),
  },
];

const PurchaseHistoryTab = () => {
  const navigate = useNavigate();
  const { getData, loading, error, clearError } = useApi();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey] = useState(0);

  useEffect(() => {
    const params: Record<string, string> = {
      type: "DIRECT",
      shop_id: SHOP_ID,
      limit: "50",
      offset: "1",
    };
    if (searchTerm) params.q = searchTerm;
    getData(ENDPOINTS.PURCHASES, params).then((res) => {
      if (res) setPurchases(Array.isArray(res.data) ? res.data : [res.data]);
    });
  }, [refreshKey, searchTerm]);

  return (
    <div className="space-y-6">
      <PurchaseHeader />

      {error && (
        <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <span>{error}</span>
          <button onClick={clearError}><X size={14} /></button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/30">
          <h3 className="heading-label text-slate-700">Direct Purchase Orders</h3>
        </div>

        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Search by supplier or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors">
            <Filter size={16} /> Filter
          </button>
        </div>

        {loading ? (
          <div className="p-8"><Loader /></div>
        ) : (
          <Table
            columns={PURCHASE_COLUMNS}
            data={purchases}
            rowKey="id"
            onRowClick={() => navigate("/purchase/detail")}
          />
        )}

        {!loading && purchases.length === 0 && !error && (
          <div className="text-center py-12 text-slate-500 text-sm">No direct purchases found.</div>
        )}
      </div>
    </div>
  );
};

export default PurchaseHistoryTab;
