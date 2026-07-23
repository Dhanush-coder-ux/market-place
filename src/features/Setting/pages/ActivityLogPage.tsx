import { useEffect, useState } from "react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import {
  Search,
  RefreshCw,
  X,
  Activity,
  User,
  Clock,
  ChevronRight,
  ArrowRight,
  Inbox,
} from "lucide-react";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LogEntry {
  id?: string;
  user_name?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  created_at?: string;
  description?: string;
  changes?: { field: string; before: any; after: any }[];
}

// ─── Action Config ───────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  CREATE:        { label: "Create",  color: "bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 shadow-sm", dot: "bg-emerald-500" },
  CREATE_MANUAL: { label: "Create",  color: "bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 shadow-sm", dot: "bg-emerald-500" },
  UPDATE:        { label: "Update",  color: "bg-blue-500/10    text-blue-700    ring-1 ring-inset ring-blue-500/20 shadow-sm",    dot: "bg-blue-500"    },
  DELETE:        { label: "Delete",  color: "bg-rose-500/10    text-rose-700    ring-1 ring-inset ring-rose-500/20 shadow-sm",    dot: "bg-rose-500"    },
  EXPORT:        { label: "Export",  color: "bg-violet-500/10  text-violet-700  ring-1 ring-inset ring-violet-500/20 shadow-sm",  dot: "bg-violet-500"  },
  IMPORT:        { label: "Import",  color: "bg-amber-500/10   text-amber-700   ring-1 ring-inset ring-amber-500/20 shadow-sm",   dot: "bg-amber-500"   },
  RETURN:        { label: "Return",  color: "bg-orange-500/10  text-orange-700  ring-1 ring-inset ring-orange-500/20 shadow-sm",  dot: "bg-orange-500"  },
};

const getAction = (action?: string) =>
  ACTION_CONFIG[action?.toUpperCase() ?? ""] ??
  ACTION_CONFIG["CREATE"];

// ─── Entity colour strip ──────────────────────────────────────────────────────

const ENTITY_COLORS: Record<string, string> = {
  ORDER:           "bg-blue-500/10 text-blue-700 ring-1 ring-inset ring-blue-500/20 shadow-sm",
  STOCKADJUSTMENT: "bg-purple-500/10 text-purple-700 ring-1 ring-inset ring-purple-500/20 shadow-sm",
  CUSTOMER:        "bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 shadow-sm",
  PURCHASE:        "bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/20 shadow-sm",
  PRODUCT:         "bg-rose-500/10 text-rose-700 ring-1 ring-inset ring-rose-500/20 shadow-sm",
  BILLING:         "bg-indigo-500/10 text-indigo-700 ring-1 ring-inset ring-indigo-500/20 shadow-sm",
  EMPLOYEE:        "bg-teal-500/10 text-teal-700 ring-1 ring-inset ring-teal-500/20 shadow-sm",
  SUPPLIER:        "bg-orange-500/10 text-orange-700 ring-1 ring-inset ring-orange-500/20 shadow-sm",
  "SALES-OFFLINE": "bg-cyan-500/10 text-cyan-700 ring-1 ring-inset ring-cyan-500/20 shadow-sm",
  "SALES-RETURN":  "bg-pink-500/10 text-pink-700 ring-1 ring-inset ring-pink-500/20 shadow-sm",
};

const getEntityColor = (entity?: string) =>
  ENTITY_COLORS[entity?.toUpperCase() ?? ""] ?? "bg-slate-500/10 text-slate-700 ring-1 ring-inset ring-slate-500/20 shadow-sm";

