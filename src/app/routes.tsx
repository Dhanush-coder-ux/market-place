import Loader from "@/components/common/Loader";
import { ProfileSettingsPage } from "@/features/Setting/pages/ProfileSettingPage";
import AnalyticsDashboard from "@/features/dashboard/pages/AnalyticDashboard";
import DigitalMain from "@/features/digitalstore/components/DigitalMain";
import StoreSetupForm from "@/features/digitalstore/pages/DigitalStoreForm";
import Product from "@/features/product/pages/Product";
import ProductDetail from "@/features/product/pages/ProductDetail";
import ProductForm from "@/features/product/pages/ProductForm";
import PurchaseHistoryTab from "@/features/purchase/pages/Purchase";
import PurchaseDetail from "@/features/purchase/pages/PurchaseDetail";
import RefillPage from "@/features/Refill/pages/LowStockRefill";
import Supplier from "@/features/supplier/pages/Supplier";
import SupplierDetail from "@/features/supplier/pages/SupplierDetail";
import SupplierForm from "@/features/supplier/pages/SupplierForm";
import React, { Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
const MainLayout      =   React.lazy(() => import ("../components/layouts/MainLayout"));
// const DashBoard       =   React.lazy(() => import ("../features/dashboard/pages/DashBoard"));
const Employee        =   React.lazy(()=> import ("../features/employee/pages/Employee"));
const Inventory       =   React.lazy(()=>  import ("../features/inventory/pages/Inventory"));
const Order           =   React.lazy(() =>  import ("../features/order/pages/Order"));
const Login           =   React.lazy(()=>  import ("../features/auth/pages/Login"));
const Billing         =   React.lazy(()=>  import ("../features/billing/pages/Billing"));
const EmployeeForm    =   React.lazy(()=>  import ("../features/employee/pages/EmployeeForm"));
const InventoryForm   =   React.lazy(()=>  import ("../features/inventory/pages/InventoryForm"));
const ProfileForm     =   React.lazy(()=>  import ("../features/profile/pages/ProfileForm"));


export const router = createBrowserRouter([
    
    { 
        path: '/', 
        element:(
        <Suspense fallback={<Loader/>}>    
        <MainLayout/>
        </Suspense>
        ),
        children:[
            { index:true, element:<AnalyticsDashboard/> },
            {path : 'product', element:<Product/>},
            { path:'/product/detail', element:<ProductDetail/>},
            { path: "/product/add",element:<ProductForm/>},
            {path:'/purchase',element:<PurchaseHistoryTab/>},
            { path:'/purchase/detail',element:<PurchaseDetail/>},
            { path: 'supplier',element:<Supplier/>},
            { path: 'supplier/detail',element:<SupplierDetail/>},
            { path: '/supplier/add',element:<SupplierForm/>},
            { path:'/employee', element:<Employee/> },
            { path:'/employee/add', element:<EmployeeForm/> },
            { path:'/inventory',element:<Inventory/> },
            { path:'/inventory/add',element:<InventoryForm/> },
            { path:'/billing', element:<Billing/>},
            { path:'/orders', element:<Order/> },
            { path:'/profile', element:<ProfileSettingsPage/> },
            { path:'/profile/add', element:<ProfileForm/> },
            {path:'/inventory/re-fill',element:<RefillPage/>},
            { path : '/create-digital-store', element:<StoreSetupForm/>},
              {path:'/digital-store/profile',element:<DigitalMain/>},
            
        ]
    },
    {
        path:'/login',
        element:<Login/>
    },
    {
        path: "*",
        element: <div>Page Not Found</div>,
    } 

])