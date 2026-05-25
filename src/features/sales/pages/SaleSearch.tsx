import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, ClipboardList, PlusCircle } from "lucide-react";
import { useHeader } from "@/context/HeaderContext";
import { GradientButton } from "@/components/ui/GradientButton";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";

const SaleSearch = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData } = useApi();

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate("/sales")}
          className="px-5 h-11 rounded-lg border border-blue-100 text-blue-600 font-bold text-[14px] bg-blue-50/50 hover:bg-blue-100 transition-all flex-nowrap shrink-0 flex items-center gap-2"
        >
          <ClipboardList size={18} />
          Sales List
        </button>
        <GradientButton path="/billing" className="h-11 flex-nowrap shrink-0 flex items-center px-6 text-[14px] shadow-lg shadow-blue-200">
          <PlusCircle size={18} className="mr-1.5" />
          New Invoice
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  const fetchSales = async (q: string) => {
    try {
      const res = await getData(`${ENDPOINTS.ORDERS}/${SHOP_ID}`);
      const data = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      
      const query = q.toLowerCase().trim();
      const filtered = data.filter((s: any) => {
        if (!query) return true;
        const invStr = `Order #${s.ui_id}`.toLowerCase();
        const idStr = String(s.id).toLowerCase();
        const custStr = String(s.customer_id || "").toLowerCase();
        const cashierStr = String(s.cashier_id || "").toLowerCase();
        const statusStr = String(s.status || "").toLowerCase();
        const totalStr = String(s.total_sellprice || "").toLowerCase();
        const originStr = String(s.origin || "").toLowerCase();
        const methodStr = String(s.payment_method || "").toLowerCase();
        
        return (
          invStr.includes(query) ||
          idStr.includes(query) ||
          custStr.includes(query) ||
          cashierStr.includes(query) ||
          statusStr.includes(query) ||
          totalStr.includes(query) ||
          originStr.includes(query) ||
          methodStr.includes(query)
        );
      });

      return filtered.slice(0, 10).map((s: any) => {
        const invLabel = `Order #${s.ui_id}`;
        const totalLabel = `₹${Number(s.total_sellprice).toLocaleString("en-IN")}`;
        const statusLabel = s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1).toLowerCase() : "Completed";
        const dateLabel = s.created_at ? new Date(s.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "";
        return {
          ...s,
          displayName: `${invLabel} · ${statusLabel} · ${totalLabel} (${dateLabel})`
        };
      });
    } catch (err) {
      console.error("Failed to fetch sales for search:", err);
      return [];
    }
  };

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center px-4 animate-in fade-in duration-500">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-200 mb-6">
            <Receipt size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Sales Directory</h1>
          <p className="text-slate-500 font-medium text-lg">Search for orders, customer transactions or manage sales.</p>
        </div>

        <div className="relative group">
          <div className="absolute bg-gradient-to-r from-blue-100 to-indigo-200 blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white shadow-md rounded-lg">
            <SearchSelect
              labelKey="displayName"
              valueKey="id"
              fetchOptions={fetchSales}
              placeholder="Search by order ID, status, payment method or amount..."
              className="w-full h-16 border-none text-lg font-medium"
              onChange={(val) => val && navigate(`/sales/${val}`)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleSearch;
