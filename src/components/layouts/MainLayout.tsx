import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const MainLayout = () => {
  return (
    <div className="flex h-screen w-full  overflow-hidden">
      
     
      <div className="flex-shrink-0 ">
        <Sidebar />
      </div>
      
    
      <main className="flex-1 h-full overflow-y-auto custom-scrollbar">
        <Navbar/>
        <div className=" mx-auto p-6 lg:p-10">
          
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;