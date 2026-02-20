import Table from "@/components/common/Table";
import type { ProductData } from "../type";
import ProductHeader from "../components/ProductHeader";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";


/* ================= MOCK DATA ================= */

export const MOCK_PRODUCTS: ProductData[] = [
  {
    id: 1,
    name: "Mechanical Keyboard G915",
    sku: "KB-915-WL",
    category: "Peripherals",
    selling_price: 249.99,
    unit: "pcs",
    min_threshold: 5,
    default_supplier: "Logitech Logistics",
    avg_buying_cost: 180.0,
    current_stock: 12,
  },
  {
    id: 2,
    name: 'UltraWide Monitor 34"',
    sku: "MON-UW-34",
    category: "Displays",
    selling_price: 899.0,
    unit: "pcs",
    min_threshold: 3,
    default_supplier: "Samsung Global",
    avg_buying_cost: 650.5,
    current_stock: 2,
  },
  {
    id: 3,
    name: "USB-C Hub 7-in-1",
    sku: "ACC-HUB-07",
    category: "Accessories",
    selling_price: 45.0,
    unit: "pcs",
    min_threshold: 15,
    default_supplier: "Anker Direct",
    avg_buying_cost: 22.0,
    current_stock: 45,
  },
  {
    id: 4,
    name: "Ergonomic Office Chair",
    sku: "FUR-ERG-01",
    category: "Furniture",
    selling_price: 350.0,
    unit: "pcs",
    min_threshold: 2,
    default_supplier: "Steelcase Distribution",
    avg_buying_cost: 210.0,
    current_stock: 0,
  },
  {
    id: 5,
    name: "Noise Cancelling Headphones",
    sku: "AUD-BT-500",
    category: "Audio",
    selling_price: 299.0,
    unit: "pcs",
    min_threshold: 8,
    default_supplier: "Sony Electronics",
    avg_buying_cost: 195.0,
    current_stock: 10,
  },
];

/* ================= COLUMN TYPE ================= */

interface Column {
  key: keyof ProductData;
  label: string;
  render?: (value: any, row: ProductData) => ReactNode;
}

/* ================= TABLE COLUMNS ================= */

const PRODUCT_COLUMNS: Column[] = [
  { key: "name", label: "Product Name" },
  { key: "sku", label: "SKU" },
  { key: "category", label: "Category" },

  {
    key: "selling_price",
    label: "Selling Price",
    render: (value: number) => (
      <span className="font-medium text-gray-900">
        ${value.toFixed(2)}
      </span>
    ),
  },

  { key: "unit", label: "Unit" },

  {
    key: "min_threshold",
    label: "Min Threshold",
  },

  {
    key: "avg_buying_cost",
    label: "Avg Buying Cost",
    render: (value: number) => (
      <span className="text-gray-700">
        ${value.toFixed(2)}
      </span>
    ),
  },

  {
    key: "current_stock",
    label: "Current Stock",
    render: (value: number, row: ProductData) => {
      const isOut = value === 0;
      const isLow = value > 0 && value <= row.min_threshold;

      let style = "bg-green-100 text-green-600";
      let text = `${value}`;

      if (isOut) {
        style = "bg-red-100 text-red-600";
        text = "Out";
      } else if (isLow) {
        style = "bg-yellow-100 text-yellow-600";
        text = `Low (${value})`;
      }

      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${style}`}>
          {text}
        </span>
      );
    },
  },

  { key: "default_supplier", label: "Supplier" },
];



const Product = () => {

    const navigate  = useNavigate();
  const handleRowClick = () => {
        navigate('/product/detail')
    // navigate(`/purchases/${row.id}`);

  };
  return (
    <div className="space-y-6">
  
      <ProductHeader />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <Table
          columns={PRODUCT_COLUMNS}
          data={MOCK_PRODUCTS}
          rowKey="id"

          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
};

export default Product;
