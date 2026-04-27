import React, { Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import Loader from "@/components/common/Loader";

// ─── Route-level Suspense fallback ───────────────────────────────────────────
// Every lazy import gets this same lightweight spinner. The Loader component
// should be a simple CSS spinner with NO heavy dependencies.

// ─── Layout & Auth ───────────────────────────────────────────────────────────
const MainLayout = React.lazy(() => import("../components/layouts/MainLayout"));
const Login      = React.lazy(() => import("../features/auth/pages/Login"));

// ─── Dashboard ───────────────────────────────────────────────────────────────
const AnalyticsDashboard = React.lazy(() => import("@/features/dashboard/pages/AnalyticDashboard"));

// ─── Profile & Settings ──────────────────────────────────────────────────────
const ProfileSettingsPage = React.lazy(() =>
  import("@/features/Setting/pages/ProfileSettingPage").then(m => ({ default: m.ProfileSettingsPage }))
);
const ProfileForm = React.lazy(() => import("../features/profile/pages/ProfileForm"));

// ─── Products ────────────────────────────────────────────────────────────────
const ProductInfos    = React.lazy(() => import("@/features/product/pages/ProductInfos"));
const ProductSearch   = React.lazy(() => import("@/features/product/pages/ProductSearch"));
const ProductDetail   = React.lazy(() => import("@/features/product/pages/ProductDetail"));
const ProductForm     = React.lazy(() => import("@/features/product/pages/ProductForm"));
const ProductDraftsPage = React.lazy(() => import("../features/product/pages/ProductDraftsPage"));

// ─── Purchase ────────────────────────────────────────────────────────────────
const PurchaseDetail      = React.lazy(() => import("@/features/purchase/pages/PurchaseDetail"));
const PurchaseForm        = React.lazy(() => import("@/features/purchase/pages/PurchaseForm"));
const PurchaseHistory     = React.lazy(() => import("@/features/purchase/pages/PurchaseHistory"));
const PurchaseDraftsPage  = React.lazy(() => import("@/features/purchase/pages/PurchaseDraftsPage"));
const GRNListView         = React.lazy(() => import("@/features/purchase/pages/GrnListView"));
const GRNForm             = React.lazy(() => import("@/features/purchase/pages/GrnForm"));
const ReceiveGoodsPage    = React.lazy(() => import("@/features/purchase/pages/ReceiveGoodsForm"));
const ProductionForm      = React.lazy(() => import("@/features/purchase/pages/ProductionForm"));

// ─── Supplier ────────────────────────────────────────────────────────────────
const Supplier            = React.lazy(() => import("@/features/supplier/pages/Supplier"));
const SupplierSearch      = React.lazy(() => import("@/features/supplier/pages/SupplierSearch"));
const SupplierDetail      = React.lazy(() => import("@/features/supplier/pages/SupplierDetail"));
const SupplierForm        = React.lazy(() => import("@/features/supplier/pages/SupplierForm"));
const SupplierDraftsPage  = React.lazy(() => import("@/features/supplier/pages/SupplierDraftsPage"));

// ─── Employee ────────────────────────────────────────────────────────────────
const Employee            = React.lazy(() => import("../features/employee/pages/Employee"));
const EmployeeSearch      = React.lazy(() => import("../features/employee/pages/EmployeeSearch"));
const EmployeeForm        = React.lazy(() => import("../features/employee/pages/EmployeeForm"));
const EmployeeDetail      = React.lazy(() => import("../features/employee/pages/EmployeeDetail"));
const EmployeeDraftsPage  = React.lazy(() => import("../features/employee/pages/EmployeeDraftsPage"));

// ─── Inventory ───────────────────────────────────────────────────────────────
const Inventory                   = React.lazy(() => import("../features/inventory/pages/Inventory"));
const StockMovementPage           = React.lazy(() => import("../features/inventory/pages/StockMovement"));
const StockAdjustmentForm         = React.lazy(() => import("../features/inventory/pages/StockAdjusstment"));
const StockAdjustmentDraftsPage   = React.lazy(() => import("../features/inventory/pages/StockAdjustmentDraftsPage"));

// ─── Customers ───────────────────────────────────────────────────────────────
const CustomerList           = React.lazy(() => import("@/features/customer/pages/CustomerList"));
const CustomerDetail         = React.lazy(() => import("@/features/customer/pages/Customerdetail"));
const CustomerBalanceSummary = React.lazy(() => import("@/features/customer/pages/CustomerBalanceSummary"));
const CustomerFormPage       = React.lazy(() => import("@/features/customer/pages/CustomerFormPage"));
const CustomerDraftsPage     = React.lazy(() => import("@/features/customer/pages/CustomerDraftsPage"));

// ─── Sales & Orders ──────────────────────────────────────────────────────────
const SalesListPage = React.lazy(() => import("@/features/sales/pages/SalesPage"));
const Order         = React.lazy(() => import("../features/order/pages/Order"));
const Billing       = React.lazy(() => import("../features/billing/pages/Billing"));

// ─── Digital Store ───────────────────────────────────────────────────────────
const StoreSetupForm = React.lazy(() => import("@/features/digitalstore/pages/DigitalStoreForm"));
const DigitalMain    = React.lazy(() => import("@/features/digitalstore/components/DigitalMain"));

// ─── Shared route Suspense wrapper ───────────────────────────────────────────
// Wraps each route-level component so navigation shows a per-page spinner
// instead of unmounting the whole app.
const Page = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Loader />}>{children}</Suspense>
);

