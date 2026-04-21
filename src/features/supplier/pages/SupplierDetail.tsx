import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Phone, Globe, MapPin, Mail, ShoppingBag, CreditCard,
  History, Info, Package, CheckCircle2, Search, Edit2, X,
} from "lucide-react";
import { StatsCard } from "@/components/common/StatsCard";
import { useApi } from "@/context/ApiContext";
import { useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { ENDPOINTS } from "@/services/endpoints";
import Loader from "@/components/common/Loader";
import type { SupplierRecord } from "@/types/api";

// ── Quick-search bar ────────────────────────────────────────────────────────
const SupplierSearch = () => {
  const navigate = useNavigate();
  const { getData } = useApi();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SupplierRecord[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      getData(ENDPOINTS.SUPPLIERS, { limit: "8", offset: "1", q: query }).then((res) => {
        if (res) setResults(Array.isArray(res.data) ? res.data : [res.data]);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-white shadow-sm">
        <Search size={14} className="text-gray-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          placeholder="Search supplier by name / ID…"
          className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400 min-w-0"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); }} className="text-gray-400 hover:text-gray-600">
            <X size={13} />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {results.map((s) => (
            <button
              key={s.id}
              onClick={() => { navigate(`/supplier/${s.id}`); setQuery(""); setOpen(false); }}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b last:border-0 border-gray-100 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900 truncate">
                {String(s.datas?.name ?? s.datas?.vendor_name ?? "—")}
              </p>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5 truncate">{s.id}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Sidebar item ────────────────────────────────────────────────────────────
const SidebarItem = ({
  icon: Icon, label, value, isMono = false,
}: { icon: any; label: string; value: string; isMono?: boolean }) => (
  <div className="flex gap-4 items-start group">
    <div className="p-2 bg-gray-50/80 rounded-xl text-gray-400 shrink-0 mt-0.5 transition-colors group-hover:bg-blue-50 group-hover:text-blue-500">
      <Icon size={16} strokeWidth={1.5} />
    </div>
    <div className="min-w-0 space-y-0.5">
      <p className="text-[13px] font-medium text-gray-500">{label}</p>
      <p className={`text-sm font-medium text-gray-900 break-words ${isMono ? "font-mono text-[13px] tracking-tight" : ""}`}>
        {value}
      </p>
    </div>
  </div>
);

// ── Main page ───────────────────────────────────────────────────────────────
const SupplierDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getData } = useApi();
  const { fields, fetchSupplierFields } = useInputBuilderContext();

  const [supplier, setSupplier] = useState<SupplierRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("General Info");
  const tabs = ["General Info"];

  useEffect(() => { fetchSupplierFields(); }, []);

  useEffect(() => {
    if (!id) return;
    setRecordLoading(true);
    getData(`${ENDPOINTS.SUPPLIERS}/by/${id}`).then((res) => {
      if (res) setSupplier(Array.isArray(res.data) ? res.data[0] : res.data);
      setRecordLoading(false);
    });
  }, [id]);

  if (recordLoading) {
    return <div className="p-12 flex justify-center"><Loader /></div>;
  }

  if (!supplier) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-gray-500">Supplier not found.</p>
        <SupplierSearch />
      </div>
    );
  }

  const datas = supplier.datas ?? {};
  const name = String(datas.name ?? datas.vendor_name ?? datas.supplier_name ?? "Unknown Supplier");
  const phone = String(datas.phone ?? datas.mobile ?? datas.contact_number ?? "—");
  const email = String(datas.email ?? datas.email_address ?? "—");
  const gstin = String(datas.gst ?? datas.gstin ?? datas.gst_number ?? "—");
  const address = String(datas.address ?? datas.location ?? datas.billing_address ?? "—");

  // Build labeled field list from InputBuilder (visible fields only)
  const infoFields = fields
    ? Object.entries(fields)
        .filter(([, def]) => def.view_mode === "SHOW")
        .map(([key, def]) => ({ label: def.label_name, value: String(datas[key] ?? "—") }))
    : Object.entries(datas).map(([k, v]) => ({ label: k, value: String(v ?? "—") }));

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 md:pt-10 font-sans selection:bg-blue-100">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2.5 flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50/50 border border-blue-100/50 text-blue-600">
              <CheckCircle2 size={13} strokeWidth={2} />
              <span className="text-[11px] font-medium tracking-wide uppercase">Verified Supplier</span>
            </div>
            <h1 className="heading-page text-gray-900 tracking-tight truncate">{name}</h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <SupplierSearch />
            <button
              onClick={() => navigate(`/supplier/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm whitespace-nowrap"
            >
              <Edit2 size={14} /> Edit
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatsCard iconBg="bg-blue-50" iconColor="text-blue-600" label="Total Items Bought" value="—" icon={Package} />
          <StatsCard iconBg="bg-red-50" iconColor="text-red-600" label="Pending Amount" value="—" icon={CreditCard} />
          <StatsCard iconBg="bg-green-50" iconColor="text-green-600" label="Total Purchases" value="—" icon={ShoppingBag} />
          <StatsCard iconBg="bg-yellow-50" iconColor="text-yellow-600" label="Last Order" value="—" icon={History} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="heading-label text-gray-900 pb-4 border-b border-gray-100">Identity & Contact</h3>
              <div className="space-y-5">
                <SidebarItem icon={Phone} label="Phone" value={phone} />
                <SidebarItem icon={Mail} label="Email" value={email} />
                <SidebarItem icon={Globe} label="GSTIN" value={gstin} isMono />
                <SidebarItem icon={MapPin} label="Address" value={address} />
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="border-b border-gray-200/80">
              <nav className="flex gap-6">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 relative -mb-px ${
                      activeTab === tab
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
              {activeTab === "General Info" && (
                <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2.5 pb-4 border-b border-gray-50">
                    <Info size={18} className="text-blue-500" strokeWidth={2} />
                    <h2 className="heading-section text-gray-900">Business Profile</h2>
                  </div>
                  {infoFields.length === 0 ? (
                    <p className="text-sm text-gray-500">No profile data available.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {infoFields.map((f) => (
                        <div key={f.label}>
                          <p className="text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">{f.label}</p>
                          <div className="bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-100/60 text-sm text-gray-700 hover:border-gray-200 transition-colors">
                            {f.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetail;
