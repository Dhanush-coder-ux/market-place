import React, { useState } from "react";
import { Link } from "react-router-dom";
import Title from "../../../components/common/Title";
import {
  Store,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  UserCheck2,
  Hash,
  Building2,
  Tag,
  Instagram,
  Facebook,
  Clock,
  BadgeCheck,
} from "lucide-react";
import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import ImageUpload from "@/components/common/ImageUpload";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { Required } from "@/components/ui/Require";

// ─── Options ────────────────────────────────────────────────────────────────

const categoryOptions = [
  { label: "Electronics", value: "electronics" },
  { label: "Clothing & Apparel", value: "clothing" },
  { label: "Groceries & Food", value: "groceries" },
  { label: "Home & Furniture", value: "home" },
  { label: "Books & Stationery", value: "books" },
  { label: "Health & Beauty", value: "health" },
  { label: "Sports & Outdoors", value: "sports" },
  { label: "Other", value: "other" },
];

const businessTypeOptions = [
  { label: "Sole Proprietor", value: "sole" },
  { label: "Partnership", value: "partnership" },
  { label: "Private Limited (Pvt. Ltd.)", value: "pvt_ltd" },
  { label: "LLP", value: "llp" },
  { label: "NGO / Trust", value: "ngo" },
];

const currencyOptions = [
  { label: "INR — Indian Rupee (₹)", value: "INR" },
  { label: "USD — US Dollar ($)", value: "USD" },
  { label: "EUR — Euro (€)", value: "EUR" },
  { label: "GBP — British Pound (£)", value: "GBP" },
];

// ─── Section Header ──────────────────────────────────────────────────────────

type SectionHeaderProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;   // e.g. "bg-blue-50 text-blue-600"
};

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, subtitle, color }) => (
  <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-8">
    <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
    <div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  </div>
);

// ─── Field Label ─────────────────────────────────────────────────────────────

type FieldLabelProps = { children: React.ReactNode; required?: boolean };

const FieldLabel: React.FC<FieldLabelProps> = ({ children, required }) => (
  <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1 mb-1.5">
    {children}
    {required && <Required />}
  </label>
);

// ─── ProfileForm (Shop Creation) ─────────────────────────────────────────────

