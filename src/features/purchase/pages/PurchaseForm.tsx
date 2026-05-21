import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Save,
  Banknote,
  Smartphone,
  CreditCard,
  Landmark,
  PackageOpen,
  Bookmark,
  Mail,
  User
} from "lucide-react";

import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { supplierApi } from "@/services/api/supplier";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import Loader from "@/components/common/Loader";
import { InventoryItemsCard } from "@/features/purchase/components/InventoryItemsCard";
import { useQuickCreate } from "@/features/common/QuickCreate/QuickCreateContext";

type PaymentMethod = "Cash" | "UPI" | "Card" | "Bank";

export interface ProductItem {
  id: string;
  inventory_id?: string;
  variant_id?: string;
  name: string;
  quantity: number | "";
  costPrice: number | "";
  sellingPrice: number | "";
  marginPercent: number | "";
  marginAmount: number | "";
  marginType: "percent" | "amount" | "sellingPrice";
  unit: string;
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
}


// ─── Main Component ───────────────────────────────────────────────────────────

const PurchaseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { postData, getData, putData } = useApi();
  const { setBottomActions } = useHeader();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const { openQuickCreate } = useQuickCreate();

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
    unit: "pc", taxGst: 18, storageLoc: "", reorderPoint: "", expiryDate: "", manufacturingDate: "", batchTracking: false, serialTracking: false, serialNumbers: "", batchNum: "", batch_id: "", serialno_id: "", sku: "", variant: "", size: ""
  };

  const [products, setProducts] = useState<ProductItem[]>([defaultProductRow]);

  const [charges, setCharges] = useState({ transport: "" as number | "", other: "" as number | "" });
  const [purchaseType, setPurchaseType] = useState<"DIRECT" | "PO_CREATE" | "PO_UPDATE" | "PRODUCTION">(() => {
    const type = searchParams.get("type");
    return (type as any) || "DIRECT";
  });
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [payment, setPayment] = useState({ method: "Cash" as PaymentMethod, amountPaid: "" as number | "" });
  const [costMethod, setCostMethod] = useState("None");
  const [supplierDetails, setSupplierDetails] = useState<any>(null);

  // --- Calculations ---
  const stats = useMemo(() => {
    let totalQty = 0;
    let subtotal = 0;

    products.forEach(p => {
      const q = Number(p.quantity) || 0;
      const c = Number(p.costPrice) || 0;
      totalQty += q;
      subtotal += (q * c);
    });

    const transportCost = Number(charges.transport) || 0;
    const otherCost = Number(charges.other) || 0;
    const totalCharges = transportCost + otherCost;

    const grandTotal = Math.round(subtotal + totalCharges);
    const paid = Number(payment.amountPaid) || 0;
    const outstanding = grandTotal - paid;

    // Per-product charge allocation
    const allocations = products.map(p => {
      const q = Number(p.quantity) || 0;
      const c = Number(p.costPrice) || 0;
      let alloc = 0;
      if (costMethod === "By Unit" && totalQty > 0) {
        alloc = (q / totalQty) * totalCharges;
      } else if (costMethod === "By Value" && subtotal > 0) {
        alloc = ((q * c) / subtotal) * totalCharges;
      } else if (costMethod === "Equally" && products.length > 0) {
        alloc = totalCharges / products.length;
      }
      const netCostPerUnit = q > 0 ? (q * c + alloc) / q : c;
      return { alloc, netCostPerUnit };
    });

    return { totalQty, subtotal, totalCharges, grandTotal, outstanding, allocations };
  }, [products, charges, payment.amountPaid, costMethod]);

  // --- Load Existing Purchase or Draft ---
  useEffect(() => {
    if (id) {
      const fetchPurchase = async () => {
        const res = await getData(`${ENDPOINTS.PURCHASES}/${id}`);
        if (res && res.data) {
          const data = res.data;
          setPurchaseDetails(data.purchaseDetails || {
            supplier: data.supplier_name,
            invoiceNo: data.invoice_no || "",
            date: data.date || new Date().toISOString().split("T")[0],
            referenceNo: data.reference_no || "",
          });
          setPurchaseType(data.type || "DIRECT");
          setPurchaseId(data.id);
          setProducts(data.products.map((p: any) => ({
            id: p.id || Math.random().toString(),
            name: p.name,
            quantity: p.quantity,
            costPrice: p.buy_price,
            sellingPrice: p.sell_price,
            marginPercent: "",
            marginAmount: "",
            marginType: "sellingPrice",
            unit: p.unit || "pc",
            taxGst: p.gst || 18,
            sku: p.barcode,
            variant: p.variant || "",
            batchTracking: p.batch_tracking || false,
            serialTracking: p.serial_tracking || false,
            batchNum: p.batch_number || "",
            manufacturingDate: p.manufacturing_date || "",
            expiryDate: p.expiry_date || "",
            serialno_id: p.serialno_id || p.serial_number?.id || p.serial_numbers?.id,
            serialNumbers: Array.isArray(p.serial_numbers) ? p.serial_numbers.join(',') : (p.serial_numbers?.serial_numbers || p.serial_number?.serial_numbers || []).join(','),
            existingSerials: Array.isArray(p.serial_numbers) ? p.serial_numbers : (p.serial_numbers?.serial_numbers || p.serial_number?.serial_numbers || [])
          })));
          setCharges(data.additional_charges ? {
            transport: data.additional_charges.delivery_charge,
            other: data.additional_charges.other_charge
          } : data.charges || { transport: 0, other: 0 });
          setPayment(data.payment || { method: "Cash", amountPaid: 0 });
        }
      };
      fetchPurchase();
    } else {
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
      }
    }
  }, [id, getData, searchParams]);

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
      next[index] = { ...next[index], ...updates };
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

  const handleSaveDraft = useCallback(() => {
    const savedDrafts = JSON.parse(localStorage.getItem("purchase_drafts") || "[]");
    const draftId = searchParams.get("draftId") || Date.now().toString();

    const newDraft = {
      id: draftId,
      type: "PURCHASE",
      data: { purchaseDetails, products, charges, payment, supplierDetails },
      timestamp: new Date().toISOString(),
      displayName: supplierDetails?.name || purchaseDetails.supplier || "Untitled Purchase"
    };

    const existingIndex = savedDrafts.findIndex((d: any) => d.id === draftId);
    if (existingIndex > -1) {
      savedDrafts[existingIndex] = newDraft;
    } else {
      savedDrafts.push(newDraft);
    }

    localStorage.setItem("purchase_drafts", JSON.stringify(savedDrafts));
    showToast("Progress saved as draft", "info");
    if (!searchParams.get("draftId")) {
      navigate(`?draftId=${draftId}`, { replace: true });
    }
  }, [purchaseDetails, products, charges, payment, supplierDetails, navigate, searchParams, showToast]);

  const handleSavePurchase = useCallback(async () => {
    if (!purchaseDetails.supplier && !supplierDetails?.id) {
      showToast("Please select a supplier.", "error");
      return;
    }

    if (products.length === 0 || !products[0].name) {
      showToast("Please add at least one product.", "error");
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

    setSubmitting(true);
    try {
      const transformedProducts = products.map((p) => {
        const q = Math.floor(Number(p.quantity) || 0);
        const baseCost = Number(p.costPrice) || 0;

        let allocated = 0;
        if (costMethod === "By Unit" && stats.totalQty > 0) {
          allocated = stats.totalCharges / stats.totalQty;
        } else if (costMethod === "By Value" && stats.subtotal > 0) {
          allocated = (baseCost / stats.subtotal) * stats.totalCharges;
        } else if (costMethod === "Equally" && products.length > 0) {
          allocated = (stats.totalCharges / products.length) / (q > 0 ? q : 1);
        }
        const finalCost = baseCost + allocated;

        let finalSellPrice = 0;
        if (p.marginType === "percent") {
          finalSellPrice = finalCost + (finalCost * ((Number(p.marginPercent) || 0) / 100));
        } else if (p.marginType === "amount") {
          finalSellPrice = finalCost + (Number(p.marginAmount) || 0);
        } else {
          finalSellPrice = Number(p.sellingPrice) || 0;
        }

        return {
          inventory_id: p.inventory_id || null,
          variant_id: p.variant_id || null,
          name: p.name,
          barcode: p.sku,
          stocks: q,
          received_stocks: q,
          buy_price: baseCost,
          sell_price: Number(finalSellPrice.toFixed(2)),
          margin: Number(p.marginPercent) || 0,
          unit: p.unit || "pc",
          gst: Number(p.taxGst) || 0,
          batch_tracking: p.batchTracking || false,
          serial_tracking: p.serialTracking || false,
          batch_number: p.batchNum || "",
          manufacturing_date: p.manufacturingDate || null,
          expiry_date: p.expiryDate || null,
          variant: p.variant || "",
          batch_id: p.batch_id || null,
          serialno_id: p.serialno_id || null,
          serial_numbers: p.serialNumbers ? p.serialNumbers.split(",").map(s => s.trim()).filter(Boolean) : [],
          batch: (!p.batch_id && p.batchTracking && p.batchNum) ? {
            name: p.batchNum,
            manufacturing_date: p.manufacturingDate || new Date().toISOString(),
            expiry_date: p.expiryDate || new Date().toISOString()
          } : undefined,
        };
      });

      const costMethodMap: Record<string, any> = {
        "None": "NONE",
        "By Unit": "BY_QUANTITY",
        "By Value": "BY_VALUE",
        "Equally": "BY_EQUAL"
      };

      const payload = {
        shop_id: SHOP_ID,
        type: purchaseType,
        purchase_id: purchaseId || null,
        supplier_id: supplierDetails?.id || "SUP_" + purchaseDetails.supplier.substring(0, 3).toUpperCase(),
        calculations: {
          divided_by: costMethodMap[costMethod] || "NONE",
          gst: {
            type: "inclusive",
            value: 18,
            registered: true
          }
        },
        additional_charges: {
          delivery_charge: Number(charges.transport) || 0,
          other_charge: Number(charges.other) || 0
        },
        datas: {
          supplier_name: supplierDetails?.name || purchaseDetails.supplier,
          purchaseDetails: { ...purchaseDetails },
          payment: {
            method: payment.method,
            amountPaid: Number(payment.amountPaid) || 0
          },
        },
        paid_amount: Number(payment.amountPaid) || 0,
        products: transformedProducts,
      };

      let res;
      if (id) {
        res = await putData(`${ENDPOINTS.PURCHASES}/${id}`, payload);
      } else {
        res = await postData(ENDPOINTS.PURCHASES, payload);
      }

      if (res) {
        showToast(id ? "Purchase updated" : "Purchase created", "success");
        // Clear draft
        const draftId = searchParams.get("draftId");
        if (draftId) {
          const savedDrafts = JSON.parse(localStorage.getItem("purchase_drafts") || "[]");
          const filtered = savedDrafts.filter((d: any) => d.id !== draftId);
          localStorage.setItem("purchase_drafts", JSON.stringify(filtered));
        }
        navigate("/purchase-history");
      }
    } catch (error: any) {
      showToast(error.message || "Failed to save purchase", "error");
    } finally {
      setSubmitting(false);
    }
  }, [purchaseDetails, products, charges, payment, supplierDetails, id, postData, putData, showToast, navigate, searchParams]);

  // --- Header Actions ---
  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        {!id && (
          <button
            type="button"
            onClick={handleSaveDraft}
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
  }, [setBottomActions, submitting, id, handleSavePurchase, handleSaveDraft]);

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
          unit: newProduct.datas?.unit || "pc",
          taxGst: parseInt(newProduct.datas?.gst) || 18,
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
          unit: newProduct.datas?.unit || "pc",
          taxGst: parseInt(newProduct.datas?.gst) || 18,
          batchTracking: hasBatchTracking,
          serialTracking: hasSerialTracking
        }]);
      }
    }, { name: query });
  }, [openQuickCreate, products, updateProductFields, defaultProductRow]);

  return (
    <>
      <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 lg:p-8 font-sans">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 items-start">

            {/* LEFT COLUMN: Main Form (5 cols) */}
            <div className="lg:col-span-5 space-y-6">

              {/* 1. Purchase Details Card */}
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div className="px-8 py-5 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 shadow-sm">
                    <PackageOpen size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Purchase Details</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Basic information & supplier</p>
                  </div>

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
                      className="w-full"
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
                    <div className="p-3 bg-gradient-to-r from-blue-50/30 via-white to-blue-50/20 border border-blue-100 rounded-[1.5rem] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 shadow-inner">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mb-0.5">Supplier</p>
                          <p className="text-base font-black text-slate-800 tracking-tight">{supplierDetails.name || supplierDetails.supplier_name}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-xl border border-slate-100 transition-all hover:border-blue-200 group">
                          <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                            <Mail size={12} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Email</span>
                            <span className="text-[10px] font-bold text-slate-600 truncate max-w-[150px]">
                              {supplierDetails.email || "Missing"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-xl border border-slate-100 transition-all hover:border-emerald-200 group">
                          <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                            <Smartphone size={12} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Phone</span>
                            <span className="text-[10px] font-bold text-slate-600">
                              {supplierDetails.phone || supplierDetails.mobile_number || "Missing"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Items List Card */}
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
              />
            </div>

            {/* RIGHT COLUMN: Summary & Payment (2 cols) */}
            <div className="lg:col-span-2 space-y-6">

              {/* 3. Order Summary Card */}
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200 shadow-sm">
                    <Banknote size={16} />
                  </div>
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Order Summary</h2>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Subtotal</span>
                    <span className="text-sm font-black text-slate-800 tabular-nums">₹{stats.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Transport</span>
                    <div className="w-24">
                      <Input
                        type="number"
                        tooltip="Delivery or transportation costs charged by the supplier."
                        placeholder="0"
                        className="!h-8 !text-right !text-xs !bg-slate-50/50"
                        value={charges.transport as any}
                        onChange={(e) => setCharges({ ...charges, transport: e.target.value ? Number(e.target.value) : "" })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Other Charges</span>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="0"
                        className="!h-8 !text-right !text-xs !bg-slate-50/50"
                        value={charges.other as any}
                        onChange={(e) => setCharges({ ...charges, other: e.target.value ? Number(e.target.value) : "" })}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                      <span className="text-3xl font-black text-slate-900 tracking-tight">₹{stats.grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Payment Details Card */}
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div className="px-6 py-4 bg-gradient-to-r from-amber-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 border border-amber-200 shadow-sm">
                    <CreditCard size={16} />
                  </div>
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Payment Details</h2>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "Cash", icon: <Banknote size={16} /> },
                      { id: "UPI", icon: <Smartphone size={16} /> },
                      { id: "Card", icon: <CreditCard size={16} /> },
                      { id: "Bank", icon: <Landmark size={16} /> }
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPayment({ ...payment, method: m.id as PaymentMethod })}
                        className={`flex flex-col items-center justify-center py-3 rounded-2xl border transition-all ${payment.method === m.id
                          ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                          : "border-slate-100 bg-slate-50/50 text-slate-400 hover:border-amber-200"
                          }`}
                      >
                        <div className="mb-1.5">{m.icon}</div>
                        <span className="text-[9px] font-black uppercase tracking-widest">{m.id}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4 pt-2">
                    <Input
                      label="Amount Paid Now (₹)"
                      type="number"
                      className="!h-12 !text-lg !font-black !text-emerald-600"
                      value={payment.amountPaid as any}
                      onChange={(e) => setPayment({ ...payment, amountPaid: e.target.value ? Number(e.target.value) : "" })}
                      placeholder={stats.grandTotal.toString()}
                    />

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstanding Balance</span>
                      <span className={`text-xl font-black ${stats.outstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        ₹{stats.outstanding.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default PurchaseForm;