// ─── Skeleton row ─────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 animate-pulse">
    <div className="w-7 h-7 rounded-full bg-slate-100 shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 w-24 bg-slate-100 rounded" />
      <div className="h-2.5 w-40 bg-slate-100 rounded" />
    </div>
    <div className="h-5 w-14 rounded-full bg-slate-100" />
    <div className="h-5 w-20 rounded-full bg-slate-100" />
    <div className="h-3 w-28 bg-slate-100 rounded ml-auto" />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const ActivityLogPage = () => {
  const { getData } = useApi();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getData(
        `${ENDPOINTS.UTILITIES}/activity-logs/${SHOP_ID}`,
        { limit: "200" }
      );
      if (res?.data && Array.isArray(res.data)) {
        const normalizedData = res.data.map((log: LogEntry) => {
          let action = log.action?.toUpperCase() || "CREATE";
          if (action === "CREATED") action = "CREATE";
          if (action === "UPDATED") action = "UPDATE";
          if (action === "DELETED") action = "DELETE";
          if (action === "RETURNED") action = "RETURN";
          
          let parsedChanges = log.changes;
          if (typeof parsedChanges === "string") {
            try {
              parsedChanges = JSON.parse(parsedChanges);
            } catch (e) {
              parsedChanges = [];
            }
          }
          
          return { ...log, action, changes: parsedChanges };
        });
        setLogs(normalizedData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      !searchTerm ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchFilter =
      filterAction === "ALL" ||
      log.action?.toUpperCase() === filterAction ||
      (filterAction === "CREATE" && log.action?.toUpperCase() === "CREATE_MANUAL");

    return matchSearch && matchFilter;
  });

  const uniqueActions = [
    "ALL",
    ...Array.from(
      new Set(logs.map((l) => l.action?.toUpperCase()).filter(Boolean))
    ),
  ] as string[];

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="h-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-0">

      {/* ── Compact Header ── */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 bg-white shrink-0">
        
        {/* Left: Title & Compact Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Activity size={14} className="text-blue-500" />
            </div>
            <h1 className="text-sm font-semibold text-slate-800">Activity Log</h1>
          </div>
          <div className="hidden md:flex items-center gap-3 border-l border-slate-200 pl-4 text-[11px] text-slate-500">
            <span><strong className="font-medium text-slate-700">{logs.length}</strong> Total</span>
            <span><strong className="font-medium text-emerald-600">{logs.filter((l) => l.action?.toUpperCase().includes("CREATE")).length}</strong> Creates</span>
            <span><strong className="font-medium text-blue-600">{logs.filter((l) => l.action?.toUpperCase() === "UPDATE").length}</strong> Updates</span>
          </div>
        </div>

        {/* Right: Filters, Search, Refresh */}
        <div className="flex items-center gap-2.5 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 hide-scrollbar">
          {/* Action filters */}
          <div className="flex items-center gap-1.5 shrink-0">
            {uniqueActions.map((action) => {
              const config = action === "ALL" ? null : getAction(action);
              const isActive = filterAction === action;
              return (
                <button
                  key={action}
                  onClick={() => setFilterAction(action)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                    isActive
                      ? action === "ALL"
                        ? "bg-slate-800 text-white shadow-sm ring-1 ring-inset ring-slate-800"
                        : `${config?.color}`
                      : "bg-white text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {action === "ALL" ? "All" : (config?.label ?? action)}
                </button>
              );
            })}
          </div>

          <div className="w-px h-5 bg-slate-200 shrink-0 mx-1 hidden sm:block"></div>

          {/* Search */}
          <div className="relative shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-3 py-1 h-7 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all w-36 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchLogs}
            title="Refresh"
            className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-md text-slate-500 hover:bg-slate-50 transition-all shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Log list ── */}
      <div className="flex-1 overflow-auto min-h-0 bg-white">
        {/* Desktop table */}
        <table className="w-full text-left hidden sm:table">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50 border-b border-slate-100">
              {["User", "Action", "Entity", "Date & Time", ""].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-widest whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-0 py-0">
                      <SkeletonRow />
                    </td>
                  </tr>
                ))
              : filteredLogs.length === 0
              ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                          <Inbox size={20} className="text-slate-300" />
                        </div>
                        <p className="text-sm font-semibold text-slate-400">
                          No activity logs found
                        </p>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="text-xs text-blue-500 hover:underline font-medium"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              : filteredLogs.map((log, idx) => {
                  const actionCfg = getAction(log.action);
                  const entityColor = getEntityColor(log.entity_type);
                  const hasChanges = log.changes && log.changes.length > 0;
                  return (
                    <tr
                      key={log.id ?? idx}
                      className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* User */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0">
                            <User size={12} className="text-white" />
                          </div>
                          <span className="text-xs font-medium text-slate-700">
                            {log.user_name ?? "System"}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide ${actionCfg.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${actionCfg.dot}`} />
                          {actionCfg.label}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wider w-fit ${entityColor}`}
                          >
                            {log.entity_type ?? "—"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                            {log.entity_id}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Clock size={11} className="text-slate-300 shrink-0" />
                          {log.created_at
                            ? format(new Date(log.created_at), "MMM dd, yyyy · hh:mm a")
                            : "—"}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {hasChanges ? (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-500 hover:text-blue-700 "
                          >
                            Details
                            <ChevronRight size={12} />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-200">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-slate-50">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            : filteredLogs.map((log, idx) => {
                const actionCfg = getAction(log.action);
                const entityColor = getEntityColor(log.entity_type);
                const hasChanges = log.changes && log.changes.length > 0;
                return (
                  <div
                    key={log.id ?? idx}
                    className="flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                      <User size={13} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-700">
                          {log.user_name ?? "System"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium ${actionCfg.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${actionCfg.dot}`} />
                          {actionCfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${entityColor}`}>
                          {log.entity_type}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        {log.entity_id}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {log.created_at
                          ? format(new Date(log.created_at), "MMM dd, yyyy · hh:mm a")
                          : "—"}
                      </p>
                    </div>
                    {hasChanges && (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-500 shrink-0 mt-0.5"
                      >
                        <ChevronRight size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
        </div>
      </div>

      {/* ── Details Drawer / Modal ── */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4"
          onClick={(e) => e.target === e.currentTarget && setSelectedLog(null)}
        >
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200 flex flex-col max-h-[85vh]">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Activity size={15} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-800">
                    Change Details
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {selectedLog.entity_type} — {selectedLog.action}
                    {selectedLog.created_at && (
                      <> · {format(new Date(selectedLog.created_at), "MMM dd, yyyy · hh:mm a")}</>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Change rows */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/40">
              {selectedLog.changes?.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">
                  No field-level changes recorded.
                </p>
              )}
              {selectedLog.changes?.map((change, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm"
                >
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                    {change.field}
                  </p>
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                    <div>
                      <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                        Before
                      </span>
                      <div className="bg-rose-50 text-rose-700 border border-rose-100 text-xs px-3 py-2 rounded-lg font-mono break-all min-h-[32px]">
                        {String(change.before ?? "—")}
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 shrink-0" />
                    <div>
                      <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                        After
                      </span>
                      <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs px-3 py-2 rounded-lg font-mono break-all min-h-[32px]">
                        {String(change.after ?? "—")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogPage;
