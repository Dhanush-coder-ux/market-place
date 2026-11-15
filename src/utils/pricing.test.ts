import { calculateTaxSplit, calculateProductEffectivePrice, calculateBillTotals, calculateProfitAndMargin } from "./pricing";

function expectEq(label: string, actual: number, expected: number) {
  if (Math.abs(actual - expected) > 0.001) {
    throw new Error(`Failed ${label}: Expected ${expected}, got ${actual}`);
  }
}

export function runPricingTests(): boolean {
  // User Case: ₹95 at 18% GST (95 / 1.18 = 80.51 base, 14.49 GST)
  const tUser = calculateTaxSplit(95, 18);
  expectEq("User Taxable", tUser.taxableValue, 80.51);
  expectEq("User GST", tUser.gstAmount, 14.49);
  expectEq("User CGST", tUser.cgst, 7.25);
  expectEq("User SGST", tUser.sgst, 7.24);
  expectEq("User Total", tUser.taxableValue + tUser.cgst + tUser.sgst, 95.00);

  // T1: ₹105 at 5% GST (105 / 1.05 = 100.00 base, 5.00 GST)
  const t1 = calculateTaxSplit(105, 5);
  expectEq("T1 Taxable", t1.taxableValue, 100.00);
  expectEq("T1 GST", t1.gstAmount, 5.00);
  expectEq("T1 CGST", t1.cgst, 2.50);
  expectEq("T1 SGST", t1.sgst, 2.50);

  // T2: ₹100 at 5% GST (100 / 1.05 = 95.24 base, 4.76 GST)
  const t2 = calculateTaxSplit(100, 5);
  expectEq("T2 Taxable", t2.taxableValue, 95.24);
  expectEq("T2 GST", t2.gstAmount, 4.76);
  expectEq("T2 CGST", t2.cgst, 2.38);
  expectEq("T2 SGST", t2.sgst, 2.38);

  // T3: ₹118 at 18% GST (118 / 1.18 = 100.00 base, 18.00 GST)
  const t3 = calculateTaxSplit(118, 18);
  expectEq("T3 Taxable", t3.taxableValue, 100.00);
  expectEq("T3 GST", t3.gstAmount, 18.00);

  // T4: ₹100 at 18% GST (100 / 1.18 = 84.75 base, 15.25 GST)
  const t4 = calculateTaxSplit(100, 18);
  expectEq("T4 Taxable", t4.taxableValue, 84.75);
  expectEq("T4 GST", t4.gstAmount, 15.25);

  // T5: ₹100 at 0% GST
  const t5 = calculateTaxSplit(100, 0);
  expectEq("T5 Taxable", t5.taxableValue, 100.00);
  expectEq("T5 GST", t5.gstAmount, 0.00);

  // T6: Product discount 10% on ₹100 SP
  const t6 = calculateProductEffectivePrice({
    sellingPrice: 100,
    gstRate: 5,
    discountPercent: 10,
  });
  expectEq("T6 Discount Amount", t6.discountAmount, 10.00);
  expectEq("T6 Effective Price", t6.effectivePrice, 90.00);

  // T7: Product discount with MRP (MRP 120, SP 100, 10% off SP)
  const t7 = calculateProductEffectivePrice({
    mrp: 120,
    sellingPrice: 100,
    gstRate: 5,
    discountPercent: 10,
  });
  expectEq("T7 Final Price", t7.effectivePrice, 90.00);
  expectEq("T7 Total Savings", t7.customerSaving, 30.00);

  // T8: Line discount ₹20 on ₹100 SP
  const t8 = calculateBillTotals([
    { id: "1", name: "Item A", qty: 1, sellingPrice: 100, gstRate: 5, lineDiscountMode: "₹", lineDiscountValue: 20 }
  ]);
  expectEq("T8 Line Inclusive", t8.lines[0].finalInclusive, 80.00);
  expectEq("T8 Payable", t8.payable, 80.00);

  // T9: Line discount 10% on top of 10% product discount on ₹100 SP
  const t9 = calculateBillTotals([
    { id: "1", name: "Item A", qty: 1, sellingPrice: 100, gstRate: 5, productDiscountPercent: 10, lineDiscountMode: "%", lineDiscountValue: 10 }
  ]);
  expectEq("T9 Product Disc", t9.lines[0].productDiscountAmount, 10.00);
  expectEq("T9 Line Disc", t9.lines[0].lineDiscountAmount, 9.00);
  expectEq("T9 Final Line", t9.lines[0].finalInclusive, 81.00);
  expectEq("T9 Total Discount", t9.totalDiscountGiven, 19.00);

  // T10: Proportional Bill discount ₹300 on Kurta (₹1,000 @ 5%) + Headphones (₹2,000 @ 18%)
  const t10 = calculateBillTotals(
    [
      { id: "1", name: "Kurta", qty: 1, sellingPrice: 1000, gstRate: 5 },
      { id: "2", name: "Headphones", qty: 1, sellingPrice: 2000, gstRate: 18 }
    ],
    { mode: "₹", value: 300 }
  );
  expectEq("T10 Kurta Bill Share", t10.lines[0].billDiscountShare, 100.00);
  expectEq("T10 Kurta Final", t10.lines[0].finalInclusive, 900.00);
  expectEq("T10 Kurta Taxable", t10.lines[0].taxableValue, 855.00);
  expectEq("T10 Kurta GST", t10.lines[0].gstAmount, 45.00);

  expectEq("T10 Headphone Bill Share", t10.lines[1].billDiscountShare, 200.00);
  expectEq("T10 Headphone Final", t10.lines[1].finalInclusive, 1800.00);
  expectEq("T10 Headphone Taxable", t10.lines[1].taxableValue, 1476.00);
  expectEq("T10 Headphone GST", t10.lines[1].gstAmount, 324.00);

  expectEq("T10 Gross Subtotal", t10.baseSubtotal, 3000.00);
  expectEq("T10 Total Taxable", t10.totalTaxable, 2331.00);
  expectEq("T10 Total GST", t10.totalGst, 369.00);
  expectEq("T10 Payable", t10.payable, 2700.00);

  // T11: Rounding test
  expectEq("T11 Taxable 95.00", t2.taxableValue, 95.00);
  expectEq("T11 GST 5.00", t2.gstAmount, 5.00);

  // T13: Expired offer check
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const t13 = calculateProductEffectivePrice({
    sellingPrice: 100,
    gstRate: 5,
    discountPercent: 20,
    offerValidUntil: yesterday
  });
  expectEq("T13 Expired Discount", t13.discountAmount, 0.00);
  expectEq("T13 Expired Effective Price", t13.effectivePrice, 100.00);

  // T14: 3-Level discount stack
  const t14 = calculateBillTotals(
    [
      { id: "1", name: "Item A", qty: 1, sellingPrice: 100, gstRate: 5, productDiscountPercent: 10, lineDiscountMode: "%", lineDiscountValue: 10 }
    ],
    { mode: "%", value: 10 }
  );
  expectEq("T14 Product Disc", t14.lines[0].productDiscountAmount, 10.00);
  expectEq("T14 Line Disc", t14.lines[0].lineDiscountAmount, 9.00);
  expectEq("T14 Bill Disc Share", t14.lines[0].billDiscountShare, 8.10);
  expectEq("T14 Final Inclusive", t14.lines[0].finalInclusive, 72.90);
  expectEq("T14 Total Discount", t14.totalDiscountGiven, 27.10);
  expectEq("T14 Payable (No Roundoff)", t14.payable, 72.90);
  expectEq("T14 Roundoff Zero", t14.roundOff, 0.00);

  // T15: Pre-GST base profit margin calculation
  // SP: ₹150 inclusive at 18% GST -> base SP = 150 / 1.18 = ₹127.12
  // BP: ₹84.75 base -> Profit = 127.12 - 84.75 = ₹42.37, Margin = (42.37 / 127.12) * 100 = 33.3%
  const t15 = calculateProfitAndMargin({
    sellingPrice: 150,
    buyingPrice: 84.75,
    gstRate: 18,
    sellingGstMode: 'inclusive',
    buyingGstMode: 'exclusive',
    isGstRegistered: true,
  });
  expectEq("T15 Base Selling", t15.baseSellingPrice, 127.12);
  expectEq("T15 Base Buying", t15.baseBuyingPrice, 84.75);
  expectEq("T15 Profit", t15.profit, 42.37);
  expectEq("T15 Margin %", t15.marginPercent, 33.3);

  // T16: Pre-GST base profit calculation in calculateProductEffectivePrice
  const t16 = calculateProductEffectivePrice({
    sellingPrice: 150,
    gstRate: 18,
    isGstRegistered: true,
    costPrice: 84.75,
  });
  expectEq("T16 Taxable Base SP", t16.tax.taxableValue, 127.12);
  expectEq("T16 Base Cost", t16.baseCostPrice || 0, 84.75);
  expectEq("T16 Profit", t16.profit || 0, 42.37);
  expectEq("T16 Margin %", t16.marginPercent || 0, 33.3);

  // T17: Zero or missing buying price should give 0 profit and 0% margin (not 100%)
  const t17 = calculateProfitAndMargin({
    sellingPrice: 150,
    buyingPrice: 0,
    gstRate: 18,
    sellingGstMode: 'inclusive',
    buyingGstMode: 'exclusive',
    isGstRegistered: true,
  });
  expectEq("T17 Zero Buying Price Profit", t17.profit, 0);
  expectEq("T17 Zero Buying Price Margin %", t17.marginPercent, 0);

  // T18: Zero cost in calculateProductEffectivePrice should not yield 100% margin
  const t18 = calculateProductEffectivePrice({
    sellingPrice: 150,
    gstRate: 18,
    isGstRegistered: true,
    costPrice: 0,
  });
  expectEq("T18 Zero Cost Profit", t18.profit ?? 0, 0);
  expectEq("T18 Zero Cost Margin %", t18.marginPercent ?? 0, 0);

  return true;
}
