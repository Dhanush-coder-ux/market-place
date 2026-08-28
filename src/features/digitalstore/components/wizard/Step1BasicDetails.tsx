import { ChangeEvent, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { StoreFormData } from "@/features/digitalstore/type";
import { MapPin, ImagePlus, AlertTriangle, X, Camera, Store, Tag, Building2, Loader2, CheckCircle2 } from "lucide-react";
import LocationMapPicker from "@/components/ui/LocationMapPicker";
import { shopApi } from "@/services/api/shop";

interface Step1Props {
  form: StoreFormData;
  setForm: React.Dispatch<React.SetStateAction<StoreFormData>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const CATEGORIES = [
  "Grocery & Essentials",
  "Fashion & Apparel",
  "Electronics & Gadgets",
  "Restaurant & Cafe",
  "Beauty & Cosmetics",
  "Home & Living",
  "Health & Pharmacy",
  "Books & Stationery",
  "Other",
];

// ─── Reusable sub-components ──────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-100">
      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
        <Icon size={14} className="text-blue-600" strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[13px] font-bold text-slate-800 leading-tight">{title}</p>
        {subtitle && <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
      {children}
      {required && <span className="text-blue-500 ml-0.5 normal-case tracking-normal">*</span>}
    </label>
  );
}

function FieldInput({
  hasError,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  return (
    <input
      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all duration-200 bg-white
        ${hasError
          ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
          : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        } ${className}`}
      {...props}
    />
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1.5 font-medium">
      <AlertTriangle size={11} /> {message}
    </p>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Step1BasicDetails({ form, setForm, errors, setErrors }: Step1Props) {
  const [showGstConfirm, setShowGstConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");

  // Refs for file inputs — programmatic click is reliable regardless of what renders on top
  const logoInputRef   = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Upload feedback state
  const [uploadingLogo,   setUploadingLogo]   = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadingBanner, setUploadingBanner] = useState<"idle" | "uploading" | "done" | "error">("idle");

  const triggerFile = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (!ref.current) return;
    ref.current.value = ""; // reset so same file can be re-selected
    ref.current.click();
  };

  const handleNonGstClick = () => {
    // If already non-GST, no confirmation needed
    if (!form.gstRegistered) return;
    // Open the confirmation modal
    setConfirmInput("");
    setShowGstConfirm(true);
  };

  const handleConfirmSwitch = () => {
    if (confirmInput.trim().toUpperCase() !== "CONFIRM") return;
    setForm(prev => ({ ...prev, gstRegistered: false, gstNumber: "" }));
    setErrors(prev => ({ ...prev, gstNumber: "" }));
    setShowGstConfirm(false);
    setConfirmInput("");
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "name") {
      setErrors((prev) => ({
        ...prev,
        name: value.trim().length >= 3 ? "" : "Store name must be at least 3 characters"
      }));
    }
    if (name === "gstNumber") {
      setErrors((prev) => ({
        ...prev,
        gstNumber: value.trim().length === 15 ? "" : "GSTIN must be exactly 15 characters"
      }));
    }
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    if (type === 'logo') {
      setForm(prev => ({ ...prev, logo: file, logoPreview: previewUrl }));
    } else {
      setForm(prev => ({ ...prev, banner: file, bannerPreview: previewUrl }));
    }

    // 2. Upload to backend immediately if shop already exists
    const existingShopId = localStorage.getItem("shop_id");
    if (existingShopId && existingShopId !== "string") {
      const setStatus = type === 'logo' ? setUploadingLogo : setUploadingBanner;
      setStatus("uploading");
      try {
        await shopApi.uploadShopImage(file, type, existingShopId);
        setStatus("done");
        setTimeout(() => setStatus("idle"), 2500);
      } catch (err) {
        console.error(`Failed to upload ${type}:`, err);
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in slide-in-from-right-4 duration-300">

      {/* ── SECTION 1: Store Identity ───────────────────────────────────────── */}
      <section>
        <SectionHeader icon={Store} title="Store Identity" subtitle="Your store's branding and public-facing info." />

        {/* Logo & Banner uploads */}
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 mb-5">

          {/* ── Logo upload ── */}
          <div>
            <FieldLabel>Store Logo</FieldLabel>
            {/* Hidden file input — triggered programmatically */}
            <input
              ref={logoInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleImageChange(e, 'logo')}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => triggerFile(logoInputRef)}
              onKeyDown={(e) => e.key === 'Enter' && triggerFile(logoInputRef)}
              className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden cursor-pointer group hover:border-blue-400 hover:bg-blue-50/40 transition-all"
            >
              {form.logoPreview ? (
                <>
                  <img src={form.logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Camera size={18} className="text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1 text-slate-400 group-hover:text-blue-500 transition-colors">
                  <ImagePlus size={22} />
                  <span className="text-[10px] font-semibold">Logo</span>
                  <span className="text-[9px] text-slate-400">1:1 ratio</span>
                </div>
              )}
              {/* Upload status badge */}
              {uploadingLogo !== "idle" && (
                <div className={`absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 pointer-events-none
                  ${uploadingLogo === "uploading" ? "bg-blue-600 text-white" : uploadingLogo === "done" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                  {uploadingLogo === "uploading" && <Loader2 size={9} className="animate-spin" />}
                  {uploadingLogo === "done"      && <CheckCircle2 size={9} />}
                  {uploadingLogo === "uploading" ? "Saving" : uploadingLogo === "done" ? "Saved" : "Failed"}
                </div>
              )}
            </div>
          </div>

          {/* ── Banner upload ── */}
          <div>
            <FieldLabel>Store Banner</FieldLabel>
            {/* Hidden file input — triggered programmatically */}
            <input
              ref={bannerInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleImageChange(e, 'banner')}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => triggerFile(bannerInputRef)}
              onKeyDown={(e) => e.key === 'Enter' && triggerFile(bannerInputRef)}
              className="relative w-full h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden cursor-pointer group hover:border-blue-400 hover:bg-blue-50/40 transition-all"
            >
              {form.bannerPreview ? (
                <>
                  <img src={form.bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Camera size={18} className="text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1 text-slate-400 group-hover:text-blue-500 transition-colors">
                  <ImagePlus size={22} />
                  <span className="text-[10px] font-semibold">Upload Banner</span>
                  <span className="text-[9px] text-slate-400">Recommended: 1200 × 400 px</span>
                </div>
              )}
              {/* Upload status badge */}
              {uploadingBanner !== "idle" && (
                <div className={`absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 pointer-events-none
                  ${uploadingBanner === "uploading" ? "bg-blue-600 text-white" : uploadingBanner === "done" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                  {uploadingBanner === "uploading" && <Loader2 size={9} className="animate-spin" />}
                  {uploadingBanner === "done"      && <CheckCircle2 size={9} />}
                  {uploadingBanner === "uploading" ? "Saving" : uploadingBanner === "done" ? "Saved" : "Failed"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Store Name */}
        <div className="mb-4">
          <FieldLabel required>Store Name</FieldLabel>
          <FieldInput
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Grace Premium Market"
            hasError={!!errors.name}
          />
          <FieldError message={errors.name} />
        </div>

        {/* Tagline & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <FieldLabel>Tagline / Slogan</FieldLabel>
            <FieldInput
              type="text"
              name="tagline"
              maxLength={60}
              value={form.tagline}
              onChange={handleChange}
              placeholder="Fresh picks, fair prices..."
            />
          </div>
          <div>
            <FieldLabel required>Store Category</FieldLabel>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm transition-all duration-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white appearance-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <FieldLabel>Store Description</FieldLabel>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            maxLength={200}
            rows={3}
            placeholder="Briefly describe what your store sells and what makes it special..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm transition-all duration-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 resize-none bg-white"
          />
          <p className="text-[10px] text-slate-400 mt-1 text-right">{(form.description || "").length}/200</p>
        </div>
      </section>

      {/* ── SECTION 2: Business Info ────────────────────────────────────────── */}
      <section>
        <SectionHeader icon={Building2} title="Business Information" subtitle="GST registration status for your store." />

        {/* GST Registration */}
        <div className="mb-4">
          <FieldLabel>GST Registration Status</FieldLabel>
          <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-1 gap-1">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, gstRegistered: true }))}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${form.gstRegistered
                ? "bg-white border border-blue-200 text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              ✓ &nbsp;Yes, GST Registered
            </button>
            <button
              type="button"
              onClick={handleNonGstClick}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${!form.gstRegistered
                ? "bg-white border border-blue-200 text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              ✗ &nbsp;No GST Registration
            </button>
          </div>
        </div>

        {/* GST Number Input */}
        {form.gstRegistered && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <FieldLabel required>GSTIN / GST Number</FieldLabel>
            <FieldInput
              type="text"
              name="gstNumber"
              value={form.gstNumber}
              onChange={handleChange}
              maxLength={15}
              placeholder="e.g. 22AAAAA1111A1Z1"
              className="uppercase font-mono tracking-wider"
              hasError={!!errors.gstNumber}
            />
            {errors.gstNumber ? (
              <FieldError message={errors.gstNumber} />
            ) : (
              <p className="text-[10px] text-slate-400 mt-1">Enter your 15-character GSTIN exactly as registered.</p>
            )}
          </div>
        )}
      </section>

      {/* ── SECTION 3: Location ─────────────────────────────────────────────── */}
      <section>
        <SectionHeader icon={MapPin} title="Store Location" subtitle="Pin your store on the map for accurate delivery radius calculation." />

        <div className="mb-3 rounded-xl overflow-hidden border border-slate-200">
          <LocationMapPicker
            lat={form.latitude}
            lng={form.longitude}
            onChange={(coords, address) => {
              setForm(prev => ({
                ...prev,
                latitude: coords.lat,
                longitude: coords.lng,
                address: prev.address || address || prev.address,
              }));
            }}
          />
        </div>

        <div>
          <FieldLabel>Full Address</FieldLabel>
          <div className="relative">
            <FieldInput
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Block 4A, Green Street, Chennai, 600001"
              className="pl-9"
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          </div>
        </div>
      </section>

      {/* ── SECTION 4: Additional Details ───────────────────────────────────── */}
      <section>
        <SectionHeader icon={Tag} title="Additional Details" subtitle="Optional contact links and social handles." />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Contact Phone</FieldLabel>
            <FieldInput
              type="tel"
              name="contactPhone"
              value={form.contactPhone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
            />
          </div>
          <div>
            <FieldLabel>Contact Email</FieldLabel>
            <FieldInput
              type="email"
              name="contactEmail"
              value={form.contactEmail}
              onChange={handleChange}
              placeholder="hello@yourstore.com"
            />
          </div>
          <div>
            <FieldLabel>Website URL</FieldLabel>
            <FieldInput
              type="url"
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="https://yourstore.com"
            />
          </div>
          <div>
            <FieldLabel>Instagram Handle</FieldLabel>
            <div className="relative">
              <FieldInput
                type="text"
                name="instagram"
                value={form.instagram}
                onChange={handleChange}
                placeholder="@yourstore"
                className="pl-7"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">@</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── GST Switch Confirmation Modal ───────────────────────────────────── */}
      {showGstConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => { setShowGstConfirm(false); setConfirmInput(""); }}
          />
          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-in zoom-in-95 fade-in duration-200">
            {/* Close */}
            <button
              type="button"
              onClick={() => { setShowGstConfirm(false); setConfirmInput(""); }}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X size={14} />
            </button>

            {/* Icon + Title */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mb-3">
                <AlertTriangle size={26} className="text-amber-500" />
              </div>
              <h3 className="text-[16px] font-black text-slate-900 mb-1">Switch to Non-GST?</h3>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                Switching to <span className="font-bold text-slate-700">No GST Registration</span> will clear your saved GSTIN and affect tax calculations across your store.
              </p>
            </div>

            {/* Warning banner */}
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
              <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
                This action cannot be undone without re-entering your GSTIN. Make sure you intend to switch before confirming.
              </p>
            </div>

            {/* Confirm input */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                Type <span className="font-black text-slate-900 tracking-widest">CONFIRM</span> to proceed
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={e => setConfirmInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirmSwitch()}
                placeholder="Type CONFIRM"
                autoFocus
                className="w-full px-4 py-2.5 rounded-lg border-2 outline-none text-sm font-bold tracking-widest transition-all duration-150 border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-300 uppercase"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => { setShowGstConfirm(false); setConfirmInput(""); }}
                className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSwitch}
                disabled={confirmInput.trim().toUpperCase() !== "CONFIRM"}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-[13px] font-black hover:bg-amber-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                Switch to Non-GST
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
