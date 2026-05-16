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
      label: "Buy Price",
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
      {/* Header Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
          <p className="text-[10px] text-slate-400 font-black mb-1">Profit Margin</p>
          <p className={`text-xl font-black tabular-nums ${profitMargin >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            ₹{profitMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
          <p className="text-[10px] text-slate-400 font-black mb-1">Inventory Value</p>
          <p className="text-xl font-black text-blue-600 tabular-nums">₹{inventoryValue.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
          <p className="text-[10px] text-slate-400 font-black mb-1">Stock Status</p>
          <p className={`text-[13px] font-black ${stocks === 0 ? "text-rose-600" : stocks <= 15 ? "text-amber-600" : "text-emerald-600"}`}>
            {stocks === 0 ? "Out of Stock" : stocks <= 15 ? "Low Stock" : "In Stock"}
          </p>
        </div>
      </div>

      {/* Main Details List */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-slate-50/50">
          <h3 className="text-xs font-black text-slate-600">General Information</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {allSections.map((section, idx) => (
            <div key={idx} className="flex items-center p-4 hover:bg-slate-50 transition-colors">
              <div className="mr-4 p-2 bg-slate-50 rounded-lg shrink-0">{section.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-black">{section.label}</p>
                <p className="text-[13px] font-black text-slate-800 truncate tabular-nums">{section.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
        <h3 className="text-xs font-black text-slate-600 mb-3">Product Description</h3>
        <p className="text-slate-600 leading-relaxed text-sm font-medium">{description}</p>
      </div>

      {/* Tracking & Verification Section */}
      {(!!item.datas?.batch_tracking || !!item.datas?.serial_tracking) && (
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b bg-indigo-50/50 flex items-center gap-2">
            <ShieldCheck size={18} className="text-indigo-600" />
            <h3 className="text-sm font-black text-indigo-900">Tracking & Verification</h3>
          </div>
          <div className="p-5 space-y-4">
            {!!item.datas?.batch_tracking && (
              <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50/50 border border-blue-100">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Package size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-blue-900">Batch Tracking Enabled</h4>
                    <div className="h-5 w-9 rounded-full bg-blue-600 relative cursor-not-allowed opacity-80">
                       <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>
                  <p className="text-[11px] text-blue-700/70 mt-1 font-bold leading-relaxed">
                    You enabled batch tracking for this product. This allows tracking of manufacturing/expiry dates and batch numbers across your inventory.
                  </p>
                </div>
              </div>
            )}

            {!!item.datas?.serial_tracking && (
              <div className="flex items-start gap-4 p-4 rounded-lg bg-violet-50/50 border border-violet-100">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                  <Zap size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-violet-900">Serial Tracking Enabled</h4>
                    <div className="h-5 w-9 rounded-full bg-violet-600 relative cursor-not-allowed opacity-80">
                       <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>
                  <p className="text-[11px] text-violet-700/70 mt-1 font-bold leading-relaxed">
                    Serial number tracking is active for this item. Each unit has a unique identifier for precision inventory management.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Variants Section */}
      {item.has_variant && item.variants && item.variants.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b bg-amber-50/50 flex items-center gap-2">
            <Layers size={18} className="text-amber-600" />
            <h3 className="text-sm font-black text-amber-900">Product Variants</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 tracking-tight">Variant</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 tracking-tight text-right">Buy Price</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 tracking-tight text-right">Sell Price</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 tracking-tight text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {item.variants.map((variant, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-[13px] font-black text-slate-800">{variant.name || `Variant ${idx + 1}`}</td>
                    <td className="px-6 py-4 text-[13px] text-slate-600 font-bold tabular-nums text-right">₹{(variant.buy_price || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-[13px] text-emerald-600 font-black tabular-nums text-right">₹{(variant.sell_price || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-[13px] text-right">
                      <span className={`px-2.5 py-1 rounded-lg font-black tabular-nums ${variant.stocks < 10 ? "text-rose-600 bg-rose-50 border border-rose-100" : "text-slate-600 bg-slate-50 border border-slate-100"}`}>{variant.stocks || 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

