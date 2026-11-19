import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Printer,
  FileText,
  QrCode,
  Store,
  Layers,
  Save,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Sliders,
  DollarSign,
  ShieldCheck,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Info,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/context/ToastContext";
import { shopApi } from "@/services/api/shop";
import { inventoryApi } from "@/services/api/inventory";
import { getShopId, SHOP_ID } from "@/services/endpoints";
import { getPrinterConfig, savePrinterConfig, type PaperWidth } from "@/features/billing/utils/printerService";
import { numberToWords, type FieldType, type FieldPlacement, type FieldMode, type ItemSource, type ItemShow, TYPES, ATTRS } from "./InvoiceTemplateSettings";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import "./BillingReceiptSettings.css";

export type ThermalTemplateId = "modern" | "classic" | "compact" | "gst";

export interface CustomField {
  id: string;
  label: string;
  placement: FieldPlacement;
  type: FieldType;
  mode: FieldMode;
  value: string;
  required: boolean;
  show: boolean;
  itemSource?: ItemSource;
  attr?: string;
  itemShow?: ItemShow;
}

export interface BillingReceiptConfig {
  paperWidth: PaperWidth;
  templateId: ThermalTemplateId;
  header: {
    showLogo: boolean;
    showStoreName: boolean;
    tagline: string;
    showAddress: boolean;
    showPhone: boolean;
    showGst: boolean;
    fssaiNo: string;
  };
  meta: {
    cashierName: string;
    showCashier: boolean;
    showTokenNo: boolean;
    tokenPrefix: string;
    showCustomer: boolean;
    showDateTime: boolean;
  };
  items: {
    showRate: boolean;
    showCode: boolean;
    showDiscount: boolean;
    showUnit: boolean;
  };
  tax: {
    showTaxBreakup: boolean;
    showWords: boolean;
  };
  qr: {
    upi: boolean;
    upiId: string;
    upiCap: string;
    store: boolean;
    storeUrl: string;
    storeCap: string;
  };
  footer: {
    thanks: string;
    terms: string;
    showTearLine: boolean;
  };
  fields: CustomField[];
}

const STORAGE_KEY = "inventq.billingReceiptSettings.v1";
const uid = () => "rf" + Math.random().toString(36).slice(2, 8);

const BASE_FIELD: Omit<CustomField, "id" | "label" | "show"> = {
  type: "text",
  mode: "ask",
  value: "",
  required: false,
  placement: "customer",
  itemSource: "product",
  attr: "batch",
  itemShow: "under",
};

const DEFAULT_CONFIG: BillingReceiptConfig = {
  paperWidth: "80mm",
  templateId: "modern",
  header: {
    showLogo: false,
    showStoreName: true,
    tagline: "Quality Products & Best Service",
    showAddress: true,
    showPhone: true,
    showGst: true,
    fssaiNo: "",
  },
  meta: {
    cashierName: "Counter 1",
    showCashier: true,
    showTokenNo: true,
    tokenPrefix: "T-",
    showCustomer: true,
    showDateTime: true,
  },
  items: {
    showRate: true,
    showCode: false,
    showDiscount: true,
    showUnit: true,
  },
  tax: {
    showTaxBreakup: true,
    showWords: true,
  },
  qr: {
    upi: true,
    upiId: "",
    upiCap: "Scan & Pay via UPI",
    store: true,
    storeUrl: "",
    storeCap: "Scan to Order Online",
  },
  footer: {
    thanks: "Thank you for shopping with us! Please visit again.",
    terms: "Goods once sold can be exchanged within 7 days with bill.",
    showTearLine: true,
  },
  fields: [
    {
      id: "rf_doc",
      label: "Doctor name",
      placement: "customer",
      type: "text",
      mode: "ask",
      value: "",
      required: false,
      show: true,
    },
    {
      id: "rf_batch",
      label: "Batch no",
      placement: "item",
      itemSource: "product",
      attr: "batch",
      itemShow: "under",
      type: "text",
      mode: "ask",
      value: "",
      required: false,
      show: true,
    },
  ],
};

const TEMPLATES: { id: ThermalTemplateId; name: string; desc: string }[] = [
  {
    id: "modern",
    name: "Modern Thermal",
    desc: "Clean structured layout with bold totals, dotted dividers & fast scan QR.",
  },
  {
    id: "classic",
    name: "Classic Monospace",
    desc: "Traditional supermarket cash register look with tabular columns.",
  },
  {
    id: "compact",
    name: "Compact Roll Saver",
    desc: "High density item layout designed to minimize thermal paper usage.",
  },
  {
    id: "gst",
    name: "Detailed GST Tax Slip",
    desc: "Full tax breakdown with CGST, SGST, HSN codes and B2C QR.",
  },
];

