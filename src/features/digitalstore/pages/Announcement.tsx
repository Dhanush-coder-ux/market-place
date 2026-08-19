import { useState, useRef, useEffect } from "react";
import {
  Megaphone, RefreshCw, Gift, Sparkles,
  Inbox, Send, Clock,
  Copy, Trash2, Edit3, CheckCircle2,
  Smile, Timer, ChevronDown, Calendar,
  Users, X,
} from "lucide-react";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { SHOP_ID } from "@/services/endpoints";

// ─── Types & Interfaces ──────────────────────────────────────────────────────

type AnnouncementType = "Announcement" | "Update" | "Offer";
type StatusType = "Draft" | "Scheduled" | "Published";

interface AnnouncementItem {
  id: number;
  text: string;
  date: string;
  type: AnnouncementType;
  status: StatusType;
  audience: string;
  views: number;
  call_to_action?: string;
  schedule_at?: string | null;
  expire_at?: string | null;
}

interface TypeConfigDetails {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  emoji: React.ReactNode;
  gradientSolid: string;
  accentRgb: string;
}

// ─── Design Config ────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AnnouncementType, TypeConfigDetails> = {
  Announcement: {
    label: "Announcement",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    emoji: <Megaphone size={13} strokeWidth={2.5} />,
    gradientSolid: "#3b82f6",
    accentRgb: "59, 130, 246",
  },
  Update: {
    label: "Update",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    emoji: <RefreshCw size={13} strokeWidth={2.5} />,
    gradientSolid: "#f59e0b",
    accentRgb: "245, 158, 11",
  },
  Offer: {
    label: "Offer",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    emoji: <Gift size={13} strokeWidth={2.5} />,
    gradientSolid: "#10b981",
    accentRgb: "16, 185, 129",
  },
};

