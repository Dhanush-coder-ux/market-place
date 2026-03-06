import { Outlet, useLocation } from "react-router-dom";
import Breadcrumb from "../common/BreadCrums";
import { Navbar } from "./Navbar";
import Sidebar from "./Sidebar";
import { sidebarLinks } from "@/utils/constants";


const MainLayout = () => {
  const location = useLocation()
  const isStorePage = location.pathname==="/digital-store" || location.pathname==="/digital-store/profile" || location.pathname=== "/";

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-50">
   
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
 
        <Sidebar links={sidebarLinks}/>
    
 
        <main className="flex-1 flex flex-col min-w-0">
          
         
          <div className={`flex-1 overflow-y-auto  custom-scrollbar ${isStorePage ? "p-0" : "p-3"}`}>
            { !isStorePage && <Breadcrumb />}
             <Outlet />
          </div>
          
        </main>
      </div>
    </div>
  );
};

export default MainLayout;