import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/layouts/MainLayout";
import DashBoard from "../features/dashboard/pages/DashBoard";
import Employee from "../features/employee/pages/Employee";
import Inventory from "../features/inventory/pages/Inventory";
import Order from "../features/order/pages/Order";
import Profile from "../features/profile/pages/Profile";
import Shop from "../features/shop/pages/Shop";
import Login from "../features/auth/pages/Login";
import Billing from "../features/billing/pages/Billing";
import EmployeeForm from "../features/employee/pages/EmployeeForm";
import InventoryForm from "../features/inventory/pages/InventoryForm";
import ProfileForm from "../features/profile/pages/ProfileForm";


export const router = createBrowserRouter([
    
    { 
        path: '/', 
        element:<MainLayout/>,
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
            { path:'/shop', element:<Shop/>}
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