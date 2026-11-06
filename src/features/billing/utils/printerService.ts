import { getGatewayBaseUrl } from "@/services/api/tokenManager";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";

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
  // Digital Store Bill Settings
  includeDigitalStoreQr?: boolean;
  digitalStoreQrMessage?: string;
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
  includeDigitalStoreQr: false,
  digitalStoreQrMessage: "Your shop is online! Scan to browse & order.",
};

export const DIGITAL_STORE_QR_MESSAGES = [
  "Your shop is online! Scan to browse & order.",
  "Your favourite shop, now online! Scan here.",
  "We're online! Scan to shop.",
] as const;

export const DEFAULT_DIGITAL_STORE_QR_MESSAGE = "Your shop is online! Scan to browse & order.";

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
let activeUsbDevice: any = null;

export function getActiveBluetoothSession() {
  return {
    device: activeBluetoothDevice,
    server: activeBluetoothServer,
    characteristic: activeBluetoothCharacteristic,
  };
}

export function getActiveUsbSession() {
  return {
    usbDevice: activeUsbDevice,
    serialPort: activeSerialPort,
  };
}

// Well-known BLE GATT Service UUIDs used by standard ESC/POS Bluetooth Thermal Printers
// (GOOJPRT, PT-210, MPT-II, POS-5802, Netum, Xprinter, Epson, Zebra, MUNBYN, and generic POS printers)
const KNOWN_BT_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb", // Common POS SPP
  "000018f1-0000-1000-8000-00805f9b34fb",
  "000018f2-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ff11-0000-1000-8000-00805f9b34fb",
  "0000ff12-0000-1000-8000-00805f9b34fb",
  "0000fee7-0000-1000-8000-00805f9b34fb",
  "0000fff0-0000-1000-8000-00805f9b34fb",
  "0000fff1-0000-1000-8000-00805f9b34fb",
  "0000af30-0000-1000-8000-00805f9b34fb",
  "0000ae30-0000-1000-8000-00805f9b34fb",
  "0000ae00-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // ISSC Transparent Service
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Nordic UART Service (NUS)
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART v2
  "0000ffe0-0000-1000-8000-00805f9b34fb", // HM-10 / CC2541 common BLE
  "0000ffe1-0000-1000-8000-00805f9b34fb",
  "0000e0ff-3c17-d293-8e48-14fe2e4da212", // Custom ESC/POS
  "0000180a-0000-1000-8000-00805f9b34fb", // Device Information
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
    // Use acceptAllDevices: true so Chrome discovers all nearby Bluetooth printers (like KPC307, PT-210, etc.)
    // without prematurely filtering them by name prefix or advertising UUIDs
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: KNOWN_BT_SERVICES,
    });

    if (!device) {
      return { success: false, message: "No Bluetooth printer was selected." };
    }

    activeBluetoothDevice = device;
    const deviceName = device.name || "Bluetooth Thermal Printer";
    const deviceId = device.id;

    // Disconnection listener
    device.addEventListener("gattserverdisconnected", () => {
      console.warn(`[Bluetooth Printer] Device "${device.name || "Printer"}" disconnected.`);
      activeBluetoothCharacteristic = null;
      activeBluetoothServer = null;
    });

    // Connect to GATT Server
    const server = await device.gatt?.connect();
    activeBluetoothServer = server;

    // Find writable characteristic across known services first, then any discovered service
    const foundChar = await discoverWritableCharacteristic(server);
    if (foundChar) {
      activeBluetoothCharacteristic = foundChar;
    }

    // Persist paired device credentials to localStorage and config
    try {
      localStorage.setItem("inventq_paired_bt_printer_name", deviceName);
      localStorage.setItem("inventq_paired_bt_printer_id", deviceId);
      const curConfig = getPrinterConfig();
      savePrinterConfig({
        ...curConfig,
        deviceName,
        deviceId,
        connectionType: "bluetooth",
      });
    } catch {}

    return {
      success: true,
      deviceName,
      deviceId,
      message: `Successfully paired with ${deviceName}`,
    };
  } catch (err: any) {
    if (err.name === "NotFoundError" || err.message?.includes("cancelled") || err.message?.includes("canceled")) {
      return {
        success: false,
        message: "Bluetooth pairing was cancelled. Click 'Pair Bluetooth' to select your printer.",
      };
    }
    console.error("Bluetooth pairing error:", err);
    return {
      success: false,
      message: err.message || "Failed to pair Bluetooth printer.",
    };
  }
}

