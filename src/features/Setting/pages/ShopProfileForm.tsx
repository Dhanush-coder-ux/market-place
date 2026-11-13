import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Edit3,
  MapPin,
  Globe,
  Mail,
  Phone,
  ShieldCheck,
  Copy,
  ExternalLink,
  Tag,
  Building2,
  Compass,
  Users,
  Search,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/context/ToastContext";
import { SHOP_ID } from "@/services/endpoints";
import { shopApi } from "@/services/api/shop";
import Loader from "@/components/common/Loader";
import { NavigationBlocker } from "@/components/common/NavigationBlocker";

interface ShopProfileFormProps {
  editPath?: string;
}

export const ShopProfileForm: React.FC<ShopProfileFormProps> = ({ editPath }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rawShop, setRawShop] = useState<any>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followerSearch, setFollowerSearch] = useState("");

  useEffect(() => {
    fetchShop();
  }, []);

  const fetchShop = async () => {
    setLoading(true);
    try {
      const activeShopId = localStorage.getItem("shop_id") || SHOP_ID;
      const [shopRes, followersRes] = await Promise.allSettled([
        shopApi.getShopById(activeShopId),
        shopApi.getShopFollowers(activeShopId),
      ]);

      if (shopRes.status === "fulfilled") {
        const data = shopRes.value?.data ?? shopRes.value;
        if (data) setRawShop(data);
      }

      if (followersRes.status === "fulfilled") {
        const rawF = followersRes.value?.data ?? (Array.isArray(followersRes.value) ? followersRes.value : []);
        const list = Array.isArray(rawF) ? rawF : (rawF.followers || rawF.items || []);
        setFollowers(list);
        setFollowersCount(list.length);
      }
    } catch (e: any) {
      showToast(e?.message || "Failed to fetch shop details", "error");
    } finally {
      setLoading(false);
    }
  };

  const storeUrl = rawShop
    ? rawShop.additional_infos?.website || `${window.location.origin}/store/${rawShop.id || SHOP_ID}`
    : `${window.location.origin}/store/${SHOP_ID}`;

  const handleCopyStoreUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    showToast("Store URL copied to clipboard", "success");
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <Loader />
        <span className="text-xs font-semibold text-slate-400">Loading store details...</span>
      </div>
    );
  }

  const name = rawShop?.name || "InventQ Merchant";
  const tagline = rawShop?.tagline || "";
  const description = rawShop?.description || "";
  const logoUrl = rawShop?.logo_url || "";
  const bannerUrl = rawShop?.banner_url || "";
  const categories: string[] = Array.isArray(rawShop?.categories) ? rawShop.categories : [];
  const address = rawShop?.address || {};
  const businessInfos = rawShop?.business_infos || {};
  const additionalInfos = rawShop?.additional_infos || {};
  const gstRegistered = !!businessInfos?.gst_infos?.registered;
  const gstNumber = businessInfos?.gst_infos?.number;
  const emails = Array.isArray(additionalInfos?.emails) ? additionalInfos.emails : [];
  const phones = Array.isArray(additionalInfos?.mobile_numbers) ? additionalInfos.mobile_numbers : [];
  const website = additionalInfos?.website || "";
  const initials = name.charAt(0).toUpperCase() || "S";

  const filteredFollowers = followers.filter((f: any) => {
    if (!followerSearch.trim()) return true;
    const q = followerSearch.toLowerCase();
    const fName = String(f?.name || f?.customer_name || f?.user_name || f?.mobile || "").toLowerCase();
    return fName.includes(q);
  });

  return (
    <>
      <NavigationBlocker data={rawShop} isSubmitting={false} />

      <div className="space-y-6 animate-in fade-in duration-300">
        
        {/* ── Compact Executive Header Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          
          {/* Store Banner */}
          <div className="relative h-32 sm:h-40 md:h-44 w-full overflow-hidden bg-slate-900">
            {bannerUrl ? (
              <>
                <img
                  src={bannerUrl}
                  alt="Shop Banner"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
              </>
            ) : (
              <div className="w-full h-full relative overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900">
                <div className="absolute -top-16 -left-16 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 right-0 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
              </div>
            )}
          </div>

          {/* Profile Identity Bar */}
          <div className="px-5 sm:px-6 pb-5 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              
              {/* Logo / Avatar + Info */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 min-w-0 flex-1">
                <div className="-mt-12 sm:-mt-14 md:-mt-16 shrink-0 relative z-20">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white flex items-center justify-center ring-1 ring-slate-200/60">
                    {logoUrl ? (
                      <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 text-3xl font-semibold">
                        {initials}
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1 pt-1 sm:pt-3 pb-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 tracking-tight leading-snug truncate">
                      {name}
                    </h1>

                    {gstRegistered && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0">
                        <ShieldCheck size={11} className="text-emerald-600" />
                        <span>GST Registered{gstNumber ? `: ${gstNumber}` : ""}</span>
                      </span>
                    )}

                    {/* Followers Badge */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80 shrink-0">
                      <Users size={12} className="text-blue-500" />
                      <span>{followersCount} {followersCount === 1 ? "Follower" : "Followers"}</span>
                    </span>
                  </div>

                  {tagline ? (
                    <p className="text-xs sm:text-[13px] text-slate-500 font-normal leading-normal mt-1 truncate">
                      {tagline}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic mt-1">
                      No business tagline added
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-end pb-1 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => navigate(editPath || `/create-shop?id=${SHOP_ID}`)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Edit3 size={13} />
                  <span>Edit Shop Details</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ── Structured 3-Card Grid for Store Details ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">

          {/* Card 1: Core Business Information */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
                    <Building2 size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800">General Information</h3>
                    <p className="text-[10.5px] text-slate-400">Store identity & bio</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-150">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                    Shop Display Name
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800">{name}</p>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-150">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                    Business Tagline
                  </span>
                  <p className="text-xs font-medium text-slate-700">
                    {tagline || <span className="text-slate-400 font-normal italic">Not specified</span>}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    About Your Store
                  </span>
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-150 text-slate-700 text-xs font-normal leading-relaxed max-h-28 overflow-y-auto custom-scrollbar">
                    {description ? (
                      description
                    ) : (
                      <span className="text-slate-400 italic">
                        No store bio provided. Click "Edit Shop Details" to add a customer-facing story.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                Categories ({categories.length})
              </span>
              {categories.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs"
                    >
                      <Tag size={10} className="text-slate-400" />
                      {cat}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No categories assigned</p>
              )}
            </div>
          </div>

          {/* Card 2: Location & Address */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
                    <MapPin size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800">Physical Address</h3>
                    <p className="text-[10.5px] text-slate-400">Store location & pickup origin</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-150 space-y-3">
                <div className="flex items-start gap-2.5">
                  <MapPin size={15} className="text-emerald-700 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                    {address?.full_address || "No street address configured."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-[9.5px] font-medium text-slate-400 uppercase tracking-wider block">
                      ZIP / Postal Code
                    </span>
                    <span className="text-xs font-semibold text-slate-800 font-mono">
                      {address?.zip_code || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9.5px] font-medium text-slate-400 uppercase tracking-wider block">
                      Landmark
                    </span>
                    <span className="text-xs font-medium text-slate-700 truncate block">
                      {address?.landmark || "—"}
                    </span>
                  </div>
                </div>

                {(address?.latitude || address?.longitude) && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                    <Compass size={12} className="text-slate-400" />
                    <span>Geo: {address.latitude?.toFixed(4)}, {address.longitude?.toFixed(4)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Google Map Directions button if address exists */}
            {address?.full_address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.full_address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Compass size={13} />
                <span>Open in Google Maps</span>
                <ExternalLink size={11} className="text-slate-400" />
              </a>
            )}
          </div>

          {/* Card 3: Contact & Legal Compliance */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                    <Phone size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-800">Contact & Compliance</h3>
                    <p className="text-[10.5px] text-slate-400">Communication & legal details</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-150 flex items-start gap-2.5">
                  <Phone size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-medium text-slate-400 uppercase tracking-wider block">
                      Phone Number(s)
                    </span>
                    {phones.length > 0 ? (
                      <div className="space-y-0.5 mt-0.5">
                        {phones.map((p: string, i: number) => (
                          <p key={i} className="text-xs font-semibold text-slate-800">{p}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Not set</p>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-150 flex items-start gap-2.5">
                  <Mail size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-medium text-slate-400 uppercase tracking-wider block">
                      Support Email(s)
                    </span>
                    {emails.length > 0 ? (
                      <div className="space-y-0.5 mt-0.5">
                        {emails.map((m: string, i: number) => (
                          <p key={i} className="text-xs font-semibold text-slate-800 truncate">{m}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Not set</p>
                    )}
                  </div>
                </div>

                {website && (
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-150 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe size={14} className="text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[9.5px] font-medium text-slate-400 uppercase tracking-wider block">
                          Website
                        </span>
                        <a
                          href={website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-blue-600 hover:underline truncate block"
                        >
                          {website}
                        </a>
                      </div>
                    </div>
                    <ExternalLink size={12} className="text-slate-400 shrink-0" />
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── Interactive Store Followers Modal ── */}
      {showFollowersModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
              
              {/* Header */}
              <div className="p-5 border-b border-slate-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                    <Users size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-800">Store Followers</h3>
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full">
                        {followersCount}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Customers following {name}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFollowersModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3 border-b border-slate-100 bg-slate-50/60">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={followerSearch}
                    onChange={(e) => setFollowerSearch(e.target.value)}
                    placeholder="Search follower by name or number..."
                    className="w-full h-9 pl-9 pr-8 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-2xs"
                  />
                  {followerSearch && (
                    <button
                      type="button"
                      onClick={() => setFollowerSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Followers List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar min-h-[220px]">
                {filteredFollowers.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-1">
                      <Users size={22} />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      {followerSearch ? `No followers matching "${followerSearch}"` : "No followers yet"}
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs font-normal">
                      Share your digital store QR code or public link with customers to grow your follower base!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyStoreUrl();
                        setShowFollowersModal(false);
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      <Copy size={12} />
                      <span>Copy Store Link</span>
                    </button>
                  </div>
                ) : (
                  filteredFollowers.map((f: any, idx: number) => {
                    const fName = f?.name || f?.customer_name || f?.user_name || f?.mobile || `Follower #${idx + 1}`;
                    const fInitial = fName.charAt(0).toUpperCase() || "F";
                    const fJoined = f?.created_at ? new Date(f.created_at).toLocaleDateString() : null;

                    return (
                      <div
                        key={f?.id || idx}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-150 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {fInitial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{fName}</p>
                            {f?.mobile && (
                              <p className="text-[11px] text-slate-500 font-mono">{f.mobile}</p>
                            )}
                          </div>
                        </div>

                        {fJoined && (
                          <span className="text-[10px] font-medium text-slate-400 shrink-0">
                            Joined {fJoined}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400 font-medium">
                  {followersCount} registered customer followers
                </span>
                <button
                  type="button"
                  onClick={() => setShowFollowersModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>,
          document.body
        )}
    </>
  );
};
