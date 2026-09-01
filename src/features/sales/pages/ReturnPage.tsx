import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft, Package, AlertCircle, CheckCircle2,
  ChevronRight, Minus, Plus, ArrowRight, RefreshCw, Banknote,
  Check, Loader2, Search, X
} from "lucide-react";
import { SHOP_ID, ENDPOINTS } from "@/services/endpoints";
import { useApi } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { inventoryApi } from "@/services/api/inventory";
import {
  useReturnModalLogic, SaleRecord, ReturnStep, ReturnReason
} from "../components/ReturnOrderFlow";
import ProductSelectionModal from "../../billing/components/ProductSelectionModel";
import { InventoryItem, ProductVariant } from "../../billing/types";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const STEP_LABELS: Record<ReturnStep, string> = { 1: "Mode", 2: "Items", 3: "Reason", 4: "Review", 5: "Done" };
const RETURN_REASONS = ["Damaged", "Wrong Item", "Customer Request", "Size Issue", "Other"];
const ITEM_COLORS = ["#dbeafe", "#dcfce7", "#fef3c7", "#fce7f3", "#ede9fe", "#ffedd5", "#f0fdf4", "#ecfeff"];

/* ── QuantityStepper ── */
const QuantityStepper: React.FC<{ value: number; min?: number; max: number; onChange: (v: number) => void }> = ({ value, min = 1, max, onChange }) => (
  <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
    <button className="w-7 h-7 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-30" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}><Minus size={9} /></button>
    <input type="number" value={value} min={min} max={max} onChange={e => { const v = Number(e.target.value); if (!isNaN(v)) onChange(Math.min(Math.max(min, v), max)); }} className="w-10 h-7 text-center text-[11px] font-semibold text-slate-800 border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
    <button className="w-7 h-7 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-30" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}><Plus size={9} /></button>
  </div>
);

