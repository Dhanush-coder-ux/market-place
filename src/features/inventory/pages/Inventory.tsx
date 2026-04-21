import { useState, useEffect } from "react";
import {
  Trash,
  Package,
  MoreVertical,
  AlertCircle,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import InventoryHeader from "../components/InventoryHeader";
import Drawer from "../../../components/common/Drawer";
import SearchActionCard from "@/components/ui/SearchActionCard";
import { InventoryDetailContent } from "../components/InventoryDetailContent";
import Loader from "@/components/common/Loader";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import type { InventoryRecord } from "@/types/api";

const isLowStock = (stock: number) => stock > 0 && stock <= 15;
const isOutOfStock = (stock: number) => stock === 0;

const Inventory = () => {
  const { getData, deleteData, loading, error, clearError } = useApi();

  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryRecord | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const params: Record<string, string> = { shop_id: SHOP_ID, limit: "50", offset: "1" };
    if (searchQuery) params.q = searchQuery;
    getData(ENDPOINTS.INVENTORIES, params).then((res) => {
      if (res) setInventory(Array.isArray(res.data) ? res.data : [res.data]);
    });
  }, [refreshKey, searchQuery]);

  const handleRowClick = (item: InventoryRecord) => {
    setSelectedItem(item);
    setIsOpen(true);
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedRows);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedRows(next);
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedRows.size} item(s)?`)) return;
    await Promise.all(
      Array.from(selectedRows).map((id) =>
        deleteData(`${ENDPOINTS.INVENTORIES}/${id}/${SHOP_ID}`)
      )
    );
    setSelectedRows(new Set());
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6 text-slate-800 max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4">
        <InventoryHeader
          searchValue={searchQuery}
          lowestStockValue={inventory.filter((i) => isLowStock(i.stocks)).length}
          onSearchChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          totalCount={inventory.length}
        />
        <SearchActionCard
          searchValue={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products by name, SKU, or barcode..."
        />
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <span>{error}</span>
          <button onClick={clearError} className="shrink-0 text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      <AnimatePresence>
        {selectedRows.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-5 py-3.5 flex justify-between items-center bg-slate-800 text-white rounded-xl shadow-lg"
          >
            <p className="font-semibold text-sm flex items-center gap-3">
              <span className="bg-slate-700 text-white px-2.5 py-0.5 rounded-md">{selectedRows.size}</span>
              {selectedRows.size === 1 ? "item" : "items"} selected
            </p>
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors font-medium text-sm"
            >
              <Trash size={16} /> Delete Selected
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8"><Loader /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="p-4 w-14 text-center">
                    <input
                      type="checkbox"
                      className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedRows(new Set(inventory.map((i) => i.id)));
                        else setSelectedRows(new Set());
                      }}
                      checked={selectedRows.size === inventory.length && inventory.length > 0}
                    />
                  </th>
                  <th className="p-4 font-semibold">Product / Barcode</th>
                  <th className="p-4 text-right font-semibold">Buy Price</th>
                  <th className="p-4 text-right font-semibold">Sell Price</th>
                  <th className="p-4 text-right font-semibold">Stock</th>
                  <th className="p-4 w-14"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No inventory records found for this shop.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => {
                    const isSelected = selectedRows.has(item.id);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleRowClick(item)}
                        className={`group hover:bg-slate-50/60 cursor-pointer transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}
                      >
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(item.id)}
                            className="rounded-md border-slate-300 text-blue-600 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                            <Package size={16} className="text-slate-400 shrink-0" />
                            {String(item.datas?.name ?? item.barcode)}
                          </div>
                          <div className="text-xs font-mono text-slate-500 mt-1">{item.barcode}</div>
                        </td>
                        <td className="p-4 text-sm text-right text-slate-500">
                          ₹{item.buy_price?.toFixed(2) ?? "—"}
                        </td>
                        <td className="p-4 text-sm text-right font-medium text-slate-800">
                          ₹{item.sell_price?.toFixed(2) ?? "—"}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`inline-flex items-center justify-end gap-1.5 text-sm font-semibold ${
                            isOutOfStock(item.stocks) ? "text-red-600 bg-red-50 px-2.5 py-1 rounded-md" :
                            isLowStock(item.stocks) ? "text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md" :
                            "text-slate-800"
                          }`}>
                            {isOutOfStock(item.stocks) && <AlertCircle size={14} />}
                            {item.stocks}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <MoreVertical size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Inventory Details">
        <InventoryDetailContent item={selectedItem} />
      </Drawer>
    </div>
  );
};

export default Inventory;
