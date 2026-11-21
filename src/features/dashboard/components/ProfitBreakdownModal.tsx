import React from "react";
import {
  X,
  Calculator,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export interface ProfitBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGstReg: boolean;
  sellingPrice: number;        // Selling revenue with GST
  purchaseCost: number;        // Purchase cost of goods sold with GST
  grossProfit: number;         // sellingPrice - purchaseCost
  salesGstAmount: number;      // Output GST on sales
  transportCharges: number;    // Transport / delivery charges
  purchaseGstClaimed: number;  // Input GST on purchases
  netRealizedProfit: number;   // Realized net profit
  netProfitMargin: number;     // Net profit margin %
  grossMargin: number;         // Gross profit margin %
  fmt: (n: number) => string;
  salesReturnedProfit?: number;
  initialGrossProfit?: number;
  initialSellingPrice?: number;
  initialPurchaseCost?: number;
}

export const ProfitBreakdownModal: React.FC<ProfitBreakdownModalProps> = ({
  isOpen,
  onClose,
  isGstReg,
  sellingPrice,
  purchaseCost,
  grossProfit,
  salesGstAmount,
  transportCharges,
  purchaseGstClaimed,
  netRealizedProfit,
  netProfitMargin,
  grossMargin,
  fmt,
  salesReturnedProfit = 0,
  initialGrossProfit,
  initialSellingPrice,
  initialPurchaseCost,
}) => {
  if (!isOpen) return null;

  const itcAmount = isGstReg ? purchaseGstClaimed : 0;
  const outputGstDeduction = isGstReg ? salesGstAmount : 0;
  const netGstPayable = Math.max(0, outputGstDeduction - itcAmount);

  const displayInitialGrossProfit = initialGrossProfit ?? (grossProfit + salesReturnedProfit);
  const displayInitialSelling = initialSellingPrice ?? sellingPrice;
  const displayInitialPurchase = initialPurchaseCost ?? purchaseCost;
  const hasReturns = salesReturnedProfit > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isGstReg ? "Profit & Tax Calculation Breakdown" : "Net Profit Calculation Breakdown"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isGstReg
                  ? "GST, Transport charges, and Input Tax Credit (ITC)"
                  : "Selling Price, Landed Purchase Cost (incl. GST), and Transport Charges"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* GST Registration Status Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isGstReg
                ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-950"
                : "bg-amber-50/70 border-amber-200/80 text-amber-950"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isGstReg ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div className="text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {isGstReg ? "GST-Registered Shop" : "Non-GST Registered Shop"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                    isGstReg ? "bg-emerald-200/70 text-emerald-800" : "bg-amber-200/70 text-amber-800"
                  }`}
                >
                  {isGstReg ? "ITC Claimable" : "No ITC"}
                </span>
              </div>
              <p className="mt-1 leading-relaxed text-slate-600">
                {isGstReg
                  ? "As a GST-registered business, you can claim Input Tax Credit (ITC) on the purchase GST you paid to suppliers, offsetting your Output GST liability."
                  : "As an unregistered business, you cannot claim Input Tax Credit (ITC) on purchase GST, nor do you remit output GST to the tax department. All taxes paid during purchase form part of your actual cost."}
              </p>
            </div>
          </div>

          {/* Formula Display Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Calculation Formula
            </span>
            <div className="font-mono text-[11px] leading-relaxed text-slate-800 bg-white p-2 rounded-lg border border-slate-200">
              {isGstReg ? (
                hasReturns ? (
                  <>
                    Gross Sales Profit <span className="text-slate-400">({fmt(displayInitialGrossProfit)})</span>
                    {" − "}
                    Returned Profit <span className="text-slate-400">({fmt(salesReturnedProfit)})</span>
                    {" − "}
                    Output GST <span className="text-slate-400">({fmt(salesGstAmount)})</span>
                    {transportCharges > 0 && (
                      <>
                        {" − "}
                        Transport <span className="text-slate-400">({fmt(transportCharges)})</span>
                      </>
                    )}
                    {" + "}
                    Input GST ITC <span className="text-slate-400">({fmt(purchaseGstClaimed)})</span>
                    {" = "}
                    <strong className="text-emerald-700 font-bold">{fmt(netRealizedProfit)}</strong>
                  </>
                ) : (
                  <>
                    Gross Profit <span className="text-slate-400">({fmt(grossProfit)})</span>
                    {" − "}
                    Output GST <span className="text-slate-400">({fmt(salesGstAmount)})</span>
                    {transportCharges > 0 && (
                      <>
                        {" − "}
                        Transport <span className="text-slate-400">({fmt(transportCharges)})</span>
                      </>
                    )}
                    {" + "}
                    Input GST ITC <span className="text-slate-400">({fmt(purchaseGstClaimed)})</span>
                    {" = "}
                    <strong className="text-emerald-700 font-bold">{fmt(netRealizedProfit)}</strong>
                  </>
                )
              ) : (
                hasReturns ? (
                  <>
                    Gross Sales Margin <span className="text-slate-400">({fmt(displayInitialGrossProfit)})</span>
                    {" − "}
                    Returned Profit <span className="text-slate-400">({fmt(salesReturnedProfit)})</span>
                    {transportCharges > 0 && (
                      <>
                        {" − "}
                        Transport & Other Charges <span className="text-slate-400">({fmt(transportCharges)})</span>
                      </>
                    )}
                    {" = "}
                    <strong className="text-emerald-700 font-bold">{fmt(netRealizedProfit)}</strong>
                  </>
                ) : (
                  <>
                    Selling Price <span className="text-slate-400">({fmt(sellingPrice)})</span>
                    {" − "}
                    Purchase Cost (incl. GST) <span className="text-slate-400">({fmt(purchaseCost)})</span>
                    {transportCharges > 0 && (
                      <>
                        {" − "}
                        Transport & Other Charges <span className="text-slate-400">({fmt(transportCharges)})</span>
                      </>
                    )}
                    {" = "}
                    <strong className="text-emerald-700 font-bold">{fmt(netRealizedProfit)}</strong>
                  </>
                )
              )}
            </div>
          </div>

          {/* Step-by-Step Ledger Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span>Step / Component</span>
              <span>Amount (₹)</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {!isGstReg ? (
                hasReturns ? (
                  <>
                    {/* Step 1: Gross Sales Margin */}
                    <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          1
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">Gross Sales Margin</div>
                          <div className="text-[11px] text-slate-500">
                            Total Sales {fmt(displayInitialSelling)} − Buy Cost {fmt(displayInitialPurchase)}
                          </div>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-800 tabular-nums">+{fmt(displayInitialGrossProfit)}</span>
                    </div>

                    {/* Step 2: Reversed Return Profit */}
                    <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          2
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">− Reversed Return Profit</div>
                          <div className="text-[11px] text-slate-500">Reversed on returned orders</div>
                        </div>
                      </div>
                      <span className="font-semibold text-rose-600 tabular-nums">−{fmt(salesReturnedProfit)}</span>
                    </div>

                    {/* Subtotal: Retained Profit before freight */}
                    <div className="px-4 py-2.5 bg-slate-50/60 flex items-center justify-between font-medium">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {transportCharges > 0 ? "= Retained Profit before freight" : "= Retained Profit"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          (Sell {fmt(sellingPrice)} − Buy {fmt(purchaseCost)})
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 text-sm tabular-nums">+{fmt(grossProfit)}</span>
                    </div>

                    {/* Step 3: Transport & Other Charges */}
                    {transportCharges > 0 && (
                      <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            3
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">− Transport & Other Charges</div>
                            <div className="text-[11px] text-slate-500">Allocated logistics, delivery, or procurement fees</div>
                          </div>
                        </div>
                        <span className="font-semibold text-purple-700 tabular-nums">−{fmt(transportCharges)}</span>
                      </div>
                    )}

                    {/* Final Step: Net Profit */}
                    <div className="px-4 py-3.5 bg-emerald-50/80 border-t-2 border-emerald-300 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                          <span>Net Profit</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold">
                            {netProfitMargin.toFixed(1)}% Margin
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-800 mt-0.5">
                          {transportCharges > 0 ? "True cash profit (Gross Margin − Returns − Transport)" : "True cash profit (Gross Margin − Returns)"}
                        </div>
                      </div>
                      <span className="text-lg font-bold text-emerald-700 tabular-nums">
                        {fmt(netRealizedProfit)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Step 1: Selling Price */}
                    <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          1
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">Selling Price / Revenue</div>
                          <div className="text-[11px] text-slate-500">Total customer selling price</div>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-800 tabular-nums">+{fmt(sellingPrice)}</span>
                    </div>

                    {/* Step 2: Purchase Cost */}
                    <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          2
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">Purchase Cost (incl. GST paid)</div>
                          <div className="text-[11px] text-slate-500">Actual cost paid to supplier including taxes</div>
                        </div>
                      </div>
                      <span className="font-semibold text-red-600 tabular-nums">−{fmt(purchaseCost)}</span>
                    </div>

                    {/* Step 3: Transport & Other Charges */}
                    {transportCharges > 0 && (
                      <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            3
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">− Transport & Other Charges</div>
                            <div className="text-[11px] text-slate-500">Allocated logistics, delivery, or procurement fees</div>
                          </div>
                        </div>
                        <span className="font-semibold text-purple-700 tabular-nums">−{fmt(transportCharges)}</span>
                      </div>
                    )}

                    {/* Final Step: Net Profit */}
                    <div className="px-4 py-3.5 bg-emerald-50/80 border-t-2 border-emerald-300 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                          <span>Net Profit</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold">
                            {netProfitMargin.toFixed(1)}% Margin
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-800 mt-0.5">
                          {transportCharges > 0 ? "True cash profit (Selling Price − Purchase Cost − Transport)" : "True cash profit (Selling Price − Purchase Cost)"}
                        </div>
                      </div>
                      <span className="text-lg font-bold text-emerald-700 tabular-nums">
                        {fmt(netRealizedProfit)}
                      </span>
                    </div>
                  </>
                )
              ) : (
                hasReturns ? (
                  <>
                    {/* Step 1: Gross Sales Profit */}
                    <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          1
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">Gross Sales Profit</div>
                          <div className="text-[11px] text-slate-500">
                            Total Sales {fmt(displayInitialSelling)} − Buy Cost {fmt(displayInitialPurchase)}
                          </div>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-800 tabular-nums">+{fmt(displayInitialGrossProfit)}</span>
                    </div>

                    {/* Step 2: Reversed Return Profit */}
                    <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          2
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">− Reversed Return Profit</div>
                          <div className="text-[11px] text-slate-500">Reversed profit on returned orders</div>
                        </div>
                      </div>
                      <span className="font-semibold text-rose-600 tabular-nums">−{fmt(salesReturnedProfit)}</span>
                    </div>

                    {/* Subtotal: Retained Gross Profit */}
                    <div className="px-4 py-2.5 bg-slate-50/60 flex items-center justify-between font-medium">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">= Retained Gross Profit (Sell − Buy)</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold">
                          {grossMargin.toFixed(1)}%
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 text-sm tabular-nums">+{fmt(grossProfit)}</span>
                    </div>

                    {/* Step 3: Output GST */}
                    <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          3
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <span>Output GST on Sales</span>
                          </div>
                          <div className="text-[11px] text-slate-500">Collected for government on retained sales</div>
                        </div>
                      </div>
                      <span className="font-semibold tabular-nums text-amber-700">
                        −{fmt(salesGstAmount)}
                      </span>
                    </div>

                    {/* Step 4: Transport Cost (only if incurred) */}
                    {transportCharges > 0 && (
                      <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            4
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">Transport & Additional Charges</div>
                            <div className="text-[11px] text-slate-500">Allocated logistics, delivery, or freight fees</div>
                          </div>
                        </div>
                        <span className="font-semibold text-purple-700 tabular-nums">−{fmt(transportCharges)}</span>
                      </div>
                    )}

                    {/* Step: Input GST ITC */}
                    <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {transportCharges > 0 ? 5 : 4}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <span>Input Tax Credit (ITC)</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded font-bold">
                              + Claimed
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            GST paid on purchases credited back to offset output tax
                          </div>
                        </div>
                      </div>
                      <span className="font-semibold tabular-nums text-emerald-600">
                        +{fmt(purchaseGstClaimed)}
                      </span>
                    </div>

                    {/* Final Step: Net Realized Profit */}
                    <div className="px-4 py-3.5 bg-emerald-50/80 border-t-2 border-emerald-300 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                          <span>Net Realized Profit</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold">
                            {netProfitMargin.toFixed(1)}% Net Margin
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-800 mt-0.5">
                          {transportCharges > 0 ? "Actual profit in hand after GST remittance and transport" : "Actual profit in hand after GST remittance"}
                        </div>
                      </div>
                      <span className="text-lg font-bold text-emerald-700 tabular-nums">
                        {fmt(netRealizedProfit)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Step 1: Selling Price */}
                    <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          1
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">Selling Price / Revenue</div>
                          <div className="text-[11px] text-slate-500">Total customer selling price incl. GST</div>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-800 tabular-nums">+{fmt(sellingPrice)}</span>
                    </div>

                    {/* Step 2: Purchase Cost */}
                    <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          2
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">Purchase / Landed Cost</div>
                          <div className="text-[11px] text-slate-500">Procurement cost of goods sold incl. GST</div>
                        </div>
                      </div>
                      <span className="font-semibold text-red-600 tabular-nums">−{fmt(purchaseCost)}</span>
                    </div>

                    {/* Subtotal: Gross Profit */}
                    <div className="px-4 py-3 bg-slate-50/60 flex items-center justify-between font-medium">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">Gross Margin / Profit (Sell − Buy)</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold">
                          {grossMargin.toFixed(1)}%
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 text-sm tabular-nums">{fmt(grossProfit)}</span>
                    </div>

                    {/* Step 3: Output GST */}
                    <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          3
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <span>Output GST on Sales</span>
                          </div>
                          <div className="text-[11px] text-slate-500">Collected for government on sale revenue</div>
                        </div>
                      </div>
                      <span className="font-semibold tabular-nums text-amber-700">
                        −{fmt(salesGstAmount)}
                      </span>
                    </div>

                    {/* Step 4: Transport Cost (only if incurred) */}
                    {transportCharges > 0 && (
                      <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            4
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">Transport & Additional Charges</div>
                            <div className="text-[11px] text-slate-500">Allocated logistics, delivery, or freight fees</div>
                          </div>
                        </div>
                        <span className="font-semibold text-purple-700 tabular-nums">−{fmt(transportCharges)}</span>
                      </div>
                    )}

                    {/* Step: Input GST ITC */}
                    <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {transportCharges > 0 ? 5 : 4}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <span>Input Tax Credit (ITC)</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded font-bold">
                              + Claimed
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            GST paid on purchases credited back to offset output tax
                          </div>
                        </div>
                      </div>
                      <span className="font-semibold tabular-nums text-emerald-600">
                        +{fmt(purchaseGstClaimed)}
                      </span>
                    </div>

                    {/* Final Step: Net Realized Profit */}
                    <div className="px-4 py-3.5 bg-emerald-50/80 border-t-2 border-emerald-300 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                          <span>Net Realized Profit</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold">
                            {netProfitMargin.toFixed(1)}% Net Margin
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-800 mt-0.5">
                          {transportCharges > 0 ? "Actual profit in hand after GST remittance and transport" : "Actual profit in hand after GST remittance"}
                        </div>
                      </div>
                      <span className="text-lg font-bold text-emerald-700 tabular-nums">
                        {fmt(netRealizedProfit)}
                      </span>
                    </div>
                  </>
                )
              )}
            </div>
          </div>

          {/* Educational Note Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {isGstReg
                  ? "Why is Input GST added back for GST-registered shops?"
                  : "How is profit calculated for Non-GST registered shops?"}
              </span>
            </div>
            {isGstReg ? (
              <>
                <p className="leading-relaxed">
                  When purchasing inventory, the shop pays purchase GST to the supplier (e.g. {fmt(purchaseGstClaimed)} included in the {fmt(purchaseCost)} purchase cost). When selling, the shop collects Output GST from the customer (e.g. {fmt(salesGstAmount)}).
                </p>
                <p className="leading-relaxed font-medium text-slate-700">
                  Under GST statutory rules, you only remit the <em>Net GST Difference</em> to the government:{" "}
                  <strong className="text-slate-900">
                    Output GST ({fmt(salesGstAmount)}) − Input ITC ({fmt(itcAmount)}) = {fmt(netGstPayable)} Net Tax
                  </strong>.
                </p>
                <p className="leading-relaxed text-slate-500">
                  Because Step 2 deducted the full purchase cost including the input GST, crediting back the {fmt(itcAmount)} ITC ensures you only bear your net tax obligation, resulting in your true Realized Profit of <strong>{fmt(netRealizedProfit)}</strong>.
                </p>
              </>
            ) : (
              <>
                <p className="leading-relaxed">
                  As a Non-GST seller, you do not collect Output GST from customers, nor can you claim Input Tax Credit (ITC) from the government on taxes paid to suppliers.
                </p>
                <p className="leading-relaxed font-medium text-slate-700">
                  Therefore, all GST paid during procurement forms a direct part of your true purchase cost ({fmt(purchaseCost)}).
                </p>
                <p className="leading-relaxed text-slate-500">
                  Your true net profit is: <strong>Selling Price ({fmt(sellingPrice)}) − Purchase Cost ({fmt(purchaseCost)}) {transportCharges > 0 ? `− Transport & Other Charges (${fmt(transportCharges)}) ` : ""}= Net Profit ({fmt(netRealizedProfit)})</strong>.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Registered Status: <strong className="text-slate-700">{isGstReg ? "GST Active (ITC Claimable)" : "Unregistered"}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
export default ProfitBreakdownModal;
