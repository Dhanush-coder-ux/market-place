import { Boxes, IndianRupee, Layers, Package, TrendingUp, TrendingDown } from "lucide-react";

export const InventoryDetailContent = ({ item }: { item: any }) => {
  if (!item) return null;

  const stockIncrease = item.stockIncrease ?? 0;
  const stockDecrease = item.stockDecrease ?? 0;

  const detailSections = [
    {
      label: "Product Name",
      value: item.name,
      icon: <Package size={20} className="text-blue-500" />,
    },
    {
      label: "Barcode",
      value: item.barcode,
      icon: <Boxes size={20} className="text-purple-500" />,
    },
    {
      label: "Current Stock",
      value: item.stock,
      icon: (
        <Layers
          size={20}
          className={item.stock < 100 ? "text-red-500" : "text-green-500"}
        />
      ),
    },
    {
      label: "Stock Increase",
      value: `+${stockIncrease}`,
      icon: <TrendingUp size={20} className="text-green-500" />,
    },
    {
      label: "Stock Decrease",
      value: `-${stockDecrease}`,
      icon: <TrendingDown size={20} className="text-red-500" />,
    },
    {
      label: "Buying Price",
      value: `₹${item.buyprice}`,
      icon: <IndianRupee size={20} className="text-gray-500" />,
    },
    {
      label: "Selling Price",
      value: `₹${item.sellprice}`,
      icon: <IndianRupee size={20} className="text-green-600" />,
    },
  ];

  const profitMargin = item.sellprice - item.buyprice;
  const inventoryValue = item.sellprice * item.stock;

  return (
    <div className="space-y-6">

      {/* Header Stat Cards */}
      <div className="grid grid-cols-3 gap-4">

        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold">
            Profit Margin
          </p>
          <p className="text-xl font-bold text-green-600">
            ₹{profitMargin}
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold">
            Inventory Value
          </p>
          <p className="text-xl font-bold text-blue-600">
            ₹{inventoryValue.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold">
            Stock Movement
          </p>
          <p className="text-sm font-semibold text-gray-700">
            +{stockIncrease} / -{stockDecrease}
          </p>
        </div>

      </div>

      {/* Main Details List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50/50">
          <h3 className="font-semibold text-gray-700">
            General Information
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {detailSections.map((section, idx) => (
            <div
              key={idx}
              className="flex items-center p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="mr-4 p-2 bg-gray-100 rounded-lg">
                {section.icon}
              </div>

              <div className="flex-1">
                <p className="text-sm text-gray-500">{section.label}</p>
                <p className="font-medium text-gray-900">{section.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Description Box */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-2">
          Product Description
        </h3>
        <p className="text-gray-600 leading-relaxed">
          {item.description || "No description provided for this item."}
        </p>
      </div>

    </div>
  );
};