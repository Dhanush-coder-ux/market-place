import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  Save,
  Banknote,
  Smartphone,
  PackageOpen,
  Bookmark,
  Mail,
  User,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  MapPin,
} from "lucide-react";

import Input from "@/components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { Tooltip } from "@/components/common/Tootlip";
import { GradientButton } from "@/components/ui/GradientButton";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { SHOP_ID } from "@/services/endpoints";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { supplierApi } from "@/services/api/supplier";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import Loader from "@/components/common/Loader";
import { InventoryItemsCard } from "@/features/purchase/components/InventoryItemsCard";
import { useQuickCreate } from "@/features/common/QuickCreate/QuickCreateContext";
import PurchaseSuccessModal from "../components/purchaseSuccessModal";
import { parseGst } from "./PurchaseHistory";
import { NavigationBlocker } from "@/components/common/NavigationBlocker";
type PaymentMethod = "NONE" | "CASH" | "UPI" | "CARD" | "BANK";

export interface ProductItem {
  id: string;
  pricing_id?: string;
  storage_location_id?: string;
  inventory_id?: string;
  variant_id?: string;
  name: string;
  quantity: number | "";
  originalQuantity?: number;
  costPrice: number | "";
  sellingPrice: number | "";
  marginPercent: number | "";
  marginAmount: number | "";
  marginType: "percent" | "amount" | "sellingPrice";
  unit: string;
  unit_infos?: { name: string; sub_units?: { name: string; factor: number }[] };
  selectedUnit?: string;
  taxGst: number | "";
  storageLoc: string;
  reorderPoint: number | "";
  expiryDate: string;
  manufacturingDate: string;
  batchTracking: boolean;
  serialTracking: boolean;
  serialNumbers: string;
  batchNum: string;
  batch_id?: string;
  serialno_id?: string;
  sku: string;
  variant: string;
  size: string;
  category?: string;
  _backendId?: string | null;
}


// ─── Main Component ───────────────────────────────────────────────────────────

const PurchaseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { purchase, inventory } = useBusinessApi();
  const { setBottomActions, setBreadcrumbOverride } = useHeader();
  const { showToast } = useToast();

  useEffect(() => {
    return () => {
      if (setBreadcrumbOverride) setBreadcrumbOverride(null);
    };
  }, [setBreadcrumbOverride]);

  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loadingData, setLoadingData] = useState(!!id);
  const [purchaseVersion, setPurchaseVersion] = useState<string | null>(null);

  const { openQuickCreate } = useQuickCreate();
  const [soldStockWarnings, setSoldStockWarnings] = useState<string[]>([]);

  // --- State Management ---
  const [purchaseDetails, setPurchaseDetails] = useState({
    supplier: "",
    invoiceNo: "",
    date: new Date().toISOString().split("T")[0],
    referenceNo: `PUR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
  });

  const defaultProductRow: ProductItem = {
    id: crypto.randomUUID(), name: "", quantity: "", costPrice: "", sellingPrice: "",
    marginPercent: "", marginAmount: "", marginType: "percent",
    unit: "pc", unit_infos: undefined, selectedUnit: "pc", taxGst: 18, storageLoc: "", reorderPoint: "", expiryDate: "", manufacturingDate: "", batchTracking: false, serialTracking: false, serialNumbers: "", batchNum: "", batch_id: "", serialno_id: "", sku: "", variant: "", size: ""
  };

  const [products, setProducts] = useState<ProductItem[]>([defaultProductRow]);

  const [charges, setCharges] = useState({ transport: "" as number | "", other: "" as number | "" });
  const [purchaseType, setPurchaseType] = useState<"DIRECT" | "PO_CREATE" | "PO_UPDATE" | "PRODUCTION">(() => {
    const type = searchParams.get("type");
    return (type as any) || "DIRECT";
  });
  const [payment, setPayment] = useState({ method: "NONE" as PaymentMethod, amountPaid: "" as number | string, referenceNo: "" as string });
  const [costMethod, setCostMethod] = useState("None");
  const [supplierDetails, setSupplierDetails] = useState<any>(null);
  const [isGstExpanded, setIsGstExpanded] = useState(false);
  const [gstMode, setGstMode] = useState<"inclusive" | "exclusive">("exclusive");

  // --- Calculations ---
  const stats = useMemo(() => {
    let totalQty = 0;
    let subtotal = 0;
    let totalGst = 0;
    const gstBreakdown: Record<number, number> = {};

    products.forEach(p => {
      const q = Number(p.quantity) || 0;
      const c = Number(p.costPrice) || 0;
      const gstRate = Number(p.taxGst) || 0;
      totalQty += q;

      let baseCost = c;
      let lineGst = 0;

      if (gstMode === "inclusive") {
        baseCost = c / (1 + gstRate / 100);
        lineGst = q * (c - baseCost);
      } else {
        baseCost = c;
        lineGst = q * c * (gstRate / 100);
      }

      const lineExcl = q * baseCost;

      subtotal += lineExcl;
      totalGst += lineGst;
      if (gstRate > 0) {
        gstBreakdown[gstRate] = (gstBreakdown[gstRate] || 0) + lineGst;
      }
    });

    const transportCost = Number(charges.transport) || 0;
    const otherCost = Number(charges.other) || 0;
    const totalCharges = transportCost + otherCost;

    const grandTotal = subtotal + totalGst;
    const paid = Number(payment.amountPaid) || 0;
    const outstanding = grandTotal - paid;

    // Per-product charge allocation
    const allocations = products.map(p => {
      const q = Number(p.quantity) || 0;
      const c = Number(p.costPrice) || 0;
      const gstRate = Number(p.taxGst) || 0;
      const baseCost = gstMode === "inclusive" ? c / (1 + gstRate / 100) : c;

      let alloc = 0;
      if (costMethod === "By Unit" && totalQty > 0) {
        alloc = (q / totalQty) * totalCharges;
      } else if (costMethod === "By Value" && subtotal > 0) {
        alloc = ((q * baseCost) / subtotal) * totalCharges;
      } else if (costMethod === "Equally" && products.length > 0) {
        alloc = totalCharges / products.length;
      }
      const netCostPerUnit = q > 0 ? (q * baseCost + alloc) / q : baseCost;
      return { alloc, netCostPerUnit };
    });

    return { totalQty, subtotal, totalGst, gstBreakdown, totalCharges, grandTotal, outstanding, allocations };
  }, [products, charges, payment.amountPaid, costMethod, gstMode]);

  // --- Load Existing Purchase, Draft, and Custom Field values ---
  useEffect(() => {
    if (id) {
      const fetchPurchase = async () => {
        const res = await purchase.getPurchaseById(SHOP_ID, id);
        if (res && (res.data || res.id)) {
          const data = res.data ? (Array.isArray(res.data) ? res.data[0] : res.data) : res;
          const loadedSupplierId = data.supplier?.supplier_id || data.supplier?.id || data.supplier_id || "";
          const loadedSupplierName = data.supplier?.supplier_name || data.supplier?.name || data.supplier_name || "";

          setPurchaseDetails(data.purchaseDetails || {
            supplier: loadedSupplierId,
            invoiceNo: data.invoice_no || "",
            date: data.purchase_date ? data.purchase_date.split("T")[0] : (data.date ? data.date.split("T")[0] : new Date().toISOString().split("T")[0]),
            referenceNo: data.reference_no || "",
          });

          if (loadedSupplierId && !data.purchaseDetails) {
            supplierApi.getById(SHOP_ID, loadedSupplierId).then((supRes: any) => {
              if (supRes && (supRes.data || supRes.id)) {
                const supData = supRes.data ? (Array.isArray(supRes.data) ? supRes.data[0] : supRes.data) : supRes;
                setSupplierDetails({
                  ...supData,
                  id: loadedSupplierId,
                  name: supData.name || supData.supplier_name || loadedSupplierName || "Unknown Supplier"
                });
              } else {
                setSupplierDetails({
                  ...(data.supplier || {}),
                  id: loadedSupplierId,
                  name: loadedSupplierName || "Unknown Supplier"
                });
              }
            }).catch(() => {
              setSupplierDetails({
                ...(data.supplier || {}),
                id: loadedSupplierId,
                name: loadedSupplierName || "Unknown Supplier"
              });
            });
          }

          setPurchaseType(data.type || "DIRECT");

          // Read the version from the backend response
          setPurchaseVersion(data.version || "v1");
          if (data.ui_id && setBreadcrumbOverride) setBreadcrumbOverride(data.ui_id);


          // Populate additional charges
          setCharges({
            transport: data.charges_infos?.transport_charge || "",
            other: data.charges_infos?.other_charge || ""
          });

          // Populate payment info
          const firstPayment = data.payment_infos?.[0];
          setPayment({
            method: firstPayment?.method || "NONE",
            amountPaid: firstPayment?.amount ?? "",
            referenceNo: firstPayment?.reference_no ?? ""
          });

          // Populate cost method
          const costMethodValue = data.calculation_infos?.distribute_by || data.calculations?.distribute_by;
          setCostMethod(
            costMethodValue === "BY_UNIT" ? "By Unit" :
              costMethodValue === "BY_VALUE" ? "By Value" :
                costMethodValue === "EQUALLY" ? "Equally" : "None"
          );

          // Populate gst mode
          const gstModeValue = data.calculation_infos?.gst_type || data.calculations?.gst_type || data.gst_infos?.type;
          setGstMode(gstModeValue?.toLowerCase() === "exclusive" ? "exclusive" : "inclusive");

          const itemsSource = data.items || data.products || [];
          const updatedProducts = [...itemsSource.map((p: any) => {
            const qty = p.stocks_infos?.stocks ?? p.stock_infos?.stocks ?? p.stocks ?? p.quantity ?? p.stocks_added ?? 0;
            const parsedSku = p.sku || p.datas?.sku || p.ui_id || p.barcode || "";
            const pBuyPrice = p.pricing_infos?.[0]?.buy_price ?? p.pricing_infos?.buy_price ?? p.buy_price;
            const pSellPrice = p.pricing_infos?.[0]?.sell_price ?? p.pricing_infos?.sell_price ?? p.sell_price;
            const pStorage = p.storage_locations?.[0]?.name ?? p.storage_locations?.[0]?.storage_location ?? p.storage_location_infos?.name ?? p.storage_location_infos?.storage_location ?? p.datas?.storage_location ?? "";

            return {
              // Store the real backend item ID (used in update payload). Never generate a temp ID here
              // so we can detect which items are truly persisted vs newly added during edit.
              id: p.id || `temp-${Math.random().toString(36).substring(2, 9)}`,
              _backendId: p.id || null, // tracks whether this row has a real persisted DB id
              pricing_id: p.pricing_infos?.[0]?.pricing_id || p.pricing_infos?.[0]?.id || p.pricing_infos?.id,
              storage_location_id: p.storage_locations?.[0]?.storage_location_id || p.storage_locations?.[0]?.id || p.storage_location_infos?.id,
              inventory_id: p.product_id || p.inventory_id,
              name: p.name || "",
              quantity: qty,
              originalQuantity: qty,
              costPrice: pBuyPrice,
              sellingPrice: pSellPrice,
              marginPercent: "",
              marginAmount: "",
              marginType: "sellingPrice",
              unit: p.unit || p.unit_infos?.name || "pc",
              unit_infos: p.unit_infos || null,
              selectedUnit: p.unit || p.selectedUnit || p.unit_infos?.name || "pc",
              taxGst: (p.gst ?? p.datas?.gst ?? p.taxGst ?? p.tax_gst) !== undefined ? parseGst(p.gst ?? p.datas?.gst ?? p.taxGst ?? p.tax_gst) : 18,
              variant_id: p.variant_id || p.variant_infos?.id || ((typeof p.variant === 'object' && p.variant !== null) ? p.variant.variant_id : null),
              variant: p.variant_infos?.name || (typeof p.variant === 'object' && p.variant !== null ? p.variant.variant_name || p.variant.name : p.variant) || "",
              sku: parsedSku,
              category: p.category_infos?.name || p.category_infos?.category_name || (typeof p.category === 'object' && p.category !== null ? p.category.name : p.category) || "",
              batchTracking: p.batchTracking || !!p.batch_infos || p.batch_tracking || p.has_batch || !!p.batch || !!p.batch_id,
              serialTracking: p.serialTracking || !!p.serialno_infos || p.serial_tracking || p.has_serialno || !!p.serial_info || !!p.serialno_id || !!(p.serial_number) || !!(p.serial_numbers),
              batch_id: p.batch_infos?.id || ((typeof p.batch === 'object' && p.batch !== null) ? p.batch.batch_id : null),
              batchNum: p.batch_infos?.name || ((typeof p.batch === 'object' && p.batch !== null ? p.batch.batch_name || p.batch.name : p.batch)) || "",
              manufacturingDate: (p.batch_infos?.manufacturing_date || p.batch_infos?.mfg_date || p.manufacturing_date || p.mfg_date || p.batch?.manufacturing_date || p.batch?.mfg_date || "").split("T")[0],
              expiryDate: (p.batch_infos?.expiry_date || p.batch_infos?.exp_date || p.expiry_date || p.exp_date || p.batch?.expiry_date || p.batch?.exp_date || "").split("T")[0],
              serialno_id: p.serialno_id || p.serial_number?.id || p.serial_numbers?.id || p.serial_info?.serialno_id,
              storageLoc: pStorage,
              reorderPoint: p.reorder_point_infos?.reorder_point ?? p.reorder_point ?? p.datas?.reorder_point ?? 5,
              serialNumbers: (p.serialno_infos ? p.serialno_infos.map((s: any) => s.name).join(',') : Array.isArray(p.serialno_numbers) ? p.serialno_numbers.join(',') : Array.isArray(p.serial_numbers) ? p.serial_numbers.join(',') : (p.serial_numbers?.serial_numbers || p.serial_number?.serial_numbers || p.serial_info?.serial_numbers || []).join(',')),
              existingSerials: (p.serialno_infos ? p.serialno_infos.map((s: any) => s.name) : Array.isArray(p.serialno_numbers) ? p.serialno_numbers : Array.isArray(p.serial_numbers) ? p.serial_numbers : (p.serial_numbers?.serial_numbers || p.serial_number?.serial_numbers || p.serial_info?.serial_numbers || []))
            };
          })];

          const warnings: string[] = [];
          for (let i = 0; i < updatedProducts.length; i++) {
            const p = updatedProducts[i];
            if (!p.inventory_id) continue;
            try {
              const invRes = await inventory.getInventoryById(SHOP_ID, p.inventory_id);
              if (invRes && invRes.data) {
                const invData = Array.isArray(invRes.data) ? invRes.data[0] : invRes.data;
                p.unit_infos = invData.unit_infos || p.unit_infos || null;
                p.selectedUnit = p.selectedUnit || p.unit || p.unit_infos?.name || "pc";

                // Update tracking flags from live inventory data strictly
                p.batchTracking = !!(invData.type_infos?.has_batch || invData.has_batch || invData.datas?.has_batch);
                p.serialTracking = !!(invData.type_infos?.has_serialno || invData.has_serialno || invData.datas?.has_serialno);
              }
            } catch {
              // ignore
            }
          }
          setProducts(updatedProducts);
          setSoldStockWarnings(warnings);
        }
      };

      fetchPurchase().finally(() => {
        setLoadingData(false);
      });
    } else {
      setLoadingData(false);
      const draftId = searchParams.get("draftId");
      if (draftId) {
        const savedDrafts = JSON.parse(localStorage.getItem("purchase_drafts") || "[]");
        const draft = savedDrafts.find((d: any) => d.id === draftId);
        if (draft) {
          setPurchaseDetails(draft.data.purchaseDetails);
          setProducts(draft.data.products);
          setCharges(draft.data.charges);
          setPayment(draft.data.payment);
          setSupplierDetails(draft.data.supplierDetails);
        }
      } else if (location.state?.product) {
        const p = location.state.product;
        const hasBatchTracking = !!p.type_infos?.has_batch || !!p.has_batch || !!p.datas?.has_batch;
        const hasSerialTracking = !!p.type_infos?.has_serialno || !!p.has_serialno || !!p.datas?.has_serialno;
        setProducts([{
          ...defaultProductRow,
          id: crypto.randomUUID(),
          inventory_id: p.id,
          variant_id: p.variant_id || undefined,
          name: p.variant ? `${p.name} - ${p.variant}` : p.name,
          costPrice: p.chosen_variant?.buy_price ?? p.chosen_variant?.pricing_infos?.buy_price ?? p.pricing_infos?.buy_price ?? p.buy_price ?? "",
          sellingPrice: p.chosen_variant?.sell_price ?? p.chosen_variant?.pricing_infos?.sell_price ?? p.pricing_infos?.sell_price ?? p.sell_price ?? "",
          sku: p.chosen_variant?.barcode ?? (p.sku || p.barcode || ""),
          unit: p.unit_infos?.name || p.unit || "pc",
          taxGst: (p.gst ?? p.datas?.gst) !== undefined ? parseInt(p.gst ?? p.datas?.gst) : 18,
          batchTracking: hasBatchTracking,
          serialTracking: hasSerialTracking,
          batch_id: p.chosen_batch?.id || "",
          batchNum: p.chosen_batch?.name || p.chosen_batch?.batch || p.batchNum || "",
          serialno_id: p.chosen_serial?.id || "",
          serialNumbers: p.chosen_serial?.name || p.chosen_serial?.serial || p.serialNumbers || ""
        }]);
      } else if (location.state?.supplier) {
        const sup = location.state.supplier;
        setSupplierDetails({
          id: sup.id,
          name: sup.name,
          ...sup
        });
        setPurchaseDetails(prev => ({ ...prev, supplier: sup.id }));
      }
    }
  }, [id, purchase, searchParams, location.state]);

  // --- Handlers ---
  const handleProductChange = useCallback((index: number, field: string, value: any) => {
    setProducts(prev => {
      const next = [...prev];
      (next[index] as any)[field] = value;
      return next;
    });
  }, []);

  const updateProductFields = useCallback((index: number, updates: Partial<ProductItem>) => {
    setProducts(prev => {
      const next = [...prev];
      if (index === -1) {
        next.push({ ...defaultProductRow, id: crypto.randomUUID(), ...updates });
      } else {
        if (!next[index]) {
          next[index] = { ...defaultProductRow, id: crypto.randomUUID() };
        }
        next[index] = { ...next[index], ...updates };
      }
      return next;
    });
  }, []);

  const addProduct = () => {
    setProducts([...products, { ...defaultProductRow, id: crypto.randomUUID() }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };


  const resetForm = () => {
    // Clear draft
    const draftId = searchParams.get("draftId");
    if (draftId) {
      const savedDrafts = JSON.parse(
        localStorage.getItem("purchase_drafts") || "[]"
      );
      const filtered = savedDrafts.filter((d: any) => d.id !== draftId);
      localStorage.setItem("purchase_drafts", JSON.stringify(filtered));
    }

    // Reset form
    setPurchaseDetails({
      supplier: "",
      invoiceNo: "",
      date: new Date().toISOString().split("T")[0],
      referenceNo: `PUR-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 10000)
      ).padStart(4, "0")}`,
    });

    setSupplierDetails(null);

    setProducts([
      {
        ...defaultProductRow,
        id: crypto.randomUUID(),
      },
    ]);

    setCharges({
      transport: "",
      other: "",
    });

    setPayment({
      method: "NONE",
      amountPaid: "",
      referenceNo: ""
    });

    setCostMethod("None");
    setSoldStockWarnings([]);
  }

  const handleSavePurchase = useCallback(async (isDraft: boolean | React.MouseEvent = false) => {
    const draftStatus = typeof isDraft === 'boolean' && isDraft;
    if (isSubmittingRef.current) return;
    if (!purchaseDetails.supplier && !supplierDetails?.id) {
      showToast("Please select a supplier.", "error");
      return;
    }

    if (products.length === 0 || !products[0].name) {
      showToast("Please add at least one product.", "error");
      return;
    }

    if (payment.method !== "NONE" && (!payment.amountPaid || Number(payment.amountPaid) <= 0)) {
      showToast("Paid amount is mandatory when a payment method is selected.", "error");
      return;
    }

    const unselected = products.find(p => !p.inventory_id && p.name);
    if (unselected) {
      showToast(`Product "${unselected.name}" was not selected from inventory. Please search and select it.`, "error");
      return;
    }

    // 💡 Strict validation for Direct Purchase only
    if (purchaseType === "DIRECT") {
      const missingBatch = products.find(p => p.batchTracking && !p.batchNum);
      if (missingBatch) {
        showToast(`Product "${missingBatch.name}" requires a batch number for direct receipt.`, "error");
        return;
      }

      const missingSerials = products.find(p => {
        if (!p.serialTracking) return false;
        const count = p.serialNumbers?.split(",").filter((s: string) => s.trim()).length || 0;
        return count < (Number(p.quantity) || 0);
      });
      if (missingSerials) {
        showToast(`Product "${missingSerials.name}" requires ${missingSerials.quantity} serial numbers for direct receipt.`, "error");
        return;
      }
    }

    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      const transformedProducts = products.map((p) => {
        const q = Math.floor(Number(p.quantity) || 0);
        const rawCostPrice = Number(p.costPrice) || 0;
        const gstRate = Number(p.taxGst) || 0;
        const baseCost = gstMode === "inclusive"
          ? rawCostPrice / (1 + gstRate / 100)
          : rawCostPrice;

        const rowBaseCost = baseCost;
        const rowGstPerUnit = gstMode === "inclusive"
          ? rawCostPrice - rowBaseCost
          : rawCostPrice * (gstRate / 100);
        const costForSp = rowBaseCost + rowGstPerUnit;

        let allocated = 0;
        if (costMethod === "By Unit" && stats.totalQty > 0) {
          allocated = stats.totalCharges / stats.totalQty;
        } else if (costMethod === "By Value" && stats.subtotal > 0) {
          allocated = (baseCost / stats.subtotal) * stats.totalCharges;
        } else if (costMethod === "Equally" && products.length > 0) {
          allocated = (stats.totalCharges / products.length) / (q > 0 ? q : 1);
        }
        const netCostForSp = costForSp + allocated;

        let finalSellPrice = 0;
        if (p.marginType === "percent") {
          finalSellPrice = netCostForSp + (netCostForSp * ((Number(p.marginPercent) || 0) / 100));
        } else if (p.marginType === "amount" && Number(p.marginAmount) > 0) {
          finalSellPrice = netCostForSp + (Number(p.marginAmount) || 0);
        } else {
          finalSellPrice = Number(p.sellingPrice) || 0;
        }

        const serials = p.serialNumbers ? p.serialNumbers.split(",").map(s => s.trim()).filter(Boolean) : [];
        // Use the actual backend DB id for update payloads, not the local React row id
        const backendItemId = (p as any)._backendId || (p.id && !p.id.startsWith("temp-") ? p.id : null);

        return {
          // For update: use the real persisted backend item ID
          id: id ? (backendItemId || undefined) : undefined,
          product_id: p.inventory_id || "unknown",
          variant_id: p.variant_id || undefined,
          batch_infos: p.batchTracking && p.batchNum
            ? (p.batch_id
              ? { id: p.batch_id }
              : {
                name: p.batchNum,
                manufacturing_date: p.manufacturingDate || new Date().toISOString(),
                expiry_date: p.expiryDate || new Date().toISOString()
              }
            )
            : null,
          serialno_numbers: serials.length > 0 ? serials.map(s => ({ name: s })) : null,
          storage_location_infos: p.storageLoc ? { name: p.storageLoc } : null,
          reorder_point_infos: p.reorderPoint ? { reorder_point: Number(p.reorderPoint) } : null,
          pricing_infos: {
            buy_price: Number(baseCost.toFixed(2)),
            sell_price: Number(finalSellPrice.toFixed(2))
          },
          gst: String(p.taxGst || 0).includes("%") ? String(p.taxGst || 0) : `${p.taxGst || 0}%`,
          stock_infos: {
            stocks: q
          }
        };
      });

      const costMethodMap: Record<string, any> = {
        "None": "NONE",
        "By Unit": "BY_UNIT",
        "By Value": "BY_VALUE",
        "Equally": "EQUALLY"
      };

      const hasPaidAmount = payment.amountPaid !== "" && payment.amountPaid !== null && payment.amountPaid !== undefined && Number(payment.amountPaid) > 0;
      const paymentInfosPayload = payment.method !== "NONE" && hasPaidAmount
        ? [
          {
            method: payment.method,
            amount: Number(payment.amountPaid),
            reference_no: payment.referenceNo || undefined
          }
        ]
        : [];

      const payload = {
        purchase_id: id || undefined,
        shop_id: SHOP_ID,
        supplier_id: supplierDetails?.id || "SUP_" + (purchaseDetails?.supplier?.substring(0, 3)?.toUpperCase() || "UNK"),
        type: purchaseType,
        status: draftStatus ? "DRAFT" : "COMPLETED",
        calculation_infos: {
          distribute_by: costMethodMap[costMethod] || "NONE",
          gst_type: gstMode
        },
        gst_infos: {
          type: gstMode.toUpperCase()
        },
        charges_infos: {
          transport_charge: Number(charges.transport) || 0,
          other_charge: Number(charges.other) || 0
        },
        payment_infos: paymentInfosPayload,
        purchase_date: purchaseDetails.date,
        items: transformedProducts,
        invoice_no: purchaseDetails.invoiceNo || ""
      };

      let res;
      if (id) {
        const updatePayload = {
          id: id,
          shop_id: SHOP_ID,
          supplier_id: supplierDetails?.id || purchaseDetails.supplier || undefined,
          invoice_no: purchaseDetails.invoiceNo || undefined,
          status: draftStatus ? "DRAFT" : "COMPLETED",
          calculation_infos: {
            distribute_by: costMethodMap[costMethod] || "NONE",
            gst_type: gstMode
          },
          charges_infos: {
            transport_charge: Number(charges.transport) || 0,
            other_charge: Number(charges.other) || 0
          },
          payment_infos: paymentInfosPayload,
          purchase_date: purchaseDetails.date,
          items: transformedProducts
            .filter((p: any) => {
              // Only send items that have a real backend ID. Items without one
              // (e.g. temp- rows from newly added lines during edit) would cause
              // a backend conflict when the same product_id appears multiple times.
              if (!p.id) return false;
              return true;
            })
            .map((p: any) => ({
              id: p.id,
              product_id: p.product_id,
              variant_id: p.variant_id,
              batch_infos: p.batch_infos,
              serialno_numbers: p.serialno_numbers,
              storage_location_infos: p.storage_location_infos,
              reorder_point_infos: p.reorder_point_infos,
              pricing_infos: p.pricing_infos,
              gst: p.gst,
              stock_infos: p.stock_infos
            }))
        };
        res = await purchase.updatePurchase(updatePayload);
      } else {
        res = await purchase.createPurchase(payload);
      }

      if (res) {
        showToast(id ? "Purchase updated" : "Purchase created", "success");
        if (draftStatus) {
          navigate("/purchase-history");
        } else {
          setShowSuccessModal(true);
        }
      }
    } catch (error: any) {
      showToast(error.message || "Failed to save purchase", "error");
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  }, [purchaseDetails, products, charges, payment, supplierDetails, id, showToast, navigate, searchParams, costMethod, stats, purchaseType, gstMode]);

  // --- Header Actions ---
  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        {!id && (
          <button
            type="button"
            onClick={() => handleSavePurchase(true)}
            className="px-4 h-8 rounded-xl border border-blue-100 text-blue-600 font-bold text-xs bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2 whitespace-nowrap overflow-hidden"
          >
            <Bookmark size={14} className="shrink-0" />
            <span className="truncate">Save Draft</span>
          </button>
        )}
        <GradientButton
          icon={submitting ? <Loader className="h-4 w-4" /> : <Save size={16} />}
          onClick={handleSavePurchase}
          disabled={submitting}
          className="rounded-xl shadow-md text-xs px-8 h-8 flex items-center"
        >
          {submitting ? "Processing..." : (id ? "Update Purchase" : "Confirm Purchase")}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, submitting, id, handleSavePurchase]);

  const handleAddNewProduct = useCallback((query: string) => {
    openQuickCreate("PRODUCT", (newProduct: any) => {
      const emptyIndex = products.findIndex(p => !p.name && !p.inventory_id);
      const hasBatchTracking = !!newProduct.has_batch || !!(newProduct.datas && newProduct.datas.has_batch);
      const hasSerialTracking = !!newProduct.has_serialno || !!(newProduct.datas && newProduct.datas.has_serialno);

      if (emptyIndex >= 0) {
        updateProductFields(emptyIndex, {
          inventory_id: newProduct.id,
          name: newProduct.name,
          costPrice: newProduct.buy_price,
          sellingPrice: newProduct.sell_price,
          sku: newProduct.barcode,
          unit: newProduct.unit_name || newProduct.datas?.unit || "pc",
          category: newProduct.category_name || newProduct.category_id || "",
          taxGst: newProduct.datas?.gst !== undefined && newProduct.datas?.gst !== null ? parseInt(newProduct.datas?.gst) : 18,
          batchTracking: hasBatchTracking,
          serialTracking: hasSerialTracking
        });
      } else {
        setProducts(prev => [...prev, {
          ...defaultProductRow,
          id: crypto.randomUUID(),
          inventory_id: newProduct.id,
          name: newProduct.name,
          costPrice: newProduct.buy_price,
          sellingPrice: newProduct.sell_price,
          sku: newProduct.barcode,
          unit: newProduct.unit_name || newProduct.datas?.unit || "pc",
          category: newProduct.category_name || newProduct.category_id || "",
          taxGst: newProduct.datas?.gst !== undefined && newProduct.datas?.gst !== null ? parseInt(newProduct.datas?.gst) : 18,
          batchTracking: hasBatchTracking,
          serialTracking: hasSerialTracking
        }]);
      }
    }, { name: query });
  }, [openQuickCreate, products, updateProductFields, defaultProductRow]);

  return (
    <>
      <PurchaseSuccessModal
        open={showSuccessModal}
        supplier={supplierDetails?.name}
        invoiceNo={purchaseDetails.invoiceNo}
        total={stats.grandTotal}
        onAddAnother={() => {
          resetForm();
          setShowSuccessModal(false);
        }}
        onViewPurchases={() => {
          navigate("/purchase-history");
        }}
      />
      <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 lg:p-8 font-sans">
        <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row gap-6 items-start">

          {/* --- Left Column (Scrollable Content) --- */}
          <div className="flex-1 w-full space-y-6 min-w-0">

            {soldStockWarnings.length > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-3">
                  <Info className="text-amber-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="text-amber-800 font-bold text-sm uppercase tracking-wide">Warning: Stock Already Sold</h3>
                    <p className="text-amber-700 text-xs mt-1 leading-relaxed font-medium">
                      Some items from this purchase have already been sold. Editing their quantities or prices will retroactively affect historical profit margins.
                    </p>
                    <ul className="list-disc list-inside text-amber-700 text-xs mt-2 font-semibold space-y-0.5">
                      {soldStockWarnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 1. Purchase Details Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-8 py-5 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 shadow-sm">
                  <PackageOpen size={20} />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Purchase Details</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Basic information & supplier</p>
                </div>
                {id && purchaseVersion && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Version</span>
                    <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-black tracking-widest shadow-sm border border-blue-400/30">
                      {purchaseVersion.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Supplier *</label>
                  <SearchSelect
                    labelKey="name"
                    valueKey="id"
                    fetchOptions={async (q) => await supplierApi.searchSuppliers(q)}
                    options={supplierDetails ? [supplierDetails] : []}
                    value={supplierDetails?.id || purchaseDetails.supplier}
                    onChange={(val, opt: any) => {
                      setPurchaseDetails({ ...purchaseDetails, supplier: val ? String(val) : "" });
                      setSupplierDetails(opt || null);
                    }}
                    // 💡 Triggers the On-The-Fly Supplier Modal
                    onCreateNew={(query) => openQuickCreate("SUPPLIER", (newSupplier: any) => {
                      setPurchaseDetails(prev => ({ ...prev, supplier: String(newSupplier.id) }));
                      setSupplierDetails(newSupplier);
                    }, { name: query })}
                    placeholder="Search Supplier..."
                    className="w-full h-11"
                    entityName="Supplier"
                  />
                </div>

                <Input
                  label="Supplier Invoice #"
                  tooltip="Enter the invoice number provided by the supplier for this purchase."
                  placeholder="INV-2026-..."
                  value={purchaseDetails.invoiceNo}
                  onChange={(e) => setPurchaseDetails({ ...purchaseDetails, invoiceNo: e.target.value })}
                />
                <Input
                  label="Purchase Date"
                  tooltip="The date on which the purchase was made."
                  required
                  type="date"
                  value={purchaseDetails.date}
                  onChange={(e) => setPurchaseDetails({ ...purchaseDetails, date: e.target.value })}
                />
              </div>

              {supplierDetails && (
                <div className="px-8 pb-6 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="p-3 bg-gradient-to-r from-blue-50/30 via-white to-blue-50/20 border border-blue-100 rounded-lg shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 shadow-inner">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mb-0.5">Supplier</p>
                        <p className="text-base font-black text-slate-800 tracking-tight">{supplierDetails.name || supplierDetails.supplier_name}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-lg border border-slate-100 transition-all hover:border-blue-200 group">
                        <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                          <Mail size={12} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Email</span>
                          <span className="text-[10px] font-bold text-slate-600 truncate max-w-[150px]">
                            {supplierDetails.contact_infos?.email || supplierDetails.email || "Missing"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-lg border border-slate-100 transition-all hover:border-emerald-200 group">
                        <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                          <Smartphone size={12} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Phone</span>
                          <span className="text-[10px] font-bold text-slate-600">
                            {supplierDetails.contact_infos?.mobile_number || supplierDetails.phone || supplierDetails.mobile_number || "Missing"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-lg border border-slate-100 transition-all hover:border-amber-200 group">
                        <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
                          <FileText size={12} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">GST</span>
                          <span className="text-[10px] font-bold text-slate-600 uppercase">
                            {supplierDetails.gst_no || supplierDetails.gst_number || supplierDetails.gst || "Missing"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-lg border border-slate-100 transition-all hover:border-violet-200 group">
                        <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-violet-500 transition-colors">
                          <MapPin size={12} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Address</span>
                          <span className="text-[10px] font-bold text-slate-600 truncate max-w-[200px]" title={supplierDetails.location_infos?.full_address || supplierDetails.address?.full_address || (typeof supplierDetails.address === 'string' ? supplierDetails.address : "Missing")}>
                            {supplierDetails.location_infos?.full_address || supplierDetails.address?.full_address || (typeof supplierDetails.address === 'string' ? supplierDetails.address : "Missing")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Charges Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-transparent border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200 shadow-sm">
                  <Banknote size={16} />
                </div>
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Additional Charge & Details</h2>
              </div>

              <div className="p-6 flex flex-col gap-6">

                {/* Row 1: Transport & Other Charges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Transport */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 group cursor-help w-fit">
                      Transport Charge
                      <Tooltip message="Delivery or transportation costs charged by the supplier.">
                        <span className="cursor-help flex"><Info size={12} className="text-slate-400 group-hover:text-blue-500 transition-colors" /></span>
                      </Tooltip>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-black">₹</span>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full h-11 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all tabular-nums shadow-sm"
                        value={charges.transport as any}
                        onChange={(e) => setCharges({ ...charges, transport: e.target.value ? Number(e.target.value) : "" })}
                      />
                    </div>
                  </div>

                  {/* Other Charges */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 group cursor-help w-fit">
                      Other Charges
                      <Tooltip message="Any additional fees, loading/unloading costs, or miscellaneous charges.">
                        <span className="cursor-help flex"><Info size={12} className="text-slate-400 group-hover:text-blue-500 transition-colors" /></span>
                      </Tooltip>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-black">₹</span>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full h-11 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all tabular-nums shadow-sm"
                        value={charges.other as any}
                        onChange={(e) => setCharges({ ...charges, other: e.target.value ? Number(e.target.value) : "" })}
                      />
                    </div>
                  </div>
                </div>

                {/* Distribute By */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 group cursor-help w-fit">
                    Distribute By
                    <Tooltip message="How the additional charges should be distributed across the purchased items' cost price.">
                      <span className="cursor-help flex"><Info size={12} className="text-slate-400 group-hover:text-blue-500 transition-colors" /></span>
                    </Tooltip>
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[
                      { name: "None", tooltip: "Do not allocate additional charges to product cost" },
                      { name: "By Unit", tooltip: "Allocate proportionally based on item quantity" },
                      { name: "By Value", tooltip: "Allocate proportionally based on total item value", recommended: true },
                      { name: "Equally", tooltip: "Split additional charges equally across all items" }
                    ].map((method) => (
                      <button
                        key={method.name}
                        onClick={() => setCostMethod(method.name)}
                        className={`px-2 py-1.5 h-11 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all flex-1 whitespace-nowrap ${costMethod === method.name
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-slate-50"
                          }`}
                      >
                        <span>{method.name}</span>
                        {method.recommended && (
                          <span className="text-[8px] font-black text-blue-600 bg-blue-100/90 px-1 py-0.5 rounded shadow-2xs lowercase tracking-normal">Recommended</span>
                        )}
                        <Tooltip message={method.tooltip}>
                          <span className="cursor-help flex items-center justify-center group/tooltip relative">
                            <Info size={12} className={`transition-colors ${costMethod === method.name ? "text-blue-500" : "text-slate-400 group-hover:text-blue-400"}`} />
                          </span>
                        </Tooltip>
                      </button>
                    ))}
                  </div>
                </div>



                {/* Expandable GST Rate Breakdown */}
                {stats.totalGst > 0 && (
                  <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all">
                    <button
                      onClick={() => setIsGstExpanded(!isGstExpanded)}
                      className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        GST Rate Breakdown
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-700 tabular-nums">Total GST: ₹{stats.totalGst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        {isGstExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </div>
                    </button>

                    {isGstExpanded && (
                      <div className="p-4 border-t border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        {Object.entries(stats.gstBreakdown).map(([rate, amt]) => {
                          if (Number(amt) <= 0) return null;
                          const basePriceForRate = products.reduce((acc, p) => {
                            const q = Number(p.quantity) || 0;
                            const c = Number(p.costPrice) || 0;
                            const r = Number(p.taxGst) || 0;
                            if (r === Number(rate)) {
                              return acc + (q * c);
                            }
                            return acc;
                          }, 0);
                          return (
                            <div key={rate} className="flex justify-between items-center text-[11px] text-slate-600 font-medium">
                              <span className="text-slate-500">
                                GST {rate}% (on ₹{basePriceForRate.toLocaleString()})
                              </span>
                              <span className="text-slate-800 font-bold tabular-nums">
                                ₹{Number(amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          );
                        })}
                        <div className="text-[10px] text-slate-400 italic pt-2 border-t border-slate-200/30 flex flex-col gap-0.5 leading-normal">
                          <span className="font-semibold text-slate-500">Breakdown explanation:</span>
                          <span>Product base: ₹{stats.subtotal.toLocaleString()} + GST: ₹{stats.totalGst.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} = ₹{(stats.subtotal + stats.totalGst).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} with GST</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>



            <InventoryItemsCard
              products={products}
              stats={stats}
              costMethod={costMethod}
              setCostMethod={setCostMethod}
              handleProductChange={handleProductChange}
              updateProductFields={updateProductFields}
              setProducts={setProducts}
              addProduct={addProduct}
              removeProduct={removeProduct}
              type="PURCHASE"
              purchaseType={purchaseType}
              onAddNewProduct={handleAddNewProduct}
              gstMode={gstMode}
              setGstMode={setGstMode}
              isUpdate={!!id}
            />

          </div>

          {/* --- Right Column (Sticky Payment Summary) --- */}
          <div className="w-full xl:w-[18rem] shrink-0 xl:sticky xl:top-6 space-y-6">

            {/* Payment Summary Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 shadow-sm">
                  <Banknote size={16} />
                </div>
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Payment Summary</h2>
              </div>

              <div className="p-6 flex flex-col h-full bg-slate-50/50">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-slate-500 font-medium">Subtotal</span>
                    <span className="font-bold text-slate-800 tabular-nums">₹{stats.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-slate-500 font-medium">Total GST</span>
                    <span className="font-bold text-slate-800 tabular-nums">₹{stats.totalGst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-slate-500 font-medium">Add. Charges</span>
                    <span className="font-bold text-slate-800 tabular-nums">₹{stats.totalCharges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-slate-200/50 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                    <span className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">₹{stats.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Paid By & Paid Amount */}
                <div className="space-y-4 pt-4 border-t border-slate-200/50 mt-auto">
                  {/* Paid By (Dropdown) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 group cursor-help w-fit">
                      Paid By
                      <Tooltip message="The method of payment used for this transaction.">
                        <span className="cursor-help flex"><Info size={12} className="text-slate-400 group-hover:text-blue-500 transition-colors" /></span>
                      </Tooltip>
                    </label>
                    <ReusableSelect
                      value={payment.method}
                      onValueChange={(val) => {
                        if (val === "NONE") {
                          setPayment({ ...payment, method: "NONE", amountPaid: "", referenceNo: "" });
                        } else {
                          setPayment({ ...payment, method: val as PaymentMethod });
                        }
                      }}
                      options={[
                        { value: "NONE", label: "None" },
                        { value: "CASH", label: "Cash" },
                        { value: "UPI", label: "UPI" },
                        { value: "CARD", label: "Credit/Debit Card" },
                        { value: "BANK", label: "Bank Transfer" }
                      ]}
                      placeholder="Select Payment Method"
                    />
                  </div>

                  {payment.method !== "NONE" && (
                    <>
                      {/* Paid Amount */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                          <span>Paid Amount <span className="text-rose-500">*</span></span>
                          <span className="text-emerald-500 font-bold uppercase tracking-wider">{payment.method}</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 text-sm font-bold">₹</span>
                          <input
                            type="number"
                            placeholder="0"
                            className="w-full h-11 pl-8 pr-3 bg-white border border-emerald-200 rounded-lg text-sm font-medium text-emerald-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all tabular-nums shadow-sm"
                            value={payment.amountPaid === 0 || payment.amountPaid === "0" ? "" : payment.amountPaid}
                            onFocus={() => {
                              if (payment.amountPaid === 0 || payment.amountPaid === "0") {
                                setPayment({ ...payment, amountPaid: "" });
                              }
                            }}
                            onChange={(e) => setPayment({ ...payment, amountPaid: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Reference Number */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                          <span>Reference / Txn No.</span>
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">(Optional)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Enter Ref No..."
                            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-sm"
                            value={payment.referenceNo || ""}
                            onChange={(e) => setPayment({ ...payment, referenceNo: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Outstanding Amount */}
                  <div className="flex flex-col gap-2">
                    <div className={`h-11 px-4 rounded-lg border shadow-sm flex items-center justify-between transition-colors ${stats.outstanding > 0 ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${stats.outstanding > 0 ? "text-rose-400" : "text-slate-400"}`}>Outstanding</span>
                      <span className={`text-lg font-semibold tabular-nums ${stats.outstanding > 0 ? "text-rose-600" : "text-slate-600"}`}>
                        ₹{stats.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Sidebar Filter for Custom Field Creation — REMOVED */}

      <NavigationBlocker shouldBlock={!showSuccessModal ? undefined : false} data={{ purchaseDetails, products, charges, payment, supplierDetails }} isLoading={loadingData} isSubmitting={submitting} />
    </>
  );
};

export default PurchaseForm;