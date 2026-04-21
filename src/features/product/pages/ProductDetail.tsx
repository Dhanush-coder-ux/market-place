import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Package, Edit3, Download, Upload, DollarSign,
  Tag, BarChart2, ShoppingCart, Target, ArrowRightLeft,
  Search, X,
} from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { ENDPOINTS } from "@/services/endpoints";
import Loader from "@/components/common/Loader";
import type { ProductRecord } from "@/types/api";

// ── Search bar ──────────────────────────────────────────────────────────────
const ProductSearch = () => {
  const navigate = useNavigate();
  const { getData } = useApi();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductRecord[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      getData(ENDPOINTS.PRODUCTS, { limit: "8", offset: "1", q: query }).then((res) => {
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
      <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl bg-white shadow-sm">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          placeholder="Search product by name / ID…"
          className="flex-1 text-sm outline-none bg-transparent text-slate-700 placeholder-slate-400 min-w-0"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); }} className="text-slate-400 hover:text-slate-600">
            <X size={13} />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => { navigate(`/product/${p.id}`); setQuery(""); setOpen(false); }}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b last:border-0 border-slate-100 transition-colors"
            >
              <p className="text-sm font-medium text-slate-800 truncate">
                {String(p.datas?.name ?? p.barcode ?? "—")}
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{p.barcode}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main page ───────────────────────────────────────────────────────────────
const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getData } = useApi();
  const { fields, fetchProductFields } = useInputBuilderContext();

  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("General Info");
  const tabs = ["General Info"];

  useEffect(() => { fetchProductFields(); }, []);

  useEffect(() => {
    if (!id) return;
    setRecordLoading(true);
    getData(`${ENDPOINTS.PRODUCTS}/by/${id}`).then((res) => {
      if (res) setProduct(Array.isArray(res.data) ? res.data[0] : res.data);
      setRecordLoading(false);
    });
  }, [id]);

  if (recordLoading) {
    return <div className="p-12 flex justify-center"><Loader /></div>;
  }

  if (!product) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-slate-500">Product not found.</p>
        <ProductSearch />
      </div>
    );
  }

  const datas = product.datas ?? {};
  const name = String(datas.name ?? datas.product_name ?? product.barcode ?? "Unknown Product");
  const sku = String(datas.sku ?? datas.code ?? product.barcode ?? "—");
  const category = String(datas.category ?? "—");
  const description = String(datas.description ?? "No description available.");
  const sellingPrice = datas.selling_price ?? datas.sell_price ?? datas.price ?? "—";
  const buyingPrice = datas.buying_price ?? datas.buy_price ?? datas.cost ?? "—";
  const currentStock = datas.stock ?? datas.current_stock ?? datas.quantity ?? "—";
  const unit = String(datas.unit ?? "—");

  // Build labeled general info fields
  const infoFields = fields
    ? Object.entries(fields)
        .filter(([, def]) => def.view_mode === "SHOW")
        .map(([key, def]) => ({ label: def.label_name, value: String(datas[key] ?? "—") }))
    : Object.entries(datas).map(([k, v]) => ({ label: k, value: String(v ?? "—") }));

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <div className="space-y-4">

        {/* Product Header Card */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col md:flex-row gap-5 shadow-sm">
          <div className="w-24 h-24 shrink-0 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Package size={36} className="text-slate-400" strokeWidth={1.5} />
          </div>

          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="heading-page text-slate-700">{name}</h1>
                  <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-medium tracking-wider uppercase">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">SKU: {sku}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ProductSearch />
                <button
                  onClick={() => navigate(`/product/${id}/edit`)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg font-medium text-xs transition-all"
                >
                  <Edit3 size={14} strokeWidth={1.5} /> Edit
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-4 max-w-2xl">{description}</p>

            <div className="flex flex-wrap gap-6 pt-1 border-t border-slate-50 mt-3">
              <div className="flex flex-col mt-2">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Category</span>
                <span className="text-sm font-semibold text-slate-600">{category}</span>
              </div>
              <div className="flex flex-col mt-2">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Unit</span>
                <span className="text-sm font-semibold text-slate-600">{unit}</span>
              </div>
              <div className="flex flex-col mt-2">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Selling Price</span>
                <span className="text-sm font-semibold text-slate-600">₹{sellingPrice}</span>
              </div>
              <div className="flex flex-col mt-2">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Barcode</span>
                <span className="text-sm font-semibold text-slate-600 font-mono">{product.barcode ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Current Stock", value: String(currentStock), icon: Package, bg: "bg-blue-50", color: "text-blue-500" },
            { label: "Buying Price", value: `₹${buyingPrice}`, icon: Download, bg: "bg-emerald-50", color: "text-emerald-500" },
            { label: "Selling Price", value: `₹${sellingPrice}`, icon: Upload, bg: "bg-rose-50", color: "text-rose-500" },
            { label: "Stock Value", value: currentStock !== "—" && buyingPrice !== "—" ? `₹${(Number(currentStock) * Number(buyingPrice)).toFixed(0)}` : "—", icon: DollarSign, bg: "bg-indigo-50", color: "text-indigo-500" },
          ].map(({ label, value, icon: Icon, bg, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center ${color} shrink-0`}>
                <Icon size={18} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-lg font-bold text-slate-700">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100 bg-slate-50/30 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-5 text-xs font-medium text-center transition-colors whitespace-nowrap border-b-2 -mb-[1px] ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="min-h-[250px]">
            {activeTab === "General Info" && (
              <div className="p-5 animate-in fade-in duration-300">
                <h2 className="heading-section text-slate-700 mb-4">Product Information</h2>
                {infoFields.length === 0 ? (
                  <p className="text-sm text-slate-500">No product data available.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {infoFields.map((f) => (
                      <div key={f.label}>
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">{f.label}</p>
                        <p className="text-sm font-medium text-slate-700">{f.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="sticky -bottom-4 md:-bottom-6 lg:-bottom-8 -mx-4 md:-mx-6 lg:-mx-8 -mb-4 md:-mb-6 lg:-mb-8 mt-auto bg-white border-t-2 border-slate-200 px-8 py-4 flex justify-between items-center shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-[100]">
          <div className="text-xs font-medium text-slate-500 hidden md:block px-2">Quick actions</div>
          <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-xs transition-all shadow-sm">
              <Tag size={14} strokeWidth={1.5} /> Label
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-xs transition-all shadow-sm">
              <BarChart2 size={14} strokeWidth={1.5} /> Report
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-xs transition-all shadow-sm">
              <ArrowRightLeft size={14} strokeWidth={1.5} /> Adjust
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-xs transition-all shadow-sm">
              <Target size={14} strokeWidth={1.5} /> PO
            </button>
            <button className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-xs transition-all shadow-sm active:scale-95">
              <ShoppingCart size={14} strokeWidth={1.5} /> Sale
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;
