import { DashboardsType, OrdersByMonthType } from "@/features/dashboard/types";
import { Wallet } from "lucide-react";
import {
  Database,
  LayoutDashboard,
  Package,
  Printer,
  ShoppingCart,
  Store,
  Users
} from "lucide-react";



export const sidebarLinks = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { 
    name: "Products", 
    icon: Package, 
    subLinks: [
      { name: "Catalog", path: "/product" },
      { name: "Add Product", path: "/product/add" },
    ]
  },
  { 
    name: "Procurement", 
    icon: Wallet, 
    subLinks: [
      { name: "Purchase Order", path: "/purchase" },
      { name: "Suppliers", path: "/supplier" },
      { name:"Add Suppliers", path:"/supplier/add"}
    ]
  },
  { 
    name: "Inventory", 
    icon: Database, 
    subLinks: [
      { name: "Stock Levels", path: "/inventory" },
      { name: "Low Stock Refill", path: "/inventory/re-fill" },
      { name: "Add Inventory",path: "/inventory/add"}
    ]
  },
  { name: "Orders", icon: ShoppingCart, path: "/orders" },
  { name: "Billing", icon: Printer, path: "/billing" },
  { 
    name: "Staff", 
    icon: Users, 
    subLinks: [
      { name: "Directory", path: "/employee" },
      { name: "Add Employee", path: "/employee/add" },
    ]
  },
  { name: "Digital Store", icon: Store, path: "/digital-store/profile" }
];

export const Rupees = "₹"

export const dashboards: DashboardsType = {
  jan: { orders: { last: 10, cur: 10 }, revenue: { last: 2000, cur: 1000 } },
  feb: { orders: { last: 12, cur: 15 }, revenue: { last: 2500, cur: 1800 } },
  mar: { orders: { last: 14, cur: 11 }, revenue: { last: 2700, cur: 2200 } },
  apr: { orders: { last: 18, cur: 16 }, revenue: { last: 3100, cur: 3030 } },
  may: { orders: { last: 20, cur: 19 }, revenue: { last: 3500, cur: 2800 } },
  jun: { orders: { last: 22, cur: 18 }, revenue: { last: 3800, cur: 2600 } },
  jul: { orders: { last: 25, cur: 20 }, revenue: { last: 4100, cur: 3100 } },
  aug: { orders: { last: 28, cur: 22 }, revenue: { last: 4500, cur: 3300 } },
  sep: { orders: { last: 24, cur: 21 }, revenue: { last: 4200, cur: 2900 } },
  oct: { orders: { last: 26, cur: 23 }, revenue: { last: 4700, cur: 5000 } },
  nov: { orders: { last: 29, cur: 25 }, revenue: { last: 5000, cur: 3600 } },
  dec: { orders: { last: 32, cur: 28 }, revenue: { last: 360, cur: 1000 } },
};


export const ordersByMonth: OrdersByMonthType = {
  jan: { online_orders: { last: 40, cur: 55 }, offline_orders: { last: 120, cur: 150 } },
  feb: { online_orders: { last: 38, cur: 60 }, offline_orders: { last: 110, cur: 140 } },
  mar: { online_orders: { last: 45, cur: 70 }, offline_orders: { last: 130, cur: 160 } },
  apr: { online_orders: { last: 50, cur: 65 }, offline_orders: { last: 140, cur: 155 } },
  may: { online_orders: { last: 42, cur: 75 }, offline_orders: { last: 125, cur: 180 } },
  jun: { online_orders: { last: 48, cur: 80 }, offline_orders: { last: 135, cur: 200 } },
  jul: { online_orders: { last: 55, cur: 85 }, offline_orders: { last: 150, cur: 210 } },
  aug: { online_orders: { last: 60, cur: 90 }, offline_orders: { last: 160, cur: 220 } },
  sep: { online_orders: { last: 52, cur: 87 }, offline_orders: { last: 145, cur: 205 } },
  oct: { online_orders: { last: 62, cur: 95 }, offline_orders: { last: 155, cur: 230 } },
  nov: { online_orders: { last: 58, cur: 92 }, offline_orders: { last: 148, cur: 215 } },
  dec: { online_orders: { last: 32, cur: 28 }, offline_orders: { last: 360, cur: 1000 } },
};

export const FIELD_DESCRIPTIONS = {
    barcode: "Scan the product barcode or enter a unique SKU identifier.",
    name: "The public-facing name of the product as it will appear on invoices.",
    description: "Detailed information about the product's specs or materials.",
    category: "Organize products into groups for better reporting.",
    stock: "The current physical quantity available in your warehouse.",
    buyingPrice: "The cost price you paid to the supplier per unit.",
    sellingPrice: "The price at which you intend to sell this product to customers."
  };