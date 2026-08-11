import { useEffect, useState, useMemo } from "react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { format } from "date-fns";
import "./ActivityLog.css";

// SVG Icons
const ArrIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const ChevD = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconDiff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18" />
    <path d="M5 8l7-5 7 5" />
    <path d="M5 16l7 5 7-5" />
  </svg>
);
const IconInfo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="11" x2="12" y2="16" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
const IconCart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

// Helpers
function initials(n: string = "System") {
  return n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}
function avatarColor(n: string = "System") {
  const c = ["#5B63D3", "#1D9E75", "#D85A30", "#C0506B", "#B9821C"];
  let s = 0;
  for (const ch of n) s += ch.charCodeAt(0);
  return c[s % c.length];
}

interface LogEntry {
  id: string;
  user_name?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  created_at?: string;
  description?: string;
  changes?: { field: string; before: unknown; after: unknown }[];
  lines?: { name: string; qty: string; value: string }[];
  amount?: string;
  meta?: {
    ip?: string;
    device?: string;
    reason?: string;
    customer?: string;
    payment?: string;
  };
}

const StructuredValueViewer = ({ data, level = 0 }: { data: any; level?: number }) => {
  if (data === null || data === undefined || data === "null" || data === "None") return <span className="text-slate-400 italic font-medium">—</span>;
  if (typeof data === "boolean" || data === "true" || data === "false" || data === "True" || data === "False") {
    const isTrue = data === true || data === "true" || data === "True";
    return <span className={`px-1.5 py-0.5 rounded ${isTrue ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'} text-[10px] font-bold uppercase`}>{isTrue ? "Yes" : "No"}</span>;
  }
  if (typeof data === "number") return <span className="text-slate-800 font-bold">{data.toLocaleString()}</span>;
  if (typeof data === "string") return <span className="text-slate-700 font-medium break-words w-full inline-block">{data}</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-slate-400 italic">Empty</span>;
    return (
      <div className="flex flex-col gap-2 w-full mt-1">
        {data.map((val, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-md p-2.5 shadow-sm w-full overflow-hidden">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100">
              Item {idx + 1}
            </div>
            <StructuredValueViewer data={val} level={level + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof data === "object") {
    const keys = Object.keys(data);
    if (keys.length === 0) return <span className="text-slate-400 italic">Empty</span>;
    return (
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-x-4 gap-y-2.5 w-full">
        {keys.map((key) => (
          <div key={key} className="flex flex-col w-full overflow-hidden">
            <span className="font-semibold text-slate-400 text-[9px] uppercase tracking-wide truncate mb-0.5" title={key.replace(/_/g, ' ')}>
              {key.replace(/_/g, ' ')}
            </span>
            <div className="text-[12px] text-slate-800 break-words w-full leading-snug">
              <StructuredValueViewer data={(data as any)[key]} level={level + 1} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span className="break-words">{String(data)}</span>;
};

const ChangeValueRenderer = ({ val, isDeleted }: { val: unknown, isDeleted?: boolean }) => {
  if (typeof val === 'object' && val !== null) {
    return (
      <div className={`custom-scrollbar p-2.5 rounded-xl border max-h-[260px] overflow-y-auto overflow-x-hidden w-full ${isDeleted ? 'bg-rose-50/50 border-rose-100 opacity-90' : 'bg-slate-50/70 border-slate-200'}`}>
        <StructuredValueViewer data={val} />
      </div>
    );
  }
  
  // Primitives - apply formatting
  if (val === null || val === undefined || val === "null" || val === "None" || val === "") {
    return <span className="opacity-60 italic font-medium">—</span>;
  }
  if (typeof val === "boolean" || val === "true" || val === "false" || val === "True" || val === "False") {
    const isTrue = val === true || val === "true" || val === "True";
    return <span className={`px-1.5 py-0.5 rounded ${isTrue ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'} text-[10px] font-bold uppercase`}>{isTrue ? "Yes" : "No"}</span>;
  }
  if (typeof val === "number") {
    return <span className="font-bold">{val.toLocaleString()}</span>;
  }
  
  return <>{String(val)}</>;
};

export const ActivityLogPage = () => {
  const { getData } = useApi();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [openSet, setOpenSet] = useState<Set<string>>(new Set());

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getData(`${ENDPOINTS.UTILITIES}/activity-logs/${SHOP_ID}`, { limit: "200" });
      if (res?.data && Array.isArray(res.data)) {
        const normalizedData = res.data.map((log: LogEntry, i: number) => {
          let action = (log.action || "create").toLowerCase();
          if (action === "created" || action === "create_manual") action = "create";
          if (action === "updated") action = "update";
          if (action === "deleted") action = "delete";
          if (action === "returned") action = "return";
          if (action.includes("sales")) action = "sales";

          let parsedChanges = log.changes;
          if (typeof parsedChanges === "string") {
            try { parsedChanges = JSON.parse(parsedChanges); }
            catch (_) { parsedChanges = []; }
          }

          return { ...log, id: log.id || `fallback-${i}`, action, changes: parsedChanges || [] };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleOpen = (id: string) => {
    const newSet = new Set(openSet);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setOpenSet(newSet);
  };

  const filteredLogs = useMemo(() => {
    let items = logs.filter((log) => {
      if (filterAction !== "all" && log.action !== filterAction) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const hay = (
          (log.user_name || "System") + " " +
          (log.description || "") + " " +
          (log.entity_type || "") + " " +
          (log.entity_id || "") + " " +
          (log.changes || []).map((c: { field: string; before: unknown; after: unknown }) => c.field + " " + (c.before || "") + " " + c.after).join(" ")
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    items = items.slice().sort((a, b) => {
      const dA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sortOrder === "desc" ? dB - dA : dA - dB;
    });

    return items;
  }, [logs, filterAction, searchTerm, sortOrder]);

  const stats = useMemo(() => {
    let salesCount = 0;
    let updatesCount = 0;
    let createCount = 0;
    const users = new Set<string>();

    logs.forEach(l => {
      if (l.action === "sales") salesCount++;
      if (l.action === "update") updatesCount++;
      if (l.action === "create") createCount++;
      if (l.user_name && l.user_name !== "System") users.add(l.user_name);
    });

    return {
      total: logs.length,
      sales: salesCount,
      updates: updatesCount,
      creates: createCount,
      members: users.size || 1,
    };
  }, [logs]);

  const formatChangeValue = (val: unknown) => {
    if (typeof val === 'object' && val !== null) return "Complex Object";
    return String(val ?? "—");
  };

  const getRecordTitle = (e: LogEntry) => {
    if (e.entity_type === "PRODUCT") return e.description?.split(" ")[1] || e.entity_id;
    return e.description || e.entity_id || e.entity_type;
  };

  return (
    <div className="activity-log-wrapper bg-[#FBFBFD] h-full overflow-y-auto w-full">
      <div className="shell">

        <div className="context">
          <span className="ws"><span className="logo">V</span>Vaathi Mart</span>
          <span className="sep">/</span><span>Settings</span>
          <span className="sep">/</span><span style={{ color: "var(--body)" }}>Activity Log</span>
        </div>

        <div className="head">
          <div>
            <h1>Activity Log</h1>
            <div className="sub">Every change to your data — who did it, what changed, and when.</div>
          </div>
          <div className="search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by user, product or field…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="stats">
          <div className="stat"><div className="v">{stats.total}</div><div className="k">Total events</div></div>
          <div className="stat"><div className="v sales">{stats.sales}</div><div className="k">Sales</div></div>
          <div className="stat"><div className="v update">{stats.updates}</div><div className="k">Updated</div></div>
          <div className="stat"><div className="v brand">{stats.members}</div><div className="k">Team members</div></div>
        </div>

        <div className="toolbar" id="filters">
          <div className={`chip ${filterAction === "all" ? "active" : ""}`} onClick={() => setFilterAction("all")}>All actions</div>
          <div className={`chip ${filterAction === "create" ? "active" : ""}`} onClick={() => setFilterAction("create")}><span className="cdot" style={{ background: "var(--create-dot)" }}></span>Create</div>
          <div className={`chip ${filterAction === "update" ? "active" : ""}`} onClick={() => setFilterAction("update")}><span className="cdot" style={{ background: "var(--update-dot)" }}></span>Update</div>
          <div className={`chip ${filterAction === "sales" ? "active" : ""}`} onClick={() => setFilterAction("sales")}><span className="cdot" style={{ background: "var(--sales-dot)" }}></span>Sales</div>
          <div className={`chip ${filterAction === "return" ? "active" : ""}`} onClick={() => setFilterAction("return")}><span className="cdot" style={{ background: "var(--return-dot)" }}></span>Sales return</div>
          <div className={`chip ${filterAction === "delete" ? "active" : ""}`} onClick={() => setFilterAction("delete")}><span className="cdot" style={{ background: "var(--delete-dot)" }}></span>Delete</div>
          <div className="spacer"></div>
          <div className="count">{filteredLogs.length} event{filteredLogs.length !== 1 ? "s" : ""}</div>
        </div>

        <div className="tablecard">
          <div className="thead">
            <div className={`sortable ${sortOrder}`} onClick={() => setSortOrder(s => s === "desc" ? "asc" : "desc")}>
              Date &amp; time <ChevD />
            </div>
            <div>User</div>
            <div>Action</div>
            <div>Details</div>
            <div className="r">Time</div>
            <div></div>
          </div>
          <div id="list">
            {loading ? (
              <div className="empty">Loading activity logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="empty">No matching activity. Try a different search or filter.</div>
            ) : (
              filteredLogs.map((e, i) => {
                const open = openSet.has(e.id);
                const user = e.user_name || "System";
                const role = user === "System" ? "Automated" : "User";
                const dateStr = e.created_at ? format(new Date(e.created_at), "dd MMM yyyy") : "—";
                const timeStr = e.created_at ? format(new Date(e.created_at), "hh:mm a") : "—";
                const record = getRecordTitle(e);
                const entity = e.entity_type || e.action.toUpperCase();

                const txnMeta = e.action === "sales" || e.action === "return";
                const amtClass = e.action === "return" ? "return" : "sales";

                return (
                  <div key={e.id} className={`rowwrap ${open ? 'open' : ''}`} style={{ animationDelay: `${i * 28}ms` }}>
                    <div className="row" onClick={() => toggleOpen(e.id)}>
                      <div className="c-date">
                        <div className="d">{dateStr}</div>
                        <div className="t">#{e.entity_id?.substring(0, 8) || e.id.substring(0, 8)}</div>
                      </div>

                      <div className="c-user">
                        <div className="avatar" style={{ background: avatarColor(user) }}>{initials(user)}</div>
                        <div className="u">
                          <div className="un">{user}</div>
                          <div className="ur">{role}</div>
                        </div>
                      </div>

                      <div className="c-action">
                        <span className={`badge ${e.action}`}>
                          <span className="bdot"></span>{e.action.toUpperCase()}
                        </span>
                      </div>

                      <div className="c-details">
                        {e.action === "delete" ? (
                          <>
                            <div className="det-top">
                              <span className="entity-tag">{entity}</span>
                              <span className="det-rec">{record}</span>
                            </div>
                            <div className="det-plain">Record removed{e.description ? ` — ${e.description}` : ""}</div>
                          </>
                        ) : txnMeta ? (
                          <>
                            <div className="det-top">
                              <span className="entity-tag">{entity}</span>
                              <span className="det-rec">{record}</span>
                              <span className={`txn-amt ${amtClass}`}>{e.amount || "—"}</span>
                            </div>
                            <div className="det-chips">
                              {e.lines && e.lines.length > 0 ? (
                                <>
                                  <span className="pchip">
                                    <span className="f">Items</span>
                                    <span className="v" style={{ background: "var(--panel)", color: "var(--body)", fontWeight: 500 }}>
                                      {e.lines[0].name} · {e.lines[0].qty}
                                    </span>
                                  </span>
                                  {e.lines.length - 1 > 0 && (
                                    <span className="pchip more">+{e.lines.length - 1} more</span>
                                  )}
                                </>
                              ) : (
                                <span className="det-plain">{e.description}</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="det-top">
                              <span className="entity-tag">{entity}</span>
                              <span className="det-rec">{record}</span>
                            </div>
                            <div className="det-chips">
                              {e.changes && e.changes.slice(0, 2).map((c, idx) => (
                                <span key={idx} className="pchip">
                                  <span className="f">{c.field}</span>
                                  <span className="v">{formatChangeValue(c.after)}</span>
                                </span>
                              ))}
                              {e.changes && e.changes.length > 2 && (
                                <span className="pchip more">+{e.changes.length - 2} more</span>
                              )}
                              {(!e.changes || e.changes.length === 0) && (
                                <span className="det-plain">{e.description || "Updated"}</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="c-time">{timeStr}</div>

                      <div className="c-exp">
                        <button className="expbtn" aria-label="Toggle details">
                          <ChevD />
                        </button>
                      </div>
                    </div>

                    <div className="drawer">
                      <div className="inner">
                        <div className="drawer-pad">
                          <div className="drawer-grid">

                            {/* Left Panel */}
                            {txnMeta ? (
                              <div className="dpanel">
                                <div className="dpanel-h"><IconCart /> Line items</div>
                                <div className="ltable">
                                  <div className="lhdr">
                                    <span>Item</span><span>Qty</span><span>Amount</span>
                                  </div>
                                  {e.lines?.map((l, idx) => (
                                    <div key={idx} className="lrow">
                                      <span className="lname">{l.name}</span>
                                      <span className="lqty">{l.qty}</span>
                                      <span className="lval">{l.value}</span>
                                    </div>
                                  ))}
                                  <div className="lrow ltotal">
                                    <span className="lname">Total</span>
                                    <span className="lqty"></span>
                                    <span className={`lval ${amtClass}`}>{e.amount}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="dpanel">
                                <div className="dpanel-h"><IconDiff /> What changed</div>
                                <div className="dtable">
                                  <div className="dhdr">
                                    <span>Field</span><span>Was</span><span></span><span>Changed to</span>
                                  </div>
                                  {e.action === "delete" ? (
                                    <div className="drow">
                                      <span className="dfield">Record</span>
                                      <span className="dwas">{record}</span>
                                      <span className="darr"><ArrIcon /></span>
                                      <span className="dnow" style={{ background: "var(--was-bg)", color: "var(--was-tx)" }}>Deleted</span>
                                    </div>
                                  ) : e.changes && e.changes.length > 0 ? (
                                    e.changes.map((c, idx) => {
                                      const tryParse = (val: unknown) => {
                                        if (typeof val === 'string' && ((val.startsWith('{') && val.endsWith('}')) || (val.startsWith('[') && val.endsWith(']')))) {
                                          try { return JSON.parse(val); } catch (e) {
                                            try { return JSON.parse(val.replace(/'/g, '"').replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null')); } 
                                            catch (err) { return val; }
                                          }
                                        }
                                        return val;
                                      };
                                      
                                      const parsedBefore = tryParse(c.before);
                                      const parsedAfter = tryParse(c.after);
                                      const isObjBefore = typeof parsedBefore === 'object' && parsedBefore !== null;
                                      const isObjAfter = typeof parsedAfter === 'object' && parsedAfter !== null;

                                      return (
                                        <div key={idx} className="drow">
                                          <span className="dfield">{c.field}</span>
                                          {parsedBefore === undefined || parsedBefore === null || parsedBefore === "" || parsedBefore === "null" || parsedBefore === "None" ? (
                                            <span className="dnew">— not set —</span>
                                          ) : (
                                            <span className={`dwas ${isObjBefore ? 'd-obj' : ''}`}>
                                              <ChangeValueRenderer val={parsedBefore} isDeleted />
                                            </span>
                                          )}
                                          <span className="darr"><ArrIcon /></span>
                                          <span className={`dnow ${isObjAfter ? 'd-obj' : ''}`}>
                                            <ChangeValueRenderer val={parsedAfter} />
                                          </span>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="empty" style={{ padding: "20px" }}>No field-level changes recorded.</div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Right Panel: Metadata */}
                            <div className="dpanel">
                              <div className="dpanel-h"><IconInfo /> Event details</div>
                              <div className="metabox">
                                <div className="mrow">
                                  <span className="mk">Record ID</span>
                                  <span className="mv">{e.entity_id || e.id}</span>
                                </div>
                                <div className="mrow">
                                  <span className="mk">Performed by</span>
                                  <span className="mv" style={{ fontFamily: "var(--font-body)" }}>{user} · {role}</span>
                                </div>
                                {txnMeta && e.meta?.customer && (
                                  <div className="mrow">
                                    <span className="mk">Customer</span>
                                    <span className="mv" style={{ fontFamily: "var(--font-body)" }}>{e.meta.customer}</span>
                                  </div>
                                )}
                                {txnMeta && e.meta?.payment && (
                                  <div className="mrow">
                                    <span className="mk">Payment</span>
                                    <span className="mv" style={{ fontFamily: "var(--font-body)" }}>{e.meta.payment}</span>
                                  </div>
                                )}
                                <div className="mrow">
                                  <span className="mk">Timestamp</span>
                                  <span className="mv">{dateStr} · {timeStr}</span>
                                </div>
                                {e.description && (
                                  <div className="mrow">
                                    <span className="mk">Description</span>
                                    <span className="mv reason">{e.description}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogPage;
