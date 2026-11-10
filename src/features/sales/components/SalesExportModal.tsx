import React, { useState } from "react";
import { X, FileSpreadsheet, FileText, Download, CheckCircle2, Loader2, FileDown, Filter } from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/context/ToastContext";
import { ENDPOINTS, SHOP_ID, getShopId } from "@/services/endpoints";
import { extractSaleCustomerInfo } from "../type";

export interface SalesExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibleSales: any[];
  customerMap: Record<string, any>;
  activeFilters: {
    search?: string;
    origin?: string;
    payment?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    activeKpi?: string;
  };
  apiGetData: (url: string, params?: any) => Promise<any>;
}

type ExportFormat = "xlsx" | "csv" | "pdf";
type ExportScope = "all" | "visible";

export const SalesExportModal: React.FC<SalesExportModalProps> = ({
  isOpen,
  onClose,
  visibleSales,
  customerMap,
  activeFilters,
  apiGetData,
}) => {
  const { showToast } = useToast();
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [scope, setScope] = useState<ExportScope>("all");
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const getPaymentMethod = (s: any): string => {
    if (s.payment_infos && typeof s.payment_infos === "object" && !Array.isArray(s.payment_infos) && Object.keys(s.payment_infos).length > 0) {
      return Object.keys(s.payment_infos).map(k => {
        const u = k.toUpperCase();
        if (u === "CASH") return "Cash";
        if (u === "CARD") return "Card";
        if (u === "UPI" || u === "GPAY" || u === "G-PAY") return "UPI";
        if (u === "PHONEPE") return "PhonePe";
        if (u === "CREDIT" || u === "ON_CREDIT" || u === "ON CREDIT") return "On Credit";
        return k.charAt(0).toUpperCase() + k.slice(1).toLowerCase();
      }).join(", ");
    } else if (Array.isArray(s.payment_infos) && s.payment_infos.length > 0) {
      return s.payment_infos.map((p: any) => {
        const methodStr = typeof p === "string" ? p : (p.method || "");
        const u = methodStr.toUpperCase();
        if (u === "CASH") return "Cash";
        if (u === "CARD") return "Card";
        if (u === "UPI" || u === "GPAY" || u === "G-PAY") return "UPI";
        if (u === "PHONEPE") return "PhonePe";
        if (u === "CREDIT" || u === "ON_CREDIT" || u === "ON CREDIT") return "On Credit";
        return methodStr || "Other";
      }).join(", ");
    }
    return s.payment_method || "Other";
  };

  const fetchAllMatchingSales = async (): Promise<any[]> => {
    const activeShopId = getShopId() || localStorage.getItem("shop_id") || SHOP_ID || "";
    const params: any = {
      limit: "1000",
      offset: "1",
      online_delivered_only: true,
    };
    if (activeFilters.search) params.q = activeFilters.search;
    if (activeFilters.activeKpi === "Online Sales") params.exclude_offline = true;
    if (activeFilters.activeKpi === "Offline Sales") params.exclude_online = true;
    if (activeFilters.origin === "Offline") params.origin = "OFFLINE";
    else if (activeFilters.origin === "Offline Return") params.origin = "OFFLINE_SALES_RETURN";
    else if (activeFilters.origin === "Online") params.origin = "ONLINE";
    if (activeFilters.payment) params.payment_method = activeFilters.payment;
    if (activeFilters.status) params.status = activeFilters.status;
    if (activeFilters.fromDate) params.from_date = activeFilters.fromDate;
    if (activeFilters.toDate) params.to_date = activeFilters.toDate;

    try {
      const res = await apiGetData(`${ENDPOINTS.ORDERS}/${activeShopId}`, params);
      const dataList = Array.isArray(res?.data) ? res.data : (res?.data?.datas ?? []);
      if (!dataList || dataList.length === 0) {
        if (visibleSales && visibleSales.length > 0) {
          return visibleSales;
        }
      }
      return dataList.filter((s: any) => {
        const isOnline = s.origin === "ONLINE" || s.origin === "Online Sales" || Boolean(s.online_details);
        if (isOnline) {
          const st = String(s.status || "").toUpperCase();
          return st === "DELIVERED" || st === "COMPLETED";
        }
        return true;
      });
    } catch (e) {
      console.error("Failed to fetch all sales from backend for export, falling back to visible items:", e);
      return visibleSales;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let salesToExport: any[] = [];
      if (scope === "all") {
        salesToExport = await fetchAllMatchingSales();
      } else {
        salesToExport = visibleSales;
      }

      if (!salesToExport || salesToExport.length === 0) {
        if (visibleSales && visibleSales.length > 0) {
          salesToExport = visibleSales;
        } else {
          showToast("No sales found to export with the current filters", "error");
          setIsExporting(false);
          return;
        }
      }

      const shopName = localStorage.getItem("shop_name") || "Hyperlocal Store";
      const timestamp = new Date().toISOString().slice(0, 10);

      // Prepare Rows
      const rows = salesToExport.map((s, index) => {
        const cust = extractSaleCustomerInfo(s, customerMap);
        const orderId = s.ui_id || s.order_id || s.id || `ORD-${index + 1}`;
        const isOnline = s.origin === "ONLINE" || s.origin === "Online Sales" || Boolean(s.online_details);
        const channel = isOnline ? "Online Store" : (s.origin === "OFFLINE_SALES_RETURN" || s.origin === "Sales Return" ? "Sales Return" : "Offline POS");
        
        let dateStr = "";
        const rawDate = s.created_at || s.order_date || s.date;
        if (rawDate) {
          const d = new Date(rawDate);
          dateStr = isNaN(d.getTime()) ? String(rawDate) : d.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          });
        }

        const calc = s.calculation_infos || s.calculations || {};
        const rawItems = Array.isArray(s.items) ? s.items : (Array.isArray(calc?.items) ? calc.items : []);
        const itemsSummary = rawItems.map((it: any) => `${it.name || it.product_name || "Item"} (x${it.quantity || it.qty || 1})`).join(", ");
        const totalQty = rawItems.reduce((acc: number, it: any) => acc + Number(it.quantity || it.qty || 1), 0);

        // Total Billed
        let total = Number(
          s.total_sellprice ??
          calc.total ??
          calc.grand_total ??
          calc.payable ??
          s.total_amount ??
          s.item_infos?.total_order_amount ??
          (rawItems.length > 0 ? rawItems.reduce((acc: number, it: any) => acc + (Number(it.total_amount) || ((Number(it.sell_price || it.unit_price || 0)) * (Number(it.quantity || it.qty || 1)))), 0) : 0) ??
          s.total ??
          0
        );

        // Discount
        let discount = Number(
          calc.total_discount_given ??
          calc.discount_total ??
          calc.total_discount ??
          s.discount_amount ??
          s.total_discount ??
          calc.discount_amount ??
          s.discount ??
          s.charges_infos?.discount ??
          0
        );
        if (discount <= 0 && calc) {
          const pDisc = Number(calc.product_discount_total || 0);
          const lDisc = Number(calc.line_discount_total || 0);
          const bDisc = Number(calc.bill_discount_total || 0);
          if (pDisc + lDisc + bDisc > 0) {
            discount = pDisc + lDisc + bDisc;
          }
        }

        // GST Amount
        let tax = Number(
          calc.gst_amount ??
          calc.total_gst_amount ??
          calc.tax_amount ??
          calc.total_tax ??
          s.tax_amount ??
          s.gst_amount ??
          0
        );

        let itemsGstSum = 0;
        let itemsTaxableSum = 0;
        if (Array.isArray(rawItems) && rawItems.length > 0) {
          rawItems.forEach((it: any) => {
            const itGst = Number(it.gst_amount ?? it.total_gst_amount ?? 0);
            const itTaxable = Number(it.taxable_value ?? it.taxable_amount ?? 0);
            itemsGstSum += itGst;
            itemsTaxableSum += itTaxable;
          });
        }
        if (tax <= 0 && itemsGstSum > 0) {
          tax = itemsGstSum;
        }

        // Taxable Subtotal
        let subtotal = Number(
          calc.taxable_amount ??
          calc.total_taxable ??
          (itemsTaxableSum > 0 ? itemsTaxableSum : 0) ??
          calc.subtotal ??
          calc.sub_total ??
          s.subtotal ??
          s.taxable_amount ??
          0
        );

        // Cross-derivation
        if (subtotal <= 0 && total > 0) {
          subtotal = tax > 0 ? Math.max(0, total - tax) : total;
        }
        if (tax <= 0 && total > 0 && subtotal > 0 && total > subtotal) {
          tax = Math.max(0, Number((total - subtotal).toFixed(2)));
        }
        if (total <= 0 && subtotal > 0) {
          total = Number((subtotal + tax).toFixed(2));
        }

        let statusText = s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1).toLowerCase() : "Completed";
        if (isOnline && (statusText.toLowerCase() === "delivered" || statusText.toLowerCase() === "completed")) {
          statusText = "Completed";
        }

        return {
          "Sl No": index + 1,
          "Date & Time": dateStr,
          "Order ID": orderId,
          "Channel": channel,
          "Customer Name": cust.name,
          "Customer ID": cust.uiId || "—",
          "Customer Mobile": cust.phone || "—",
          "Items Count": totalQty || rawItems.length,
          "Items Summary": itemsSummary || "—",
          "Taxable Subtotal (₹)": Number(subtotal.toFixed(2)),
          "GST Amount (₹)": Number(tax.toFixed(2)),
          "Discount (₹)": Number(discount.toFixed(2)),
          "Total Billed (₹)": Number(total.toFixed(2)),
          "Payment Method": getPaymentMethod(s),
          "Status": statusText,
        };
      });

      if (format === "xlsx" || format === "csv") {
        const worksheet = XLSX.utils.json_to_sheet(rows);

        // Auto column widths
        const colWidths = Object.keys(rows[0] || {}).map(key => {
          const maxLen = Math.max(
            key.length,
            ...rows.map(r => String((r as any)[key] ?? "").length)
          );
          return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
        });
        worksheet["!cols"] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sales");

        if (format === "xlsx") {
          XLSX.writeFile(workbook, `Sales_Report_${shopName.replace(/\s+/g, "_")}_${timestamp}.xlsx`);
        } else {
          XLSX.writeFile(workbook, `Sales_Report_${shopName.replace(/\s+/g, "_")}_${timestamp}.csv`, { bookType: "csv" });
        }
        showToast(`Sales successfully exported as ${format.toUpperCase()}`, "success");
      } else if (format === "pdf") {
        const jspdfMod = await import("jspdf");
        const JsPDFCtor = (jspdfMod as any).jsPDF ?? (jspdfMod as any).default?.jsPDF ?? (jspdfMod as any).default;

        if (typeof JsPDFCtor !== "function") {
          throw new Error("jsPDF constructor is not available.");
        }

        // A4 Landscape: 297mm x 210mm
        const doc = new JsPDFCtor({ orientation: "landscape", unit: "mm", format: "a4" });

        const pageWidth = 297;
        const pageHeight = 210;
        let y = 15;

        // Title Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(shopName, 14, y);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text("SALES & ORDERS REPORT", 14, y + 6);

        doc.setFontSize(9);
        doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, pageWidth - 14, y, { align: "right" });
        doc.text(`Total Records: ${rows.length}`, pageWidth - 14, y + 6, { align: "right" });

        y += 14;

        // Summary Statistics Box
        const totalRevenue = rows.reduce((acc, r) => acc + Number(r["Total Billed (₹)"] || 0), 0);
        const totalGST = rows.reduce((acc, r) => acc + Number(r["GST Amount (₹)"] || 0), 0);
        const totalDiscount = rows.reduce((acc, r) => acc + Number(r["Discount (₹)"] || 0), 0);

        doc.setFillColor(248, 250, 252); // slate-50
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.roundedRect(14, y, pageWidth - 28, 12, 1.5, 1.5, "FD");

        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.setFont("helvetica", "bold");
        const summaryText = `Total Orders: ${rows.length}    |    Total Revenue: ₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}    |    GST Collected: ₹${totalGST.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}    |    Total Discounts: ₹${totalDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        doc.text(summaryText, 18, y + 7.5);

        y += 18;

        // Table Layout
        const headers = ["#", "Date & Time", "Order ID", "Channel", "Customer", "Items", "Payment", "Status", "Total (₹)"];
        const colWidths = [10, 36, 32, 28, 48, 48, 30, 22, 25]; // Sums to 279mm
        const startX = 14;

        const drawTableHeader = () => {
          doc.setFillColor(241, 245, 249); // slate-100
          doc.rect(startX, y, pageWidth - 28, 7.5, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);

          let curX = startX;
          headers.forEach((h, i) => {
            const align = i === 8 ? "right" : (i === 0 ? "center" : "left");
            const textX = align === "right" ? curX + colWidths[i] - 2 : (align === "center" ? curX + (colWidths[i] / 2) : curX + 2);
            doc.text(h, textX, y + 5, { align });
            curX += colWidths[i];
          });
          y += 7.5;
        };

        drawTableHeader();

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);

        rows.forEach((r, idx) => {
          if (y + 7.5 > pageHeight - 12) {
            doc.addPage();
            y = 15;
            drawTableHeader();
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
          }

          // Alternating row background
          if (idx % 2 === 1) {
            doc.setFillColor(250, 250, 250);
            doc.rect(startX, y, pageWidth - 28, 7, "F");
          }

          doc.setDrawColor(241, 245, 249);
          doc.line(startX, y + 7, pageWidth - 14, y + 7);

          doc.setTextColor(71, 85, 105);

          let curX = startX;
          const values = [
            String(idx + 1),
            String(r["Date & Time"] || "—").slice(0, 22),
            String(r["Order ID"] || "—"),
            String(r["Channel"] || "—"),
            String(r["Customer Name"] || "Walk-in").slice(0, 28),
            String(r["Items Summary"] || `${r["Items Count"]} item(s)`).slice(0, 28),
            String(r["Payment Method"] || "Cash").slice(0, 16),
            String(r["Status"] || "Completed"),
            Number(r["Total Billed (₹)"] || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          ];

          values.forEach((v, i) => {
            const align = i === 8 ? "right" : (i === 0 ? "center" : "left");
            const textX = align === "right" ? curX + colWidths[i] - 2 : (align === "center" ? curX + (colWidths[i] / 2) : curX + 2);
            if (i === 7) {
              // Status color
              if (v.toLowerCase() === "completed") doc.setTextColor(16, 149, 90);
              else if (v.toLowerCase() === "cancelled") doc.setTextColor(225, 29, 72);
              else doc.setTextColor(71, 85, 105);
            } else if (i === 8) {
              doc.setTextColor(15, 23, 42);
              doc.setFont("helvetica", "bold");
            } else {
              doc.setTextColor(71, 85, 105);
              doc.setFont("helvetica", "normal");
            }

            doc.text(v, textX, y + 4.8, { align });
            curX += colWidths[i];
          });

          y += 7;
        });

        // Add page numbers
        const totalPages = (doc.internal as any).getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
          doc.setPage(p);
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(`Page ${p} of ${totalPages}`, pageWidth - 14, pageHeight - 6, { align: "right" });
          doc.text("CONFIDENTIAL - FOR INTERNAL STORE MANAGEMENT ONLY", 14, pageHeight - 6);
        }

        doc.save(`Sales_Report_${shopName.replace(/\s+/g, "_")}_${timestamp}.pdf`);
        showToast("Sales PDF report generated successfully", "success");
      }

      onClose();
    } catch (err: any) {
      console.error("Export error:", err);
      showToast(err?.message || "Failed to export sales", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileDown size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Export Sales Data</h3>
              <p className="text-[11px] text-slate-500">Download formatted sales records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Export Format</label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: "xlsx", label: "Excel (.xlsx)", icon: FileSpreadsheet, desc: "Spreadsheet" },
                { id: "csv", label: "CSV (.csv)", icon: FileText, desc: "Raw Data" },
                { id: "pdf", label: "PDF (.pdf)", icon: FileDown, desc: "Print Report" }
              ].map(item => {
                const Icon = item.icon;
                const isSelected = format === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormat(item.id as ExportFormat)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/60 text-blue-700 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-650"
                    }`}
                  >
                    <Icon size={20} className={isSelected ? "text-blue-600" : "text-slate-400"} />
                    <span className="text-xs font-bold mt-1.5 leading-tight">{item.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scope Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Data Scope</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setScope("all")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  scope === "all"
                    ? "border-blue-500 bg-blue-50/60 text-blue-700"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">All Matching Sales</span>
                  {scope === "all" && <CheckCircle2 size={14} className="text-blue-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Fetches all records matching backend filters</p>
              </button>

              <button
                type="button"
                onClick={() => setScope("visible")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  scope === "visible"
                    ? "border-blue-500 bg-blue-50/60 text-blue-700"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Visible Rows Only</span>
                  {scope === "visible" && <CheckCircle2 size={14} className="text-blue-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{visibleSales.length} loaded records on screen</p>
              </button>
            </div>
          </div>

          {/* Active Filter Notice */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2 text-slate-600">
            <Filter size={13} className="text-slate-400 mt-0.5 shrink-0" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-slate-700">Filter Aware:</span> The export includes current date ranges, order statuses, channels, and search keywords.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="h-8 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="h-8 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20 active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={13} />
                Download {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
