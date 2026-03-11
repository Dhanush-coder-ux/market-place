import React, { Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import Loader from "@/components/common/Loader";

// ==========================================
// LAZY LOADED COMPONENTS
// ==========================================

// Layout & Auth
const MainLayout = React.lazy(() => import("../components/layouts/MainLayout"));
const Login = React.lazy(() => import("../features/auth/pages/Login"));

// Dashboard
const AnalyticsDashboard = React.lazy(() => import("@/features/dashboard/pages/AnalyticDashboard"));

// Profile & Settings
// Note: ProfileSettingsPage is a named export, so we map it to 'default' for React.lazy
const ProfileSettingsPage = React.lazy(() => 
  import("@/features/Setting/pages/ProfileSettingPage").then(module => ({ default: module.ProfileSettingsPage }))
);
const ProfileForm = React.lazy(() => import("../features/profile/pages/ProfileForm"));

// Products
const Product = React.lazy(() => import("@/features/product/pages/Product"));
const ProductDetail = React.lazy(() => import("@/features/product/pages/ProductDetail"));
const ProductForm = React.lazy(() => import("@/features/product/pages/ProductForm"));

// Purchase
const PurchaseMain = React.lazy(() => import("@/features/purchase/pages/PurchaseMain"));
const PurchaseDetail = React.lazy(() => import("@/features/purchase/pages/PurchaseDetail"));
const PurchaseManagement = React.lazy(() => import("@/features/purchase/pages/PurchaseForm"));

// Supplier
const Supplier = React.lazy(() => import("@/features/supplier/pages/Supplier"));
const SupplierDetail = React.lazy(() => import("@/features/supplier/pages/SupplierDetail"));
const SupplierForm = React.lazy(() => import("@/features/supplier/pages/SupplierForm"));

// Employee
const Employee = React.lazy(() => import("../features/employee/pages/Employee"));
const EmployeeForm = React.lazy(() => import("../features/employee/pages/EmployeeForm"));

// Inventory
const Inventory = React.lazy(() => import("../features/inventory/pages/Inventory"));
const InventoryForm = React.lazy(() => import("../features/inventory/pages/InventoryForm"));
const RefillPage = React.lazy(() => import("@/features/Refill/pages/LowStockRefill"));

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
      { path: 'product', element: <Product /> },
      { path: '/product/detail', element: <ProductDetail /> },
      { path: '/product/add', element: <ProductForm /> },
      
      { path: '/purchase', element: <PurchaseMain /> },
      { path: '/purchase/detail', element: <PurchaseDetail /> },
      { path: '/purchase/add', element: <PurchaseManagement /> },
      
      { path: 'supplier', element: <Supplier /> },
      { path: 'supplier/detail', element: <SupplierDetail /> },
      { path: '/supplier/add', element: <SupplierForm /> },
      
      { path: '/employee', element: <Employee /> },
      { path: '/employee/add', element: <EmployeeForm /> },
      
      { path: '/inventory', element: <Inventory /> },
      { path: '/inventory/add', element: <InventoryForm /> },
      { path: '/inventory/re-fill', element: <RefillPage /> },
      
      { path: '/billing', element: <Billing /> },
      { path: '/orders', element: <Order /> },
      
      { path: '/profile', element: <ProfileSettingsPage /> },
      { path: '/profile/add', element: <ProfileForm /> },
      
      { path: '/create-digital-store', element: <StoreSetupForm /> },
      { path: '/digital-store/profile', element: <DigitalMain /> },
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