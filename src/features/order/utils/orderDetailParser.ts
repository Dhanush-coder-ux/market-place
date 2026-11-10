import type { OrderRecord } from "@/types/api";
import type { OrderDetailType, OrderItem } from "../components/OrdersDetailView";
import { cleanVariantText } from "../components/OrdersDetailView";

export const toCardShape = (o: OrderRecord, customerMap?: Record<string, { name: string; phone: string }>) => {
  const c = o.customer_id && customerMap ? customerMap[o.customer_id] : null;
  const anyOrder = o as any;
  const custObj = anyOrder.customer || {};
  const onlineObj = anyOrder.online_details || {};
  const addObj = anyOrder.additional_infos || {};
  const calcObj = anyOrder.calculation_infos || {};
  const dataObj = anyOrder.datas || {};
  const itemObj = anyOrder.item_infos || {};
  const chargesObj = anyOrder.charges_infos || {};

  const name =
    onlineObj.name ||
    onlineObj.customer_name ||
    anyOrder.customer_name ||
    anyOrder.user_name ||
    o.customer_name ||
    custObj.customer_name ||
    custObj.name ||
    addObj.customer_name ||
    addObj.name ||
    dataObj.customer_name ||
    dataObj.name ||
    c?.name ||
    "Customer";

  const phone =
    onlineObj.phone ||
    onlineObj.customer_phone ||
    anyOrder.customer_phone ||
    anyOrder.customer_number ||
    o.customer_number ||
    custObj.mobile_number ||
    custObj.phone ||
    addObj.customer_phone ||
    addObj.phone ||
    dataObj.phone ||
    dataObj.customer_phone ||
    c?.phone ||
    "—";

  const delivery = Number(chargesObj.delivery_charge ?? chargesObj.delivery_charges ?? chargesObj.delivery_fee ?? 0) || 0;
  let rawTotal = calcObj.total ?? calcObj.grand_total ?? o.total_amount ?? o.total ?? anyOrder.total_order_value ?? dataObj.total_amount;
  if (rawTotal === undefined || rawTotal === null || Number(rawTotal) === 0) {
    if (itemObj.total_order_amount !== undefined) {
      const base = Number(itemObj.total_order_amount) || 0;
      rawTotal = base + delivery;
    } else {
      rawTotal = (calcObj.sub_total ?? itemObj.total_order_amount ?? o.pending_amount ?? 0) + delivery;
    }
  } else {
    const baseItems = Number(itemObj.total_order_amount ?? 0);
    if (baseItems > 0 && Math.abs(Number(rawTotal) - baseItems) < 0.01 && delivery > 0) {
      rawTotal = Number(rawTotal) + delivery;
    }
  }
  const totalAmount = Number(Number(rawTotal).toFixed(2));

  return {
    id: o.id,
    billNo: o.ui_id || o.id,
    customerName: name,
    phone: phone,
    totalAmount: isNaN(totalAmount) ? 0 : totalAmount,
    status: (o.status ?? "PENDING").toUpperCase(),
    origin: (o.origin || "ONLINE").toUpperCase(),
    deliveryCode: anyOrder.delivery_code || onlineObj.delivery_code || addObj.delivery_code || null,
    online_details: Object.keys(onlineObj).length > 0 ? onlineObj : (addObj.user_id || addObj.full_address || addObj.address_id ? addObj : {}),
    status_updated_by: o.status_updated_by || addObj.status_updated_by || addObj.accepted_by || addObj.canceled_by || addObj.rejected_by || addObj.last_action_by || null,
    status_history: addObj.status_history || [],
    additional_infos: addObj,
  };
};

