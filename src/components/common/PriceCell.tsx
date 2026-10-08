import React from 'react';
import { calculateProductEffectivePrice, formatINR } from '@/utils/pricing';

export interface PriceCellProps {
  sellingPrice?: number | string | null;
  mrp?: number | string | null;
  gstRate?: number | string | null;
  discountPercent?: number | string | null;
  offerValidUntil?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSavingsBadge?: boolean;
}

/**
 * Universal Price Cell Component conforming strictly to Section 6 of Specification:
 * - ₹15.75                ← inclusive, bold, 15px
 * - ₹15.00 + ₹0.75 GST 5% ← split, 10.5px grey
 * - MRP ₹20.00            ← struck through, only when final < mrp
 * - "— / Set on purchase" when no price exists
 */
export const PriceCell: React.FC<PriceCellProps> = ({
  sellingPrice,
  mrp,
  gstRate = 18,
  discountPercent = 0,
  offerValidUntil,
  className = '',
  size = 'md',
  showSavingsBadge = true,
}) => {
  const numSellingPrice = sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== ''
    ? Number(sellingPrice)
    : null;
  const numMrp = mrp !== undefined && mrp !== null && mrp !== '' ? Number(mrp) : null;
  const cleanGstRate = typeof gstRate === 'string'
    ? parseFloat(gstRate.replace(/[^0-9.]/g, '')) || 0
    : Number(gstRate) || 0;
  const cleanDiscount = typeof discountPercent === 'string'
    ? parseFloat(discountPercent.replace(/[^0-9.]/g, '')) || 0
    : Number(discountPercent) || 0;

  if (numSellingPrice === null || isNaN(numSellingPrice) || numSellingPrice <= 0) {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className="text-[13px] font-semibold text-slate-400">—</span>
        <span className="text-[10.5px] text-slate-400 font-medium leading-tight">
          {numMrp && numMrp > 0 ? `MRP ₹${formatINR(numMrp)}` : 'Set on purchase'}
        </span>
      </div>
    );
  }

  const { finalPrice, tax, offMrpPercent, customerSaving, isOfferExpired } = calculateProductEffectivePrice({
    sellingPrice: numSellingPrice,
    mrp: numMrp,
    gstRate: cleanGstRate,
    discountPercent: cleanDiscount,
    offerValidUntil,
  });

  const isDiscountApplied = cleanDiscount > 0 && !isOfferExpired;
  const hasMrpSaving = numMrp !== null && numMrp > finalPrice;

  const fontSizes = {
    sm: { main: 'text-[13px]', split: 'text-[9.5px]', mrp: 'text-[10px]' },
    md: { main: 'text-[15px]', split: 'text-[10.5px]', mrp: 'text-[11px]' },
    lg: { main: 'text-[18px]', split: 'text-[12px]', mrp: 'text-[12px]' },
  }[size];

  return (
    <div className={`flex flex-col leading-tight ${className}`}>
      {/* Inclusive Final Price + Strikethrough MRP */}
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className={`${fontSizes.main} font-bold text-slate-900 tabular-nums`}>
          ₹{formatINR(finalPrice)}
        </span>
        {hasMrpSaving && (
          <span className={`${fontSizes.mrp} text-slate-400 line-through tabular-nums font-normal`}>
            MRP ₹{formatINR(numMrp)}
          </span>
        )}
      </div>

      {/* Tax Split: Base Taxable + GST */}
      <div className={`${fontSizes.split} text-slate-500 font-medium mt-0.5 tabular-nums flex items-center gap-1`}>
        <span>
          ₹{formatINR(tax.taxableValue)} + ₹{formatINR(tax.gstAmount)} GST {cleanGstRate}%
        </span>
      </div>

      {/* Optional Savings / Discount Badge */}
      {showSavingsBadge && (hasMrpSaving || isDiscountApplied) && (
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {hasMrpSaving && offMrpPercent > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.2 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded">
              {offMrpPercent}% off MRP · Saves ₹{formatINR(customerSaving)}
            </span>
          )}
          {isDiscountApplied && cleanDiscount > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.2 text-[9.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 rounded">
              {cleanDiscount}% Offer
            </span>
          )}
        </div>
      )}
    </div>
  );
};
