export interface ExtractedCustomerInfo {
  name: string;
  phone: string;
  email: string;
  fullAddress: string;
  city: string;
  state: string;
  pincode: string;
  userId: string;
  uiId: string;
  customerUiId: string;
  addressId: string;
  isOnline: boolean;
  isWalkIn: boolean;
}

export function extractSaleCustomerInfo(
  sale: any,
  customerMap?: Record<string, any>
): ExtractedCustomerInfo {
  if (!sale) {
    return {
      name: "Walk-in Customer",
      phone: "",
      email: "",
      fullAddress: "",
      city: "",
      state: "",
      pincode: "",
      userId: "",
      uiId: "",
      customerUiId: "",
      addressId: "",
      isOnline: false,
      isWalkIn: true,
    };
  }

  const onlineDetails = sale.online_details || {};
  const custObj = sale.customer || {};
  const addObj = sale.additional_infos || {};
  const dataObj = sale.datas || {};

  const cid = sale.customer_id || custObj.customer_id || custObj.id;
  const directName = sale.customer_name || sale.customer_display_name || custObj.name || custObj.customer_name || onlineDetails.name || onlineDetails.customer_name;

  let custEntry = cid && customerMap ? (customerMap[cid] || customerMap[String(cid).toLowerCase()]) : null;
  if (!custEntry && directName && customerMap) {
    const key = String(directName).trim().toLowerCase();
    custEntry = customerMap[key] || customerMap[String(directName).trim()];
    if (!custEntry) {
      const foundVal = Object.values(customerMap).find((c: any) =>
        c && typeof c === 'object' && (
          (c.name && String(c.name).trim().toLowerCase() === key) ||
          (c.customer_name && String(c.customer_name).trim().toLowerCase() === key) ||
          (c.id && String(c.id) === String(cid))
        )
      );
      if (foundVal) custEntry = foundVal;
    }
  }

  const custMapName = typeof custEntry === "string" ? custEntry : custEntry?.name || custEntry?.customer_name;
  const custMapPhone = typeof custEntry === "object" ? custEntry?.mobile_number || custEntry?.phone || custEntry?.customer_mobile_number : undefined;
  const custMapEmail = typeof custEntry === "object" ? custEntry?.email : undefined;
  const custMapAddress = typeof custEntry === "object" ? custEntry?.address : undefined;
  const custMapCity = typeof custEntry === "object" ? custEntry?.city : undefined;
  const custMapState = typeof custEntry === "object" ? custEntry?.state : undefined;
  const custMapPincode = typeof custEntry === "object" ? custEntry?.pincode : undefined;

  const isOnline =
    sale.origin === "Online" ||
    sale.origin === "ONLINE" ||
    sale.origin === "Online Sales" ||
    Boolean(sale.online_details);

  const rawName =
    sale.customer_name ||
    sale.customer_display_name ||
    custObj.name ||
    custObj.customer_name ||
    onlineDetails.name ||
    onlineDetails.customer_name ||
    sale.user_name ||
    addObj.customer_name ||
    addObj.name ||
    dataObj.customer_name ||
    dataObj.name ||
    custMapName ||
    "";

  const isUuid = (val: any): boolean =>
    typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

  const rawUiId =
    (custEntry && typeof custEntry === "object" ? (custEntry.ui_id || custEntry.customer_ui_id) : "") ||
    sale.customer_ui_id ||
    custObj.ui_id ||
    custObj.customer_ui_id ||
    onlineDetails.customer_ui_id ||
    onlineDetails.ui_id ||
    addObj.customer_ui_id ||
    dataObj.customer_ui_id ||
    "";

  // Only consider it a valid customer UI ID if non-empty and NOT a raw internal UUID
  const cleanUiId = (rawUiId && !isUuid(rawUiId)) ? String(rawUiId).trim() : "";

  const isWalkIn =
    !rawName ||
    rawName.trim().toLowerCase() === "walk in customer" ||
    rawName.trim().toLowerCase() === "walk-in customer";

  const name = isWalkIn
    ? (custMapName || (cleanUiId ? `Customer ${cleanUiId}` : "Walk-in Customer"))
    : rawName.trim();

  const phone =
    onlineDetails.phone ||
    onlineDetails.mobile ||
    onlineDetails.mobile_number ||
    onlineDetails.customer_phone ||
    custObj.customer_mobile_number ||
    custObj.mobile_number ||
    custObj.phone ||
    sale.customer_mobile_number ||
    sale.customer_phone ||
    sale.customer_number ||
    addObj.customer_phone ||
    addObj.phone ||
    dataObj.phone ||
    custMapPhone ||
    "";

  const email =
    onlineDetails.email ||
    custObj.email ||
    sale.customer_email ||
    sale.user_email ||
    addObj.customer_email ||
    addObj.email ||
    custMapEmail ||
    "";

  const fullAddress =
    onlineDetails.full_address ||
    onlineDetails.address ||
    custObj.address ||
    addObj.address ||
    custMapAddress ||
    "";

  const city = onlineDetails.city || custObj.city || custMapCity || "";
  const state = onlineDetails.state || custObj.state || custMapState || "";
  const pincode = onlineDetails.pincode || custObj.pincode || custMapPincode || "";

  const addressId = onlineDetails.address_id || "";

  return {
    name,
    phone: String(phone || "").trim(),
    email: String(email || "").trim(),
    fullAddress: String(fullAddress || "").trim(),
    city: String(city || "").trim(),
    state: String(state || "").trim(),
    pincode: String(pincode || "").trim(),
    userId: cleanUiId, // Only provide human-readable UI ID, never a raw internal UUID
    uiId: cleanUiId,
    customerUiId: cleanUiId,
    addressId: String(addressId || "").trim(),
    isOnline,
    isWalkIn: name === "Walk-in Customer" || (!rawName && !cleanUiId),
  };
}