/**
 * Finds a writable characteristic across available GATT services of the printer.
 */
async function discoverWritableCharacteristic(server: any): Promise<any> {
  if (!server) return null;

  for (const serviceUuid of KNOWN_BT_SERVICES) {
    try {
      const service = await server.getPrimaryService(serviceUuid);
      if (service) {
        const chars = await service.getCharacteristics();
        for (const char of chars) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            return char;
          }
        }
      }
    } catch {
      // Continue searching next service
    }
  }

  // Fallback: search all discovered primary services
  try {
    const services = await server.getPrimaryServices();
    for (const service of services) {
      try {
        const chars = await service.getCharacteristics();
        for (const char of chars) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            return char;
          }
        }
      } catch {}
    }
  } catch {}

  return null;
}

/**
 * Silently reconnects to a previously paired Bluetooth printer via navigator.bluetooth.getDevices()
 * without opening any user prompt or dialog window.
 */
export async function attemptSilentBluetoothReconnect(): Promise<boolean> {
  if (!isBluetoothSupported()) return false;
  const nav = navigator as any;
  if (typeof nav.bluetooth?.getDevices !== "function") return false;

  try {
    const permittedDevices: any[] = await nav.bluetooth.getDevices();
    if (!permittedDevices || permittedDevices.length === 0) return false;

    const config = getPrinterConfig();
    const localName = localStorage.getItem("inventq_paired_bt_printer_name");
    const localId = localStorage.getItem("inventq_paired_bt_printer_id");
    const savedId = config.deviceId || localId;
    const savedName = localName || config.deviceName;

    // 1. Try to find the exact configured device by ID or name
    let target = permittedDevices.find(
      (d) => (savedId && d.id === savedId) || (savedName && d.name === savedName)
    );

    // 2. If only 1 permitted Bluetooth device is available on this origin, use it
    if (!target && permittedDevices.length === 1) {
      target = permittedDevices[0];
    } else if (!target) {
      // 3. Fallback: find any device with thermal/POS printer naming
      target = permittedDevices.find(
        (d) => d.name && /kpc|pos|printer|thermal|pt-|mpt|rp|bt/i.test(d.name)
      ) || permittedDevices[0];
    }

    if (!target) return false;

    console.log(`[Bluetooth Printer] Silent reconnect to permitted device "${target.name || target.id}" without prompt...`);
    activeBluetoothDevice = target;

    target.addEventListener("gattserverdisconnected", () => {
      console.warn(`[Bluetooth Printer] Device "${target.name || "Printer"}" disconnected.`);
      activeBluetoothCharacteristic = null;
      activeBluetoothServer = null;
    });

    const server = target.gatt?.connected ? target.gatt : await target.gatt?.connect();
    if (!server) return false;

    activeBluetoothServer = server;
    const foundChar = await discoverWritableCharacteristic(server);
    if (foundChar) {
      activeBluetoothCharacteristic = foundChar;
      if (target.name) {
        localStorage.setItem("inventq_paired_bt_printer_name", target.name);
        localStorage.setItem("inventq_paired_bt_printer_id", target.id);
      }
      return true;
    }
  } catch (err) {
    console.warn("[Bluetooth Printer] Silent getDevices reconnect error:", err);
  }
  return false;
}

/**
 * Ensures active GATT connection to the Bluetooth printer before writing.
 * 1. Checks in-memory active connection
 * 2. Re-connects GATT directly if in-memory device handle is present (No picker dialog)
 * 3. Attempts silent auto-reconnect via navigator.bluetooth.getDevices() (No picker dialog)
 * 4. If device is not in memory, prompts device picker so user can select their Bluetooth thermal printer
 */
