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
  Filter,
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
  CREATE:        { label: "Create",  color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  CREATE_MANUAL: { label: "Create",  color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  UPDATE:        { label: "Update",  color: "bg-blue-50    text-blue-700    border-blue-200",    dot: "bg-blue-500"    },
  DELETE:        { label: "Delete",  color: "bg-rose-50    text-rose-700    border-rose-200",    dot: "bg-rose-500"    },
  EXPORT:        { label: "Export",  color: "bg-violet-50  text-violet-700  border-violet-200",  dot: "bg-violet-500"  },
  IMPORT:        { label: "Import",  color: "bg-amber-50   text-amber-700   border-amber-200",   dot: "bg-amber-500"   },
};

const getAction = (action?: string) =>
  ACTION_CONFIG[action?.toUpperCase() ?? ""] ??
  ACTION_CONFIG["CREATE"];

// ─── Entity colour strip ──────────────────────────────────────────────────────

const ENTITY_COLORS: Record<string, string> = {
  ORDER:           "bg-blue-100    text-blue-700",
  STOCKADJUSTMENT: "bg-purple-100  text-purple-700",
  CUSTOMER:        "bg-emerald-100 text-emerald-700",
  PURCHASE:        "bg-amber-100   text-amber-700",
  PRODUCT:         "bg-rose-100    text-rose-700",
  BILLING:         "bg-indigo-100  text-indigo-700",
};

const getEntityColor = (entity?: string) =>
  ENTITY_COLORS[entity?.toUpperCase() ?? ""] ?? "bg-slate-100 text-slate-600";

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
      if (res?.data) setLogs(res.data);
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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">

      {/* ── Header ── */}
      <div className="px-6 py-5 border-b border-slate-50 bg-gradient-to-r from-slate-50/60 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
              <Activity size={16} className="text-rose-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 leading-tight">
                Activity Log
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Track user actions and system changes across the platform
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search logs…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-2 h-9 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all w-48 placeholder:text-slate-400"
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
              className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* ── Action filter chips ── */}
        <div className="flex items-center gap-1.5 mt-4 flex-wrap">
          <Filter size={11} className="text-slate-400 shrink-0" />
          {uniqueActions.map((action) => {
            const config = action === "ALL" ? null : getAction(action);
            const isActive = filterAction === action;
            return (
              <button
                key={action}
                onClick={() => setFilterAction(action)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                  isActive
                    ? action === "ALL"
                      ? "bg-slate-800 border-slate-800 text-white"
                      : `${config?.color} border-current`
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {action === "ALL" ? "All Actions" : (config?.label ?? action)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 sm:grid-cols-4 border-b border-slate-50 divide-x divide-slate-50">
        {[
          { label: "Total Events",   value: logs.length,                                                                    color: "text-slate-700" },
          { label: "Creates",        value: logs.filter((l) => l.action?.toUpperCase().includes("CREATE")).length,          color: "text-emerald-600" },
          { label: "Updates",        value: logs.filter((l) => l.action?.toUpperCase() === "UPDATE").length,                color: "text-blue-600" },
          { label: "Shown",          value: filteredLogs.length,                                                             color: "text-violet-600" },
        ].map((stat) => (
          <div key={stat.label} className="px-4 py-3 text-center hidden sm:block first:block last:block">
            <p className={`text-base font-black tabular-nums ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Log list ── */}
      <div className="flex-1 overflow-auto min-h-[420px] max-h-[520px]">
        {/* Desktop table */}
        <table className="w-full text-left hidden sm:table">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50/80 backdrop-blur border-b border-slate-100">
              {["User", "Action", "Entity", "Date & Time", ""].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap"
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
                          <span className="text-xs font-bold text-slate-700">
                            {log.user_name ?? "System"}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wide ${actionCfg.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${actionCfg.dot}`} />
                          {actionCfg.label}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider w-fit ${entityColor}`}
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
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-all"
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
                        <span className="text-xs font-bold text-slate-700">
                          {log.user_name ?? "System"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black ${actionCfg.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${actionCfg.dot}`} />
                          {actionCfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${entityColor}`}>
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
                  <h3 className="text-sm font-bold text-slate-800">
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
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                    {change.field}
                  </p>
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        Before
                      </span>
                      <div className="bg-rose-50 text-rose-700 border border-rose-100 text-xs px-3 py-2 rounded-lg font-mono break-all min-h-[32px]">
                        {String(change.before ?? "—")}
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 shrink-0" />
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
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
                className="px-5 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
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
