import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Plus, ChevronRight, Loader2 } from "lucide-react";
import { setShopId } from "@/services/endpoints";
import { fetchMyShops } from "@/services/api/shopHelpers";
import { useToast } from "@/context/ToastContext";

interface ShopItem {
  id: string;
  name: string;
  categories?: string[];
  logo_url?: string;
  description?: string;
}

const ShopSelect = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const list = await fetchMyShops();
        setShops(list);
      } catch (e) {
        console.error("Failed to fetch shops:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  const handleSelectShop = async (shop: ShopItem) => {
    setSelecting(shop.id);
    try {
      // Tokens were already obtained during the /auth/callback step.
      // Just persist the chosen shop_id and navigate to the dashboard.
      setShopId(shop.id);
      localStorage.setItem("shop_id", shop.id);
      showToast(`Switched to ${shop.name}`, "success");
      await new Promise((r) => setTimeout(r, 300));
      navigate("/");
    } catch (err: any) {
      console.error("Failed to select shop:", err);
      showToast(err.message || "Failed to switch shop", "error");
    } finally {
      setSelecting(null);
    }
  };

  const handleCreateShop = () => {
    navigate("/create-shop");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 mb-4 shadow-sm shadow-blue-500/10">
            <Store className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            {shops.length > 0 ? "Select Your Shop" : "Welcome!"}
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            {shops.length > 0
              ? "Choose a shop to continue or create a new one"
              : "Let's get started by setting up your first shop"}
          </p>
        </div>

        <div className="space-y-3">
          {/* Existing shops */}
          {shops.map((shop) => (
            <button
              key={shop.id}
              onClick={() => handleSelectShop(shop)}
              disabled={!!selecting}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-slate-50 shadow-sm transition-all duration-200 text-left group disabled:opacity-60"
            >
              {/* Shop avatar */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 text-white font-black text-lg shadow-md shadow-blue-500/20">
                {shop.logo_url ? (
                  <img
                    src={shop.logo_url}
                    alt={shop.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  shop.name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">{shop.name}</p>
                {shop.categories && shop.categories.length > 0 && (
                  <p className="text-xs text-slate-500 font-medium capitalize truncate mt-0.5">
                    {shop.categories.join(", ")}
                  </p>
                )}
                {shop.description && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">{shop.description}</p>
                )}
              </div>

              {/* Arrow / Spinner */}
              <div className="shrink-0 text-slate-400 group-hover:text-blue-500 transition-colors">
                {selecting === shop.id ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </div>
            </button>
          ))}

          {/* Divider if shops exist */}
          {shops.length > 0 && (
            <div className="relative flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                or
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          )}

          {/* Create new shop card */}
          <button
            onClick={handleCreateShop}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-left group bg-white/50"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-blue-600 text-sm">Create New Shop</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Set up a new shop profile
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
          </button>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-500 mt-8 font-medium">
          You can switch shops anytime from your profile
        </p>
      </div>
    </div>
  );
};

export default ShopSelect;
