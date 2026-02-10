import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const MainLayout = () => {
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-50">

      <div className="shrink-0 z-20 bg-white border-b border-slate-200">
        <Navbar />
      </div>

      <div className="flex flex-1 overflow-hidden relative">

        <Sidebar />

        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden custom-scrollbar relative">

          <div className="w-full min-h-full p-4 md:p-6">
            <Outlet />
          </div>

        </main>
      </div>
    </div>
  );
};

export default MainLayout;