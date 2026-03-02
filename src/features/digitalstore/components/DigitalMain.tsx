import { useState } from "react";
import DeliveryPreferences from "../pages/Deliveryinfo";
import ProductDashboard from "../pages/StoreProductManagement";
import StoreSetupForm from "../pages/DigitalStoreForm";
import Announcement from "./Announcement";



type TabType =
   | "Create Store"
  | "Announcements"
  | "Delivery Preferences"
  | "Product Dashboard"
  


const DigitalMain = () => {
  const tabs: TabType[] = [
    "Create Store",
     "Announcements",
   "Delivery Preferences",
  "Product Dashboard",
    
  ];

  const [activeTab, setActiveTab] = useState<TabType>("Announcements");

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="lg:col-span-3 space-y-6">
        {/* TAB BUTTONS */}
        <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab
                  ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

   
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6">
          {activeTab === "Create Store" &&
           <div>
            <StoreSetupForm/>
            </div>
            }
          {activeTab === "Announcements" &&
           <div>
            <Announcement/>
            </div>
            }

          {activeTab === "Delivery Preferences" &&
           <div>
            <DeliveryPreferences/>
           </div>
           }

          {activeTab === "Product Dashboard" &&
           <div>
            <ProductDashboard/>
           </div>
           }

       
        </div>
      </div>
    </div>
  );
};

export default DigitalMain;