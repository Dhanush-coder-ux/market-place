// ============================================================================
// Discount Management — Core Pricing & Tax Calculation Engine
// Follows the 3 Core Rules and exact rounding formulas from the specification.
// ============================================================================

export interface TaxSplit {
  inclusivePrice: number;
  taxableValue: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  gstRate: number;
}

export interface ProductPricingInfo {
  mrp?: number | null;
  sellingPrice: number; // Inclusive of GST
  gstRate: number;      // 0, 5, 12, 18, 28
  discountPercent?: number; // 0 - 99.99
  offerValidUntil?: string | null;
  costPrice?: number;
}

export interface BillLineInput {
  id: string;
  inventoryId?: string;
  name: string;
  code?: string;
  hsn?: string;
  qty: number;
  sellingPrice: number; // Inclusive of GST per unit
  mrp?: number | null;
  gstRate: number;
  productDiscountPercent?: number;
  lineDiscountMode?: '%' | '₹';
  lineDiscountValue?: number;
  costPrice?: number;
}

export interface CalculatedBillLine extends BillLineInput {
  base: number;                    // sellingPrice * qty
  productDiscountAmount: number;   // Amount off from product discount
  afterProductDiscount: number;    // base - productDiscountAmount
  lineDiscountAmount: number;      // Amount off from line discount
  lineInclusive: number;           // afterProductDiscount - lineDiscountAmount
  billDiscountShare: number;       // Proportional share of bill-level discount
  finalInclusive: number;          // lineInclusive - billDiscountShare (what customer pays)
  taxableValue: number;            // finalInclusive / (1 + gstRate/100)
  gstAmount: number;               // finalInclusive - taxableValue
  cgst: number;                    // gstAmount / 2
  sgst: number;                    // gstAmount / 2
}

export interface TaxSummaryGroup {
  gstRate: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  totalTax: number;
}

export interface BillTotals {
  lines: CalculatedBillLine[];
  totalQty: number;
  baseSubtotal: number;            // Sum of base (sellingPrice * qty)
  productDiscountTotal: number;
  lineDiscountTotal: number;
  billDiscountTotal: number;
  totalDiscountGiven: number;      // product + line + bill discounts
  subtotal: number;                // Sum of lineInclusive before bill discount
  totalTaxable: number;            // Sum of taxableValue
  totalGst: number;                // Sum of gstAmount
  gross: number;                   // totalTaxable + totalGst
  payable: number;                 // round(gross) to nearest rupee
  roundOff: number;                // payable - gross
  taxGroups: TaxSummaryGroup[];
  totalMrp: number;
  totalSavings: number;            // Savings against MRP
  hasMrpSavings: boolean;
}

export function isShopGstRegistered(): boolean {
  try {
    const rawSetting = localStorage.getItem("purchaseSettings");
    if (rawSetting) {
      const parsed = JSON.parse(rawSetting);
      if (parsed.gstType === "registered") return true;
      if (parsed.gstType === "non-registered") return false;
    }
    const shopGstFlag = localStorage.getItem("shop_gst_registered");
    if (shopGstFlag === "true") return true;
    if (shopGstFlag === "false") return false;

    const shopData = localStorage.getItem("shop_data");
    if (shopData) {
      const parsedShop = JSON.parse(shopData);
      if (parsedShop?.business_infos?.gst_infos?.registered !== undefined) {
        return !!parsedShop.business_infos.gst_infos.registered;
      }
    }
  } catch {
    // fallback
  }
  return true;
}