/* ═══════════════════════════════════════════════════════════════
   UNIT & QUANTITY DISPLAY HELPERS
═══════════════════════════════════════════════════════════════ */

export function formatUnitName(rawUnit?: string): string {
  if (!rawUnit) return "pcs";
  const trimmed = String(rawUnit).trim();
  const lower = trimmed.toLowerCase();

  if (!lower || lower === "unit" || lower === "units" || lower === "none" || lower === "null" || lower === "undefined") {
    return "pcs";
  }

  if (lower === "kilogram" || lower === "kilograms" || lower === "kg" || lower === "kgs") {
    return "kg";
  }
  if (lower === "gram" || lower === "grams" || lower === "gm" || lower === "gms" || lower === "g") {
    return "g";
  }
  if (lower === "milligram" || lower === "milligrams" || lower === "mg") {
    return "mg";
  }
  if (lower === "milliliter" || lower === "millilitre" || lower === "milliliters" || lower === "millilitres" || lower === "ml") {
    return "ml";
  }
  if (lower === "liter" || lower === "litre" || lower === "liters" || lower === "litres" || lower === "l" || lower === "ltr") {
    return "L";
  }
  if (lower === "piece" || lower === "pieces" || lower === "pc" || lower === "pcs") {
    return "pcs";
  }
  if (lower === "box" || lower === "boxes") {
    return "box";
  }
  if (lower === "bottle" || lower === "bottles") {
    return "bottle";
  }
  if (lower === "bag" || lower === "bags") {
    return "bag";
  }
  if (lower === "can" || lower === "cans") {
    return "can";
  }
  if (lower === "packet" || lower === "packets" || lower === "pkt" || lower === "pkts") {
    return "pkt";
  }
  if (lower === "carton" || lower === "cartons") {
    return "ctn";
  }
  return lower;
}

export function formatQtyNumber(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === "") return "0";
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return Number(n.toFixed(2)).toString();
}

export function getItemQtyAndUnit(item: any, calcItem?: any): {
  qty: number;
  qtyStr: string;
  unit: string;
  name: string;
  formatted: string;
} {
  if (!item) {
    return { qty: 1, qtyStr: "1", unit: "pcs", name: "Item", formatted: "1 pcs" };
  }
  const calc = calcItem || {};
  const rawUnit =
    item.entered_unit ||
    calc.entered_unit ||
    calc.unit ||
    item.selectedUnit ||
    item.unit ||
    item.unit_name ||
    item.unit_infos?.name ||
    item.unit_info?.name ||
    item.uom ||
    item.packaging_unit ||
    item.package_type ||
    item.unitType ||
    item.product?.unit ||
    item.product_details?.unit ||
    item.datas?.unit ||
    item.datas?.unit_name ||
    "";

  const unit = formatUnitName(rawUnit);
  const enteredUnit = String(item.entered_unit || calc.entered_unit || "").trim().toLowerCase();
  const baseUnit = String(item.unit || item.unit_name || item.unit_infos?.name || "").trim().toLowerCase();

  const enteredQty = (item.entered_qty !== undefined && item.entered_qty !== null && !isNaN(Number(item.entered_qty)))
    ? Number(item.entered_qty)
    : (calc.entered_qty !== undefined && calc.entered_qty !== null && !isNaN(Number(calc.entered_qty)))
      ? Number(calc.entered_qty)
      : NaN;

  let baseQty = Number(item.quantity ?? item.qty ?? calc.qty ?? 0);
  if (isNaN(baseQty) || baseQty <= 0) {
    baseQty = !isNaN(enteredQty) && enteredQty > 0 ? enteredQty : 1;
  }

  // Derive quantity matching the unit
  let resolvedQty = baseQty;
  const isSubUnit = Boolean(enteredUnit && baseUnit && enteredUnit !== baseUnit);

  if (isSubUnit) {
    const isGramOrMl = ['gm', 'g', 'gram', 'grams', 'ml', 'milli', 'milliliter', 'millilitre', 'milliliters', 'mg', 'milligram', 'milligrams'].includes(enteredUnit);
    if (!isNaN(enteredQty) && enteredQty > 0) {
      if (isGramOrMl && enteredQty <= 5 && baseQty > 0 && baseQty <= 5) {
        resolvedQty = baseQty * 1000;
      } else {
        resolvedQty = enteredQty;
      }
    } else if (isGramOrMl && baseQty > 0 && baseQty < 100) {
      resolvedQty = baseQty * 1000;
    }
  } else if (!isNaN(enteredQty) && enteredQty > 0) {
    if (enteredQty > baseQty && Math.abs(enteredQty - baseQty) > 0.001) {
      resolvedQty = enteredQty;
    } else {
      resolvedQty = baseQty > 0 ? baseQty : enteredQty;
    }
  }

  const qtyStr = formatQtyNumber(resolvedQty);
  const name = item.name || item.product_name || calc.name || item.datas?.name || item.datas?.product_name || "Item";

  return {
    qty: resolvedQty,
    qtyStr,
    unit,
    name,
    formatted: `${qtyStr} ${unit}`,
  };
}

