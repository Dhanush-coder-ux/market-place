import  { useState, useRef} from "react";
import { Megaphone, RefreshCw, Gift, Smile, Sparkles, PenTool, History, Inbox } from "lucide-react";

// ─── Types & Interfaces ──────────────────────────────────────────────────────

type AnnouncementType = "Announcement" | "Update" | "Offer";
type StatusType = "Draft" | "Scheduled" | "Published";

interface AudienceOption {
  value: string;
  label: string;
  desc: string;
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
  color: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  emoji: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
}

// ─── Design Tokens (Tailwind Mapped) ─────────────────────────────────────────

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap";

const TYPE_CONFIG: Record<AnnouncementType, TypeConfigDetails> = {
  Announcement: {
    label: "Announcement",
    color: "bg-indigo-500",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
    emoji: <Megaphone size={14} strokeWidth={2.5} />,
    gradientFrom: "from-indigo-500/10",
    gradientTo: "to-indigo-500/5",
  },
  Update: {
    label: "Update",
    color: "bg-sky-500",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-500",
    emoji: <RefreshCw size={14} strokeWidth={2.5} />,
    gradientFrom: "from-sky-500/10",
    gradientTo: "to-sky-500/5",
  },
  Offer: {
    label: "Offer",
    color: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    emoji: <Gift size={14} strokeWidth={2.5} />,
    gradientFrom: "from-emerald-500/10",
    gradientTo: "to-emerald-500/5",
  },
};

const STATUS_CONFIG: Record<StatusType, { dot: string; bg: string; text: string }> = {
  Draft: { dot: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-600" },
  Scheduled: { dot: "bg-amber-500", bg: "bg-amber-100", text: "text-amber-800" },
  Published: { dot: "bg-emerald-500", bg: "bg-emerald-100", text: "text-emerald-800" },
};

const AUDIENCE_OPTIONS: AudienceOption[] = [
  { value: "all", label: "All Users", desc: "Everyone sees this" },
  { value: "new", label: "New Users", desc: "First-time visitors" },
  { value: "returning", label: "Returning Customers", desc: "Logged-in members" },
  { value: "vip", label: "VIP Members", desc: "Top-tier customers" },
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

// ─── Utility ─────────────────────────────────────────────────────────────────

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

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusType }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: AnnouncementType }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="flex items-center justify-center">{cfg.emoji}</span>
      {type}
    </span>
  );
}