// ----------------------------------------------------------------------------
// 2.1 Extracting GST from an inclusive price
// Rule 1: taxable = inclusive / (1 + gstRate / 100), gst = inclusive - taxable
// Round taxable to 2 decimals, derive gst as inclusive - taxable.
// ----------------------------------------------------------------------------
export function calculateTaxSplit(inclusivePrice: number, gstRate: number): TaxSplit {
  const cleanInclusive = Math.max(0, Number(inclusivePrice) || 0);
  const cleanRate = Math.max(0, Number(gstRate) || 0);

  if (cleanRate <= 0) {
    const roundedInclusive = Math.round(cleanInclusive * 100) / 100;
    return {
      inclusivePrice: roundedInclusive,
      taxableValue: roundedInclusive,
      gstAmount: 0,
      cgst: 0,
      sgst: 0,
      gstRate: 0,
    };
  }

  const rateMultiplier = 1 + cleanRate / 100;
  const taxableValue = Math.round((cleanInclusive / rateMultiplier) * 100) / 100;
  const gstAmount = Math.round((cleanInclusive - taxableValue) * 100) / 100;
  const cgst = Math.round((gstAmount / 2) * 100) / 100;
  const sgst = Math.round((gstAmount - cgst) * 100) / 100; // ensures cgst + sgst == gstAmount

  return {
    inclusivePrice: Math.round(cleanInclusive * 100) / 100,
    taxableValue,
    gstAmount,
    cgst,
    sgst,
    gstRate: cleanRate,
  };
}

// ----------------------------------------------------------------------------
// 2.2 Product Level Effective Price, Discount & Margin
// Rule 2 & 3: Discount reduces selling price (not MRP).
// If shop is GST registered, entered sellingPrice is exclusive of GST (base + GST).
// If shop is non-registered, entered sellingPrice is flat (0% GST).
// ----------------------------------------------------------------------------
export function calculateProductEffectivePrice(input: ProductPricingInfo & { isGstRegistered?: boolean }) {
  const sellingPrice = Math.max(0, Number(input.sellingPrice) || 0);
  const isGstReg = input.isGstRegistered !== undefined ? input.isGstRegistered : isShopGstRegistered();
  const rawGstRate = Math.max(0, Number(input.gstRate) || 0);
  const gstRate = isGstReg ? rawGstRate : 0;
  const mrp = input.mrp !== null && input.mrp !== undefined && Number(input.mrp) > 0 ? Number(input.mrp) : null;

  // Check offer validity
  let isOfferExpired = false;
  if (input.offerValidUntil) {
    const expiry = new Date(input.offerValidUntil);
    expiry.setHours(23, 59, 59, 999);
    if (expiry < new Date()) {
      isOfferExpired = true;
    }
  }

  const discountPercent = !isOfferExpired && input.discountPercent ? Math.max(0, Math.min(99.99, Number(input.discountPercent))) : 0;
  const discountAmount = Math.round((sellingPrice * discountPercent / 100) * 100) / 100;
  const discountedBase = Math.round((sellingPrice - discountAmount) * 100) / 100;

  let taxableValue = discountedBase;
  let gstAmount = 0;
  let finalPrice = discountedBase;

  if (isGstReg && gstRate > 0) {
    gstAmount = Math.round((taxableValue * gstRate / 100) * 100) / 100;
    finalPrice = Math.round((taxableValue + gstAmount) * 100) / 100;
  }

  const cgst = Math.round((gstAmount / 2) * 100) / 100;
  const sgst = Math.round((gstAmount - cgst) * 100) / 100;

  const tax: TaxSplit = {
    inclusivePrice: finalPrice,
    taxableValue,
    gstAmount,
    cgst,
    sgst,
    gstRate,
  };

  // MRP Savings
  let customerSaving = 0;
  let offMrpPercent = 0;
  if (mrp && mrp > finalPrice) {
    customerSaving = Math.round((mrp - finalPrice) * 100) / 100;
    offMrpPercent = Math.round(((mrp - finalPrice) / mrp * 100) * 10) / 10;
  }

  // Profit calculation:
  const costPrice = input.costPrice !== undefined && input.costPrice !== null ? Number(input.costPrice) : undefined;
  const profit = costPrice !== undefined ? Math.round((finalPrice - costPrice) * 100) / 100 : undefined;
  const marginPercent = costPrice !== undefined && finalPrice > 0
    ? Math.round(((finalPrice - costPrice) / finalPrice * 100) * 10) / 10
    : undefined;

  return {
    mrp,
    sellingPrice,
    discountPercent,
    discountAmount,
    finalPrice,
    effectivePrice: finalPrice,
    isOfferExpired,
    tax,
    customerSaving,
    offMrpPercent,
    profit,
    marginPercent,
    isGstRegistered: isGstReg,
  };
}

