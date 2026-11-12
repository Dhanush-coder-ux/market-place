import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { useToast } from "@/context/ToastContext";
import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Megaphone, RefreshCw, Tag, Plus,
  Inbox, Send, Clock,
  Copy, Trash2, Edit3,
  X, Search, Eye,
} from "lucide-react";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { SHOP_ID } from "@/services/endpoints";

// ─── Types & Interfaces ──────────────────────────────────────────────────────

type AnnouncementType = "Announcement" | "Update" | "Offer";
type StatusType = "Draft" | "Scheduled" | "Published" | "Expired";

interface AnnouncementItem {
  id: number;
  text: string;
  date: string;
  type: AnnouncementType;
  status: StatusType;
  audience?: string;
  schedule_at?: string | null;
  expire_at?: string | null;
}

// ─── Design Tokens & Config (Forest Green Theme) ─────────────────────────────

const BRAND_GREEN = "#286038";
const BRAND_GREEN_HOVER = "#1e4a2b";

const TYPE_CONFIG: Record<
  AnnouncementType,
  {
    label: string;
    description: string;
    icon: React.ElementType;
    badgeClass: string;
    iconClass: string;
    previewBg: string;
  }
> = {
  Announcement: {
    label: "Announcement",
    description: "General store notices & news",
    icon: Megaphone,
    badgeClass: "bg-emerald-50 text-[#1e4a2b] border-emerald-200",
    iconClass: "text-[#286038] bg-emerald-100/80",
    previewBg: "bg-[#286038]",
  },
  Update: {
    label: "Store Update",
    description: "Operating hours, holidays & logistics",
    icon: RefreshCw,
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    iconClass: "text-amber-700 bg-amber-100/80",
    previewBg: "bg-amber-600",
  },
  Offer: {
    label: "Promotion / Offer",
    description: "Discounts, seasonal sales & deals",
    icon: Tag,
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    iconClass: "text-emerald-700 bg-emerald-100/80",
    previewBg: "bg-emerald-600",
  },
};

const STATUS_CONFIG: Record<
  StatusType,
  { dot: string; bg: string; text: string; border: string; label: string }
> = {
  Draft: {
    dot: "bg-slate-400",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    label: "Draft",
  },
  Scheduled: {
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    label: "Scheduled",
  },
  Published: {
    dot: "bg-[#286038]",
    bg: "bg-emerald-50",
    text: "text-[#1e4a2b]",
    border: "border-emerald-200",
    label: "Live on Store",
  },
  Expired: {
    dot: "bg-rose-500",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    label: "Expired",
  },
};

const MAX_CHAR_LIMIT = 160;

