import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Printer,
  Settings,
  Download,
} from "lucide-react";
import { shopApi } from "@/services/api/shop";
import { inventoryApi } from "@/services/api/inventory";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID, getShopId } from "@/services/endpoints";
import {
  printReceipt,
  ReceiptData,
  getPrinterConfig,
  getPrintersList,
  SavedPrinter,
  cleanShopAddress,
  getBillingReceiptConfig,
  getDigitalStoreUrl,
} from "@/features/billing/utils/printerService";
import { getReceiptCustomFields, extractItemAttributeValue, mergeOrderCustomFields, extractProductHsn, extractProductMrp, extractProductGstRate } from "@/features/billing/utils/customFieldsHelper";
import { PrinterConfigModal } from "@/features/billing/components/PrinterConfigModal";
import { QRCodeSVG } from "qrcode.react";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { extractSaleCustomerInfo, formatUnitName } from "../type";
import { useToast } from "@/context/ToastContext";
import { calculateTaxSplit } from "@/utils/pricing";

interface ReprintReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any | null;
  customerMap?: Record<string, any>;
  productMap?: Record<string, string>;
}

export const ReprintReceiptModal: React.FC<ReprintReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  customerMap = {},
  productMap = {},
}) => {
  const api = useApi();
  const { showToast } = useToast();

  const [shopData, setShopData] = useState<any>(null);
  const [fullSale, setFullSale] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrinterConfigOpen, setIsPrinterConfigOpen] = useState(false);
  const [printersList, setPrintersList] = useState<SavedPrinter[]>([]);
  const [targetPrinterId, setTargetPrinterId] = useState<string>("");
  const [fetchedProducts, setFetchedProducts] = useState<Record<string, any>>({});
  const receiptRef = useRef<HTMLDivElement>(null);

  // Sync printers list on mount and modal open
  useEffect(() => {
    if (isOpen) {
      const list = getPrintersList();
      setPrintersList(list);
      const def = list.find((p) => p.isDefault) || list[0];
      if (def) {
        setTargetPrinterId(def.id);
      }
    }
  }, [isOpen, isPrinterConfigOpen]);

  // Fetch shop data
  useEffect(() => {
    if (!isOpen) return;
    const shopId = getShopId() || SHOP_ID;
    if (shopId && shopId !== "string") {
      shopApi
        .getShopById(shopId)
        .then((res) => {
          const data = res?.data ?? res;
          setShopData(data);
        })
        .catch((err) => console.warn("Failed to fetch shop details for receipt:", err));
    }
  }, [isOpen]);

  // Fetch full sale detail if items aren't already rich
  useEffect(() => {
    if (!isOpen || !sale) {
      setFullSale(null);
      return;
    }

    setFullSale(sale);

    // Always fetch fresh single order detail if order id exists and detail is missing
    const activeShopId = (sale as any)?.shop_id || getShopId() || SHOP_ID;
    const hasDetailedItems =
      Array.isArray(sale.items) &&
      sale.items.length > 0 &&
      (sale.items[0].batch_infos || sale.items[0].batch_number || sale.items[0].batch_name || sale.additional_infos?.items_snapshot);

    if ((!hasDetailedItems || !sale.additional_infos) && sale.id) {
      setLoadingDetails(true);
      api
        .getData(`${ENDPOINTS.ORDERS}/${activeShopId}/${sale.id}`)
        .then((res: any) => {
          const ord = Array.isArray(res?.data) ? res.data[0] : (res?.data ?? res);
          if (ord) {
            setFullSale(ord);
          }
        })
        .catch((err: any) => {
          console.warn("Could not fetch extended order details, using summary:", err);
        })
        .finally(() => {
          setLoadingDetails(false);
        });
    }
  }, [isOpen, sale, api]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => document.body.classList.remove("no-scroll");
  }, [isOpen]);

  // Customer extracted info
  const customerInfo = useMemo(() => {
    return extractSaleCustomerInfo(fullSale || sale, customerMap);
  }, [fullSale, sale, customerMap]);

  // Calculations & Totals
  const totals = useMemo(() => {
    const s = fullSale || sale || {};
    const calc = s.calculation_infos || s.calculations || s.calc_infos || {};

    const itemsRaw = Array.isArray(s.items) ? s.items : (Array.isArray(calc.items) ? calc.items : []);

    let subtotal = Number(
      calc.subtotal ??
      calc.base_subtotal ??
      calc.total_before_discount ??
      s.total_buyprice ??
      0
    );

    let discountTotal = Number(
      calc.total_discount_given ??
      calc.discount_total ??
      calc.total_discount ??
      s.discount_amount ??
      0
    );

    let taxable = Number(calc.totalTaxable ?? calc.total_taxable ?? calc.taxable_amount ?? calc.taxable_value ?? 0);
    let gst = Number(calc.gst_amount ?? calc.total_tax ?? calc.tax ?? 0);
    let roundOff = Number(calc.round_off ?? calc.roundoff ?? 0);
    let grandTotal = Number(
      s.total_sellprice ??
      calc.total ??
      calc.grand_total ??
      s.total_amount ??
      0
    );

    // Compute fallback if calculation_infos wasn't provided by backend
    if (grandTotal === 0 && itemsRaw.length > 0) {
      grandTotal = itemsRaw.reduce((sum: number, it: any) => {
        const p = Number(it.sell_price ?? it.price ?? 0);
        const q = Number(it.quantity ?? it.qty ?? 1);
        return sum + (Number(it.total_amount) || p * q);
      }, 0);
    }

    if (subtotal === 0 && grandTotal > 0) {
      subtotal = grandTotal + discountTotal - gst;
    }

    let effectiveTaxable = taxable > 0 
      ? taxable 
      : (gst > 0 ? (grandTotal - gst - roundOff) : (subtotal - discountTotal));

    // Detect tax rates
    let gstRate = 0;
    if (calc.tax_groups && Array.isArray(calc.tax_groups) && calc.tax_groups.length > 0) {
      gstRate = Number(calc.tax_groups[0].gstRate || calc.tax_groups[0].gst_rate || 0);
    } else if (calc.gst_rate !== undefined && Number(calc.gst_rate) > 0) {
      gstRate = Number(calc.gst_rate);
    } else if (calc.tax_rate !== undefined && Number(calc.tax_rate) > 0) {
      gstRate = Number(calc.tax_rate);
    } else if (itemsRaw.length > 0) {
      for (const rawIt of itemsRaw) {
        const prodId = String(rawIt.product_id || rawIt.inventory_id || rawIt.id || "");
        const itRate = extractProductGstRate(rawIt) || (fetchedProducts[prodId] ? extractProductGstRate(fetchedProducts[prodId]) : 0);
        if (itRate > 0) {
          gstRate = itRate;
          break;
        }
      }
    }
    if (gstRate === 0 && effectiveTaxable > 0 && gst > 0) {
      gstRate = Math.round((gst / effectiveTaxable) * 100);
    }

    // Ensure GST inclusive math is accurate (selling price is inclusive of GST)
    if (taxable > 0 && gst > 0) {
      effectiveTaxable = taxable;
    } else if (gstRate > 0 && grandTotal > 0) {
      const split = calculateTaxSplit(grandTotal, gstRate);
      effectiveTaxable = split.taxableValue;
      gst = split.gstAmount;
    }

    const cgstRate = gstRate > 0 ? gstRate / 2 : 0;
    const sgstRate = gstRate > 0 ? gstRate / 2 : 0;
    const cgstAmount = Math.round((gst / 2) * 100) / 100;
    const sgstAmount = Math.round((gst - cgstAmount) * 100) / 100;

    const deliveryFee = Number(
      calc.delivery_fee ??
      calc.delivery_charge ??
      s.charges_infos?.delivery_charge ??
      s.charges_infos?.delivery_fee ??
      s.additional_infos?.delivery_charge ??
      s.additional_infos?.delivery_fee ??
      s.additional_infos?.delivery_option?.delivery_charge ??
      s.online_details?.delivery_fee ??
      s.online_details?.delivery_charge ??
      s.delivery_fee ??
      s.delivery_charge ??
      (grandTotal > subtotal && (s.origin === 'ONLINE' || s.origin === 'Online Sales' || Boolean(s.online_details))
        ? grandTotal - subtotal
        : 0)
    );

    return {
      subtotal,
      discountTotal,
      taxable: effectiveTaxable,
      gst,
      gstRate,
      cgstRate,
      sgstRate,
      cgstAmount,
      sgstAmount,
      deliveryFee,
      roundOff,
      grandTotal,
      itemsCount: itemsRaw.length,
      totalUnits: itemsRaw.reduce((acc: number, it: any) => acc + Number(it.quantity ?? it.qty ?? 1), 0),
    };
  }, [fullSale, sale, fetchedProducts]);

  // Fetch missing product details (e.g. for product default HSN & MRP if missing from order snapshot)
  useEffect(() => {
    const s = fullSale || sale;
    if (!isOpen || !s) return;
    const rawItems = Array.isArray(s.items)
      ? s.items
      : Array.isArray(s.calculation_infos?.items)
      ? s.calculation_infos.items
      : [];

    const activeShopId = (s as any)?.shop_id || getShopId() || SHOP_ID;
    const missingIds = rawItems
      .map((it: any, idx: number) => {
        const snap = Array.isArray((s as any)?.additional_infos?.items_snapshot)
          ? (s as any).additional_infos.items_snapshot[idx]
          : null;
        const hasHsn = it.hsn_code || it.hsn || it.hsnCode || snap?.hsnCode || snap?.hsn_code || snap?.hsn || it.datas?.hsn_code || it.datas?.hsn || it.datas?.tax_infos?.hsn;
        const hasMrp = it.mrp || it.datas?.mrp || it.pricing_infos?.mrp || snap?.mrp;
        const hasGst = (extractProductGstRate(it) > 0) || (extractProductGstRate(snap) > 0) || (it.gst_rate || it.gst || it.tax_rate || snap?.gst || snap?.gstRate || snap?.gst_rate);
        const id = it.product_id || it.inventory_id || it.id;
        return (!hasHsn || !hasMrp || !hasGst) && id && !fetchedProducts[id] ? String(id) : null;
      })
      .filter((id: any): id is string => Boolean(id));

    if (missingIds.length === 0) return;

    const uniqueIds: string[] = Array.from(new Set(missingIds));
    inventoryApi
      .getInventoriesByIds(activeShopId, uniqueIds)
      .then((res: any) => {
        const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (items.length > 0) {
          setFetchedProducts((prev) => {
            const next = { ...prev };
            items.forEach((p: any) => {
              if (p?.id) next[String(p.id)] = p;
              if (p?._id) next[String(p._id)] = p;
            });
            return next;
          });
        } else {
          uniqueIds.forEach((uid: string) => {
            inventoryApi
              .getInventoryById(activeShopId, uid)
              .then((pRes: any) => {
                const p = Array.isArray(pRes?.data) ? pRes.data[0] : (pRes?.data ?? pRes);
                if (p) {
                  setFetchedProducts((prev) => ({
                    ...prev,
                    [String(uid)]: p,
                  }));
                }
              })
              .catch(() => {});
          });
        }
      })
      .catch(() => {
        uniqueIds.forEach((uid: string) => {
          inventoryApi
            .getInventoryById(activeShopId, uid)
            .then((pRes: any) => {
              const p = Array.isArray(pRes?.data) ? pRes.data[0] : (pRes?.data ?? pRes);
              if (p) {
                setFetchedProducts((prev) => ({
                  ...prev,
                  [String(uid)]: p,
                }));
              }
            })
            .catch(() => {});
        });
      });
  }, [isOpen, fullSale, sale, fetchedProducts]);

  // Format parsed items
  const itemsList = useMemo(() => {
    const s = fullSale || sale;
    if (!s) return [];
    const rawItems = Array.isArray(s.items) ? s.items : (Array.isArray(s.calculation_infos?.items) ? s.calculation_infos.items : []);

    return rawItems.map((it: any, idx: number) => {
      const prodId = String(it.product_id || it.inventory_id || it.id || "");
      const prodData = fetchedProducts[prodId] || null;

      const name =
        it.name ||
        it.product_name ||
        it.datas?.product_name ||
        it.datas?.name ||
        prodData?.name ||
        prodData?.product_name ||
        productMap[it.inventory_id] ||
        `Item ${idx + 1}`;

      const qty = Number(it.entered_qty ?? it.quantity ?? it.qty ?? 1);
      const unitPrice = Number(it.sell_price ?? it.price ?? it.unit_price ?? 0);
      const totalAmount = Number(
        it.total_amount ??
        it.final_inclusive ??
        it.tprice ??
        unitPrice * qty
      );
      const discount = Number(
        it.line_discount_amount ??
        it.product_discount_amount ??
        it.discount_amount ??
        0
      );
      const unit = formatUnitName(it.entered_unit || it.unit || it.unit_infos?.name);

      const snapshotItem = Array.isArray((s as any)?.additional_infos?.items_snapshot)
        ? (s as any).additional_infos.items_snapshot[idx]
        : null;

      const batch_number =
        it.batch_number ||
        it.batch_no ||
        it.batch_name ||
        it.batchName ||
        it.batch_infos?.batch_name ||
        it.batch_infos?.batch_no ||
        snapshotItem?.batchName ||
        snapshotItem?.batchNumber ||
        it.datas?.batch_number ||
        it.datas?.batch_no ||
        "";

      const batch_name =
        it.batch_name ||
        it.batchName ||
        it.batch_number ||
        it.batch_no ||
        it.batch_infos?.batch_name ||
        snapshotItem?.batchName ||
        it.datas?.batch_name ||
        "";

      const rawMrp =
        it.mrp ??
        it.datas?.mrp ??
        it.pricing_infos?.mrp ??
        snapshotItem?.mrp ??
        (prodData ? extractProductMrp(prodData, batch_number || batch_name || it.batchId) : undefined) ??
        unitPrice;
      const mrp = Number(rawMrp);

      const expiry_date =
        it.expiry_date ||
        it.expiryDate ||
        it.expiry ||
        it.batch_infos?.exp_date ||
        it.batch_infos?.expiry_date ||
        snapshotItem?.expiryDate ||
        it.datas?.expiry_date ||
        "";

      const hsn_code =
        it.hsn_code ||
        it.hsn ||
        it.hsnCode ||
        snapshotItem?.hsnCode ||
        snapshotItem?.hsn_code ||
        snapshotItem?.hsn ||
        it.datas?.hsn_code ||
        it.datas?.hsn ||
        it.datas?.tax_infos?.hsn ||
        it.datas?.tax_identifiers?.hsn ||
        it.tax_infos?.hsn ||
        it.tax_identifiers?.hsn ||
        (prodData ? extractProductHsn(prodData) : "") ||
        "";

      const itemGst =
        extractProductGstRate(it) ||
        extractProductGstRate(snapshotItem) ||
        (prodData ? extractProductGstRate(prodData) : 0) ||
        totals.gstRate ||
        0;

      return {
        ...it,
        id: it.id || idx,
        name,
        qty,
        unitPrice,
        price: unitPrice,
        mrp: mrp > 0 ? mrp : undefined,
        totalAmount,
        discount,
        unit,
        gst: itemGst,
        gstRate: itemGst,
        batch_number,
        batch_name,
        batchName: batch_name,
        batch_no: batch_number,
        expiry_date,
        expiryDate: expiry_date,
        hsn_code,
        hsn: hsn_code,
        hsnCode: hsn_code,
        _product: prodData || undefined,
        serial_numbers: Array.isArray(it.serial_numbers) ? it.serial_numbers : [],
      };
    });
  }, [fullSale, sale, productMap, fetchedProducts]);

  // Resolved Custom Fields for Receipt (merging template configuration with saved order values)
  const receiptCustomFields = useMemo(() => {
    const s = fullSale || sale;
    const activeShopId = (s as any)?.shop_id || shopData?.id;
    const configured = getReceiptCustomFields(activeShopId);
    const fromOrder = (s as any)?.additional_infos?.custom_fields;
    return mergeOrderCustomFields(configured, fromOrder);
  }, [fullSale, sale, shopData?.id]);

  const receiptConfig = useMemo(() => {
    const s = fullSale || sale;
    const activeShopId = (s as any)?.shop_id || shopData?.id;
    return getBillingReceiptConfig(activeShopId);
  }, [fullSale, sale, shopData?.id]);

  const itemCustomFields = useMemo(() => {
    return (receiptCustomFields || []).filter(
      (f: any) => f.placement === "item" && f.label && f.show !== false
    );
  }, [receiptCustomFields]);

  // Payment breakdown
  const paymentMethods = useMemo(() => {
    const s = fullSale || sale;
    if (!s) return [];

    const res: Array<{ mode: string; amount: number }> = [];

    if (s.payments && typeof s.payments === "object" && !Array.isArray(s.payments)) {
      Object.entries(s.payments).forEach(([k, v]) => {
        if (Number(v) > 0) {
          res.push({ mode: k.toUpperCase(), amount: Number(v) });
        }
      });
    } else if (Array.isArray(s.payment_infos) && s.payment_infos.length > 0) {
      s.payment_infos.forEach((p: any) => {
        const mode = typeof p === "string" ? p : p.method || p.mode || "Payment";
        const amt = typeof p === "object" ? Number(p.amount ?? p.value ?? totals.grandTotal) : totals.grandTotal;
        res.push({ mode: mode.toUpperCase(), amount: amt });
      });
    } else if (s.payment_method) {
      res.push({ mode: s.payment_method.toUpperCase(), amount: totals.grandTotal });
    } else {
      res.push({ mode: "CASH", amount: totals.grandTotal });
    }

    return res;
  }, [fullSale, sale, totals.grandTotal]);

  // Date and Time formatting
  const formattedDateTime = useMemo(() => {
    const s = fullSale || sale;
    if (!s) return { date: "—", time: "—" };
    const dateVal = s.created_at || s.date || new Date();
    const d = new Date(dateVal);
    const isValid = !isNaN(d.getTime());
    return {
      date: isValid
        ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "—",
      time: isValid
        ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
        : "—",
    };
  }, [fullSale, sale]);

  // Trigger Print to Configured Device
  const handlePrint = async () => {
    if (!fullSale && !sale) return;
    setIsPrinting(true);

    try {
      const activeShop = shopData || {};
      const receiptData: ReceiptData = {
        shopName: activeShop?.name || activeShop?.shop_name || "inventQ Retail",
        shopAddress: cleanShopAddress(activeShop?.address || activeShop?.address_infos) || undefined,
        shopPhone: activeShop?.phone || "",
        shopGst:
          activeShop?.business_infos?.gst_infos?.number ||
          activeShop?.gst_infos?.number ||
          activeShop?.gst_number ||
          "",
        orderId: String(sale?.ui_id || sale?.id || ""),
        customerName: customerInfo.name,
        phone: customerInfo.phone,
        dateStr: formattedDateTime.date,
        timeStr: formattedDateTime.time,
        items: itemsList.map((i: any) => ({
          ...i,
          name: i.name,
          qty: i.qty,
          price: i.unitPrice,
          tprice: i.totalAmount,
          selectedUnit: i.unit,
          discount: i.discount,
        })),
        totalAmount: totals.subtotal,
        discountAmount: totals.discountTotal,
        taxableAmount: totals.taxable,
        gstAmount: totals.gst,
        cgstAmount: totals.cgstAmount,
        sgstAmount: totals.sgstAmount,
        cgstRate: totals.cgstRate,
        sgstRate: totals.sgstRate,
        gstRate: totals.gstRate,
        deliveryFee: totals.deliveryFee,
        roundOff: totals.roundOff,
        finalAmount: totals.grandTotal,
        totalUnits: totals.totalUnits,
        isDuplicate: true,
        invoiceTypeTag: "TAX INVOICE - DUPLICATE COPY",
        payments: paymentMethods.map((p) => ({ mode: p.mode, amount: p.amount })),
        reprintTimestamp: `${formattedDateTime.date}, ${formattedDateTime.time}`,
        shopId: (sale as any)?.shop_id || shopData?.id,
        digitalStoreUrl: shopData?.additional_infos?.website || getDigitalStoreUrl((sale as any)?.shop_id || shopData?.id),
        includeDigitalStoreQr: Boolean(
          (printersList.find((p) => p.id === targetPrinterId) || getPrinterConfig())
            ?.includeDigitalStoreQr !== false
        ),
        digitalStoreQrMessage: (
          printersList.find((p) => p.id === targetPrinterId) || getPrinterConfig()
        )?.digitalStoreQrMessage,
        customFields: receiptCustomFields,
      };

      const targetPrinter =
        printersList.find((p) => p.id === targetPrinterId) || getPrinterConfig();
      const result = await printReceipt(receiptData, targetPrinter);
      if (result.success) {
        showToast(result.message, "success");
      } else {
        showToast(result.message, "error");
      }
    } catch (err: any) {
      console.error("Reprint execution failed:", err);
      showToast(err.message || "Failed to trigger reprint.", "error");
    } finally {
      setIsPrinting(false);
    }
  };

  // Browser / PDF Print fallback
  const handleBrowserPrint = () => {
    window.print();
  };

  if (!isOpen || !sale) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col w-full max-w-xl min-h-0 max-h-[90vh] h-[88vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shadow-sm">
              <Printer size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Reprint Sales Bill
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                  Duplicate
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Order <span className="font-mono font-bold text-slate-800">{sale.ui_id || sale.id}</span> • {customerInfo.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPrinterConfigOpen(true)}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Printer settings"
            >
              <Settings size={13} className="text-blue-500" />
              <span className="hidden sm:inline">Printers Config</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Modal Body (Thermal Receipt Preview) ── */}
        <div className="modal-content flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 pb-8 bg-slate-100/80 flex justify-center items-start custom-scrollbar" style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", scrollbarWidth: "thin", scrollbarColor: "#94a3b8 #f1f5f9" }}>
          <div
            ref={receiptRef}
            id="printable-receipt"
            className="w-full max-w-[340px] shrink-0 bg-white rounded-lg shadow-md border border-slate-200 p-5 pb-8 mb-4 font-mono text-[11px] text-slate-800 leading-relaxed select-text"
          >
            {/* Header: Shop Info */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h4 className="text-[13px] font-black uppercase tracking-wider text-slate-900">
                {shopData?.name || shopData?.shop_name || "inventQ Retail"}
              </h4>
              {cleanShopAddress(shopData?.address || shopData?.address_infos) && (
                <p className="text-[9.5px] text-slate-500 mt-0.5 leading-tight">
                  {cleanShopAddress(shopData?.address || shopData?.address_infos)}
                </p>
              )}
              {(shopData?.business_infos?.gst_infos?.number ||
                shopData?.gst_infos?.number ||
                shopData?.gst_number) && (
                <p className="text-[9.5px] text-slate-600 font-semibold mt-0.5">
                  GSTIN: {shopData?.business_infos?.gst_infos?.number ||
                    shopData?.gst_infos?.number ||
                    shopData?.gst_number}
                </p>
              )}
              {shopData?.phone && (
                <p className="text-[9.5px] text-slate-500">Ph: {shopData.phone}</p>
              )}

              <div className="mt-2 py-0.5 px-2 bg-slate-100 rounded text-[9px] font-bold text-slate-600 tracking-widest uppercase inline-block border border-slate-200">
                Tax Invoice • Duplicate Copy
              </div>
            </div>

            {/* Meta: Order ID & Customer */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-[10.5px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Order ID:</span>
                <span className="font-bold text-slate-900">{sale.ui_id || sale.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Date & Time:</span>
                <span>
                  {formattedDateTime.date} {formattedDateTime.time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Customer:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[170px]">
                  {customerInfo.name}
                </span>
              </div>
              {customerInfo.phone && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Phone:</span>
                  <span>{customerInfo.phone}</span>
                </div>
              )}
              {(receiptCustomFields || [])
                .filter((f: any) => f.placement === "customer" && (f.value || f.displayValue))
                .map((f: any) => (
                  <div key={f.id} className="flex justify-between">
                    <span className="text-slate-500 font-medium">{f.label}:</span>
                    <span className="font-semibold text-slate-800">{f.displayValue || f.value}</span>
                  </div>
                ))}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold text-[9.5px] uppercase text-slate-500 pb-1.5 border-b border-slate-200">
                <span className="flex-1">Item</span>
                <span className="w-10 text-center">Qty</span>
                <span className="w-14 text-right">Price</span>
                <span className="w-14 text-right">Total</span>
              </div>

              {loadingDetails ? (
                <div className="py-4 text-center text-slate-400 text-xs italic">
                  Loading items...
                </div>
              ) : itemsList.length === 0 ? (
                <div className="py-3 text-center text-slate-400 text-[10px]">
                  Order items details
                </div>
              ) : (
                <div className="divide-y divide-slate-100 py-1">
                  {itemsList.map((it: any, idx: number) => (
                    <div key={idx} className="py-1.5 text-[10px]">
                      <div className="font-semibold text-slate-900 leading-tight">
                        {it.name}
                      </div>
                      <div className="flex justify-between items-center text-slate-600 mt-0.5">
                        <span className="text-[9px] text-slate-400">
                          {it.unit ? `${it.unit}` : ""}{it.gst > 0 ? ` · GST@${it.gst}%` : ""}
                        </span>
                        <span className="w-10 text-center font-bold">
                          {it.qty}
                        </span>
                        <span className="w-14 text-right">
                          ₹{it.unitPrice.toFixed(2)}
                        </span>
                        <span className="w-14 text-right font-bold text-slate-900">
                          ₹{it.totalAmount.toFixed(2)}
                        </span>
                      </div>
                      {it.discount > 0 && (
                        <div className="text-[8.5px] text-emerald-600 italic">
                          Incl. ₹{it.discount.toFixed(2)} discount
                        </div>
                      )}
                      {itemCustomFields.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {itemCustomFields.map((f: any) => {
                            const val = extractItemAttributeValue(f, it, idx, it);
                            if (!val || val === "—") return null;
                            return (
                              <span
                                key={f.id}
                                className="inline-flex items-center text-[9px] bg-slate-50 border border-slate-200/80 px-1 py-0.5 rounded text-slate-600 font-mono"
                              >
                                <span className="text-slate-400 mr-1">{f.label}:</span>
                                <span className="font-semibold text-slate-700">{val}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom fields below items */}
            {(receiptCustomFields || []).filter((f: any) => f.placement === "below" && (f.value || f.displayValue)).length > 0 && (
              <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-1">
                {(receiptCustomFields || []).filter((f: any) => f.placement === "below" && (f.value || f.displayValue)).map((f: any) => (
                  <div key={f.id} className="flex justify-between">
                    <span className="text-slate-500">{f.label}:</span>
                    <span className="font-semibold text-slate-800">{f.displayValue || f.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Calculations Breakdown */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-[10.5px] space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({totals.totalUnits} units):</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount Savings:</span>
                  <span>−₹{totals.discountTotal.toFixed(2)}</span>
                </div>
              )}
              {totals.taxable > 0 && totals.gst > 0 && (
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>Taxable Value:</span>
                  <span>₹{totals.taxable.toFixed(2)}</span>
                </div>
              )}
              {totals.gst > 0 && (
                <>
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>CGST ({totals.cgstRate}%):</span>
                    <span>₹{totals.cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>SGST ({totals.sgstRate}%):</span>
                    <span>₹{totals.sgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Total Tax / GST{totals.gstRate > 0 ? ` (${totals.gstRate}%)` : ""}:</span>
                    <span>₹{totals.gst.toFixed(2)}</span>
                  </div>
                </>
              )}
              {totals.deliveryFee > 0 && (
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Delivery Fee:</span>
                  <span>+₹{totals.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              {totals.roundOff !== 0 && (
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>Round Off:</span>
                  <span>
                    {totals.roundOff > 0 ? `+₹${totals.roundOff.toFixed(2)}` : `−₹${Math.abs(totals.roundOff).toFixed(2)}`}
                  </span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="py-2.5 border-b-2 border-slate-800 flex justify-between items-baseline font-black text-slate-950 text-sm">
              <span className="uppercase tracking-wider">Grand Total</span>
              <span className="text-base font-mono">
                ₹{totals.grandTotal.toFixed(2)}
              </span>
            </div>

            {/* Payment Modes */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[10px] text-slate-600 space-y-0.5">
              {paymentMethods.map((pm, i) => (
                <div key={i} className="flex justify-between">
                  <span>Paid via {pm.mode}:</span>
                  <span className="font-bold text-slate-800">
                    ₹{pm.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* UPI QR Code (if enabled) */}
            {Boolean(receiptConfig.qr?.upi && receiptConfig.qr?.upiId) && (
              <div className="pt-2.5 pb-2 text-center border-t border-dashed border-slate-200 flex flex-col items-center justify-center w-full">
                <div className="flex justify-center my-1 w-full">
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs inline-flex items-center justify-center mx-auto">
                    <QRCodeSVG
                      value={`upi://pay?pa=${encodeURIComponent(receiptConfig.qr.upiId)}&pn=${encodeURIComponent(shopData?.name || "")}&am=${Number((sale as any)?.final_amount || (sale as any)?.total_amount || 0).toFixed(2)}&cu=INR`}
                      size={95}
                      level="M"
                      style={{ display: "block", margin: "0 auto" }}
                    />
                  </div>
                </div>
                <p className="text-[9px] font-bold text-slate-700 mt-0.5 text-center">
                  {receiptConfig.qr.upiCap || "Scan & Pay via UPI"}
                </p>
                <p className="text-[8px] text-slate-400 text-center">{receiptConfig.qr.upiId}</p>
              </div>
            )}

            {/* Digital Store QR Section (Visible when enabled) */}
            {Boolean(
              (printersList.find((p) => p.id === targetPrinterId) || getPrinterConfig())
                ?.includeDigitalStoreQr !== false && (shopData?.visible_online !== false) &&
              receiptConfig.qr?.store !== false
            ) && (
              <div className="pt-2.5 pb-2 text-center border-t border-dashed border-slate-200 flex flex-col items-center justify-center w-full">
                <div className="flex justify-center my-1 w-full">
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs inline-flex items-center justify-center mx-auto">
                    <QRCodeSVG
                      value={
                        receiptConfig.qr?.storeUrl ||
                        shopData?.additional_infos?.website ||
                        getDigitalStoreUrl((sale as any)?.shop_id || shopData?.id)
                      }
                      size={95}
                      level="M"
                      style={{ display: "block", margin: "0 auto" }}
                    />
                  </div>
                </div>
                <p className="text-[8.5px] font-medium text-slate-500 text-center">
                  {receiptConfig.qr?.storeCap || "Scan to visit our online store"}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 text-center text-[9px] text-slate-400 space-y-0.5">
              <p className="font-semibold text-slate-600">
                {receiptConfig.footer?.thanks || (printersList.find((p) => p.id === targetPrinterId) || getPrinterConfig())?.footerText || "Thank you for shopping with us! Please visit again."}
              </p>
              <p>{receiptConfig.footer?.terms || "Goods once sold will not be returned without bill."}</p>
              <p className="text-[8px] text-slate-400 mt-1">
                Reprinted on {new Date().toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {/* ── Modal Footer Controls ── */}
        <div className="px-3.5 sm:px-5 py-3.5 pb-[max(14px,env(safe-area-inset-bottom))] border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0 max-w-full">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            {printersList.length > 1 ? (
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="font-semibold text-slate-600 text-xs shrink-0">Send to:</span>
                <ReusableSelect
                  value={targetPrinterId}
                  onValueChange={setTargetPrinterId}
                  options={printersList.map((p) => ({
                    label: `${p.name} (${p.connectionType.toUpperCase()}${p.isDefault ? " • Default" : ""})`,
                    value: p.id,
                  }))}
                  placeholder="Select Printer"
                  className="h-8 py-1 px-2.5 text-xs bg-slate-100 hover:bg-slate-200/80 border-slate-200 rounded-lg font-bold text-slate-800 shadow-none"
                />
              </div>
            ) : (
              <span className="font-medium text-slate-600">
                Active Printer:{" "}
                {printersList[0]?.name ||
                  getPrinterConfig().deviceName ||
                  getPrinterConfig().connectionType.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBrowserPrint}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
              title="Print via browser dialog or export PDF"
            >
              <Download size={14} className="text-slate-500" />
              <span>Browser / PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isPrinting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Printing...</span>
                </>
              ) : (
                <>
                  <Printer size={15} />
                  <span>Print Receipt</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Global Printers Configuration Modal (if requested from reprint) */}
      <PrinterConfigModal
        shopData={shopData}
        isOpen={isPrinterConfigOpen}
        onClose={() => setIsPrinterConfigOpen(false)}
      />
    </div>,
    document.body
  );
};
