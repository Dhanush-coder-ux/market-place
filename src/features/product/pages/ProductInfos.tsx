import React, { useState, useEffect, useMemo, Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Package, Search, Filter, Bookmark, Trash2,
  ChevronDown, ChevronRight, Layers, AlertTriangle,
  X, AlertCircle, Calendar, Hash, ExternalLink,
  Copy, Check, IndianRupee
} from "lucide-react";
import { VariantRows, BatchCards, SerialBadgeList } from "../../inventory/components/StockTree";
import { useHeader } from "@/context/HeaderContext";
import { useApi, useApiLoading } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { ColumnPicker } from "@/components/common/ColumnPicker";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { GradientButton } from "@/components/ui/GradientButton";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { StatCard } from "@/components/common/StatsCard";
import Loader from "@/components/common/Loader";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import type { InventoryRecord } from "@/types/api";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";

// --- Helpers (logic unchanged) ---
const formatCurrency = (amount?: any) => {
  if (amount === undefined || amount === null || amount === "—") return "—";
  const num = Number(amount);
  if (isNaN(num)) return amount;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const columnLabels: Record<string, string> = {
  ui_id: "SKU",
  barcode: "Barcode",
  buy_price: "Buy Price",
  sell_price: "Sell Price",
  stocks: "Stock",
  status: "Status",
  category: "Category",
  unit: "Unit",
  brand: "Brand",
  supplier: "Supplier",
  serial_number: "Serials",
  reorder_point: "Reorder Point",
};

const columnOrder = [
  "category",
  "supplier",
  "unit",
  "brand",
  "buy_price",
  "sell_price",
  "stocks",
  "status",
  "reorder_point",
  "ui_id",
  "barcode",
  "serial_number"
];

const hiddenProductColumns = new Set(["cost_to_make"]);

const sortKeys = (keys: string[]) => {
  return [...keys].sort((a, b) => {
    const idxA = columnOrder.indexOf(a);
    const idxB = columnOrder.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });
};

const getColumnLabel = (key: string) => {
  if (columnLabels[key]) return columnLabels[key];
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const getStockStatus = (stock: number, reorderPoint?: number) => {
  const s = Number(stock) || 0;
  const rp = Number(reorderPoint) || 10;
  if (s <= 0)
    return {
      label: "Out of stock",
      color: "text-red-600 bg-red-50 border-red-100",
      dot: "bg-red-500",
    };
  if (s <= rp)
    return {
      label: "Low stock",
      color: "text-amber-600 bg-amber-50 border-amber-100",
      dot: "bg-amber-400",
    };
  return {
    label: "In stock",
    color: "text-emerald-700 bg-emerald-50 border-emerald-100",
    dot: "bg-emerald-500",
  };
};



// --- Compact pill ---
const Pill = ({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "blue" | "purple" | "indigo";
}) => {
  const styles: Record<string, string> = {
    default: "text-slate-500 bg-slate-50 border-slate-100",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border leading-none ${styles[variant]}`}
    >
      {children}
    </span>
  );
};

// --- Copy SKU Button with Micro-Animation ---
const CopySKUButton = ({ val }: { val: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center p-0.5 rounded transition-all duration-200 ${
        copied ? "text-emerald-500 bg-emerald-50" : "text-slate-350 hover:text-blue-600 hover:bg-slate-100/80"
      }`}
      title="Copy SKU"
    >
      {copied ? (
        <Check size={10} className="animate-in zoom-in duration-200" />
      ) : (
        <Copy size={10} className="transition-transform duration-200 active:scale-75" />
      )}
    </button>
  );
};

/* â”€â”€â”€ Product Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ProductRow = React.memo(
  ({
    p,
    isSelected,
    onSelect,
    isExpanded,
    toggleExpand,
    selectedKeys,
  }: {
    p: InventoryRecord;
    isSelected: boolean;
    onSelect: (p: InventoryRecord) => void;
    isExpanded: boolean;
    toggleExpand: (id: string) => void;
    selectedKeys: string[];
  }) => {
    const datas = (p.datas as any) || {};

    const extractSerials = (val: any): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (val && typeof val === "object") {
        if (Array.isArray(val.serial_numbers)) return val.serial_numbers;
      }
      return [];
    };

    const combinations = useMemo(
      () => (p.variants || []).filter((v: any) => v && v.id !== null),
      [p.variants]
    );

    const batches = useMemo(
      () => (p.batches || []).filter((b: any) => b && b.id !== null),
      [p.batches]
    );

    const hasVariants = combinations.length > 0;
    const hasBatches = batches.length > 0;
    const hasSerials = extractSerials((p as any).serials || (p as any).serial_number).length > 0;
    const isExpandable = hasVariants || hasBatches || hasSerials;

    const rootSerials = extractSerials((p as any).serials || (p as any).serial_number);

    const { totalSerials, totalBatches } = useMemo(() => {
      let ts = rootSerials.length;
      let tb = batches.length;
      if (hasVariants) {
        combinations.forEach((c: any) => {
          const cDatas = c.datas || {};
          const cSerials = extractSerials(
            c.serial_numbers ||
              cDatas.serial_numbers ||
              (cDatas.datas && cDatas.datas.serial_numbers)
          );
          ts += cSerials.length;
          const cBatches = c.batches || [];
          tb += cBatches.length;
          cBatches.forEach((cb: any) => {
            ts += extractSerials(
              cb.serial_numbers || (cb.datas && cb.datas.serial_numbers)
            ).length;
          });
        });
      }
      return { totalSerials: ts, totalBatches: tb };
    }, [rootSerials, batches, hasVariants, combinations]);

    const [showAllBadges, setShowAllBadges] = useState(false);

    const badges: React.ReactNode[] = [];
    if (hasVariants)
      badges.push(
        <Pill key="var" variant="blue">
          <Layers size={9} /> {combinations.length} var
        </Pill>
      );
    if (totalBatches > 0)
      badges.push(
        <Pill key="batch" variant="indigo">
          <Calendar size={9} /> {totalBatches} batch
        </Pill>
      );
    if (totalSerials > 0)
      badges.push(
        <Pill key="serial" variant="purple">
          <Hash size={9} /> {totalSerials} serial
        </Pill>
      );

    const visibleBadges = showAllBadges ? badges : badges.slice(0, 2);
    const remainingBadges = badges.length - 2;

    const productName = p.name || "N/A";
    const initial = String(productName[0]).toUpperCase();

    return (
      <Fragment key={p.id}>
        <tr
          className={`group border-b border-slate-50 transition-colors cursor-pointer ${
            isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : isExpanded ? "bg-slate-50/70" : "hover:bg-slate-50/60"
          }`}
          onClick={() => onSelect(p)}
        >
          {/* Expand toggle */}
          <td className="px-3 py-2.5 text-center w-10">
            {isExpandable ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(p.id);
                }}
                className={`w-5 h-5 mx-auto rounded flex items-center justify-center transition-colors ${
                  isExpanded
                    ? "bg-blue-600 text-white"
                    : "text-blue-300 hover:text-blue-500"
                }`}
              >
                {isExpanded ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
              </button>
            ) : (
              <div className="w-5 h-5 mx-auto flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-slate-200" />
              </div>
            )}
          </td>

          {/* Product identity */}
          <td className="px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 text-[11px] font-semibold shrink-0 select-none overflow-hidden">
                {datas.images && datas.images.length > 0 ? (
                  <img src={datas.images[0]} alt={productName} className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[13px] font-medium text-slate-800 truncate leading-none">
                    {productName}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {visibleBadges}
                    {!showAllBadges && remainingBadges > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAllBadges(true);
                        }}
                        className="text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        +{remainingBadges}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium leading-none">
                  {(() => {
                    const rawSku = p.ui_id ? String(p.ui_id) : "";
                    if (!rawSku) {
                      return <span className="font-mono tabular-nums">—</span>;
                    }
                    const trimmedSku = rawSku.length > 12 ? `${rawSku.slice(0, 8)}...` : rawSku;
                    return (
                      <span className="flex items-center gap-1">
                        <span className="font-mono tabular-nums" title={rawSku}>
                          {trimmedSku}
                        </span>
                        <CopySKUButton val={rawSku} />
                      </span>
                    );
                  })()}
                  <span className="text-slate-200">·</span>
                  <span>{datas.brand || (p as any).brand || "Generic"}</span>
                  {(datas.gst || (p as any).gst) && (
                    <>
                      <span className="text-slate-200">·</span>
                      <span>GST {datas.gst || (p as any).gst}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </td>

          {/* Dynamic columns */}
          {selectedKeys.map((key) => {
            const value =
              datas[key] !== undefined && datas[key] !== null
                ? datas[key]
                : (p as any)[key];

            if (key === "buy_price" || key === "sell_price" || key === "price") {
              return (
                <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                  <span
                    className={`tabular-nums ${
                      key === "sell_price"
                        ? "text-[13px] font-bold text-slate-800"
                        : "text-[13px] font-semibold text-slate-700"
                    }`}
                  >
                    {hasVariants ? "—" : formatCurrency(value)}
                  </span>
                </td>
              );
            }

            if (key === "stocks" || key === "quantity") {
              return (
                <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                  <span className="text-[13px] font-semibold text-blue-600 tabular-nums">
                    {value}
                  </span>
                </td>
              );
            }

            if (key === "reorder_point") {
              return (
                <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                  <span className="text-[13px] font-semibold text-slate-700 tabular-nums">
                    {hasVariants ? "—" : (value !== undefined && value !== null ? value : "—")}
                  </span>
                </td>
              );
            }

            if (key === "status") {
              const stocks =
                datas.stocks !== undefined ? datas.stocks : (p as any).stocks;
              const reorderPoint = Number(
                (p as any).reorder_point ?? datas.reorder_point ?? 0
              );
              const status = getStockStatus(stocks, reorderPoint);
              return (
                <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border leading-none ${status.color}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </td>
              );
            }

            if (key === "serial_number") {
              const sList = extractSerials((p as any).serials || (p as any).serial_number);
              if (sList.length === 0 && totalSerials > 0) {
                return (
                  <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-[11px] text-slate-400">
                      See variants
                    </span>
                  </td>
                );
              }
              return (
                <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                  {sList.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-violet-50 text-violet-600 border border-violet-100 leading-none">
                        {sList[0]}
                      </span>
                      {sList.length > 1 && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          +{sList.length - 1}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-200 text-sm">—</span>
                  )}
                </td>
              );
            }

            if (key === "ui_id" || key === "barcode") {
              const rawSku = key === "ui_id"
                ? ((p as any).ui_id || datas.ui_id || "")
                : (p.barcode || datas.barcode || "");
              if (!rawSku) {
                return (
                  <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-[12px] font-medium text-slate-400">—</span>
                  </td>
                );
              }
              const textValue = String(rawSku);
              const trimmedSku = textValue.length > 16 ? `${textValue.slice(0, 12)}...` : textValue;
              return (
                <td key={key} className="px-3 py-2.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <span className="flex items-center gap-1 text-[12px] font-medium text-slate-600">
                    <span className="font-mono tabular-nums" title={textValue}>
                      {trimmedSku}
                    </span>
                    <CopySKUButton val={textValue} />
                  </span>
                </td>
              );
            }

            if (key === "category" || key === "supplier") {
              if (
                key === "category" &&
                selectedKeys.includes("supplier")
              ) {
                return (
                  <td key="cat_sup" className="px-3 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12px] font-medium text-slate-700 leading-none">
                        {datas.category ||
                          (p as any).category ||
                          "Uncategorized"}
                      </span>
                      <span className="text-[11px] text-slate-400 leading-none">
                        {datas.supplier ||
                          (p as any).supplier ||
                          "No supplier"}
                      </span>
                    </div>
                  </td>
                );
              }
              if (
                key === "supplier" &&
                selectedKeys.includes("category")
              )
                return null;
              return (
                <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                  <span className="text-[12px] font-medium text-slate-600">
                    {value || "—"}
                  </span>
                </td>
              );
            }

            const renderValue = () => {
              if (value === undefined || value === null) return "—";
              if (value === "") return "—";
              if (Array.isArray(value)) {
                if (value.length === 0) return "—";
                if (typeof value[0] === "object") {
                  return value.map((v: any) => {
                    if (v.name && v.values && Array.isArray(v.values)) {
                      return `${v.name} (${v.values.join('/')})`;
                    }
                    if (v.name) return v.name;
                    return JSON.stringify(v);
                  }).join(", ");
                }
                return value.join(", ");
              }
              if (typeof value === "object") return JSON.stringify(value);
              return String(value);
            };

            return (
              <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                <span className="text-[12px] font-medium text-slate-600">
                  {renderValue()}
                </span>
              </td>
            );
          })}

          {/* Actions */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap">
            <div className="flex items-center justify-end gap-0.5">
              <ChevronRight size={14} className={`transition-all duration-200 ${isSelected ? "text-blue-500 rotate-90" : "text-slate-300 group-hover:text-blue-500"}`} />
            </div>
          </td>
        </tr>

        {/* Expanded tree area */}
        {isExpanded && (
          <tr key={`${p.id}-expand`} className="bg-slate-50/40">
            <td
              colSpan={selectedKeys.length + 3}
              className="px-0 py-0 border-b border-slate-50"
            >
              <div className="ml-10 mr-4 my-3 space-y-3 border-l border-slate-100 pl-6">
                {!hasVariants && rootSerials.length > 0 && (
                  <div className="bg-white border border-slate-100 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                      <Hash size={10} className="text-slate-400" />
                      Serial numbers
                    </p>
                    <SerialBadgeList
                      serials={rootSerials}
                      title={`Serials: ${p.name}`}
                    />
                  </div>
                )}

                <div className="animate-in fade-in duration-300">
                  {hasVariants && (
                    <VariantRows
                      combinations={combinations}
                      baseSellPrice={datas.sell_price || (p as any).sell_price}
                      baseBuyPrice={datas.buy_price || (p as any).buy_price}
                    />
                  )}
                  {!hasVariants && hasBatches && (
                    <BatchCards batches={batches} />
                  )}
                </div>
              </div>
            </td>
          </tr>
        )}
      </Fragment>
    );
  }
);

/* â”€â”€â”€ Main ProductInfos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ProductInfos = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCleanMode = new URLSearchParams(location.search).get("mode") === "clean";

  const handleOpenNewTab = () => {
    window.open(`${window.location.pathname}?mode=clean`, "_blank", "noopener,noreferrer");
  };

  const { setActions, setBottomActions } = useHeader();
  const { getData, deleteData, error, clearError } = useApi();
  const loading = useApiLoading("products-list");
  const { showToast } = useToast();

  const [products, setProducts] = useState<InventoryRecord[]>([]);
  const [overallStats, setOverallStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<InventoryRecord | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<InventoryRecord | null>(null);

  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem("product_table_columns");
    return saved
      ? sortKeys(JSON.parse(saved).filter((key: string) => !hiddenProductColumns.has(key)))
      : ["category", "status", "buy_price", "sell_price", "stocks", "reorder_point", "ui_id", "barcode", "serial_number"];
  });

  const sortedSelectedKeys = useMemo(() => sortKeys(selectedKeys), [selectedKeys]);

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        {!isCleanMode && (
          <button
            onClick={handleOpenNewTab}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-sm shrink-0"
            title="Open in New Tab"
          >
            <ExternalLink size={13} />
          </button>
        )}
        <button
          onClick={() => navigate("/product/drafts")}
          className="h-8 px-3 rounded-md border border-slate-200 text-slate-600 font-medium text-[12px] bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <Bookmark size={13} />
          Drafts
        </button>
        <GradientButton
          path="/product/add"
          className="h-8 flex items-center px-4 text-[12px] rounded-md"
        >
          + Add product
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate, isCleanMode]);

  useEffect(() => {
    const params: Record<string, string> = {
      shop_id: SHOP_ID,
      limit: "100",
      offset: "1",
    };
    if (searchTerm) params.q = searchTerm;

    getData(`${ENDPOINTS.INVENTORIES}/by/shop/${SHOP_ID}`, params).then(
      (res) => {
        if (res) {
          const data: InventoryRecord[] = Array.isArray(res?.data) 
            ? res.data 
            : (res?.data?.inventories ?? (Array.isArray(res?.datas) ? res.datas : (res?.datas?.inventories ?? [])));
          setProducts(data);
          
          if (res?.data?.overall_stats) {
            setOverallStats(res.data.overall_stats);
          } else if (res?.datas?.overall_stats) {
            setOverallStats(res.datas.overall_stats);
          }

          const keys = new Set<string>();
          data.forEach((p: InventoryRecord) => {
            if (p.datas) {
              Object.keys(p.datas).forEach((k) => {
                if (
                  !["name", "id", "shop_id", "variantTypes", "is_active"].includes(k) &&
                  !hiddenProductColumns.has(k)
                )
                  keys.add(k);
              });
            }
            ["category", "sell_price", "buy_price", "stocks", "reorder_point", "status", "ui_id", "barcode", "serial_number"].forEach((k) =>
              keys.add(k)
            );
          });
          setAvailableKeys(sortKeys(Array.from(keys).filter((key) => !hiddenProductColumns.has(key))));
        }
      }
    );
  }, [refreshKey, searchTerm]);

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteData(
        `${ENDPOINTS.INVENTORIES}/${SHOP_ID}/${productToDelete.id}`
      );
      showToast("Product deleted successfully", "success");
      setRefreshKey((prev: number) => prev + 1);
    } catch {
      showToast("Failed to delete product", "error");
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
      if (selectedProduct?.id === productToDelete.id) {
        setSelectedProduct(null);
      }
    }
  };

  const toggleExpand = (id: string) => {
    const n = new Set(expandedRows);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setExpandedRows(n);
  };

  useEffect(() => {
    if (selectedProduct) {
      setBottomActions(
        <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
              <Package size={14} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-800 leading-tight">{selectedProduct.name || "N/A"}</p>
              <p className="text-[10px] font-semibold text-slate-400 font-mono">
                {selectedProduct.ui_id || selectedProduct.barcode || "No SKU"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedProduct(null)}
              className="h-8 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-semibold text-[11px] transition-colors"
            >
              Deselect
            </button>
            <button
              onClick={() => {
                setProductToDelete(selectedProduct);
                setIsDeleteDialogOpen(true);
              }}
              className="h-8 px-3 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              Delete
            </button>
            <button
              onClick={() => navigate(`/product/${selectedProduct.id}`)}
              className="h-8 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors flex items-center gap-1.5"
            >
              <ChevronRight size={13} />
              View Details
            </button>
          </div>
        </div>
      );
    } else {
      setBottomActions(null);
    }
  }, [selectedProduct, setBottomActions, navigate, setProductToDelete, setIsDeleteDialogOpen]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const name = String(p.name || "").toLowerCase();
      const sku = String(
        p.barcode ||
          p.datas?.barcode ||
          (p as any).sku ||
          p.datas?.sku ||
          ""
      ).toLowerCase();
      const category = String(p.category || "").toLowerCase();
      const q = searchTerm.toLowerCase();
      return name.includes(q) || sku.includes(q) || category.includes(q);
    });
  }, [products, searchTerm]);



  const lowStockCount = useMemo(
    () =>
      products.filter((p) => {
        const stock = Number(p.stocks || 0);
        const rp = Number(
          (p as any).reorder_point ?? p.datas?.reorder_point ?? 10
        );
        return stock <= rp;
      }).length,
    [products]
  );
  
  const outOfStockCount = useMemo(
    () => products.filter((p) => Number(p.stocks || 0) === 0).length,
    [products]
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 font-sans w-full overflow-hidden relative">

      {/* Metric bar */}
      {!isCleanMode && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          <StatCard
            icon={Package}
            label="Total Products"
            value={Math.max(Number(overallStats?.total_product_count || 0), products.length).toString()}
            subValue="items"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={IndianRupee}
            label="Total Stock Value"
            value={(overallStats?.total_stock_value || 0).toLocaleString()}
            prefix="₹"
            subValue="inventory value"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard
            icon={AlertTriangle}
            label="Low Stock"
            value={overallStats?.low_stocks_count?.toString() || lowStockCount.toString()}
            subValue="items need restock"
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
          />
          <StatCard
            icon={AlertCircle}
            label="Out of Stock"
            value={overallStats?.no_stocks_count?.toString() || outOfStockCount.toString()}
            subValue="items empty"
            iconBg="bg-red-50"
            iconColor="text-red-500"
          />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[12px] font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-300 hover:text-red-500 transition-colors p-1 rounded"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="mt-2 bg-white border border-slate-100 rounded-lg p-2.5 px-3.5 flex flex-nowrap items-center gap-2 shadow-sm overflow-x-auto scrollbar-none">
        <div className="relative w-80 shrink-0">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by name, SKU, category…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
          />
        </div>

        

        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className={`h-8 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0 ${
            statusFilter !== "All"
              ? "border-blue-200 text-blue-600 bg-blue-50/50"
              : "border-slate-200 text-slate-650 bg-white hover:bg-slate-50"
          }`}
          title="Filters"
        >
          <Filter size={13} />
          {statusFilter !== "All" && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          )}
        </button>
          <ColumnPicker
          availableKeys={availableKeys}
          selectedKeys={selectedKeys}
          onApply={(keys) => setSelectedKeys(sortKeys(keys.filter((key) => !hiddenProductColumns.has(key))))}
          storageKey="product_table_columns"
          labelMap={columnLabels}
          className="h-8 px-3 rounded-md border border-slate-200 text-slate-650 bg-white hover:bg-slate-50 active:scale-95 transition-all text-xs font-semibold shadow-sm shrink-0 flex items-center justify-center gap-1.5"
        />
        <div className="flex-1" />

        {searchTerm && (
          <span className="text-[11px] text-slate-400 font-medium shrink-0">
            {filteredProducts.length} result
            {filteredProducts.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <RightSidebarFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => {}}
        onClear={() => setStatusFilter("All")}
        title="Product Filters"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock Status</label>
            <ReusableSelect
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val)}
              options={[
                { label: "All levels", value: "All" },
                { label: "In stock", value: "In Stock" },
                { label: "Low stock", value: "Low Stock" },
                { label: "Out of stock", value: "Out of Stock" },
              ]}
              placeholder="Status"
            />
          </div>
        </div>
      </RightSidebarFilter>

      {/* Main table card */}
      <div className="bg-white border border-slate-100 rounded-lg shadow-sm min-w-0 overflow-hidden flex flex-col flex-1 min-h-0 mt-2">

        {/* Table */}
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap text-sm">

            {/* Sticky header */}
            <thead className="sticky top-0 z-20 bg-white border-b border-slate-100">
              <tr>
                <th className="px-3 py-2.5 w-10" />
                <th className="px-3 py-2.5 min-w-[260px] text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  Product
                </th>
                {sortedSelectedKeys.map((key) => {
                  if (
                    key === "category" &&
                    sortedSelectedKeys.includes("supplier")
                  ) {
                    return (
                      <th
                        key="cat_sup"
                        className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide"
                      >
                        Category
                      </th>
                    );
                  }
                  if (
                    key === "supplier" &&
                    sortedSelectedKeys.includes("category")
                  )
                    return null;
                  return (
                    <th
                      key={key}
                      className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide"
                    >
                      {getColumnLabel(key)}
                    </th>
                  );
                })}
                <th className="px-3 py-2.5 w-16 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                </th>
              </tr>
            </thead>

            <tbody className="divide-y-0">
              {loading ? (
                <tr>
                  <td
                    colSpan={selectedKeys.length + 3}
                    className="py-20 text-center"
                  >
                    <Loader />
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={selectedKeys.length + 3}
                    className="py-20 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      {searchTerm ? (
                        <>
                          <Search size={18} className="text-slate-300" />
                          <p className="text-[12px] font-medium text-slate-400">
                            No results for{" "}
                            <span className="text-slate-600">
                              "{searchTerm}"
                            </span>
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                            <Package size={18} className="text-slate-300" />
                          </div>
                          <p className="text-[12px] font-medium text-slate-500">
                            No products found
                          </p>
                          <p className="text-[11px] text-slate-400 max-w-[180px] leading-relaxed text-center">
                            Add your first product to get started.
                          </p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <ProductRow
                    key={p.id}
                    p={p}
                    isSelected={selectedProduct?.id === p.id}
                    onSelect={(prod) => setSelectedProduct(prev => prev?.id === prod.id ? null : prod)}
                    isExpanded={expandedRows.has(p.id)}
                    toggleExpand={toggleExpand}
                    selectedKeys={sortedSelectedKeys}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && products.length > 0 && (
          <div className="border-t border-slate-50 px-4 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              {filteredProducts.length} of {products.length} product
              {products.length !== 1 ? "s" : ""}
            </span>
            <span className="text-[11px] text-slate-300 font-medium">
              {expandedRows.size > 0 && `${expandedRows.size} expanded`}
            </span>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Remove product"
        description="This action cannot be undone. This will permanently remove the product and all associated data."
        confirmText="Remove product"
        type="danger"
      />
    </div>
  );
};

export default ProductInfos;