const ProfileForm: React.FC = () => {
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);

  // Section 1 — Shop Identity
  const [shopName, setShopName] = useState("");
  const [shopCode, setShopCode] = useState("");
  const [category, setCategory] = useState("");
  const [tagline, setTagline] = useState("");

  // Section 2 — Contact & Location
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  // Section 3 — Online Presence
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");

  // Section 4 — Business Details
  const [businessType, setBusinessType] = useState("");
  const [gst, setGst] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("21:00");
  const [description, setDescription] = useState("");

  // Validation
  const [errors, setErrors] = useState({ shopName: false, email: false, category: false });

  const validate = () => {
    const e = {
      shopName: !shopName.trim(),
      email: !email.trim(),
      category: !category,
    };
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleSubmit = (action: "save" | "add_more") => {
    if (!validate()) return;
    console.log("Submit:", action, { shopName, email, category });
  };

  return (
    <div className="pb-10">



      <div className="max-w-7xl mx-auto p-6 space-y-12 bg-white">

        {/* ── SECTION 1: SHOP IDENTITY ── */}
        <section>
          <SectionHeader
            icon={<Store size={22} />}
            title="Shop Identity"
            subtitle="Your brand name, code, and visual assets."
            color="bg-blue-50 text-blue-600"
          />

          {/* Logo + Banner upload row */}
          <div className="flex flex-wrap items-start gap-8 mb-8">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Shop Logo</span>
              <ImageUpload label="Logo" value={logo} onChange={setLogo} />
            </div>
          
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            <div className="space-y-1.5">
              <FieldLabel required>Shop Name</FieldLabel>
              <Input
                placeholder="e.g. Sunrise Mart"
                value={shopName}
                onChange={(e) => { setShopName(e.target.value); if (e.target.value) setErrors(p => ({ ...p, shopName: false })); }}
                leftIcon={<Store size={18} className="text-slate-400" />}
                className={errors.shopName ? "border-red-500" : "bg-slate-50/50"}
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Shop Code / ID</FieldLabel>
              <Input
                placeholder="e.g. SHOP-001"
                value={shopCode}
                onChange={(e) => setShopCode(e.target.value)}
                leftIcon={<Hash size={18} className="text-slate-400" />}
                className="bg-slate-50/50"
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel required>Category</FieldLabel>
              <ReusableSelect
                options={categoryOptions}
                value={category}
                onValueChange={(val) => { setCategory(val); if (val) setErrors(p => ({ ...p, category: false })); }}
                placeholder="Select a category"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
              <FieldLabel>Tagline</FieldLabel>
              <Input
                placeholder="e.g. Fresh deals, every day!"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                leftIcon={<Tag size={18} className="text-slate-400" />}
                className="bg-slate-50/50"
              />
            </div>

          </div>
        </section>

        {/* ── SECTION 2: CONTACT & LOCATION ── */}
        <section>
          <SectionHeader
            icon={<MapPin size={22} />}
            title="Contact & Location"
            subtitle="Customer-facing contact details and your physical address."
            color="bg-emerald-50 text-emerald-600"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            <div className="space-y-1.5">
              <FieldLabel required>Email Address</FieldLabel>
              <Input
                type="email"
                placeholder="shop@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (e.target.value) setErrors(p => ({ ...p, email: false })); }}
                leftIcon={<Mail size={18} className="text-slate-400" />}
                className={errors.email ? "border-red-500" : "bg-slate-50/50"}
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Phone Number</FieldLabel>
              <Input
                placeholder="+91 98765 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone size={18} className="text-slate-400" />}
                className="bg-slate-50/50"
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel>City</FieldLabel>
              <Input
                placeholder="e.g. Chennai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                leftIcon={<Building2 size={18} className="text-slate-400" />}
                className="bg-slate-50/50"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <FieldLabel>Street Address</FieldLabel>
              <Input
                placeholder="House No, Street, Area"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                leftIcon={<MapPin size={18} className="text-slate-400" />}
                className="bg-slate-50/50"
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel>PIN Code</FieldLabel>
              <Input
                placeholder="600001"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                leftIcon={<Hash size={18} className="text-slate-400" />}
                className="bg-slate-50/50"
              />
            </div>

          </div>
        </section>

        {/* ── SECTION 3: ONLINE PRESENCE ── */}
        <section>
          <SectionHeader
            icon={<Globe size={22} />}
            title="Online Presence"
            subtitle="Website and social media links for your shop."
            color="bg-purple-50 text-purple-600"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            <div className="space-y-1.5">
              <FieldLabel>Website</FieldLabel>
              <Input
                placeholder="https://yourshop.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                leftIcon={<Globe size={18} className="text-slate-400" />}
                className="bg-slate-50/50"
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Instagram Handle</FieldLabel>
              <Input
                placeholder="@yourshop"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                leftIcon={<Instagram size={18} className="text-slate-400" />}
                className="bg-slate-50/50"
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Facebook Page</FieldLabel>
              <Input
                placeholder="facebook.com/yourshop"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                leftIcon={<Facebook size={18} className="text-slate-400" />}
                className="bg-slate-50/50"
              />
            </div>

          </div>
        </section>

        {/* ── SECTION 4: BUSINESS DETAILS ── */}
        <section>
          <SectionHeader
            icon={<BadgeCheck size={22} />}
            title="Business Details"
            subtitle="Legal, financial, and operational configuration."
            color="bg-amber-50 text-amber-600"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            <div className="space-y-1.5">
              <FieldLabel>Business Type</FieldLabel>
              <ReusableSelect
                options={businessTypeOptions}
                value={businessType}
                onValueChange={setBusinessType}
                placeholder="Select type"
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel>GST Number</FieldLabel>
              <Input
                placeholder="22AAAAA0000A1Z5"
                value={gst}
                onChange={(e) => setGst(e.target.value)}
                leftIcon={<FileText size={18} className="text-slate-400" />}
                className="bg-slate-50/50"
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Currency</FieldLabel>
              <ReusableSelect
                options={currencyOptions}
                value={currency}
                onValueChange={setCurrency}
                placeholder="Select currency"
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Opening Time</FieldLabel>
              <Input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                leftIcon={<Clock size={18} className="text-slate-400" />}
                className="bg-slate-50/50"
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Closing Time</FieldLabel>
              <Input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                leftIcon={<Clock size={18} className="text-slate-400" />}
                className="bg-slate-50/50"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
              <FieldLabel>Shop Description</FieldLabel>
              <textarea
                rows={4}
                placeholder="Tell customers what makes your shop special..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-slate-900 
                           placeholder:text-slate-400 bg-slate-50/50 resize-none
                           transition-all duration-200
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

          </div>
        </section>

        {/* ── ACTION BAR ── */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-slate-100">
          <button
            type="button"
            onClick={() => console.log("Discard")}
            className="text-sm font-semibold text-slate-400 hover:text-red-500 transition-colors px-4 py-2"
          >
            Discard Changes
          </button>
          <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
            <GradientButton
              type="button"
              variant="outline"
              onClick={() => handleSubmit("add_more")}
              className="border-slate-200"
            >
              Save &amp; Add Another
            </GradientButton>
            <GradientButton
              type="button"
              onClick={() => handleSubmit("save")}
              className="min-w-[150px] shadow-lg shadow-blue-100"
            >
              Create Shop
            </GradientButton>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileForm;