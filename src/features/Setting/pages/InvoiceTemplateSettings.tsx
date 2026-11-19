import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  FileText,
  Info,
  RotateCcw,
  Upload,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/context/ToastContext";
import { InvoiceRenderer } from "../../billing/components/InvoiceRenderer";
import type { BillingItem } from "../../billing/types";
import { shopApi } from "@/services/api/shop";
import { inventoryApi } from "@/services/api/inventory";
import { getShopId, SHOP_ID } from "@/services/endpoints";
import "./InvoiceSettings.css";

// ── Types ─────────────────────────────────────────────────────────────
export type FieldPlacement = "customer" | "item" | "below";
export type FieldType = "text" | "number" | "date" | "phone";
export type FieldMode = "fixed" | "ask";
export type ItemSource = "product" | "ask";
export type ItemShow = "column" | "under";
export type SigMode = "upload" | "draw" | "type";

export interface CustomField {
  id: string;
  label: string;
  type: FieldType;
  mode: FieldMode;
  value: string;
  required: boolean;
  placement: FieldPlacement;
  itemSource?: ItemSource;
  attr?: "batch" | "expiry" | "hsn" | "mrp" | "mfr" | "pack" | "size";
  itemShow?: ItemShow;
  show: boolean;
}

export interface SignatureSettings {
  show: boolean;
  mode: SigMode;
  image: string;
  drawn: string;
  name: string;
  desig: string;
  label: string;
}

export interface QrSettings {
  store: boolean;
  storeUrl: string;
  storeCap: string;
  upi: boolean;
  upiId: string;
  upiCap: string;
}

export interface FooterSettings {
  thanks: string;
  termsShow: boolean;
  terms: string;
  words: boolean;
}

export interface InvoiceSettingsData {
  fields: CustomField[];
  sig: SignatureSettings;
  qr: QrSettings;
  footer: FooterSettings;
  template: string;
}

// ── Constants & Helpers ────────────────────────────────────────────────
const MAX_FIELDS = 10;
const MAX_ITEM_COLS = 3;
const STORAGE_KEY = "inventq.invoiceSettings.v2";

const uid = () => "f" + Math.random().toString(36).slice(2, 8);

const BASE_FIELD: Omit<CustomField, "id" | "label" | "show"> = {
  type: "text",
  mode: "ask",
  value: "",
  required: false,
  placement: "customer",
  itemSource: "product",
  attr: "batch",
  itemShow: "column",
};

export const TYPES: Record<FieldType, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  phone: "Phone number",
};

export const ATTRS: Record<string, string> = {
  batch: "Batch no",
  expiry: "Expiry date",
  hsn: "HSN code",
  mrp: "MRP",
  mfr: "Manufacturer",
  pack: "Pack size",
  size: "Size / colour",
};

export const TEMPLATES = [
  {
    id: "minimal",
    name: "Minimal Editorial",
    desc: "Vibrant modern editorial with refined color accents.",
    size: "A4 (210 × 297 mm). Standard clean invoice.",
    badge: "Classic",
    isRenderer: true,
  },
  {
    id: "modern",
    name: "Modern Executive",
    desc: "Premium dark slate business identity with sharp typography.",
    size: "A4 (210 × 297 mm). Professional executive layout.",
    badge: "Classic",
    isRenderer: true,
  },
  {
    id: "forestGreen",
    name: "Forest Green Premium",
    desc: "Sophisticated deep green & gold executive theme.",
    size: "A4 (210 × 297 mm). Corporate & premium retail.",
    badge: "Classic",
    isRenderer: true,
  },
  {
    id: "inventq",
    name: "Modern InventQ",
    desc: "Clean, colourful editorial A4 bill with custom fields & live QR.",
    size: "A4 (210 × 297 mm). Best for laser and inkjet printers.",
    badge: "New",
    isRenderer: false,
  },
  {
    id: "classic",
    name: "Classic B&W",
    desc: "Black and white with ruled lines. Saves ink on any printer.",
    size: "A4 (210 × 297 mm). Saves ink on inkjet printers.",
    badge: "New",
    isRenderer: false,
  },
  {
    id: "thermal",
    name: "Thermal 80 mm",
    desc: "Narrow receipt for counter thermal receipt roll printers.",
    size: "80 mm roll. For thermal receipt printers at the counter.",
    badge: "New",
    isRenderer: false,
  },
];

const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function numberToWords(n: number): string {
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (x: number) => (x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? " " + a[x % 10] : ""));
  const three = (x: number) =>
    (x >= 100 ? a[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " : "") : "") + (x % 100 ? two(x % 100) : "");

  let r = Math.floor(n);
  const p = Math.round((n - r) * 100);
  const out: string[] = [];

  const cr = Math.floor(r / 1e7);
  r %= 1e7;
  const lk = Math.floor(r / 1e5);
  r %= 1e5;
  const th = Math.floor(r / 1e3);
  r %= 1e3;

  if (cr) out.push(two(cr) + " Crore");
  if (lk) out.push(two(lk) + " Lakh");
  if (th) out.push(two(th) + " Thousand");
  if (r) out.push(three(r));

  return "Rupees " + (out.join(" ") || "Zero") + (p ? " and " + two(p) + " Paise" : "") + " Only";
}

const isUpiValid = (upi: string) => /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upi.trim());

// ── Main Component ───────────────────────────────────────────────────
export const InvoiceTemplateSettings: React.FC = () => {
  const { showToast } = useToast();
  const activeShopId = getShopId() || SHOP_ID;

  // Real shop data state
  const [shopData, setShopData] = useState<any>(null);
  const [realItems, setRealItems] = useState<any[]>([]);

  // State for settings
  const [savedState, setSavedState] = useState<InvoiceSettingsData>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) return JSON.parse(s);
      const legacyTmpl = localStorage.getItem("invoice_template");
      return {
        fields: [],
        sig: {
          show: true,
          mode: "type",
          image: "",
          drawn: "",
          name: localStorage.getItem("user_name") || "",
          desig: "Proprietor",
          label: "Authorised Signatory",
        },
        qr: {
          store: true,
          storeUrl: `${window.location.origin}/store/${activeShopId || ""}`,
          storeCap: "Scan to order online",
          upi: false,
          upiId: "",
          upiCap: "Scan to pay with UPI",
        },
        footer: {
          thanks: "Thank you for your business!",
          termsShow: true,
          terms: "Goods once sold can be exchanged within 7 days with original invoice.",
          words: true,
        },
        template: legacyTmpl || "minimal",
      };
    } catch (_) {}
    return {
      fields: [],
      sig: {
        show: true,
        mode: "type",
        image: "",
        drawn: "",
        name: "",
        desig: "Proprietor",
        label: "Authorised Signatory",
      },
      qr: {
        store: true,
        storeUrl: `${window.location.origin}/store/${activeShopId || ""}`,
        storeCap: "Scan to order online",
        upi: false,
        upiId: "",
        upiCap: "Scan to pay with UPI",
      },
      footer: {
        thanks: "Thank you for your business!",
        termsShow: true,
        terms: "Goods once sold can be exchanged within 7 days with original invoice.",
        words: true,
      },
      template: "minimal",
    };
  });

  const [state, setState] = useState<InvoiceSettingsData>(savedState);
  const [activeTab, setActiveTab] = useState<"details" | "templates">("details");
  const [openFieldId, setOpenFieldId] = useState<string | null>(null);
  const [testBill, setTestBill] = useState<{ bill: Record<string, string>; items: Record<string, string>[] } | null>(null);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [sigUploadError, setSigUploadError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Pad canvas drawing refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const hasInkedRef = useRef(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const paperRef = useRef<HTMLDivElement | null>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stageMargin, setStageMargin] = useState(0);

  // Fetch real shop & inventory data
  useEffect(() => {
    let isMounted = true;
    const fetchShopAndInventory = async () => {
      try {
        const currentShopId = getShopId() || SHOP_ID;
        if (!currentShopId) return;

        const [shopRes, invRes] = await Promise.allSettled([
          shopApi.getShopById(currentShopId),
          inventoryApi.getInventoriesByShop(currentShopId, { limit: "6", active: "true" }),
        ]);

        if (!isMounted) return;

        if (shopRes.status === "fulfilled") {
          const raw = shopRes.value?.data ?? shopRes.value;
          if (raw) {
            setShopData(raw);
            // If storeUrl is default, update with real store URL
            setState((prev) => {
              const realUrl = raw.additional_infos?.website || `${window.location.origin}/store/${raw.id || currentShopId}`;
              const realUpi = raw.additional_infos?.upi_id || raw.upi_id || prev.qr.upiId || "";
              const realSigName = prev.sig.name || raw.owner_name || localStorage.getItem("user_name") || "";
              return {
                ...prev,
                sig: {
                  ...prev.sig,
                  name: realSigName,
                },
                qr: {
                  ...prev.qr,
                  storeUrl: prev.qr.storeUrl.includes("acme-corp") ? realUrl : prev.qr.storeUrl || realUrl,
                  upiId: prev.qr.upiId.includes("acmecorp") ? realUpi : prev.qr.upiId || realUpi,
                },
              };
            });
          }
        }

        if (invRes.status === "fulfilled") {
          const invData = invRes.value?.data?.items ?? invRes.value?.data ?? invRes.value?.items ?? [];
          const list = Array.isArray(invData) ? invData : [];
          if (list.length > 0) {
            const mapped = list.slice(0, 4).map((it: any) => ({
              n: it.name || it.product_name || "Item",
              v: it.variant_name || "",
              sku: it.barcode || it.code || it.sku || `SKU-${it.id?.slice(0, 5) || "01"}`,
              rate: Number(it.sell_price || it.price || 100),
              qty: 1,
              gstp: Number(it.gst ?? it.gst_rate ?? 0),
              a: {
                batch: it.batch_no || it.batch || "",
                expiry: it.expiry_date || it.expiry || "",
                hsn: it.hsn_code || it.hsn || "",
                mrp: it.mrp ? String(it.mrp) : "",
                mfr: it.manufacturer || it.mfr || "",
                pack: it.unit_infos?.name || it.unit || "",
                size: it.variant_infos?.size || it.size || "",
              },
            }));
            setRealItems(mapped);
          }
        }
      } catch (err) {
        console.warn("Could not load real shop data in invoice settings:", err);
      }
    };

    fetchShopAndInventory();
    return () => {
      isMounted = false;
    };
  }, []);

  // Real display items (falls back to clean placeholder items if store has 0 products yet)
  const displayItems = useMemo(() => {
    if (realItems.length > 0) return realItems;
    return [
      {
        n: "Product Item 1",
        v: "Standard",
        sku: "PROD-001",
        rate: 150.0,
        qty: 1,
        gstp: 18,
        a: { batch: "B-101", expiry: "12/27", hsn: "8471", mrp: "180.00", mfr: "", pack: "1 pc", size: "" },
      },
      {
        n: "Product Item 2",
        v: "",
        sku: "PROD-002",
        rate: 250.0,
        qty: 2,
        gstp: 18,
        a: { batch: "B-102", expiry: "06/28", hsn: "8471", mrp: "280.00", mfr: "", pack: "1 pc", size: "" },
      },
    ];
  }, [realItems]);

  // Real shop info
  const shopName = shopData?.name || localStorage.getItem("shop_name") || "My Store";
  const shopType = shopData?.category_infos?.name || shopData?.business_category || "Retail & Trade";
  const shopGst =
    shopData?.business_infos?.gst_infos?.number || shopData?.gst_number || shopData?.business_infos?.gst_number || "";
  const shopAddr =
    shopData?.address?.full_address ||
    [shopData?.address?.street, shopData?.address?.city, shopData?.address?.state, shopData?.address?.pincode]
      .filter(Boolean)
      .join(", ") ||
    "Store Address";
  const shopPhone = shopData?.phone || shopData?.phone_number || shopData?.additional_infos?.phone || "";

  // Date and Time
  const todayDateStr = useMemo(() => {
    return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }, []);
  const todayTimeStr = useMemo(() => {
    return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }, []);
  const invoiceNumber = "INV-2026-001";

  // Calculations
  const sampleTotal = useMemo(() => displayItems.reduce((acc, it) => acc + it.rate * it.qty, 0), [displayItems]);
  const avgGstRate = displayItems[0]?.gstp || 0;
  const taxableAmount = sampleTotal / (1 + avgGstRate / 100);
  const totalGstAmount = sampleTotal - taxableAmount;

  // Selected template object
  const selectedTemplate = useMemo(() => {
    return TEMPLATES.find((t) => t.id === state.template) || TEMPLATES[0];
  }, [state.template]);

  // Real billing data mapped for InvoiceRenderer (Classic templates)
  const rendererBillingItems = useMemo<BillingItem[]>(() => {
    return displayItems.map((it, idx) => ({
      id: `it-${idx}`,
      name: it.n,
      qty: it.qty,
      price: it.rate,
      gst: it.gstp,
      tprice: it.rate * it.qty * (1 + it.gstp / 100),
      code: it.sku,
    })) as BillingItem[];
  }, [displayItems]);

  const rendererMockData = useMemo(() => {
    return {
      shopData: shopData || {
        name: shopName,
        category_infos: { name: shopType },
        address: { full_address: shopAddr },
        business_infos: { gst_infos: { number: shopGst } },
        visible_online: true,
      },
      orderId: invoiceNumber,
      dateStr: todayDateStr,
      timeStr: todayTimeStr,
      payments: [{ mode: "upi", amount: sampleTotal }],
      customerName: "Walk-in Customer",
      phone: "+91 98765 43210",
      items: rendererBillingItems,
      includeGst: Boolean(shopGst),
      totalAmount: taxableAmount,
      gstAmount: totalGstAmount,
      finalAmount: sampleTotal,
    };
  }, [shopData, shopName, shopType, shopAddr, shopGst, todayDateStr, todayTimeStr, sampleTotal, taxableAmount, totalGstAmount, rendererBillingItems]);

  // Diff count
  const diffCount = useMemo(() => {
    let count = 0;
    if (JSON.stringify(savedState.fields) !== JSON.stringify(state.fields)) count++;
    if (JSON.stringify(savedState.sig) !== JSON.stringify(state.sig)) count++;
    if (JSON.stringify(savedState.qr) !== JSON.stringify(state.qr)) count++;
    if (JSON.stringify(savedState.footer) !== JSON.stringify(state.footer)) count++;
    if (savedState.template !== state.template) count++;
    return count;
  }, [savedState, state]);

  const hasChanges = diffCount > 0;

  // Auto-fit preview stage
  const updateFit = useCallback(() => {
    if (!stageRef.current || !paperRef.current) return;
    const avail = stageRef.current.clientWidth - 32;
    const w = paperRef.current.offsetWidth || (state.template === "thermal" ? 310 : 720);
    const s = Math.min(1, avail / w);
    setStageScale(s);
    setStageMargin(s < 1 ? 0 : (avail - w) / 2);
  }, [state.template]);

  useEffect(() => {
    updateFit();
    window.addEventListener("resize", updateFit);
    return () => window.removeEventListener("resize", updateFit);
  }, [updateFit]);

  useEffect(() => {
    const timer = setTimeout(updateFit, 50);
    return () => clearTimeout(timer);
  }, [state.template, displayItems]);

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
  }, [hasChanges, state]);

  // Initial canvas setup when signature draw mode is open
  useEffect(() => {
    if (state.sig.mode === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1b2a6b";
      hasInkedRef.current = false;

      if (state.sig.drawn) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = state.sig.drawn;
      }
    }
  }, [state.sig.mode, state.sig.drawn]);

  // Flash highlight cleanup
  useEffect(() => {
    if (flashIds.size > 0) {
      const t = setTimeout(() => setFlashIds(new Set()), 1200);
      return () => clearTimeout(t);
    }
  }, [flashIds]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleSave = () => {
    if (state.qr.upi && !isUpiValid(state.qr.upiId)) {
      setActiveTab("details");
      showToast("Fix the UPI ID before saving", "error");
      return;
    }
    const blank = state.fields.find((f) => !f.label.trim());
    if (blank) {
      setActiveTab("details");
      setOpenFieldId(blank.id);
      showToast("Give every custom field a name", "error");
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem("invoice_template", state.template);
      setSavedState(state);
      showToast("Invoice settings saved successfully", "success");
    } catch (e) {
      showToast("Failed to save invoice settings", "error");
    }
  };

  const handleDiscard = () => {
    setState(savedState);
    setOpenFieldId(null);
    showToast("Changes discarded", "info");
  };

  const itemColIds = useMemo(() => {
    return state.fields
      .filter((f) => f.show && f.placement === "item" && f.itemShow === "column" && f.label.trim())
      .slice(0, MAX_ITEM_COLS)
      .map((f) => f.id);
  }, [state.fields]);

  // Custom Fields Operations
  const handleAddField = () => {
    if (state.fields.length >= MAX_FIELDS) return;
    const newField: CustomField = {
      ...BASE_FIELD,
      id: uid(),
      label: "",
      placement: "customer",
      show: true,
    };
    setState((prev) => ({ ...prev, fields: [...prev.fields, newField] }));
    setOpenFieldId(newField.id);
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= state.fields.length) return;
    const updated = [...state.fields];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setState((prev) => ({ ...prev, fields: updated }));
  };

  const handleDeleteField = (id: string, label: string) => {
    setState((prev) => ({ ...prev, fields: prev.fields.filter((f) => f.id !== id) }));
    if (openFieldId === id) setOpenFieldId(null);
    showToast(`“${label || "Field"}” deleted`, "info");
  };

  const handleUpdateField = (id: string, updates: Partial<CustomField>) => {
    setState((prev) => ({
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
    setFlashIds((prev) => new Set([...prev, id]));
  };

  // Signature file upload
  const handleFileUpload = (file?: File | null) => {
    setSigUploadError(null);
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      setSigUploadError("This file type isn't supported. Use a PNG or JPG image.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setSigUploadError(`Image size is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Use one under 1 MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setState((prev) => ({
        ...prev,
        sig: { ...prev.sig, image: String(reader.result) },
      }));
      showToast("Signature uploaded", "success");
    };
    reader.readAsDataURL(file);
  };

  // Canvas drawing handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    isDrawingRef.current = true;
    hasInkedRef.current = true;
    canvas.setPointerCapture(e.pointerId);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
  };

  const handleClearPad = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    hasInkedRef.current = false;
    setState((prev) => ({ ...prev, sig: { ...prev.sig, drawn: "" } }));
  };

  const handleSaveDrawnSig = () => {
    const canvas = canvasRef.current;
    if (!canvas || (!hasInkedRef.current && !state.sig.drawn)) {
      showToast("Draw your signature first", "info");
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = 0, y1 = 0;

    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        if (imgData[(y * w + x) * 4 + 3] > 10) {
          if (x < x0) x0 = x;
          if (y < y0) y0 = y;
          if (x > x1) x1 = x;
          if (y > y1) y1 = y;
        }
      }
    }

    if (x1 <= x0) {
      showToast("Draw your signature first", "info");
      return;
    }

    const margin = 8;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = x1 - x0 + margin * 2;
    tempCanvas.height = y1 - y0 + margin * 2;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.drawImage(canvas, x0 - margin, y0 - margin, tempCanvas.width, tempCanvas.height, 0, 0, tempCanvas.width, tempCanvas.height);
      const dataUrl = tempCanvas.toDataURL("image/png");
      setState((prev) => ({ ...prev, sig: { ...prev.sig, drawn: dataUrl } }));
      showToast("Signature added to the bill", "success");
    }
  };

  // Preview Helpers
  const sigSrc = state.sig.mode === "upload" ? state.sig.image : state.sig.mode === "draw" ? state.sig.drawn : "";

  const upiLink = useMemo(() => {
    return `upi://pay?pa=${encodeURIComponent(state.qr.upiId.trim())}&pn=${encodeURIComponent(shopName)}&am=${sampleTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(invoiceNumber)}`;
  }, [state.qr.upiId, shopName, sampleTotal, invoiceNumber]);

  const activeAsks = useMemo(() => {
    const billAsks = state.fields.filter((f) => f.show && f.placement !== "item" && f.mode === "ask" && f.label.trim());
    const itemAsks = state.fields.filter((f) => f.show && f.placement === "item" && f.itemSource === "ask" && f.label.trim());
    return { billAsks, itemAsks, total: billAsks.length + itemAsks.length };
  }, [state.fields]);

  const itemCols = useMemo(() => {
    return state.fields.filter((f) => f.show && f.placement === "item" && itemColIds.includes(f.id) && f.label.trim());
  }, [state.fields, itemColIds]);

  const itemUnder = useMemo(() => {
    return state.fields.filter((f) => f.show && f.placement === "item" && !itemColIds.includes(f.id) && f.label.trim());
  }, [state.fields, itemColIds]);

  const getItemValue = (f: CustomField, item: (typeof displayItems)[0], idx: number) => {
    if (f.itemSource === "product") {
      const val = (item.a as any)?.[f.attr || ""];
      return val ? String(val) : "—";
    }
    const testVal = testBill?.items?.[idx]?.[f.id];
    if (testVal !== undefined) return testVal ? testVal : "—";
    return <span className="inv-ph">Per item</span>;
  };

  const getCustomFieldValue = (f: CustomField) => {
    if (f.mode === "fixed") return f.value ? f.value : null;
    if (testBill && testBill.bill[f.id] !== undefined) {
      return testBill.bill[f.id] ? testBill.bill[f.id] : null;
    }
    return <span className="inv-ph">{f.value ? `Default: ${f.value}` : "Asked while billing"}</span>;
  };

  const renderFieldSummary = (f: CustomField) => {
    if (f.placement === "item") {
      const isCol = f.itemShow === "column" && itemColIds.includes(f.id);
      return (
        <>
          <span className="inv-tag item">Each item</span>
          {f.itemSource === "product" ? (
            <span className="inv-tag auto">From product · {ATTRS[f.attr || ""] || ""}</span>
          ) : (
            <>
              <span className="inv-tag ask">Asked for each item</span>
              {f.required && <span className="inv-tag req">Required</span>}
            </>
          )}
          <span>· {isCol ? "Own column" : "Under item name"}</span>
        </>
      );
    }
    const modeSpan =
      f.mode === "fixed" ? (
        <>
          <span className="inv-tag fixed">Same on every bill</span>
          <span className="truncate max-w-[150px]">{f.value ? f.value : <i>No value yet</i>}</span>
        </>
      ) : (
        <>
          <span className="inv-tag ask">Asked while billing</span>
          {f.required && <span className="inv-tag req">Required</span>}
          {f.value && <span className="truncate max-w-[150px]">Default: {f.value}</span>}
        </>
      );
    return (
      <>
        {modeSpan}
        <span>· {f.placement === "customer" ? "Top" : "Below items"}</span>
      </>
    );
  };

  return (
    <div className="inv-settings-root w-full">
      {/* Top Header & Tab Navigation */}
      <div className="inv-top">
        <div className="inv-crumb">
          <b>inventQ</b>
          <span>/</span>
          <span>Settings</span>
          <span>/</span>
          <span>Invoice</span>
        </div>
        <div className="inv-title-row">
          <h1 className="inv-title">Invoice settings</h1>
          <span className="inv-hint">{hasChanges ? "Not saved yet" : "All changes saved"}</span>
        </div>
        <div className="inv-tabs" role="tablist">
          <button
            className="inv-tab"
            role="tab"
            aria-selected={activeTab === "details"}
            onClick={() => setActiveTab("details")}
          >
            Bill details <span className="inv-n">{state.fields.length}</span>
          </button>
          <button
            className="inv-tab"
            role="tab"
            aria-selected={activeTab === "templates"}
            onClick={() => setActiveTab("templates")}
          >
            Templates
          </button>
        </div>
      </div>

      {/* Main Wrap: 2 Column Layout */}
      <div className="inv-wrap">
        {/* Left Column: Settings Cards */}
        <div className="inv-col">
          {activeTab === "details" ? (
            <>
              {/* Card 1: Custom Fields */}
              <div className="inv-card">
                <div className="inv-card-h">
                  <div>
                    <h2>Custom fields</h2>
                    <p>
                      Add your own details to bills: at the top (e.g. Doctor / Salesperson), with each item (Batch no, Expiry, Serial no) or below items. Product details populate automatically from inventory.
                    </p>
                  </div>
                </div>
                <div className="inv-card-b">
                  {/* List of Custom Fields */}
                  <div className="inv-flist">
                    {state.fields.length === 0 ? (
                      <div className="inv-empty">No custom fields added yet. Click "+ Add custom field" below.</div>
                    ) : (
                      state.fields.map((field, idx) => {
                        const isOpen = openFieldId === field.id;
                        return (
                          <div
                            key={field.id}
                            className={`inv-frow ${isOpen ? "open" : ""} ${field.show ? "" : "hidden-on-bill"}`}
                          >
                            <div className="inv-fsum">
                              <button
                                type="button"
                                className="inv-fsum-main"
                                onClick={() => setOpenFieldId(isOpen ? null : field.id)}
                              >
                                <span className="inv-fsum-name">{field.label || <i>Untitled field</i>}</span>
                                <span className="inv-fsum-meta">{renderFieldSummary(field)}</span>
                              </button>
                              <div className="inv-fact">
                                <button
                                  type="button"
                                  className="inv-btn icon ghost"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveField(idx, "up")}
                                  title="Move up"
                                >
                                  <ArrowUp size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="inv-btn icon ghost"
                                  disabled={idx === state.fields.length - 1}
                                  onClick={() => handleMoveField(idx, "down")}
                                  title="Move down"
                                >
                                  <ArrowDown size={15} />
                                </button>
                                <label className="inv-sw" title="Show on bill">
                                  <input
                                    type="checkbox"
                                    checked={field.show}
                                    onChange={(e) => handleUpdateField(field.id, { show: e.target.checked })}
                                  />
                                  <span className="inv-tr" />
                                </label>
                              </div>
                            </div>

                            {/* Field Editor (Open) */}
                            {isOpen && (
                              <div className="inv-fedit">
                                <div className={field.placement === "item" && field.itemSource === "product" ? "" : "inv-grid2"}>
                                  <label className="inv-fld">
                                    <span>Field name</span>
                                    <input
                                      className="inv-in"
                                      value={field.label}
                                      maxLength={30}
                                      placeholder="e.g. Doctor name, Salesperson"
                                      onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                                    />
                                  </label>
                                  {!(field.placement === "item" && field.itemSource === "product") && (
                                    <label className="inv-fld">
                                      <span>Type of value</span>
                                      <select
                                        className="inv-in"
                                        value={field.type}
                                        onChange={(e) => handleUpdateField(field.id, { type: e.target.value as FieldType, value: "" })}
                                      >
                                        {Object.entries(TYPES).map(([k, v]) => (
                                          <option key={k} value={k}>
                                            {v}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  )}
                                </div>

                                {/* Where on the bill */}
                                <div className="inv-fld">
                                  <span>Where on the bill</span>
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
                                      <label className="inv-fld">
                                        <span>Product detail to print</span>
                                        <select
                                          className="inv-in"
                                          value={field.attr}
                                          onChange={(e) => {
                                            const newAttr = e.target.value as any;
                                            const oldLabel = ATTRS[field.attr || ""];
                                            const shouldUpdateLabel =
                                              !field.label.trim() || field.label === oldLabel || Object.values(ATTRS).includes(field.label);
                                            handleUpdateField(field.id, {
                                              attr: newAttr,
                                              label: shouldUpdateLabel ? ATTRS[newAttr] : field.label,
                                            });
                                          }}
                                        >
                                          {Object.entries(ATTRS).map(([k, v]) => (
                                            <option key={k} value={k}>
                                              {v}
                                            </option>
                                          ))}
                                        </select>
                                      </label>
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

                                    {field.itemShow === "column" && !itemColIds.includes(field.id) && field.show && (
                                      <div className="inv-note">
                                        <Info size={16} />
                                        <span>
                                          Only {MAX_ITEM_COLS} extra columns fit on a bill, and they're already used. This one prints under the item name until you free a column.
                                        </span>
                                      </div>
                                    )}
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
                                            <b>Same on every bill</b>
                                            <small>Set it once here. Every bill prints it.</small>
                                          </span>
                                        </label>
                                        <label
                                          className={`askopt ${field.mode === "ask" ? "active" : ""}`}
                                          onClick={() => handleUpdateField(field.id, { mode: "ask" })}
                                        >
                                          <input type="radio" checked={field.mode === "ask"} readOnly />
                                          <span>
                                            <b>Ask while billing</b>
                                            <small>Staff type it for each bill.</small>
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
                                          <span>While billing</span>
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
                  </div>

                  <div className="inv-add-row">
                    <button
                      type="button"
                      className="inv-btn"
                      disabled={state.fields.length >= MAX_FIELDS}
                      onClick={handleAddField}
                    >
                      <Plus size={16} /> Add custom field
                    </button>
                    <span className="inv-count">
                      {state.fields.length} of {MAX_FIELDS} fields
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Signature */}
              <div className="inv-card">
                <div className="inv-card-h">
                  <div>
                    <h2>Signature</h2>
                    <p>Shown at the bottom of the bill, above “Authorised Signatory”.</p>
                  </div>
                  <label className="inv-sw">
                    <input
                      type="checkbox"
                      checked={state.sig.show}
                      onChange={(e) => setState((prev) => ({ ...prev, sig: { ...prev.sig, show: e.target.checked } }))}
                    />
                    <span className="inv-tr" />
                    <span>Show</span>
                  </label>
                </div>
                <div className="inv-card-b" style={{ opacity: state.sig.show ? 1 : 0.5, pointerEvents: state.sig.show ? "auto" : "none" }}>
                  <div className="inv-sig-modes">
                    <button
                      type="button"
                      className={state.sig.mode === "upload" ? "active" : ""}
                      onClick={() => setState((prev) => ({ ...prev, sig: { ...prev.sig, mode: "upload" } }))}
                    >
                      Upload image
                    </button>
                    <button
                      type="button"
                      className={state.sig.mode === "draw" ? "active" : ""}
                      onClick={() => setState((prev) => ({ ...prev, sig: { ...prev.sig, mode: "draw" } }))}
                    >
                      Draw
                    </button>
                    <button
                      type="button"
                      className={state.sig.mode === "type" ? "active" : ""}
                      onClick={() => setState((prev) => ({ ...prev, sig: { ...prev.sig, mode: "type" } }))}
                    >
                      Type name
                    </button>
                  </div>

                  {/* Mode 1: Upload Image */}
                  {state.sig.mode === "upload" && (
                    <div>
                      <div
                        className={`inv-sig-box ${isDraggingFile ? "drag" : ""}`}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(true);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(false);
                          handleFileUpload(e.dataTransfer.files[0]);
                        }}
                      >
                        <input
                          type="file"
                          id="sigFileInput"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            handleFileUpload(e.target.files?.[0]);
                            e.target.value = "";
                          }}
                        />
                        {state.sig.image ? (
                          <img
                            src={state.sig.image}
                            alt="Uploaded signature"
                            className="cursor-pointer"
                            onClick={() => document.getElementById("sigFileInput")?.click()}
                          />
                        ) : (
                          <label htmlFor="sigFileInput" className="inv-sig-drop">
                            <Upload size={22} className="text-emerald-700" />
                            <span>
                              <b>Choose an image</b> or drag it here
                            </span>
                          </label>
                        )}
                      </div>
                      <div className="inv-sig-tools" style={{ marginTop: 8 }}>
                        <span className="inv-hint">PNG or JPG, under 1 MB. A white or transparent background looks best.</span>
                        {state.sig.image && (
                          <button
                            type="button"
                            className="inv-btn ghost sm danger"
                            onClick={() => setState((prev) => ({ ...prev, sig: { ...prev.sig, image: "" } }))}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {sigUploadError && <div className="inv-err-msg">{sigUploadError}</div>}
                    </div>
                  )}

                  {/* Mode 2: Draw on Canvas */}
                  {state.sig.mode === "draw" && (
                    <div>
                      <canvas
                        ref={canvasRef}
                        id="inv-pad"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                      />
                      <div className="inv-sig-tools" style={{ marginTop: 8 }}>
                        <span className="inv-hint">Sign with your mouse or finger.</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" className="inv-btn sm" onClick={handleClearPad}>
                            Clear
                          </button>
                          <button type="button" className="inv-btn sm primary" onClick={handleSaveDrawnSig}>
                            Use this signature
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mode 3: Type Name */}
                  {state.sig.mode === "type" && (
                    <div>
                      <div className="inv-sig-box">
                        <span className="inv-typed-sig">{state.sig.name || "Your name"}</span>
                      </div>
                      <div className="inv-hint" style={{ marginTop: 6 }}>
                        Uses the signatory name below in a handwriting style.
                      </div>
                    </div>
                  )}

                  {/* Signatory metadata inputs */}
                  <div className="inv-grid3">
                    <label className="inv-fld">
                      <span>Signatory name</span>
                      <input
                        className="inv-in"
                        value={state.sig.name}
                        maxLength={40}
                        placeholder="e.g. Authorized Signatory"
                        onChange={(e) => setState((prev) => ({ ...prev, sig: { ...prev.sig, name: e.target.value } }))}
                      />
                    </label>
                    <label className="inv-fld">
                      <span>Designation</span>
                      <input
                        className="inv-in"
                        value={state.sig.desig}
                        maxLength={30}
                        placeholder="e.g. Proprietor / Manager"
                        onChange={(e) => setState((prev) => ({ ...prev, sig: { ...prev.sig, desig: e.target.value } }))}
                      />
                    </label>
                    <label className="inv-fld">
                      <span>Label under line</span>
                      <input
                        className="inv-in"
                        value={state.sig.label}
                        maxLength={30}
                        onChange={(e) => setState((prev) => ({ ...prev, sig: { ...prev.sig, label: e.target.value } }))}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Card 3: QR codes on the bill */}
              <div className="inv-card">
                <div className="inv-card-h">
                  <div>
                    <h2>QR codes on the bill</h2>
                    <p>Help customers order again and pay faster.</p>
                  </div>
                </div>
                <div className="inv-card-b">
                  {/* Digital Store QR */}
                  <div className="inv-frow" style={{ background: "var(--inv-surface)" }}>
                    <div className="inv-fsum">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b className="text-sm">ShopiQ Digital Store</b>
                        <div className="inv-hint">Customers scan to view your catalog and place orders.</div>
                      </div>
                      <label className="inv-sw">
                        <input
                          type="checkbox"
                          checked={state.qr.store}
                          onChange={(e) => setState((prev) => ({ ...prev, qr: { ...prev.qr, store: e.target.checked } }))}
                        />
                        <span className="inv-tr" />
                      </label>
                    </div>
                    {state.qr.store && (
                      <div className="inv-fedit">
                        <div className="inv-grid2">
                          <label className="inv-fld">
                            <span>Store link</span>
                            <input
                              className="inv-in"
                              value={state.qr.storeUrl}
                              onChange={(e) => setState((prev) => ({ ...prev, qr: { ...prev.qr, storeUrl: e.target.value } }))}
                            />
                          </label>
                          <label className="inv-fld">
                            <span>Text beside QR</span>
                            <input
                              className="inv-in"
                              value={state.qr.storeCap}
                              maxLength={40}
                              onChange={(e) => setState((prev) => ({ ...prev, qr: { ...prev.qr, storeCap: e.target.value } }))}
                            />
                          </label>
                        </div>
                        <span className="inv-hint">Taken from your published Digital Store.</span>
                      </div>
                    )}
                  </div>

                  {/* UPI QR */}
                  <div className="inv-frow" style={{ background: "var(--inv-surface)" }}>
                    <div className="inv-fsum">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b className="text-sm">UPI payment QR</b>
                        <div className="inv-hint">Customers scan to pay the exact invoice total.</div>
                      </div>
                      <label className="inv-sw">
                        <input
                          type="checkbox"
                          checked={state.qr.upi}
                          onChange={(e) => setState((prev) => ({ ...prev, qr: { ...prev.qr, upi: e.target.checked } }))}
                        />
                        <span className="inv-tr" />
                      </label>
                    </div>
                    {state.qr.upi && (
                      <div className="inv-fedit">
                        <div className="inv-grid2">
                          <label className="inv-fld">
                            <span>UPI ID (VPA)</span>
                            <input
                              className={`inv-in ${state.qr.upiId && !isUpiValid(state.qr.upiId) ? "err" : ""}`}
                              value={state.qr.upiId}
                              placeholder="e.g. yourstore@bank"
                              maxLength={50}
                              onChange={(e) => setState((prev) => ({ ...prev, qr: { ...prev.qr, upiId: e.target.value } }))}
                            />
                          </label>
                          <label className="inv-fld">
                            <span>Text beside QR</span>
                            <input
                              className="inv-in"
                              value={state.qr.upiCap}
                              maxLength={40}
                              onChange={(e) => setState((prev) => ({ ...prev, qr: { ...prev.qr, upiCap: e.target.value } }))}
                            />
                          </label>
                        </div>
                        {state.qr.upiId && !isUpiValid(state.qr.upiId) && (
                          <div className="inv-err-msg">Enter a valid UPI ID (e.g. business@okhdfc).</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 4: Footer */}
              <div className="inv-card">
                <div className="inv-card-h">
                  <div>
                    <h2>Footer</h2>
                    <p>Printed at the end of every bill.</p>
                  </div>
                </div>
                <div className="inv-card-b">
                  <label className="inv-fld">
                    <span>Thank-you message</span>
                    <input
                      className="inv-in"
                      value={state.footer.thanks}
                      maxLength={60}
                      onChange={(e) => setState((prev) => ({ ...prev, footer: { ...prev.footer, thanks: e.target.value } }))}
                    />
                  </label>

                  <div className="inv-fld">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--inv-muted)" }}>Terms &amp; conditions</span>
                      <label className="inv-sw">
                        <input
                          type="checkbox"
                          checked={state.footer.termsShow}
                          onChange={(e) =>
                            setState((prev) => ({ ...prev, footer: { ...prev.footer, termsShow: e.target.checked } }))
                          }
                        />
                        <span className="inv-tr" />
                        <span>Show</span>
                      </label>
                    </div>
                    <textarea
                      className="inv-in"
                      rows={3}
                      maxLength={300}
                      disabled={!state.footer.termsShow}
                      value={state.footer.terms}
                      onChange={(e) => setState((prev) => ({ ...prev, footer: { ...prev.footer, terms: e.target.value } }))}
                    />
                    <span className="inv-count text-right">{state.footer.terms.length}/300</span>
                  </div>

                  <label className="inv-check">
                    <input
                      type="checkbox"
                      checked={state.footer.words}
                      onChange={(e) => setState((prev) => ({ ...prev, footer: { ...prev.footer, words: e.target.checked } }))}
                    />
                    Show grand total in words
                  </label>

                  <div className="inv-note">
                    <Info size={16} />
                    <span>
                      Shop name, address, GSTIN, and contact details are automatically linked from your <b>Shop profile</b>.
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Templates Tab */
            <>
              <div className="inv-card">
                <div className="inv-card-h">
                  <div>
                    <h2>Invoice template</h2>
                    <p>Select your favorite design. Includes classic designs and modern print-optimized templates.</p>
                  </div>
                </div>
                <div className="inv-card-b">
                  <div className="inv-tpl-grid" role="radiogroup" aria-label="Invoice template">
                    {TEMPLATES.map((tmpl) => {
                      const isSelected = state.template === tmpl.id;
                      return (
                        <button
                          key={tmpl.id}
                          type="button"
                          className={`inv-tpl ${isSelected ? "active" : ""}`}
                          onClick={() => setState((prev) => ({ ...prev, template: tmpl.id }))}
                        >
                          {tmpl.isRenderer ? (
                            <div className="h-32 bg-slate-100/50 overflow-hidden flex items-start justify-center pt-2 relative pointer-events-none rounded-lg border border-slate-200/50">
                              <div className="w-[560px] origin-top transform scale-[0.38] transition-transform duration-300">
                                <InvoiceRenderer templateId={tmpl.id} {...rendererMockData} scale={1} />
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent opacity-80" />
                            </div>
                          ) : (
                            <div className="thumb">
                              <div className={`mini ${tmpl.id === "thermal" ? "th" : ""}`}>
                                {tmpl.id === "inventq" ? <i className="h" /> : tmpl.id === "classic" ? <i className="k" /> : null}
                                <i style={{ width: "60%" }} />
                                <i />
                                <i />
                                <i style={{ width: "80%" }} />
                                <i />
                                {tmpl.id === "classic" ? <i className="k" /> : null}
                                <i style={{ width: "40%", alignSelf: "flex-end" }} />
                              </div>
                            </div>
                          )}
                          <div className="mt-1">
                            <div className="flex items-center justify-between">
                              <b>{tmpl.name}</b>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                                {tmpl.badge}
                              </span>
                            </div>
                            <small>{tmpl.desc}</small>
                          </div>
                          <span className="sel">{isSelected ? "✓ In use" : "\u00A0"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="inv-card">
                <div className="inv-card-h">
                  <div>
                    <h2>Print size &amp; Specifications</h2>
                    <p>Picked automatically from the template. You can still adjust print scaling in the browser.</p>
                  </div>
                </div>
                <div className="inv-card-b">
                  <div className="inv-hint font-medium text-slate-700">
                    {selectedTemplate.size}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Live Bill Preview */}
        <aside className="inv-pv" aria-label="Bill preview">
          <div className="inv-pv-bar">
            <div className="inv-pv-title">
              Bill preview <span className="inv-live">Live</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {testBill && (
                <button type="button" className="inv-btn sm" onClick={() => setTestBill(null)}>
                  <RotateCcw size={13} /> Clear test values
                </button>
              )}
              <button
                type="button"
                className="inv-btn sm primary"
                onClick={() => setIsTestModalOpen(true)}
              >
                <FileText size={14} /> Try a test bill
              </button>
            </div>
          </div>

          <div className="inv-pv-bar">
            <div className="inv-pv-mode" style={{ flex: 1, minWidth: 220 }}>
              {testBill ? (
                <>Showing <b>test bill</b> values you entered.</>
              ) : activeAsks.total > 0 ? (
                <>
                  <b>{activeAsks.total}</b> field{activeAsks.total > 1 ? "s are" : " is"} filled in while billing. Use <b>Try a test bill</b> to see it as staff would.
                </>
              ) : (
                <>Real store details and active inventory are reflected live on your invoices.</>
              )}
            </div>
          </div>

          {/* Scaled Live Stage */}
          <div className="inv-stage" ref={stageRef}>
            <div
              className="inv-stage-in"
              style={{
                transform: `scale(${stageScale})`,
                marginLeft: `${stageMargin}px`,
              }}
            >
              {selectedTemplate.isRenderer ? (
                /* ── Render Classic / Old Template using InvoiceRenderer ── */
                <div
                  ref={paperRef}
                  className="shadow-xl shadow-slate-300/50 rounded-lg overflow-hidden pointer-events-none ring-1 ring-slate-200/50 bg-white shrink-0"
                  style={{ width: 560 }}
                >
                  <InvoiceRenderer
                    templateId={state.template}
                    {...rendererMockData}
                    customFields={state.fields.map((f) => ({
                      ...f,
                      displayValue: getCustomFieldValue(f),
                    }))}
                    signature={state.sig}
                    qrSettings={state.qr}
                    footerSettings={state.footer}
                    getItemCustomValue={(field, _line, idx) => getItemValue(field, displayItems[idx] || displayItems[0], idx)}
                    scale={1}
                  />
                </div>
              ) : (
                /* ── Render Modern InventQ, Classic B&W, or Thermal 80 mm ── */
                <div
                  ref={paperRef}
                  className={`inv-paper ${state.template === "thermal" ? "thermal" : state.template === "classic" ? "a4 classic" : "a4"}`}
                >
                  {state.template === "thermal" ? (
                    /* ── Thermal Receipt ── */
                    <>
                      <div className="c b" style={{ fontSize: 13 }}>
                        {shopName.toUpperCase()}
                      </div>
                      <div className="c">{shopAddr}</div>
                      {shopPhone && <div className="c">Ph: {shopPhone}</div>}
                      {shopGst && <div className="c">GSTIN: {shopGst}</div>}
                      <hr />
                      <div className="row">
                        <span>Bill: {invoiceNumber}</span>
                        <span>{todayDateStr}</span>
                      </div>
                      <div className="row">
                        <span>Customer</span>
                        <span>Walk-in Customer</span>
                      </div>
                      {/* Customer custom fields */}
                      {state.fields
                        .filter((f) => f.show && f.placement === "customer" && f.label.trim())
                        .map((f) => {
                          const v = getCustomFieldValue(f);
                          if (!v) return null;
                          return (
                            <div key={f.id} className="row">
                              <span>{f.label}</span>
                              <span>{v}</span>
                            </div>
                          );
                        })}
                      <hr />
                      <div className="grid b">
                        <span>Item</span>
                        <span className="r">Qty</span>
                        <span className="r">Amount</span>
                      </div>
                      <hr />
                      {displayItems.map((it, idx) => (
                        <React.Fragment key={idx}>
                          <div className="grid">
                            <span>{it.n}</span>
                            <span className="r">{it.qty}</span>
                            <span className="r">{(it.rate * it.qty).toFixed(2)}</span>
                          </div>
                          {state.fields.filter((f) => f.show && f.placement === "item" && f.label.trim()).length > 0 && (
                            <div style={{ fontSize: 9.5, margin: "-1px 0 4px" }}>
                              {state.fields
                                .filter((f) => f.show && f.placement === "item" && f.label.trim())
                                .map((f, i) => (
                                  <span key={f.id}>
                                    {i > 0 && " · "}
                                    {f.label}: {getItemValue(f, it, idx)}
                                  </span>
                                ))}
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                      <hr />
                      <div className="row b" style={{ fontSize: 13 }}>
                        <span>NET AMOUNT</span>
                        <span>{inr(sampleTotal)}</span>
                      </div>
                      {state.footer.words && (
                        <div style={{ fontSize: 10, marginTop: 3 }}>{numberToWords(sampleTotal)}</div>
                      )}
                      {/* Below items custom fields */}
                      {state.fields.filter((f) => f.show && f.placement === "below" && f.label.trim()).length > 0 && (
                        <>
                          <hr />
                          {state.fields
                            .filter((f) => f.show && f.placement === "below" && f.label.trim())
                            .map((f) => {
                              const v = getCustomFieldValue(f);
                              if (!v) return null;
                              return (
                                <div key={f.id} className="row">
                                  <span>{f.label}</span>
                                  <span>{v}</span>
                                </div>
                              );
                            })}
                        </>
                      )}
                      {/* Thermal QR codes */}
                      {(state.qr.store || (state.qr.upi && state.qr.upiId && isUpiValid(state.qr.upiId))) && (
                        <>
                          <hr />
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {state.qr.store && state.qr.storeUrl && (
                              <div className="c">
                                <div className="q">
                                  <QRCodeSVG value={state.qr.storeUrl} size={84} level="M" />
                                </div>
                                <div className="b">{state.qr.storeCap || "Order online"}</div>
                                <div style={{ fontSize: 9.5 }}>{state.qr.storeUrl.replace(/^https?:\/\//, "")}</div>
                              </div>
                            )}
                            {state.qr.upi && state.qr.upiId && isUpiValid(state.qr.upiId) && (
                              <div className="c">
                                <div className="q">
                                  <QRCodeSVG value={upiLink} size={84} level="M" />
                                </div>
                                <div className="b">{state.qr.upiCap || "Scan to pay"}</div>
                                <div style={{ fontSize: 9.5 }}>{state.qr.upiId} · {inr(sampleTotal)}</div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                      {/* Thermal signature */}
                      {state.sig.show && (
                        <>
                          <hr />
                          <div className="c">
                            {state.sig.mode === "type" ? (
                              <div style={{ fontFamily: "var(--f-sign)", fontSize: 22, color: "#1b2a6b" }}>
                                {state.sig.name}
                              </div>
                            ) : sigSrc ? (
                              <img className="sigimg mx-auto" src={sigSrc} alt="Signature" />
                            ) : null}
                            <div>{state.sig.label || "Authorised Signatory"}</div>
                          </div>
                        </>
                      )}
                      {state.footer.termsShow && state.footer.terms.trim() && (
                        <>
                          <hr />
                          <div style={{ fontSize: 9.5, whiteSpace: "pre-line" }}>{state.footer.terms}</div>
                        </>
                      )}
                      {state.footer.thanks && (
                        <>
                          <hr />
                          <div className="c b">{state.footer.thanks}</div>
                        </>
                      )}
                    </>
                  ) : (
                    /* ── A4 Modern InventQ / Classic B&W ── */
                    <>
                      <div className="inv-p-head">
                        <div className="inv-p-biz">
                          <div className="inv-p-logo">
                            {shopName.slice(0, 2).toUpperCase() || "IQ"}
                          </div>
                          <div>
                            <h3>{shopName}</h3>
                            <div className="sub">{shopType}</div>
                            <div className="addr">
                              {shopGst && (
                                <>
                                  GSTIN: {shopGst}
                                  <br />
                                </>
                              )}
                              {shopAddr}
                            </div>
                          </div>
                        </div>
                        <div className="inv-p-inv">
                          <div className="lbl">TAX INVOICE</div>
                          <div className="no">{invoiceNumber}</div>
                          <div className="dt">{todayDateStr} · {todayTimeStr}</div>
                          <div className="inv-p-pay">UPI / Cash / Card</div>
                        </div>
                      </div>

                      <div className="cls-strip">
                        <span>
                          <b>Tax Invoice</b> {invoiceNumber}
                        </span>
                        <span>{todayDateStr}</span>
                      </div>

                      {/* Metadata: Billed To & Custom Top Fields */}
                      <div className="inv-p-meta">
                        <div>
                          <div className="k">BILLED TO</div>
                          <div className="nm">Walk-in Customer</div>
                          <div>+91 98765 43210</div>
                        </div>
                        <div>
                          {state.fields.filter((f) => f.show && f.placement === "customer" && f.label.trim()).length > 0 && (
                            <>
                              <div className="k">BILL DETAILS</div>
                              <dl className="inv-cf-list">
                                {state.fields
                                  .filter((f) => f.show && f.placement === "customer" && f.label.trim())
                                  .map((f) => {
                                    const val = getCustomFieldValue(f);
                                    if (!val) return null;
                                    return (
                                      <React.Fragment key={f.id}>
                                        <dt>{f.label}</dt>
                                        <dd className={flashIds.has(f.id) ? "inv-flash" : ""}>{val}</dd>
                                      </React.Fragment>
                                    );
                                  })}
                              </dl>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Items Table */}
                      <table className="inv-items">
                        <thead>
                          <tr>
                            <th style={{ width: 36 }}>S.No</th>
                            <th>Item description</th>
                            {itemCols.map((col) => (
                              <th key={col.id} className={flashIds.has(col.id) ? "inv-flash" : ""}>
                                {col.label}
                              </th>
                            ))}
                            <th className="r">Rate</th>
                            <th className="r">Qty</th>
                            <th className="r">GST</th>
                            <th className="r">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayItems.map((it, idx) => (
                            <tr key={idx}>
                              <td>{idx + 1}</td>
                              <td>
                                <div className="inv-it-name">{it.n}</div>
                                {it.v && <div style={{ color: "var(--inv-paper-muted)" }}>{it.v}</div>}
                                <div className="inv-it-sku">{it.sku}</div>
                                {itemUnder.length > 0 && (
                                  <div className="inv-it-extra">
                                    {itemUnder.map((u) => (
                                      <span key={u.id} className={flashIds.has(u.id) ? "inv-flash" : ""}>
                                        {u.label}: <b>{getItemValue(u, it, idx)}</b>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              {itemCols.map((col) => (
                                <td key={col.id} className={`xc ${flashIds.has(col.id) ? "inv-flash" : ""}`}>
                                  {getItemValue(col, it, idx)}
                                </td>
                              ))}
                              <td className="r">{inr(it.rate)}</td>
                              <td className="r">
                                <b>{it.qty}</b>
                              </td>
                              <td className="r">{it.gstp}%</td>
                              <td className="r">
                                <b>{inr(it.rate * it.qty)}</b>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Body Totals & Below items */}
                      <div className="inv-p-body">
                        <div>
                          {state.fields.filter((f) => f.show && f.placement === "below" && f.label.trim()).length > 0 && (
                            <div className="inv-below-cf">
                              <dl className="inv-cf-list">
                                {state.fields
                                  .filter((f) => f.show && f.placement === "below" && f.label.trim())
                                  .map((f) => {
                                    const val = getCustomFieldValue(f);
                                    if (!val) return null;
                                    return (
                                      <React.Fragment key={f.id}>
                                        <dt>{f.label}</dt>
                                        <dd className={flashIds.has(f.id) ? "inv-flash" : ""}>{val}</dd>
                                      </React.Fragment>
                                    );
                                  })}
                              </dl>
                            </div>
                          )}
                        </div>
                        <div className="inv-tot">
                          <div>
                            <span>Taxable amount</span>
                            <span>{inr(taxableAmount)}</span>
                          </div>
                          <div>
                            <span>Total GST</span>
                            <span>{inr(totalGstAmount)}</span>
                          </div>
                          <div className="gt">
                            <span>GRAND TOTAL</span>
                            <span>{inr(sampleTotal)}</span>
                          </div>
                          <div>
                            <span style={{ color: "var(--inv-paper-muted)" }}>Paid · UPI / Cash</span>
                            <span>{inr(sampleTotal)}</span>
                          </div>
                          {state.footer.words && <div className="inv-words">{numberToWords(sampleTotal)}</div>}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="inv-p-foot">
                        <div>
                          {state.footer.thanks && (
                            <div className="inv-thanks">{state.footer.thanks.toUpperCase()}</div>
                          )}
                          {state.footer.termsShow && state.footer.terms.trim() && (
                            <div className="inv-terms">
                              <b>TERMS &amp; CONDITIONS</b>
                              {state.footer.terms}
                            </div>
                          )}
                          {/* QR Codes */}
                          {(state.qr.store || (state.qr.upi && state.qr.upiId && isUpiValid(state.qr.upiId))) && (
                            <div className="inv-qrs">
                              {state.qr.store && state.qr.storeUrl && (
                                <div className="inv-qr">
                                  <div className="q">
                                    <QRCodeSVG value={state.qr.storeUrl} size={62} level="M" />
                                  </div>
                                  <div className="cap">
                                    <b>{state.qr.storeCap || "Order online"}</b>
                                    <span>{state.qr.storeUrl.replace(/^https?:\/\//, "")}</span>
                                  </div>
                                </div>
                              )}
                              {state.qr.upi && state.qr.upiId && isUpiValid(state.qr.upiId) && (
                                <div className="inv-qr">
                                  <div className="q">
                                    <QRCodeSVG value={upiLink} size={62} level="M" />
                                  </div>
                                  <div className="cap">
                                    <b>{state.qr.upiCap || "Scan to pay"}</b>
                                    <span>{state.qr.upiId} · {inr(sampleTotal)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Signature */}
                        {state.sig.show && (
                          <div className="inv-sign">
                            <div className="for">For {shopName}</div>
                            <div className="img">
                              {state.sig.mode === "type" ? (
                                <span className="typed">{state.sig.name || "Signatory"}</span>
                              ) : sigSrc ? (
                                <img src={sigSrc} alt="Signature" />
                              ) : (
                                <span className="inv-ph">Add a signature</span>
                              )}
                            </div>
                            <div className="ln">
                              {state.sig.name && (
                                <div className="nm">
                                  {state.sig.name}
                                  {state.sig.desig ? `, ${state.sig.desig}` : ""}
                                </div>
                              )}
                              {state.sig.label || "Authorised Signatory"}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="inv-pwr">Billed with InventQ</div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="inv-legend">
            <span>
              <i className="inv-sw-ask" /> Filled in while billing
            </span>
            <span>Live shop inventory preview</span>
          </div>
        </aside>
      </div>

      {/* Floating Save Bar when dirty */}
      <div className={`inv-savebar ${hasChanges ? "show" : ""}`} role="region" aria-label="Unsaved changes">
        <div className="inv-savebar-in">
          <div>
            <b>Unsaved changes</b>{" "}
            <span style={{ opacity: 0.75 }}>
              in {diffCount} section{diffCount > 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="inv-btn ghost" onClick={handleDiscard}>
              Discard
            </button>
            <button type="button" className="inv-btn primary" onClick={handleSave}>
              Save changes
            </button>
          </div>
        </div>
      </div>

      {/* Test Bill Modal */}
      {isTestModalOpen && (
        <TestBillModal
          shopName={shopName}
          displayItems={displayItems}
          sampleTotal={sampleTotal}
          billAsks={activeAsks.billAsks}
          itemAsks={activeAsks.itemAsks}
          initialValues={testBill}
          onClose={() => setIsTestModalOpen(false)}
          onSave={(vals, itemVals) => {
            setTestBill({ bill: vals, items: itemVals });
            setFlashIds(new Set([...activeAsks.billAsks, ...activeAsks.itemAsks].map((f) => f.id)));
            setIsTestModalOpen(false);
            showToast("Test bill created. The preview shows what prints.", "success");
          }}
        />
      )}
    </div>
  );
};

// ── Test Bill Modal Component ─────────────────────────────────────────
interface TestBillModalProps {
  shopName: string;
  displayItems: any[];
  sampleTotal: number;
  billAsks: CustomField[];
  itemAsks: CustomField[];
  initialValues: { bill: Record<string, string>; items: Record<string, string>[] } | null;
  onClose: () => void;
  onSave: (billVals: Record<string, string>, itemVals: Record<string, string>[]) => void;
}

const TestBillModal: React.FC<TestBillModalProps> = ({
  shopName,
  displayItems,
  sampleTotal,
  billAsks,
  itemAsks,
  initialValues,
  onClose,
  onSave,
}) => {
  const [billValues, setBillValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of billAsks) {
      init[f.id] = initialValues?.bill[f.id] ?? f.value ?? "";
    }
    return init;
  });

  const [itemValues, setItemValues] = useState<Record<string, string>[]>(() => {
    return displayItems.map((_, idx) => {
      const row: Record<string, string> = {};
      for (const f of itemAsks) {
        row[f.id] = initialValues?.items[idx]?.[f.id] ?? "";
      }
      return row;
    });
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [itemErrors, setItemErrors] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    let hasErr = false;

    for (const f of billAsks) {
      if (f.required && !billValues[f.id]?.trim()) {
        newErrors[f.id] = true;
        hasErr = true;
      }
    }

    let hasItemErr = false;
    for (let idx = 0; idx < displayItems.length; idx++) {
      for (const f of itemAsks) {
        if (f.required && !itemValues[idx]?.[f.id]?.trim()) {
          hasItemErr = true;
          hasErr = true;
        }
      }
    }

    setErrors(newErrors);
    setItemErrors(hasItemErr);

    if (hasErr) return;
    onSave(billValues, itemValues);
  };

  const hasAnyAsks = billAsks.length > 0 || itemAsks.length > 0;

  return (
    <div className="inv-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className="inv-modal"
        style={{ width: `min(${itemAsks.length ? 620 : 520}px, 100%)` }}
        onSubmit={handleSubmit}
      >
        <div className="inv-modal-h">
          <h3>New bill · {shopName}</h3>
          <p>
            {hasAnyAsks
              ? "This is what staff see when saving a bill. Fields marked * must be filled."
              : "Nothing is asked while billing. Bill details use your fixed values and item details come from your products."}
          </p>
        </div>

        <div className="inv-modal-b">
          {billAsks.map((f) => (
            <label key={f.id} className="inv-fld">
              <span>
                {f.label}
                {f.required && <span className="inv-req-star"> *</span>}
              </span>
              <input
                className={`inv-in ${errors[f.id] ? "err" : ""}`}
                type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "phone" ? "tel" : "text"}
                value={billValues[f.id] || ""}
                placeholder={f.required ? "Required" : "Optional, leave blank to skip"}
                onChange={(e) => {
                  setBillValues((prev) => ({ ...prev, [f.id]: e.target.value }));
                  if (errors[f.id]) setErrors((prev) => ({ ...prev, [f.id]: false }));
                }}
              />
              {errors[f.id] && (
                <span className="inv-err-msg">Enter {f.label.toLowerCase()} to save this bill.</span>
              )}
            </label>
          ))}

          {itemAsks.length > 0 && (
            <div className="inv-fld">
              <span>Item details</span>
              <div className="inv-mt-wrap">
                <table className="inv-mtable">
                  <thead>
                    <tr>
                      <th>Item</th>
                      {itemAsks.map((f) => (
                        <th key={f.id}>
                          {f.label}
                          {f.required && <span className="inv-req-star"> *</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayItems.map((it, idx) => (
                      <tr key={idx}>
                        <td>
                          {it.n}
                          <div className="inv-hint">Qty {it.qty}</div>
                        </td>
                        {itemAsks.map((f) => (
                          <td key={f.id}>
                            <input
                              className="inv-in"
                              type={f.type === "number" ? "number" : "text"}
                              value={itemValues[idx]?.[f.id] || ""}
                              placeholder={f.required ? "Required" : "Optional"}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItemValues((prev) => {
                                  const updated = [...prev];
                                  updated[idx] = { ...updated[idx], [f.id]: val };
                                  return updated;
                                });
                                if (itemErrors) setItemErrors(false);
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {itemErrors && (
                <span className="inv-err-msg">Fill the required item details to save this bill.</span>
              )}
            </div>
          )}

          {!hasAnyAsks && (
            <div className="inv-note">
              Set a field to “Ask while billing”, or an item detail to “Ask for each item”, to try this.
            </div>
          )}

          {hasAnyAsks && (
            <div className="inv-hint">
              Total {inr(sampleTotal)} · {displayItems.length} items · press <span className="inv-kbd">Enter</span> to save
            </div>
          )}
        </div>

        <div className="inv-modal-f">
          <button type="button" className="inv-btn" onClick={onClose}>
            Cancel
          </button>
          {hasAnyAsks && (
            <button type="submit" className="inv-btn primary">
              Save bill
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
