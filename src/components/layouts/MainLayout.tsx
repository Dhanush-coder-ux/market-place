import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Breadcrumb from "../common/BreadCrums";

const MainLayout = () => {
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-50">
      {/* 1. Navbar stays fixed at the top */}
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* 2. Sidebar stays fixed on the left */}
        <Sidebar />
    
        {/* 3. Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          
          {/* FIX: Changed 'overflow-hidden' to 'overflow-y-auto'.
             This allows long pages (like Dashboard/Products) to scroll normally.
             The 'custom-scrollbar' class styles the scrollbar blue.
          */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
            <Breadcrumb />
             <Outlet />
          </div>
          
        </main>
      </div>
    </div>
  );
};

export default MainLayout;