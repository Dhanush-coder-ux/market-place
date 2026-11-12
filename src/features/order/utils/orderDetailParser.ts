import type { OrderRecord } from "@/types/api";
import type { OrderDetailType, OrderItem } from "../components/OrdersDetailView";
import { cleanVariantText } from "../components/OrdersDetailView";

export const RETURN_DISALLOWED_STATUSES = new Set([
  "CANCELED",
  "CANCELLED",
  "REFUNDED",
  "REJECTED",
]);

export const isReturnDisallowedStatus = (status?: string | null): boolean =>
  RETURN_DISALLOWED_STATUSES.has(String(status || "").trim().toUpperCase());

export const resolveCancelledInfo = (o: any, addObj: any) => {
  const status = String(o?.status || "").trim().toUpperCase();
  if (!["CANCELED", "CANCELLED", "REFUNDED", "REJECTED"].includes(status)) {
    return {
      cancelled_by: null,
      cancelled_by_source: null,
      cancelled_by_user: null,
    };
  }

  const add = addObj && typeof addObj === "object" ? addObj : {};
  const history: any[] = Array.isArray(add.status_history) ? add.status_history : [];
  const cancelEntry = [...history]
    .reverse()
    .find((h) => ["CANCELED", "CANCELLED", "REJECTED"].includes(String(h?.to_status || "").toUpperCase()));

  const rawSource = String(
    add.cancelled_by_source ||
      add.canceled_by_source ||
      cancelEntry?.cancelled_by_source ||
      ""
  )
    .trim()
    .toUpperCase();

  const rawActor = String(
    add.cancelled_by ||
      add.cancelled_by_label ||
      cancelEntry?.cancelled_by ||
      cancelEntry?.cancelled_by_label ||
      ""
  )
    .trim()
    .toUpperCase();

  const rawUser =
    add.cancelled_by_user ||
    add.canceled_by ||
    cancelEntry?.updated_by ||
    o?.status_updated_by ||
    add.status_updated_by ||
    null;

  if (
    rawSource.includes("DIGITAL") ||
    rawSource.includes("CUSTOMER") ||
    rawActor === "CUSTOMER" ||
    rawActor === "CANCELLED BY CUSTOMER"
  ) {
    return {
      cancelled_by: "Customer",
      cancelled_by_source: "DIGITAL_STORE",
      cancelled_by_user: rawUser,
    };
  }

  if (
    rawSource.includes("INVENTQ") ||
    rawActor.includes("INVENTQ")
  ) {
    return {
      cancelled_by: "InventQ (Manual)",
      cancelled_by_source: "INVENTQ",
      cancelled_by_user: rawUser,
    };
  }

  return {
    cancelled_by: rawUser ? `InventQ (Manual)` : null,
    cancelled_by_source: rawUser ? "INVENTQ" : null,
    cancelled_by_user: rawUser,
  };
};

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

  const rawReturns: any[] = Array.isArray(anyOrder.returns) ? anyOrder.returns : [];
  const rawReturnRequests: any[] = Array.isArray(anyOrder.return_requests) ? anyOrder.return_requests : [];
  const rawOrderItems: any[] = Array.isArray(anyOrder.items) ? anyOrder.items : [];
  const normalizedStatus = (o.status ?? "PENDING").toUpperCase();
  const acceptedReturnStatuses = new Set(["ACCEPTED", "APPROVED", "COMPLETED", "RETURNED"]);
  const hasAcceptedReturnReq = rawReturnRequests.some((rr: any) =>
    acceptedReturnStatuses.has(String(rr?.status || "").toUpperCase())
  );
  const hasItemReturn = rawOrderItems.some((it: any) =>
    Number(it?.returned_quantity || 0) > 0 ||
    ["RETURNED", "REFUNDED"].includes(String(it?.status || "").toUpperCase()) ||
    (Array.isArray(it?.returns) && it.returns.length > 0)
  );
  const hasReturn =
    normalizedStatus === "RETURNED" ||
    normalizedStatus === "REFUNDED" ||
    rawReturns.length > 0 ||
    hasAcceptedReturnReq ||
    hasItemReturn;

  let isPartiallyReturned = false;
  if (hasReturn && normalizedStatus !== "RETURNED" && normalizedStatus !== "REFUNDED" && rawOrderItems.length > 0) {
    const reqReturnedByProduct: Record<string, number> = {};
    for (const rr of rawReturnRequests) {
      if (!acceptedReturnStatuses.has(String(rr?.status || "").toUpperCase())) continue;
      for (const rItem of (Array.isArray(rr?.items) ? rr.items : [])) {
        const key = String(rItem?.order_item_id || rItem?.product_id || rItem?.product_name || "").toLowerCase();
        if (key) reqReturnedByProduct[key] = (reqReturnedByProduct[key] || 0) + (Number(rItem?.quantity || 0) || 0);
      }
    }
    const allItemsFullyReturned = rawOrderItems.every((it: any) => {
      const q = Number(it?.quantity ?? it?.qty ?? 1) || 1;
      const itemStatus = String(it?.status || "").toUpperCase();
      if (itemStatus === "RETURNED" || itemStatus === "REFUNDED") return true;
      const directRet = Number(it?.returned_quantity || 0);
      const reqRet =
        (it?.id ? reqReturnedByProduct[String(it.id).toLowerCase()] : 0) ||
        (it?.product_id ? reqReturnedByProduct[String(it.product_id).toLowerCase()] : 0) ||
        (it?.product_name ? reqReturnedByProduct[String(it.product_name).toLowerCase()] : 0) ||
        0;
      return Math.max(directRet, reqRet) >= q;
    });
    isPartiallyReturned = !allItemsFullyReturned;
  }

  return {
    id: o.id,
    billNo: o.ui_id || o.id,
    customerName: name,
    phone: phone,
    totalAmount: isNaN(totalAmount) ? 0 : totalAmount,
    status: normalizedStatus,
    origin: (o.origin || "ONLINE").toUpperCase(),
    deliveryCode: anyOrder.delivery_code || onlineObj.delivery_code || addObj.delivery_code || null,
    online_details: Object.keys(onlineObj).length > 0 ? onlineObj : (addObj.user_id || addObj.full_address || addObj.address_id ? addObj : {}),
    status_updated_by: o.status_updated_by || addObj.status_updated_by || addObj.accepted_by || addObj.canceled_by || addObj.rejected_by || addObj.last_action_by || null,
    ...resolveCancelledInfo(o, addObj),
    status_history: addObj.status_history || [],
    additional_infos: addObj,
    returns: rawReturns,
    return_requests: rawReturnRequests,
    hasReturn,
    isPartiallyReturned,
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
  const rawReturnsList: any[] = Array.isArray(o.returns)
    ? o.returns
    : (Array.isArray((cardShape as any).returns) ? (cardShape as any).returns : []);
  const rawReturnRequestsList: any[] = Array.isArray(o.return_requests)
    ? o.return_requests
    : (Array.isArray((cardShape as any).return_requests) ? (cardShape as any).return_requests : []);
  const acceptedReturnStatuses = new Set(["ACCEPTED", "APPROVED", "COMPLETED", "RETURNED"]);
  const reqReturnedByItemKey: Record<string, number> = {};
  for (const rr of rawReturnRequestsList) {
    if (!acceptedReturnStatuses.has(String(rr?.status || "").toUpperCase())) continue;
    for (const rItem of (Array.isArray(rr?.items) ? rr.items : [])) {
      const qtyVal = Number(rItem?.quantity || 0) || 0;
      if (rItem?.order_item_id) {
        const k = `id:${String(rItem.order_item_id).toLowerCase()}`;
        reqReturnedByItemKey[k] = (reqReturnedByItemKey[k] || 0) + qtyVal;
      }
      if (rItem?.product_id) {
        const k = `prod:${String(rItem.product_id).toLowerCase()}`;
        reqReturnedByItemKey[k] = (reqReturnedByItemKey[k] || 0) + qtyVal;
      }
      if (rItem?.product_name) {
        const k = `name:${String(rItem.product_name).trim().toLowerCase()}`;
        reqReturnedByItemKey[k] = (reqReturnedByItemKey[k] || 0) + qtyVal;
      }
    }
  }

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

    const itemStatus = String(i.status || "").toUpperCase();
    const directReturnedQty = Number(i.returned_quantity || 0) || 0;
    const reqReturnedQty =
      (i.id ? reqReturnedByItemKey[`id:${String(i.id).toLowerCase()}`] : undefined) ??
      (i.product_id ? reqReturnedByItemKey[`prod:${String(i.product_id).toLowerCase()}`] : undefined) ??
      reqReturnedByItemKey[`name:${cleanVariantText(itemName).toLowerCase()}`] ??
      0;
    const returnedQty = Math.max(directReturnedQty, reqReturnedQty);
    const isItemReturned =
      returnedQty > 0 ||
      itemStatus === "RETURNED" ||
      itemStatus === "REFUNDED" ||
      (Array.isArray(i.returns) && i.returns.length > 0);

    const rawSerials = Array.isArray(i.serialno_infos)
      ? i.serialno_infos
      : Array.isArray(i.serial_numbers)
        ? i.serial_numbers
        : [];
    const serialNumbers = rawSerials
      .map((s: any) => (typeof s === "string" ? s : s?.name || s?.serial_no || s?.serial || s?.id))
      .filter((val: any): val is string => Boolean(val && String(val).trim()))
      .map((val: string) => String(val).trim());

    return {
      id: i.id,
      productId: i.product_id,
      variantId: i.variant_id || undefined,
      batchId: i.batch_id || undefined,
      name: cleanVariantText(itemName),
      variant: cleanVar || undefined,
      serialNumbers: serialNumbers.length > 0 ? serialNumbers : undefined,
      qty,
      price: Number(baseItemPrice.toFixed(2)),
      inclusivePrice: Number(price.toFixed(2)),
      total: Number(lineTotal.toFixed(2)),
      gst: gstLabel,
      gstRate,
      gstAmount: Number(gstAmount.toFixed(2)),
      returnedQuantity: returnedQty > 0 ? returnedQty : undefined,
      status: itemStatus || undefined,
      isReturned: isItemReturned,
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
  const positiveTaxGroupRates =
    calc.tax_groups && typeof calc.tax_groups === "object"
      ? Object.keys(calc.tax_groups)
          .map((k) => Number(k))
          .filter((n) => !isNaN(n) && n > 0)
      : [];

  let gstPercentLabel = "";
  if (positiveTaxGroupRates.length > 0) {
    gstPercentLabel = positiveTaxGroupRates.map((r) => `${r}%`).join(", ");
  } else if (positiveRates.length > 0) {
    gstPercentLabel = positiveRates.map((r) => `${r}%`).join(", ");
  } else if (Number(calc.tax_rate) > 0) {
    gstPercentLabel = `${Number(calc.tax_rate)}%`;
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

  const orderHasReturn =
    Boolean((cardShape as any).hasReturn) ||
    rawReturnsList.length > 0 ||
    mappedItems.some((it) => Boolean(it.isReturned)) ||
    rawReturnRequestsList.some((rr: any) =>
      acceptedReturnStatuses.has(String(rr?.status || "").toUpperCase())
    );
  const orderIsPartiallyReturned =
    orderHasReturn &&
    cardShape.status !== "RETURNED" &&
    cardShape.status !== "REFUNDED" &&
    mappedItems.length > 0 &&
    !mappedItems.every((it) => it.isReturned && (it.returnedQuantity || it.qty) >= it.qty);

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
    returns: rawReturnsList,
    return_requests: rawReturnRequestsList,
    hasReturn: orderHasReturn,
    isPartiallyReturned: orderIsPartiallyReturned,
    online_details:
      (o.online_details && Object.keys(o.online_details).length > 0)
        ? o.online_details
        : cardShape.online_details,
    status_updated_by: o.status_updated_by || addInfos.status_updated_by || addInfos.accepted_by || addInfos.canceled_by || addInfos.rejected_by || cardShape.status_updated_by || null,
    ...resolveCancelledInfo(o, addInfos),
  };
};

