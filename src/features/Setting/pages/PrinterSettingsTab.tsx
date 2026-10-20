import React, { useState, useEffect } from "react";
import {
  Printer,
  Bluetooth,
  Usb,
  Wifi,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Play,
  Plus,
  Trash2,
  Edit2,
  Star,
  Check,
  Scissors,
  DollarSign,
  Radio,
  Volume2,
  X,
} from "lucide-react";
import {
  SavedPrinter,
  PrinterRole,
  PrinterConnectionType,
  PaperWidth,
  DEFAULT_PRINTER_CONFIG,
  getPrintersList,
  savePrintersList,
  setDefaultPrinter,
  pairBluetoothPrinter,
  pairUsbSerialPrinter,
  testNetworkPrinter,
  printTestReceipt,
  parseHostAndPort,
  playPrinterSoundAlert,
} from "@/features/billing/utils/printerService";
import { useToast } from "@/context/ToastContext";

const ROLE_LABELS: Record<PrinterRole, { label: string; badge: string }> = {
  receipt: {
    label: "Receipt Billing",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  kitchen: {
    label: "Kitchen / KOT",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  label: {
    label: "Barcode / Label",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
  },
  backup: {
    label: "Backup Printer",
    badge: "bg-slate-50 text-slate-600 border-slate-200",
  },
};

export const PrinterSettingsTab: React.FC = () => {
  const { showToast } = useToast();
  const [printers, setPrinters] = useState<SavedPrinter[]>([]);
  const [editingPrinter, setEditingPrinter] = useState<SavedPrinter | null>(null);
  const [isNewPrinter, setIsNewPrinter] = useState(false);
  const [isTestingId, setIsTestingId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Load configured printers list on mount and clean up any accidental host typos
  useEffect(() => {
    const list = getPrintersList();
    const healed = list.map((p) => {
      if (p.connectionType === "network" && p.networkIp) {
        const { host, port } = parseHostAndPort(p.networkIp, p.networkPort || 9100);
        return {
          ...p,
          networkIp: host,
          networkPort: port,
        };
      }
      return p;
    });

    if (JSON.stringify(healed) !== JSON.stringify(list)) {
      savePrintersList(healed);
      setPrinters(healed);
    } else {
      setPrinters(list);
    }
  }, []);

  // Open modal to add a new printer
  const handleAddNew = () => {
    const count = printers.length + 1;
    const newPrinter: SavedPrinter = {
      ...DEFAULT_PRINTER_CONFIG,
      id: "printer-" + Date.now(),
      name: `Printer ${count}`,
      role: count === 1 ? "receipt" : "kitchen",
      isDefault: printers.length === 0,
      createdAt: new Date().toISOString(),
      connectionType: "network",
      networkIp: "192.168.1.100",
      networkPort: 9100,
    };
    setEditingPrinter(newPrinter);
    setIsNewPrinter(true);
    setStatusMessage(null);
  };

  // Open modal to edit existing printer
  const handleEdit = (printer: SavedPrinter) => {
    setEditingPrinter({ ...printer });
    setIsNewPrinter(false);
    setStatusMessage(null);
  };

  // Delete printer
  const handleDelete = (id: string, name: string) => {
    if (printers.length <= 1) {
      showToast("At least one printer configuration must be retained.", "error");
      return;
    }
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      const updated = printers.filter((p) => p.id !== id);
      // If deleted printer was default, mark first remaining as default
      if (printers.find((p) => p.id === id)?.isDefault && updated.length > 0) {
        updated[0].isDefault = true;
      }
      savePrintersList(updated);
      setPrinters(updated);
      showToast(`Printer "${name}" removed.`, "success");
    }
  };

  // Set printer as default
  const handleSetDefault = (id: string, name: string) => {
    const updated = setDefaultPrinter(id);
    setPrinters(updated);
    showToast(`"${name}" is now the default receipt printer.`, "success");
  };

  // Pair Bluetooth inside editor
  const handlePairBluetooth = async () => {
    if (!editingPrinter) return;
    setIsConnecting(true);
    setStatusMessage(null);
    try {
      const res = await pairBluetoothPrinter();
      if (res.success) {
        setEditingPrinter((prev) =>
          prev
            ? {
                ...prev,
                deviceName: res.deviceName,
                deviceId: res.deviceId,
                connectionType: "bluetooth",
              }
            : null
        );
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

  // Pair USB inside editor
  const handlePairUsb = async () => {
    if (!editingPrinter) return;
    setIsConnecting(true);
    setStatusMessage(null);
    try {
      const res = await pairUsbSerialPrinter(editingPrinter.baudRate || 9600);
      if (res.success) {
        setEditingPrinter((prev) =>
          prev
            ? {
                ...prev,
                deviceName: res.deviceName,
                connectionType: "usb",
              }
            : null
        );
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

  // Test network IP ping inside editor
  const handleTestNetwork = async () => {
    if (!editingPrinter?.networkIp) {
      setStatusMessage({ type: "error", text: "Please enter a valid printer IP address." });
      return;
    }
    setIsConnecting(true);
    setStatusMessage(null);
    try {
      const res = await testNetworkPrinter(
        editingPrinter.networkIp,
        editingPrinter.networkPort || 9100
      );
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

  // Save printer from editor
  const handleSaveEditor = () => {
    if (!editingPrinter) return;
    if (!editingPrinter.name.trim()) {
      showToast("Please enter a printer name.", "error");
      return;
    }

    const sanitized = { ...editingPrinter };
    if (sanitized.connectionType === "network") {
      const { host, port } = parseHostAndPort(sanitized.networkIp, sanitized.networkPort || 9100);
      sanitized.networkIp = host;
      sanitized.networkPort = port;
    }

    let updated: SavedPrinter[];
    if (isNewPrinter) {
      if (sanitized.isDefault) {
        // Unmark all others
        updated = [...printers.map((p) => ({ ...p, isDefault: false })), sanitized];
      } else {
        updated = [...printers, sanitized];
      }
    } else {
      updated = printers.map((p) => {
        if (p.id === sanitized.id) {
          return sanitized;
        }
        if (sanitized.isDefault) {
          return { ...p, isDefault: false };
        }
        return p;
      });
    }

    savePrintersList(updated);
    setPrinters(updated);
    setEditingPrinter(null);
    showToast(`Printer "${sanitized.name}" saved successfully!`, "success");
  };

  // Test print to a specific printer
  const handleTestPrint = async (printer: SavedPrinter) => {
    setIsTestingId(printer.id);
    try {
      const res = await printTestReceipt(printer);
      if (res.success) {
        showToast(`Test receipt sent to "${printer.name}"!`, "success");
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to print test receipt.", "error");
    } finally {
      setIsTestingId(null);
    }
  };

  const connectionTabs: Array<{
    id: PrinterConnectionType;
    label: string;
    icon: React.ReactNode;
    subtitle: string;
  }> = [
    {
      id: "bluetooth",
      label: "Bluetooth",
      icon: <Bluetooth size={16} />,
      subtitle: "Wireless Mobile POS",
    },
    {
      id: "network",
      label: "WiFi / LAN",
      icon: <Wifi size={16} />,
      subtitle: "Network Ethernet / IP",
    },
    {
      id: "usb",
      label: "USB / Serial",
      icon: <Usb size={16} />,
      subtitle: "Direct USB / COM Cable",
    },
    {
      id: "system",
      label: "System Driver",
      icon: <Monitor size={16} />,
      subtitle: "Windows / Mac Spooler",
    },
  ];

  const getConnectionIcon = (type: PrinterConnectionType) => {
    switch (type) {
      case "bluetooth":
        return <Bluetooth size={16} className="text-blue-500" />;
      case "network":
        return <Wifi size={16} className="text-emerald-500" />;
      case "usb":
        return <Usb size={16} className="text-amber-500" />;
      case "system":
        return <Monitor size={16} className="text-slate-500" />;
    }
  };

  const defaultPrinter = printers.find((p) => p.isDefault) || printers[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* ── Top Header Card ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Printer size={24} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Receipt & Invoice Printers</h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {printers.length} {printers.length === 1 ? "Printer" : "Printers"} Configured
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Add multiple thermal printers across counters, kitchen/KOT, bar, and packaging slips.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {defaultPrinter && (
            <button
              type="button"
              onClick={() => handleTestPrint(defaultPrinter)}
              disabled={Boolean(isTestingId)}
              className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
              title="Test default receipt printer"
            >
              {isTestingId === defaultPrinter.id ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                  <span>Printing...</span>
                </>
              ) : (
                <>
                  <Play size={13} className="text-emerald-500 fill-emerald-500" />
                  <span>Quick Test</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleAddNew}
            className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Printer</span>
          </button>
        </div>
      </div>

      {/* ── Configured Printers List ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Connected Printer Stations
          </span>
          <span className="text-xs text-slate-400">
            Click <Star size={11} className="inline text-amber-500 fill-amber-500" /> to set as default checkout printer
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {printers.map((printer) => {
            const roleCfg = ROLE_LABELS[printer.role || "receipt"];
            const isDefault = printer.isDefault;

            return (
              <div
                key={printer.id}
                className={`relative rounded-2xl border p-5 transition-all flex flex-col justify-between gap-4 ${
                  isDefault
                    ? "bg-gradient-to-br from-emerald-50/40 via-white to-blue-50/30 border-emerald-300 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-400/40"
                    : "bg-white border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow"
                }`}
              >
                {/* Card Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                          isDefault
                            ? "bg-emerald-100/60 border-emerald-200 text-emerald-700"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        {getConnectionIcon(printer.connectionType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {printer.name}
                          </h4>
                          {isDefault && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <Star size={10} className="fill-emerald-600 text-emerald-600" />
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {printer.connectionType === "network" &&
                            `WiFi / LAN • ${printer.networkIp || "192.168.1.100"}:${printer.networkPort || 9100}`}
                          {printer.connectionType === "bluetooth" &&
                            `Bluetooth • ${printer.deviceName || "Paired Device"}`}
                          {printer.connectionType === "usb" &&
                            `USB / Serial • Baud ${printer.baudRate || 9600}`}
                          {printer.connectionType === "system" &&
                            `System Driver • ${printer.deviceName || "Windows Spooler"}`}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0 ${roleCfg.badge}`}
                    >
                      {roleCfg.label}
                    </span>
                  </div>

                  {/* Badges / specs */}
                  <div className="flex items-center gap-2 mt-3.5 flex-wrap text-[11px] text-slate-600 font-medium">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100/80 border border-slate-200/60 text-slate-700 font-mono text-[10.5px]">
                      {printer.paperWidth === "58mm" ? "58mm (2-inch)" : "80mm (3-inch)"}
                    </span>
                    {printer.autoCut && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/60 flex items-center gap-1 text-[10.5px]">
                        <Scissors size={10} className="text-slate-400" />
                        Auto-cut
                      </span>
                    )}
                    {printer.openCashDrawer && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/60 flex items-center gap-1 text-[10.5px]">
                        <DollarSign size={10} className="text-slate-400" />
                        Drawer Kick
                      </span>
                    )}
                    {printer.enableBuzzer !== false && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/60 flex items-center gap-1 text-[10.5px]">
                        <Volume2 size={10} className="text-blue-500" />
                        Sound Buzzer
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(printer.id, printer.name)}
                        className="h-8 px-2.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-semibold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                        title="Set as default checkout printer"
                      >
                        <Star size={11} className="text-slate-400" />
                        <span>Set Default</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleTestPrint(printer)}
                      disabled={isTestingId === printer.id}
                      className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      title="Send test receipt"
                    >
                      {isTestingId === printer.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Play size={10} className="text-emerald-500 fill-emerald-500" />
                          <span>Test Print</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(printer)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer"
                      title="Edit Printer"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(printer.id, printer.name)}
                      disabled={printers.length <= 1}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                      title="Delete Printer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Editor Modal (Add / Edit Printer) ── */}
      {editingPrinter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col w-full max-w-xl max-h-[92vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-sm">
                  <Printer size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isNewPrinter ? "Add New Printer" : `Edit "${editingPrinter.name}"`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure device connection, paper width, and hardware triggers.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingPrinter(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              {/* Status Alert if any */}
              {statusMessage && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium animate-in fade-in duration-150 ${
                    statusMessage.type === "success"
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                      : "bg-rose-50/80 border-rose-200 text-rose-800"
                  }`}
                >
                  {statusMessage.type === "success" ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* Printer Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Printer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingPrinter.name}
                    onChange={(e) =>
                      setEditingPrinter((prev) => (prev ? { ...prev, name: e.target.value } : null))
                    }
                    placeholder="e.g. Counter 1 Thermal, Kitchen POS"
                    className="w-full h-10 px-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Printer Role / Location</label>
                  <select
                    value={editingPrinter.role || "receipt"}
                    onChange={(e) =>
                      setEditingPrinter((prev) =>
                        prev ? { ...prev, role: e.target.value as PrinterRole } : null
                      )
                    }
                    className="w-full h-10 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm cursor-pointer"
                  >
                    <option value="receipt">Receipt Billing (Main POS)</option>
                    <option value="kitchen">Kitchen / KOT Order Slip</option>
                    <option value="label">Barcode / Price Label</option>
                    <option value="backup">Backup Printer</option>
                  </select>
                </div>
              </div>

              {/* Connection Type Selection Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Connection Interface</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {connectionTabs.map((tab) => {
                    const isSelected = editingPrinter.connectionType === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() =>
                          setEditingPrinter((prev) =>
                            prev ? { ...prev, connectionType: tab.id } : null
                          )
                        }
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-50/70 border-blue-400 text-blue-900 ring-2 ring-blue-500/10 shadow-sm"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={isSelected ? "text-blue-600" : "text-slate-400"}
                          >
                            {tab.icon}
                          </span>
                          {isSelected && (
                            <CheckCircle2 size={13} className="text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-tight mt-1">{tab.label}</p>
                          <p className="text-[10px] text-slate-400 font-medium leading-tight">
                            {tab.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Connection Specific Form Fields */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                {editingPrinter.connectionType === "network" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Wifi size={14} className="text-emerald-500" />
                        Network / LAN Thermal Settings
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">ESC/POS Port 9100</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600">
                          IP Address
                        </label>
                        <input
                          type="text"
                          value={editingPrinter.networkIp || ""}
                          onChange={(e) =>
                            setEditingPrinter((prev) =>
                              prev ? { ...prev, networkIp: e.target.value } : null
                            )
                          }
                          placeholder="e.g. 192.168.1.100"
                          className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-blue-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600">Port</label>
                        <input
                          type="number"
                          value={editingPrinter.networkPort || 9100}
                          onChange={(e) =>
                            setEditingPrinter((prev) =>
                              prev ? { ...prev, networkPort: Number(e.target.value) } : null
                            )
                          }
                          className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestNetwork}
                      disabled={isConnecting}
                      className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isConnecting ? (
                        <>
                          <div className="w-3 h-3 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                          <span>Pinging...</span>
                        </>
                      ) : (
                        <>
                          <Radio size={12} className="text-emerald-500" />
                          <span>Ping / Test IP</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {editingPrinter.connectionType === "bluetooth" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Bluetooth size={14} className="text-blue-500" />
                        Bluetooth Thermal Pairing
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      Pair directly with your Bluetooth portable thermal printer via Web Bluetooth.
                    </p>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handlePairBluetooth}
                        disabled={isConnecting}
                        className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {isConnecting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            <span>Scanning...</span>
                          </>
                        ) : (
                          <>
                            <Bluetooth size={14} />
                            <span>Pair Bluetooth Printer</span>
                          </>
                        )}
                      </button>

                      {editingPrinter.deviceName && (
                        <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                          {editingPrinter.deviceName}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {editingPrinter.connectionType === "usb" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Usb size={14} className="text-amber-500" />
                        USB / Serial Port Configuration
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600">Baud Rate</label>
                        <select
                          value={editingPrinter.baudRate || 9600}
                          onChange={(e) =>
                            setEditingPrinter((prev) =>
                              prev ? { ...prev, baudRate: Number(e.target.value) } : null
                            )
                          }
                          className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800"
                        >
                          <option value={9600}>9600 (Standard)</option>
                          <option value={19200}>19200</option>
                          <option value={38400}>38400</option>
                          <option value={115200}>115200 (High Speed)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600">Port Pair</label>
                        <button
                          type="button"
                          onClick={handlePairUsb}
                          disabled={isConnecting}
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <Usb size={12} className="text-amber-500" />
                          <span>Connect USB Port</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {editingPrinter.connectionType === "system" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Monitor size={14} className="text-slate-500" />
                        OS Spooler / System Driver
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Routes print jobs through your standard Windows/Mac print dialog spooler.
                      Compatible with any USB or network printer installed on this operating system.
                    </p>
                  </div>
                )}
              </div>

              {/* Paper Roll Dimensions */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Paper Roll Width</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { width: "80mm" as PaperWidth, label: "80 mm (3 inch)", sub: "Standard 42/48 col POS thermal roll" },
                    { width: "58mm" as PaperWidth, label: "58 mm (2 inch)", sub: "Compact 32 col mobile printer" },
                  ].map((p) => {
                    const isSelected = editingPrinter.paperWidth === p.width;
                    return (
                      <button
                        key={p.width}
                        type="button"
                        onClick={() =>
                          setEditingPrinter((prev) =>
                            prev ? { ...prev, paperWidth: p.width } : null
                          )
                        }
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50/70 border-emerald-400 text-emerald-950 ring-2 ring-emerald-500/10 shadow-sm"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{p.label}</span>
                          {isSelected && (
                            <CheckCircle2 size={14} className="text-emerald-600" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{p.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hardware Triggers & Default Checkbox */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Auto-Cut Paper</p>
                    <p className="text-[11px] text-slate-400">Trigger automatic hardware blade cutter after receipt</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingPrinter.autoCut}
                    onChange={(e) =>
                      setEditingPrinter((prev) =>
                        prev ? { ...prev, autoCut: e.target.checked } : null
                      )
                    }
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Kick Cash Drawer</p>
                    <p className="text-[11px] text-slate-400">Send RJ11 pulse to open cash drawer on receipt print</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingPrinter.openCashDrawer}
                    onChange={(e) =>
                      setEditingPrinter((prev) =>
                        prev ? { ...prev, openCashDrawer: e.target.checked } : null
                      )
                    }
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <div className="pr-2">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Volume2 size={13} className="text-blue-600" />
                      Printer Sound / Buzzer Alert
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Emit ESC/POS hardware buzzer and audio chime when bill finishes printing
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => playPrinterSoundAlert()}
                      className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="Test Audio Chime"
                    >
                      <Volume2 size={12} className="text-blue-600" />
                      <span>Test Sound</span>
                    </button>
                    <input
                      type="checkbox"
                      checked={editingPrinter.enableBuzzer !== false}
                      onChange={(e) =>
                        setEditingPrinter((prev) =>
                          prev ? { ...prev, enableBuzzer: e.target.checked } : null
                        )
                      }
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                    />
                  </div>
                </div>

                {editingPrinter.enableBuzzer !== false && (
                  <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50/60 rounded-lg border border-blue-100 text-[11px]">
                    <span className="text-slate-600 font-medium">Buzzer Beep Count:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setEditingPrinter((prev) =>
                              prev ? { ...prev, buzzerBeeps: num } : null
                            );
                            playPrinterSoundAlert();
                          }}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                            (editingPrinter.buzzerBeeps || 2) === num
                              ? "bg-blue-600 text-white shadow-2xs"
                              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {num} {num === 1 ? "Beep" : "Beeps"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <div>
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Star size={13} className="text-amber-500 fill-amber-500" />
                      Make Default Checkout Printer
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Use this printer by default during fast billing checkout
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingPrinter.isDefault}
                    onChange={(e) =>
                      setEditingPrinter((prev) =>
                        prev ? { ...prev, isDefault: e.target.checked } : null
                      )
                    }
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleTestPrint(editingPrinter)}
                disabled={Boolean(isTestingId)}
                className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isTestingId === editingPrinter.id ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                    <span>Printing Test...</span>
                  </>
                ) : (
                  <>
                    <Play size={12} className="text-emerald-500 fill-emerald-500" />
                    <span>Test This Printer</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPrinter(null)}
                  className="h-9 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditor}
                  className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
                >
                  <Check size={14} strokeWidth={2.5} />
                  <span>Save Printer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
