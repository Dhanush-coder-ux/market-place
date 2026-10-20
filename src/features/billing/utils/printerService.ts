import { getGatewayBaseUrl } from "@/services/api/tokenManager";

export type PrinterConnectionType = "system" | "bluetooth" | "usb" | "network";
export type PaperWidth = "58mm" | "80mm";

export interface PrinterConfig {
  connectionType: PrinterConnectionType;
  deviceName?: string;
  deviceId?: string;
  paperWidth: PaperWidth;
  autoCut: boolean;
  openCashDrawer: boolean;
  enableBuzzer?: boolean;
  buzzerBeeps?: number;
  copies: number;
  // Network (LAN / WiFi) settings
  networkIp?: string;
  networkPort?: number;
  networkProtocol?: "raw" | "http";
  // USB / Serial settings
  baudRate?: number;
  usbVendorId?: number;
  usbProductId?: number;
  // Bluetooth settings
  bluetoothServiceUuid?: string;
  bluetoothCharacteristicUuid?: string;
  // Custom Header & Footer text
  headerText?: string;
  footerText?: string;
  showShopGst?: boolean;
  showShopPhone?: boolean;
}

export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
  connectionType: "system",
  deviceName: "System Default Printer",
  paperWidth: "80mm",
  autoCut: true,
  openCashDrawer: false,
  enableBuzzer: true,
  buzzerBeeps: 2,
  copies: 1,
  networkIp: "192.168.1.100",
  networkPort: 9100,
  networkProtocol: "raw",
  baudRate: 9600,
  showShopGst: true,
  showShopPhone: true,
  footerText: "Thank you for shopping with us! Please visit again.",
};

export type PrinterRole = "receipt" | "kitchen" | "label" | "backup";

export interface SavedPrinter extends PrinterConfig {
  id: string;
  name: string;
  role?: PrinterRole;
  isDefault?: boolean;
  createdAt?: string;
}

const STORAGE_KEY = "inventq_printer_config";
const PRINTERS_LIST_KEY = "inventq_printers_list";

/**
 * Get saved printer configuration from localStorage
 */
export function getPrinterConfig(): PrinterConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PRINTER_CONFIG };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PRINTER_CONFIG, ...parsed };
  } catch (err) {
    console.error("Failed to load printer config from localStorage", err);
    return { ...DEFAULT_PRINTER_CONFIG };
  }
}

/**
 * Save printer configuration to localStorage
 */
export function savePrinterConfig(config: PrinterConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    const raw = localStorage.getItem(PRINTERS_LIST_KEY);
    if (raw) {
      const parsed: SavedPrinter[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const updated = parsed.map((p) => (p.isDefault ? { ...p, ...config } : p));
        localStorage.setItem(PRINTERS_LIST_KEY, JSON.stringify(updated));
      }
    }
  } catch (err) {
    console.error("Failed to save printer config to localStorage", err);
  }
}

/**
 * Get all configured printers list
 */
export function getPrintersList(): SavedPrinter[] {
  try {
    const raw = localStorage.getItem(PRINTERS_LIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to load printers list from localStorage", err);
  }

  // Seed with default printer based on current config
  const legacyConfig = getPrinterConfig();
  const initialDefault: SavedPrinter = {
    ...legacyConfig,
    id: "printer-main-default",
    name: legacyConfig.deviceName || "Main Receipt Printer",
    role: "receipt",
    isDefault: true,
    createdAt: new Date().toISOString(),
  };
  savePrintersList([initialDefault]);
  return [initialDefault];
}

/**
 * Save all configured printers list
 */
export function savePrintersList(printers: SavedPrinter[]): void {
  try {
    localStorage.setItem(PRINTERS_LIST_KEY, JSON.stringify(printers));
    // Keep legacy single-config in sync with whichever printer is default
    const def = printers.find((p) => p.isDefault) || printers[0];
    if (def) {
      savePrinterConfig(def);
    }
  } catch (err) {
    console.error("Failed to save printers list to localStorage", err);
  }
}

/**
 * Get the current default printer
 */
export function getDefaultPrinter(): SavedPrinter {
  const list = getPrintersList();
  return list.find((p) => p.isDefault) || list[0];
}

/**
 * Mark a printer as the default receipt printer
 */
export function setDefaultPrinter(id: string): SavedPrinter[] {
  const list = getPrintersList();
  const updated = list.map((p) => ({
    ...p,
    isDefault: p.id === id,
  }));
  savePrintersList(updated);
  return updated;
}

/* ───────────────────────────────────────────────────────────────────────────
   Browser Feature Detection
   ─────────────────────────────────────────────────────────────────────────── */

export function isBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export function isSerialSupported(): boolean {
  return typeof navigator !== "undefined" && "serial" in navigator;
}

export function isUsbSupported(): boolean {
  return typeof navigator !== "undefined" && "usb" in navigator;
}

/* ───────────────────────────────────────────────────────────────────────────
   Active Device Handles (Session scoped)
   ─────────────────────────────────────────────────────────────────────────── */
let activeBluetoothDevice: any = null;
let activeBluetoothServer: any = null;
let activeBluetoothCharacteristic: any = null;
let activeSerialPort: any = null;

export function getActiveBluetoothSession() {
  return {
    device: activeBluetoothDevice,
    server: activeBluetoothServer,
    characteristic: activeBluetoothCharacteristic,
  };
}

// Standard Thermal Printer Bluetooth Service UUIDs (ESC/POS SPP profiles)
const KNOWN_BT_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb", // Common POS SPP
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Mobile POS BLE
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // ISSC Transparent
  "0000e0ff-3c17-d293-8e48-14fe2e4da212", // Custom ESC/POS
  "00001101-0000-1000-8000-00805f9b34fb", // Serial Port Profile (SPP)
];

