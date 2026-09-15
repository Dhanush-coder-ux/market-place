import React, { Suspense } from "react";
import { createBrowserRouter, useRouteError, useNavigate } from "react-router-dom";
import Loader from "@/components/common/Loader";
import { RefreshCw, AlertCircle } from "lucide-react";

/**
 * Lazy load with automatic retry for deployment chunk updates
 */
function lazyRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T } | { [key: string]: any }>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      const module = await factory();
      if ('default' in module && module.default) {
        return { default: module.default as T };
      }
      return module as { default: T };
    } catch (error: any) {
      const isChunkError =
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Loading chunk') ||
        error?.name === 'ChunkLoadError' ||
        error?.name === 'TypeError';

      const lastReload = sessionStorage.getItem('chunk_retry_timestamp');
      const now = Date.now();
      if (isChunkError && (!lastReload || now - parseInt(lastReload, 10) > 10000)) {
        sessionStorage.setItem('chunk_retry_timestamp', String(now));
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });
}

function RouteErrorBoundary() {
  const error: any = useRouteError();
  const navigate = useNavigate();
  const isChunkError =
    error?.message?.includes('Failed to fetch dynamically imported module') ||
    error?.message?.includes('Loading chunk') ||
    error?.name === 'ChunkLoadError';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 max-w-md w-full text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
          {isChunkError ? <RefreshCw size={26} className="animate-spin" /> : <AlertCircle size={26} className="text-red-500" />}
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800">
            {isChunkError ? "App Update Detected" : "Something went wrong"}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isChunkError
              ? "A new version of the app has been deployed. Please reload to continue."
              : error?.message || "An unexpected error occurred while loading this page."}
          </p>
        </div>
        <div className="pt-2 flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw size={14} /> Reload Page
          </button>
          {!isChunkError && (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Route-level Suspense fallback ───────────────────────────────────────────
// Every lazy import gets this same lightweight spinner. The Loader component
// should be a simple CSS spinner with NO heavy dependencies.

// ─── Layout & Auth ───────────────────────────────────────────────────────────
const MainLayout = lazyRetry(() => import("../components/layouts/MainLayout"));
const Login = lazyRetry(() => import("../features/auth/pages/Login"));
const AuthCallback = lazyRetry(() => import("../features/auth/pages/AuthCallback"));
const ShopSelect = lazyRetry(() => import("../features/auth/pages/ShopSelect"));

// ─── Dashboard ───────────────────────────────────────────────────────────────
const AnalyticsDashboard = lazyRetry(() => import("@/features/dashboard/pages/AnalyticDashboard"));

// ─── Profile & Settings ──────────────────────────────────────────────────────
const ProfileSettingsPage = lazyRetry(() =>
  import("@/features/Setting/pages/ProfileSettingPage").then(m => ({ default: m.ProfileSettingsPage }))
);
const ProfileForm = lazyRetry(() => import("../features/profile/pages/ProfileForm"));
const PricingPlansPage = lazyRetry(() => import("@/features/subscription/pages/PricingPlansPage"));

// ─── Products ────────────────────────────────────────────────────────────────
const ProductInfos = lazyRetry(() => import("@/features/product/pages/ProductInfos"));
const ProductSearch = lazyRetry(() => import("@/features/product/pages/ProductSearch"));
const ProductDetail = lazyRetry(() => import("@/features/product/pages/ProductDetail"));
const ProductForm = lazyRetry(() => import("@/features/product/pages/ProductForm"));
// const ProductDraftsPage = lazyRetry(() => import("../features/product/pages/ProductDraftsPage"));

// ─── Purchase ────────────────────────────────────────────────────────────────
const PurchaseDetail = lazyRetry(() => import("@/features/purchase/pages/PurchaseDetail"));
const PurchaseSearch = lazyRetry(() => import("@/features/purchase/pages/PurchaseSearch"));
const PurchaseForm = lazyRetry(() => import("@/features/purchase/pages/PurchaseForm"));
const PurchaseHistory = lazyRetry(() => import("@/features/purchase/pages/PurchaseHistory"));
// const PurchaseDraftsPage = lazyRetry(() => import("@/features/purchase/pages/PurchaseDraftsPage"));
const GRNListView = lazyRetry(() => import("@/features/purchase/pages/GrnListView"));
const GRNForm = lazyRetry(() => import("@/features/purchase/pages/GrnForm"));
const ReceiveGoodsPage = lazyRetry(() => import("@/features/purchase/pages/ReceiveGoodsForm"));
const ProductionForm = lazyRetry(() => import("@/features/purchase/pages/ProductionForm"));

// ─── Supplier ────────────────────────────────────────────────────────────────
const Supplier = lazyRetry(() => import("@/features/supplier/pages/Supplier"));
const SupplierSearch = lazyRetry(() => import("@/features/supplier/pages/SupplierSearch"));
const SupplierDetail = lazyRetry(() => import("@/features/supplier/pages/SupplierDetail"));
const SupplierForm = lazyRetry(() => import("@/features/supplier/pages/SupplierForm"));
// const SupplierDraftsPage = lazyRetry(() => import("@/features/supplier/pages/SupplierDraftsPage"));

// ─── Employee ────────────────────────────────────────────────────────────────
const Employee = lazyRetry(() => import("../features/employee/pages/Employee"));
const EmployeeSearch = lazyRetry(() => import("../features/employee/pages/EmployeeSearch"));
const EmployeeForm = lazyRetry(() => import("../features/employee/pages/EmployeeForm"));
const EmployeeDetail = lazyRetry(() => import("../features/employee/pages/EmployeeDetail"));
// const EmployeeDraftsPage = lazyRetry(() => import("../features/employee/pages/EmployeeDraftsPage"));
const EmployeeVerifyPage = lazyRetry(() => import("../features/employee/pages/EmployeeVerifyPage"));

// ─── Inventory ───────────────────────────────────────────────────────────────
const Inventory = lazyRetry(() => import("../features/inventory/pages/Inventory"));
const StockMovementPage = lazyRetry(() => import("../features/inventory/pages/StockMovement"));
const StockMovementDetail = lazyRetry(() => import("../features/inventory/pages/StockMovementDetail"));
const StockAdjustmentForm = lazyRetry(() => import("../features/inventory/pages/StockAdjusstment"));
// const StockAdjustmentDraftsPage = lazyRetry(() => import("../features/inventory/pages/StockAdjustmentDraftsPage"));

// ─── Customers ───────────────────────────────────────────────────────────────
const CustomerSearch = lazyRetry(() => import("@/features/customer/pages/CustomerSearch"));
const CustomerList = lazyRetry(() => import("@/features/customer/pages/CustomerList"));
const CustomerDetail = lazyRetry(() => import("@/features/customer/pages/Customerdetail"));
const CustomerBalanceSummary = lazyRetry(() => import("@/features/customer/pages/CustomerBalanceSummary"));
const CustomerFormPage = lazyRetry(() => import("@/features/customer/pages/CustomerFormPage"));
// const CustomerDraftsPage = lazyRetry(() => import("@/features/customer/pages/CustomerDraftsPage"));

// ─── Sales & Orders ──────────────────────────────────────────────────────────
const SalesListPage = lazyRetry(() => import("@/features/sales/pages/SalesPage"));
const SaleDetailPage = lazyRetry(() => import("@/features/sales/pages/SaleDetailPage"));
const SaleSearch = lazyRetry(() => import("@/features/sales/pages/SaleSearch"));
const ReturnPage = lazyRetry(() => import("@/features/sales/pages/ReturnPage"));
const Order = lazyRetry(() => import("../features/order/pages/Order"));
const DeliveryVerifyPage = lazyRetry(() => import("../features/order/pages/DeliveryVerifyPage"));
const Billing = lazyRetry(() => import("../features/billing/pages/Billing"));

// ─── Digital Store ───────────────────────────────────────────────────────────
const StoreSetupForm = lazyRetry(() => import("@/features/digitalstore/pages/DigitalStoreForm"));
const DigitalMain = lazyRetry(() => import("@/features/digitalstore/components/DigitalMain"));

// ─── Notifications ───────────────────────────────────────────────────────────
const NotificationsPage = lazyRetry(() => import("@/features/notifications/pages/NotificationsPage"));

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
    errorElement: <RouteErrorBoundary />,
    element: (
      <Suspense fallback={<Loader />}>
        <MainLayout />
      </Suspense>
    ),
    children: [
      { index: true, element: <Page><AnalyticsDashboard /></Page> },
      { path: '/dashboard', element: <Page><AnalyticsDashboard /></Page> },
      { path: "/sales", element: <Page><SalesListPage /></Page> },
      { path: "/sales/detail", element: <Page><SaleSearch /></Page> },
      { path: "/sales/return/:id", element: <Page><ReturnPage /></Page> },
      { path: "/sales/:id", element: <Page><SaleDetailPage /></Page> },

      // Products — static "add" before dynamic ":id"
      { path: 'product', element: <Page><ProductSearch /></Page> },
      { path: '/product/all', element: <Page><ProductInfos /></Page> },
      { path: '/product/add', element: <Page><ProductForm /></Page> },
      // { path: '/product/drafts', element: <Page><ProductDraftsPage /></Page> },
      { path: '/product/:id/edit', element: <Page><ProductForm /></Page> },
      { path: '/product/:id', element: <Page><ProductDetail /></Page> },

      // Purchase
      { path: "/purchase-order/add", element: <Page><PurchaseForm /></Page> },
      { path: "/po-grn", element: <Page><GRNListView /></Page> },
      { path: '/po-grn/add', element: <Page><GRNForm /></Page> },
      { path: '/po-grn/update', element: <Page><ReceiveGoodsPage /></Page> },
      { path: "/purchase-history", element: <Page><PurchaseHistory /></Page> },
      { path: "/production-entry/add", element: <Page><ProductionForm /></Page> },
      { path: '/purchase/detail', element: <Page><PurchaseSearch /></Page> },
      { path: '/purchase/detail/:id', element: <Page><PurchaseDetail /></Page> },
      { path: "/purchase/add", element: <Page><PurchaseForm /></Page> },
      { path: "/purchase/edit/:id", element: <Page><PurchaseForm /></Page> },
      // { path: "/purchase/drafts", element: <Page><PurchaseDraftsPage /></Page> },

      // Suppliers — static "add" before dynamic ":id"
      { path: 'supplier', element: <Page><SupplierSearch /></Page> },
      { path: '/supplier/all', element: <Page><Supplier /></Page> },
      { path: '/supplier/add', element: <Page><SupplierForm /></Page> },
      // { path: '/supplier/drafts', element: <Page><SupplierDraftsPage /></Page> },
      { path: '/supplier/:id/edit', element: <Page><SupplierForm /></Page> },
      { path: '/supplier/:id', element: <Page><SupplierDetail /></Page> },

      // Employees
      { path: '/employee', element: <Page><EmployeeSearch /></Page> },
      { path: '/employee/all', element: <Page><Employee /></Page> },
      { path: '/employee/add', element: <Page><EmployeeForm /></Page> },
      // { path: '/employee/drafts', element: <Page><EmployeeDraftsPage /></Page> },
      { path: '/employee/:id/edit', element: <Page><EmployeeForm /></Page> },
      { path: '/employee/:id', element: <Page><EmployeeDetail /></Page> },

      // Inventory
      { path: '/inventory', element: <Page><Inventory /></Page> },
      { path: "/stock-movement", element: <Page><StockMovementPage /></Page> },
      { path: "/stock-movement/:id", element: <Page><StockMovementDetail /></Page> },
      { path: "/stock-adjustment", element: <Page><StockAdjustmentForm /></Page> },
      // { path: "/stock-adjustment/drafts", element: <Page><StockAdjustmentDraftsPage /></Page> },

      // Orders & Billing
      { path: '/billing', element: <Page><Billing /></Page> },
      { path: '/orders', element: <Page><Order /></Page> },

      // Settings
      { path: '/settings', element: <Page><ProfileSettingsPage /></Page> },
      { path: '/pricing', element: <Page><PricingPlansPage /></Page> },
      { path: '/subscription', element: <Page><PricingPlansPage /></Page> },
      { path: '/settings/add', element: <Page><ProfileForm /></Page> },

      // Digital Store / Profile
      { path: '/create-shop', element: <Page><ProfileForm /></Page> },
      { path: '/setup-digital-store', element: <Page><StoreSetupForm /></Page> },
      { path: '/profile', element: <Page><DigitalMain /></Page> },

      // Notifications
      { path: "/notifications", element: <Page><NotificationsPage /></Page> },

      // Customers — static "add" before dynamic ":id"
      { path: "/customers", element: <Page><CustomerSearch /></Page> },
      { path: "/customers/all", element: <Page><CustomerList /></Page> },
      { path: "/customers-Summary", element: <Page><CustomerBalanceSummary /></Page> },
      { path: "/customers/add", element: <Page><CustomerFormPage /></Page> },
      // { path: "/customers/drafts", element: <Page><CustomerDraftsPage /></Page> },
      { path: "/customers/:id/edit", element: <Page><CustomerFormPage /></Page> },
      { path: "/customers/:id", element: <Page><CustomerDetail /></Page> },
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
    path: '/auth/callback',
    element: (
      <Suspense fallback={<Loader />}>
        <AuthCallback />
      </Suspense>
    )
  },
  {
    path: '/shop-select',
    element: (
      <Suspense fallback={<Loader />}>
        <ShopSelect />
      </Suspense>
    )
  },
  {
    path: '/employee/verify',
    element: (
      <Suspense fallback={<Loader />}>
        <EmployeeVerifyPage />
      </Suspense>
    )
  },
  {
    path: '/verify-delivery',
    element: (
      <Suspense fallback={<Loader />}>
        <DeliveryVerifyPage />
      </Suspense>
    )
  },
  {
    path: "*",
    element: <div className="flex items-center justify-center h-screen text-slate-500">Page Not Found</div>,
  }
]);