function DeleteModal({ item, onConfirm, onCancel }: { item: AnnouncementItem; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center animate-[fadeIn_0.15s_ease]">
      <div className="bg-white rounded-2xl p-8 pb-7 w-[420px] max-w-[90vw] shadow-[0_25px_60px_rgba(0,0,0,0.15)] animate-[slideUp_0.2s_ease]">
        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
        </div>
        <h3 className="text-[17px] font-bold text-slate-900 m-0 mb-2">Delete Announcement</h3>
        <p className="text-[13.5px] text-slate-500 leading-relaxed m-0 mb-6">
          This will permanently delete "<strong className="text-slate-700 font-semibold">{item.text.slice(0, 48)}…</strong>". This action cannot be undone.
        </p>
        <div className="flex gap-2.5 justify-end">
          <button onClick={onCancel} className="px-5 py-2 rounded-xl border-[1.5px] border-slate-200 bg-white text-[13.5px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-5 py-2 rounded-xl border-none bg-red-500 text-[13.5px] font-bold text-white hover:bg-red-600 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

function PreviewBanner({ announcement, type, cta }: { announcement: string; type: AnnouncementType; cta: { label: string; url: string } }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <div className={`w-full rounded-xl bg-gradient-to-br ${cfg.gradientFrom} ${cfg.gradientTo} border-[1.5px] ${cfg.border} p-3 px-4 flex items-center gap-3 animate-[fadeIn_0.2s_ease]`}>
      <span className="flex items-center justify-center text-current">{cfg.emoji}</span>
      <p className="flex-1 text-[13px] font-medium text-slate-800 m-0">
        {announcement || "Your announcement will appear here…"}
      </p>
      {cta.label && (
        <button className={`px-3.5 py-1.5 rounded-lg ${cfg.color} text-white text-xs font-bold shrink-0 hover:opacity-90 transition-opacity`}>
          {cta.label}
        </button>
      )}
    </div>
  );
}

function PreviewToast({ announcement, type }: { announcement: string; type: AnnouncementType }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <div className="inline-flex items-start gap-2.5 bg-slate-800 rounded-xl p-3.5 px-4 shadow-[0_12px_32px_rgba(0,0,0,0.25)] max-w-[340px] animate-[slideUp_0.25s_ease]">
      <div className={`w-8 h-8 rounded-lg ${cfg.color} flex items-center justify-center shrink-0`}>
        <span className="flex items-center justify-center text-white">{cfg.emoji}</span>
      </div>
      <div>
        <p className={`m-0 mb-0.5 text-[11px] font-bold ${cfg.text.replace('700','400')} tracking-[0.06em] uppercase text-${cfg.color.split('-')[1]}-400`}>
          {type}
        </p>
        <p className="m-0 text-[13px] font-medium text-slate-50 leading-snug">
          {announcement || "Your announcement preview…"}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  // Editor state
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
  const [previewMode, setPreviewMode] = useState<"banner" | "toast">("banner");

  // History state
  const [history, setHistory] = useState<AnnouncementItem[]>(MOCK_HISTORY);
  const [filterType, setFilterType] = useState<AnnouncementType | "All">("All");
  const [filterStatus, setFilterStatus] = useState<StatusType | "All">("All");
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementItem | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "history">("editor");

  const textRef = useRef<HTMLTextAreaElement>(null);
  const MAX = 160;
  const progress = (text.length / MAX) * 100;
  const cfg = TYPE_CONFIG[type];

  // Filter history
  const filteredHistory = history.filter(h =>
    (filterType === "All" || h.type === filterType) &&
    (filterStatus === "All" || h.status === filterStatus)
  );

  const handlePublish = () => {
    if (!text.trim()) return;
    const newItem: AnnouncementItem = {
      id: Date.now(),
      text,
      type,
      status: scheduleDate ? "Scheduled" : "Published",
      date: scheduleDate || new Date().toISOString(),
      audience,
      views: 0,
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

  const caretSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`;

  return (
    <>
      <style>{`
        @import url('${FONT_URL}');
        .ann-font { font-family: 'Geist', -apple-system, sans-serif; }
        .ann-mono { font-family: 'Geist Mono', monospace; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      {deleteTarget && <DeleteModal item={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}

      <div className="ann-font min-h-screen bg-slate-50 pb-16 text-slate-800">

        {/* ── Page Header ──────────────────────────────────────────── */}
        <div className="bg-white border-b border-slate-100 pt-6 px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white">
                    <Megaphone size={18} strokeWidth={2.5} />
                  </div>
                  <h1 className="m-0 text-[22px] font-extrabold text-slate-900 tracking-tight">Announcements</h1>
                </div>
                <p className="m-0 text-[13.5px] text-slate-500 font-normal">
                  Create and manage store-wide announcements across all channels
                </p>
              </div>
              <div className="flex gap-2 pb-5">
                <button
                  onClick={() => setActiveTab("history")}
                  className="bg-transparent border-[1.5px] border-slate-200 rounded-xl py-2 px-3.5 text-[12.5px] font-semibold text-slate-600 flex items-center gap-1.5 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><polyline points="12 7 12 12 16 14" /></svg>
                  History
                  <span className="bg-slate-100 rounded-md py-[1px] px-2 text-[11px] font-bold text-slate-500">{history.length}</span>
                </button>
                <button
                  onClick={() => setActiveTab("editor")}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-xl border-none bg-gradient-to-br from-blue-500 to-blue-400 text-white text-[13.5px] font-bold cursor-pointer shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:opacity-90 transition-opacity"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  New Announcement
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-slate-100 rounded-xl p-1 w-fit">
              {(["editor", "history"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`capitalize py-2 px-4 rounded-lg text-[13.5px] font-semibold transition-all duration-150 flex items-center gap-2 ${activeTab === tab ? "bg-white text-slate-800 shadow-[0_1px_4px_rgba(0,0,0,0.08)]" : "bg-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"}`}
                >
                  {tab === "editor" ? <><PenTool size={16} strokeWidth={2.5}/> Editor</> : <><History size={16} strokeWidth={2.5}/> History ({history.length})</>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto pt-7 px-8">

          {/* ═══ EDITOR TAB ═══════════════════════════════════════ */}
          {activeTab === "editor" && (
            <div className="grid grid-cols-[1fr_360px] gap-6">

              {/* Left — Editor */}
              <div className="flex flex-col gap-4">

                {/* Editor Card */}
                <div className={`bg-white rounded-[18px] border-[1.5px] transition-all duration-200 overflow-hidden ${focused ? "border-blue-500 shadow-[0_0_0_4px_rgba(99,102,241,0.05),0_8px_24px_rgba(99,102,241,0.08)]" : "border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"}`}>
                  
                  {/* Colored top bar */}
                  <div className={`h-[3px] bg-gradient-to-r ${cfg.gradientFrom.replace('/10', '')} to-transparent transition-colors duration-300 ${cfg.color}`} />

                  {/* Toolbar */}
                  <div className="flex items-center gap-2 p-3.5 px-4 pb-2.5 flex-wrap">

                    {/* Type selector */}
                    <select
                      value={type}
                      onChange={e => setType(e.target.value as AnnouncementType)}
                      style={{ backgroundImage: caretSvg }}
                      className={`appearance-none rounded-xl py-1.5 pl-2.5 pr-7 text-[12.5px] font-semibold cursor-pointer outline-none bg-no-repeat bg-[right_8px_center] border-[1.5px] transition-colors focus:ring-4 focus:ring-blue-500/10 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                    >
                      {(Object.keys(TYPE_CONFIG) as AnnouncementType[]).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>

                    {/* Status */}
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as StatusType)}
                      style={{ backgroundImage: caretSvg }}
                      className="appearance-none bg-slate-50 border-[1.5px] border-slate-200 rounded-xl py-1.5 pl-2.5 pr-7 text-[12.5px] font-semibold text-slate-700 cursor-pointer outline-none bg-no-repeat bg-[right_8px_center] transition-colors focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    >
                      {(Object.keys(STATUS_CONFIG) as StatusType[]).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    {/* Audience */}
                    <select
                      value={audience}
                      onChange={e => setAudience(e.target.value)}
                      style={{ backgroundImage: caretSvg }}
                      className="appearance-none bg-slate-50 border-[1.5px] border-slate-200 rounded-xl py-1.5 pl-2.5 pr-7 text-[12.5px] font-semibold text-slate-700 cursor-pointer outline-none bg-no-repeat bg-[right_8px_center] transition-colors focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    >
                      {AUDIENCE_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>

                    <div className="flex-1" />

                    {/* Emoji picker */}
                    <div className="relative">
                      <button
                        onClick={() => setShowEmoji(p => !p)}
                        className="p-1.5 px-2.5 rounded-xl border-[1.5px] border-slate-200 bg-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center"
                      >
                        <Smile size={18} strokeWidth={2.5} />
                      </button>
                      {showEmoji && (
                        <div className="absolute right-0 top-[calc(100%+6px)] z-50 bg-white border-[1.5px] border-slate-200 rounded-2xl p-2.5 grid grid-cols-6 gap-1 shadow-[0_10px_30px_rgba(0,0,0,0.1)] animate-[slideUp_0.15s_ease]">
                          {EMOJI_LIST.map(e => (
                            <button
                              key={e}
                              onClick={() => insertEmoji(e)}
                              className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer text-base flex items-center justify-center hover:bg-slate-100 transition-colors"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* AI Generate */}
                    <button
                      disabled={aiLoading}
                      onClick={handleAI}
                      className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl border-[1.5px] text-[12.5px] font-semibold cursor-pointer transition-colors ${aiLoading ? "bg-purple-50 border-purple-200 text-purple-400" : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300"}`}
                    >
                      {aiLoading ? (
                        <span className="w-3 h-3 border-2 border-purple-200 border-t-purple-600 rounded-full inline-block animate-[spin_0.7s_linear_infinite]" />
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" /></svg>
                      )}
                       Suggest
                    </button>
                  </div>

                  {/* Textarea */}
                  <div className="px-4 py-1">
                    <textarea
                      ref={textRef}
                      rows={5}
                      maxLength={MAX}
                      value={text}
                      onChange={e => setText(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      placeholder="Write a clear and engaging announcement for your customers…"
                      className="w-full bg-transparent border-none outline-none resize-none text-[15px] font-medium text-slate-800 leading-[1.65] placeholder-slate-400"
                    />
                  </div>

                  {/* AI Suggestions (when empty) */}
                  {!text && focused && (
                    <div className="px-4 pb-3.5 animate-[fadeIn_0.15s_ease]">
                      <p className="m-0 mb-2 text-[10.5px] font-bold text-slate-400 tracking-[0.08em] uppercase flex items-center gap-1.5">
                        <Sparkles size={12} strokeWidth={2.5} className="text-purple-400" /> Quick templates
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {AI_SUGGESTIONS.map((s, i) => (
                          <button
                            key={i}
                            onMouseDown={e => { e.preventDefault(); setText(s.text); setType(s.type); }}
                            className="py-1 px-2.5 rounded-lg bg-slate-50 border-[1.5px] border-slate-200 text-[11.5px] font-semibold text-slate-600 cursor-pointer text-left transition-colors hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            {s.text.slice(0, 42)}…
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="px-4">
                    <div className="h-0.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-200 ${progress > 90 ? "bg-red-500" : progress > 70 ? "bg-amber-500" : "bg-blue-500"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-4 py-3 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setText("")}
                        disabled={!text}
                        className={`w-8 h-8 rounded-lg border-none bg-transparent flex items-center justify-center transition-colors ${text ? "cursor-pointer text-slate-400 hover:bg-red-100 hover:text-red-500" : "cursor-not-allowed text-slate-300"}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
                      </button>
                      <span className={`text-[11.5px] font-bold ann-mono ${progress > 90 ? "text-red-500" : progress > 70 ? "text-amber-500" : "text-slate-400"}`}>
                        {text.length} / {MAX}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => { setStatus("Draft"); setSent(false); }}
                        disabled={!text.trim()}
                        className={`px-4 py-2 rounded-xl border-[1.5px] border-slate-200 bg-white text-[13px] font-semibold text-slate-600 transition-all duration-150 ${text.trim() ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-40"}`}
                      >
                        Save Draft
                      </button>

                      <button
                        onClick={handlePublish}
                        disabled={!text.trim() || sent}
                        className={`px-5 py-2 rounded-xl border-none text-[13.5px] font-bold inline-flex items-center gap-2 transition-all duration-200 ${sent ? "bg-emerald-500 text-white scale-[0.97]" : !text.trim() ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-gradient-to-br from-blue-500 to-blue-400 text-white cursor-pointer shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:opacity-90"}`}
                      >
                        {sent ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                            Published!
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                            {scheduleDate ? "Schedule" : "Publish Now"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Schedule Row */}
                <div className="bg-white rounded-[14px] border-[1.5px] border-slate-200 p-3.5 px-4 flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  <div className="flex-1">
                    <p className="m-0 text-[12.5px] font-bold text-slate-700">Schedule for later</p>
                    <p className="m-0 text-[11.5px] text-slate-400">Leave empty to publish immediately</p>
                  </div>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="w-auto bg-slate-50 border-[1.5px] border-slate-200 rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-slate-800 outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                {/* CTA Row */}
                <div className="bg-white rounded-[14px] border-[1.5px] border-slate-200 p-3.5 px-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                    <p className="m-0 text-[12.5px] font-bold text-slate-700">Call-to-Action <span className="text-slate-400 font-medium">— Optional</span></p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      placeholder='Button label, e.g. "Shop Now"'
                      value={ctaLabel}
                      onChange={e => setCtaLabel(e.target.value)}
                      className="w-full bg-slate-50 border-[1.5px] border-slate-200 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-800 outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder-slate-400"
                    />
                    <input
                      placeholder="Redirect URL"
                      value={ctaUrl}
                      onChange={e => setCtaUrl(e.target.value)}
                      className="w-full bg-slate-50 border-[1.5px] border-slate-200 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-800 outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Right — Live Preview */}
              <div className="flex flex-col gap-4 sticky top-6">
                <div className="bg-white rounded-[18px] border-[1.5px] border-slate-200 overflow-hidden">
                  <div className="p-3.5 px-4 border-b border-slate-100 flex items-center justify-between">
                    <p className="m-0 text-[12.5px] font-bold text-slate-800">Live Preview</p>
                    <div className="flex gap-1 bg-slate-100 rounded-lg p-[3px]">
                      {(["banner", "toast"] as const).map(m => (
                        <button
                          key={m}
                          onClick={() => setPreviewMode(m)}
                          className={`py-1 px-2.5 rounded-md border-none cursor-pointer text-[11.5px] font-semibold transition-all duration-150 capitalize ${previewMode === m ? "bg-white text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "bg-transparent text-slate-400 hover:text-slate-600"}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className={`bg-slate-50 rounded-xl p-5 flex min-h-[100px] ${previewMode === "toast" ? "items-start justify-start" : "items-center justify-stretch"}`}>
                      {previewMode === "banner"
                        ? <PreviewBanner announcement={text} type={type} cta={{ label: ctaLabel, url: ctaUrl }} />
                        : <PreviewToast announcement={text} type={type} />}
                    </div>

                    <div className="mt-3.5 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11.5px] text-slate-400 font-medium">Type</span>
                        <TypeBadge type={type} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11.5px] text-slate-400 font-medium">Status</span>
                        <StatusBadge status={scheduleDate ? "Scheduled" : status} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11.5px] text-slate-400 font-medium">Audience</span>
                        <span className="text-[12px] font-semibold text-slate-600">
                          {AUDIENCE_OPTIONS.find(a => a.value === audience)?.label}
                        </span>
                      </div>
                      {ctaLabel && (
                        <div className="flex justify-between items-center">
                          <span className="text-[11.5px] text-slate-400 font-medium">CTA</span>
                          <span className="text-[12px] font-semibold text-blue-600">{ctaLabel}</span>
                        </div>
                      )}
                      {scheduleDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-[11.5px] text-slate-400 font-medium">Goes live</span>
                          <span className="text-[12px] font-semibold text-amber-500">
                            {new Date(scheduleDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="bg-white rounded-[14px] border-[1.5px] border-slate-200 p-3.5 px-4">
                  <p className="m-0 mb-3 text-[12px] font-bold text-slate-400 tracking-[0.06em] uppercase">Channel Stats</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: "Total published", value: history.filter(h => h.status === "Published").length, color: "text-emerald-500" },
                      { label: "Scheduled", value: history.filter(h => h.status === "Scheduled").length, color: "text-amber-500" },
                      { label: "Drafts", value: history.filter(h => h.status === "Draft").length, color: "text-slate-400" },
                    ].map(stat => (
                      <div key={stat.label} className="flex justify-between items-center">
                        <span className="text-[12.5px] text-slate-500 font-medium">{stat.label}</span>
                        <span className={`text-[14px] font-extrabold ${stat.color}`}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ HISTORY TAB ══════════════════════════════════════ */}
          {activeTab === "history" && (
            <div className="bg-white rounded-[18px] border-[1.5px] border-slate-200 overflow-hidden">

              {/* Filters */}
              <div className="p-4 px-5 border-b border-slate-100 flex items-center gap-2.5 flex-wrap">
                <p className="m-0 text-[13px] font-bold text-slate-800 mr-1">Filter by:</p>

                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value as AnnouncementType | "All")}
                  style={{ backgroundImage: caretSvg }}
                  className="appearance-none bg-slate-50 border-[1.5px] border-slate-200 rounded-xl py-1.5 pl-2.5 pr-7 text-[12.5px] font-semibold text-slate-700 cursor-pointer outline-none bg-no-repeat bg-[right_8px_center] transition-colors focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="All">All Types</option>
                  {(Object.keys(TYPE_CONFIG) as AnnouncementType[]).map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as StatusType | "All")}
                  style={{ backgroundImage: caretSvg }}
                  className="appearance-none bg-slate-50 border-[1.5px] border-slate-200 rounded-xl py-1.5 pl-2.5 pr-7 text-[12.5px] font-semibold text-slate-700 cursor-pointer outline-none bg-no-repeat bg-[right_8px_center] transition-colors focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="All">All Statuses</option>
                  {(Object.keys(STATUS_CONFIG) as StatusType[]).map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <div className="flex-1" />
                <span className="text-[12.5px] text-slate-400 font-medium">
                  {filteredHistory.length} announcement{filteredHistory.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-[1fr_100px_110px_110px_80px_120px] gap-3 py-2.5 px-5 border-b border-slate-100 bg-slate-50/50">
                {["Message", "Type", "Status", "Audience", "Views", "Actions"].map(h => (
                  <span key={h} className="text-[11px] font-bold text-slate-400 tracking-[0.06em] uppercase">{h}</span>
                ))}
              </div>

              {/* Rows */}
              {filteredHistory.length === 0 ? (
                <div className="py-12 px-5 text-center flex flex-col items-center justify-center mt-6">
                  <Inbox size={48} className="text-slate-300 mb-2" strokeWidth={1.5} />
                  <p className="m-0 mt-3 mb-1 text-[14px] font-bold text-slate-700">No announcements found</p>
                  <p className="m-0 text-[13px] text-slate-400">Try adjusting your filters or create a new one</p>
                </div>
              ) : filteredHistory.map((item, idx) => (
                <div key={item.id} className={`grid grid-cols-[1fr_100px_110px_110px_80px_120px] gap-3 py-3.5 px-5 items-center transition-colors hover:bg-slate-50 animate-[fadeIn_0.15s_ease] ${idx < filteredHistory.length - 1 ? "border-b border-slate-50" : ""}`}>
                  {/* Message */}
                  <div>
                    <p className="m-0 mb-1 text-[13.5px] font-semibold text-slate-800 leading-snug overflow-hidden line-clamp-1">
                      {item.text}
                    </p>
                    <p className="m-0 text-[11px] text-slate-400 font-medium">{timeAgo(item.date)} · {fmtDate(item.date)}</p>
                  </div>
                  <TypeBadge type={item.type} />
                  <StatusBadge status={item.status} />
                  <span className="text-[12px] font-semibold text-slate-600">
                    {AUDIENCE_OPTIONS.find(a => a.value === item.audience)?.label || "All Users"}
                  </span>
                  <span className={`text-[12.5px] font-bold ann-mono ${item.views > 0 ? "text-slate-800" : "text-slate-300"}`}>
                    {item.views > 0 ? item.views.toLocaleString() : "—"}
                  </span>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(item)}
                      title="Edit"
                      className="w-7 h-7 rounded-lg border-[1.5px] border-slate-200 bg-white cursor-pointer flex items-center justify-center text-slate-500 transition-colors hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 group"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    <button
                      onClick={() => handleDuplicate(item)}
                      title="Duplicate"
                      className="w-7 h-7 rounded-lg border-[1.5px] border-slate-200 bg-white cursor-pointer flex items-center justify-center text-slate-500 transition-colors hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50 group"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      title="Delete"
                      className="w-7 h-7 rounded-lg border-[1.5px] border-slate-200 bg-white cursor-pointer flex items-center justify-center text-slate-500 transition-colors hover:border-red-500 hover:text-red-500 hover:bg-red-50 group"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
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