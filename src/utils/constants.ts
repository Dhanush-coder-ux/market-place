import { History, IndianRupee, Plus, UserCircle, Wallet } from "lucide-react";
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
  { name: "Sales",icon:IndianRupee,path:"/sales"},

  {
    name: "Purchase",
    icon: Wallet,
    subLinks: [
      { name: "Add Purchase ",icon: Plus, path: "/purchase-order/add"},
      { name : "Create Po",path:"po-grn/add"},
      { name: "PO-GRN",path: "po-grn"},
   
      { name : "Purchase History" , path: "/purchase-history",icon:History},
    ]
  },
    
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
      { name: "Suppliers", path: "/supplier" },
      { name:"Add Suppliers", path:"/supplier/add"},
    
    ]
  },
  { 
    name: "Inventory", 
    icon: Database, 
    subLinks: [
      { name: "Stock Levels", path: "/inventory" },
      { name: "Stock Movements" ,path: "/stock-movement"},
    ]
  },
  { name: "Orders", icon: ShoppingCart, path: "/orders" },
  { name: "Billing", icon: Printer, path: "/billing" },
  {
    name: "Customers",
    icon: UserCircle,
    subLinks: [
      { name: "Customer Details", path: "/customers" },
      { name: "Summary Balance", path: "/customers-Summary" },
 
    ]
  },
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

export const FIELD_DESCRIPTIONS = {
    barcode: "Scan the product barcode or enter a unique SKU identifier.",
    name: "The public-facing name of the product as it will appear on invoices.",
    description: "Detailed information about the product's specs or materials.",
    category: "Organize products into groups for better reporting.",
    stock: "The current physical quantity available in your warehouse.",
    buyingPrice: "The cost price you paid to the supplier per unit.",
    sellingPrice: "The price at which you intend to sell this product to customers."
  };