/**
 * Scan and pair a Bluetooth thermal printer
 */
export async function pairBluetoothPrinter(): Promise<{
  success: boolean;
  deviceName?: string;
  deviceId?: string;
  message: string;
}> {
  if (!isBluetoothSupported()) {
    return {
      success: false,
      message: "Web Bluetooth is not supported in this browser. Please use Google Chrome or Edge over HTTPS/localhost.",
    };
  }

  try {
    const nav = navigator as any;
    const device = await nav.bluetooth.requestDevice({
      filters: [{ services: KNOWN_BT_SERVICES }].concat(
        [{ namePrefix: "POS" }, { namePrefix: "RP" }, { namePrefix: "Thermal" }, { namePrefix: "MPT" }, { namePrefix: "MTP" }] as any
      ),
      optionalServices: KNOWN_BT_SERVICES,
    }).catch(async () => {
      // Fallback: request all devices
      return await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: KNOWN_BT_SERVICES,
      });
    });

    if (!device) {
      return { success: false, message: "No Bluetooth printer was selected." };
    }

    activeBluetoothDevice = device;
    const deviceName = device.name || "Bluetooth Thermal Printer";
    const deviceId = device.id;

    // Connect to GATT Server
    const server = await device.gatt?.connect();
    activeBluetoothServer = server;

    // Find writable characteristic
    let foundChar: any = null;
    const services = await server.getPrimaryServices().catch(() => []);
    for (const service of services) {
      const chars = await service.getCharacteristics().catch(() => []);
      for (const char of chars) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          foundChar = char;
          break;
        }
      }
      if (foundChar) break;
    }

    if (foundChar) {
      activeBluetoothCharacteristic = foundChar;
    }

    return {
      success: true,
      deviceName,
      deviceId,
      message: `Successfully paired with ${deviceName}`,
    };
  } catch (err: any) {
    console.error("Bluetooth pairing error:", err);
    return {
      success: false,
      message: err.message || "Failed to pair Bluetooth printer.",
    };
  }
}

/**
 * Connect to USB / Serial Thermal Printer
 */
export async function pairUsbSerialPrinter(baudRate = 9600): Promise<{
  success: boolean;
  deviceName?: string;
  message: string;
}> {
  const nav = navigator as any;

  if (isSerialSupported()) {
    try {
      const port = await nav.serial.requestPort();
      if (!port) {
        return { success: false, message: "No USB/Serial port was selected." };
      }

      await port.open({ baudRate });
      activeSerialPort = port;
      const info = port.getInfo ? port.getInfo() : {};
      const devName = info.usbVendorId
        ? `USB Serial (VID: ${info.usbVendorId.toString(16).padStart(4, "0")}, PID: ${(info.usbProductId || 0).toString(16).padStart(4, "0")})`
        : `Serial Port (${baudRate} baud)`;

      return {
        success: true,
        deviceName: devName,
        message: `Connected to ${devName}`,
      };
    } catch (err: any) {
      console.error("Serial connection error:", err);
      return {
        success: false,
        message: err.message || "Failed to connect to USB/Serial port.",
      };
    }
  } else if (isUsbSupported()) {
    try {
      const device = await nav.usb.requestDevice({ filters: [] });
      if (!device) {
        return { success: false, message: "No USB printer was selected." };
      }
      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);

      const devName = device.productName || `USB Thermal Printer (${device.vendorId})`;
      return {
        success: true,
        deviceName: devName,
        message: `Connected to ${devName}`,
      };
    } catch (err: any) {
      console.error("USB connection error:", err);
      return {
        success: false,
        message: err.message || "Failed to connect to USB printer.",
      };
    }
  }

  return {
    success: false,
    message: "Web Serial / Web USB is not supported in this browser. Please use Chrome/Edge or use System Printer Driver.",
  };
}

/**
 * Parse host and port with sanitization (e.g. extracts virtual-printer.online, cleans accidental prefixes)
 */