/* ── SelectDropdown ── */
const SelectDropdown = ({ value, options, onChange, displayMap }: { value: string; options: string[]; onChange: (v: string) => void; displayMap?: Record<string, string> }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative w-full sm:w-[180px]" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} className="w-full h-10 px-3 text-[12px] border-2 border-slate-100 rounded-lg bg-white text-slate-800 font-semibold flex items-center justify-between outline-none focus:border-blue-500">
        <span className="truncate">{displayMap?.[value] || value}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {options.map(opt => (
            <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-3 py-2.5 text-[12px] font-semibold hover:bg-slate-50 ${value === opt ? 'bg-blue-50 text-blue-600' : 'text-slate-700'}`}>
              {displayMap?.[opt] || opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   RETURN PAGE — Route wrapper: /sales/return/:id
══════════════════════════════════════════════════════════════ */
const ReturnPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getData } = useApi();
  const { showToast } = useToast();

  const [sale, setSale] = useState<SaleRecord | null>(location.state?.sale || null);
  const [productMap] = useState<Record<string, string>>(location.state?.productMap || {});
  const [loading, setLoading] = useState(!sale);

  useEffect(() => {
    if (sale || !id) return;
    setLoading(true);
    getData(`${ENDPOINTS.ORDERS}/${SHOP_ID}/${id}`)
      .then(res => setSale(res?.data || res))
      .catch(() => showToast("Failed to load order", "error"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen">
      <Loader2 size={32} className="text-blue-500 animate-spin" />
    </div>
  );

  if (!sale) return (
    <div className="flex flex-col items-center justify-center h-full min-h-screen gap-4">
      <AlertCircle size={32} className="text-slate-400" />
      <p className="text-slate-500 font-semibold">Order not found</p>
      <button onClick={() => navigate(-1)} className="text-blue-600 text-sm font-semibold hover:underline">Go Back</button>
    </div>
  );

  return <ReturnPageContent sale={sale} productMap={productMap} onDone={() => navigate(`/sales/${sale.id}`)} />;
};

/* ── Inner content component ── */
const ReturnPageContent: React.FC<{ sale: SaleRecord; productMap: Record<string, string>; onDone: () => void }> = ({ sale, productMap, onDone }) => {
  const navigate = useNavigate();
  const m = useReturnModalLogic(sale, productMap);
  const { state, saleItems, selectedItems, totals, customerOutstanding } = m;

  const [exchSearch, setExchSearch] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<InventoryItem | null>(null);
  const [allExchProducts, setAllExchProducts] = useState<any[]>([]);
  const [exchProducts, setExchProducts] = useState<any[]>([]);
  const [loadingExch, setLoadingExch] = useState(false);

  // Load exchange catalog when entering exchange step 2
  useEffect(() => {
    if (state.step === 2 && state.mode === "exchange") {
      setLoadingExch(true);
      inventoryApi.searchInventories("", true)
        .then(res => {
          const mapped = res.map((p: any) => {
            let computedStock = Number(p.stock_infos?.available_stocks ?? p.stock_infos?.physical_stocks ?? p.stocks ?? 0);
            let computedPrice = p.pricing_infos?.sell_price ?? p.sell_price ?? 0;
            const rawVariants = Array.isArray(p.variants) ? p.variants : (typeof p.variants === "object" && p.variants !== null ? Object.values(p.variants) : (Array.isArray(p.variant_infos) ? p.variant_infos : []));
            const batches = p.batch_infos || p.batches;
            const hasVariants = !!(p.type_infos?.has_variant) || rawVariants.length > 0;
            const hasBatches = !!(p.type_infos?.has_batch) || (batches && batches.length > 0);
            const hasSerials = !!(p.type_infos?.has_serialno);
            if (hasVariants) {
              if (computedStock === 0) {
                computedStock = rawVariants.reduce((acc: number, v: any) => {
                  let vStock = v.stock_infos?.available_stocks !== undefined ? v.stock_infos?.available_stocks : (v.stocks !== undefined ? v.stocks : (v.stock !== undefined ? v.stock : undefined));
                  if (vStock === undefined && Array.isArray(v.batch_infos) && v.batch_infos.length > 0) {
                    vStock = v.batch_infos.reduce((sum: number, b: any) => sum + Number(b.stock_infos?.available_stocks ?? b.stocks ?? b.stock_infos?.physical_stocks ?? 0), 0);
                  }
                  return acc + Number(vStock ?? 0);
                }, 0);
              }
              if ((computedPrice === 0 || computedPrice === undefined) && rawVariants.length > 0) {
                const firstV = rawVariants[0];
                let vPrice = firstV.pricing_infos?.sell_price ?? firstV.sell_price ?? firstV.price;
                if (!vPrice && Array.isArray(firstV.batch_infos) && firstV.batch_infos.length > 0) vPrice = firstV.batch_infos[0].pricing_infos?.sell_price ?? firstV.batch_infos[0].sell_price;
                computedPrice = Number(vPrice ?? 0);
              }
            } else if (hasBatches && Array.isArray(batches)) {
              if (computedStock === 0) computedStock = batches.reduce((acc: number, b: any) => acc + Number(b.stock_infos?.available_stocks ?? b.stock_infos?.physical_stocks ?? b.stocks ?? 0), 0);
              if ((computedPrice === 0 || computedPrice === undefined) && batches.length > 0) computedPrice = batches[0].pricing_infos?.sell_price ?? batches[0].sell_price ?? 0;
            }
            return { ...p, name: p.name || "Unknown Product", price: computedPrice, stocks: computedStock, hasVariants, hasBatches, hasSerials, variantCount: rawVariants.length };
          });
          setAllExchProducts(mapped);
          setExchProducts(mapped);
          setLoadingExch(false);
        })
        .catch(() => setLoadingExch(false));
    }
  }, [state.step, state.mode]);

  // Client-side filter
  useEffect(() => {
    if (!exchSearch.trim()) { setExchProducts(allExchProducts); return; }
    const q = exchSearch.toLowerCase();
    setExchProducts(allExchProducts.filter(p =>
      (p.name || '').toLowerCase().includes(q) || (p.barcode || '').toLowerCase().includes(q)
    ));
  }, [exchSearch, allExchProducts]);

  // Removed activeReplaceId sync

  const mapToInventoryItem = (fullProduct: any): InventoryItem => {
    let rawVariants: any[] = [];
    let variantsSource = fullProduct.variant_infos || fullProduct.variants || fullProduct.varients || fullProduct.combinations;
    if (variantsSource && typeof variantsSource === 'object' && !Array.isArray(variantsSource)) {
      variantsSource = Object.values(variantsSource);
    }
    if (Array.isArray(variantsSource)) {
      rawVariants = variantsSource;
    }

    const getSerialNames = (infos: any): string[] => {
      if (!infos) return [];
      if (Array.isArray(infos)) {
        return infos.map((s: any) => typeof s === 'object' && s !== null ? s.name || s.serial || "" : String(s)).filter(Boolean);
      }
      return [];
    };

    let mappedVariants = rawVariants.map((v: any) => {
      const combDatas = v.datas || {};
      const attributes = v.attributes || combDatas.attributes || combDatas.datas?.attributes || {};
      let variantLabel = v.name || combDatas.name;
      if (variantLabel) {
        // Keep defined name
      } else if (attributes && Object.keys(attributes).length > 0) {
        variantLabel = Object.values(attributes).join(' / ');
      } else if (v.barcode && combDatas.barcode && v.barcode !== combDatas.barcode) {
        variantLabel = v.barcode;
      }
      if (!variantLabel) variantLabel = "Standard Variant";

      let calculatedPrice = v.pricing_infos?.sell_price || v.sell_price || v.price || combDatas.sell_price || combDatas.price;
      if (!calculatedPrice && Array.isArray(v.batch_infos) && v.batch_infos.length > 0) {
        const firstBatch = v.batch_infos[0];
        calculatedPrice = firstBatch.pricing_infos?.sell_price || firstBatch.sell_price;
      }
      if (!calculatedPrice) calculatedPrice = fullProduct.pricing_infos?.sell_price || fullProduct.sell_price || 0;

      let calculatedStock = v.stock_infos?.available_stocks !== undefined ? v.stock_infos?.available_stocks : (v.stocks !== undefined ? v.stocks : (v.stock !== undefined ? v.stock : (combDatas.stocks !== undefined ? combDatas.stocks : undefined)));
      if (calculatedStock === undefined && Array.isArray(v.batch_infos) && v.batch_infos.length > 0) {
        calculatedStock = v.batch_infos.reduce((sum: number, b: any) => sum + (b.stock_infos?.available_stocks || b.stocks || b.stock_infos?.physical_stocks || 0), 0);
      }
      if (calculatedStock === undefined) calculatedStock = 0;

      return {
        ...v,
        id: v.id || String(Math.random()),
        name: variantLabel,
        price: calculatedPrice,
        stock: calculatedStock,
        serialnoId: v.serial_numbers?.id || v.serialno_infos?.[0]?.id || v.serial_number?.id || v.batches?.[0]?.serial_numbers?.id || combDatas.serial_numbers?.id || fullProduct.serialno_infos?.[0]?.id || fullProduct.serial_number?.id || fullProduct.serials?.id,
        availableSerials: getSerialNames(v.serialno_infos || v.serial_numbers || v.serial_number || v.batches?.[0]?.serial_numbers || combDatas.serial_numbers || fullProduct.serialno_infos || fullProduct.serial_number || fullProduct.serials),
        batchId: v.batch_infos?.[0]?.id || v.batches?.[0]?.id || v.batchId || combDatas.batches?.[0]?.id,
        batches: (v.batch_infos || v.batches || []).map((b: any) => ({
          ...b,
          batchId: b.id,
          price: b.pricing_infos?.sell_price || b.sell_price || calculatedPrice,
          stock: b.stock_infos?.available_stocks !== undefined ? b.stock_infos?.available_stocks : (b.stocks !== undefined ? b.stocks : (b.stock !== undefined ? b.stock : 0)),
        })),
      };
    });

    if (mappedVariants.length === 0 && (fullProduct.type_infos?.has_batch || fullProduct.has_batch) && (Array.isArray(fullProduct.batches) && fullProduct.batches.length > 0 || Array.isArray(fullProduct.batch_infos) && fullProduct.batch_infos.length > 0)) {
      const sourceBatches = Array.isArray(fullProduct.batch_infos) && fullProduct.batch_infos.length > 0 ? fullProduct.batch_infos : fullProduct.batches;
      mappedVariants = sourceBatches.map((b: any) => ({
        id: b.id,
        isBatchOnly: true,
        name: b.batch_name || b.name || b.batch || (b.batch_no ? `Batch: ${b.batch_no}` : `Batch: ${b.id.slice(0, 8)}`),
        price: b.pricing_infos?.sell_price || b.sell_price || fullProduct.pricing_infos?.sell_price || fullProduct.sell_price || 0,
        stock: b.stock_infos?.available_stocks || b.stocks || 0,
        serialnoId: b.serial_numbers?.id || b.serialno_infos?.[0]?.id || fullProduct.serialno_infos?.[0]?.id || fullProduct.serial_number?.id || fullProduct.serials?.id,
        availableSerials: getSerialNames(b.serialno_infos || b.serial_numbers || fullProduct.serialno_infos || fullProduct.serial_number || fullProduct.serials),
        batchId: b.id,
        expiryDate: b.expiry_date,
        manufacturingDate: b.manufacturing_date,
      }));
    }

    let computedStock = Number(fullProduct.stock_infos?.available_stocks ?? fullProduct.stock_infos?.physical_stocks ?? fullProduct.stocks ?? 0);
    let computedPrice = fullProduct.pricing_infos?.sell_price ?? fullProduct.sell_price ?? 0;

    return {
      ...fullProduct,
      product_name: fullProduct.name || "Unknown Product",
      product_barcode: fullProduct.barcode || "N/A",
      category: fullProduct.category || "Other",
      variants: mappedVariants,
      requireSerial: fullProduct.has_serialno || false,
      batchTracking: fullProduct.has_batch || false,
      manufacturingDate: fullProduct.batches?.[0]?.manufacturing_date,
      expiryDate: fullProduct.batches?.[0]?.expiry_date,
      price: computedPrice,
      stocks: computedStock,
      serialnoId: fullProduct.serial_number?.id || fullProduct.serials?.id || fullProduct.batches?.[0]?.serial_numbers?.id,
      availableSerials: getSerialNames(fullProduct.serialno_infos || fullProduct.serial_number || fullProduct.serials || fullProduct.batches?.[0]?.serial_numbers),
      batchId: fullProduct.batches?.[0]?.id,
      gst: parseInt(String(fullProduct.gst || fullProduct.datas?.gst || "18").replace("%", "")),
      type_infos: fullProduct.type_infos || {}
    } as InventoryItem;
  };

  const handleExchangeClick = async (ep: any) => {
    setLoadingExch(true);
    try {
      const res = await inventoryApi.getInventoryById(SHOP_ID, ep.id || ep._id, { include_serialno: 'true' });
      setPendingProduct(mapToInventoryItem(res?.data || res));
    } catch { setPendingProduct(mapToInventoryItem(ep)); }
    setIsProductModalOpen(true);
    setLoadingExch(false);
  };

  const handleProductSelectSuccess = (variant: ProductVariant, quantity: number, serials?: string[]) => {
    if (!pendingProduct) return;
    m.addExchangeProduct("__global__", {
      id: pendingProduct.id,
      inventoryId: pendingProduct.id,
      code: pendingProduct.product_barcode,
      name: variant.id === "default" ? pendingProduct.product_name : `${pendingProduct.product_name} - ${variant.name}`,
      sell_price: variant.price,
      price: variant.price,
      qty: quantity,
      quantity: quantity,
      tprice: quantity * variant.price,
      serialNumbers: serials || [],
      serial_numbers: serials || [],
      variant_id: variant.id === "default" || (variant as any).isBatchOnly ? null : variant.id,
      batch_id: variant.batchId || pendingProduct.batchId,
      serialno_id: variant.serialnoId || pendingProduct.serialnoId,
      requireSerial: pendingProduct.requireSerial,
      batchTracking: pendingProduct.batchTracking,
      manufacturingDate: variant.manufacturingDate || pendingProduct.manufacturingDate,
      expiryDate: variant.expiryDate || pendingProduct.expiryDate,
      maxStock: (pendingProduct as any).isStockTracked !== false ? variant.stock : undefined,
      gst: pendingProduct.gst,
      unitInfos: pendingProduct.unitInfos,
      unit: pendingProduct.unitInfos?.name || (pendingProduct as any).unit || "",
      _product: pendingProduct
    });
    setIsProductModalOpen(false); setPendingProduct(null);
  };

  const isExchangeStep2 = state.step === 2 && state.mode === "exchange";

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer transition-all">
              <ArrowLeft size={16} />
            </button>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Return / Exchange</p>
              <h1 className="text-[17px] font-black text-slate-900">Order #{sale.ui_id}</h1>
            </div>
          </div>
          {/* Step pills */}
          <div className="hidden sm:flex items-center gap-1.5">
            {([1, 2, 3, 4] as ReturnStep[]).map(s => (
              <div key={s} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${s < state.step ? 'bg-emerald-50 text-emerald-700' : s === state.step ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-slate-100 text-slate-400'}`}>
                {s < state.step ? <Check size={9} /> : <span>{s}</span>}
                {STEP_LABELS[s]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      {state.step === 5 ? (
        /* Done */
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-10 max-w-md w-full mx-6 flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-[20px] font-black text-slate-900 mb-2">{state.mode === "refund" ? "Refund Successful" : "Exchange Completed"}</p>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                {state.mode === "refund" ? `A refund of ${fmt(totals.returnValue)} has been processed.` : "The exchange order has been finalized."}
              </p>
            </div>
            <button onClick={onDone} className="w-full py-4 bg-slate-900 text-white rounded-xl text-[14px] font-black cursor-pointer hover:bg-black transition-all shadow-xl">
              Back to Order
            </button>
          </div>
        </div>

      ) : isExchangeStep2 ? (
        /* ── Exchange Step 2: Side-by-side ── */
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* LEFT: Items to return */}
          <div className="w-[42%] min-w-[300px] flex flex-col border-r border-slate-200 bg-white">
            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/60 to-white flex-shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Left — Items to Return</p>
              <p className="text-[14px] font-black text-slate-800">What is the customer returning?</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {saleItems.map((item, idx) => {
                const checked = state.returnItems[item.id] !== undefined;
                const isProcessed = item.status === "REFUNDED" || item.status === "EXCHANGED";
                const maxReturnable = Math.max(0, item.quantity - item.returned_quantity);
                const isDisabled = isProcessed || maxReturnable <= 0;
                const qty = state.returnItems[item.id] ?? 1;
                const reason = state.itemReasons[item.id] ?? "";
                return (
                  <div key={item.id} onClick={() => !isDisabled && m.toggleItem(item.id)}
                    className={`flex flex-col border rounded-xl p-3 transition-all ${isDisabled ? 'bg-slate-50 opacity-50 cursor-not-allowed' : checked ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/10 cursor-pointer' : 'bg-white border-slate-100 hover:border-slate-300 cursor-pointer'}`}>
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex-shrink-0">
                        <input type="checkbox" readOnly checked={checked} disabled={isDisabled} className="w-4 h-4 appearance-none rounded border border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all" onClick={e => e.stopPropagation()} />
                        {checked && <Check size={9} className="absolute inset-0 m-auto text-white pointer-events-none" />}
                      </div>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: ITEM_COLORS[idx % ITEM_COLORS.length] }}>
                        <Package size={13} className="text-slate-500/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-slate-800 truncate">{item.name}</p>
                        <p className="font-mono text-[10px] text-slate-400">{item.sku} · Qty {item.quantity}</p>
                      </div>
                      <p className="font-mono text-[11px] font-bold text-slate-800 flex-shrink-0">{fmt(item.unitPrice)}</p>
                    </div>
                    {checked && (
                      <div className="mt-3 pt-3 border-t border-blue-100 space-y-2" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 w-12 shrink-0">Qty</span>
                          <QuantityStepper value={qty} max={maxReturnable} onChange={v => m.updateQty(item.id, v)} />
                          <span className="text-[10px] text-slate-400">of {maxReturnable}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 w-12 shrink-0">Reason</span>
                          <select value={reason} onChange={e => m.setReason(item.id, e.target.value as ReturnReason)}
                            className="flex-1 h-8 px-2 text-[11px] border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-blue-500 font-semibold">
                            <option value="">Select reason…</option>
                            {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Replacement catalog */}
          <div className="flex-1 flex flex-col bg-slate-50 min-w-0">
            <div className="px-5 py-4 border-b border-slate-100 bg-white flex-shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Right — Replacement Products</p>
              <p className="text-[14px] font-black text-slate-800">Choose replacement items</p>
            </div>
            {/* Search */}
            <div className="px-4 pt-4 pb-2 bg-white border-b border-slate-100 flex-shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder={selectedItems.length === 0 ? "Select items to return first…" : "Search replacement catalog…"}
                  value={exchSearch} disabled={selectedItems.length === 0}
                  onChange={e => setExchSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 text-[13px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-400 transition-all placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed" />
              </div>
            </div>
            {/* Catalog */}
            <div className="flex-1 overflow-y-scroll p-4 space-y-2">
              {selectedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Package size={24} className="text-slate-300" />
                  </div>
                  <p className="text-[13px] text-slate-400 font-semibold max-w-[220px] leading-relaxed">Select items to return on the left, then pick replacements here.</p>
                </div>
              ) : loadingExch ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <Loader2 size={28} className="text-blue-500 animate-spin" />
                  <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wide">Loading catalog…</p>
                </div>
              ) : exchProducts.length === 0 ? (
                <div className="flex items-center justify-center h-24">
                  <p className="text-[13px] text-slate-400 font-semibold">No products found</p>
                </div>
              ) : (() => {
                const totalReturnQty = selectedItems.reduce((acc, i) => acc + i.returnQty, 0);
                const exList = state.exchangeMap["__global__"] || [];
                const usedQty = exList.reduce((sum: number, ex: any) => sum + (ex.quantity || ex.qty || 1), 0);
                const remainingQty = totalReturnQty - usedQty;
                return (
                  <>
                    <div className="flex items-center justify-between mb-2 mt-1">
                      <p className="text-[12px] font-bold text-slate-600">
                        Replacing <span className="text-slate-900">{totalReturnQty} item{totalReturnQty > 1 ? 's' : ''}</span>
                      </p>
                    </div>
                    {exList.length > 0 && (
                      <div className="mb-4 bg-emerald-50/50 border border-emerald-100 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-emerald-800 uppercase mb-2 flex items-center gap-1.5"><CheckCircle2 size={12} /> Selected Replacements ({usedQty}/{totalReturnQty})</p>
                        <div className="space-y-2">
                          {exList.map((ex: any) => (
                            <div key={ex.exchangeId} className="flex items-center justify-between bg-white border border-emerald-100 rounded-md p-2 shadow-sm">
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-slate-800">{ex.name}</p>
                                <p className="text-[10px] text-slate-500">Qty: {ex.quantity || ex.qty || 1} {ex.serialNumbers?.length > 0 ? `· Serials: ${ex.serialNumbers.join(", ")}` : ''}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-[11px] font-black">{fmt(ex.tprice || (ex.price || ex.sell_price || 0) * (ex.quantity || ex.qty || 1))}</span>
                                <button onClick={() => m.removeExchangeProduct("unused", ex.exchangeId)} className="w-6 h-6 rounded flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {remainingQty > 0 ? (
                      exchProducts.map(ep => {
                        const sel = (state.exchangeMap["__global__"] || []).some((ex: any) => ex.id === ep.id);
                        
                        const resolvedStock = ep.stocks || 0;
                        const inStock = ep.hasVariants || ep.hasBatches || resolvedStock > 0;
                        const parts = [];
                        if (ep.hasVariants) parts.push(ep.variantCount > 0 ? `${ep.variantCount} VARIANT${ep.variantCount > 1 ? 'S' : ''}` : 'VARIANTS');
                        if (ep.hasBatches) parts.push('BATCHES');
                        if (ep.hasSerials) parts.push('SERIALS');
                        
                        let stockLabel = 'OUT OF STOCK';
                        if (inStock) {
                          if (parts.length > 0) {
                            stockLabel = `${parts.join(' & ')}${resolvedStock > 0 ? ` - ${resolvedStock} IN STOCK` : ''}`;
                          } else {
                            stockLabel = resolvedStock > 0 ? `${resolvedStock} IN STOCK` : 'IN STOCK';
                          }
                        }
                          
                        const displayPrice = ep.price || 0;
                        
                        return (
                          <div key={ep.id} onClick={() => inStock && handleExchangeClick(ep)}
                            className={`flex items-center gap-3 p-3 px-4 bg-white border rounded-xl transition-all ${sel ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/10 shadow-sm cursor-pointer" : !inStock ? "opacity-40 grayscale cursor-not-allowed border-slate-100" : "border-slate-100 hover:border-blue-300 hover:shadow-md cursor-pointer"}`}>
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                              <Package size={16} className="text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold text-slate-800 truncate">{ep.name}</p>
                              <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                                <span className="font-mono text-[10px] text-slate-400">{ep.barcode || ep.id?.slice(-6)}</span>
                                <span className={`text-[10px] font-black uppercase ${inStock ? ((ep.hasVariants || ep.hasBatches) ? 'text-blue-500' : 'text-emerald-600') : 'text-red-400'}`}>{stockLabel}</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="font-mono text-[13px] font-black text-slate-900">
                                  {displayPrice === 0 && (ep.hasVariants || ep.hasBatches)
                                    ? <span className="text-slate-400 font-normal text-[11px]">see details</span>
                                    : <>{displayPrice > 0 && (ep.hasVariants || ep.hasBatches) && <span className="font-normal text-[11px] text-slate-400">from </span>}{fmt(displayPrice)}</>
                                  }
                                </p>
                              {sel && <CheckCircle2 size={15} className="text-blue-600 ml-auto mt-1" />}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                        <CheckCircle2 size={24} className="mx-auto text-emerald-400 mb-2" />
                        <p className="text-[13px] text-slate-600 font-bold">Full quantity replaced.</p>
                        <p className="text-[11px] text-slate-400 font-medium">To change items, remove a selection on the left.</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

      ) : (
        /* ── Steps 1, refund step 2, 3, 4 ── */
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

            {/* Step 1 */}
            {state.step === 1 && (
              <>
                <p className="text-[14px] text-slate-500 font-medium">How would you like to handle this return?</p>
                <div className="grid grid-cols-2 gap-4">
                  {[{ id: "refund" as const, icon: <Banknote size={28} />, label: "Refund", desc: "Return money to customer" }, { id: "exchange" as const, icon: <RefreshCw size={28} />, label: "Exchange", desc: "Swap for other products" }].map(opt => (
                    <button key={opt.id} onClick={() => m.setMode(opt.id)}
                      className={`text-left p-6 border-2 rounded-2xl transition-all cursor-pointer ${state.mode === opt.id ? "bg-white border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02]" : "bg-white border-slate-100 hover:border-slate-200"}`}>
                      <div className={`mb-4 ${state.mode === opt.id ? "text-blue-600" : "text-slate-400"}`}>{opt.icon}</div>
                      <p className="text-[16px] font-black text-slate-800 mb-1">{opt.label}</p>
                      <p className="text-[12px] text-slate-500 font-medium">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 2 refund mode */}
            {state.step === 2 && state.mode === "refund" && saleItems.map((item, idx) => {
              const checked = state.returnItems[item.id] !== undefined;
              const isProcessed = item.status === "REFUNDED" || item.status === "EXCHANGED";
              const maxReturnable = Math.max(0, item.quantity - item.returned_quantity);
              const isDisabled = isProcessed || maxReturnable <= 0;
              const qty = state.returnItems[item.id] ?? 1;
              const reason = state.itemReasons[item.id] ?? "";
              return (
                <div key={item.id} onClick={() => !isDisabled && m.toggleItem(item.id)}
                  className={`flex flex-col border rounded-xl p-4 bg-white transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : checked ? 'border-blue-300 ring-2 ring-blue-500/10 cursor-pointer' : 'border-slate-100 hover:border-slate-300 cursor-pointer'}`}>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <input type="checkbox" readOnly checked={checked} disabled={isDisabled} className="w-4 h-4 appearance-none rounded border border-slate-300 checked:bg-blue-600 checked:border-blue-600" onClick={e => e.stopPropagation()} />
                      {checked && <Check size={9} className="absolute inset-0 m-auto text-white pointer-events-none" />}
                    </div>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: ITEM_COLORS[idx % ITEM_COLORS.length] }}>
                      <Package size={14} className="text-slate-500/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-800">{item.name}</p>
                      <p className="font-mono text-[10px] text-slate-400">{item.sku} · Qty {item.quantity}</p>
                    </div>
                    <p className="font-mono text-[13px] font-bold text-slate-800">{fmt(item.unitPrice)}</p>
                  </div>
                  {checked && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 w-12">Qty</span>
                        <QuantityStepper value={qty} max={maxReturnable} onChange={v => m.updateQty(item.id, v)} />
                        <span className="text-[10px] text-slate-400">of {maxReturnable}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 w-12">Reason</span>
                        <select value={reason} onChange={e => m.setReason(item.id, e.target.value as ReturnReason)} className="flex-1 h-8 px-2 text-[11px] border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-blue-500 font-semibold">
                          <option value="">Select reason…</option>
                          {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Step 3: Settlement */}
            {state.step === 3 && (
              <div className="space-y-5">
                {(state.mode === "refund" || totals.diff !== 0) && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{state.mode === "refund" || totals.diff < 0 ? "Refund Via" : "Collect Via"} <span className="text-red-500">*</span></label>
                      {totals.diff !== 0 && state.mode === "exchange" && (
                        <span className={`text-[12px] font-black px-3 py-1 rounded-full border-2 ${totals.diff > 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>Balance: {fmt(Math.abs(totals.diff))}</span>
                      )}
                    </div>
                    {state.payments.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <SelectDropdown value={p.mode} onChange={mode => m.updatePayment(idx, { mode })} options={["Cash", "UPI", "Card", "Bank Transfer", ...(customerOutstanding > 0 ? ["On Credit"] : [])]} displayMap={{ "On Credit": "Clear Outstanding" }} />
                        <input type="number" value={p.amount === 0 ? "" : p.amount} onChange={e => m.updatePayment(idx, { amount: Number(e.target.value) })} placeholder="Amount" className="flex-1 h-10 px-3 text-[13px] border-2 border-slate-100 rounded-lg bg-white text-slate-800 outline-none focus:border-blue-500 font-semibold text-right" />
                        {state.payments.length > 1 && <button onClick={() => m.removePayment(idx)} className="w-10 h-10 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center border border-rose-100"><X size={14} /></button>}
                      </div>
                    ))}
                    <button onClick={m.addPayment} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-lg text-[12px] font-bold text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"><Plus size={13} /> Add Split Payment</button>
                    {state.errors.settlement && <p className="flex items-center gap-1.5 text-[12px] text-red-500 font-bold"><AlertCircle size={12} />{state.errors.settlement}</p>}
                  </div>
                )}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Notes <span className="text-[10px] text-slate-300 font-normal lowercase tracking-normal">(optional)</span></label>
                  <textarea value={state.notes} onChange={e => m.setNotes(e.target.value)} rows={3} placeholder="Additional context…" className="w-full p-4 text-[13px] border-2 border-slate-100 rounded-xl bg-white outline-none focus:border-blue-400 transition-all resize-none placeholder:text-slate-300 font-semibold" />
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {state.step === 4 && (
              <div className="space-y-4">
                <div className={`border rounded-2xl p-5 ${state.mode === "refund" ? 'bg-gradient-to-br from-blue-50 to-slate-50 border-blue-200' : totals.diff > 0 ? 'bg-amber-50/50 border-amber-200' : totals.diff < 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  {state.mode === "refund" ? (
                    <div><p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Refund Amount</p><p className="font-mono text-[28px] font-light text-blue-700">{fmt(totals.returnValue)}</p></div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[{ label: 'Return Value', val: fmt(totals.returnValue) }, { label: 'Exchange Value', val: fmt(totals.exchangeValue) }, { label: totals.diff > 0 ? 'Customer Pays' : totals.diff < 0 ? 'Shop Refunds' : 'Settled', val: totals.diff === 0 ? '–' : fmt(Math.abs(totals.diff)) }].map(({ label, val }) => (
                        <div key={label}><p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p><p className="font-mono text-[14px] font-bold text-slate-800">{val}</p></div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  {selectedItems.map((item, i) => (
                    <div key={item.id} className={`flex items-center gap-3.5 p-4 ${i > 0 ? 'border-t border-slate-50' : ''}`}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: ITEM_COLORS[i % ITEM_COLORS.length] }}><Package size={14} className="text-slate-600/60" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-800">{item.name}</p>
                        {item.exchangeItems && item.exchangeItems.map((ex: any) => (
                          <p key={ex.exchangeId} className="text-[11px] text-blue-600 font-black mt-1 flex items-center gap-1">
                            <ArrowRight size={10} /> {ex.name} (Qty: {ex.quantity || ex.qty || 1})
                          </p>
                        ))}
                      </div>
                      <span className="font-mono text-[13px] font-black text-slate-900">{fmt(item.unitPrice * item.returnQty)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-200/50 rounded-2xl p-5">
                  <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-amber-900 font-bold leading-relaxed">This operation is permanent and will update inventory and process the {state.mode === "refund" ? "financial refund" : "exchange order"}.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom action bar ── */}
      {state.step < 5 && (
        <div className="flex-shrink-0 border-t border-slate-100 bg-white px-6 py-4 shadow-sm">
          <div className={`${isExchangeStep2 ? 'max-w-[1400px]' : 'max-w-2xl'} mx-auto flex items-center gap-3`}>
            {state.step > 1 && (
              <button onClick={m.goBack} className="inline-flex items-center gap-2 px-5 py-3 text-[13px] font-bold text-slate-600 bg-white border-2 border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                <ArrowLeft size={15} />Back
              </button>
            )}
            {state.step < 4 ? (
              <button onClick={m.goNext} disabled={!m.canProceed}
                className="flex-1 h-12 bg-blue-600 text-white border-none rounded-xl text-[14px] font-black cursor-pointer transition-all disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed hover:bg-blue-700 shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2">
                Continue to {STEP_LABELS[(state.step + 1) as ReturnStep]} <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={() => m.confirm(onDone)} disabled={state.isSubmitting}
                className="flex-1 h-12 bg-blue-600 text-white border-none rounded-xl text-[14px] font-black cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blue-700 shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2">
                {state.isSubmitting ? <><Loader2 size={16} className="animate-spin" />Processing…</> : <>{state.mode === "refund" ? "Confirm & Refund" : "Confirm & Exchange"}<CheckCircle2 size={16} /></>}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ProductSelectionModal for exchange */}
      {(() => {
        const usedSerials = (state.exchangeMap["__global__"] || []).flatMap((d: any) => d.serial_numbers || []);
        const totalReturnQty = selectedItems.reduce((acc, i) => acc + i.returnQty, 0);
        const usedQty = (state.exchangeMap["__global__"] || []).reduce((sum: number, ex: any) => sum + (ex.quantity || ex.qty || 1), 0);
        const remainingQty = Math.max(1, totalReturnQty - usedQty);
        return <ProductSelectionModal isExchange={true} isOpen={isProductModalOpen} product={pendingProduct} onClose={() => setIsProductModalOpen(false)} onSuccess={handleProductSelectSuccess} excludedSerials={usedSerials} initialQuantity={1} maxAllowedQuantity={remainingQty} />;
      })()}
    </div>
  );
};

export default ReturnPage;