const STATUS_CONFIG: Record<StatusType, { dot: string; bg: string; text: string; border: string }> = {
  Draft:     { dot: "bg-slate-400",   bg: "bg-slate-100",   text: "text-slate-600",   border: "border-slate-200" },
  Scheduled: { dot: "bg-amber-500",   bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200" },
  Published: { dot: "bg-emerald-500", bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200" },
};

const AI_SUGGESTIONS: { text: string; type: AnnouncementType }[] = [
  { text: "🎉 Grand sale — up to 50% off this weekend only!", type: "Offer" },
  { text: "⏰ We're closing early today at 6 PM. Plan accordingly!", type: "Update" },
  { text: "🆕 New arrivals just landed. Come see what's fresh!", type: "Announcement" },
  { text: "🎁 Buy 2 get 1 free on all bakery items today only.", type: "Offer" },
  { text: "🔧 Scheduled maintenance on Sunday 2–4 AM. Brief downtime expected.", type: "Update" },
  { text: "🎊 We just hit 10,000 customers! Thank you for your support.", type: "Announcement" },
];

const EMOJI_LIST = ["🎉", "🔥", "⭐", "💥", "🎁", "⚡", "🚀", "💯", "🌟", "👋", "🛍️", "❤️"];

const AUDIENCE_OPTIONS = [
  { value: "ALL_FOLLOWED_USERS", label: "All followers" },
  { value: "ALL_USERS", label: "All users" },
];

// ─── Utility ──────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusType }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} inline-block`} />
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: AnnouncementType }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      <span className="flex items-center justify-center">{cfg.emoji}</span>
      {type}
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/50" onClick={isSaving ? undefined : onCancel} />
      <div className="relative bg-white rounded-xl border border-slate-200 shadow-xl p-6 w-[400px] max-w-[90vw]">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <Trash2 size={16} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Delete Announcement</h3>
            <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
              Permanently delete "
              <span className="font-medium text-slate-700">{item.text.slice(0, 50)}…</span>"?
              This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            disabled={isSaving}
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={isSaving}
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving && <Timer size={13} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const { shop } = useBusinessApi();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [type, setType] = useState<AnnouncementType>("Announcement");
  const [status, setStatus] = useState<StatusType>("Draft");
  const [audience, setAudience] = useState("ALL_FOLLOWED_USERS");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [sent, setSent] = useState(false);
  const [, setIsSaving] = useState(false);

  const [showEmoji, setShowEmoji] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [history, setHistory] = useState<AnnouncementItem[]>([]);
  const [filterType, setFilterType] = useState<AnnouncementType | "All">("All");
  const [filterStatus, setFilterStatus] = useState<StatusType | "All">("All");
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementItem | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "history">("editor");

  const textRef = useRef<HTMLTextAreaElement>(null);
  const MAX = 160;
  const charCount = text.length;
  const isOverLimit = charCount >= MAX * 0.9;

  // Map API to UI Enums
  const apiToType = (t: string): AnnouncementType => {
    if (t === "OFFER") return "Offer";
    if (t === "UPDATES") return "Update";
    return "Announcement";
  };
  const typeToApi = (t: AnnouncementType) => {
    if (t === "Update") return "UPDATES";
    return t.toUpperCase();
  };
  const apiToStatus = (s: string): StatusType => {
    if (s === "SCHEDULED") return "Scheduled";
    if (s === "PUBLISHED") return "Published";
    return "Draft";
  };
  const statusToApi = (s: StatusType) => s.toUpperCase();

  const loadAnnouncements = () => {
    shop.getAnnouncements(SHOP_ID).then((res) => {
      if (res && res.data && Array.isArray(res.data)) {
        setHistory(
          res.data.map((d: any) => ({
            id: d.id,
            text: d.message || "",
            date: d.schedule_at || d.created_at || new Date().toISOString(),
            type: apiToType(d.type),
            status: apiToStatus(d.status),
            audience: d.send_to || "ALL_FOLLOWED_USERS",
            views: 0,
            call_to_action: d.call_to_action,
            schedule_at: d.schedule_at,
            expire_at: d.expire_at,
          }))
        );
      }
    }).catch(console.error);
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const filteredHistory = history.filter(
    (h) =>
      (filterType === "All" || h.type === filterType) &&
      (filterStatus === "All" || h.status === filterStatus)
  );

  const publishedCount = history.filter((h) => h.status === "Published").length;
  const scheduledCount = history.filter((h) => h.status === "Scheduled").length;
  const draftCount = history.filter((h) => h.status === "Draft").length;

  const resetForm = () => {
    setText(""); setCtaLabel(""); setCtaUrl("");
    setStatus("Draft"); setScheduleDate(""); setScheduleTime(""); setEditingId(null);
  };

  const handlePublish = async () => {
    if (!text.trim()) return;
    setIsSaving(true);
    const apiType = typeToApi(type);
    const apiStatus = scheduleDate ? "SCHEDULED" : statusToApi(status);
    const cta = ctaLabel && ctaUrl ? `${ctaLabel}||${ctaUrl}` : ctaLabel;
    const payload = {
      type: apiType,
      message: text,
      call_to_action: cta || null,
      schedule_at: scheduleDate
        ? new Date(`${scheduleDate}T${scheduleTime || "00:00"}`).toISOString()
        : null,
      send_to: audience,
      status: apiStatus,
    };
    try {
      if (editingId) {
        await shop.updateAnnouncement(editingId, { ...payload, id: editingId });
      } else {
        await shop.createAnnouncement(SHOP_ID, payload);
      }
      setSent(true);
      loadAnnouncements();
      setTimeout(() => { setSent(false); resetForm(); }, 1800);
    } catch (err) {
      console.error(err);
      alert("Failed to save announcement.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = (item: AnnouncementItem) => {
    setText(item.text);
    setType(item.type);
    setStatus("Draft");
    setAudience(item.audience);
    setEditingId(null);
    if (item.call_to_action) {
      const parts = item.call_to_action.split("||");
      setCtaLabel(parts[0] || "");
      setCtaUrl(parts[1] || "");
    }
    setActiveTab("editor");
    textRef.current?.focus();
  };

  const handleEdit = (item: AnnouncementItem) => {
    setText(item.text);
    setType(item.type);
    setStatus(item.status);
    setAudience(item.audience);
    setEditingId(item.id);
    if (item.schedule_at) {
      const iso = new Date(item.schedule_at).toISOString();
      setScheduleDate(iso.slice(0, 10));
      setScheduleTime(iso.slice(11, 16));
    }
    if (item.call_to_action) {
      const parts = item.call_to_action.split("||");
      setCtaLabel(parts[0] || "");
      setCtaUrl(parts[1] || "");
    }
    setActiveTab("editor");
    textRef.current?.focus();
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      setIsSaving(true);
      try {
        await shop.deleteAnnouncement(deleteTarget.id);
        setHistory((prev) => prev.filter((h) => h.id !== deleteTarget.id));
        setDeleteTarget(null);
      } catch (err) {
        console.error(err);
        alert("Failed to delete.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAI = () => {
    setAiLoading(true);
    const pick = AI_SUGGESTIONS[Math.floor(Math.random() * AI_SUGGESTIONS.length)];
    setTimeout(() => {
      setText(pick.text);
      setType(pick.type);
      setAiLoading(false);
      textRef.current?.focus();
    }, 900);
  };

  const insertEmoji = (emoji: string) => {
    const el = textRef.current;
    if (!el) return;
    const start = el.selectionStart, end = el.selectionEnd;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText.slice(0, MAX));
    setTimeout(() => {
      el.setSelectionRange(start + emoji.length, start + emoji.length);
      el.focus();
    }, 0);
    setShowEmoji(false);
  };

  return (
    <>
      <style>{`
        @keyframes ann-fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ann-slideUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes ann-spin { to { transform: rotate(360deg) } }
        .ann-spin { animation: ann-spin 0.7s linear infinite; }
      `}</style>

      {deleteTarget && (
        <DeleteModal
          item={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div style={{ fontFamily: "Inter, sans-serif" }}>

        {/* ── Page Header ────────────────────────────────────────── */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Announcements</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Broadcast messages across store, WhatsApp & notifications
            </p>
          </div>

          {/* Stat pills + tab switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[12px] text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" />
                {publishedCount} published
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1">
                <Clock size={12} className="text-amber-500" />
                {scheduledCount} scheduled
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1">
                <Edit3 size={12} className="text-slate-400" />
                {draftCount} drafts
              </span>
            </div>

            <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setActiveTab("editor")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "editor"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Compose
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l border-slate-200 ${
                  activeTab === "history"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                History
              </button>
            </div>
          </div>
        </div>

        {/* ═══ EDITOR TAB ════════════════════════════════════════ */}
        {activeTab === "editor" && (
          <div
            className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5"
            style={{ animation: "ann-fadeIn 0.2s ease" }}
          >
            {/* ── Left: Compose form ── */}
            <div className="space-y-4">
              {editingId && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <span className="text-blue-700 font-medium flex items-center gap-2">
                    <Edit3 size={13} /> Editing announcement #{editingId}
                  </span>
                  <button
                    onClick={resetForm}
                    className="text-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Main editor card */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Textarea */}
                <div className="px-4 pt-4 pb-2">
                  <label className="block text-xs font-medium text-slate-500 mb-2">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    ref={textRef}
                    rows={6}
                    maxLength={MAX}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write a clear and engaging announcement for your customers…"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 leading-relaxed resize-none outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all placeholder-slate-400"
                  />

                  {/* char count + progress */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      {/* Emoji picker */}
                      <div className="relative">
                        <button
                          onClick={() => setShowEmoji((p) => !p)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Add emoji"
                        >
                          <Smile size={14} />
                        </button>
                        {showEmoji && (
                          <div
                            className="absolute left-0 top-[calc(100%+4px)] z-50 bg-white border border-slate-200 rounded-xl p-2.5 grid grid-cols-6 gap-1 shadow-lg"
                            style={{ animation: "ann-slideUp 0.15s ease" }}
                          >
                            {EMOJI_LIST.map((e) => (
                              <button
                                key={e}
                                onClick={() => insertEmoji(e)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer text-base"
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* AI Suggest */}
                      <button
                        disabled={aiLoading}
                        onClick={handleAI}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {aiLoading ? (
                          <span className="w-3 h-3 border-2 border-slate-200 border-t-blue-600 rounded-full inline-block ann-spin" />
                        ) : (
                          <Sparkles size={12} />
                        )}
                        AI Suggest
                      </button>
                    </div>

                    <span
                      className={`text-[12px] font-mono font-medium ${
                        isOverLimit ? "text-red-500" : "text-slate-400"
                      }`}
                    >
                      {charCount}/{MAX}
                    </span>
                  </div>
                </div>

                {/* Quick templates when empty */}
                {!text && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
                      Quick templates
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {AI_SUGGESTIONS.slice(0, 3).map((s, i) => (
                        <button
                          key={i}
                          onClick={() => { setText(s.text); setType(s.type); textRef.current?.focus(); }}
                          className="py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 cursor-pointer hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          {s.text.slice(0, 38)}…
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CTA (optional) */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <label className="block text-xs font-medium text-slate-500 mb-3">
                  Call to Action <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Button Label</label>
                    <input
                      type="text"
                      value={ctaLabel}
                      onChange={(e) => setCtaLabel(e.target.value)}
                      placeholder="e.g. Shop Now"
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">URL</label>
                    <input
                      type="url"
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      placeholder="https://…"
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: Settings panel ── */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-5">

                {/* Type */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Type</label>
                  <div className="space-y-1.5">
                    {(Object.keys(TYPE_CONFIG) as AnnouncementType[]).map((t) => {
                      const tcfg = TYPE_CONFIG[t];
                      const isActive = type === t;
                      return (
                        <button
                          key={t}
                          onClick={() => setType(t)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                            isActive
                              ? `${tcfg.bg} ${tcfg.text} ${tcfg.border}`
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span className="flex items-center">{tcfg.emoji}</span>
                          {t}
                          {isActive && (
                            <CheckCircle2 size={13} className="ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Status</label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as StatusType)}
                      className="w-full h-9 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none appearance-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all cursor-pointer"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Published">Published</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Schedule date/time — show when Scheduled */}
                {status === "Scheduled" && (
                  <div style={{ animation: "ann-fadeIn 0.2s ease" }}>
                    <label className="block text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
                      <Calendar size={12} className="text-amber-500" />
                      Schedule Date & Time
                    </label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all cursor-pointer"
                      />
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all cursor-pointer"
                      />
                      {scheduleDate && scheduleTime && (
                        <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                          <Clock size={11} />
                          Goes live:{" "}
                          {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100" />

                {/* Audience */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
                    <Users size={12} />
                    Audience
                  </label>
                  <div className="relative">
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none appearance-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all cursor-pointer"
                    >
                      {AUDIENCE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => { setStatus("Draft"); handlePublish(); }}
                    disabled={!text.trim() || sent}
                    className="w-full h-9 px-4 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Save Draft
                  </button>

                  <button
                    onClick={handlePublish}
                    disabled={!text.trim() || sent}
                    className={`w-full h-9 px-4 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      sent
                        ? "bg-emerald-500 text-white"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {sent ? (
                      <><CheckCircle2 size={14} /> Saved!</>
                    ) : status === "Scheduled" ? (
                      <><Clock size={14} /> Schedule</>
                    ) : (
                      <><Send size={14} /> Publish Now</>
                    )}
                  </button>
                </div>
              </div>

              {/* Summary card */}
              {(type || status) && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Summary</p>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-[12px] text-slate-500">Type</span>
                    <TypeBadge type={type} />
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-[12px] text-slate-500">Status</span>
                    <StatusBadge status={scheduleDate ? "Scheduled" : status} />
                  </div>
                  {ctaLabel && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[12px] text-slate-500">CTA</span>
                      <span className="text-[12px] font-medium text-blue-600">{ctaLabel}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ HISTORY TAB ════════════════════════════════════════ */}
        {activeTab === "history" && (
          <div
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            style={{ animation: "ann-fadeIn 0.2s ease" }}
          >
            {/* Filters */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 flex-wrap bg-slate-50/60">
              {/* Type filter */}
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as AnnouncementType | "All")}
                  className="h-8 pl-3 pr-7 bg-white border border-slate-200 rounded-lg text-[12px] font-medium text-slate-600 outline-none appearance-none focus:border-blue-400 cursor-pointer"
                >
                  <option value="All">All Types</option>
                  {(Object.keys(TYPE_CONFIG) as AnnouncementType[]).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Status filter */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as StatusType | "All")}
                  className="h-8 pl-3 pr-7 bg-white border border-slate-200 rounded-lg text-[12px] font-medium text-slate-600 outline-none appearance-none focus:border-blue-400 cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Published">Published</option>
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <div className="flex-1" />
              <span className="text-[12px] text-slate-500 font-medium">
                {filteredHistory.length} result{filteredHistory.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[1fr_110px_100px_120px] gap-4 px-5 py-2.5 border-b border-slate-100 bg-slate-50/40">
              {["Message", "Type", "Status", "Actions"].map((h) => (
                <span key={h} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {filteredHistory.length === 0 ? (
              <div className="py-16 px-5 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                  <Inbox size={22} className="text-slate-400" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">No announcements found</p>
                <p className="text-[12px] text-slate-400">Try adjusting your filters or create a new one</p>
              </div>
            ) : (
              filteredHistory.map((item, idx) => (
                <div
                  key={item.id}
                  className={`grid grid-cols-[1fr_110px_100px_120px] gap-4 px-5 py-3.5 items-center hover:bg-slate-50/70 transition-colors ${
                    idx < filteredHistory.length - 1 ? "border-b border-slate-100" : ""
                  }`}
                  style={{ animation: `ann-fadeIn 0.15s ease ${idx * 0.03}s both` }}
                >
                  {/* Message */}
                  <div>
                    <p className="text-sm font-medium text-slate-800 line-clamp-1">{item.text}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {timeAgo(item.date)} · {fmtDate(item.date)}
                    </p>
                  </div>
                  <TypeBadge type={item.type} />
                  <StatusBadge status={item.status} />

                  {/* Actions */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleEdit(item)}
                      title="Edit"
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={() => handleDuplicate(item)}
                      title="Duplicate"
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      title="Delete"
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
