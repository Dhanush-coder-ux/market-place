export interface ExtractedCustomerInfo {
  name: string;
  phone: string;
  email: string;
  fullAddress: string;
  city: string;
  state: string;
  pincode: string;
  userId: string;
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
      addressId: "",
      isOnline: false,
      isWalkIn: true,
    };
  }

  const onlineDetails = sale.online_details || {};
  const custObj = sale.customer || {};
  const addObj = sale.additional_infos || {};
  const dataObj = sale.datas || {};

  const custEntry = sale.customer_id && customerMap ? customerMap[sale.customer_id] : null;
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
    sale.customer_display_name ||
    onlineDetails.name ||
    onlineDetails.customer_name ||
    custObj.customer_name ||
    custObj.name ||
    sale.customer_name ||
    sale.user_name ||
    addObj.customer_name ||
    addObj.name ||
    dataObj.customer_name ||
    dataObj.name ||
    custMapName ||
    "";

  const isWalkIn =
    !rawName ||
    rawName.trim().toLowerCase() === "walk in customer" ||
    rawName.trim().toLowerCase() === "walk-in customer";

  const name = isWalkIn
    ? (sale.customer_id ? (custMapName || sale.customer_id) : "Walk-in Customer")
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

  const userId = onlineDetails.user_id || sale.user_id || sale.customer_id || "";
  const addressId = onlineDetails.address_id || "";

  return {
    name,
    phone: String(phone || "").trim(),
    email: String(email || "").trim(),
    fullAddress: String(fullAddress || "").trim(),
    city: String(city || "").trim(),
    state: String(state || "").trim(),
    pincode: String(pincode || "").trim(),
    userId: String(userId || "").trim(),
    addressId: String(addressId || "").trim(),
    isOnline,
    isWalkIn: name === "Walk-in Customer",
  };
}