export interface SaleQuantityDisplay {
  primaryText: string;
  subText?: string;
  tooltipText: string;
  isMultiple: boolean;
  totalQty: number;
}

export function getSaleQuantityDisplay(sale: any): SaleQuantityDisplay {
  if (!sale) {
    return {
      primaryText: "0 pcs",
      tooltipText: "0 pcs",
      isMultiple: false,
      totalQty: 0,
    };
  }

  const rawItems = Array.isArray(sale.items) && sale.items.length > 0
    ? sale.items
    : (Array.isArray(sale.calculation_infos?.items) && sale.calculation_infos.items.length > 0)
      ? sale.calculation_infos.items
      : (Array.isArray(sale.order_items) && sale.order_items.length > 0)
        ? sale.order_items
        : [];

  const calcItems = Array.isArray(sale.calculation_infos?.items) ? sale.calculation_infos.items : [];

  if (rawItems.length === 0) {
    const rawTotalQty = Number(
      sale.total_quantity ||
      sale.item_infos?.total_order_qty ||
      sale.item_infos?.total_order_quantity ||
      sale.calculation_infos?.total_quantity ||
      sale.calculation_infos?.total_qty ||
      1
    );
    const qStr = formatQtyNumber(rawTotalQty);
    return {
      primaryText: `${qStr} pcs`,
      tooltipText: `${qStr} pcs`,
      isMultiple: false,
      totalQty: rawTotalQty,
    };
  }

  const parsedItems = rawItems.map((it: any, idx: number) => {
    const itPid = it.product_id || it.inventory_id || it.id;
    const itName = (it.name || it.product_name || "").trim().toLowerCase();
    const matchedCalc = calcItems.find((ci: any) => {
      const ciPid = ci.product_id || ci.inventory_id || ci.id;
      if (ciPid && itPid && ciPid === itPid) return true;
      const ciName = (ci.name || ci.product_name || "").trim().toLowerCase();
      if (ciName && itName && ciName === itName) return true;
      return false;
    }) || calcItems[idx];

    return getItemQtyAndUnit(it, matchedCalc);
  });

  // Single item
  if (parsedItems.length === 1) {
    const single = parsedItems[0];
    return {
      primaryText: single.formatted,
      tooltipText: `${single.name}: ${single.formatted}`,
      isMultiple: false,
      totalQty: single.qty,
    };
  }

  // Multiple items: Check if all have the exact same unit
  const uniqueUnits = Array.from(new Set(parsedItems.map((p: any) => p.unit)));
  if (uniqueUnits.length === 1) {
    const commonUnit = uniqueUnits[0];
    const totalQty = parsedItems.reduce((acc: number, p: any) => acc + p.qty, 0);
    const qStr = formatQtyNumber(totalQty);
    const tooltip = `${parsedItems.length} items (${qStr} ${commonUnit}):\n` +
      parsedItems.map((p: any) => `• ${p.name}: ${p.formatted}`).join("\n");

    return {
      primaryText: `${qStr} ${commonUnit}`,
      tooltipText: tooltip,
      isMultiple: true,
      totalQty,
    };
  }

  // Multiple items with DIFFERENT units
  const totalCount = parsedItems.length;
  const breakdownShort = parsedItems.slice(0, 2).map((p: any) => p.formatted).join(", ") +
    (totalCount > 2 ? ` (+${totalCount - 2})` : "");
  const fullBreakdown = `${totalCount} items:\n` +
    parsedItems.map((p: any) => `• ${p.name}: ${p.formatted}`).join("\n");

  const totalQty = parsedItems.reduce((acc: number, p: any) => acc + p.qty, 0);

  return {
    primaryText: `${totalCount} items`,
    subText: breakdownShort,
    tooltipText: fullBreakdown,
    isMultiple: true,
    totalQty,
  };
}
