import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Megaphone, Tag, AlertCircle, RefreshCw,
  Plus, Search, Trash2, Edit3, X,
  Clock, Eye, Image as ImageIcon, Send,
  Calendar, RotateCcw, Copy, Upload,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { SHOP_ID } from "@/services/endpoints";
import { Switch } from "@/components/ui/switch";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { DigitalStoreActionBar } from "../components/DigitalStoreActionBar";

// ─── Types & Configuration ──────────────────────────────────────────────────

export type AnnouncementType = "General" | "Offer" | "Urgent" | "Maintenance";
export type StatusType = "Draft" | "Scheduled" | "Published" | "Expired";

export interface AnnouncementItem {
  id: number;
  title?: string;
  text: string;
  date: string;
  type: AnnouncementType;
  status: StatusType;
  imageUrl?: string | null;
  schedule_at?: string | null;
  expire_at?: string | null;
  is_pinned?: boolean;
}

const BRAND_GREEN = "#286038";
const BRAND_GREEN_HOVER = "#1e4a2b";
const MAX_CHAR_LIMIT = 200;

export const TYPE_CONFIG: Record<
  AnnouncementType,
  {
    label: string;
    description: string;
    icon: React.ElementType;
    badgeClass: string;
    iconClass: string;
    previewBg: string;
    borderClass: string;
  }
> = {
  General: {
    label: "General",
    description: "Store news & announcements",
    icon: Megaphone,
    badgeClass: "bg-emerald-50 text-emerald-900 border-emerald-200",
    iconClass: "text-[#286038] bg-emerald-100",
    previewBg: "bg-[#286038]",
    borderClass: "border-emerald-300",
  },
  Offer: {
    label: "Offer",
    description: "Discounts & promotional sales",
    icon: Tag,
    badgeClass: "bg-amber-50 text-amber-900 border-amber-200",
    iconClass: "text-amber-700 bg-amber-100",
    previewBg: "bg-amber-600",
    borderClass: "border-amber-300",
  },
  Urgent: {
    label: "Urgent",
    description: "Critical alerts & urgent notices",
    icon: AlertCircle,
    badgeClass: "bg-rose-50 text-rose-900 border-rose-200",
    iconClass: "text-rose-600 bg-rose-100",
    previewBg: "bg-rose-600",
    borderClass: "border-rose-300",
  },
  Maintenance: {
    label: "Maintenance",
    description: "Hours, holiday & logistics updates",
    icon: RefreshCw,
    badgeClass: "bg-blue-50 text-blue-900 border-blue-200",
    iconClass: "text-blue-700 bg-blue-100",
    previewBg: "bg-blue-600",
    borderClass: "border-blue-300",
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
    label: "Inactive / Draft",
  },
  Scheduled: {
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    label: "Scheduled",
  },
  Published: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    label: "Active on Store",
  },
  Expired: {
    dot: "bg-rose-500",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    label: "Expired",
  },
};

// ─── Format Helpers ─────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (isNaN(diff)) return "Recently";
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Delete Modal ───────────────────────────────────────────────────────────

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
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) onCancel();
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
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Delete Announcement</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to remove this announcement from your storefront? This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 mb-6">
          {item.title && (
            <p className="text-xs font-bold text-slate-800 mb-1">{item.title}</p>
          )}
          <p className="text-xs text-slate-600 font-medium line-clamp-3">"{item.text}"</p>
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

// ─── Main Announcement Component ────────────────────────────────────────────

interface AnnouncementsProps {
  onCountChange?: (total: number, active: number) => void;
}

