import React, { useState, useEffect, useMemo } from "react";
import {
  Printer,
  FileText,
  QrCode,
  Store,
  Layers,
  Check,
  ChevronDown,
  ChevronUp,
  Sliders,
  DollarSign,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/context/ToastContext";
import { shopApi } from "@/services/api/shop";
import { inventoryApi } from "@/services/api/inventory";
import { getShopId, SHOP_ID } from "@/services/endpoints";
import { getPrinterConfig, savePrinterConfig, getBillingReceiptConfig, saveBillingReceiptConfig, getBillingReceiptStorageKey, type PaperWidth } from "@/features/billing/utils/printerService";
import { numberToWords, type FieldType, type FieldPlacement, type FieldMode, type ItemSource, type ItemShow, TYPES, ATTRS } from "./InvoiceTemplateSettings";
import { extractItemAttributeValue } from "@/features/billing/utils/customFieldsHelper";
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
    showComputerGenerated?: boolean;
  };
  fields: CustomField[];
}

export const STORAGE_KEY = "inventq.billingReceiptSettings.v1";
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

export const DEFAULT_CONFIG: BillingReceiptConfig = {
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
    showComputerGenerated: true,
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

const TEMPLATES: { id: ThermalTemplateId; name: string; desc: string; badge?: string }[] = [
  {
    id: "classic",
    name: "Classic B&W",
    desc: "Black and white with ruled lines. Saves ink on any printer.",
    badge: "New",
  },
  {
    id: "modern",
    name: "Modern Thermal",
    desc: "Clean structured layout with bold totals, dotted dividers & fast scan QR.",
    badge: "Popular",
  },
  {
    id: "compact",
    name: "Compact Roll Saver",
    desc: "High density item layout designed to minimize thermal paper usage.",
    badge: "Eco",
  },
  {
    id: "gst",
    name: "Detailed GST Tax Slip",
    desc: "Full tax breakdown with CGST, SGST, HSN codes and B2C QR.",
    badge: "Tax",
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
  const [config, setConfig] = useState<BillingReceiptConfig>(() => getBillingReceiptConfig(activeShopId));
  const [savedConfig, setSavedConfig] = useState<BillingReceiptConfig>(config);

  // Sync config when active shop changes
  useEffect(() => {
    const loaded = getBillingReceiptConfig(activeShopId);
    setConfig(loaded);
    setSavedConfig(loaded);
  }, [activeShopId]);

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

      inventoryApi.getInventoriesByShop(activeShopId, { limit: "6" }).then((res) => {
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
        batch_no: it.batch_number || it.batch || "B-101",
        expiryDate: it.expiry_date || "12/28",
        expiry_date: it.expiry_date || "12/28",
        hsn: it.hsn_code || "8471",
        hsn_code: it.hsn_code || "8471",
        selectedUnit: it.unit || "pc",
        unit: it.unit || "pc",
      }));
    }
    return [
      { name: "Premium Basmati Rice 1kg", code: "RIC-01", qty: 2, rate: 140, mrp: 160, gstRate: 5, batch: "B-204", batch_no: "B-204", expiryDate: "10/27", expiry_date: "10/27", hsn: "1006", hsn_code: "1006", unit: "1 kg", selectedUnit: "1 kg", manufacturer: "India Gate" },
      { name: "Cold Pressed Coconut Oil 500ml", code: "OIL-02", qty: 1, rate: 210, mrp: 240, gstRate: 12, batch: "B-509", batch_no: "B-509", expiryDate: "06/28", expiry_date: "06/28", hsn: "1513", hsn_code: "1513", unit: "500 ml", selectedUnit: "500 ml", manufacturer: "KLF" },
      { name: "Roasted Almonds 200g", code: "ALM-03", qty: 1, rate: 180, mrp: 200, gstRate: 18, batch: "B-311", batch_no: "B-311", expiryDate: "09/27", expiry_date: "09/27", hsn: "2008", hsn_code: "2008", unit: "200 g", selectedUnit: "200 g", manufacturer: "Nutraj" },
    ];
  }, [realItems]);

  const subTotal = useMemo(() => displayItems.reduce((acc: number, it: any) => acc + (Number(it.rate) || 0) * (Number(it.qty) || 1), 0), [displayItems]);
  const totalMrp = useMemo(() => displayItems.reduce((acc: number, it: any) => acc + (Number(it.mrp) || 0) * (Number(it.qty) || 1), 0), [displayItems]);
  const savings = Math.max(0, totalMrp - subTotal);
  const taxAmount = useMemo(() => {
    return displayItems.reduce((acc: number, it: any) => {
      const lineTotal = (Number(it.rate) || 0) * (Number(it.qty) || 1);
      const base = lineTotal / (1 + (Number(it.gstRate) || 0) / 100);
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
      itemShow: "column",
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
          updated.itemShow = updated.itemShow || "column";
        }
        if (updates.mode === "fixed") {
          updated.required = false;
        }
        if (updates.itemSource === "product") {
          updated.required = false;
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



  // Has changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(savedConfig);
  }, [config, savedConfig]);

  const handleSave = () => {
    try {
      saveBillingReceiptConfig(config, activeShopId);
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
          {/* Card 1: Thermal Paper Width */}
          <div className="rcp-card">
            <div className="rcp-card-h">
              <div>
                <h2>
                  <Layers size={16} className="text-emerald-700" />
                  Thermal Paper Width
                </h2>
                <p>Choose your physical thermal printer roll size: 80 mm counter roll vs 58 mm compact roll.</p>
              </div>
            </div>

            {/* Width Selector */}
            <div className="rcp-width-grid" style={{ marginBottom: 0 }}>
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
          </div>

          {/* Card 1b: Receipt Layout & Style */}
          <div className="rcp-card">
            <div className="rcp-card-h">
              <div>
                <h2>
                  <FileText size={16} className="text-emerald-700" />
                  Receipt Layout & Style
                </h2>
                <p>Choose your receipt visual layout and formatting style.</p>
              </div>
            </div>

            {/* Template Selector Grid (With visual thumbnails matching user design) */}
            <div className="inv-tpl-grid" role="radiogroup" aria-label="Receipt template">
              {TEMPLATES.map((tmpl) => {
                const isSelected = config.templateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    className={`inv-tpl ${isSelected ? "active" : ""}`}
                    onClick={() => setConfig((prev) => ({ ...prev, templateId: tmpl.id }))}
                  >
                    <div className="thumb">
                      <div className={`mini ${config.paperWidth === "58mm" ? "th" : ""}`}>
                        {tmpl.id === "modern" ? (
                          <i className="h" />
                        ) : tmpl.id === "classic" ? (
                          <i className="k" />
                        ) : null}
                        <i style={{ width: "60%" }} />
                        <i />
                        <i />
                        <i style={{ width: "80%" }} />
                        <i />
                        {tmpl.id === "classic" ? <i className="k" /> : null}
                        <i style={{ width: "40%", alignSelf: "flex-end" }} />
                      </div>
                    </div>
                    <div className="mt-1">
                      <div className="flex items-center justify-between">
                        <b>{tmpl.name}</b>
                        {tmpl.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                            {tmpl.badge}
                          </span>
                        )}
                      </div>
                      <small>{tmpl.desc}</small>
                    </div>
                    <span className="sel">{isSelected ? "✓ In use" : "\u00A0"}</span>
                  </button>
                );
              })}
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
                          {field.placement === "item" && field.itemShow === "column" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                              Column
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
                        <div className="inv-fedit">
                          <div className={field.placement === "item" && field.itemSource === "product" ? "" : "inv-grid2"}>
                            <label className="inv-fld">
                              <span>Field name</span>
                              <input
                                className="inv-in"
                                value={field.label}
                                maxLength={30}
                                placeholder="e.g. Doctor name, Table No, Serial"
                                onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                              />
                            </label>
                            {!(field.placement === "item" && field.itemSource === "product") && (
                              <div className="inv-fld">
                                <span>Type of value</span>
                                <ReusableSelect
                                  options={Object.entries(TYPES).map(([k, v]) => ({ label: v, value: k }))}
                                  value={field.type}
                                  onValueChange={(val) => handleUpdateField(field.id, { type: val as FieldType, value: "" })}
                                  size="sm"
                                />
                              </div>
                            )}
                          </div>

                          {/* Where on the receipt */}
                          <div className="inv-fld">
                            <span>Where on the receipt</span>
                            <div className="inv-place">
                              <label
                                className={field.placement === "customer" ? "active" : ""}
                                onClick={() => handleUpdateField(field.id, { placement: "customer" })}
                              >
                                <span className="pic">
                                  <span className="r">
                                    <i />
                                    <i className="on" />
                                  </span>
                                  <i />
                                  <i />
                                </span>
                                Top, with customer
                              </label>
                              <label
                                className={field.placement === "item" ? "active" : ""}
                                onClick={() => handleUpdateField(field.id, { placement: "item" })}
                              >
                                <span className="pic">
                                  <span className="r">
                                    <i />
                                    <i />
                                  </span>
                                  <span className="r">
                                    <i />
                                    <i className="on" style={{ flex: 0.5 }} />
                                    <i />
                                  </span>
                                  <span className="r">
                                    <i />
                                    <i className="on" style={{ flex: 0.5 }} />
                                    <i />
                                  </span>
                                </span>
                                With each item
                              </label>
                              <label
                                className={field.placement === "below" ? "active" : ""}
                                onClick={() => handleUpdateField(field.id, { placement: "below" })}
                              >
                                <span className="pic">
                                  <span className="r">
                                    <i />
                                    <i />
                                  </span>
                                  <i />
                                  <i className="on" style={{ width: "55%" }} />
                                </span>
                                Below the items
                              </label>
                            </div>
                          </div>

                          {/* Placement specific options */}
                          {field.placement === "item" ? (
                            <>
                              <div className="inv-fld">
                                <span>Where does the value come from?</span>
                                <div className="inv-seg">
                                  <label
                                    className={field.itemSource === "product" ? "active" : ""}
                                    onClick={() => handleUpdateField(field.id, { itemSource: "product", attr: field.attr || "batch", required: false })}
                                  >
                                    <input type="radio" checked={field.itemSource === "product"} readOnly />
                                    <span>
                                      <b>From product details</b>
                                      <small>Filled automatically from the product or batch you sell.</small>
                                    </span>
                                  </label>
                                  <label
                                    className={`askopt ${field.itemSource === "ask" ? "active" : ""}`}
                                    onClick={() => handleUpdateField(field.id, { itemSource: "ask" })}
                                  >
                                    <input type="radio" checked={field.itemSource === "ask"} readOnly />
                                    <span>
                                      <b>Ask for each item</b>
                                      <small>Staff type it per item, like a serial number.</small>
                                    </span>
                                  </label>
                                </div>
                              </div>

                              {field.itemSource === "product" ? (
                                <div className="inv-fld">
                                  <span>Product detail to print</span>
                                  <ReusableSelect
                                    options={Object.entries(ATTRS).map(([k, v]) => ({ label: v, value: k }))}
                                    value={field.attr || "batch"}
                                    onValueChange={(val) => {
                                      const newAttr = val as any;
                                      const oldLabel = ATTRS[field.attr || ""];
                                      const shouldUpdateLabel =
                                        !field.label.trim() || field.label === oldLabel || Object.values(ATTRS).includes(field.label);
                                      handleUpdateField(field.id, {
                                        attr: newAttr,
                                        label: shouldUpdateLabel ? ATTRS[newAttr] : field.label,
                                      });
                                    }}
                                    size="sm"
                                  />
                                </div>
                              ) : (
                                <label className="inv-check">
                                  <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                                  />
                                  Must be filled for every item before saving the bill
                                </label>
                              )}

                              <div className="inv-fld">
                                <span>Show it as</span>
                                <div className="inv-seg">
                                  <label
                                    className={field.itemShow === "column" ? "active" : ""}
                                    onClick={() => handleUpdateField(field.id, { itemShow: "column" })}
                                  >
                                    <input type="radio" checked={field.itemShow === "column"} readOnly />
                                    <span>
                                      <b>Its own column</b>
                                      <small>Easy to scan. Best for short values like batch and expiry.</small>
                                    </span>
                                  </label>
                                  <label
                                    className={field.itemShow === "under" ? "active" : ""}
                                    onClick={() => handleUpdateField(field.id, { itemShow: "under" })}
                                  >
                                    <input type="radio" checked={field.itemShow === "under"} readOnly />
                                    <span>
                                      <b>Under the item name</b>
                                      <small>Saves space. Good for longer values.</small>
                                    </span>
                                  </label>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="inv-fld">
                                <span>How is the value filled?</span>
                                <div className="inv-seg">
                                  <label
                                    className={field.mode === "fixed" ? "active" : ""}
                                    onClick={() => handleUpdateField(field.id, { mode: "fixed", required: false })}
                                  >
                                    <input type="radio" checked={field.mode === "fixed"} readOnly />
                                    <span>
                                      <b>Same on every bill (fixed)</b>
                                      <small>Set it once here. Every bill prints it.</small>
                                    </span>
                                  </label>
                                  <label
                                    className={`askopt ${field.mode === "ask" ? "active" : ""}`}
                                    onClick={() => handleUpdateField(field.id, { mode: "ask" })}
                                  >
                                    <input type="radio" checked={field.mode === "ask"} readOnly />
                                    <span>
                                      <b>Ask on bill</b>
                                      <small>Staff type it when creating each bill.</small>
                                    </span>
                                  </label>
                                </div>
                              </div>

                              {field.mode === "fixed" ? (
                                <>
                                  <label className="inv-fld">
                                    <span>Value printed on every bill</span>
                                    <input
                                      className="inv-in"
                                      value={field.value}
                                      maxLength={60}
                                      placeholder="Type the value"
                                      onChange={(e) => handleUpdateField(field.id, { value: e.target.value })}
                                    />
                                  </label>
                                  {!field.value && (
                                    <div className="inv-err-msg">This field is hidden on bills until you add a value.</div>
                                  )}
                                </>
                              ) : (
                                <div className="inv-grid2">
                                  <label className="inv-fld">
                                    <span>Default value (optional)</span>
                                    <input
                                      className="inv-in"
                                      value={field.value}
                                      maxLength={60}
                                      placeholder="Leave blank to ask fresh"
                                      onChange={(e) => handleUpdateField(field.id, { value: e.target.value })}
                                    />
                                  </label>
                                  <div className="inv-fld">
                                    <span>When billing</span>
                                    <label className="inv-check" style={{ minHeight: 36 }}>
                                      <input
                                        type="checkbox"
                                        checked={field.required}
                                        onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                                      />
                                      Must be filled before saving
                                    </label>
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                          <div className="inv-fedit-foot">
                            <button
                              type="button"
                              className="inv-btn ghost sm danger"
                              onClick={() => handleDeleteField(field.id, field.label)}
                            >
                              <Trash2 size={14} /> Delete field
                            </button>
                            <button
                              type="button"
                              className="inv-btn sm"
                              onClick={() => setOpenFieldId(null)}
                            >
                              Done
                            </button>
                          </div>
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

              <div className="rcp-switch-row">
                <div className="rcp-switch-label">
                  <span>Show Computer-Generated Notice</span>
                  <small>Print "THIS IS A COMPUTER-GENERATED RECEIPT AND DOES NOT REQUIRE A PHYSICAL SIGNATURE." at the bottom</small>
                </div>
                <label className="rcp-switch">
                  <input
                    type="checkbox"
                    checked={config.footer.showComputerGenerated !== false}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        footer: { ...prev.footer, showComputerGenerated: e.target.checked },
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
                {(() => {
                  const itemColFields = config.fields.filter(
                    (f) => f.show && f.placement === "item" && f.itemShow === "column" && f.label.trim()
                  );
                  const itemUnderFields = config.fields.filter(
                    (f) => f.show && f.placement === "item" && f.itemShow !== "column" && f.label.trim()
                  );

                  return (
                    <table className="rcp-r-table">
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left" }}>Item</th>
                          {itemColFields.map((f) => (
                            <th key={f.id} style={{ textAlign: "center", fontSize: "10px" }}>
                              {f.label}
                            </th>
                          ))}
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
                                {/* Item Custom Fields Under Name */}
                                {itemUnderFields.map((f) => (
                                  <div key={f.id} className="rcp-r-small" style={{ opacity: 0.85 }}>
                                    • {f.label}: {extractItemAttributeValue(f, it, idx)}
                                  </div>
                                ))}
                              </td>
                              {itemColFields.map((f) => (
                                <td key={f.id} style={{ textAlign: "center", fontSize: "10px" }}>
                                  {extractItemAttributeValue(f, it, idx)}
                                </td>
                              ))}
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
                  );
                })()}

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
                    <div className="rcp-qr-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, margin: "6px 0", width: "100%", textAlign: "center" }}>
                      {config.qr.upi && config.qr.upiId && (
                        <div className="rcp-qr-block rcp-r-center" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", textAlign: "center" }}>
                          <div className="rcp-qr-box" style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", margin: "0 auto" }}>
                            <QRCodeSVG
                              value={`upi://pay?pa=${encodeURIComponent(config.qr.upiId)}&pn=${encodeURIComponent(shopName)}&am=${subTotal.toFixed(2)}&cu=INR`}
                              size={is80mm ? 90 : 76}
                              level="M"
                              style={{ display: "block", margin: "0 auto" }}
                            />
                          </div>
                          <div className="rcp-r-bold rcp-r-small" style={{ marginTop: 4, textAlign: "center", width: "100%" }}>
                            {config.qr.upiCap || "Scan & Pay via UPI"}
                          </div>
                          <div className="rcp-r-small" style={{ textAlign: "center", wordBreak: "break-all", width: "100%" }}>{config.qr.upiId}</div>
                        </div>
                      )}

                      {config.qr.store && config.qr.storeUrl && (
                        <div className="rcp-qr-block rcp-r-center" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", textAlign: "center" }}>
                          <div className="rcp-qr-box" style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", margin: "0 auto" }}>
                            <QRCodeSVG
                              value={config.qr.storeUrl}
                              size={is80mm ? 80 : 70}
                              level="M"
                              style={{ display: "block", margin: "0 auto" }}
                            />
                          </div>
                          <div className="rcp-r-bold rcp-r-small" style={{ marginTop: 4, textAlign: "center", width: "100%" }}>
                            {config.qr.storeCap || "Scan to Order Online"}
                          </div>
                          <div className="rcp-r-small" style={{ textAlign: "center", wordBreak: "break-all", width: "100%" }}>{config.qr.storeUrl.replace(/^https?:\/\//, "")}</div>
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

                {config.footer.showComputerGenerated !== false && (
                  <div style={{ textAlign: "center", textTransform: "uppercase", fontSize: 8, opacity: 0.6, letterSpacing: "0.05em", marginTop: 8 }}>
                    This is a computer-generated receipt and does not require a physical signature.
                  </div>
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
