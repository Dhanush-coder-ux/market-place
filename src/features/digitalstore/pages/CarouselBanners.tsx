import { useState } from "react";
import { Upload, Image as ImageIcon, Trash2, GripVertical, CheckCircle2, Eye, EyeOff, Check, Link } from "lucide-react";

interface Banner {
  id: string;
  url: string;
  active: boolean;
  link: string;
}

const MOCK_BANNERS: Banner[] = [
  { id: "1", url: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&h=400&fit=crop", active: true, link: "/summer-sale" },
  { id: "2", url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop", active: false, link: "" },
];

export default function CarouselBanners() {
  const [banners, setBanners] = useState<Banner[]>(MOCK_BANNERS);
  const [saved, setSaved] = useState(false);

  const toggleVisibility = (id: string) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  const updateLink = (id: string, link: string) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, link } : b));
  };

  const removeBanner = (id: string) => {
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const activeCount = banners.filter(b => b.active).length;

  return (
    <div className="py-5 px-1 space-y-5" style={{ fontFamily: "Inter, Poppins, sans-serif" }}>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#eff6ff", color: "#3b82f6" }}>
              <ImageIcon size={18} strokeWidth={2.5} />
            </div>
            <h1 className="text-[20px] font-extrabold text-slate-800 tracking-tight">Carousel Banners</h1>
          </div>
          <p className="text-[13px] text-slate-400 ml-12">
            Upload and manage promotional banners for your storefront slider.
          </p>
        </div>

        {/* Summary pills */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl">
            <CheckCircle2 size={12} className="text-blue-500" />
            <span className="text-[12px] font-bold text-blue-600">{activeCount} Active</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="text-[12px] font-bold text-slate-500">{banners.length} Total</span>
          </div>
        </div>
      </div>

      {/* ── Upload Area ── */}
      <div className="bg-white rounded-2xl border-[1.5px] border-slate-200 overflow-hidden shadow-sm">
        {/* Top blue accent bar */}
        <div className="h-[3px] bg-blue-500" />
        <div className="p-6">
          <div className="border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer group flex flex-col items-center justify-center py-10">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
              <Upload size={20} className="text-blue-500" strokeWidth={2.5} />
            </div>
            <h3 className="text-[15px] font-bold text-slate-800 mb-1">Upload New Banner</h3>
            <p className="text-[12.5px] text-slate-400 font-medium">Drag & drop or click to browse</p>
            <p className="text-[11px] text-slate-400 mt-3">Recommended size: 1200 x 400px (JPG, PNG)</p>
          </div>
        </div>
      </div>

      {/* ── Banner List ── */}
      <div className="space-y-4">
        {banners.map((banner, idx) => (
          <div
            key={banner.id}
            className="bg-white rounded-2xl border-[1.5px] p-4 flex flex-col md:flex-row gap-4 transition-all duration-200"
            style={{
              borderColor: banner.active ? "#bfdbfe" : "#e2e8f0",
              boxShadow: banner.active ? "0 4px 16px rgba(59,130,246,0.06)" : "none",
              opacity: banner.active ? 1 : 0.6
            }}
          >
            {/* Drag Handle & Image */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center justify-center cursor-grab text-slate-300 hover:text-slate-500 transition-colors">
                <GripVertical size={18} />
              </div>
              <div className="w-full md:w-64 h-32 rounded-xl overflow-hidden border border-slate-100 shrink-0 relative bg-slate-50">
                <img
                  src={banner.url}
                  alt={`Banner ${idx + 1}`}
                  className="w-full h-full object-cover"
                  style={{ filter: banner.active ? "none" : "grayscale(80%)" }}
                />
                {!banner.active && (
                  <div className="absolute top-2 right-2 bg-slate-800/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1">
                    <EyeOff size={10} /> Hidden
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col flex-1 gap-4 py-1">
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                  <Link size={12} strokeWidth={2.5} /> Redirect Link
                </label>
                <input
                  type="text"
                  placeholder="e.g. /category/summer-sale"
                  value={banner.link}
                  onChange={(e) => updateLink(banner.id, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all placeholder-slate-400"
                />
                <p className="text-[10.5px] text-slate-400 mt-1.5 ml-1">
                  Customers will be redirected here when they click the banner.
                </p>
              </div>

              <div className="flex items-center justify-between mt-auto">
                {/* Visibility Toggle */}
                <button
                  onClick={() => toggleVisibility(banner.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-[1.5px] font-bold text-[12px] transition-all cursor-pointer"
                  style={
                    banner.active
                      ? { background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }
                      : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }
                  }
                >
                  {banner.active ? <Eye size={14} strokeWidth={2.5} /> : <EyeOff size={14} strokeWidth={2.5} />}
                  {banner.active ? "Visible on Store" : "Hidden"}
                </button>

                {/* Delete */}
                <button
                  onClick={() => removeBanner(banner.id)}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer"
                  title="Remove banner"
                >
                  <Trash2 size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
            <p className="text-[14px] font-bold text-slate-700">No banners uploaded</p>
            <p className="text-[12.5px] text-slate-400">Upload an image to start engaging your customers.</p>
          </div>
        )}
      </div>

      {/* ── Save Button ── */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13.5px] font-bold text-white transition-all hover:opacity-90 cursor-pointer shadow-md"
          style={{
            background: saved ? "#16a34a" : "#3b82f6",
            boxShadow: saved ? "0 4px 14px rgba(22,163,74,0.3)" : "0 4px 14px rgba(59,130,246,0.3)"
          }}
        >
          {saved ? <><Check size={15} strokeWidth={3} /> Saved</> : <><Check size={15} strokeWidth={3} /> Save Banners</>}
        </button>
      </div>
    </div>
  );
}
