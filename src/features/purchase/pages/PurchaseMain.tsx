import { useState } from "react";
import PurchaseHistoryTab from "../components/Purchase";
import GRNListView from "../components/GrnListView";
import HomeMade from "../components/HomeMade";
import PurchaseHeader from "../components/PurchaseHeader";

const tabs: Array<{ id: "history" | "grn" | "homemade"; label: string }> = [
    { id: "history", label: "Direct Purchase" },
    { id: "grn", label: "GRN Records" },
    { id: "homemade", label: "Home Made" },
];
const PurchaseMain = () => {
    const [activeSubTab, setActiveSubTab] = useState<"history" | "grn" | "homemade">("history");
    return (
        <div  className="space-y-4">
        <PurchaseHeader/>
            <div className="px-6 flex  items-center justify-center">
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">

                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`px-5 py-2 text-sm font-semibold rounded-md transition-all duration-200
                             ${activeSubTab === tab.id
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}

                </div>
            </div>

              {/* main */}
             <div className="px-6 pb-10">
                   {activeSubTab === "history" && (
                    <PurchaseHistoryTab/>
                   )}
                   {activeSubTab === "grn" && (
                    <GRNListView/>
                   )}
                   {activeSubTab === "homemade" && (
                    <HomeMade/>
                   )}
             </div>

        </div>
    )
}

export default PurchaseMain
