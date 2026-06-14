import { History, IndianRupee, Plus, UserCircle, Wallet, Bookmark, Receipt } from "lucide-react";
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
  PlusCircle,
  RefreshCw,
  ListChecks,
  PlusSquare
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SubLink {
  name: string;
  path: string;
  icon?: any;
  addPath?: string;
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
  addPath?: string;
  badge?: string | number;
  /** Top-level subLinks: can be flat SubLinks OR SubGroups */
  subLinks?: SubItem[];
  newTab?: boolean;
  askNewTab?: boolean;
}

// ─── Data ────────────────────────────────────────────────────────────────────

export const sidebarLinks: SidebarLink[] = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  {
    name: "Sales",
    icon: IndianRupee,
    addPath: "/billing",
    subLinks: [
      { name: "Sales List", path: "/sales", icon: ClipboardList, addPath: "/billing" },
      { name: "Sale Detail", path: "/sales/detail", icon: Receipt },
    ],
  },

  {
    name: "Purchase",
    icon: Wallet,
    subLinks: [

      { icon: Plus, name: "Add Purchase", path: "/purchase/add" },
      { icon: Bookmark, name: "Saved Drafts", path: "/purchase/drafts" },
      // Purchase Orders group — gated by settings.poGrn
      {
        type: "group",
        name: "Purchase Orders",
        icon: ClipboardList,
        settingsKey: "poGrn",
        children: [
          { name: "Add Purchase Order", path: "/po-grn/add", icon: PlusCircle },
          { name: "Update Purchase Order", path: "/po-grn/update", icon: RefreshCw },
          { name: "Purchase Order List", path: "/po-grn", icon: ListChecks, addPath: "/po-grn/add" },
        ],
      },

      // Production group — gated by settings.productionEntry
      {
        type: "group",
        name: "Production",
        icon: Factory,
        settingsKey: "productionEntry",
        children: [
          { name: "Production Entry", path: "/production-entry/add", icon: PlusSquare },
        ],
      },
      { name: "Purchase History", path: "/purchase-history", icon: History, addPath: "/purchase/add" },
      { name: "Purchase Detail", path: "/purchase/detail", icon: FileText },
    ],
  },

  {
    name: "Products",
    icon: Package,
    addPath: "/product/add",
    subLinks: [
      { name: "Add Product", path: "/product/add", icon: UserPlus },
      { name: "Saved Drafts", path: "/product/drafts", icon: Bookmark },
      { name: "Products List", path: "/product/all", icon: ClipboardList, addPath: "/product/add" },
      { name: "Product Detail", path: "/product", icon: FileText },
    ],
  },

  {
    name: "Supplier",
    icon: Wallet,
    addPath: "/supplier/add",
    subLinks: [
      { name: "Add Suppliers", path: "/supplier/add", icon: UserPlus },
      { name: "Saved Drafts", path: "/supplier/drafts", icon: Bookmark },
      { name: "Suppliers List", path: "/supplier/all", icon: ClipboardList, addPath: "/supplier/add" },
      { name: "Supplier Details", path: "/supplier", icon: FileText },
    ],
  },

  {
    name: "Inventory",
    icon: Database,
    subLinks: [
      { name: "Stock Levels", path: "/inventory", icon: Package, addPath: "/product/add" },
      { name: "Stock Movements", path: "/stock-movement", icon: History, addPath: "/stock-adjustment" },
      { name: "Stock Adjustments", path: "/stock-adjustment", icon: ClipboardList },
      { name: "Saved Drafts", path: "/stock-adjustment/drafts", icon: Bookmark },
    ],
  },

  { name: "Orders", icon: ShoppingCart, path: "/orders" },
  { name: "Billing", icon: Printer, path: "/billing", askNewTab: true },

  {
    name: "Customers",
    icon: UserCircle,
    addPath: "/customers/add",
    subLinks: [
      { name: "Add Customer", path: "/customers/add", icon: UserPlus },
      { name: "Saved Drafts", path: "/customers/drafts", icon: Bookmark },
      { name: "Customers List", path: "/customers-Summary", icon: ClipboardList, addPath: "/customers/add" },
      { name: "Customer Details", path: "/customers", icon: FileText },
    ],
  },

  {
    name: "Employees",
    icon: Users,
    addPath: "/employee/add",
    subLinks: [
      { name: "Add Employee", path: "/employee/add", icon: UserPlus },
      { name: "Saved Drafts", path: "/employee/drafts", icon: Bookmark },
      { name: "Employee List", path: "/employee/all", icon: ClipboardList, addPath: "/employee/add" },
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

export interface CategoryConfig {
  suggestedVariantTypes: string[];
  supportsSerials: boolean;
  serialLabel: string;
}

export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  "Mobile Phones": { suggestedVariantTypes: ["Storage", "Color", "Model"], supportsSerials: true, serialLabel: "IMEI Number" },
  "Laptops": { suggestedVariantTypes: ["RAM", "Storage", "Color"], supportsSerials: true, serialLabel: "Serial Number" },
  "Clothing": { suggestedVariantTypes: ["Size", "Color"], supportsSerials: false, serialLabel: "Serial Number" },
  "Footwear": { suggestedVariantTypes: ["Size", "Color"], supportsSerials: false, serialLabel: "Serial Number" },
  "Electronics": { suggestedVariantTypes: ["Color", "Wattage", "Model"], supportsSerials: true, serialLabel: "Serial Number" },
  "Accessories": { suggestedVariantTypes: ["Color", "Size"], supportsSerials: false, serialLabel: "Serial Number" },
  "Tablets": { suggestedVariantTypes: ["Storage", "Connectivity", "Color"], supportsSerials: true, serialLabel: "IMEI / Serial" },
};

export const CATEGORIES = Object.keys(CATEGORY_CONFIGS);