export function parseHostAndPort(rawHost?: string, rawPort = 9100): { host: string; port: number } {
  let host = (rawHost || "192.168.1.100").trim();
  // Strip protocol
  host = host.replace(/^https?:\/\//i, "").trim();
  // Strip path
  if (host.includes("/")) {
    host = host.split("/")[0].trim();
  }
  // Check if accidental concatenation occurred like "192.168.1virtual-printer.online.100"
  if (host.includes("virtual-printer.online")) {
    host = "virtual-printer.online";
  }
  let port = rawPort;
  if (host.includes(":")) {
    const parts = host.split(":");
    host = parts[0].trim();
    const p = parseInt(parts[1], 10);
    if (!isNaN(p) && p > 0) port = p;
  }
  return { host, port };
}

/**
 * Test Network (WiFi / LAN) Printer
 */
export async function testNetworkPrinter(
  rawHost: string,
  rawPort = 9100
): Promise<{ success: boolean; message: string }> {
  if (!rawHost || !rawHost.trim()) {
    return { success: false, message: "Please provide a valid IP address or hostname." };
  }

  const { host, port } = parseHostAndPort(rawHost, rawPort);
  const gatewayBase = getGatewayBaseUrl();

  try {
    const resp = await fetch(`${gatewayBase}/printer/network-ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host, port, timeout: 3.5 }),
    });

    if (resp.ok) {
      const json = await resp.json();
      return {
        success: Boolean(json.success),
        message: json.message || (json.success ? "Printer is reachable" : "Printer unreachable"),
      };
    }
  } catch (err: any) {
    console.warn("Gateway network-ping fetch failed:", err);
  }

  return {
    success: false,
    message: `Could not reach network printer at ${host}:${port}. Verify printer power and network status.`,
  };
}

/* ───────────────────────────────────────────────────────────────────────────
   ESC/POS Command Builder for Thermal Receipts
   ─────────────────────────────────────────────────────────────────────────── */

export interface ReceiptData {
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopGst?: string;
  orderId?: string;
  customerName?: string;
  phone?: string;
  dateStr?: string;
  timeStr?: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    tprice?: number;
    selectedUnit?: string;
    discount?: number;
  }>;
  totalAmount: number;
  discountAmount?: number;
  taxableAmount?: number;
  gstAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  cgstRate?: number;
  sgstRate?: number;
  gstRate?: number;
  roundOff?: number;
  finalAmount: number;
  totalUnits?: number;
  isDuplicate?: boolean;
  invoiceTypeTag?: string;
  payments?: Array<{ mode: string; amount: number; tendered?: number }>;
  footerNote?: string;
  reprintTimestamp?: string;
}

/**
 * Sanitize address object or string so '[object Object]' or 'Not specified' never appears on receipts
 */
export function cleanShopAddress(addr: any): string | null {
  if (!addr) return null;
  let str = "";
  if (typeof addr === "string") {
    str = addr.trim();
  } else if (typeof addr === "object") {
    const parts = [
      addr.full_address,
      addr.address_line_1,
      addr.address_line_2,
      addr.street,
      addr.landmark,
      addr.city,
      addr.state,
      addr.pincode || addr.pin_code || addr.postal_code,
    ].filter((p) => p && typeof p === "string" && p.trim().toLowerCase() !== "not specified");
    str = parts.join(", ");
  }
  if (!str) return null;
  const lower = str.toLowerCase();
  if (
    lower === "not specified" ||
    lower === "undefined" ||
    lower === "null" ||
    lower === "[object object]" ||
    str === "{}"
  ) {
    return null;
  }
  return str;
}

/**
 * Convert Unicode special characters to universal ESC/POS ASCII equivalents
 */
export function toAsciiReceiptText(text: string): string {
  if (!text) return "";
  return text
    .replace(/₹/g, "Rs.")
    .replace(/[•●▪]/g, "-")
    .replace(/[★☆*]/g, "*")
    .replace(/[–—−]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...");
}

/**
 * Build binary ESC/POS buffer for direct thermal printing
 */
export function buildEscPosBuffer(data: ReceiptData, config: PrinterConfig): Uint8Array {
  const is58mm = config.paperWidth === "58mm";
  const colWidth = is58mm ? 32 : 42;
  const bytes: number[] = [];

  const addStr = (str: string) => {
    const clean = toAsciiReceiptText(str);
    for (let i = 0; i < clean.length; i++) {
      const code = clean.charCodeAt(i);
      bytes.push(code < 128 ? code : 0x20); // Clean ASCII or space fallback (never '?')
    }
  };

  const addLine = (str = "") => {
    addStr(str);
    bytes.push(0x0a); // LF
  };

  const addCenter = (str: string, isBold = false) => {
    const clean = str.replace(/\s+/g, " ").trim();
    if (!clean) return;

    if (clean.length > colWidth) {
      const words = clean.split(" ");
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length <= colWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            const pad = Math.max(0, Math.floor((colWidth - currentLine.length) / 2));
            addStr(" ".repeat(pad));
            if (isBold) bytes.push(0x1b, 0x45, 0x01);
            addStr(currentLine);
            if (isBold) bytes.push(0x1b, 0x45, 0x00);
            bytes.push(0x0a);
          }
          currentLine = word;
        }
      }
      if (currentLine) {
        const pad = Math.max(0, Math.floor((colWidth - currentLine.length) / 2));
        addStr(" ".repeat(pad));
        if (isBold) bytes.push(0x1b, 0x45, 0x01);
        addStr(currentLine);
        if (isBold) bytes.push(0x1b, 0x45, 0x00);
        bytes.push(0x0a);
      }
      return;
    }

    const pad = Math.max(0, Math.floor((colWidth - clean.length) / 2));
    addStr(" ".repeat(pad));
    if (isBold) bytes.push(0x1b, 0x45, 0x01);
    addStr(clean);
    if (isBold) bytes.push(0x1b, 0x45, 0x00);
    bytes.push(0x0a);
  };

  const addRow = (left: string, right: string) => {
    const maxLeft = colWidth - right.length - 1;
    const l = left.length > maxLeft ? left.substring(0, maxLeft) : left;
    const spaces = Math.max(1, colWidth - l.length - right.length);
    addLine(l + " ".repeat(spaces) + right);
  };

  const addDivider = () => {
    addLine("-".repeat(colWidth));
  };

  // 1. Initialize printer
  bytes.push(0x1b, 0x40); // ESC @ (Reset/Init)

  // 2. Open Cash Drawer if enabled
  if (config.openCashDrawer) {
    bytes.push(0x1b, 0x70, 0x00, 0x19, 0xfa); // ESC p 0 25 250 (RJ11 pulse)
  }

  // 3. Centered Header Block
  addCenter((data.shopName || "INVENTQ STORE").toUpperCase(), true);

  const cleanedAddress = cleanShopAddress(data.shopAddress);
  if (cleanedAddress) {
    addCenter(cleanedAddress);
  }
  if (config.showShopGst && data.shopGst) {
    addCenter(`GSTIN: ${data.shopGst}`);
  }
  if (config.showShopPhone && data.shopPhone) {
    addCenter(`Ph: ${data.shopPhone}`);
  }
  if (config.headerText) {
    addCenter(config.headerText);
  }

  // Invoice / Duplicate Banner
  const banner = data.invoiceTypeTag
    ? `[ ${data.invoiceTypeTag.toUpperCase()} ]`
    : data.isDuplicate
    ? "[ TAX INVOICE - DUPLICATE COPY ]"
    : "[ TAX INVOICE ]";
  addLine();
  addCenter(banner, true);

  // 4. Order Metadata & Items
  addDivider();
  addRow("Order ID:", data.orderId || "N/A");
  addRow("Date & Time:", `${data.dateStr || ""} ${data.timeStr || ""}`.trim());
  const custName =
    data.customerName && data.customerName.toLowerCase() !== "walk-in"
      ? data.customerName
      : "Walk-in Customer";
  addRow("Customer:", custName);
  if (data.phone) {
    addRow("Phone:", data.phone);
  }
  addDivider();

  // 5. Items Table with Perfect Column Alignment
  if (is58mm) {
    // 58mm (32 cols): ITEM(14) QTY(5) TOTAL(13)
    const hColItem = 14;
    const hColQty = 5;
    const hColTotal = 13;
    const header =
      "ITEM".padEnd(hColItem) + "QTY".padStart(hColQty) + "TOTAL".padStart(hColTotal);
    addLine(header);
    addDivider();

    for (const item of data.items) {
      addLine(item.name);
      const unitStr = item.selectedUnit || "pc";
      const totalStr = `Rs.${(item.tprice ?? item.qty * item.price).toFixed(2)}`;
      const line2 =
        unitStr.padEnd(hColItem) +
        String(item.qty).padStart(hColQty) +
        totalStr.padStart(hColTotal);
      addLine(line2);
      if (item.discount && item.discount > 0) {
        addLine(`  (Incl. Rs.${item.discount.toFixed(2)} discount)`);
      }
    }
  } else {
    // 80mm (42 cols): ITEM(16) QTY(6) PRICE(10) TOTAL(10)
    const colItem = 16;
    const colQty = 6;
    const colPrice = 10;
    const colTotal = colWidth - (colItem + colQty + colPrice);
    const header =
      "ITEM".padEnd(colItem) +
      "QTY".padStart(colQty) +
      "PRICE".padStart(colPrice) +
      "TOTAL".padStart(colTotal);
    addLine(header);
    addDivider();

    for (const item of data.items) {
      addLine(item.name);
      const unitStr = item.selectedUnit || "pc";
      const priceStr = item.price.toFixed(2);
      const totalStr = (item.tprice ?? item.qty * item.price).toFixed(2);
      const line2 =
        unitStr.padEnd(colItem) +
        String(item.qty).padStart(colQty) +
        priceStr.padStart(colPrice) +
        totalStr.padStart(colTotal);
      addLine(line2);
      if (item.discount && item.discount > 0) {
        addLine(`  (Incl. Rs.${item.discount.toFixed(2)} discount)`);
      }
    }
  }

  addDivider();

  // 6. Totals Breakdown matching preview exactly
  const unitsLabel = data.totalUnits ? ` (${data.totalUnits} units)` : "";
  addRow(`Subtotal${unitsLabel}:`, `Rs.${data.totalAmount.toFixed(2)}`);

  if (data.discountAmount && data.discountAmount > 0) {
    addRow("Discount Savings:", `-Rs.${data.discountAmount.toFixed(2)}`);
  }

  if (data.taxableAmount && data.taxableAmount > 0) {
    addRow("Taxable Value:", `Rs.${data.taxableAmount.toFixed(2)}`);
  }

  if (data.gstAmount > 0) {
    const totalTax = data.gstAmount;
    const taxableVal = data.taxableAmount || (data.totalAmount - (data.discountAmount || 0));
    const gstRate = data.gstRate ?? (taxableVal > 0 ? Math.round((totalTax / taxableVal) * 100) : 0);
    const cgstRate = data.cgstRate ?? (gstRate > 0 ? gstRate / 2 : 0);
    const sgstRate = data.sgstRate ?? (gstRate > 0 ? gstRate / 2 : 0);
    const cgstAmt = data.cgstAmount ?? Math.round((totalTax / 2) * 100) / 100;
    const sgstAmt = data.sgstAmount ?? Math.round((totalTax - cgstAmt) * 100) / 100;

    const cgstLabel = cgstRate > 0 ? `CGST (${cgstRate}%):` : "CGST:";
    const sgstLabel = sgstRate > 0 ? `SGST (${sgstRate}%):` : "SGST:";
    addRow(cgstLabel, `Rs.${cgstAmt.toFixed(2)}`);
    addRow(sgstLabel, `Rs.${sgstAmt.toFixed(2)}`);

    const totalTaxLabel = gstRate > 0 ? `Total Tax / GST (${gstRate}%):` : "Total Tax / GST:";
    addRow(totalTaxLabel, `Rs.${totalTax.toFixed(2)}`);
  }

  if (data.roundOff && data.roundOff !== 0) {
    const roStr =
      data.roundOff > 0
        ? `+Rs.${data.roundOff.toFixed(2)}`
        : `-Rs.${Math.abs(data.roundOff).toFixed(2)}`;
    addRow("Round Off:", roStr);
  }

  // Double line separator
  addLine("=".repeat(colWidth));

  // Grand Total in Bold + Double Height
  bytes.push(0x1b, 0x45, 0x01); // Bold ON
  bytes.push(0x1d, 0x21, 0x01); // Double height
  addRow("GRAND TOTAL:", `Rs.${data.finalAmount.toFixed(2)}`);
  bytes.push(0x1d, 0x21, 0x00); // Normal size
  bytes.push(0x1b, 0x45, 0x00); // Bold OFF

  addLine("=".repeat(colWidth));

  // 7. Payments
  if (data.payments && data.payments.length > 0) {
    for (const p of data.payments) {
      addRow(`Paid via ${p.mode.toUpperCase()}:`, `Rs.${p.amount.toFixed(2)}`);
      if (p.tendered && p.tendered > p.amount) {
        addRow("Tendered:", `Rs.${p.tendered.toFixed(2)}`);
        addRow("Change Returned:", `Rs.${(p.tendered - p.amount).toFixed(2)}`);
      }
    }
  } else {
    addRow("Paid via CASH:", `Rs.${data.finalAmount.toFixed(2)}`);
  }

  addDivider();

  // 8. Footer: Centered
  addCenter("Thank you for your business!");
  addCenter("Goods once sold will not be returned without bill.");
  if (data.reprintTimestamp || data.isDuplicate) {
    addCenter(`Reprinted on ${data.reprintTimestamp || new Date().toLocaleString("en-IN")}`);
  }
  if (
    config.footerText &&
    config.footerText !== "Thank you for shopping with us! Please visit again."
  ) {
    addCenter(config.footerText);
  }

  // 9. Paper Feed & Auto Cut
  bytes.push(0x0a, 0x0a, 0x0a, 0x0a); // Feed 4 lines
  if (config.autoCut) {
    bytes.push(0x1d, 0x56, 0x41, 0x03); // GS V A 3 (Partial Cut)
  }

  // 10. Cash Drawer Kick pulse
  if (config.openCashDrawer) {
    bytes.push(0x1b, 0x70, 0x00, 0x19, 0xfa); // ESC p 0 25 250 (Pin 2 pulse)
  }

  // 11. Hardware Buzzer / Beep Sound
  if (config.enableBuzzer !== false) {
    const beeps = Math.min(Math.max(config.buzzerBeeps || 2, 1), 5);
    bytes.push(0x1b, 0x42, beeps, 0x02); // ESC B n t (ESC/POS Buzzer command)
    bytes.push(0x07); // Standard ASCII BEL character
  }

  return new Uint8Array(bytes);
}

/**
 * Play audible POS chime / sound alert in the application
 */
export function playPrinterSoundAlert(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // Dual-tone POS receipt alert chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1760, now + 0.08); // A6
    gain2.gain.setValueAtTime(0.25, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  } catch (err) {
    console.debug("Printer sound alert error:", err);
  }
}

/* ───────────────────────────────────────────────────────────────────────────
   System / Browser Print Driver (Thermal 58mm / 80mm styled window)
   ─────────────────────────────────────────────────────────────────────────── */

export function printViaSystemDriver(
  data: ReceiptData,
  config: PrinterConfig
): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const is58 = config.paperWidth === "58mm";
    const widthMm = is58 ? "58mm" : "80mm";
    const printWindow = window.open("", "_blank", "width=420,height=600");

    if (!printWindow) {
      // Fallback: trigger standard window.print()
      window.print();
      return resolve({
        success: true,
        message: "Triggered browser standard print dialog.",
      });
    }

    const cleanedAddress = cleanShopAddress(data.shopAddress);
    const banner = data.invoiceTypeTag
      ? data.invoiceTypeTag
      : data.isDuplicate
      ? "TAX INVOICE • DUPLICATE COPY"
      : "TAX INVOICE";

    const itemsHtml = data.items
      .map((item) => {
        const itemTotal = (item.tprice ?? item.qty * item.price).toFixed(2);
        return `
        <div style="padding: 4px 0; border-bottom: 1px dashed #e2e8f0;">
          <div style="font-weight: 700; color: #0f172a;">${item.name}</div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #475569; margin-top: 1px;">
            <span style="color: #64748b;">${item.selectedUnit || "pc"}</span>
            <span style="font-weight: 700;">${item.qty}</span>
            <span>₹${item.price.toFixed(2)}</span>
            <span style="font-weight: 700; color: #0f172a;">₹${itemTotal}</span>
          </div>
          ${item.discount && item.discount > 0 ? `<div style="font-size: 8.5px; color: #16a34a; font-style: italic;">Incl. ₹${item.discount.toFixed(2)} discount</div>` : ""}
        </div>
      `;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt - ${data.orderId || "Bill"}</title>
        <style>
          @page {
            size: ${widthMm} auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 8px;
            width: ${widthMm};
            box-sizing: border-box;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .title { font-size: 14px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 2px; }
          .divider { border-bottom: 1px dashed #64748b; margin: 6px 0; }
          .divider-double { border-bottom: 2px solid #0f172a; margin: 6px 0; }
          .flex-between { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .banner { display: inline-block; padding: 2px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
          @media print {
            body { padding: 4px; }
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="title">${data.shopName || "INVENTQ STORE"}</div>
          ${cleanedAddress ? `<div style="font-size: 10px; color: #334155;">${cleanedAddress}</div>` : ""}
          ${config.showShopGst && data.shopGst ? `<div style="font-size: 10px; font-weight: 600;">GSTIN: ${data.shopGst}</div>` : ""}
          ${config.showShopPhone && data.shopPhone ? `<div style="font-size: 10px;">Ph: ${data.shopPhone}</div>` : ""}
          <div class="banner">${banner}</div>
        </div>

        <div class="divider"></div>

        <div class="flex-between">
          <span>Order ID:</span>
          <span class="bold">${data.orderId || "N/A"}</span>
        </div>
        <div class="flex-between">
          <span>Date & Time:</span>
          <span>${data.dateStr || ""} ${data.timeStr || ""}</span>
        </div>
        <div class="flex-between">
          <span>Customer:</span>
          <span class="bold">${data.customerName || "Walk-in Customer"}</span>
        </div>
        ${data.phone ? `
        <div class="flex-between">
          <span>Phone:</span>
          <span>${data.phone}</span>
        </div>` : ""}

        <div class="divider"></div>

        <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 9.5px; text-transform: uppercase; color: #475569; padding-bottom: 3px; border-bottom: 1px solid #cbd5e1;">
          <span style="flex: 1;">Item</span>
          <span style="width: 40px; text-align: center;">Qty</span>
          <span style="width: 50px; text-align: right;">Price</span>
          <span style="width: 50px; text-align: right;">Total</span>
        </div>

        ${itemsHtml}

        <div class="divider"></div>

        <div class="flex-between">
          <span>Subtotal${data.totalUnits ? ` (${data.totalUnits} units)` : ""}:</span>
          <span>₹${data.totalAmount.toFixed(2)}</span>
        </div>
        ${data.discountAmount && data.discountAmount > 0 ? `
        <div class="flex-between" style="color: #16a34a; font-weight: 600;">
          <span>Discount Savings:</span>
          <span>-₹${data.discountAmount.toFixed(2)}</span>
        </div>` : ""}
        ${data.taxableAmount && data.taxableAmount > 0 ? `
        <div class="flex-between" style="color: #475569; font-size: 10px;">
          <span>Taxable Value:</span>
          <span>₹${data.taxableAmount.toFixed(2)}</span>
        </div>` : ""}
        ${data.gstAmount > 0 ? `
        <div class="flex-between" style="color: #475569; font-size: 10px;">
          <span>CGST (${data.cgstRate ?? (data.gstRate ? data.gstRate / 2 : (data.taxableAmount ? Math.round((data.gstAmount / data.taxableAmount) * 50) : 0))}%):</span>
          <span>₹${(data.cgstAmount ?? Math.round((data.gstAmount / 2) * 100) / 100).toFixed(2)}</span>
        </div>
        <div class="flex-between" style="color: #475569; font-size: 10px;">
          <span>SGST (${data.sgstRate ?? (data.gstRate ? data.gstRate / 2 : (data.taxableAmount ? Math.round((data.gstAmount / data.taxableAmount) * 50) : 0))}%):</span>
          <span>₹${(data.sgstAmount ?? Math.round((data.gstAmount - (data.cgstAmount ?? Math.round((data.gstAmount / 2) * 100) / 100)) * 100) / 100).toFixed(2)}</span>
        </div>
        <div class="flex-between" style="font-weight: 600;">
          <span>Total Tax / GST${data.gstRate ? ` (${data.gstRate}%)` : ""}:</span>
          <span>₹${data.gstAmount.toFixed(2)}</span>
        </div>` : ""}
        ${data.roundOff && data.roundOff !== 0 ? `
        <div class="flex-between" style="color: #475569; font-size: 10px;">
          <span>Round Off:</span>
          <span>${data.roundOff > 0 ? `+₹${data.roundOff.toFixed(2)}` : `-₹${Math.abs(data.roundOff).toFixed(2)}`}</span>
        </div>` : ""}

        <div class="divider-double"></div>

        <div class="flex-between" style="font-size: 14px; font-weight: 900; color: #0f172a;">
          <span>GRAND TOTAL</span>
          <span>₹${data.finalAmount.toFixed(2)}</span>
        </div>

        <div class="divider-double"></div>

        ${data.payments && data.payments.length > 0 ? `
          ${data.payments.map(p => `
            <div class="flex-between">
              <span>Paid via ${p.mode.toUpperCase()}:</span>
              <span class="bold">₹${p.amount.toFixed(2)}</span>
            </div>
            ${p.tendered && p.tendered > p.amount ? `
            <div class="flex-between" style="font-size: 10px; color: #475569;">
              <span>Tendered:</span>
              <span>₹${p.tendered.toFixed(2)}</span>
            </div>
            <div class="flex-between" style="font-size: 10px; color: #475569;">
              <span>Change Returned:</span>
              <span>₹${(p.tendered - p.amount).toFixed(2)}</span>
            </div>` : ""}
          `).join("")}
        ` : `
          <div class="flex-between">
            <span>Paid via CASH:</span>
            <span class="bold">₹${data.finalAmount.toFixed(2)}</span>
          </div>
        `}

        <div class="divider"></div>

        <div class="center" style="font-size: 9px; color: #64748b; margin-top: 8px;">
          <div style="font-weight: 700; color: #334155;">Thank you for your business!</div>
          <div>Goods once sold will not be returned without bill.</div>
          ${data.reprintTimestamp || data.isDuplicate ? `<div style="margin-top: 3px; font-size: 8px; color: #94a3b8;">Reprinted on ${data.reprintTimestamp || new Date().toLocaleString("en-IN")}</div>` : ""}
        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() {
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    resolve({
      success: true,
      message: "Receipt sent to printer spooler.",
    });
  });
}

/* ───────────────────────────────────────────────────────────────────────────
   Direct Hardware Print (Bluetooth, USB/Serial, WiFi/LAN)
   ─────────────────────────────────────────────────────────────────────────── */

export async function printReceipt(
  data: ReceiptData,
  customConfig?: PrinterConfig
): Promise<{ success: boolean; message: string }> {
  const config = customConfig || getPrinterConfig();

  // 1. Bluetooth Connection
  if (config.connectionType === "bluetooth") {
    try {
      const buffer = buildEscPosBuffer(data, config);
      if (!activeBluetoothCharacteristic) {
        const pairRes = await pairBluetoothPrinter();
        if (!pairRes.success || !activeBluetoothCharacteristic) {
          throw new Error(pairRes.message || "Bluetooth printer not connected. Please pair in Printers Config.");
        }
      }

      // Send in chunks of 512 bytes (standard BLE MTU)
      const chunkSize = 512;
      for (let offset = 0; offset < buffer.length; offset += chunkSize) {
        const slice = buffer.slice(offset, offset + chunkSize);
        if (activeBluetoothCharacteristic.writeValueWithoutResponse) {
          await activeBluetoothCharacteristic.writeValueWithoutResponse(slice);
        } else {
          await activeBluetoothCharacteristic.writeValue(slice);
        }
      }

      if (config.enableBuzzer !== false) {
        playPrinterSoundAlert();
      }
      return {
        success: true,
        message: `Printed successfully to Bluetooth printer: ${config.deviceName || "Thermal Printer"}`,
      };
    } catch (err: any) {
      console.error("Bluetooth print failed:", err);
      return {
        success: false,
        message: `Bluetooth print failed: ${err.message || "Device disconnected"}`,
      };
    }
  }

  // 2. USB / Serial Connection
  if (config.connectionType === "usb") {
    try {
      const buffer = buildEscPosBuffer(data, config);
      if (!activeSerialPort) {
        const pairRes = await pairUsbSerialPrinter(config.baudRate || 9600);
        if (!pairRes.success || !activeSerialPort) {
          throw new Error(pairRes.message || "USB/Serial printer not connected.");
        }
      }

      const writer = activeSerialPort.writable.getWriter();
      await writer.write(buffer);
      writer.releaseLock();

      if (config.enableBuzzer !== false) {
        playPrinterSoundAlert();
      }
      return {
        success: true,
        message: `Printed successfully to USB/Serial printer: ${config.deviceName || "Thermal Printer"}`,
      };
    } catch (err: any) {
      console.error("USB print failed:", err);
      return {
        success: false,
        message: `USB print error: ${err.message || "Port disconnected"}`,
      };
    }
  }

  // 3. WiFi / LAN Network Printer
  if (config.connectionType === "network") {
    try {
      const { host, port } = parseHostAndPort(config.networkIp, config.networkPort);
      const buffer = buildEscPosBuffer(data, config);

      // Convert Uint8Array to base64
      let binary = "";
      const len = buffer.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(buffer[i]);
      }
      const base64Data = btoa(binary);

      const gatewayBase = getGatewayBaseUrl();
      const resp = await fetch(`${gatewayBase}/printer/network-print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host,
          port,
          data_base64: base64Data,
          timeout: 4.0,
        }),
      });

      if (resp.ok) {
        const json = await resp.json();
        if (json.success && config.enableBuzzer !== false) {
          playPrinterSoundAlert();
        }
        return {
          success: Boolean(json.success),
          message: json.message,
        };
      }

      return {
        success: false,
        message: `Network print failed with server status ${resp.status}`,
      };
    } catch (err: any) {
      console.error("Network print failed:", err);
      return {
        success: false,
        message: `Network print failed: ${err.message || "Could not reach printer bridge"}`,
      };
    }
  }

  // 4. Default: System / Browser Printer Driver (ONLY when connectionType === "system")
  return await printViaSystemDriver(data, config);
}