// ----------------------------------------------------------------------------
// 7.2 Billing Calculation Pipeline (3 Levels of Discount + Proportional Split)
// ----------------------------------------------------------------------------
export function calculateBillTotals(
  lines: BillLineInput[],
  billDiscount: { mode: '%' | '₹'; value: number } = { mode: '%', value: 0 },
  options?: { isGstRegistered?: boolean }
): BillTotals {
  const isGstReg = options?.isGstRegistered !== undefined ? options.isGstRegistered : isShopGstRegistered();

  let totalQty = 0;
  let baseSubtotal = 0;
  let productDiscountTotal = 0;
  let lineDiscountTotal = 0;

  // STEP 1 — Per line item calculations
  const step1Lines = lines.map(line => {
    const qty = Math.max(1, Number(line.qty) || 1);
    const sellingPrice = Math.max(0, Number(line.sellingPrice) || 0);
    const base = Math.round(sellingPrice * qty * 100) / 100;
    totalQty += qty;
    baseSubtotal += base;

    // Product offer discount (%)
    const prodDiscPct = Math.max(0, Math.min(99.99, Number(line.productDiscountPercent) || 0));
    const productDiscountAmount = Math.round((base * prodDiscPct / 100) * 100) / 100;
    const afterProductDiscount = Math.max(0, Math.round((base - productDiscountAmount) * 100) / 100);
    productDiscountTotal += productDiscountAmount;

    // Line / Cashier discount
    let lineDiscountAmount = 0;
    const lineVal = Math.max(0, Number(line.lineDiscountValue) || 0);
    if (line.lineDiscountMode === '%') {
      const pct = Math.min(100, lineVal);
      lineDiscountAmount = Math.round((afterProductDiscount * pct / 100) * 100) / 100;
    } else {
      lineDiscountAmount = Math.min(lineVal, afterProductDiscount);
    }
    lineDiscountAmount = Math.round(lineDiscountAmount * 100) / 100;
    lineDiscountTotal += lineDiscountAmount;

    const lineInclusive = Math.max(0, Math.round((afterProductDiscount - lineDiscountAmount) * 100) / 100);

    return {
      ...line,
      qty,
      sellingPrice,
      base,
      productDiscountAmount,
      afterProductDiscount,
      lineDiscountAmount,
      lineInclusive,
    };
  });

  // STEP 2 — Subtotal before bill discount
  const subtotal = Math.round(step1Lines.reduce((sum, l) => sum + l.lineInclusive, 0) * 100) / 100;

  // STEP 3 — Bill discount calculation & proportional split across lines
  let billDiscountTotal = 0;
  const bVal = Math.max(0, Number(billDiscount.value) || 0);
  if (billDiscount.mode === '%') {
    const bPct = Math.min(100, bVal);
    billDiscountTotal = Math.round((subtotal * bPct / 100) * 100) / 100;
  } else {
    billDiscountTotal = Math.min(bVal, subtotal);
  }
  billDiscountTotal = Math.round(billDiscountTotal * 100) / 100;

  // Proportional share per line
  let remainingBillDiscount = billDiscountTotal;
  const finalizedLines: CalculatedBillLine[] = step1Lines.map((line, idx) => {
    let billDiscountShare = 0;
    if (subtotal > 0 && billDiscountTotal > 0 && line.lineInclusive > 0) {
      if (idx === step1Lines.length - 1) {
        // Last line takes the remainder to prevent 1-paisa rounding divergence
        billDiscountShare = Math.min(line.lineInclusive, Math.max(0, Math.round(remainingBillDiscount * 100) / 100));
      } else {
        billDiscountShare = Math.round((billDiscountTotal * (line.lineInclusive / subtotal)) * 100) / 100;
        billDiscountShare = Math.min(line.lineInclusive, billDiscountShare);
        remainingBillDiscount -= billDiscountShare;
      }
    }

    const taxableValue = Math.max(0, Math.round((line.lineInclusive - billDiscountShare) * 100) / 100);
    const rawGstRate = Math.max(0, Number(line.gstRate) || 0);
    const gstRate = isGstReg ? rawGstRate : 0;
    let gstAmount = 0;
    let finalInclusive = taxableValue;

    if (isGstReg && gstRate > 0) {
      gstAmount = Math.round((taxableValue * (gstRate / 100)) * 100) / 100;
      finalInclusive = Math.round((taxableValue + gstAmount) * 100) / 100;
    }

    const cgst = Math.round((gstAmount / 2) * 100) / 100;
    const sgst = Math.round((gstAmount - cgst) * 100) / 100;

    return {
      ...line,
      billDiscountShare,
      finalInclusive,
      taxableValue,
      gstRate,
      gstAmount,
      cgst,
      sgst,
    };
  });

  // STEP 5 — Totals, Tax Summary & Exact 2-Decimal Precision (No integer round-off)
  const totalTaxable = Math.round(finalizedLines.reduce((sum, l) => sum + l.taxableValue, 0) * 100) / 100;
  const totalGst = Math.round(finalizedLines.reduce((sum, l) => sum + l.gstAmount, 0) * 100) / 100;
  const gross = Math.round((totalTaxable + totalGst) * 100) / 100;
  const payable = gross;
  const roundOff = 0;

  // Tax Summary by GST Rate
  const taxGroupMap: Record<number, TaxSummaryGroup> = {};
  finalizedLines.forEach(l => {
    const rate = l.gstRate;
    if (rate > 0) {
      if (!taxGroupMap[rate]) {
        taxGroupMap[rate] = {
          gstRate: rate,
          taxableValue: 0,
          cgst: 0,
          sgst: 0,
          totalTax: 0,
        };
      }
      taxGroupMap[rate].taxableValue += l.taxableValue;
      taxGroupMap[rate].cgst += l.cgst;
      taxGroupMap[rate].sgst += l.sgst;
      taxGroupMap[rate].totalTax += l.gstAmount;
    }
  });

  const taxGroups = Object.values(taxGroupMap)
    .sort((a, b) => a.gstRate - b.gstRate)
    .map(g => ({
      gstRate: g.gstRate,
      taxableValue: Math.round(g.taxableValue * 100) / 100,
      cgst: Math.round(g.cgst * 100) / 100,
      sgst: Math.round(g.sgst * 100) / 100,
      totalTax: Math.round(g.totalTax * 100) / 100,
    }));

  // Customer Savings Calculation:
  // saving = sum(mrp * qty for lines with MRP) + sum(finalInclusive for lines without) - payable
  let totalMrpOrBase = 0;
  let hasAnyMrp = false;
  finalizedLines.forEach(l => {
    if (l.mrp && l.mrp > 0) {
      totalMrpOrBase += l.mrp * l.qty;
      hasAnyMrp = true;
    } else {
      totalMrpOrBase += l.finalInclusive;
    }
  });

  const totalMrp = Math.round(totalMrpOrBase * 100) / 100;
  const totalSavings = hasAnyMrp && totalMrp > payable ? Math.round((totalMrp - payable) * 100) / 100 : 0;
  const totalDiscountGiven = Math.round((productDiscountTotal + lineDiscountTotal + billDiscountTotal) * 100) / 100;

  return {
    lines: finalizedLines,
    totalQty,
    baseSubtotal: Math.round(baseSubtotal * 100) / 100,
    productDiscountTotal: Math.round(productDiscountTotal * 100) / 100,
    lineDiscountTotal: Math.round(lineDiscountTotal * 100) / 100,
    billDiscountTotal: Math.round(billDiscountTotal * 100) / 100,
    totalDiscountGiven,
    subtotal,
    totalTaxable,
    totalGst,
    gross,
    payable,
    roundOff,
    taxGroups,
    totalMrp,
    totalSavings,
    hasMrpSavings: totalSavings > 0,
  };
}

// ----------------------------------------------------------------------------
// Format Currency Helper (₹ Indian Rupee Format)
// ----------------------------------------------------------------------------
export function formatINR(val: number | undefined | null, decimals = 2): string {
  if (val === undefined || val === null || isNaN(val)) return '0.00';
  return val.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
