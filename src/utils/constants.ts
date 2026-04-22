import { History, IndianRupee, Plus, UserCircle, Wallet, Bookmark } from "lucide-react";
import {
  Database,
  LayoutDashboard,
  Package,
  Printer,
  ShoppingCart,
  Store,
  Users,
  ClipboardList,
  Factory,
  UserPlus,
  FileText,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SubLink {
  name: string;
  path: string;
  icon?: any;
}

export interface SubGroup {
  type: "group";
  name: string;
  icon?: any;
  /** The settings key that gates this group. If undefined, always visible. */
  settingsKey?: "directPurchase" | "poGrn" | "productionEntry";
  children: SubLink[];
}

export type SubItem = SubLink | SubGroup;

export interface SidebarLink {
  name: string;
  icon: any;
  path?: string;
  badge?: string | number;
  /** Top-level subLinks: can be flat SubLinks OR SubGroups */
  subLinks?: SubItem[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

export const sidebarLinks: SidebarLink[] = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Sales", icon: IndianRupee, path: "/sales" },

  {
    name: "Purchase",
    icon: Wallet,
    subLinks: [
      
  {icon:Plus, name: "Add Purchase", path: "/purchase-order/add" },
      // Purchase Orders group — gated by settings.poGrn
      {
        type: "group",
        name: "Purchase Orders",
        icon: ClipboardList,
        settingsKey: "poGrn",
        children: [
          { name: "Add Purchase Order", path: "/po-grn/add" },
          { name: "Update Purchase Order", path: "/po-grn/update" },
          { name: "Purchase Order List", path: "/po-grn" },
        ],
      },

      // Production group — gated by settings.productionEntry
      {
        type: "group",
        name: "Production",
        icon: Factory,
        settingsKey: "productionEntry",
        children: [
          { name: "Production Entry", path: "/production-entry/add" },
        ],
      },
      { name: "Purchase History", path: "/purchase-history", icon: History },
    ],
  },

  {
    name: "Products",
    icon: Package,
    subLinks: [
      { name: "Catalog", path: "/product/all" },
      { name: "Add Product", path: "/product/add" },
      { name: "Product Details", path: "/product" }
    ],
  },

  {
    name: "Procurement",
    icon: Wallet,
    subLinks: [
      { name: "Suppliers", path: "/supplier/all" },
      { name: "Add Suppliers", path: "/supplier/add" },
      { name: "Supplier Details", path: "/supplier" },
    ],
  },

  {
    name: "Inventory",
    icon: Database,
    subLinks: [
      { name: "Stock Levels", path: "/inventory" },
      { name: "Stock Movements", path: "/stock-movement" },
      { name: "Stock Adjustments", path: "/stock-adjustment" },
    ],
  },

  { name: "Orders", icon: ShoppingCart, path: "/orders" },
  { name: "Billing", icon: Printer, path: "/billing" },

  {
    name: "Customers",
    icon: UserCircle,
    subLinks: [
      { name: "Add Customer", path: "/customers/add", icon: UserPlus },
      { name: "Saved Drafts", path: "/customers/drafts", icon: Bookmark },
      { name: "Customers Infos", path: "/customers-Summary", icon: ClipboardList },
      { name: "Customer Details", path: "/customers", icon: FileText },
    ],
  },

  {
    name: "Employees",
    icon: Users,
    subLinks: [
      { name: "Add Employee", path: "/employee/add", icon: UserPlus },
      { name: "Saved Drafts", path: "/employee/drafts", icon: Bookmark },
      { name: "Employee Infos", path: "/employee/all", icon: ClipboardList },
      { name: "Employee Details", path: "/employee", icon: FileText },
    ],
  },

  { name: "Digital Store", icon: Store, path: "/digital-store/profile" },
];

export const Rupees = "₹";

export const FIELD_DESCRIPTIONS = {
  barcode: "Scan the product barcode or enter a unique SKU identifier.",
  name: "The public-facing name of the product as it will appear on invoices.",
  description: "Detailed information about the product's specs or materials.",
  category: "Organize products into groups for better reporting.",
  stock: "The current physical quantity available in your warehouse.",
  buyingPrice: "The cost price you paid to the supplier per unit.",
  sellingPrice: "The price at which you intend to sell this product to customers.",
};