import { useState, useRef } from "react";
import {
  Megaphone, RefreshCw, Gift, Smile, Sparkles, PenTool,
  History, Inbox, Eye, Send, Clock, Users, TrendingUp,
  Copy, Trash2, Edit3, CheckCircle2, Zap, Bell, MessageCircle,
  Monitor, Smartphone
} from "lucide-react";

// ─── Types & Interfaces ──────────────────────────────────────────────────────

type AnnouncementType = "Announcement" | "Update" | "Offer";
type StatusType = "Draft" | "Scheduled" | "Published";
type PreviewMode = "banner" | "toast" | "whatsapp";

interface AudienceOption {
  value: string;
  label: string;
  desc: string;
  icon: string;
}

interface AnnouncementItem {
  id: number;
  text: string;
  date: string;
  type: AnnouncementType;
  status: StatusType;
  audience: string;
  views: number;
}

interface TypeConfigDetails {
  label: string;
  colorClass: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  emoji: React.ReactNode;
  gradient: string;
  gradientSolid: string;
  accentRgb: string;
  waBubbleGradient: string;
}

// ─── Design Config ────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AnnouncementType, TypeConfigDetails> = {
  Announcement: {
    label: "Announcement",
    colorClass: "bg-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    emoji: <Megaphone size={14} strokeWidth={2.5} />,
    gradient: "bg-blue-500",
    gradientSolid: "#3b82f6",
    accentRgb: "59, 130, 246",
    waBubbleGradient: "#3b82f6",
  },
  Update: {
    label: "Update",
    colorClass: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    emoji: <RefreshCw size={14} strokeWidth={2.5} />,
    gradient: "bg-amber-500",
    gradientSolid: "#f59e0b",
    accentRgb: "245, 158, 11",
    waBubbleGradient: "#f59e0b",
  },
  Offer: {
    label: "Offer",
    colorClass: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    emoji: <Gift size={14} strokeWidth={2.5} />,
    gradient: "bg-emerald-500",
    gradientSolid: "#10b981",
    accentRgb: "16, 185, 129",
    waBubbleGradient: "#10b981",
  },
};

const STATUS_CONFIG: Record<StatusType, { dot: string; bg: string; text: string; icon: React.ReactNode }> = {
  Draft: { dot: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-600", icon: <Edit3 size={10} /> },
  Scheduled: { dot: "bg-amber-500", bg: "bg-amber-100", text: "text-amber-800", icon: <Clock size={10} /> },
  Published: { dot: "bg-emerald-500", bg: "bg-emerald-100", text: "text-emerald-800", icon: <CheckCircle2 size={10} /> },
};

const AUDIENCE_OPTIONS: AudienceOption[] = [
  { value: "all", label: "All Users", desc: "Everyone sees this", icon: "👥" },
  { value: "new", label: "New Users", desc: "First-time visitors", icon: "🌱" },
  { value: "returning", label: "Returning", desc: "Logged-in members", icon: "🔁" },
  { value: "vip", label: "VIP Members", desc: "Top-tier customers", icon: "👑" },
];

const AI_SUGGESTIONS: { text: string; type: AnnouncementType }[] = [
  { text: "🎉 Grand sale — up to 50% off this weekend only!", type: "Offer" },
  { text: "⏰ We're closing early today at 6 PM. Plan accordingly!", type: "Update" },
  { text: "🆕 New arrivals just landed. Come see what's fresh!", type: "Announcement" },
  { text: "🎁 Buy 2 get 1 free on all bakery items today only.", type: "Offer" },
  { text: "🔧 Scheduled maintenance on Sunday 2–4 AM. Brief downtime expected.", type: "Update" },
  { text: "🎊 We just hit 10,000 customers! Thank you for your support.", type: "Announcement" },
];

const EMOJI_LIST = ["🎉", "🔥", "⭐", "💥", "🎁", "⚡", "🚀", "💯", "🌟", "👋", "🛍️", "❤️"];

const MOCK_HISTORY: AnnouncementItem[] = [
  { id: 1, text: "50% off all summer drinks this weekend only!", date: "2024-05-10T10:30:00", type: "Offer", status: "Published", audience: "all", views: 1240 },
  { id: 2, text: "We are closed this Sunday for maintenance.", date: "2024-05-08T09:00:00", type: "Update", status: "Published", audience: "all", views: 890 },
  { id: 3, text: "New seasonal menu is here! Come try our new offerings.", date: "2024-05-01T14:00:00", type: "Announcement", status: "Published", audience: "returning", views: 2100 },
  { id: 4, text: "Extended hours during the festive season.", date: "2024-04-28T08:00:00", type: "Update", status: "Scheduled", audience: "all", views: 0 },
  { id: 5, text: "Buy 2 get 1 free on all bakery items!", date: "2024-04-20T11:00:00", type: "Offer", status: "Draft", audience: "new", views: 0 },
  { id: 6, text: "Introducing loyalty points — earn rewards with every purchase.", date: "2024-04-15T10:00:00", type: "Announcement", status: "Published", audience: "returning", views: 3400 },
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
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusType }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold tracking-wide ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} inline-block`} />
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: AnnouncementType }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold ${cfg.bg} ${cfg.text}`}>
      <span className="flex items-center justify-center">{cfg.emoji}</span>
      {type}
    </span>
  );
}

