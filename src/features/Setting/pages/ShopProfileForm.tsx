import { useEffect, useState } from "react";
import { Store, Save } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { SHOP_ID } from "@/services/endpoints";
import { shopApi } from "@/services/api/shop";
import Loader from "@/components/common/Loader";
import { NavigationBlocker } from "@/components/common/NavigationBlocker";

export const ShopProfileForm = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState("");
  const [visibleOnline, setVisibleOnline] = useState(false);
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
        setVisibleOnline(data.visible_online || false);
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

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await shopApi.updateShop({
        id: SHOP_ID,
        name: name,
        visible_online: visibleOnline,
        address: address,
      });
      showToast("Shop profile updated successfully", "success");
    } catch {
      showToast("Failed to update shop profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader /></div>;
  }

  return (
    <>
      <NavigationBlocker data={{ name, visibleOnline, address }} isSubmitting={saving} />
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
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="p-6 space-y-5 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Shop Name <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              placeholder="Enter shop name"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Address</label>
            <textarea
              value={address.full_address}
              onChange={(e) => setAddress({ ...address, full_address: e.target.value })}
              className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm resize-none"
              placeholder="Enter full address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Zip Code</label>
              <input
                type="text"
                value={address.zip_code}
                onChange={(e) => setAddress({ ...address, zip_code: e.target.value })}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                placeholder="Zip Code"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Landmark</label>
              <input
                type="text"
                value={address.landmark}
                onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                placeholder="Landmark"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <input
              type="checkbox"
              id="visible_online"
              checked={visibleOnline}
              onChange={(e) => setVisibleOnline(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-50 border-slate-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="visible_online" className="text-sm font-semibold text-slate-700 cursor-pointer">
              Visible Online
            </label>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};
