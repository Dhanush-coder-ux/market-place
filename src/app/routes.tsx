import React, { Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import Loader from "@/components/common/Loader";
import GRNListView from "@/features/purchase/pages/GrnListView";
import GRNForm from "@/features/purchase/pages/GrnForm";
import PurchaseForm from "@/features/purchase/pages/PurchaseForm";
import ProductForm from "@/features/product/pages/ProductForm";
import CustomerBalanceSummary from "@/features/customer/pages/CustomerBalanceSummary";
import CustomerDetail from "@/features/customer/pages/Customerdetail";
import CustomerList from "@/features/customer/pages/CustomerList";
import PurchaseHistory from "@/features/purchase/pages/PurchaseHistory";
import SalesListPage from "@/features/sales/pages/SalesPage";
import StockMovementPage from "@/features/inventory/pages/StockMovement";
import ReceiveGoodsPage from "@/features/purchase/pages/ReceiveGoodsForm";
import StockAdjustmentForm from "@/features/inventory/pages/StockAdjusstment";
import ProductionForm from "@/features/purchase/pages/ProductionForm";
import CustomerFormPage from "@/features/customer/pages/CustomerFormPage";
import SupplierForm from "@/features/supplier/pages/SupplierForm";


// Layout & Auth
const MainLayout = React.lazy(() => import("../components/layouts/MainLayout"));
const Login = React.lazy(() => import("../features/auth/pages/Login"));

// Dashboard
const AnalyticsDashboard = React.lazy(() => import("@/features/dashboard/pages/AnalyticDashboard"));

// Profile & Settings
const ProfileSettingsPage = React.lazy(() =>
  import("@/features/Setting/pages/ProfileSettingPage").then(module => ({ default: module.ProfileSettingsPage }))
);
const ProfileForm = React.lazy(() => import("../features/profile/pages/ProfileForm"));

// Products
const Product = React.lazy(() => import("@/features/product/pages/Product"));
const ProductDetail = React.lazy(() => import("@/features/product/pages/ProductDetail"));

// Purchase
const PurchaseDetail = React.lazy(() => import("@/features/purchase/pages/PurchaseDetail"));

// Supplier
const Supplier = React.lazy(() => import("@/features/supplier/pages/Supplier"));
const SupplierDetail = React.lazy(() => import("@/features/supplier/pages/SupplierDetail"));

// Employee
const Employee = React.lazy(() => import("../features/employee/pages/Employee"));
const EmployeeForm = React.lazy(() => import("../features/employee/pages/EmployeeForm"));

// Inventory
const Inventory = React.lazy(() => import("../features/inventory/pages/Inventory"));

// Orders & Billing
const Order = React.lazy(() => import("../features/order/pages/Order"));
const Billing = React.lazy(() => import("../features/billing/pages/Billing"));

// Digital Store
const StoreSetupForm = React.lazy(() => import("@/features/digitalstore/pages/DigitalStoreForm"));
const DigitalMain = React.lazy(() => import("@/features/digitalstore/components/DigitalMain"));


// ==========================================
// ROUTER CONFIGURATION
// ==========================================
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<Loader />}>
        <MainLayout />
      </Suspense>
    ),
    children: [
      { index: true, element: <AnalyticsDashboard /> },
      { path: "/sales", element: <SalesListPage /> },

      // Products — static "add" before dynamic ":id"
      { path: 'product', element: <Product /> },
      { path: '/product/add', element: <ProductForm /> },
      { path: '/product/:id/edit', element: <ProductForm /> },
      { path: '/product/:id', element: <ProductDetail /> },

      // Purchase
      { path: "/purchase-order/add", element: <PurchaseForm /> },
      { path: "/po-grn", element: <GRNListView /> },
      { path: '/po-grn/add', element: <GRNForm /> },
      { path: '/po-grn/update', element: <ReceiveGoodsPage /> },
      { path: "/purchase-history", element: <PurchaseHistory /> },
      { path: "/production-entry/add", element: <ProductionForm /> },
      { path: '/purchase/detail', element: <PurchaseDetail /> },
      { path: '/purchase/add', element: <PurchaseForm /> },

      // Suppliers — static "add" before dynamic ":id"
      { path: 'supplier', element: <Supplier /> },
      { path: '/supplier/add', element: <SupplierForm /> },
      { path: '/supplier/:id/edit', element: <SupplierForm /> },
      { path: '/supplier/:id', element: <SupplierDetail /> },

      // Employees
      { path: '/employee', element: <Employee /> },
      { path: '/employee/add', element: <EmployeeForm /> },

      // Inventory
      { path: '/inventory', element: <Inventory /> },
      { path: "/stock-movement", element: <StockMovementPage /> },
      { path: "/stock-adjustment", element: <StockAdjustmentForm /> },

      // Orders & Billing
      { path: '/billing', element: <Billing /> },
      { path: '/orders', element: <Order /> },

      // Profile
      { path: '/profile', element: <ProfileSettingsPage /> },
      { path: '/profile/add', element: <ProfileForm /> },

      // Digital Store
      { path: '/create-digital-store', element: <StoreSetupForm /> },
      { path: '/digital-store/profile', element: <DigitalMain /> },

      // Customers — static "add" before dynamic ":id"
      { path: "/customers", element: <CustomerList /> },
      { path: "/customers-Summary", element: <CustomerBalanceSummary /> },
      { path: "/customers/add", element: <CustomerFormPage /> },
      { path: "/customers/:id/edit", element: <CustomerFormPage /> },
      { path: "/customers/:id", element: <CustomerDetail /> },
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
    element: <div>Page Not Found</div>,
  }
]);