export const parseOrderForDetail = (
  rawOrder: any,
  fallbackCardOrder?: OrderRecord,
  customerMap?: Record<string, { name: string; phone: string }>
): OrderDetailType => {
  const o = rawOrder || fallbackCardOrder || {};
  const cardShape = fallbackCardOrder ? toCardShape(fallbackCardOrder, customerMap) : toCardShape(o, customerMap);

  const calc = o.calculation_infos || o.calculations || {};
  const itemInfos = o.item_infos || {};
  const addInfos = o.additional_infos || {};
  const charges = o.charges_infos || {};

  const rawItems: any[] = Array.isArray(o.items) && o.items.length > 0 
    ? o.items 
    : (Array.isArray(calc.items) ? calc.items : []);

  const calcItemsList: any[] = Array.isArray(calc.items) ? calc.items : [];

  const mappedItems: OrderItem[] = rawItems.map((i: any, index: number) => {
    const calcItem = calcItemsList.find(
      (ci: any) =>
        (ci.product_id && (ci.product_id === i.product_id || ci.product_id === i.id)) ||
        (ci.inventoryId && ci.inventoryId === i.product_id)
    ) || (calcItemsList.length > index && !calcItemsList[index].product_id ? calcItemsList[index] : null);

    let itemName =
      i.product_name ||
      i.name ||
      calcItem?.name ||
      i.datas?.product_name ||
      i.additional_infos?.product_name ||
      i.additional_infos?.name ||
      (i.product_id ? `Item ${String(i.product_id).slice(-4)}` : `Item ${index + 1}`);

    const rawVar =
      i.variant_infos?.variant_name ||
      i.variant_info?.variant_name ||
      i.variant_name ||
      calcItem?.variant_name;
    const cleanVar = cleanVariantText(
      typeof rawVar === "object" ? (rawVar?.variant_name || rawVar?.name) : rawVar
    );
    if (cleanVar && !itemName.toLowerCase().includes(cleanVar.toLowerCase())) {
      itemName += ` (${cleanVar})`;
    }

    const qty = Number(i.quantity ?? i.qty ?? calcItem?.qty ?? i.entered_qty ?? 1) || 1;
    const price = Number(i.sell_price ?? i.unit_price ?? i.price ?? calcItem?.price ?? 0);
    const lineTotal = Number(
      i.total_amount ??
      i.line_total ??
      calcItem?.final_inclusive ??
      calcItem?.taxable_value ??
      (price * qty)
    );

    let gstRate = 0;
    if (calcItem?.gst_rate !== undefined && !isNaN(Number(calcItem.gst_rate))) {
      gstRate = Number(calcItem.gst_rate);
    } else if (i.gstRate !== undefined && !isNaN(Number(i.gstRate))) {
      gstRate = Number(i.gstRate);
    } else if (i.gst !== undefined && i.gst !== null) {
      if (typeof i.gst === "number") {
        gstRate = i.gst <= 1 && i.gst > 0 ? Number((i.gst * 100).toFixed(2)) : i.gst;
      } else if (typeof i.gst === "string") {
        const parsed = parseFloat(i.gst.replace("%", "").trim());
        gstRate = isNaN(parsed) ? 0 : parsed;
      }
    }

    let gstAmount = 0;
    if (calcItem?.gst_amount !== undefined && !isNaN(Number(calcItem.gst_amount))) {
      gstAmount = Number(calcItem.gst_amount);
    } else if (i.gst_amount !== undefined && !isNaN(Number(i.gst_amount))) {
      gstAmount = Number(i.gst_amount);
    } else if (gstRate > 0) {
      const taxable = lineTotal / (1 + gstRate / 100);
      gstAmount = lineTotal - taxable;
    }

    const gstLabel = gstRate > 0 ? `${gstRate}%` : (i.gst ? String(i.gst) : "0%");

    const baseItemPrice = i.taxable_price !== undefined && !isNaN(Number(i.taxable_price))
      ? Number(i.taxable_price)
      : (gstAmount > 0 ? Math.max(0, (lineTotal - gstAmount) / qty) : price);

    return {
      name: cleanVariantText(itemName),
      variant: cleanVar || undefined,
      qty,
      price: Number(baseItemPrice.toFixed(2)),
      inclusivePrice: Number(price.toFixed(2)),
      total: Number(lineTotal.toFixed(2)),
      gst: gstLabel,
      gstRate,
      gstAmount: Number(gstAmount.toFixed(2)),
    };
  });

  const sumItemsGst = mappedItems.reduce((acc, it) => acc + (it.gstAmount || 0), 0);
  const rawGstAmount =
    calc.gst_amount ??
    itemInfos.total_order_gst_amount ??
    calc.total_tax ??
    calc.tax_amount ??
    addInfos.gst_amount ??
    charges.gst_amount ??
    (sumItemsGst > 0 ? sumItemsGst : 0);

  const gstAmount = Number(Number(rawGstAmount || 0).toFixed(2));

  const positiveRates = Array.from(new Set(mappedItems.map((it) => it.gstRate).filter((r): r is number => Boolean(r && r > 0))));
  let gstPercentLabel = "";
  if (calc.tax_groups && typeof calc.tax_groups === "object" && Object.keys(calc.tax_groups).length > 0) {
    gstPercentLabel = Object.keys(calc.tax_groups).map((k) => `${k}%`).join(", ");
  } else if (positiveRates.length > 0) {
    gstPercentLabel = positiveRates.map((r) => `${r}%`).join(", ");
  } else if (calc.tax_rate) {
    gstPercentLabel = `${calc.tax_rate}%`;
  }

  const cgst = calc.cgst !== undefined ? Number(calc.cgst) : Number((gstAmount / 2).toFixed(2));
  const sgst = calc.sgst !== undefined ? Number(calc.sgst) : Number((gstAmount / 2).toFixed(2));

  const deliveryCharge = Number(
    (charges.delivery_charge ??
      charges.delivery_charges ??
      charges.delivery_fee ??
      charges.shipping_charge ??
      addInfos.delivery_charge ??
      0)
  );

  const discount = Number(
    (calc.discount_amount ??
      calc.total_discount_given ??
      calc.discount ??
      charges.discount ??
      addInfos.discount_amount ??
      0)
  );

  const itemsSum = mappedItems.reduce((acc, it) => acc + it.total, 0);
  const totalGst = mappedItems.reduce((acc, it) => acc + (it.gstAmount || 0), 0);
  const effectiveGst = gstAmount > 0 ? gstAmount : totalGst;

  let rawSubtotal = calc.taxable_amount ?? calc.base_subtotal;
  if (rawSubtotal === undefined || rawSubtotal === null) {
    const rawItemsVal = itemInfos.total_order_amount ?? (itemsSum > 0 ? itemsSum : (o.total_amount ?? o.total_sellprice ?? cardShape.totalAmount ?? 0));
    rawSubtotal = Math.max(0, Number(rawItemsVal) - effectiveGst);
  }
  const subtotal = Number(Number(rawSubtotal).toFixed(2));

  const grandTotal = Number((subtotal + effectiveGst + deliveryCharge - discount).toFixed(2));

  return {
    ...cardShape,
    orderType: o.origin || cardShape.origin || "ONLINE",
    items: mappedItems,
    subtotal: isNaN(subtotal) ? 0 : subtotal,
    gstPercent: positiveRates[0] || 0,
    gstPercentLabel,
    gstAmount: isNaN(gstAmount) ? 0 : gstAmount,
    cgst: isNaN(cgst) ? 0 : cgst,
    sgst: isNaN(sgst) ? 0 : sgst,
    deliveryCharge: isNaN(deliveryCharge) ? 0 : deliveryCharge,
    discount: isNaN(discount) ? 0 : discount,
    grandTotal: isNaN(grandTotal) ? 0 : grandTotal,
    online_details:
      (o.online_details && Object.keys(o.online_details).length > 0)
        ? o.online_details
        : cardShape.online_details,
    status_updated_by: o.status_updated_by || addInfos.status_updated_by || addInfos.accepted_by || addInfos.canceled_by || addInfos.rejected_by || cardShape.status_updated_by || null,
  };
};

