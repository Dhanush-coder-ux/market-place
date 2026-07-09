import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Plus, ChevronRight, Check, Loader2 } from "lucide-react";
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
    setShopId(shop.id);
    localStorage.setItem("shop_id", shop.id);
    showToast(`Switched to ${shop.name}`, "success");
    // Small delay for visual feedback
    await new Promise((r) => setTimeout(r, 400));
    navigate("/");
  };

  const handleCreateShop = () => {
    navigate("/profile/add");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <Store className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {shops.length > 0 ? "Select Your Shop" : "Welcome!"}
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-medium">
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
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/40 transition-all duration-200 text-left group disabled:opacity-60"
            >
              {/* Shop avatar */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 text-white font-black text-lg shadow-lg shadow-indigo-500/20">
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
                <p className="font-bold text-white text-sm truncate">{shop.name}</p>
                {shop.categories && shop.categories.length > 0 && (
                  <p className="text-xs text-slate-400 font-medium capitalize truncate mt-0.5">
                    {shop.categories.join(", ")}
                  </p>
                )}
                {shop.description && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{shop.description}</p>
                )}
              </div>

              {/* Arrow / Spinner */}
              <div className="shrink-0 text-slate-500 group-hover:text-indigo-400 transition-colors">
                {selecting === shop.id ? (
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </div>
            </button>
          ))}

          {/* Divider if shops exist */}
          {shops.length > 0 && (
            <div className="relative flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                or
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          )}

          {/* Create new shop card */}
          <button
            onClick={handleCreateShop}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-dashed border-indigo-500/40 hover:border-indigo-400 hover:bg-indigo-500/5 transition-all duration-200 text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 transition-colors">
              <Plus className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-indigo-300 text-sm">Create New Shop</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Set up a new shop profile
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0" />
          </button>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-600 mt-8 font-medium">
          You can switch shops anytime from your profile
        </p>
      </div>
    </div>
  );
};

export default ShopSelect;
