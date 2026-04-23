import { Boxes, IndianRupee, Layers, Package } from "lucide-react";
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
        .filter(([k]) => !["name", "product_name", "description"].includes(k))
        .map(([k, v]) => ({
          label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          value: String(v ?? "—"),
          icon: <Package size={20} className="text-slate-400" />,
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

    </div>
  );
};