export default function Announcements({ onCountChange }: AnnouncementsProps) {
  const { showToast } = useToast();
  const { shop } = useBusinessApi();

  // State
  const [history, setHistory] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementItem | null>(null);

  // Form State (Left Card)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [type, setType] = useState<AnnouncementType>("General");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActiveOnStore, setIsActiveOnStore] = useState(true);
  const [scheduleAt, setScheduleAt] = useState("");
  const [expireAt, setExpireAt] = useState("");
  const [showDates, setShowDates] = useState(false);

  // Filters (Right Card)
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Inactive">("All");
  const [filterType, setFilterType] = useState<AnnouncementType | "All">("All");

  const messageRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // ── Image Upload & File Handling ──
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (JPG, PNG, WebP)", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size exceeds 5MB limit", "error");
      return;
    }

    setIsUploadingImage(true);
    const activeShopId = localStorage.getItem("shop_id") || SHOP_ID;

    // Immediate local preview using FileReader
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Url = reader.result as string;
      setImageUrl(base64Url);

      // Attempt upload to backend media/shop endpoint
      try {
        const res: any = await shop.uploadShopImage(file, "banner", activeShopId);
        const uploadedUrl = res?.data?.url || res?.data?.image_url || res?.data?.banner_url || res?.url;
        if (uploadedUrl) {
          setImageUrl(uploadedUrl);
          showToast("Image uploaded successfully!", "success");
        }
      } catch (uploadErr) {
        console.warn("Backend image upload failed, using local data URL:", uploadErr);
        showToast("Image attached to announcement", "success");
      } finally {
        setIsUploadingImage(false);
      }
    };
    reader.onerror = () => {
      setIsUploadingImage(false);
      showToast("Failed to read image file", "error");
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ── Mapping Helpers ──
  const apiToType = (t: string): AnnouncementType => {
    const raw = String(t || "").toUpperCase();
    if (raw === "OFFER") return "Offer";
    if (raw === "URGENT") return "Urgent";
    if (raw === "UPDATES" || raw === "UPDATE" || raw === "MAINTENANCE") return "Maintenance";
    return "General";
  };

  const typeToApi = (t: AnnouncementType) => {
    if (t === "Maintenance") return "UPDATES";
    if (t === "General") return "ANNOUNCEMENT";
    return t.toUpperCase();
  };

  const apiToStatus = (
    s: any,
    sched?: string | null,
    exp?: string | null
  ): StatusType => {
    if (exp && new Date(exp).getTime() < Date.now()) {
      return "Expired";
    }
    const raw = String(s || "").trim().toUpperCase();
    if (raw === "EXPIRED") return "Expired";
    if (raw === "DRAFT") return "Draft";
    if (raw === "PUBLISHED" || raw === "ACTIVE" || raw === "LIVE") return "Published";
    if (raw === "SCHEDULED" || (sched && new Date(sched).getTime() > Date.now())) {
      return "Scheduled";
    }
    return "Draft";
  };

  // ── Load Announcements ──
  const loadAnnouncements = async () => {
    const activeShopId = localStorage.getItem("shop_id") || SHOP_ID;
    setLoading(true);
    try {
      const res = await shop.getAnnouncements(activeShopId);
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.detail?.data)
        ? res.detail.data
        : [];

      const parsed: AnnouncementItem[] = list.map((d: any) => ({
        id: d.id,
        title: d.title || undefined,
        text: d.message || "",
        date: d.schedule_at || d.created_at || new Date().toISOString(),
        type: apiToType(d.type),
        status: apiToStatus(d.status, d.schedule_at, d.expire_at),
        imageUrl: d.image_url || d.banner_url || null,
        schedule_at: d.schedule_at || null,
        expire_at: d.expire_at || null,
        is_pinned: d.is_pinned ?? false,
      }));

      setHistory(parsed);
      const activeCount = parsed.filter((p) => p.status === "Published").length;
      onCountChange?.(parsed.length, activeCount);
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // ── Counts ──
  const activeCount = history.filter((h) => h.status === "Published").length;
  const draftCount = history.filter((h) => h.status === "Draft" || h.status === "Expired").length;

  // ── Filtered Feed ──
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Status filter
      if (filterStatus === "Active" && item.status !== "Published") return false;
      if (filterStatus === "Inactive" && item.status === "Published") return false;

      // Type filter
      if (filterType !== "All" && item.type !== filterType) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchText = item.text.toLowerCase().includes(q);
        if (!matchTitle && !matchText) return false;
      }

      return true;
    });
  }, [history, filterStatus, filterType, searchQuery]);

  // ── Form Handlers ──
  const resetForm = () => {
    setEditingId(null);
    setType("General");
    setTitle("");
    setMessage("");
    setImageUrl("");
    setIsActiveOnStore(true);
    setScheduleAt("");
    setExpireAt("");
    setShowDates(false);
  };

  const handleEdit = (item: AnnouncementItem) => {
    setEditingId(item.id);
    setType(item.type);
    setTitle(item.title || "");
    setMessage(item.text);
    setImageUrl(item.imageUrl || "");
    setIsActiveOnStore(item.status === "Published");
    setScheduleAt(item.schedule_at ? item.schedule_at.slice(0, 16) : "");
    setExpireAt(item.expire_at ? item.expire_at.slice(0, 16) : "");
    setShowDates(Boolean(item.schedule_at || item.expire_at));

    // Scroll smoothly to composer
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      messageRef.current?.focus();
    }, 150);
  };

  const handleDuplicate = (item: AnnouncementItem) => {
    setEditingId(null);
    setType(item.type);
    setTitle(item.title ? `${item.title} (Copy)` : "");
    setMessage(item.text);
    setImageUrl(item.imageUrl || "");
    setIsActiveOnStore(false);
    setScheduleAt("");
    setExpireAt("");
    setShowDates(false);

    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("Announcement details duplicated into editor", "info");
  };

  const handlePublish = async (asDraftOverride?: boolean) => {
    if (!message.trim()) {
      showToast("Please enter an announcement message", "error");
      messageRef.current?.focus();
      return;
    }

    setIsSaving(true);
    const activeShopId = localStorage.getItem("shop_id") || SHOP_ID;
    const finalStatus = asDraftOverride !== undefined
      ? (asDraftOverride ? "DRAFT" : "PUBLISHED")
      : (isActiveOnStore ? "PUBLISHED" : "DRAFT");

    const payload: any = {
      type: typeToApi(type),
      message: message.trim(),
      title: title.trim() || undefined,
      image_url: imageUrl.trim() || null,
      call_to_action: null,
      schedule_at: scheduleAt ? new Date(scheduleAt).toISOString() : null,
      expire_at: expireAt ? new Date(expireAt).toISOString() : null,
      send_to: "ALL_FOLLOWED_USERS",
      status: finalStatus,
    };

    try {
      if (editingId) {
        await shop.updateAnnouncement(editingId, { ...payload, id: editingId });
        showToast("Announcement updated successfully", "success");
      } else {
        await shop.createAnnouncement(activeShopId, payload);
        showToast(
          finalStatus === "PUBLISHED"
            ? "Announcement published to your storefront!"
            : "Announcement saved as draft",
          "success"
        );
      }
      resetForm();
      loadAnnouncements();
    } catch (err: any) {
      console.error("Save announcement error:", err);
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : err?.message || "Failed to save announcement";
      showToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Quick Toggle Status On Card ──
  const handleToggleCardStatus = async (item: AnnouncementItem) => {
    const isCurrentlyActive = item.status === "Published";
    const nextStatus = isCurrentlyActive ? "DRAFT" : "PUBLISHED";
    setTogglingId(item.id);

    try {
      await shop.updateAnnouncement(item.id, {
        id: item.id,
        type: typeToApi(item.type),
        message: item.text,
        title: item.title,
        status: nextStatus,
      });

      setHistory((prev) =>
        prev.map((h) =>
          h.id === item.id
            ? { ...h, status: nextStatus === "PUBLISHED" ? "Published" : "Draft" }
            : h
        )
      );

      const newActive = history.reduce(
        (sum, h) => sum + (h.id === item.id ? (nextStatus === "PUBLISHED" ? 1 : 0) : h.status === "Published" ? 1 : 0),
        0
      );
      onCountChange?.(history.length, newActive);

      showToast(
        nextStatus === "PUBLISHED"
          ? "Announcement activated on storefront"
          : "Announcement deactivated",
        "success"
      );
    } catch (err: any) {
      console.error("Status toggle error:", err);
      showToast("Failed to toggle announcement status", "error");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete Handler ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await shop.deleteAnnouncement(deleteTarget.id);
      setHistory((prev) => prev.filter((h) => h.id !== deleteTarget.id));
      showToast("Announcement deleted successfully", "success");
      setDeleteTarget(null);
      if (editingId === deleteTarget.id) resetForm();
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

      {/* ─── TWO-COLUMN / SPLIT CARD LAYOUT ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ════════════════════════════════════════════════════════════════════
            LEFT CARD: New Announcement Create Area
        ════════════════════════════════════════════════════════════════════ */}
        <div
          ref={composerRef}
          className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden sticky top-6 transition-all"
        >
          {/* Card Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0"
                style={{ backgroundColor: "#EAF4E6", color: BRAND_GREEN }}
              >
                {editingId ? <Edit3 size={15} /> : <Megaphone size={15} />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {editingId ? `Edit Announcement #${editingId}` : "New Announcement"}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {editingId
                    ? "Update announcement details and visibility"
                    : "Create announcements to broadcast on your store"}
                </p>
              </div>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-md hover:bg-slate-200/70 transition-colors cursor-pointer flex items-center gap-1 font-medium"
              >
                <X size={13} />
                <span>Cancel</span>
              </button>
            )}
          </div>

          {/* Card Body */}
          <div className="p-5 sm:p-6 space-y-4.5">

            {/* 1. Title / Type Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Announcement Type <span className="text-emerald-700">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["General", "Offer", "Urgent", "Maintenance"] as AnnouncementType[]).map((t) => {
                  const isSelected = type === t;
                  const cfg = TYPE_CONFIG[t];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? `${cfg.badgeClass} ring-2 ring-emerald-600/30 font-semibold shadow-xs`
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.iconClass}`}>
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight">{cfg.label}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {cfg.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Headline / Title <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekend Flash Sale / Festive Notice"
                className="w-full h-9 px-3 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#286038] focus:ring-2 focus:ring-[#286038]/15 transition-all shadow-2xs"
              />
            </div>

            {/* 2. Message / Content Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Message Content <span className="text-red-500">*</span>
                </label>
                <span
                  className={`text-[11px] font-mono font-medium ${
                    message.length >= MAX_CHAR_LIMIT * 0.9 ? "text-amber-600 font-bold" : "text-slate-400"
                  }`}
                >
                  {message.length} / {MAX_CHAR_LIMIT}
                </span>
              </div>
              <textarea
                ref={messageRef}
                rows={3}
                maxLength={MAX_CHAR_LIMIT}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your announcement details here (e.g. Free shipping on all grocery orders over ₹499 this weekend)..."
                className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 leading-relaxed resize-none outline-none focus:border-[#286038] focus:ring-2 focus:ring-[#286038]/15 transition-all placeholder:text-slate-400 shadow-2xs"
              />
            </div>

            {/* 3. Optional Image or Banner Upload & URL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Banner Image <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={11} />
                    <span>Remove image</span>
                  </button>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileSelect}
              />

              {imageUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs group">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-32 sm:h-36 object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload size={12} />
                      <span>Change Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="px-2.5 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <X size={12} />
                      <span>Remove</span>
                    </button>
                  </div>
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-[10px] font-medium text-white backdrop-blur-xs flex items-center gap-1">
                    <ImageIcon size={11} />
                    <span>Image Attached</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file && fileInputRef.current) {
                        const dt = new DataTransfer();
                        dt.items.add(file);
                        fileInputRef.current.files = dt.files;
                        handleImageFileSelect({ target: fileInputRef.current } as any);
                      }
                    }}
                    className="border-2 border-dashed border-slate-200 hover:border-[#286038] hover:bg-emerald-50/20 rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-all group"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-emerald-100/60 mx-auto flex items-center justify-center mb-1.5 transition-colors">
                      {isUploadingImage ? (
                        <span className="w-4 h-4 border-2 border-[#286038] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload size={16} className="text-slate-500 group-hover:text-[#286038]" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-700 group-hover:text-[#286038]">
                      {isUploadingImage ? "Processing image..." : "Upload Announcement Image"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click to browse from computer or drag & drop (JPG, PNG, max 5MB)
                    </p>
                  </div>

                  <div className="relative">
                    <ImageIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Or paste external image link (https://...)"
                      className="w-full h-8 pl-8 pr-3 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#286038] focus:ring-1 focus:ring-[#286038]/20 transition-all font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Options: Pinned/Active Toggle & Date Schedule */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 block">
                    Active on Storefront
                  </span>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    {isActiveOnStore ? "Display immediately on customer storefront" : "Save as draft (hidden from store)"}
                  </span>
                </div>
                <Switch
                  checked={isActiveOnStore}
                  onCheckedChange={setIsActiveOnStore}
                />
              </div>

              {/* Schedule Dates Toggle */}
              <div className="pt-2 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setShowDates(!showDates)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 hover:text-[#286038] transition-colors cursor-pointer"
                >
                  <Calendar size={13} className="text-slate-400" />
                  <span>{showDates ? "Hide Schedule Dates" : "Add Schedule / Expiry Date"}</span>
                </button>

                {showDates && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5 pt-1 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[10.5px] font-medium text-slate-600 mb-1">
                        Start At
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduleAt}
                        onChange={(e) => setScheduleAt(e.target.value)}
                        className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-[#286038]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-medium text-slate-600 mb-1">
                        Expires At
                      </label>
                      <input
                        type="datetime-local"
                        value={expireAt}
                        onChange={(e) => setExpireAt(e.target.value)}
                        className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-[#286038]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Live Storefront Banner Preview */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={13} className="text-slate-400" />
                  Storefront Banner Preview
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isActiveOnStore 
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}>
                  {isActiveOnStore ? "Live on Storefront" : "Draft Preview"}
                </span>
              </div>

              {/* Functional Dynamic Storefront Banner Preview Card */}
              <div className="rounded-xl overflow-hidden border border-slate-200/90 shadow-2xs bg-white transition-all">
                {/* Banner Image Preview if image URL exists */}
                {imageUrl.trim() && (
                  <div className="w-full h-36 sm:h-44 bg-slate-100 relative overflow-hidden border-b border-slate-100">
                    <img
                      src={imageUrl.trim()}
                      alt="Storefront banner preview"
                      className="w-full h-full object-cover transition-opacity duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-[10px] font-medium text-white backdrop-blur-xs flex items-center gap-1">
                      <ImageIcon size={11} />
                      <span>Banner Image</span>
                    </div>
                  </div>
                )}

                {/* Banner Message Bar */}
                <div
                  className={`p-3.5 text-white bg-gradient-to-r transition-all duration-200 ${
                    type === "Offer"
                      ? "from-amber-600 via-orange-600 to-amber-700"
                      : type === "Urgent"
                      ? "from-rose-600 via-red-600 to-rose-700"
                      : type === "Maintenance"
                      ? "from-blue-600 via-sky-600 to-blue-700"
                      : "from-emerald-700 via-[#15803d] to-[#1e4a2b]"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Badge Icon */}
                    <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 mt-0.5">
                      {type === "Offer" && <Tag size={13} className="text-white" />}
                      {type === "Urgent" && <AlertCircle size={13} className="text-white" />}
                      {type === "Maintenance" && <RefreshCw size={13} className="text-white" />}
                      {type === "General" && <Megaphone size={13} className="text-white" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-black/25 text-white/95">
                          {type === "Offer"
                            ? "Special Offer"
                            : type === "Urgent"
                            ? "Urgent Alert"
                            : type === "Maintenance"
                            ? "Store Notice"
                            : "Announcement"}
                        </span>
                        {title.trim() && (
                          <span className="text-xs sm:text-sm font-bold text-white drop-shadow-xs">
                            {title.trim()}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-white/95 leading-relaxed font-normal break-words">
                        {message.trim() || (
                          <span className="italic text-white/70">
                            Your customer broadcast announcement will appear here in real time as you compose…
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Action Button */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                disabled={!message.trim() || isSaving}
                onClick={() => handlePublish()}
                className="flex-1 h-10 px-4 rounded-xl text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
                <span>
                  {editingId
                    ? "Update Announcement"
                    : isActiveOnStore
                    ? "Publish Announcement"
                    : "Create Announcement"}
                </span>
              </button>

              {!editingId && (
                <button
                  type="button"
                  disabled={!message.trim() || isSaving}
                  onClick={() => handlePublish(true)}
                  className="h-10 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  title="Save as Inactive Draft"
                >
                  Save Draft
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            RIGHT CARD: History of Announcements
        ════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          
          {/* Header with count */}
          <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  Announcements History
                </h3>
                <span className="text-xs font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full font-mono">
                  {history.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeCount} live on store · {draftCount} drafts or expired
              </p>
            </div>

            <button
              type="button"
              onClick={loadAnnouncements}
              disabled={loading}
              className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Refresh announcements list"
            >
              <RotateCcw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Search bar & Filter dropdowns */}
          <div className="p-3.5 sm:px-6 sm:py-3 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search announcements…"
                className="w-full h-8 pl-8 pr-3 bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#286038] focus:ring-2 focus:ring-[#286038]/15 transition-all"
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

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2">
              {/* Status Filter */}
              <div className="w-32 shrink-0">
                <ReusableSelect
                  options={[
                    { label: "All Status", value: "All" },
                    { label: "Active", value: "Active" },
                    { label: "Inactive", value: "Inactive" },
                  ]}
                  value={filterStatus}
                  onValueChange={(val) => setFilterStatus(val as any)}
                  className="h-8 text-xs bg-white rounded-lg border-slate-200"
                />
              </div>

              {/* Type Filter */}
              <div className="w-32 shrink-0">
                <ReusableSelect
                  options={[
                    { label: "All Types", value: "All" },
                    { label: "General", value: "General" },
                    { label: "Offer", value: "Offer" },
                    { label: "Urgent", value: "Urgent" },
                    { label: "Maintenance", value: "Maintenance" },
                  ]}
                  value={filterType}
                  onValueChange={(val) => setFilterType(val as any)}
                  className="h-8 text-xs bg-white rounded-lg border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* List/Feed of past announcements */}
          <div className="divide-y divide-slate-100 flex-1">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse space-y-2 p-3 bg-slate-50/60 rounded-xl">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 rounded w-4/5" />
                  </div>
                ))}
              </div>
            ) : filteredHistory.length === 0 ? (
              /* Empty state if no announcements found */
              <div className="py-16 px-6 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#286038] flex items-center justify-center mb-3.5">
                  <Megaphone size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  {searchQuery || filterStatus !== "All" || filterType !== "All"
                    ? "No matching announcements"
                    : "No announcements created yet"}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">
                  {searchQuery || filterStatus !== "All" || filterType !== "All"
                    ? "No announcements matched your current filters. Try resetting your search or filter options."
                    : "Create announcements from the left card to inform customers about offers, flash sales, and operating hours."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    messageRef.current?.focus();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  style={{ backgroundColor: BRAND_GREEN }}
                >
                  <Plus size={14} />
                  <span>Create Announcement</span>
                </button>
              </div>
            ) : (
              /* Feed of cards */
              <div className="p-4 sm:p-5 space-y-3.5">
                {filteredHistory.map((item) => {
                  const typeCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.General;
                  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.Draft;
                  const TypeIcon = typeCfg.icon;
                  const isItemActive = item.status === "Published";
                  const isItemToggling = togglingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all duration-150 ${
                        editingId === item.id
                          ? "bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-500/20"
                          : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      {/* Top Row: Badges and Date */}
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                        <div className="flex items-center gap-2">
                          {/* Type Badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${typeCfg.badgeClass}`}
                          >
                            <TypeIcon size={12} className="shrink-0" />
                            <span>{typeCfg.label}</span>
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${
                                isItemActive ? "animate-pulse" : ""
                              }`}
                            />
                            <span>{statusCfg.label}</span>
                          </span>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                          <Clock size={11} className="shrink-0 text-slate-400" />
                          <span>{timeAgo(item.date)}</span>
                          <span>·</span>
                          <span>{fmtDate(item.date)}</span>
                        </div>
                      </div>

                      {/* Title if provided */}
                      {item.title && (
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1 leading-snug">
                          {item.title}
                        </h4>
                      )}

                      {/* Message Excerpt */}
                      <p className="text-xs text-slate-700 leading-relaxed break-words">
                        {item.text}
                      </p>

                      {/* Optional Banner Image Preview */}
                      {item.imageUrl && (
                        <div className="mt-2.5 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group">
                          <img
                            src={item.imageUrl}
                            alt="Banner"
                            className="w-full h-32 sm:h-36 object-cover transition-transform duration-300 group-hover:scale-102"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        </div>
                      )}

                      {/* Schedule info if applicable */}
                      {(item.schedule_at || item.expire_at) && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-3 text-[10.5px] text-slate-500">
                          {item.schedule_at && (
                            <span className="flex items-center gap-1">
                              <Calendar size={11} className="text-slate-400" />
                              Starts: {fmtDate(item.schedule_at)}
                            </span>
                          )}
                          {item.expire_at && (
                            <span className="flex items-center gap-1">
                              <Clock size={11} className="text-slate-400" />
                              Expires: {fmtDate(item.expire_at)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action Row on Card: Toggle status, Edit, Delete */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
                        {/* Quick Toggle Status */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isItemToggling}
                            onClick={() => handleToggleCardStatus(item)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                              isItemActive
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                            }`}
                            title={isItemActive ? "Deactivate announcement" : "Activate on storefront"}
                          >
                            {isItemToggling ? (
                              <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isItemActive ? "bg-emerald-600" : "bg-slate-400"
                                }`}
                              />
                            )}
                            <span>{isItemActive ? "Active" : "Inactive"}</span>
                          </button>
                        </div>

                        {/* Edit, Duplicate, Delete Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDuplicate(item)}
                            title="Duplicate as new draft"
                            className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#286038] flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                          >
                            <Copy size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            title="Edit announcement"
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#286038] text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
                          >
                            <Edit3 size={12} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            title="Delete announcement"
                            className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Fixed Bottom Action Bar for Announcements Tab ── */}
      <DigitalStoreActionBar
        status={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Storefront Announcements:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              {activeCount} Active on Store
            </span>
            {editingId ? (
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                Editing Announcement #{editingId}
              </span>
            ) : draftCount > 0 ? (
              <span className="text-xs text-slate-400 hidden md:inline">({draftCount} drafts)</span>
            ) : null}
          </div>
        }
      >
        <button
          type="button"
          disabled={!message.trim() || isSaving}
          onClick={() => handlePublish()}
          className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-[#286038] hover:bg-[#1e4a2b] active:scale-98"
          style={{ boxShadow: "0 2px 8px rgba(40, 96, 56, 0.3)" }}
        >
          {isSaving ? (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={14} />
          )}
          <span>
            {editingId
              ? "Update Announcement"
              : isActiveOnStore
              ? "Publish Announcement"
              : "Create Announcement"}
          </span>
        </button>
      </DigitalStoreActionBar>
    </div>
  );
}
