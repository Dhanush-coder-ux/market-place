import { Boxes, IndianRupee, Layers, Package, ShieldCheck, Tag, Zap } from "lucide-react";
import type { InventoryRecord } from "@/types/api";

export const InventoryDetailContent = ({ item }: { item: InventoryRecord | null }) => {
  if (!item) return null;

  const productName = String(item.datas?.name ?? item.datas?.product_name ?? item.barcode ?? "—");
  const description = String(item.datas?.description ?? "No description provided for this item.");
  const buyPrice = item.buy_price ?? 0;
  const sellPrice = item.sell_price ?? 0;
  const stocks = item.stocks ?? 0;

  const profitMargin = sellPrice - buyPrice;
  const inventoryValue = sellPrice * stocks;

  const detailSections = [
    { label: "Product Name", value: productName, icon: <Package size={20} className="text-blue-500" /> },
    { label: "Barcode", value: item.barcode ?? "—", icon: <Boxes size={20} className="text-purple-500" /> },
    {
      label: "Current Stock",
      value: String(stocks),
      icon: <Layers size={20} className={stocks < 15 ? "text-red-500" : "text-green-500"} />,
    },
    {
      label: "Buying Price",
      value: `₹${buyPrice.toFixed(2)}`,
      icon: <IndianRupee size={20} className="text-gray-500" />,
    },
    {
      label: "Selling Price",
      value: `₹${sellPrice.toFixed(2)}`,
      icon: <IndianRupee size={20} className="text-green-600" />,
    },
  ];

  // Append any extra fields from datas that aren't already shown
  const extraFields = item.datas
    ? Object.entries(item.datas)
        .filter(([k]) => !["name", "product_name", "description", "batch_tracking", "serial_tracking", "id", "shop_id", "type"].includes(k))
        .map(([k, v]) => ({
          label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          value: String(v ?? "—"),
          icon: <Tag size={20} className="text-slate-400" />,
        }))
    : [];

  const allSections = [...detailSections, ...extraFields];

  return (
    <div className="space-y-6">

      {/* Header Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold">Profit Margin</p>
          <p className={`text-xl font-bold ${profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
            ₹{profitMargin.toFixed(2)}
          </p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold">Inventory Value</p>
          <p className="text-xl font-bold text-blue-600">₹{inventoryValue.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold">Stock Status</p>
          <p className={`text-sm font-semibold ${stocks === 0 ? "text-red-600" : stocks <= 15 ? "text-amber-600" : "text-green-600"}`}>
            {stocks === 0 ? "Out of Stock" : stocks <= 15 ? "Low Stock" : "In Stock"}
          </p>
        </div>
      </div>

      {/* Main Details List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50/50">
          <h3 className="font-semibold text-gray-700">General Information</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {allSections.map((section, idx) => (
            <div key={idx} className="flex items-center p-4 hover:bg-gray-50 transition-colors">
              <div className="mr-4 p-2 bg-gray-100 rounded-lg shrink-0">{section.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500">{section.label}</p>
                <p className="font-medium text-gray-900 truncate">{section.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-2">Product Description</h3>
        <p className="text-gray-600 leading-relaxed text-sm">{description}</p>
      </div>

      {/* Tracking & Verification Section */}
      {(!!item.datas?.batch_tracking || !!item.datas?.serial_tracking) && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-indigo-50/50 flex items-center gap-2">
            <ShieldCheck size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-indigo-900">Tracking & Verification</h3>
          </div>
          <div className="p-5 space-y-4">
            {!!item.datas?.batch_tracking && (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Package size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wider">Batch Tracking Enabled</h4>
                    <div className="h-5 w-9 rounded-full bg-blue-600 relative cursor-not-allowed opacity-80">
                       <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>
                  <p className="text-xs text-blue-700/70 mt-1 font-medium">
                    You enabled batch tracking for this product. This allows tracking of manufacturing/expiry dates and batch numbers across your inventory.
                  </p>
                </div>
              </div>
            )}

            {!!item.datas?.serial_tracking && (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-violet-50/50 border border-violet-100">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                  <Zap size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-violet-900 uppercase tracking-wider">Serial Tracking Enabled</h4>
                    <div className="h-5 w-9 rounded-full bg-violet-600 relative cursor-not-allowed opacity-80">
                       <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>
                  <p className="text-xs text-violet-700/70 mt-1 font-medium">
                    Serial number tracking is active for this item. Each unit has a unique identifier for precision inventory management.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