/**
 * Print a test receipt to verify configuration
 */
export async function printTestReceipt(
  config: PrinterConfig,
  shopInfo?: any
): Promise<{ success: boolean; message: string }> {
  const now = new Date();
  const testData: ReceiptData = {
    shopName: shopInfo?.shop_name || shopInfo?.name || "INVENTQ DEMO RETAIL",
    shopAddress: shopInfo?.address || "123 Commercial Road, Retail Zone",
    shopPhone: shopInfo?.phone || "+91 98765 43210",
    shopGst: shopInfo?.gstin || "33AAAAA0000A1Z5",
    orderId: "TEST-" + Math.floor(1000 + Math.random() * 9000),
    customerName: "Diagnostics Check",
    dateStr: now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    timeStr: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    items: [
      { name: "Test Item - Thermal 1", qty: 1, price: 150.0, tprice: 150.0, selectedUnit: "pc" },
      { name: "Diagnostic Item 2", qty: 2, price: 49.5, tprice: 99.0, selectedUnit: "pc" },
    ],
    totalAmount: 249.0,
    taxableAmount: 249.0,
    gstAmount: 44.82,
    finalAmount: 293.82,
    discountAmount: 0,
    totalUnits: 3,
    invoiceTypeTag: "DIAGNOSTIC TEST RECEIPT",
    payments: [{ mode: "cash", amount: 293.82, tendered: 300.0 }],
    footerNote: `CONFIG TEST OK - Mode: ${config.connectionType.toUpperCase()} - Paper: ${config.paperWidth}`,
  };

  return await printReceipt(testData, config);
}