// ─── Utilities ───────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatusBadge({
  status,
  scheduleAt,
  expireAt,
}: {
  status: StatusType;
  scheduleAt?: string | null;
  expireAt?: string | null;
}) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
  return (
    <div className="flex flex-col items-start gap-1">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
        <span>{cfg.label}</span>
      </span>
      {status === "Scheduled" && scheduleAt && (
        <span className="text-[11px] text-amber-700 flex items-center gap-1 font-medium whitespace-nowrap">
          <Clock size={10} className="shrink-0" />
          {new Date(scheduleAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      )}
      {status === "Expired" && expireAt && (
        <span className="text-[11px] text-rose-500 font-medium whitespace-nowrap">
          Ended {fmtDate(expireAt)}
        </span>
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: AnnouncementType }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.Announcement;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${cfg.badgeClass}`}
    >
      <Icon size={12} className="shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
}

function DeleteModal({
  item,
  onConfirm,
  onCancel,
  isSaving,
}: {
  item: AnnouncementItem;
  onConfirm: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}) {
  // Lock background scroll when modal is open and handle Escape key
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSaving, onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onCancel();
      }}
    >
      <div
        className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-announcement-title"
      >
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <div>
            <h3 id="delete-announcement-title" className="text-base font-bold text-slate-900">
              Delete Announcement
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to delete this announcement? It will be permanently removed from
              your digital storefront.
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 mb-6">
          <p className="text-xs text-slate-700 font-medium line-clamp-3">"{item.text}"</p>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-600">{item.type}</span>
            <span>·</span>
            <span>{fmtDate(item.date)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={onCancel}
            className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={onConfirm}
            className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>Delete Announcement</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const { showToast } = useToast();
  const { shop } = useBusinessApi();

  // State
  const [history, setHistory] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComposing, setIsComposing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [text, setText] = useState("");
  const [type, setType] = useState<AnnouncementType>("Announcement");

  // Filter & Search State
  const [filterType, setFilterType] = useState<AnnouncementType | "All">("All");
  const [filterStatus, setFilterStatus] = useState<StatusType | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementItem | null>(null);

  const textRef = useRef<HTMLTextAreaElement>(null);
  const charCount = text.length;
  const isOverLimit = charCount >= MAX_CHAR_LIMIT * 0.9;

  // ── API Mapping Functions ──
  const apiToType = (t: string): AnnouncementType => {
    const raw = String(t || "").toUpperCase();
    if (raw === "OFFER") return "Offer";
    if (raw === "UPDATES") return "Update";
    return "Announcement";
  };

  const typeToApi = (t: AnnouncementType) => {
    if (t === "Update") return "UPDATES";
    return t.toUpperCase();
  };

  const apiToStatus = (
    s: any,
    scheduleAt?: string | null,
    expireAt?: string | null
  ): StatusType => {
    if (expireAt && new Date(expireAt).getTime() < Date.now()) {
      return "Expired";
    }
    const raw = String(s || "").trim().toUpperCase();
    if (raw === "EXPIRED") return "Expired";
    if (raw === "DRAFT") return "Draft";
    if (raw === "PUBLISHED" || raw === "ACTIVE" || raw === "LIVE") return "Published";
    if (raw === "SCHEDULED") {
      if (scheduleAt && new Date(scheduleAt).getTime() <= Date.now()) {
        return "Published";
      }
      return "Scheduled";
    }
    if (scheduleAt && new Date(scheduleAt).getTime() > Date.now()) {
      return "Scheduled";
    }
    if (scheduleAt && new Date(scheduleAt).getTime() <= Date.now()) {
      return "Published";
    }
    return "Draft";
  };

  // ── Load Announcements ──
  const loadAnnouncements = () => {
    const activeShopId = localStorage.getItem("shop_id") || SHOP_ID;
    setLoading(true);
    shop
      .getAnnouncements(activeShopId)
      .then((res: any) => {
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.detail?.data)
          ? res.detail.data
          : [];
        setHistory(
          list.map((d: any) => ({
            id: d.id,
            text: d.message || "",
            date: d.schedule_at || d.created_at || new Date().toISOString(),
            type: apiToType(d.type),
            status: apiToStatus(d.status, d.schedule_at, d.expire_at),
            audience: d.send_to || "ALL_FOLLOWED_USERS",
            schedule_at: d.schedule_at,
            expire_at: d.expire_at,
          }))
        );
      })
      .catch((err: any) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // ── Metrics Calculation ──
  const publishedCount = history.filter((h) => h.status === "Published").length;
  const scheduledCount = history.filter((h) => h.status === "Scheduled").length;
  const draftCount = history.filter((h) => h.status === "Draft").length;
  const expiredCount = history.filter((h) => h.status === "Expired").length;

  // ── Filtered History ──
  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      const matchType = filterType === "All" || h.type === filterType;
      const matchStatus = filterStatus === "All" || h.status === filterStatus;
      const matchSearch =
        !searchQuery.trim() || h.text.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchType && matchStatus && matchSearch;
    });
  }, [history, filterType, filterStatus, searchQuery]);

  // ── Form Handlers ──
  const resetForm = () => {
    setText("");
    setType("Announcement");
    setEditingId(null);
  };

  const handleStartCompose = () => {
    resetForm();
    setIsComposing(true);
    setTimeout(() => {
      textRef.current?.focus();
    }, 50);
  };

  const handlePublish = async (asDraft: boolean = false) => {
    if (!text.trim()) {
      showToast("Please enter an announcement message", "error");
      return;
    }
    setIsSaving(true);
    const activeShopId = localStorage.getItem("shop_id") || SHOP_ID;
    const apiType = typeToApi(type);
    const apiStatus = asDraft ? "DRAFT" : "PUBLISHED";

    const payload = {
      type: apiType,
      message: text.trim(),
      call_to_action: null,
      schedule_at: null,
      send_to: "ALL_FOLLOWED_USERS",
      status: apiStatus,
    };

    try {
      if (editingId) {
        await shop.updateAnnouncement(editingId, { ...payload, id: editingId });
        showToast("Announcement updated successfully", "success");
      } else {
        await shop.createAnnouncement(activeShopId, payload);
        showToast(
          asDraft ? "Draft saved successfully" : "Announcement published to store!",
          "success"
        );
      }
      resetForm();
      setIsComposing(false);
      loadAnnouncements();
    } catch (err: any) {
      console.error(err);
      const detail = err?.response?.data?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail[0]?.msg || "Failed to save announcement"
          : err?.message || "Failed to save announcement";
      showToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: AnnouncementItem) => {
    setText(item.text);
    setType(item.type);
    setEditingId(item.id);
    setIsComposing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      textRef.current?.focus();
    }, 50);
  };

  const handleDuplicate = (item: AnnouncementItem) => {
    setText(item.text);
    setType(item.type);
    setEditingId(null);
    setIsComposing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      textRef.current?.focus();
    }, 50);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await shop.deleteAnnouncement(deleteTarget.id);
      setHistory((prev) => prev.filter((h) => h.id !== deleteTarget.id));
      showToast("Announcement deleted successfully", "success");
      setDeleteTarget(null);
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || "Failed to delete announcement", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: "Inter, sans-serif" }}>
      {deleteTarget && (
        <DeleteModal
          item={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isSaving={isSaving}
        />
      )}

      {/* ─── PAGE HEADER & ACTIONS ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Store Announcements</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage broadcast banners and promotional messages displayed across your digital storefront.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isComposing && (
            <button
              type="button"
              onClick={handleStartCompose}
              className="inline-flex items-center gap-2 h-9.5 px-4 rounded-xl text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              style={{
                backgroundColor: BRAND_GREEN,
                boxShadow: "0 2px 8px rgba(40, 96, 56, 0.25)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND_GREEN_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND_GREEN)}
            >
              <Plus size={14} />
              <span>New Announcement</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── COMPOSER CARD (CREATE / EDIT) ──────────────────────────── */}
      {isComposing && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
                style={{ backgroundColor: "#EAF4E6", color: BRAND_GREEN }}
              >
                {editingId ? <Edit3 size={15} /> : <Megaphone size={15} />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingId ? `Edit Announcement #${editingId}` : "Create New Announcement"}
                </h3>
                <p className="text-xs text-slate-500">
                  Compose a customer-facing banner to display at the top of your store.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsComposing(false);
              }}
              className="w-8 h-8 rounded-lg hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Close composer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-5">
            {/* Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Announcement Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["Announcement", "Update", "Offer"] as AnnouncementType[]).map((t) => {
                  const isSelected = type === t;
                  const cfg = TYPE_CONFIG[t];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? t === "Offer"
                            ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-xs"
                            : t === "Update"
                            ? "bg-amber-50/80 border-amber-300 text-amber-900 shadow-xs"
                            : "bg-[#EAF4E6] border-[#A8C898] text-[#1e4a2b] shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.iconClass}`}>
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold">{cfg.label}</div>
                        <div className="text-[11px] text-slate-500 font-normal truncate">
                          {cfg.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Announcement Message <span className="text-red-500">*</span>
                </label>
                <span
                  className={`text-xs font-mono font-medium ${
                    isOverLimit ? "text-amber-600 font-bold" : "text-slate-400"
                  }`}
                >
                  {charCount} / {MAX_CHAR_LIMIT}
                </span>
              </div>
              <textarea
                ref={textRef}
                rows={3}
                maxLength={MAX_CHAR_LIMIT}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your announcement message here (e.g., Weekend special: 20% off all dairy & fresh produce)..."
                className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-900 leading-relaxed resize-none outline-none focus:border-[#286038] focus:ring-3 focus:ring-[#286038]/15 transition-all placeholder:text-slate-400 shadow-2xs"
              />
            </div>

            {/* Live Storefront Preview */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={12} className="text-slate-400" />
                  Live Storefront Preview
                </span>
                <span className="text-[11px] text-slate-400">Customer view</span>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-white">
                <div className="px-3 py-1.5 bg-slate-100/80 border-b border-slate-200 flex items-center gap-1.5">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono ml-2">
                    storefront-banner
                  </span>
                </div>

                <div
                  className={`px-4 py-2.5 flex items-center justify-center gap-2 text-center text-xs font-medium text-white transition-colors ${
                    TYPE_CONFIG[type]?.previewBg || "bg-[#286038]"
                  }`}
                >
                  {type === "Offer" && <Tag size={13} className="shrink-0" />}
                  {type === "Update" && <RefreshCw size={13} className="shrink-0" />}
                  {type === "Announcement" && <Megaphone size={13} className="shrink-0" />}
                  <span className="truncate">
                    {text.trim() ||
                      "Your announcement banner message will be presented here to visiting customers…"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer Actions */}
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                resetForm();
                setIsComposing(false);
              }}
              className="h-9.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!text.trim() || isSaving}
              onClick={() => handlePublish(true)}
              className="h-9.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save as Draft
            </button>

            <button
              type="button"
              disabled={!text.trim() || isSaving}
              onClick={() => handlePublish(false)}
              className="h-9.5 px-5 rounded-xl text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: BRAND_GREEN,
                boxShadow: "0 2px 8px rgba(40, 96, 56, 0.25)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND_GREEN_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND_GREEN)}
            >
              {isSaving ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
              <span>{editingId ? "Save Changes" : "Publish Announcement"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── ANNOUNCEMENTS LIST / TABLE ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Quick Chips (Green active pill instead of black) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { label: "All", value: "All", count: history.length },
              {
                label: "Live",
                value: "Published",
                count: publishedCount,
                dot: "bg-emerald-500",
              },
              {
                label: "Scheduled",
                value: "Scheduled",
                count: scheduledCount,
                dot: "bg-amber-500",
              },
              {
                label: "Drafts",
                value: "Draft",
                count: draftCount,
                dot: "bg-slate-400",
              },
              ...(expiredCount > 0
                ? [{ label: "Expired", value: "Expired", count: expiredCount, dot: "bg-rose-500" }]
                : []),
            ].map((pill) => {
              const isActive = filterStatus === pill.value;
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setFilterStatus(pill.value as StatusType | "All")}
                  className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                    isActive
                      ? "text-white shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-emerald-50/50 hover:text-[#286038]"
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: BRAND_GREEN,
                          borderColor: BRAND_GREEN,
                        }
                      : undefined
                  }
                >
                  {pill.dot && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? "bg-white" : pill.dot
                      }`}
                    />
                  )}
                  <span>{pill.label}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search announcements…"
                className="w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#286038] focus:ring-2 focus:ring-[#286038]/15 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="w-36 shrink-0">
              <ReusableSelect
                options={[
                  { label: "All Types", value: "All" },
                  { label: "Announcement", value: "Announcement" },
                  { label: "Store Update", value: "Update" },
                  { label: "Offer", value: "Offer" },
                ]}
                value={filterType}
                onValueChange={(val) => setFilterType(val as AnnouncementType | "All")}
                className="h-8 text-xs bg-white rounded-lg border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
                <div className="h-7 w-24 bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-16 px-6 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3.5">
              <Inbox size={22} className="text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">No announcements found</h4>
            <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">
              {searchQuery || filterType !== "All" || filterStatus !== "All"
                ? "No announcements matched your current filters. Try resetting your search or filter criteria."
                : "Create an announcement banner to inform your customers about special offers, new items, or operating hours."}
            </p>
            {!isComposing && (
              <button
                type="button"
                onClick={handleStartCompose}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                style={{
                  backgroundColor: BRAND_GREEN,
                  boxShadow: "0 2px 8px rgba(40, 96, 56, 0.25)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND_GREEN_HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND_GREEN)}
              >
                <Plus size={14} />
                <span>Create Announcement</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-6">Announcement Message</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status & Schedule</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Message Column */}
                    <td className="py-3.5 px-6 max-w-md">
                      <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
                        {item.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-medium">
                        <span>{timeAgo(item.date)}</span>
                        <span>·</span>
                        <span>{fmtDate(item.date)}</span>
                      </div>
                    </td>

                    {/* Category Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                      <TypeBadge type={item.type} />
                    </td>

                    {/* Status Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                      <StatusBadge
                        status={item.status}
                        scheduleAt={item.schedule_at}
                        expireAt={item.expire_at}
                      />
                    </td>

                    {/* Action Buttons Column */}
                    <td className="py-3.5 px-6 whitespace-nowrap align-middle text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          title="Edit announcement"
                          className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-[#286038] flex items-center justify-center text-slate-500 transition-all cursor-pointer shadow-2xs"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(item)}
                          title="Duplicate as draft"
                          className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 flex items-center justify-center text-slate-500 transition-all cursor-pointer shadow-2xs"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          title="Delete announcement"
                          className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-600 flex items-center justify-center text-slate-500 transition-all cursor-pointer shadow-2xs"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
