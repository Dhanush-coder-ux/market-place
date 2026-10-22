import React, { useState, useEffect } from "react";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { createPortal } from "react-dom";
import {
  X,
  Printer,
  Bluetooth,
  Usb,
  Wifi,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Sliders,
  Save,
  Scissors,
  DollarSign,
  Radio,
} from "lucide-react";
import {
  PrinterConfig,
  getPrinterConfig,
  savePrinterConfig,
  isBluetoothSupported,
  isSerialSupported,
  isUsbSupported,
  pairBluetoothPrinter,
  pairUsbSerialPrinter,
  testNetworkPrinter,
  printTestReceipt,
  DEFAULT_PRINTER_CONFIG,
  PrinterConnectionType,
  PaperWidth,
} from "../utils/printerService";
import { useToast } from "@/context/ToastContext";

interface PrinterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopData?: any;
}

export const PrinterConfigModal: React.FC<PrinterConfigModalProps> = ({
  isOpen,
  onClose,
  shopData,
}) => {
  const { showToast } = useToast();
  const [config, setConfig] = useState<PrinterConfig>(DEFAULT_PRINTER_CONFIG);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Load saved config on open
  useEffect(() => {
    if (isOpen) {
      const loaded = getPrinterConfig();
      setConfig(loaded);
      setStatusMessage(null);
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => document.body.classList.remove("no-scroll");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    savePrinterConfig(config);
    showToast("Printer configuration saved successfully!", "success");
    onClose();
  };

  const handlePairBluetooth = async () => {
    setIsConnecting(true);
    setStatusMessage(null);
    try {
      const res = await pairBluetoothPrinter();
      if (res.success) {
        setConfig((prev) => ({
          ...prev,
          deviceName: res.deviceName,
          deviceId: res.deviceId,
          connectionType: "bluetooth",
        }));
        setStatusMessage({ type: "success", text: res.message });
        showToast(res.message, "success");
      } else {
        setStatusMessage({ type: "error", text: res.message });
        showToast(res.message, "error");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePairUsb = async () => {
    setIsConnecting(true);
    setStatusMessage(null);
    try {
      const res = await pairUsbSerialPrinter(config.baudRate || 9600);
      if (res.success) {
        setConfig((prev) => ({
          ...prev,
          deviceName: res.deviceName,
          connectionType: "usb",
        }));
        setStatusMessage({ type: "success", text: res.message });
        showToast(res.message, "success");
      } else {
        setStatusMessage({ type: "error", text: res.message });
        showToast(res.message, "error");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestNetwork = async () => {
    if (!config.networkIp) {
      setStatusMessage({ type: "error", text: "Please enter a valid printer IP address." });
      return;
    }
    setIsConnecting(true);
    setStatusMessage(null);
    try {
      const res = await testNetworkPrinter(config.networkIp, config.networkPort || 9100);
      if (res.success) {
        setStatusMessage({ type: "success", text: res.message });
        showToast(res.message, "success");
      } else {
        setStatusMessage({ type: "error", text: res.message });
        showToast(res.message, "error");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePrintTest = async () => {
    setIsTesting(true);
    setStatusMessage(null);
    try {
      const res = await printTestReceipt(config, shopData);
      if (res.success) {
        setStatusMessage({ type: "success", text: res.message });
        showToast("Test receipt sent to printer!", "success");
      } else {
        setStatusMessage({ type: "error", text: res.message });
        showToast(res.message, "error");
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to print test receipt." });
    } finally {
      setIsTesting(false);
    }
  };

  const tabs: Array<{
    id: PrinterConnectionType;
    label: string;
    icon: React.ReactNode;
    subtitle: string;
    isSupported?: boolean;
  }> = [
    {
      id: "bluetooth",
      label: "Bluetooth",
      icon: <Bluetooth size={17} />,
      subtitle: "Wireless POS & Mobile",
      isSupported: isBluetoothSupported(),
    },
    {
      id: "network",
      label: "WiFi / LAN",
      icon: <Wifi size={17} />,
      subtitle: "Ethernet & IP Printers",
      isSupported: true,
    },
    {
      id: "usb",
      label: "USB / Serial",
      icon: <Usb size={17} />,
      subtitle: "Direct Cable Connection",
      isSupported: isSerialSupported() || isUsbSupported(),
    },
    {
      id: "system",
      label: "System Driver",
      icon: <Monitor size={17} />,
      subtitle: "Windows / Mac Spooler",
      isSupported: true,
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[10005] flex items-center justify-center p-3 sm:p-4 font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden flex flex-col min-h-0 max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Printer size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">Printers Config</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 tracking-wider">
                  Hardware Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Connect and configure any Bluetooth, WiFi/LAN, USB or System thermal receipt printer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-6 custom-scrollbar modal-content">
          
          {/* Connection Type Tabs */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
              Select Printer Connection Interface
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {tabs.map((tab) => {
                const isActive = config.connectionType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setConfig((prev) => ({ ...prev, connectionType: tab.id }));
                      setStatusMessage(null);
                    }}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/15 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {tab.icon}
                      </div>
                      {isActive && <CheckCircle2 size={16} className="text-blue-600" />}
                    </div>
                    <div className="font-bold text-[13px] text-slate-800 leading-tight">
                      {tab.label}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                      {tab.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Specific Connection Panel */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4">
            
            {/* 1. BLUETOOTH TAB */}
            {config.connectionType === "bluetooth" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bluetooth size={16} className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Bluetooth Thermal Printer Setup
                    </span>
                  </div>
                  {!isBluetoothSupported() ? (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertCircle size={11} /> Chrome/Edge Recommended
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={11} /> Web Bluetooth Ready
                    </span>
                  )}
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">Connected Device</div>
                    <div className="font-semibold text-slate-800 text-[13px] truncate">
                      {config.deviceName || "No Bluetooth printer paired yet"}
                    </div>
                    {config.deviceId && (
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                        ID: {config.deviceId}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handlePairBluetooth}
                    disabled={isConnecting}
                    className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <>
                        <RotateCw size={14} className="animate-spin" /> Scanning...
                      </>
                    ) : (
                      <>
                        <Radio size={14} /> Scan & Pair Printer
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Turn on your mobile Bluetooth thermal printer, ensure it's in pairing mode, and click "Scan & Pair Printer".
                </p>
              </div>
            )}

            {/* 2. WIFI / LAN NETWORK TAB */}
            {config.connectionType === "network" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi size={16} className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Network Thermal Printer (WiFi / LAN)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full">
                    ESC/POS Raw JetDirect
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Printer IP Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 192.168.1.100"
                      value={config.networkIp || ""}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, networkIp: e.target.value.trim() }))
                      }
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Port (Default 9100)
                    </label>
                    <input
                      type="number"
                      placeholder="9100"
                      value={config.networkPort || 9100}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          networkPort: parseInt(e.target.value) || 9100,
                        }))
                      }
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    Direct print to Ethernet / Wi-Fi receipt printer via local network socket.
                  </span>
                  <button
                    type="button"
                    onClick={handleTestNetwork}
                    disabled={isConnecting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <RotateCw size={13} className="animate-spin" />
                    ) : (
                      <Play size={13} />
                    )}
                    Ping / Test IP
                  </button>
                </div>
              </div>
            )}

            {/* 3. USB / SERIAL TAB */}
            {config.connectionType === "usb" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Usb size={16} className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">
                      USB & Serial Counter Printer Setup
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    WebSerial / WebUSB
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Baud Rate (Speed)
                    </label>
                    <ReusableSelect
                      value={String(config.baudRate || 9600)}
                      onValueChange={(val) =>
                        setConfig((prev) => ({
                          ...prev,
                          baudRate: parseInt(val) || 9600,
                        }))
                      }
                      options={[
                        { label: "9600 bps (Standard Thermal)", value: "9600" },
                        { label: "19200 bps", value: "19200" },
                        { label: "38400 bps", value: "38400" },
                        { label: "57600 bps", value: "57600" },
                        { label: "115200 bps (High Speed USB)", value: "115200" },
                      ]}
                      placeholder="Select baud rate"
                      className="h-9 py-2 px-3 text-xs bg-white border-slate-200 rounded-lg font-medium text-slate-800 shadow-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Connected USB Port / Name
                    </label>
                    <div className="h-9 px-3 bg-slate-100 border border-slate-200 rounded-lg flex items-center text-xs font-medium text-slate-700 truncate">
                      {config.deviceName || "No port selected"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    Connects directly to USB receipt printers (Epson, TVS, Rongta, Xprinter, etc.).
                  </span>
                  <button
                    type="button"
                    onClick={handlePairUsb}
                    disabled={isConnecting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <RotateCw size={13} className="animate-spin" />
                    ) : (
                      <Usb size={13} />
                    )}
                    Select USB / COM Port
                  </button>
                </div>
              </div>
            )}

            {/* 4. SYSTEM DRIVER TAB */}
            {config.connectionType === "system" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor size={16} className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">
                      System Printer Driver (OS Spooler)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={11} /> Universal 100% Compatible
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Uses your operating system's installed printer driver (Windows Print Spooler, Mac CUPS, or Network Shared Printer). Prints directly via tailored thermal dimensions without needing browser hardware permissions.
                </p>
              </div>
            )}
          </div>

          {/* Status Message Banner if present */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-150 ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : statusMessage.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle size={16} className="shrink-0 text-red-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Thermal Receipt & Hardware Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-slate-500" />
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Receipt Paper & Hardware Controls
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Paper Width Selector */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Paper Roll Width
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["80mm", "58mm"] as PaperWidth[]).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, paperWidth: w }))}
                      className={`h-9 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        config.paperWidth === w
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {w === "80mm" ? "80 mm (3 Inch)" : "58 mm (2 Inch)"}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400">
                  {config.paperWidth === "80mm"
                    ? "Standard 42-48 columns desktop POS"
                    : "Compact 32 columns portable thermal roll"}
                </div>
              </div>

              {/* Hardware Signals: Auto Cut & Cash Drawer */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Hardware Automation
                </label>
                
                {/* Auto Cut */}
                <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
                  <span className="flex items-center gap-2 font-medium">
                    <Scissors size={14} className="text-slate-400" /> Auto Cut Paper
                  </span>
                  <input
                    type="checkbox"
                    checked={config.autoCut}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, autoCut: e.target.checked }))
                    }
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                {/* Cash Drawer */}
                <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer border-t border-slate-100 pt-2">
                  <span className="flex items-center gap-2 font-medium">
                    <DollarSign size={14} className="text-slate-400" /> Open Cash Drawer
                  </span>
                  <input
                    type="checkbox"
                    checked={config.openCashDrawer}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, openCashDrawer: e.target.checked }))
                    }
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              </div>

            </div>

            {/* Receipt Footer Message */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Custom Receipt Footer Note</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Printed above tear-off
                </span>
              </label>
              <input
                type="text"
                placeholder="Thank you for shopping with us! Please visit again."
                value={config.footerText || ""}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, footerText: e.target.value }))
                }
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-2xs"
              />
              <p className="text-[11px] text-slate-400 leading-tight">
                Printed at the bottom of thermal receipts before paper cut.
              </p>
            </div>

          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-150 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrintTest}
              disabled={isTesting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isTesting ? (
                <RotateCw size={14} className="animate-spin" />
              ) : (
                <Play size={14} className="text-blue-600 fill-blue-600" />
              )}
              Print Test Receipt
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Save size={15} /> Save Configuration
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default PrinterConfigModal;
