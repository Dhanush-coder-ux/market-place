import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, History, PlusCircle } from "lucide-react";
import { useHeader } from "@/context/HeaderContext";
import { GradientButton } from "@/components/ui/GradientButton";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { toDisplayData } from "./PurchaseHistory";

const PurchaseSearch = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData } = useApi();

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate("/purchase-history")}
          className="px-5 h-11 rounded-lg border border-blue-100 text-blue-600 font-bold text-[14px] bg-blue-50/50 hover:bg-blue-100 transition-all flex-nowrap shrink-0 flex items-center gap-2"
        >
          <History size={18} />
          Purchase History
        </button>
        <GradientButton path="/purchase/add" className="h-11 flex-nowrap shrink-0 flex items-center px-6 text-[14px] shadow-lg shadow-blue-200">
          <PlusCircle size={18} className="mr-1.5" />
          Add Purchase
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  const fetchPurchases = async (q: string) => {
    try {
      const res = await getData(ENDPOINTS.PURCHASES, { view: "PURCHASE_VIEW", shop_id: SHOP_ID, limit: "100", offset: "1" });
      const rawData = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      const data = rawData.map(toDisplayData);
      
      const query = q.toLowerCase().trim();
      const filtered = data.filter((po: any) => {
        if (!query) return true;
        const poNumStr = String(po.poNumber || "").toLowerCase();
        const idStr = String(po.id).toLowerCase();
        const vendorStr = String(po.vendor || "").toLowerCase();
        const costStr = String(po.total_cost || "").toLowerCase();
        const dateStr = String(po.date || "").toLowerCase();
        const typeStr = String(po.purchaseType || "").toLowerCase();
        
        return (
          poNumStr.includes(query) ||
          idStr.includes(query) ||
          vendorStr.includes(query) ||
          costStr.includes(query) ||
          dateStr.includes(query) ||
          typeStr.includes(query)
        );
      });

      return filtered.slice(0, 10).map((po: any) => {
        const totalLabel = `₹${Number(po.total_cost).toLocaleString("en-IN")}`;
        const poLabel = po.poNumber || "Direct";
        const dateLabel = po.date || "";
        return {
          ...po,
          displayName: `${poLabel} · ${po.vendor} · ${totalLabel} (${dateLabel})`
        };
      });
    } catch (err) {
      console.error("Failed to fetch purchases for search:", err);
      return [];
    }
  };

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center px-4 animate-in fade-in duration-500">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-200 mb-6">
            <FileText size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Purchase Directory</h1>
          <p className="text-slate-500 font-medium text-lg">Search for purchase orders, vendor invoices or view supplier history.</p>
        </div>

        <div className="relative group">
          <div className="absolute bg-gradient-to-r from-blue-100 to-indigo-200 blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white shadow-md rounded-lg">
            <SearchSelect
              labelKey="displayName"
              valueKey="id"
              fetchOptions={fetchPurchases}
              placeholder="Search by PO number, vendor, type or cost..."
              className="w-full h-16 border-none text-lg font-medium"
              onChange={(val) => val && navigate(`/purchase/detail/${val}`)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSearch;
