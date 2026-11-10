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
