import { calculateTaxSplit, calculateProductEffectivePrice, calculateBillTotals } from "./pricing";

function expectEq(label: string, actual: number, expected: number) {
  if (Math.abs(actual - expected) > 0.001) {
    throw new Error(`Failed ${label}: Expected ${expected}, got ${actual}`);
  }
}

export function runPricingTests(): boolean {
  // T1: ₹105 at 5% GST
  const t1 = calculateTaxSplit(105, 5);
  expectEq("T1 Taxable", t1.taxableValue, 100.00);
  expectEq("T1 GST", t1.gstAmount, 5.00);
  expectEq("T1 CGST", t1.cgst, 2.50);
  expectEq("T1 SGST", t1.sgst, 2.50);

  // T2: ₹100 at 5% GST
  const t2 = calculateTaxSplit(100, 5);
  expectEq("T2 Taxable", t2.taxableValue, 95.24);
  expectEq("T2 GST", t2.gstAmount, 4.76);
  expectEq("T2 CGST", t2.cgst, 2.38);
  expectEq("T2 SGST", t2.sgst, 2.38);

  // T3: ₹118 at 18% GST
  const t3 = calculateTaxSplit(118, 18);
  expectEq("T3 Taxable", t3.taxableValue, 100.00);
  expectEq("T3 GST", t3.gstAmount, 18.00);

  // T4: ₹100 at 18% GST
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
  expectEq("T10 Kurta Taxable", t10.lines[0].taxableValue, 857.14);
  expectEq("T10 Kurta GST", t10.lines[0].gstAmount, 42.86);

  expectEq("T10 Headphone Bill Share", t10.lines[1].billDiscountShare, 200.00);
  expectEq("T10 Headphone Final", t10.lines[1].finalInclusive, 1800.00);
  expectEq("T10 Headphone Taxable", t10.lines[1].taxableValue, 1525.42);
  expectEq("T10 Headphone GST", t10.lines[1].gstAmount, 274.58);

  expectEq("T10 Gross Subtotal", t10.baseSubtotal, 3000.00);
  expectEq("T10 Total Taxable", t10.totalTaxable, 2382.56);
  expectEq("T10 Total GST", t10.totalGst, 317.44);
  expectEq("T10 Payable", t10.payable, 2700.00);

  // T11: Rounding test
  expectEq("T11 Taxable 95.24", t2.taxableValue, 95.24);
  expectEq("T11 GST 4.76", t2.gstAmount, 4.76);

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

  return true;
}
