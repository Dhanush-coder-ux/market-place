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
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [visibleOnline, setVisibleOnline] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
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

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const res = await shopApi.uploadShopImage(file, "logo");
      const data = res?.data ?? res;
      if (data && data.logo_url) {
        setLogoUrl(data.logo_url);
        showToast("Logo uploaded successfully", "success");
      } else {
        const url = typeof data === "string" ? data : (Array.isArray(data) ? data[0] : "");
        if (url) {
          setLogoUrl(url);
          showToast("Logo uploaded successfully", "success");
        } else {
          showToast("Failed to upload logo", "error");
        }
      }
    } catch {
      showToast("Failed to upload logo", "error");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const res = await shopApi.uploadShopImage(file, "banner");
      const data = res?.data ?? res;
      if (data && data.banner_url) {
        setBannerUrl(data.banner_url);
        showToast("Banner uploaded successfully", "success");
      } else {
        const url = typeof data === "string" ? data : (Array.isArray(data) ? data[0] : "");
        if (url) {
          setBannerUrl(url);
          showToast("Banner uploaded successfully", "success");
        } else {
          showToast("Failed to upload banner", "error");
        }
      }
    } catch {
      showToast("Failed to upload banner", "error");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await shopApi.updateShop({
        id: SHOP_ID,
        name: name,
        tagline: tagline || null,
        description: description || null,
        visible_online: visibleOnline,
        address: address,
        logo_url: logoUrl || null,
        banner_url: bannerUrl || null,
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
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tagline</label>
            <p className="text-[10px] text-slate-400 mb-1">A short, friendly line that describes your storefront</p>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              placeholder="e.g. A home for makers"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Shop Logo</label>
              <div className="flex gap-3 items-center">
                <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="text-slate-400" size={20} />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-slate-700"
                    placeholder="Or paste Logo URL"
                  />
                  <label className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-slate-650 font-bold text-xs bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} disabled={uploadingLogo} />
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Shop Banner</label>
              <div className="flex gap-3 items-center">
                <div className="w-24 h-14 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                  {bannerUrl ? (
                    <img src={bannerUrl} alt="Banner preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-350 font-bold text-[10px]">No Banner</div>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <input
                    type="text"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-slate-700"
                    placeholder="Or paste Banner URL"
                  />
                  <label className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-slate-650 font-bold text-xs bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadBanner} disabled={uploadingBanner} />
                    {uploadingBanner ? "Uploading..." : "Upload Banner"}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">About your store</label>
            <p className="text-[10px] text-slate-400 mb-1">Tell customers what you make, where you are, and why they should choose you</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm resize-none"
              placeholder="Describe your shop..."
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
