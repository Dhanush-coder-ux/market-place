import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const MainLayout = () => {
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      
       <Navbar/>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
    
      
    
      <main className="flex-1 h-full overflow-y-auto custom-scrollbar">
      
        <div className="mx-2 p-3 lg:p-3">
            <Outlet />
          </div>
      </main>
        </div>
    </div>
  );
};

export default MainLayout;