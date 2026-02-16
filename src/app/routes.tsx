import Loader from "@/components/common/Loader";
import Main from "@/features/digitalstore/components/Main";
import { DigitalStoreProfile } from "@/features/digitalstore/components/Profile";
import DeliveryPreferences from "@/features/digitalstore/pages/Deliveryinfo";
import StoreSetupForm from "@/features/digitalstore/pages/DigitalStoreForm";
import ProductManagement from "@/features/digitalstore/pages/ProductManagement";
import StorePublishFlow from "@/features/digitalstore/pages/PublishStore";
import RefillPage from "@/features/Refill/pages/LowStockRefill";
import React, { Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
const MainLayout      =   React.lazy(() => import ("../components/layouts/MainLayout"));
const DashBoard       =   React.lazy(() => import ("../features/dashboard/pages/DashBoard"));
const Employee        =   React.lazy(()=> import ("../features/employee/pages/Employee"));
const Inventory       =   React.lazy(()=>  import ("../features/inventory/pages/Inventory"));
const Order           =   React.lazy(() =>  import ("../features/order/pages/Order"));
const Profile         =   React.lazy(()=>  import ("../features/profile/pages/Profile"));
const Shop            =   React.lazy(()=>  import ("../features/shop/pages/Shop"));
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
            { index:true, element:<DashBoard/> },
            { path:'/employee', element:<Employee/> },
            { path:'/employee/add', element:<EmployeeForm/> },
            { path:'/inventory',element:<Inventory/> },
            { path:'/inventory/add',element:<InventoryForm/> },
            { path:'/billing', element:<Billing/>},
            { path:'/orders', element:<Order/> },
            { path:'/profile', element:<Profile/> },
            { path:'/profile/add', element:<ProfileForm/> },
            { path:'/shop', element:<Shop/>},
            {path:'/inventory/re-fill',element:<RefillPage/>},
            {path:'/digital-store', element: <StoreSetupForm/>},
            {path:'/delivery-info', element: <DeliveryPreferences/>},
            {path:'/product-management', element: <ProductManagement/>},
            {path:'/publish-store',element:<StorePublishFlow/>},
            {path:'/create-store', element: <Main/>},
              {path:'profile-info',element:<DigitalStoreProfile  status="live"/>}
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