async function ensureBluetoothConnected(): Promise<any> {
  if (
    activeBluetoothDevice &&
    activeBluetoothDevice.gatt &&
    activeBluetoothDevice.gatt.connected &&
    activeBluetoothCharacteristic
  ) {
    return activeBluetoothCharacteristic;
  }

  // If in-memory device handle is present, reconnect GATT directly
  if (activeBluetoothDevice && activeBluetoothDevice.gatt) {
    try {
      console.log("[Bluetooth Printer] Re-connecting GATT server to in-memory device...");
      const server = activeBluetoothDevice.gatt.connected
        ? activeBluetoothDevice.gatt
        : await activeBluetoothDevice.gatt.connect();
      if (server) {
        const characteristic = await discoverWritableCharacteristic(server);
        if (characteristic) {
          activeBluetoothServer = server;
          activeBluetoothCharacteristic = characteristic;
          return characteristic;
        }
      }
    } catch (e) {
      console.warn("[Bluetooth Printer] Reconnection to in-memory device failed, trying getDevices:", e);
    }
  }

  // Silent auto-reconnect via navigator.bluetooth.getDevices() without opening any browser picker
  const reconnected = await attemptSilentBluetoothReconnect();
  if (reconnected && activeBluetoothCharacteristic) {
    return activeBluetoothCharacteristic;
  }

  // If silent reconnect is not possible (e.g. first print after page reload),
  // prompt the browser device picker so the user selects their Bluetooth thermal printer!
  console.log("[Bluetooth Printer] Silent reconnect unavailable, requesting device via pair dialog...");
  const pairRes = await pairBluetoothPrinter();
  if (pairRes.success && activeBluetoothCharacteristic) {
    return activeBluetoothCharacteristic;
  }

  throw new Error(pairRes.message || "Bluetooth printer is disconnected or out of range. Please turn it on or check pairing in Printers Config.");
}

/**
 * Sends raw ESC/POS binary data to the connected Bluetooth thermal printer.
 * Chunks data into small MTU packets (100 bytes) with a micro-delay (15ms)
 * to prevent Bluetooth buffer overruns and 'GATT operation failed' errors.
 */