export const BillingReceiptTemplateSettings: React.FC = () => {
  const { showToast } = useToast();
  const activeShopId = getShopId() || SHOP_ID;

  // Real store data
  const [shopData, setShopData] = useState<any>(null);
  const [realItems, setRealItems] = useState<any[]>([]);
  const [openFieldId, setOpenFieldId] = useState<string | null>(null);

  // Config state
  const [config, setConfig] = useState<BillingReceiptConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const prConfig = getPrinterConfig();
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          paperWidth: prConfig.paperWidth || parsed.paperWidth || "80mm",
          footer: {
            ...DEFAULT_CONFIG.footer,
            ...parsed.footer,
            thanks: prConfig.footerText || parsed.footer?.thanks || DEFAULT_CONFIG.footer.thanks,
          },
          fields: Array.isArray(parsed.fields) ? parsed.fields : DEFAULT_CONFIG.fields,
        };
      }
      return {
        ...DEFAULT_CONFIG,
        paperWidth: prConfig.paperWidth || "80mm",
        footer: {
          ...DEFAULT_CONFIG.footer,
          thanks: prConfig.footerText || DEFAULT_CONFIG.footer.thanks,
        },
      };
    } catch (_) {
      return DEFAULT_CONFIG;
    }
  });

  const [savedConfig, setSavedConfig] = useState<BillingReceiptConfig>(config);

  // Load shop & inventory
  useEffect(() => {
    let isMounted = true;
    if (activeShopId) {
      shopApi.getShopById(activeShopId).then((res) => {
        if (!isMounted) return;
        const d = res?.data ?? res;
        if (d) {
          setShopData(d);
          if (!config.qr.storeUrl) {
            setConfig((prev) => ({
              ...prev,
              qr: {
                ...prev.qr,
                storeUrl: d.additional_infos?.website || `${window.location.origin}/store/${d.id || activeShopId}`,
              },
            }));
          }
        }
      }).catch(console.error);

      inventoryApi.getInventoriesByShop(activeShopId, { page: 1, limit: 6 }).then((res) => {
        if (!isMounted) return;
        const list = res?.data?.inventories || res?.inventories || [];
        if (Array.isArray(list) && list.length > 0) {
          setRealItems(list);
        }
      }).catch(console.error);
    }
    return () => { isMounted = false; };
  }, [activeShopId]);

  const shopName = shopData?.name || localStorage.getItem("shop_name") || "inventQ Store";
  const shopPhone = shopData?.phone || shopData?.phone_number || "+91 98765 43210";
  const shopGst = shopData?.business_infos?.gst_infos?.number || shopData?.gst_number || "";
  const shopAddr = shopData?.address?.full_address || shopData?.address_infos?.address_line_1 || "Main Commercial Street, City";

  // Demo display items
  const displayItems = useMemo(() => {
    if (realItems.length > 0) {
      return realItems.slice(0, 3).map((it) => ({
        name: it.product_name || it.name || "Item",
        code: it.sku || it.barcode || "ITEM-1",
        qty: 1,
        rate: Number(it.selling_price || it.price || 120),
        mrp: Number(it.mrp || (it.selling_price ? Number(it.selling_price) * 1.15 : 140)),
        gstRate: it.gst_rate || 18,
        batch: it.batch_number || it.batch || "B-101",
        expiry: it.expiry_date || "12/28",
        hsn: it.hsn_code || "8471",
      }));
    }
    return [
      { name: "Premium Basmati Rice 1kg", code: "RIC-01", qty: 2, rate: 140, mrp: 160, gstRate: 5, batch: "B-204", expiry: "10/27", hsn: "1006" },
      { name: "Cold Pressed Coconut Oil 500ml", code: "OIL-02", qty: 1, rate: 210, mrp: 240, gstRate: 12, batch: "B-509", expiry: "06/28", hsn: "1513" },
      { name: "Roasted Almonds 200g", code: "ALM-03", qty: 1, rate: 180, mrp: 200, gstRate: 18, batch: "B-311", expiry: "09/27", hsn: "2008" },
    ];
  }, [realItems]);

  const subTotal = useMemo(() => displayItems.reduce((acc, it) => acc + it.rate * it.qty, 0), [displayItems]);
  const totalMrp = useMemo(() => displayItems.reduce((acc, it) => acc + it.mrp * it.qty, 0), [displayItems]);
  const savings = Math.max(0, totalMrp - subTotal);
  const taxAmount = useMemo(() => {
    return displayItems.reduce((acc, it) => {
      const lineTotal = it.rate * it.qty;
      const base = lineTotal / (1 + it.gstRate / 100);
      return acc + (lineTotal - base);
    }, 0);
  }, [displayItems]);
  const taxableAmount = subTotal - taxAmount;

  // Custom Fields Handlers
  const handleAddField = () => {
    const newField: CustomField = {
      ...BASE_FIELD,
      id: uid(),
      label: "",
      placement: "customer",
      show: true,
    };
    setConfig((prev) => ({ ...prev, fields: [...prev.fields, newField] }));
    setOpenFieldId(newField.id);
  };

  const handleUpdateField = (id: string, updates: Partial<CustomField>) => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => {
        if (f.id !== id) return f;
        const updated = { ...f, ...updates };
        if (updates.placement === "item") {
          updated.itemSource = updated.itemSource || "product";
          updated.attr = updated.attr || "batch";
          updated.itemShow = "under";
        }
        return updated;
      }),
    }));
  };

  const handleDeleteField = (id: string, label: string) => {
    setConfig((prev) => ({ ...prev, fields: prev.fields.filter((f) => f.id !== id) }));
    if (openFieldId === id) setOpenFieldId(null);
    showToast(`“${label || "Field"}” removed`, "info");
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.fields.length) return;
    const updated = [...config.fields];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setConfig((prev) => ({ ...prev, fields: updated }));
  };

  // Helper for item value in preview
  const getItemFieldValue = (f: CustomField, item: any) => {
    if (f.itemSource === "product") {
      const attr = f.attr || "batch";
      if (attr === "batch") return item.batch || "B-101";
      if (attr === "expiry") return item.expiry || "12/28";
      if (attr === "hsn") return item.hsn || "8471";
      if (attr === "mrp") return `₹${item.mrp || item.rate}`;
      return item[attr] || "Standard";
    }
    return f.value || "Filled on POS";
  };

  // Has changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(savedConfig);
  }, [config, savedConfig]);

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      // Sync with printerService
      savePrinterConfig({
        ...getPrinterConfig(),
        paperWidth: config.paperWidth,
        footerText: config.footer.thanks,
        includeDigitalStoreQr: config.qr.store,
      });
      setSavedConfig(config);
      showToast("Thermal receipt template saved successfully", "success");
    } catch (err) {
      showToast("Failed to save receipt settings", "error");
    }
  };

  const handleDiscard = () => {
    setConfig(savedConfig);
    showToast("Changes discarded", "info");
  };

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (hasChanges) handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, config]);

  // Test print trigger
  const handlePrintTest = () => {
    window.print();
  };

  const is80mm = config.paperWidth === "80mm";

  return (
    <div className="rcp-wrap">
      {/* Main Grid */}
      <div className="rcp-grid">
        {/* Left Column Controls */}
        <div className="rcp-form-col">
          {/* Card 1: Paper Roll Width & Template Design */}
          <div className="rcp-card">
            <div className="rcp-card-h">
              <div>
                <h2>
                  <Layers size={16} className="text-emerald-700" />
                  Thermal Paper Width & Design
                </h2>
                <p>Choose your physical thermal printer roll size and receipt layout.</p>
              </div>
            </div>

            {/* Width Selector */}
            <div className="rcp-width-grid">
              <button
                type="button"
                className={`rcp-width-card ${config.paperWidth === "80mm" ? "active" : ""}`}
                onClick={() => setConfig((prev) => ({ ...prev, paperWidth: "80mm" }))}
              >
                <div className="rcp-width-title">
                  <span>80 mm (3 Inch)</span>
                  {config.paperWidth === "80mm" && <Check size={16} />}
                </div>
                <span className="rcp-width-sub">Standard 42/48 col counter POS thermal roll</span>
              </button>

              <button
                type="button"
                className={`rcp-width-card ${config.paperWidth === "58mm" ? "active" : ""}`}
                onClick={() => setConfig((prev) => ({ ...prev, paperWidth: "58mm" }))}
              >
                <div className="rcp-width-title">
                  <span>58 mm (2 Inch)</span>
                  {config.paperWidth === "58mm" && <Check size={16} />}
                </div>
                <span className="rcp-width-sub">Compact 32 col mobile Bluetooth / handheld printer</span>
              </button>
            </div>

            {/* Template Selector */}
            <div className="rcp-tmpl-grid">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  className={`rcp-tmpl-btn ${config.templateId === tmpl.id ? "active" : ""}`}
                  onClick={() => setConfig((prev) => ({ ...prev, templateId: tmpl.id }))}
                >
                  <div className="rcp-tmpl-name">
                    <span>{tmpl.name}</span>
                    {config.templateId === tmpl.id && <Check size={14} />}
                  </div>
                  <span className="rcp-tmpl-desc">{tmpl.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card 2: Custom Fields (Just like Invoice Template) */}
          <div className="rcp-card">
            <div className="rcp-card-h">
              <div>
                <h2>
                  <Sliders size={16} className="text-emerald-700" />
                  Custom Receipt Fields
                </h2>
                <p>Add specialized attributes to thermal receipts: at the top (Doctor / Table No), with each item (Batch, Expiry, Serial) or below items.</p>
              </div>
            </div>

            {/* Fields List */}
            <div className="space-y-3">
              {config.fields.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No custom fields added yet. Click "+ Add custom field" below.
                </div>
              ) : (
                config.fields.map((field, idx) => {
                  const isOpen = openFieldId === field.id;
                  return (
                    <div
                      key={field.id}
                      className={`rounded-xl border transition-all ${
                        isOpen ? "border-emerald-600 bg-emerald-50/20 shadow-xs" : "border-slate-200 bg-white"
                      } ${!field.show ? "opacity-60" : ""}`}
                    >
                      {/* Accordion Summary */}
                      <div className="p-3 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          className="flex items-center gap-2 flex-1 text-left cursor-pointer"
                          onClick={() => setOpenFieldId(isOpen ? null : field.id)}
                        >
                          {isOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                          <span className="font-bold text-xs text-slate-800">
                            {field.label.trim() || <span className="text-slate-400 italic">Untitled field</span>}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {field.placement === "customer" ? "Top / Header" : field.placement === "item" ? "Each Item" : "Below Items"}
                          </span>
                          {field.placement === "item" && field.itemSource === "product" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                              From Inventory ({ATTRS[field.attr || "batch"]})
                            </span>
                          )}
                        </button>

                        <div className="flex items-center gap-1.5">
                          {/* Move up / down */}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveField(idx, "up")}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            title="Move up"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === config.fields.length - 1}
                            onClick={() => handleMoveField(idx, "down")}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            title="Move down"
                          >
                            <ArrowDown size={13} />
                          </button>

                          {/* Toggle show */}
                          <label className="rcp-switch" style={{ width: 36, height: 20 }}>
                            <input
                              type="checkbox"
                              checked={field.show}
                              onChange={(e) => handleUpdateField(field.id, { show: e.target.checked })}
                            />
                            <span className="rcp-slider" style={{ borderRadius: 20 }} />
                          </label>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteField(field.id, field.label)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete field"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Accordion Body */}
                      {isOpen && (
                        <div className="p-4 border-t border-slate-200 space-y-3.5 bg-white rounded-b-xl">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-slate-700 block mb-1">Field Name / Label *</label>
                              <input
                                type="text"
                                className="rcp-input"
                                placeholder="e.g. Doctor name, Table No, Serial"
                                value={field.label}
                                onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                              />
                            </div>

                            {/* Reusable Select for Field Type */}
                            {!(field.placement === "item" && field.itemSource === "product") && (
                              <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Type of Value</label>
                                <ReusableSelect
                                  options={Object.entries(TYPES).map(([k, v]) => ({ label: v, value: k }))}
                                  value={field.type}
                                  onValueChange={(val) => handleUpdateField(field.id, { type: val as FieldType, value: "" })}
                                  size="sm"
                                />
                              </div>
                            )}
                          </div>

                          {/* Placement Selection */}
                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">Where on the receipt</label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: "customer", label: "Top (Customer/Meta)" },
                                { id: "item", label: "Each Item Row" },
                                { id: "below", label: "Below Items" },
                              ].map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                    field.placement === p.id
                                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                  }`}
                                  onClick={() => handleUpdateField(field.id, { placement: p.id as FieldPlacement })}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Item specific configuration */}
                          {field.placement === "item" && (
                            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2.5">
                              <label className="text-xs font-bold text-slate-700 block">Item Value Source</label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                                    field.itemSource === "product"
                                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                                      : "border-slate-200 text-slate-600 bg-white"
                                  }`}
                                  onClick={() => handleUpdateField(field.id, { itemSource: "product" })}
                                >
                                  Auto from inventory
                                </button>
                                <button
                                  type="button"
                                  className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                                    field.itemSource === "ask"
                                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                                      : "border-slate-200 text-slate-600 bg-white"
                                  }`}
                                  onClick={() => handleUpdateField(field.id, { itemSource: "ask" })}
                                >
                                  Ask on billing POS
                                </button>
                              </div>

                              {field.itemSource === "product" && (
                                <div className="pt-1">
                                  <label className="text-xs font-bold text-slate-700 block mb-1">Product detail to print</label>
                                  <ReusableSelect
                                    options={Object.entries(ATTRS).map(([k, v]) => ({ label: v, value: k }))}
                                    value={field.attr || "batch"}
                                    onValueChange={(val) => {
                                      const newAttr = val as any;
                                      const oldLabel = ATTRS[field.attr || ""];
                                      const shouldUpdateLabel = !field.label.trim() || field.label === oldLabel;
                                      handleUpdateField(field.id, {
                                        attr: newAttr,
                                        label: shouldUpdateLabel ? ATTRS[newAttr] : field.label,
                                      });
                                    }}
                                    size="sm"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* How it's filled */}
                          {!(field.placement === "item" && field.itemSource === "product") && (
                            <div>
                              <label className="text-xs font-bold text-slate-700 block mb-1">How it's filled</label>
                              <div className="flex gap-2 mb-2">
                                <button
                                  type="button"
                                  className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                                    field.mode === "ask"
                                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                                      : "border-slate-200 text-slate-600 bg-white"
                                  }`}
                                  onClick={() => handleUpdateField(field.id, { mode: "ask" })}
                                >
                                  Filled in while billing
                                </button>
                                <button
                                  type="button"
                                  className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                                    field.mode === "fixed"
                                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                                      : "border-slate-200 text-slate-600 bg-white"
                                  }`}
                                  onClick={() => handleUpdateField(field.id, { mode: "fixed" })}
                                >
                                  Same on every bill (fixed)
                                </button>
                              </div>

                              {field.mode === "fixed" ? (
                                <div>
                                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Fixed Value to Print</label>
                                  <input
                                    type="text"
                                    className="rcp-input"
                                    placeholder="e.g. Table 4 or Counter Express"
                                    value={field.value}
                                    onChange={(e) => handleUpdateField(field.id, { value: e.target.value })}
                                  />
                                </div>
                              ) : (
                                <div>
                                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Default / Placeholder Value (Optional)</label>
                                  <input
                                    type="text"
                                    className="rcp-input"
                                    placeholder="Optional default value"
                                    value={field.value}
                                    onChange={(e) => handleUpdateField(field.id, { value: e.target.value })}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              <button
                type="button"
                className="rcp-btn ghost sm w-full py-2 border-dashed border-slate-300 text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
                onClick={handleAddField}
              >
                <Plus size={14} /> Add Custom Field
              </button>
            </div>
          </div>

          {/* Card 3: Store Header Info */}
          <div className="rcp-card">
            <div className="rcp-card-h">
              <div>
                <h2>
                  <Store size={16} className="text-emerald-700" />
                  Store Header & Contact
                </h2>
                <p>Configure business details printed at the top of the receipt.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rcp-switch-row">
                <div className="rcp-switch-label">
                  <span>Show Store Name</span>
                  <small>Prominently printed in bold / double-height font</small>
                </div>
                <label className="rcp-switch">
                  <input
                    type="checkbox"
                    checked={config.header.showStoreName}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        header: { ...prev.header, showStoreName: e.target.checked },
                      }))
                    }
                  />
                  <span className="rcp-slider" />
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Store Tagline / Subtitle</label>
                <input
                  type="text"
                  className="rcp-input"
                  placeholder="e.g. Supermarket & Departmental Store"
                  value={config.header.tagline}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      header: { ...prev.header, tagline: e.target.value },
                    }))
                  }
                />
              </div>

              <div className="rcp-switch-row">
                <div className="rcp-switch-label">
                  <span>Show Store Address</span>
                  <small>{shopAddr}</small>
                </div>
                <label className="rcp-switch">
                  <input
                    type="checkbox"
                    checked={config.header.showAddress}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        header: { ...prev.header, showAddress: e.target.checked },
                      }))
                    }
                  />
                  <span className="rcp-slider" />
                </label>
              </div>

              <div className="rcp-switch-row">
                <div className="rcp-switch-label">
                  <span>Show Phone / Helpline</span>
                  <small>{shopPhone}</small>
                </div>
                <label className="rcp-switch">
                  <input
                    type="checkbox"
                    checked={config.header.showPhone}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        header: { ...prev.header, showPhone: e.target.checked },
                      }))
                    }
                  />
                  <span className="rcp-slider" />
                </label>
              </div>

              <div className="rcp-switch-row">
                <div className="rcp-switch-label">
                  <span>Show GSTIN Number</span>
                  <small>{shopGst ? `GSTIN: ${shopGst}` : "Configured in GST Settings"}</small>
                </div>
                <label className="rcp-switch">
                  <input
                    type="checkbox"
                    checked={config.header.showGst}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        header: { ...prev.header, showGst: e.target.checked },
                      }))
                    }
                  />
                  <span className="rcp-slider" />
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">FSSAI / Trade License (Optional)</label>
                <input
                  type="text"
                  className="rcp-input"
                  placeholder="e.g. 10020033004455"
                  value={config.header.fssaiNo}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      header: { ...prev.header, fssaiNo: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Card 4: Line Items & Pricing */}
          <div className="rcp-card">
            <div className="rcp-card-h">
              <div>
                <h2>
                  <DollarSign size={16} className="text-emerald-700" />
                  Item Table & Financials
                </h2>
                <p>Customize item details and totals summary layout.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rcp-switch-row">
                <div className="rcp-switch-label">
                  <span>Show Item Rate / Price Column</span>
                  <small>Print individual unit rate alongside total line amount</small>
                </div>
                <label className="rcp-switch">
                  <input
                    type="checkbox"
                    checked={config.items.showRate}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        items: { ...prev.items, showRate: e.target.checked },
                      }))
                    }
                  />
                  <span className="rcp-slider" />
                </label>
              </div>

              <div className="rcp-switch-row">
                <div className="rcp-switch-label">
                  <span>Show SKU / Barcode / HSN</span>
                  <small>Print product code beneath item title</small>
                </div>
                <label className="rcp-switch">
                  <input
                    type="checkbox"
                    checked={config.items.showCode}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        items: { ...prev.items, showCode: e.target.checked },
                      }))
                    }
                  />
                  <span className="rcp-slider" />
                </label>
              </div>

              <div className="rcp-switch-row">
                <div className="rcp-switch-label">
                  <span>Show Customer Savings Badge</span>
                  <small>Print "You saved ₹XX.XX on this bill!" highlight</small>
                </div>
                <label className="rcp-switch">
                  <input
                    type="checkbox"
                    checked={config.items.showDiscount}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        items: { ...prev.items, showDiscount: e.target.checked },
                      }))
                    }
                  />
                  <span className="rcp-slider" />
                </label>
              </div>

              <div className="rcp-switch-row">
                <div className="rcp-switch-label">
                  <span>Show Tax Breakdown (CGST / SGST)</span>
                  <small>Itemized tax breakdown table before grand total</small>
                </div>
                <label className="rcp-switch">
                  <input
                    type="checkbox"
                    checked={config.tax.showTaxBreakup}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        tax: { ...prev.tax, showTaxBreakup: e.target.checked },
                      }))
                    }
                  />
                  <span className="rcp-slider" />
                </label>
              </div>

              <div className="rcp-switch-row">
                <div className="rcp-switch-label">
                  <span>Grand Total in Words</span>
                  <small>Print "Rupees Five Hundred Only" below total</small>
                </div>
                <label className="rcp-switch">
                  <input
                    type="checkbox"
                    checked={config.tax.showWords}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        tax: { ...prev.tax, showWords: e.target.checked },
                      }))
                    }
                  />
                  <span className="rcp-slider" />
                </label>
              </div>
            </div>
          </div>

          {/* Card 5: QR Codes for Thermal Print */}
          <div className="rcp-card">
            <div className="rcp-card-h">
              <div>
                <h2>
                  <QrCode size={16} className="text-emerald-700" />
                  Thermal QR Codes
                </h2>
                <p>Fast-scanning, high-contrast QR codes optimized for thermal receipt paper.</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* UPI QR */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="rcp-switch-row p-0 border-none">
                  <div className="rcp-switch-label">
                    <span className="font-bold text-slate-800">Instant UPI Payment QR</span>
                    <small>Customers scan to pay exact bill amount directly via Google Pay, PhonePe, Paytm</small>
                  </div>
                  <label className="rcp-switch">
                    <input
                      type="checkbox"
                      checked={config.qr.upi}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          qr: { ...prev.qr, upi: e.target.checked },
                        }))
                      }
                    />
                    <span className="rcp-slider" />
                  </label>
                </div>

                {config.qr.upi && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Your VPA / UPI ID *</label>
                      <input
                        type="text"
                        className="rcp-input"
                        placeholder="e.g. storename@okhdfcbank"
                        value={config.qr.upiId}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            qr: { ...prev.qr, upiId: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Caption</label>
                      <input
                        type="text"
                        className="rcp-input"
                        placeholder="Scan & Pay via UPI"
                        value={config.qr.upiCap}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            qr: { ...prev.qr, upiCap: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Digital Store QR */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="rcp-switch-row p-0 border-none">
                  <div className="rcp-switch-label">
                    <span className="font-bold text-slate-800">Online Storefront QR</span>
                    <small>Drives repeat customer orders directly to your ShopiQ Digital Store</small>
                  </div>
                  <label className="rcp-switch">
                    <input
                      type="checkbox"
                      checked={config.qr.store}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          qr: { ...prev.qr, store: e.target.checked },
                        }))
                      }
                    />
                    <span className="rcp-slider" />
                  </label>
                </div>

                {config.qr.store && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Store URL</label>
                      <input
                        type="text"
                        className="rcp-input"
                        placeholder="https://..."
                        value={config.qr.storeUrl}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            qr: { ...prev.qr, storeUrl: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Caption</label>
                      <input
                        type="text"
                        className="rcp-input"
                        placeholder="Scan to Order Online"
                        value={config.qr.storeCap}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            qr: { ...prev.qr, storeCap: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 6: Footer & Tear-off Notice */}
          <div className="rcp-card">
            <div className="rcp-card-h">
              <div>
                <h2>
                  <FileText size={16} className="text-emerald-700" />
                  Footer & Return Policy
                </h2>
                <p>Printed at the bottom of the bill right before the cutter blade.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Thank You Note</label>
                <input
                  type="text"
                  className="rcp-input"
                  placeholder="Thank you for shopping with us! Please visit again."
                  value={config.footer.thanks}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      footer: { ...prev.footer, thanks: e.target.value },
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Return / Exchange Terms</label>
                <textarea
                  className="rcp-textarea"
                  rows={2}
                  placeholder="Goods once sold can be exchanged within 7 days with bill."
                  value={config.footer.terms}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      footer: { ...prev.footer, terms: e.target.value },
                    }))
                  }
                />
              </div>

              <div className="rcp-switch-row">
                <div className="rcp-switch-label">
                  <span>Show Tear-off Cut Line</span>
                  <small>Dashed guideline printed for counter staff tear-off</small>
                </div>
                <label className="rcp-switch">
                  <input
                    type="checkbox"
                    checked={config.footer.showTearLine}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        footer: { ...prev.footer, showTearLine: e.target.checked },
                      }))
                    }
                  />
                  <span className="rcp-slider" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sticky Live Preview */}
        <aside className="rcp-preview-aside">
          <div className="rcp-preview-box">
            <div className="rcp-preview-header">
              <div className="rcp-preview-title">
                <span>Thermal Slip Preview</span>
                <span className="rcp-badge-live">Live</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintTest}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
                  title="Print a sample thermal receipt using current settings"
                >
                  <Printer size={12} className="text-emerald-700" />
                  Print Test Slip
                </button>
                <div className="text-xs font-mono font-bold text-slate-500">
                  {is80mm ? "80 mm · 42 Col" : "58 mm · 32 Col"}
                </div>
              </div>
            </div>

            {/* Live Paper Roll Stage */}
            <div className="rcp-stage">
              <div className={`rcp-roll ${is80mm ? "w-80mm" : "w-58mm"}`}>
                {/* Store Header */}
                <div className="rcp-r-center">
                  {config.header.showStoreName && (
                    <div className="rcp-r-double">{shopName}</div>
                  )}
                  {config.header.tagline && (
                    <div className="rcp-r-small">{config.header.tagline}</div>
                  )}
                  {config.header.showAddress && (
                    <div className="rcp-r-small">{shopAddr}</div>
                  )}
                  {config.header.showPhone && (
                    <div className="rcp-r-small">Ph: {shopPhone}</div>
                  )}
                  {config.header.showGst && shopGst && (
                    <div className="rcp-r-small rcp-r-bold">GSTIN: {shopGst}</div>
                  )}
                  {config.header.fssaiNo && (
                    <div className="rcp-r-small">FSSAI: {config.header.fssaiNo}</div>
                  )}
                </div>

                <div className={config.templateId === "classic" ? "rcp-r-divider-double" : "rcp-r-divider"} />

                {/* Meta details */}
                <div>
                  <div className="rcp-r-row">
                    <span>RECEIPT: #INV-0024</span>
                    {config.meta.showTokenNo && <span>{config.meta.tokenPrefix}14</span>}
                  </div>
                  {config.meta.showDateTime && (
                    <div className="rcp-r-row rcp-r-small">
                      <span>{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      <span>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  )}
                  {config.meta.showCashier && (
                    <div className="rcp-r-small">Cashier: {config.meta.cashierName}</div>
                  )}
                  {config.meta.showCustomer && (
                    <div className="rcp-r-small">Cust: Walk-in · +91 98765 43210</div>
                  )}

                  {/* Top / Customer Custom Fields */}
                  {config.fields.filter((f) => f.show && f.placement === "customer" && f.label.trim()).map((f) => (
                    <div key={f.id} className="rcp-r-row rcp-r-small">
                      <span className="rcp-r-bold">{f.label}:</span>
                      <span>{f.value || (f.mode === "fixed" ? f.value : "Filled on POS")}</span>
                    </div>
                  ))}
                </div>

                <div className="rcp-r-divider" />

                {/* Items Table */}
                <table className="rcp-r-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Item</th>
                      <th style={{ textAlign: "center", width: is80mm ? "36px" : "28px" }}>Qty</th>
                      {config.items.showRate && is80mm && (
                        <th style={{ textAlign: "right", width: "50px" }}>Rate</th>
                      )}
                      <th style={{ textAlign: "right", width: is80mm ? "64px" : "50px" }}>Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayItems.map((it, idx) => (
                      <React.Fragment key={idx}>
                        <tr>
                          <td>
                            <div className="rcp-r-bold">{it.name}</div>
                            {config.items.showCode && (
                              <div className="rcp-r-small">{it.code}</div>
                            )}
                            {/* Item Custom Fields */}
                            {config.fields.filter((f) => f.show && f.placement === "item" && f.label.trim()).map((f) => (
                              <div key={f.id} className="rcp-r-small" style={{ opacity: 0.85 }}>
                                • {f.label}: {getItemFieldValue(f, it)}
                              </div>
                            ))}
                          </td>
                          <td style={{ textAlign: "center" }}>{it.qty}</td>
                          {config.items.showRate && is80mm && (
                            <td style={{ textAlign: "right" }}>{it.rate.toFixed(2)}</td>
                          )}
                          <td style={{ textAlign: "right" }} className="rcp-r-bold">
                            {(it.rate * it.qty).toFixed(2)}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>

                {/* Below items custom fields */}
                {config.fields.filter((f) => f.show && f.placement === "below" && f.label.trim()).length > 0 && (
                  <>
                    <div className="rcp-r-divider" />
                    <div className="space-y-0.5">
                      {config.fields.filter((f) => f.show && f.placement === "below" && f.label.trim()).map((f) => (
                        <div key={f.id} className="rcp-r-row rcp-r-small">
                          <span>{f.label}:</span>
                          <span className="rcp-r-bold">{f.value || "Filled on POS"}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="rcp-r-divider" />

                {/* Totals Section */}
                <div className="space-y-1">
                  <div className="rcp-r-row">
                    <span>Subtotal:</span>
                    <span>₹{subTotal.toFixed(2)}</span>
                  </div>

                  {config.tax.showTaxBreakup && (
                    <>
                      <div className="rcp-r-row rcp-r-small">
                        <span>Taxable Value:</span>
                        <span>₹{taxableAmount.toFixed(2)}</span>
                      </div>
                      <div className="rcp-r-row rcp-r-small">
                        <span>Total GST:</span>
                        <span>₹{taxAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {config.items.showDiscount && savings > 0 && (
                    <div className="rcp-r-row rcp-r-bold" style={{ color: "#000" }}>
                      <span>You Saved:</span>
                      <span>-₹{savings.toFixed(2)}</span>
                    </div>
                  )}

                  <div className={config.templateId === "classic" ? "rcp-r-divider-double" : "rcp-r-divider"} />

                  <div className="rcp-r-row rcp-r-double">
                    <span>NET TOTAL:</span>
                    <span>₹{subTotal.toFixed(2)}</span>
                  </div>

                  {config.tax.showWords && (
                    <div className="rcp-r-small" style={{ fontStyle: "italic", marginTop: 2 }}>
                      {numberToWords(subTotal)}
                    </div>
                  )}

                  <div className="rcp-r-row rcp-r-small" style={{ marginTop: 4 }}>
                    <span>Payment Mode:</span>
                    <span className="rcp-r-bold">UPI / Cash</span>
                  </div>
                </div>

                {/* QR Codes */}
                {((config.qr.upi && config.qr.upiId) || (config.qr.store && config.qr.storeUrl)) && (
                  <>
                    <div className="rcp-r-divider" />
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, margin: "6px 0" }}>
                      {config.qr.upi && config.qr.upiId && (
                        <div className="rcp-r-center">
                          <QRCodeSVG
                            value={`upi://pay?pa=${encodeURIComponent(config.qr.upiId)}&pn=${encodeURIComponent(shopName)}&am=${subTotal.toFixed(2)}&cu=INR`}
                            size={is80mm ? 90 : 76}
                            level="M"
                          />
                          <div className="rcp-r-bold rcp-r-small" style={{ marginTop: 4 }}>
                            {config.qr.upiCap || "Scan & Pay via UPI"}
                          </div>
                          <div className="rcp-r-small">{config.qr.upiId}</div>
                        </div>
                      )}

                      {config.qr.store && config.qr.storeUrl && (
                        <div className="rcp-r-center">
                          <QRCodeSVG value={config.qr.storeUrl} size={is80mm ? 80 : 70} level="M" />
                          <div className="rcp-r-bold rcp-r-small" style={{ marginTop: 4 }}>
                            {config.qr.storeCap || "Scan to Order Online"}
                          </div>
                          <div className="rcp-r-small">{config.qr.storeUrl.replace(/^https?:\/\//, "")}</div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Footer Message */}
                {(config.footer.thanks || config.footer.terms) && (
                  <>
                    <div className="rcp-r-divider" />
                    <div className="rcp-r-center space-y-1">
                      {config.footer.thanks && (
                        <div className="rcp-r-bold rcp-r-small">{config.footer.thanks}</div>
                      )}
                      {config.footer.terms && (
                        <div className="rcp-r-small">{config.footer.terms}</div>
                      )}
                    </div>
                  </>
                )}

                {/* Tear-off cut line */}
                {config.footer.showTearLine && (
                  <div style={{ textAlign: "center", margin: "10px 0 4px", fontSize: 10, opacity: 0.6 }}>
                    - - - - - - - - - - - - - - - - - - - - -
                    <div style={{ fontSize: 9 }}>Tear here</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Floating Save Bar when dirty */}
      <div className={`rcp-savebar ${hasChanges ? "show" : ""}`} role="region" aria-label="Unsaved changes">
        <div className="rcp-savebar-in">
          <div>
            <b>Unsaved changes</b> <span>in billing receipt settings</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="rcp-btn ghost" onClick={handleDiscard}>
              Discard
            </button>
            <button type="button" className="rcp-btn primary" onClick={handleSave}>
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BillingReceiptTemplateSettings;