// ──────────────────────────────────────────────────────────────────────────────
// ROUTER CONFIGURATION
// ──────────────────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<Loader />}>
        <MainLayout />
      </Suspense>
    ),
    children: [
      { index: true,                   element: <Page><AnalyticsDashboard /></Page> },
      { path: "/sales",                element: <Page><SalesListPage /></Page> },

      // Products — static "add" before dynamic ":id"
      { path: 'product',               element: <Page><ProductSearch /></Page> },
      { path: '/product/all',          element: <Page><ProductInfos /></Page> },
      { path: '/product/add',          element: <Page><ProductForm /></Page> },
      { path: '/product/drafts',       element: <Page><ProductDraftsPage /></Page> },
      { path: '/product/:id/edit',     element: <Page><ProductForm /></Page> },
      { path: '/product/:id',          element: <Page><ProductDetail /></Page> },

      // Purchase
      { path: "/purchase-order/add",   element: <Page><PurchaseForm /></Page> },
      { path: "/po-grn",               element: <Page><GRNListView /></Page> },
      { path: '/po-grn/add',           element: <Page><GRNForm /></Page> },
      { path: '/po-grn/update',        element: <Page><ReceiveGoodsPage /></Page> },
      { path: "/purchase-history",     element: <Page><PurchaseHistory /></Page> },
      { path: "/production-entry/add", element: <Page><ProductionForm /></Page> },
      { path: '/purchase/detail',      element: <Page><PurchaseDetail /></Page> },
      { path: "/purchase/add",         element: <Page><PurchaseForm /></Page> },
      { path: "/purchase/drafts",      element: <Page><PurchaseDraftsPage /></Page> },

      // Suppliers — static "add" before dynamic ":id"
      { path: 'supplier',              element: <Page><SupplierSearch /></Page> },
      { path: '/supplier/all',         element: <Page><Supplier /></Page> },
      { path: '/supplier/add',         element: <Page><SupplierForm /></Page> },
      { path: '/supplier/drafts',      element: <Page><SupplierDraftsPage /></Page> },
      { path: '/supplier/:id/edit',    element: <Page><SupplierForm /></Page> },
      { path: '/supplier/:id',         element: <Page><SupplierDetail /></Page> },

      // Employees
      { path: '/employee',             element: <Page><EmployeeSearch /></Page> },
      { path: '/employee/all',         element: <Page><Employee /></Page> },
      { path: '/employee/add',         element: <Page><EmployeeForm /></Page> },
      { path: '/employee/drafts',      element: <Page><EmployeeDraftsPage /></Page> },
      { path: '/employee/:id/edit',    element: <Page><EmployeeForm /></Page> },
      { path: '/employee/:id',         element: <Page><EmployeeDetail /></Page> },

      // Inventory
      { path: '/inventory',            element: <Page><Inventory /></Page> },
      { path: "/stock-movement",       element: <Page><StockMovementPage /></Page> },
      { path: "/stock-adjustment",     element: <Page><StockAdjustmentForm /></Page> },
      { path: "/stock-adjustment/drafts", element: <Page><StockAdjustmentDraftsPage /></Page> },

      // Orders & Billing
      { path: '/billing',              element: <Page><Billing /></Page> },
      { path: '/orders',               element: <Page><Order /></Page> },

      // Profile
      { path: '/profile',              element: <Page><ProfileSettingsPage /></Page> },
      { path: '/profile/add',          element: <Page><ProfileForm /></Page> },

      // Digital Store
      { path: '/create-digital-store', element: <Page><StoreSetupForm /></Page> },
      { path: '/digital-store/profile',element: <Page><DigitalMain /></Page> },

      // Customers — static "add" before dynamic ":id"
      { path: "/customers",            element: <Page><CustomerList /></Page> },
      { path: "/customers-Summary",    element: <Page><CustomerBalanceSummary /></Page> },
      { path: "/customers/add",        element: <Page><CustomerFormPage /></Page> },
      { path: "/customers/drafts",     element: <Page><CustomerDraftsPage /></Page> },
      { path: "/customers/:id/edit",   element: <Page><CustomerFormPage /></Page> },
      { path: "/customers/:id",        element: <Page><CustomerDetail /></Page> },
    ]
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<Loader />}>
        <Login />
      </Suspense>
    )
  },
  {
    path: "*",
    element: <div className="flex items-center justify-center h-screen text-slate-500">Page Not Found</div>,
  }
]);
