import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/context/ToastContext";
import { SHOP_ID } from "@/services/endpoints";
import { shopApi } from "@/services/api/shop";
import Loader from "@/components/common/Loader";
import { NavigationBlocker } from "@/components/common/NavigationBlocker";

export const ShopProfileForm = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, _setSaving] = useState(false);
  
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [visibleOnline, setVisibleOnline] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const navigate = useNavigate();
  const [address, setAddress] = useState({
    full_address: "",
    zip_code: "",
    landmark: "",
    latitude: 0,
    longitude: 0,
  });

  useEffect(() => {
    fetchShop();
  }, []);

  const fetchShop = async () => {
    setLoading(true);
    try {
      const res = await shopApi.getShopById(SHOP_ID);
      const data = res?.data ?? res;
      if (data) {
        setName(data.name || "");
        setTagline(data.tagline || "");
        setDescription(data.description || "");
        setVisibleOnline(data.visible_online || false);
        setLogoUrl(data.logo_url || "");
        setBannerUrl(data.banner_url || "");
        if (data.address) {
          setAddress({
            full_address: data.address.full_address || "",
            zip_code: data.address.zip_code || "",
            landmark: data.address.landmark || "",
            latitude: data.address.latitude || 0,
            longitude: data.address.longitude || 0,
          });
        }
      }
    } catch {
      showToast("Failed to fetch shop details", "error");
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return <div className="p-8 flex justify-center"><Loader /></div>;
  }

  return (
    <>
      <NavigationBlocker data={{ name, tagline, description, visibleOnline, address, logoUrl, bannerUrl }} isSubmitting={saving} />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-2 duration-300 h-full">
      <div className="px-6 py-5 border-b border-slate-50 bg-gradient-to-r from-slate-50/80 to-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Store size={17} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Shop Profile</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Update your shop's core details and visibility.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/create-shop")}
          className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
        >
          <Store className="w-4 h-4" />
          Edit Digital Store
        </button>
      </div>

      <div className="p-6 space-y-5 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Shop Name</label>
            <p className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium">
              {name || "Not set"}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tagline</label>
            <p className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium">
              {tagline || "Not set"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Shop Logo</label>
              <div className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                ) : (
                  <Store className="text-slate-400" size={24} />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Shop Banner</label>
              <div className="w-40 h-20 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                {bannerUrl ? (
                  <img src={bannerUrl} alt="Banner preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-350 font-bold text-[10px]">No Banner</div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">About your store</label>
            <p className="w-full min-h-[80px] p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium whitespace-pre-wrap">
              {description || "No description provided."}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Address</label>
            <p className="w-full min-h-[80px] p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium whitespace-pre-wrap">
              {address.full_address || "No address provided."}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <div className={`w-3 h-3 rounded-full ${visibleOnline ? 'bg-green-500' : 'bg-slate-300'}`}></div>
            <span className="text-sm font-semibold text-slate-700">
              {visibleOnline ? "Shop is Visible Online" : "Shop is Offline"}
            </span>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};