function DeleteModal({ item, onConfirm, onCancel }: { item: AnnouncementItem; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ animation: "ann-fadeIn 0.15s ease" }}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl p-8 w-[420px] max-w-[90vw] shadow-[0_32px_80px_rgba(0,0,0,0.2)]" style={{ animation: "ann-slideUp 0.2s ease" }}>
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-5">
          <Trash2 size={20} className="text-red-500" />
        </div>
        <h3 className="text-[18px] font-bold text-slate-900 mb-2">Delete Announcement</h3>
        <p className="text-[13.5px] text-slate-500 leading-relaxed mb-6">
          Permanently delete "<strong className="text-slate-700 font-semibold">{item.text.slice(0, 48)}…</strong>"? This cannot be undone.
        </p>
        <div className="flex gap-2.5 justify-end">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border-[1.5px] border-slate-200 bg-white text-[13.5px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
          <button onClick={onConfirm} className="px-5 py-2.5 rounded-xl bg-red-500 text-[13.5px] font-bold text-white hover:bg-red-600 transition-colors cursor-pointer">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Premium Store Banner Preview ─────────────────────────────────────────────
function PreviewStoreBanner({ announcement, type, cta }: { announcement: string; type: AnnouncementType; cta: { label: string; url: string } }) {
  const cfg = TYPE_CONFIG[type];
  const displayText = announcement || "Your announcement will appear here…";

  return (
    <div className="w-full rounded-2xl overflow-hidden" style={{ boxShadow: `0 8px 32px rgba(${cfg.accentRgb}, 0.18)` }}>
      {/* Store header chrome */}
      <div className="bg-white border-b border-slate-100 px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
        </div>
        <div className="flex-1 mx-3 bg-slate-100 rounded-lg px-3 py-1 text-[10px] text-slate-400 font-medium">
          yourstore.com
        </div>
        <Monitor size={12} className="text-slate-400" />
      </div>

      {/* The actual announcement banner */}
      <div
        className="relative overflow-hidden px-5 py-4"
        style={{ background: cfg.gradientSolid }}
      >
        {/* Decorative glowing orbs */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-xl"
          style={{ background: "rgba(255,255,255,0.6)" }} />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-15 blur-lg"
          style={{ background: "rgba(255,255,255,0.5)" }} />

        <div className="relative flex items-center gap-3.5">
          {/* Icon badge */}
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30">
            <span className="text-white">{cfg.emoji}</span>
          </div>

          {/* Text */}
          <p className="flex-1 text-[13.5px] font-semibold text-white leading-snug drop-shadow-sm m-0">
            {displayText}
          </p>

          {/* CTA Button */}
          {cta.label && (
            <button className="px-4 py-2 rounded-xl bg-white text-[12px] font-bold shrink-0 transition-all hover:scale-105 cursor-pointer"
              style={{ color: `rgb(${cfg.accentRgb})` }}>
              {cta.label}
            </button>
          )}

          {/* Close X */}
          <button className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white/80 hover:bg-white/30 transition-colors shrink-0 cursor-pointer text-xs font-bold">
            ✕
          </button>
        </div>
      </div>

      {/* Fake store content below */}
      <div className="bg-white px-4 py-3">
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-1 rounded-xl bg-slate-50 overflow-hidden">
              <div className="h-14 bg-slate-200" />
              <div className="p-2">
                <div className="h-2 bg-slate-200 rounded mb-1.5" style={{ width: `${60 + i * 10}%` }} />
                <div className="h-2 bg-slate-100 rounded" style={{ width: "40%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Toast Preview ────────────────────────────────────────────────────────────
function PreviewToast({ announcement, type }: { announcement: string; type: AnnouncementType }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <div className="w-full flex justify-end">
      <div className="relative inline-flex items-start gap-3 bg-slate-900 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-[320px] border border-white/10"
        style={{ animation: "ann-slideUp 0.25s ease" }}>
        {/* Colored left border accent */}
        <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${cfg.gradient}`} />
        <div className={`w-9 h-9 rounded-xl ${cfg.gradient} flex items-center justify-center shrink-0 ml-1`}>
          <span className="text-white">{cfg.emoji}</span>
        </div>
        <div className="flex-1">
          <p className="m-0 mb-1 text-[10px] font-black tracking-[0.1em] uppercase"
            style={{ color: `rgba(${cfg.accentRgb}, 0.9)` }}>
            {type}
          </p>
          <p className="m-0 text-[13px] font-medium text-slate-50 leading-snug">
            {announcement || "Your announcement preview…"}
          </p>
        </div>
        <Bell size={14} className="text-white/30 shrink-0 mt-0.5" />
      </div>
    </div>
  );
}

// ─── WhatsApp Preview ─────────────────────────────────────────────────────────
function PreviewWhatsApp({ announcement, type, cta }: { announcement: string; type: AnnouncementType; cta: { label: string; url: string } }) {
  const cfg = TYPE_CONFIG[type];
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const displayText = announcement || "Your announcement will appear here…";

  const typeEmoji: Record<AnnouncementType, string> = {
    Announcement: "📢",
    Update: "🔄",
    Offer: "🎁",
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-200/60"
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
      {/* WhatsApp header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#075E54" }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
          style={{ background: cfg.gradientSolid }}>
          🏪
        </div>
        <div className="flex-1">
          <p className="m-0 text-[13px] font-bold text-white leading-none mb-0.5">Your Store</p>
          <p className="m-0 text-[10px] text-green-200">Business Account · online</p>
        </div>
        <Smartphone size={14} className="text-white/60" />
      </div>

      {/* Chat background */}
      <div className="relative px-4 py-4 min-h-[180px]"
        style={{ background: "url('data:image/svg+xml,%3Csvg width=\"40\" height=\"40\" viewBox=\"0 0 40 40\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%23d1d5db\" fill-opacity=\"0.25\"%3E%3Ccircle cx=\"20\" cy=\"20\" r=\"1\"%3E%3C/circle%3E%3C/g%3E%3C/svg%3E'), #efeae2" }}>

        {/* Date chip */}
        <div className="flex justify-center mb-3">
          <span className="bg-white/80 backdrop-blur-sm text-[10px] font-medium text-slate-500 px-3 py-1 rounded-full shadow-sm">
            Today
          </span>
        </div>

        {/* Business message bubble */}
        <div className="flex items-end gap-2 max-w-[85%]">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mb-1"
            style={{ background: cfg.gradientSolid }}>
            🏪
          </div>

          {/* Bubble */}
          <div className="relative bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-slate-100/60 flex-1"
            style={{ animation: "ann-slideUp 0.3s ease" }}>

            {/* Type label */}
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 rounded-lg flex items-center justify-center text-xs"
                style={{ background: cfg.gradientSolid }}>
                {typeEmoji[type]}
              </div>
              <span className="text-[10px] font-black tracking-widest uppercase"
                style={{ color: `rgb(${cfg.accentRgb})` }}>
                {type}
              </span>
            </div>

            {/* Message text */}
            <p className="m-0 text-[13.5px] text-slate-800 leading-relaxed font-medium mb-2.5">
              {displayText}
            </p>

            {/* CTA inside bubble */}
            {cta.label && (
              <div className="border-t border-slate-100 pt-2.5 mt-1">
                <button className="w-full py-2 rounded-xl text-[12px] font-bold text-white transition-all hover:opacity-90 cursor-pointer"
                  style={{ background: cfg.gradientSolid }}>
                  {cta.label} →
                </button>
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center justify-end gap-1 mt-1.5">
              <span className="text-[10px] text-slate-400">{timeStr}</span>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 8l4 4 8-8" stroke="#34b7f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 8l4 4 8-8" stroke="#34b7f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
              </svg>
            </div>

            {/* Bubble tail */}
            <div className="absolute -bottom-1 -left-1.5 w-3 h-3 bg-white"
              style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }} />
          </div>
        </div>
      </div>

      {/* WA input bar */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[#f0f2f5] border-t border-slate-200">
        <div className="flex-1 bg-white rounded-full px-4 py-2 text-[11px] text-slate-400 font-medium flex items-center gap-2">
          <Smile size={14} className="text-slate-400" />
          Type a message
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#075E54" }}>
          <Send size={14} className="text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const [text, setText] = useState("");
  const [type, setType] = useState<AnnouncementType>("Announcement");
  const [status, setStatus] = useState<StatusType>("Draft");
  const [audience, setAudience] = useState("all");
  const [scheduleDate, setScheduleDate] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [focused, setFocused] = useState(false);
  const [sent, setSent] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("banner");
  const [history, setHistory] = useState<AnnouncementItem[]>(MOCK_HISTORY);
  const [filterType, setFilterType] = useState<AnnouncementType | "All">("All");
  const [filterStatus, setFilterStatus] = useState<StatusType | "All">("All");
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementItem | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "history">("editor");

  const textRef = useRef<HTMLTextAreaElement>(null);
  const MAX = 160;
  const progress = (text.length / MAX) * 100;
  const cfg = TYPE_CONFIG[type];

  const filteredHistory = history.filter(h =>
    (filterType === "All" || h.type === filterType) &&
    (filterStatus === "All" || h.status === filterStatus)
  );

  const handlePublish = () => {
    if (!text.trim()) return;
    const newItem: AnnouncementItem = {
      id: Date.now(), text, type,
      status: scheduleDate ? "Scheduled" : "Published",
      date: scheduleDate || new Date().toISOString(),
      audience, views: 0,
    };
    setHistory(prev => [newItem, ...prev]);
    setSent(true);
    setTimeout(() => {
      setSent(false); setText(""); setCtaLabel(""); setCtaUrl("");
      setStatus("Draft"); setScheduleDate("");
    }, 1800);
  };

  const handleDuplicate = (item: AnnouncementItem) => {
    const dup: AnnouncementItem = { ...item, id: Date.now(), status: "Draft", date: new Date().toISOString(), views: 0 };
    setHistory(prev => [dup, ...prev]);
  };

  const handleEdit = (item: AnnouncementItem) => {
    setText(item.text); setType(item.type);
    setStatus(item.status); setActiveTab("editor");
    textRef.current?.focus();
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setHistory(prev => prev.filter(h => h.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  const handleAI = () => {
    setAiLoading(true);
    const pick = AI_SUGGESTIONS[Math.floor(Math.random() * AI_SUGGESTIONS.length)];
    setTimeout(() => {
      setText(pick.text); setType(pick.type); setAiLoading(false);
      textRef.current?.focus();
    }, 900);
  };

  const insertEmoji = (emoji: string) => {
    const el = textRef.current;
    if (!el) return;
    const start = el.selectionStart, end = el.selectionEnd;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText.slice(0, MAX));
    setTimeout(() => { el.setSelectionRange(start + emoji.length, start + emoji.length); el.focus(); }, 0);
    setShowEmoji(false);
  };

  const totalViews = history.reduce((acc, h) => acc + h.views, 0);
  const publishedCount = history.filter(h => h.status === "Published").length;
  const scheduledCount = history.filter(h => h.status === "Scheduled").length;
  const draftCount = history.filter(h => h.status === "Draft").length;

  return (
    <>
      <style>{`
        @keyframes ann-fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ann-slideUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes ann-spin { to { transform: rotate(360deg) } }
        @keyframes ann-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
        @keyframes ann-shimmer { 0% { background-position: -200% center } 100% { background-position: 200% center } }
        @keyframes ann-glow { 0%,100% { box-shadow: 0 0 20px rgba(59,130,246,0.15) } 50% { box-shadow: 0 0 40px rgba(59,130,246,0.3) } }

        .ann-spin { animation: ann-spin 0.7s linear infinite; }
        .ann-pulse { animation: ann-pulse 2s ease infinite; }
        .ann-tab-active { position: relative; }
        .ann-tab-active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; border-radius: 2px; background: #3b82f6; }

        .ann-card { transition: box-shadow 0.2s ease, border-color 0.2s ease; }
        .ann-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.07); }

        .ann-history-row { transition: background 0.12s ease; }
        .ann-history-row:hover { background: #f8fafc; }

        .ann-btn-action { transition: all 0.15s ease; }
        .ann-btn-action:hover { transform: scale(1.05); }
        .ann-btn-action:active { transform: scale(0.96); }

        .ann-preview-pill { transition: all 0.15s ease; }
        .ann-preview-pill.active { box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
      `}</style>

      {deleteTarget && <DeleteModal item={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}

      <div className="min-h-screen bg-slate-50/70 pb-16 text-slate-800" style={{ fontFamily: "Inter, Poppins, sans-serif" }}>

        {/* ── Premium Page Header ──────────────────────────────────────── */}
        <div className="bg-white border-b border-slate-100 px-6 pt-5 pb-0">
          <div className="max-w-screen-xl mx-auto">

            {/* Top row */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3.5">
                {/* Icon with solid blue */}
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg"
                    style={{ background: "#3b82f6", boxShadow: "0 8px 24px rgba(59,130,246,0.3)" }}>
                    <Megaphone size={20} strokeWidth={2.5} />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white inline-block ann-pulse" />
                  </div>
                </div>
                <div>
                  <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight m-0 leading-tight">Announcements</h1>
                  <p className="text-[12.5px] text-slate-400 font-medium m-0 mt-0.5">
                    Broadcast messages across store, WhatsApp & notifications
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setActiveTab("history")}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-[12.5px] font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <History size={13} strokeWidth={2.5} />
                  History
                  <span className="bg-slate-100 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold text-slate-500">{history.length}</span>
                </button>
                <button
                  onClick={() => setActiveTab("editor")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[13px] font-bold cursor-pointer transition-all hover:opacity-90 ann-btn-action"
                  style={{ background: "#3b82f6", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}
                >
                  <Zap size={13} strokeWidth={2.5} />
                  New Announcement
                </button>
              </div>
            </div>

            {/* Stat pills */}
            <div className="flex items-center gap-4 mb-4">
              {[
                { label: "Total Views", value: totalViews.toLocaleString(), icon: <Eye size={12} />, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Published", value: publishedCount, icon: <CheckCircle2 size={12} />, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Scheduled", value: scheduledCount, icon: <Clock size={12} />, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Drafts", value: draftCount, icon: <Edit3 size={12} />, color: "text-slate-500", bg: "bg-slate-100" },
              ].map(stat => (
                <div key={stat.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${stat.bg}`}>
                  <span className={stat.color}>{stat.icon}</span>
                  <span className={`text-[11.5px] font-extrabold ${stat.color}`}>{stat.value}</span>
                  <span className="text-[11px] text-slate-400 font-medium">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-slate-100">
              {(["editor", "history"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold transition-all cursor-pointer border-b-2 ${activeTab === tab
                    ? "text-blue-700 border-blue-600"
                    : "text-slate-400 border-transparent hover:text-slate-600 hover:border-slate-200"
                    }`}
                >
                  {tab === "editor" ? <PenTool size={14} strokeWidth={2.5} /> : <History size={14} strokeWidth={2.5} />}
                  <span className="capitalize">{tab === "editor" ? "Compose" : `History (${history.length})`}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────────── */}
        <div className="max-w-screen-xl mx-auto pt-5 px-4">

          {/* ═══ EDITOR TAB ═══════════════════════════════════════════ */}
          {activeTab === "editor" && (
            <div className="grid grid-cols-[1fr_380px] gap-5" style={{ animation: "ann-fadeIn 0.2s ease" }}>

              {/* ── Left: Editor ── */}
              <div className="flex flex-col gap-4">

                {/* Main Editor Card */}
                <div
                  className="bg-white rounded-2xl overflow-hidden transition-all duration-200 ann-card"
                  style={{
                    border: focused
                      ? `2px solid rgba(${cfg.accentRgb}, 0.5)`
                      : "1.5px solid #e2e8f0",
                    boxShadow: focused
                      ? `0 0 0 4px rgba(${cfg.accentRgb}, 0.06), 0 8px 32px rgba(${cfg.accentRgb}, 0.1)`
                      : "0 2px 12px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Solid top accent bar */}
                  <div className="h-[3px]" style={{ background: cfg.gradientSolid }} />

                  {/* Toolbar */}
                  <div className="flex items-center gap-2 px-4 py-3 flex-wrap border-b border-slate-50">

                    {/* ── Type Card Selector ── */}
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                      {(Object.keys(TYPE_CONFIG) as AnnouncementType[]).map(t => {
                        const tcfg = TYPE_CONFIG[t];
                        const isActive = type === t;
                        return (
                          <button
                            key={t}
                            onClick={() => setType(t)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-bold cursor-pointer transition-all ann-btn-action border ${
                              isActive
                                ? `${tcfg.bg} ${tcfg.text} ${tcfg.border} shadow-sm`
                                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600 hover:bg-white'
                            }`}
                          >
                            <span className="flex items-center justify-center">{tcfg.emoji}</span>
                            {t}
                          </button>
                        );
                      })}
                    </div>

                    {/* ── Status Card Selector ── */}
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                      {([
                        { s: 'Draft' as StatusType,     dot: 'bg-slate-400',  activeBg: 'bg-slate-100',  activeText: 'text-slate-700',  activeBorder: 'border-slate-300',  emoji: '✏️' },
                        { s: 'Scheduled' as StatusType, dot: 'bg-amber-400',  activeBg: 'bg-amber-50',   activeText: 'text-amber-800',  activeBorder: 'border-amber-300',  emoji: '⏰' },
                        { s: 'Published' as StatusType, dot: 'bg-emerald-400',activeBg: 'bg-emerald-50', activeText: 'text-emerald-800',activeBorder: 'border-emerald-300',emoji: '✅' },
                      ]).map(({ s, dot, activeBg, activeText, activeBorder, emoji }) => {
                        const isActive = status === s;
                        return (
                          <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-bold cursor-pointer transition-all ann-btn-action border ${
                              isActive
                                ? `${activeBg} ${activeText} ${activeBorder} shadow-sm`
                                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600 hover:bg-white'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? dot : 'bg-slate-300'} inline-block shrink-0`} />
                            {s}
                          </button>
                        );
                      })}
                    </div>

                    {/* ── Audience Card Selector ── */}
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                      {AUDIENCE_OPTIONS.map(opt => {
                        const isActive = audience === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setAudience(opt.value)}
                            title={opt.desc}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-bold cursor-pointer transition-all ann-btn-action border ${
                              isActive
                                ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
                                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600 hover:bg-white'
                            }`}
                          >
                            <span className="text-sm leading-none">{opt.icon}</span>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex-1" />

                    {/* Emoji picker */}
                    <div className="relative">
                      <button
                        onClick={() => setShowEmoji(p => !p)}
                        className="p-2 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer ann-btn-action"
                      >
                        <Smile size={16} strokeWidth={2.5} />
                      </button>
                      {showEmoji && (
                        <div className="absolute right-0 top-[calc(100%+6px)] z-50 bg-white border border-slate-200 rounded-2xl p-3 grid grid-cols-6 gap-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
                          style={{ animation: "ann-slideUp 0.15s ease" }}>
                          {EMOJI_LIST.map(e => (
                            <button key={e} onClick={() => insertEmoji(e)}
                              className="w-9 h-9 rounded-xl border-none bg-transparent cursor-pointer text-base flex items-center justify-center hover:bg-slate-100 transition-colors ann-btn-action">
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
                      className={`inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl border text-[12px] font-bold cursor-pointer transition-all ann-btn-action ${aiLoading
                        ? "bg-blue-50 border-blue-200 text-blue-400"
                        : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                        }`}
                    >
                      {aiLoading ? (
                        <span className="w-3 h-3 border-2 border-blue-200 border-t-blue-600 rounded-full inline-block ann-spin" />
                      ) : (
                        <Sparkles size={13} strokeWidth={2.5} />
                      )}
                      AI Suggest
                    </button>
                  </div>

                  {/* Textarea */}
                  <div className="px-5 py-4">
                    <textarea
                      ref={textRef}
                      rows={5}
                      maxLength={MAX}
                      value={text}
                      onChange={e => setText(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      placeholder="Write a clear and engaging announcement for your customers…"
                      className="w-full bg-transparent border-none outline-none resize-none text-[15px] font-medium text-slate-800 leading-relaxed placeholder-slate-300"
                    />
                  </div>

                  {/* AI Quick Templates */}
                  {!text && focused && (
                    <div className="px-5 pb-4" style={{ animation: "ann-fadeIn 0.15s ease" }}>
                      <p className="m-0 mb-2.5 text-[10.5px] font-black text-slate-400 tracking-[0.1em] uppercase flex items-center gap-1.5">
                        <Sparkles size={11} className="text-blue-400" /> Quick Templates
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {AI_SUGGESTIONS.map((s, i) => (
                          <button
                            key={i}
                            onMouseDown={e => { e.preventDefault(); setText(s.text); setType(s.type); }}
                            className="py-1 px-3 rounded-xl bg-slate-50 border border-slate-200 text-[11.5px] font-semibold text-slate-600 cursor-pointer text-left transition-all hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 ann-btn-action"
                          >
                            {s.text.slice(0, 40)}…
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="px-5">
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-200 ${progress > 90 ? "bg-red-500" : progress > 70 ? "bg-amber-500" : ""}`}
                        style={{
                          width: `${progress}%`,
                          background: progress > 90 ? undefined : progress > 70 ? undefined : cfg.gradientSolid
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setText("")}
                        disabled={!text}
                        className={`w-8 h-8 rounded-xl border-none bg-transparent flex items-center justify-center transition-all ${text ? "cursor-pointer text-slate-400 hover:bg-red-50 hover:text-red-500 ann-btn-action" : "cursor-not-allowed text-slate-300"}`}
                      >
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                      <span className={`text-[11.5px] font-bold font-mono ${progress > 90 ? "text-red-500" : progress > 70 ? "text-amber-500" : "text-slate-400"}`}>
                        {text.length} / {MAX}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => { setStatus("Draft"); setSent(false); }}
                        disabled={!text.trim()}
                        className={`px-4 py-2 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-600 transition-all ${text.trim() ? "cursor-pointer hover:bg-slate-50 ann-btn-action" : "cursor-not-allowed opacity-40"}`}
                      >
                        Save Draft
                      </button>

                      <button
                        onClick={handlePublish}
                        disabled={!text.trim() || sent}
                        className={`px-5 py-2 rounded-xl text-[13.5px] font-bold inline-flex items-center gap-2 transition-all duration-200 ann-btn-action ${sent
                          ? "bg-emerald-500 text-white"
                          : !text.trim()
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "text-white cursor-pointer"
                          }`}
                        style={text.trim() && !sent ? {
                          background: cfg.gradientSolid,
                          boxShadow: `0 4px 16px rgba(${cfg.accentRgb}, 0.3)`
                        } : undefined}
                      >
                        {sent ? (
                          <><CheckCircle2 size={15} strokeWidth={3} /> Published!</>
                        ) : (
                          <><Send size={14} strokeWidth={2.5} /> {scheduleDate ? "Schedule" : "Publish Now"}</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Schedule Row */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 ann-card">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Clock size={16} className="text-amber-500" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className="m-0 text-[13px] font-bold text-slate-800">Schedule for later</p>
                    <p className="m-0 text-[11.5px] text-slate-400 mt-0.5">Leave empty to publish immediately</p>
                  </div>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
                  />
                </div>

                {/* CTA Row */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 ann-card">
                  <div className="flex items-center gap-2.5 mb-3.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                      <TrendingUp size={13} className="text-blue-500" strokeWidth={2.5} />
                    </div>
                    <p className="m-0 text-[13px] font-bold text-slate-800">
                      Call-to-Action <span className="text-slate-400 font-medium text-[12px]">— Optional</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder='Button label, e.g. "Shop Now"'
                      value={ctaLabel}
                      onChange={e => setCtaLabel(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-slate-800 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder-slate-300"
                    />
                    <input
                      placeholder="Redirect URL"
                      value={ctaUrl}
                      onChange={e => setCtaUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-slate-800 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder-slate-300"
                    />
                  </div>
                </div>

                {/* Audience Picker */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 ann-card">
                  <div className="flex items-center gap-2.5 mb-3.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Users size={13} className="text-emerald-500" strokeWidth={2.5} />
                    </div>
                    <p className="m-0 text-[13px] font-bold text-slate-800">Target Audience</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {AUDIENCE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setAudience(opt.value)}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border-[1.5px] transition-all cursor-pointer text-left ann-btn-action ${audience === opt.value
                          ? "border-blue-400 bg-blue-50"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                          }`}
                      >
                        <span className="text-lg">{opt.icon}</span>
                        <div>
                          <p className={`m-0 text-[12.5px] font-bold leading-none mb-0.5 ${audience === opt.value ? "text-blue-700" : "text-slate-700"}`}>{opt.label}</p>
                          <p className="m-0 text-[10.5px] text-slate-400">{opt.desc}</p>
                        </div>
                        {audience === opt.value && (
                          <CheckCircle2 size={14} className="text-blue-500 ml-auto shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Right: Live Preview ── */}
              <div className="flex flex-col gap-4 sticky top-5 self-start">

                {/* Preview Card */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye size={14} className="text-slate-500" />
                      <p className="m-0 text-[13px] font-bold text-slate-800">Live Preview</p>
                    </div>
                    {/* Preview Mode Switcher */}
                    <div className="flex gap-0.5 bg-slate-100 rounded-xl p-1">
                      {([
                        { id: "banner" as PreviewMode, label: "Banner", icon: <Monitor size={11} /> },
                        { id: "toast" as PreviewMode, label: "Toast", icon: <Bell size={11} /> },
                        { id: "whatsapp" as PreviewMode, label: "WA", icon: <MessageCircle size={11} /> },
                      ]).map(m => (
                        <button
                          key={m.id}
                          onClick={() => setPreviewMode(m.id)}
                          className={`flex items-center gap-1 py-1.5 px-2.5 rounded-lg border-none cursor-pointer text-[11px] font-bold transition-all ann-preview-pill ${previewMode === m.id
                            ? "bg-white text-slate-800 shadow active ann-btn-action"
                            : "bg-transparent text-slate-400 hover:text-slate-600"
                            }`}
                        >
                          {m.icon} {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview area */}
                  <div className="p-4">
                    <div className={`bg-slate-50 rounded-xl p-4 ${previewMode === "toast" ? "min-h-[140px] flex items-center justify-center" : ""}`}
                      style={{ animation: "ann-fadeIn 0.15s ease" }}>
                      {previewMode === "banner" && (
                        <PreviewStoreBanner announcement={text} type={type} cta={{ label: ctaLabel, url: ctaUrl }} />
                      )}
                      {previewMode === "toast" && (
                        <PreviewToast announcement={text} type={type} />
                      )}
                      {previewMode === "whatsapp" && (
                        <PreviewWhatsApp announcement={text} type={type} cta={{ label: ctaLabel, url: ctaUrl }} />
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                        <span className="text-[11.5px] text-slate-400 font-medium">Type</span>
                        <TypeBadge type={type} />
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                        <span className="text-[11.5px] text-slate-400 font-medium">Status</span>
                        <StatusBadge status={scheduleDate ? "Scheduled" : status} />
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                        <span className="text-[11.5px] text-slate-400 font-medium">Audience</span>
                        <span className="text-[12px] font-bold text-slate-700">
                          {AUDIENCE_OPTIONS.find(a => a.value === audience)?.icon} {AUDIENCE_OPTIONS.find(a => a.value === audience)?.label}
                        </span>
                      </div>
                      {ctaLabel && (
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                          <span className="text-[11.5px] text-slate-400 font-medium">CTA</span>
                          <span className="text-[12px] font-bold text-blue-600">{ctaLabel}</span>
                        </div>
                      )}
                      {scheduleDate && (
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-[11.5px] text-slate-400 font-medium">Goes live</span>
                          <span className="text-[12px] font-bold text-amber-600">
                            {new Date(scheduleDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Channel Reach Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 ann-card">
                  <p className="m-0 mb-3.5 text-[11px] font-black text-slate-400 tracking-[0.1em] uppercase">Channel Reach</p>
                  <div className="space-y-3">
                    {[
                      { label: "Published", value: publishedCount, max: history.length, color: "#10b981", bg: "bg-emerald-100" },
                      { label: "Scheduled", value: scheduledCount, max: history.length, color: "#f59e0b", bg: "bg-amber-100" },
                      { label: "Drafts", value: draftCount, max: history.length, color: "#94a3b8", bg: "bg-slate-100" },
                    ].map(stat => (
                      <div key={stat.label}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[12px] text-slate-500 font-medium">{stat.label}</span>
                          <span className="text-[13px] font-extrabold" style={{ color: stat.color }}>{stat.value}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${history.length ? (stat.value / history.length) * 100 : 0}%`, background: stat.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[11.5px] text-slate-400 font-medium">Total Views</span>
                    <span className="text-[15px] font-extrabold text-slate-800">{totalViews.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ HISTORY TAB ════════════════════════════════════════ */}
          {activeTab === "history" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ animation: "ann-fadeIn 0.2s ease" }}>

              {/* Filters */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
                <p className="m-0 text-[12px] font-black text-slate-400 tracking-[0.08em] uppercase">Filter</p>

                {/* Type filter pills */}
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl p-1">
                  {(['All', ...Object.keys(TYPE_CONFIG)] as (AnnouncementType | 'All')[]).map(t => {
                    const isActive = filterType === t;
                    const tcfg = t !== 'All' ? TYPE_CONFIG[t as AnnouncementType] : null;
                    return (
                      <button
                        key={t}
                        onClick={() => setFilterType(t as AnnouncementType | 'All')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-bold cursor-pointer transition-all ann-btn-action border ${
                          isActive
                            ? tcfg
                              ? `${tcfg.bg} ${tcfg.text} ${tcfg.border} shadow-sm`
                              : 'bg-slate-800 text-white border-slate-700 shadow-sm'
                            : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600 hover:bg-white'
                        }`}
                      >
                        {tcfg && <span className="flex items-center">{tcfg.emoji}</span>}
                        {t === 'All' ? 'All Types' : t}
                      </button>
                    );
                  })}
                </div>

                {/* Status filter pills */}
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl p-1">
                  {([
                    { s: 'All' as StatusType | 'All',      dot: '',                label: 'All',       activeBg: 'bg-slate-800',    activeText: 'text-white',       activeBorder: 'border-slate-700' },
                    { s: 'Draft' as StatusType,             dot: 'bg-slate-400',    label: 'Draft',     activeBg: 'bg-slate-100',    activeText: 'text-slate-700',   activeBorder: 'border-slate-300' },
                    { s: 'Scheduled' as StatusType,         dot: 'bg-amber-400',    label: 'Scheduled', activeBg: 'bg-amber-50',     activeText: 'text-amber-800',   activeBorder: 'border-amber-300' },
                    { s: 'Published' as StatusType,         dot: 'bg-emerald-400',  label: 'Published', activeBg: 'bg-emerald-50',   activeText: 'text-emerald-800', activeBorder: 'border-emerald-300' },
                  ]).map(({ s, dot, label, activeBg, activeText, activeBorder }) => {
                    const isActive = filterStatus === s;
                    return (
                      <button
                        key={label}
                        onClick={() => setFilterStatus(s as StatusType | 'All')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-bold cursor-pointer transition-all ann-btn-action border ${
                          isActive
                            ? `${activeBg} ${activeText} ${activeBorder} shadow-sm`
                            : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600 hover:bg-white'
                        }`}
                      >
                        {dot && <span className={`w-1.5 h-1.5 rounded-full ${isActive ? dot : 'bg-slate-300'} inline-block shrink-0`} />}
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex-1" />
                <span className="text-[12px] text-slate-400 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  {filteredHistory.length} result{filteredHistory.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-[1fr_110px_110px_120px_90px_130px] gap-3 py-3 px-5 bg-slate-50/80 border-b border-slate-100">
                {["Message", "Type", "Status", "Audience", "Views", "Actions"].map(h => (
                  <span key={h} className="text-[10.5px] font-black text-slate-400 tracking-[0.08em] uppercase">{h}</span>
                ))}
              </div>

              {/* Rows */}
              {filteredHistory.length === 0 ? (
                <div className="py-16 px-5 text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <Inbox size={28} className="text-slate-400" strokeWidth={1.5} />
                  </div>
                  <p className="m-0 text-[15px] font-bold text-slate-700 mb-1">No announcements found</p>
                  <p className="m-0 text-[13px] text-slate-400">Try adjusting your filters or create a new one</p>
                </div>
              ) : filteredHistory.map((item, idx) => (
                <div
                  key={item.id}
                  className={`grid grid-cols-[1fr_110px_110px_120px_90px_130px] gap-3 py-4 px-5 items-center ann-history-row ${idx < filteredHistory.length - 1 ? "border-b border-slate-50" : ""}`}
                  style={{ animation: `ann-fadeIn 0.15s ease ${idx * 0.03}s both` }}
                >
                  {/* Message */}
                  <div>
                    <p className="m-0 mb-1 text-[13.5px] font-semibold text-slate-800 leading-snug line-clamp-1">{item.text}</p>
                    <p className="m-0 text-[10.5px] text-slate-400 font-medium">{timeAgo(item.date)} · {fmtDate(item.date)}</p>
                  </div>
                  <TypeBadge type={item.type} />
                  <StatusBadge status={item.status} />
                  <span className="text-[12px] font-semibold text-slate-600">
                    {AUDIENCE_OPTIONS.find(a => a.value === item.audience)?.icon} {AUDIENCE_OPTIONS.find(a => a.value === item.audience)?.label || "All Users"}
                  </span>
                  <span className={`text-[13px] font-extrabold font-mono ${item.views > 0 ? "text-slate-800" : "text-slate-300"}`}>
                    {item.views > 0 ? item.views.toLocaleString() : "—"}
                  </span>

                  {/* Actions */}
                  <div className="flex gap-1.5">
                    <button onClick={() => handleEdit(item)} title="Edit"
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white cursor-pointer flex items-center justify-center text-slate-400 transition-all hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 ann-btn-action">
                      <Edit3 size={12} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => handleDuplicate(item)} title="Duplicate"
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white cursor-pointer flex items-center justify-center text-slate-400 transition-all hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 ann-btn-action">
                      <Copy size={12} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => setDeleteTarget(item)} title="Delete"
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white cursor-pointer flex items-center justify-center text-slate-400 transition-all hover:border-red-400 hover:text-red-500 hover:bg-red-50 ann-btn-action">
                      <Trash2 size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
