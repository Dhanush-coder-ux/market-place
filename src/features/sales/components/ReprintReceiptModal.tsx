import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Printer,
  Settings,
  Download,
} from "lucide-react";
import { shopApi } from "@/services/api/shop";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID, getShopId } from "@/services/endpoints";
import {
  printReceipt,
  ReceiptData,
  getPrinterConfig,
  getPrintersList,
  SavedPrinter,
  cleanShopAddress,
} from "@/features/billing/utils/printerService";
import { PrinterConfigModal } from "@/features/billing/components/PrinterConfigModal";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { extractSaleCustomerInfo } from "../type";
import { useToast } from "@/context/ToastContext";

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

    // If items are missing or shallow, fetch fresh single order detail
    const hasDetailedItems =
      Array.isArray(sale.items) &&
      sale.items.length > 0 &&
      (sale.items[0].name || sale.items[0].product_name || sale.calculation_infos);

    if (!hasDetailedItems && sale.id) {
      setLoadingDetails(true);
      const activeShopId = getShopId() || SHOP_ID;
      api
        .getData(`${ENDPOINTS.ORDERS}/${activeShopId}/${sale.id}`)
        .then((res: any) => {
          const ord = Array.isArray(res?.data) ? res.data[0] : res?.data;
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

    let taxable = Number(calc.taxable_value ?? calc.taxable_amount ?? 0);
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

    const effectiveTaxable = taxable > 0 ? taxable : subtotal - discountTotal;

    // Detect tax rates
    let gstRate = 0;
    if (calc.gst_rate !== undefined && Number(calc.gst_rate) > 0) {
      gstRate = Number(calc.gst_rate);
    } else if (calc.tax_rate !== undefined && Number(calc.tax_rate) > 0) {
      gstRate = Number(calc.tax_rate);
    } else if (itemsRaw.length > 0) {
      const itRate = Number(itemsRaw[0].gst_rate || itemsRaw[0].tax_rate || itemsRaw[0].gst_percentage || 0);
      if (itRate > 0) gstRate = itRate;
    }
    if (gstRate === 0 && effectiveTaxable > 0 && gst > 0) {
      gstRate = Math.round((gst / effectiveTaxable) * 100);
    }

    const cgstRate = gstRate > 0 ? gstRate / 2 : 0;
    const sgstRate = gstRate > 0 ? gstRate / 2 : 0;
    const cgstAmount = calc.cgst !== undefined ? Number(calc.cgst) : Math.round((gst / 2) * 100) / 100;
    const sgstAmount = calc.sgst !== undefined ? Number(calc.sgst) : Math.round((gst - cgstAmount) * 100) / 100;

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
      roundOff,
      grandTotal,
      itemsCount: itemsRaw.length,
      totalUnits: itemsRaw.reduce((acc: number, it: any) => acc + Number(it.quantity ?? it.qty ?? 1), 0),
    };
  }, [fullSale, sale]);

  // Format parsed items
  const itemsList = useMemo(() => {
    const s = fullSale || sale;
    if (!s) return [];
    const rawItems = Array.isArray(s.items) ? s.items : (Array.isArray(s.calculation_infos?.items) ? s.calculation_infos.items : []);

    return rawItems.map((it: any, idx: number) => {
      const name =
        it.name ||
        it.product_name ||
        it.datas?.product_name ||
        it.datas?.name ||
        productMap[it.inventory_id] ||
        `Item ${idx + 1}`;

      const qty = Number(it.quantity ?? it.qty ?? 1);
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
      const unit = it.unit || it.unit_infos?.name || "Units";

      return {
        id: it.id || idx,
        name,
        qty,
        unitPrice,
        totalAmount,
        discount,
        unit,
        serial_numbers: Array.isArray(it.serial_numbers) ? it.serial_numbers : [],
      };
    });
  }, [fullSale, sale, productMap]);

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
        roundOff: totals.roundOff,
        finalAmount: totals.grandTotal,
        totalUnits: totals.totalUnits,
        isDuplicate: true,
        invoiceTypeTag: "TAX INVOICE - DUPLICATE COPY",
        payments: paymentMethods.map((p) => ({ mode: p.mode, amount: p.amount })),
        reprintTimestamp: `${formattedDateTime.date}, ${formattedDateTime.time}`,
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
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col w-full max-w-xl max-h-[92vh] overflow-hidden"
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex justify-center custom-scrollbar">
          <div
            ref={receiptRef}
            id="printable-receipt"
            className="w-full max-w-[340px] bg-white rounded-lg shadow-md border border-slate-200 p-5 font-mono text-[11px] text-slate-800 leading-relaxed select-text"
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
                          {it.unit ? `${it.unit}` : ""}
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
                    </div>
                  ))}
                </div>
              )}
            </div>

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

            {/* Footer */}
            <div className="pt-3 text-center text-[9px] text-slate-400 space-y-0.5">
              <p className="font-semibold text-slate-600">
                Thank you for your business!
              </p>
              <p>Goods once sold will not be returned without bill.</p>
              <p className="text-[8px] text-slate-400 mt-1">
                Reprinted on {new Date().toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {/* ── Modal Footer Controls ── */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            {printersList.length > 1 ? (
              <div className="flex items-center gap-1.5 min-w-[210px]">
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
        isOpen={isPrinterConfigOpen}
        onClose={() => setIsPrinterConfigOpen(false)}
      />
    </div>,
    document.body
  );
};