async function sendEscPosToBluetooth(data: Uint8Array): Promise<void> {
  const characteristic = await ensureBluetoothConnected();
  if (!characteristic) {
    throw new Error("No writable Bluetooth characteristic available.");
  }

  // Standard BLE MTU for thermal printers is 64-100 bytes (512 bytes causes GATT buffer failures)
  const CHUNK_SIZE = 100;
  const totalLength = data.length;

  for (let offset = 0; offset < totalLength; offset += CHUNK_SIZE) {
    const chunk = data.slice(offset, Math.min(offset + CHUNK_SIZE, totalLength));

    try {
      if (characteristic.writeValueWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else if (characteristic.writeValue) {
        await characteristic.writeValue(chunk);
      } else {
        await (characteristic as any).writeValueWithResponse(chunk);
      }
    } catch (writeErr) {
      console.warn("[Bluetooth Printer] Write error, retrying with reconnection:", writeErr);
      const reconnectedChar = await ensureBluetoothConnected();
      if (reconnectedChar.writeValueWithoutResponse) {
        await reconnectedChar.writeValueWithoutResponse(chunk);
      } else {
        await reconnectedChar.writeValue(chunk);
      }
    }

    // Small micro-delay (15ms) between BLE packets so printer MCU receives cleanly
    if (offset + CHUNK_SIZE < totalLength) {
      await new Promise((resolve) => setTimeout(resolve, 15));
    }
  }
}

/**
 * Connect to USB / Serial Thermal Printer
 * Supports both WebSerial (COM / Virtual COM ports) and WebUSB (Direct USB ESC/POS).
 */
export async function pairUsbSerialPrinter(baudRate = 9600): Promise<{
  success: boolean;
  deviceName?: string;
  message: string;
}> {
  const nav = navigator as any;

  // 1. Try WebSerial first (Windows COM ports, USB-to-Serial, and Bluetooth COM devices like KPC307)
  if (isSerialSupported()) {
    try {
      const port = await nav.serial.requestPort();
      if (!port) {
        return { success: false, message: "No USB/Serial port was selected." };
      }

      // If already opened, close before reopening with requested baud rate
      if (port.readable || port.writable) {
        try {
          await port.close();
        } catch {}
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
      // User cancelled dialog
      if (err.name === "NotFoundError" || err.message?.includes("cancelled") || err.message?.includes("canceled")) {
        return {
          success: false,
          message: "Port selection was cancelled. Click 'Connect USB Port' to select your printer.",
        };
      }
      console.warn("Serial connection error, checking WebUSB fallback:", err);
    }
  }

  // 2. Fallback / Direct WebUSB (Raw USB Thermal Printers)
  if (isUsbSupported()) {
    try {
      const device = await nav.usb.requestDevice({ filters: [] });
      if (!device) {
        return { success: false, message: "No USB printer was selected." };
      }
      await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }
      await device.claimInterface(0);

      activeUsbDevice = device;
      const devName = device.productName || `USB Thermal Printer (${device.vendorId})`;
      return {
        success: true,
        deviceName: devName,
        message: `Connected to ${devName}`,
      };
    } catch (err: any) {
      if (err.name === "NotFoundError" || err.message?.includes("cancelled") || err.message?.includes("canceled")) {
        return {
          success: false,
          message: "USB selection was cancelled. Click 'Connect USB Port' to select your printer.",
        };
      }
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
  shopId?: string;
  digitalStoreUrl?: string;
  includeDigitalStoreQr?: boolean;
  digitalStoreQrMessage?: string;
}

/**
 * Sanitize address object or string so '[object Object]' or 'Not specified' never appears on receipts
 */
/**
 * Get digital store URL for QR code encoding
 */
export function getDigitalStoreUrl(shopId?: string, websiteUrl?: string): string {
  if (websiteUrl && websiteUrl.trim()) return websiteUrl.trim();
  const id = shopId || (typeof localStorage !== "undefined" ? localStorage.getItem("shop_id") : "") || "";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://inventq.in";
  return `${origin}/store/${id}`;
}

/**
 * Generate crisp, high-contrast QR SVG HTML markup for thermal receipt printing
 */
export function generateQrSvgHtml(url: string, size = 135): string {
  try {
    return renderToStaticMarkup(
      React.createElement(QRCodeSVG, {
        value: url,
        size: size,
        level: "M",
        includeMargin: false,
      })
    );
  } catch (err) {
    console.error("Failed to generate QR SVG string:", err);
    return "";
  }
}

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

    bytes.push(0x1b, 0x61, 0x01); // Center alignment
    if (isBold) bytes.push(0x1b, 0x45, 0x01);

    if (clean.length > colWidth) {
      const words = clean.split(" ");
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length <= colWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            addStr(currentLine);
            bytes.push(0x0a);
          }
          currentLine = word;
        }
      }
      if (currentLine) {
        addStr(currentLine);
        bytes.push(0x0a);
      }
    } else {
      addStr(clean);
      bytes.push(0x0a);
    }

    if (isBold) bytes.push(0x1b, 0x45, 0x00);
    bytes.push(0x1b, 0x61, 0x00); // Reset to left alignment
  };

  // Deprecated legacy space-padding replaced by hardware center alignment
  const _unusedLegacyPad = () => {
    const str = "";
    const isBold = false;
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

  void _unusedLegacyPad;

  const addRow = (left: string, right: string) => {
    const maxLeft = colWidth - right.length - 1;
    const l = left.length > maxLeft ? left.substring(0, maxLeft) : left;
    const spaces = Math.max(1, colWidth - l.length - right.length);
    addLine(l + " ".repeat(spaces) + right);
  };

  const addDivider = () => {
    bytes.push(0x1b, 0x61, 0x01);
    addLine("-".repeat(colWidth));
    bytes.push(0x1b, 0x61, 0x00);
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
  const isWalkIn =
    !data.customerName ||
    ["walk-in", "walk-in customer", "walk in", "walk in customer", "walkin", "walkin customer"].includes(
      data.customerName.trim().toLowerCase()
    );
  if (!isWalkIn) {
    addRow("Customer:", data.customerName || "");
    if (data.phone) {
      addRow("Phone:", data.phone);
    }
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

  const effectiveTaxableAmount = (data.taxableAmount && data.taxableAmount > 0 && (data.gstAmount === 0 || data.taxableAmount < data.finalAmount))
    ? data.taxableAmount
    : (data.gstAmount > 0 ? Math.max(0, data.finalAmount - data.gstAmount - (data.roundOff || 0)) : (data.totalAmount - (data.discountAmount || 0)));

  if (effectiveTaxableAmount > 0) {
    addRow("Taxable Value:", `Rs.${effectiveTaxableAmount.toFixed(2)}`);
  }

  if (data.gstAmount > 0) {
    const totalTax = data.gstAmount;
    const taxableVal = effectiveTaxableAmount;
    const gstRate = data.gstRate && data.gstRate > 0 ? data.gstRate : (taxableVal > 0 ? Math.round((totalTax / taxableVal) * 100) : 0);
    const cgstRate = data.cgstRate && data.cgstRate > 0 ? data.cgstRate : (gstRate > 0 ? gstRate / 2 : 0);
    const sgstRate = data.sgstRate && data.sgstRate > 0 ? data.sgstRate : (gstRate > 0 ? gstRate / 2 : 0);
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

  // Digital Store QR Code Section (Printed before footer)
  const shouldPrintDigitalQr = Boolean(data.includeDigitalStoreQr ?? config.includeDigitalStoreQr);
  const digitalStoreUrl = data.digitalStoreUrl || getDigitalStoreUrl(data.shopId);
  const qrMessage = data.digitalStoreQrMessage || config.digitalStoreQrMessage || DEFAULT_DIGITAL_STORE_QR_MESSAGE;

  if (shouldPrintDigitalQr && digitalStoreUrl) {
    const moduleSize = config.paperWidth === "58mm" ? 5 : 7;
    const qrBytes = new TextEncoder().encode(digitalStoreUrl);
    const len = qrBytes.length + 3;
    const pL = len & 0xff;
    const pH = (len >> 8) & 0xff;

    bytes.push(0x1b, 0x61, 0x01); // Center align
    bytes.push(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00); // Model 2
    bytes.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, moduleSize); // Module size
    bytes.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31); // Level M
    bytes.push(0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30); // Store
    for (let i = 0; i < qrBytes.length; i++) {
      bytes.push(qrBytes[i]);
    }
    bytes.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30); // Print
    bytes.push(0x1b, 0x61, 0x00); // Reset Left
    bytes.push(0x0a);

    addCenter("Scan to visit our online store");
    addDivider();
  }

  // 8. Footer: Centered
  if (config.footerText && config.footerText.trim()) {
    addCenter(config.footerText.trim());
  } else {
    addCenter("Thank you for your business!");
  }
  addCenter("Goods once sold will not be returned without bill.");
  if (data.footerNote && data.footerNote.trim() && data.footerNote.trim() !== config.footerText?.trim()) {
    addCenter(data.footerNote.trim());
  }
  if (data.reprintTimestamp || data.isDuplicate) {
    addCenter(`Reprinted on ${data.reprintTimestamp || new Date().toLocaleString("en-IN")}`);
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
      ctx.resume().catch(() => { });
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

    const shouldPrintDigitalQr = Boolean(data.includeDigitalStoreQr ?? config.includeDigitalStoreQr);
    const digitalStoreUrl = data.digitalStoreUrl || getDigitalStoreUrl(data.shopId);
    const qrMessage = data.digitalStoreQrMessage || config.digitalStoreQrMessage || DEFAULT_DIGITAL_STORE_QR_MESSAGE;
    const qrSvgSize = is58 ? 115 : 140;
    const qrSvgHtml = (shouldPrintDigitalQr && digitalStoreUrl) ? generateQrSvgHtml(digitalStoreUrl, qrSvgSize) : "";

    const cleanedAddress = cleanShopAddress(data.shopAddress);
    const banner = data.invoiceTypeTag
      ? data.invoiceTypeTag
      : data.isDuplicate
        ? "TAX INVOICE • DUPLICATE COPY"
        : "TAX INVOICE";

    const isWalkIn =
      !data.customerName ||
      ["walk-in", "walk-in customer", "walk in", "walk in customer", "walkin", "walkin customer"].includes(
        data.customerName.trim().toLowerCase()
      );

    const effectiveTaxableAmount = (data.taxableAmount && data.taxableAmount > 0 && (data.gstAmount === 0 || data.taxableAmount < data.finalAmount))
      ? data.taxableAmount
      : (data.gstAmount > 0 ? Math.max(0, data.finalAmount - data.gstAmount - (data.roundOff || 0)) : (data.totalAmount - (data.discountAmount || 0)));

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
            body { padding: 4px; width: 100%; }
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
        ${!isWalkIn ? `
        <div class="flex-between">
          <span>Customer:</span>
          <span class="bold">${data.customerName}</span>
        </div>
        ${data.phone ? `
        <div class="flex-between">
          <span>Phone:</span>
          <span>${data.phone}</span>
        </div>` : ""}
        ` : ""}

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
        ${effectiveTaxableAmount > 0 ? `
        <div class="flex-between" style="color: #475569; font-size: 10px;">
          <span>Taxable Value:</span>
          <span>₹${effectiveTaxableAmount.toFixed(2)}</span>
        </div>` : ""}
        ${data.gstAmount > 0 ? `
        <div class="flex-between" style="color: #475569; font-size: 10px;">
          <span>CGST (${data.cgstRate && data.cgstRate > 0 ? data.cgstRate : (data.gstRate ? data.gstRate / 2 : (effectiveTaxableAmount ? Math.round((data.gstAmount / effectiveTaxableAmount) * 50) : 0))}%):</span>
          <span>₹${(data.cgstAmount ?? Math.round((data.gstAmount / 2) * 100) / 100).toFixed(2)}</span>
        </div>
        <div class="flex-between" style="color: #475569; font-size: 10px;">
          <span>SGST (${data.sgstRate && data.sgstRate > 0 ? data.sgstRate : (data.gstRate ? data.gstRate / 2 : (effectiveTaxableAmount ? Math.round((data.gstAmount / effectiveTaxableAmount) * 50) : 0))}%):</span>
          <span>₹${(data.sgstAmount ?? Math.round((data.gstAmount - (data.cgstAmount ?? Math.round((data.gstAmount / 2) * 100) / 100)) * 100) / 100).toFixed(2)}</span>
        </div>
        <div class="flex-between" style="font-weight: 600;">
          <span>Total Tax / GST${(data.gstRate && data.gstRate > 0 ? data.gstRate : (effectiveTaxableAmount ? Math.round((data.gstAmount / effectiveTaxableAmount) * 100) : 0)) ? ` (${data.gstRate && data.gstRate > 0 ? data.gstRate : Math.round((data.gstAmount / effectiveTaxableAmount) * 100)}%)` : ""}:</span>
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

        ${shouldPrintDigitalQr && digitalStoreUrl ? `
        <div class="divider"></div>
        <div class="center" style="margin: 10px 0 6px 0;">
          <div style="display: flex; justify-content: center; align-items: center; margin: 8px 0;">
            <div style="padding: 6px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
              ${qrSvgHtml}
            </div>
          </div>
          <div style="font-size: 9.5px; color: #475569; font-weight: 500;">Scan to visit our online store</div>
        </div>
        ` : ""}

        <div class="center" style="font-size: 9px; color: #64748b; margin-top: 8px;">
          <div style="font-weight: 700; color: #334155;">${(config.footerText && config.footerText.trim()) ? config.footerText.trim() : "Thank you for your business!"}</div>
          <div>Goods once sold will not be returned without bill.</div>
          ${data.footerNote && data.footerNote.trim() && data.footerNote.trim() !== config.footerText?.trim() ? `<div style="margin-top: 2px; font-weight: 600; color: #475569;">${data.footerNote.trim()}</div>` : ""}
          ${data.reprintTimestamp || data.isDuplicate ? `<div style="margin-top: 3px; font-size: 8px; color: #94a3b8;">Reprinted on ${data.reprintTimestamp || new Date().toLocaleString("en-IN")}</div>` : ""}
        </div>
      </body>
      </html>
    `;

    // Remove any previously appended invisible print iframe
    let printIframe = document.getElementById("inventq-pos-print-frame") as HTMLIFrameElement;
    if (printIframe) {
      try {
        printIframe.remove();
      } catch {}
    }

    // Create a hidden iframe so the browser print dialog is never blocked by popup blockers
    printIframe = document.createElement("iframe");
    printIframe.id = "inventq-pos-print-frame";
    printIframe.style.position = "fixed";
    printIframe.style.right = "0";
    printIframe.style.bottom = "0";
    printIframe.style.width = "0";
    printIframe.style.height = "0";
    printIframe.style.border = "none";
    printIframe.style.visibility = "hidden";
    document.body.appendChild(printIframe);

    const doc = printIframe.contentWindow?.document;
    if (!doc || !printIframe.contentWindow) {
      window.print();
      return resolve({
        success: true,
        message: "Triggered browser standard print dialog.",
      });
    }

    doc.open();
    doc.write(html);
    doc.close();

    const frameWin = printIframe.contentWindow;
    setTimeout(() => {
      try {
        frameWin.focus();
        frameWin.print();
        if (config.enableBuzzer !== false) {
          playPrinterSoundAlert();
        }
        resolve({
          success: true,
          message: "Receipt sent to printer spooler.",
        });
      } catch (err) {
        console.warn("Iframe print invocation error:", err);
        window.print();
        resolve({
          success: true,
          message: "Triggered standard print dialog.",
        });
      }
    }, 250);
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
      await sendEscPosToBluetooth(buffer);

      if (config.enableBuzzer !== false) {
        playPrinterSoundAlert();
      }
      return {
        success: true,
        message: `Printed successfully to Bluetooth printer: ${config.deviceName || "Thermal Printer"}`,
      };
    } catch (err: any) {
      console.error("[Printer Service] Bluetooth direct ESC/POS print failed:", err);
      return {
        success: false,
        message: err.message || "Failed to print to Bluetooth printer. Please check printer power and pairing.",
      };
    }
  }

  // 2. USB / Serial Connection
  if (config.connectionType === "usb") {
    try {
      const buffer = buildEscPosBuffer(data, config);
      let printed = false;

      // Try Direct WebUSB first if connected
      if (activeUsbDevice) {
        try {
          if (!activeUsbDevice.opened) {
            await activeUsbDevice.open();
            if (activeUsbDevice.configuration === null) {
              await activeUsbDevice.selectConfiguration(1);
            }
            await activeUsbDevice.claimInterface(0);
          }
          const endpoint = activeUsbDevice.configuration?.interfaces?.[0]?.alternate?.endpoints?.find(
            (ep: any) => ep.direction === "out"
          );
          const endpointNumber = endpoint ? endpoint.endpointNumber : 1;
          await activeUsbDevice.transferOut(endpointNumber, buffer);
          printed = true;
        } catch (usbErr) {
          console.warn("Direct WebUSB print failed, falling back to WebSerial:", usbErr);
        }
      }

      // Try WebSerial if connected
      if (!printed && activeSerialPort) {
        try {
          if (!activeSerialPort.readable && !activeSerialPort.writable) {
            await activeSerialPort.open({ baudRate: config.baudRate || 9600 });
          }
          const writer = activeSerialPort.writable.getWriter();
          await writer.write(buffer);
          writer.releaseLock();
          printed = true;
        } catch (serialErr) {
          console.error("Direct WebSerial print failed:", serialErr);
        }
      }

      // Check previously permitted Serial ports silently without prompt
      if (!printed && isSerialSupported()) {
        try {
          const nav = navigator as any;
          const ports = await nav.serial.getPorts();
          if (ports && ports.length > 0) {
            const port = ports[0];
            if (!port.readable && !port.writable) {
              await port.open({ baudRate: config.baudRate || 9600 });
            }
            activeSerialPort = port;
            const writer = port.writable.getWriter();
            await writer.write(buffer);
            writer.releaseLock();
            printed = true;
          }
        } catch (silentSerialErr) {
          console.warn("[USB/Serial] Silent port reconnect error:", silentSerialErr);
        }
      }

      // Check previously permitted USB devices silently without prompt
      if (!printed && isUsbSupported()) {
        try {
          const nav = navigator as any;
          const devices = await nav.usb.getDevices();
          if (devices && devices.length > 0) {
            const device = devices[0];
            if (!device.opened) {
              await device.open();
              if (device.configuration === null) {
                await device.selectConfiguration(1);
              }
              await device.claimInterface(0);
            }
            activeUsbDevice = device;
            const endpoint = device.configuration?.interfaces?.[0]?.alternate?.endpoints?.find(
              (ep: any) => ep.direction === "out"
            );
            const endpointNumber = endpoint ? endpoint.endpointNumber : 1;
            await device.transferOut(endpointNumber, buffer);
            printed = true;
          }
        } catch (silentUsbErr) {
          console.warn("[WebUSB] Silent device reconnect error:", silentUsbErr);
        }
      }

      // Only if no previously permitted port/device is found, prompt the user
      if (!printed) {
        const pairRes = await pairUsbSerialPrinter(config.baudRate || 9600);
        if (!pairRes.success || (!activeSerialPort && !activeUsbDevice)) {
          throw new Error(pairRes.message || "USB/Serial printer not connected.");
        }

        if (activeUsbDevice) {
          const endpoint = activeUsbDevice.configuration?.interfaces?.[0]?.alternate?.endpoints?.find(
            (ep: any) => ep.direction === "out"
          );
          const endpointNumber = endpoint ? endpoint.endpointNumber : 1;
          await activeUsbDevice.transferOut(endpointNumber, buffer);
          printed = true;
        } else if (activeSerialPort) {
          const writer = activeSerialPort.writable.getWriter();
          await writer.write(buffer);
          writer.releaseLock();
          printed = true;
        }
      }

      if (printed) {
        if (config.enableBuzzer !== false) {
          playPrinterSoundAlert();
        }
        return {
          success: true,
          message: `Printed successfully to USB/Serial printer: ${config.deviceName || "Thermal Printer"}`,
        };
      } else {
        throw new Error("Could not send data to USB or Serial printer.");
      }
    } catch (err: any) {
      console.warn("[Printer Service] USB print unavailable, falling back to System Print Driver:", err);
      return await printViaSystemDriver(data, config);
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
        if (json.success) {
          if (config.enableBuzzer !== false) {
            playPrinterSoundAlert();
          }
          return {
            success: true,
            message: json.message,
          };
        }
      }

      throw new Error(`Network printer responded with status ${resp.status}`);
    } catch (err: any) {
      console.warn("[Printer Service] Network print unavailable, falling back to System Print Driver:", err);
      return await printViaSystemDriver(data, config);
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
    digitalStoreUrl: shopInfo?.additional_infos?.website || getDigitalStoreUrl(shopInfo?.id),
    includeDigitalStoreQr: config.includeDigitalStoreQr,
    digitalStoreQrMessage: config.digitalStoreQrMessage,
  };

  return await printReceipt(testData, config);
}
