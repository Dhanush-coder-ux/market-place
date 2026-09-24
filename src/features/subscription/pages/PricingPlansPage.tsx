import React, { useState, useEffect, useMemo } from "react";
import { Sparkles, Store, Users, Database, Award, Loader2 } from "lucide-react";
import { SubscriptionData, SubscriptionCatalogResponse } from "../types";
import { subscriptionApi } from "@/services/api/subscription";
import { RazorpayCheckoutModal } from "../components/RazorpayCheckoutModal";
import { useToast } from "@/context/ToastContext";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
  
  .pb-root {
    --app:#F7F8FB; --card:#FFFFFF; --panel:#F5F7FA; --panel2:#EEF1F6;
    --line:#E6EAF1; --line2:#D5DBE5;
    --ink:#12161F; --body:#3A414F; --muted:#7A8497; --faint:#A7B0C0;
    --brand:#2563eb; --brand-600:#1d4ed8; --brand-700:#1e3a8a;
    --brand-tint:#eff6ff; --brand-tint2:#dbeafe; --ring:rgba(37,99,235,.22);
    --gold:#F2A93B; --gold-lt:#FFC97A;
    --pos:#12995A; --pos-bg:#E3F7EC; --pos-bd:#8CDCB4; --pos-tx:#0E6B41;
    --warn:#B5761C; --warn-bg:#FEF4D8; --warn-bd:#F3CE79; --warn-tx:#8B5A15;
    --coral:#CE5028; --coral-bg:#FCE9E1; --coral-bd:#F3BCA4; --coral-tx:#7E3318;
    --font-d:'Space Grotesk',sans-serif; --font-b:'Inter',sans-serif; --font-m:'IBM Plex Mono',monospace;
    --r:13px; --r-s:9px; --r-p:999px;
    --sh:0 1px 3px rgba(19,24,34,.05),0 1px 2px rgba(19,24,34,.03);
    --sh-m:0 4px 18px -6px rgba(19,24,34,.13),0 1px 3px rgba(19,24,34,.05);
    --sh-l:0 20px 50px -18px rgba(19,24,34,.3);
    
    background:var(--app);
    color:var(--body);
    font-family:var(--font-b);
    font-size:14px;
    line-height:1.55;
    -webkit-font-smoothing:antialiased;
    min-height: 100vh;
  }
  
  .pb-root * { box-sizing: border-box; }
  .pb-root .shell { max-width:1240px; margin:0 auto; padding:26px 24px 140px; }
  .pb-root .crumb { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--muted); margin-bottom:14px; }
  .pb-root .crumb a { color:var(--muted); text-decoration:none; }
  .pb-root .crumb .cur { color:var(--brand); font-weight:600; }
  .pb-root .phead { margin-bottom:20px; }
  .pb-root .phead h1 { font-family:var(--font-d); font-weight:600; font-size:25px; color:var(--ink); letter-spacing:-.03em; margin:0; }
  .pb-root .phead p { font-size:13.5px; color:var(--muted); margin:5px 0 0; }
  
  /* ============ CURRENT PLAN ============ */
  .pb-root .cur-wrap { display:grid; grid-template-columns:1.25fr 1fr; gap:15px; margin-bottom:22px; }
  @media(max-width:980px){ .pb-root .cur-wrap { grid-template-columns:1fr; } }
  
  .pb-root .curplan { background:linear-gradient(to bottom right, #2563eb, #1d4ed8, #1e3a8a); border-radius:var(--r); padding:22px 24px; color:#fff; position:relative; overflow:hidden; box-shadow:var(--sh-m); }
  .pb-root .curplan::after { content:""; position:absolute; right:-60px; top:-60px; width:220px; height:220px; opacity:.07; background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='%23fff' fill-rule='evenodd' d='M50 2 Q54 22 60 35 L97 29 Q78 42 66 52 L79 96 Q62 82 50 74 Q38 82 21 96 L34 52 Q22 42 3 29 L40 35 Q46 22 50 2 Z M50 24 L59 67 L41 67 Z'/%3E%3C/svg%3E") no-repeat center/contain; }
  .pb-root .curplan > * { position:relative; z-index:1; }
  .pb-root .curplan .lbl { font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:rgba(255,255,255,.55); }
  .pb-root .curplan .nm { font-family:var(--font-d); font-weight:600; font-size:27px; letter-spacing:-.025em; margin-top:6px; display:flex; align-items:center; gap:11px; flex-wrap:wrap; }
  .pb-root .curplan .act { font-size:10px; font-weight:700; letter-spacing:.06em; background:rgba(126,226,168,.2); border:1px solid rgba(126,226,168,.4); color:#9FEBC2; padding:3px 10px; border-radius:var(--r-p); }
  .pb-root .curplan .amt { font-family:var(--font-m); font-size:15px; color:rgba(255,255,255,.85); margin-top:10px; }
  .pb-root .curplan .amt b { font-size:22px; font-weight:600; color:#fff; }
  .pb-root .curplan .rn { display:flex; align-items:center; gap:8px; font-size:12.5px; color:rgba(255,255,255,.7); margin-top:14px; padding-top:14px; border-top:1px solid rgba(255,255,255,.15); }
  .pb-root .curplan .rn svg { width:14px; height:14px; flex:none; }
  .pb-root .curplan .btns { display:flex; gap:9px; margin-top:16px; flex-wrap:wrap; }
  .pb-root .wbtn { height:36px; padding:0 15px; border-radius:var(--r-s); font-family:var(--font-b); font-weight:600; font-size:12.5px; cursor:pointer; border:1px solid rgba(255,255,255,.28); background:rgba(255,255,255,.1); color:#fff; transition:.14s; }
  .pb-root .wbtn:hover { background:rgba(255,255,255,.18); }
  .pb-root .wbtn.solid { background:#fff; color:var(--brand-700); border-color:#fff; }
  .pb-root .wbtn.solid:hover { background:#F0F1FA; }
  
  /* usage */
  .pb-root .usage { background:var(--card); border:1px solid var(--line); border-radius:var(--r); padding:18px 20px; box-shadow:var(--sh); }
  .pb-root .usage .uh { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
  .pb-root .usage .ut { font-family:var(--font-d); font-weight:600; font-size:14px; color:var(--ink); }
  .pb-root .usage .us { font-size:11.5px; color:var(--faint); }
  .pb-root .um + .um { margin-top:13px; padding-top:13px; border-top:1px solid var(--line); }
  .pb-root .um .r1 { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px; }
  .pb-root .um .k { font-size:12.5px; font-weight:600; color:var(--body); display:flex; align-items:center; gap:7px; }
  .pb-root .um .k svg { width:13px; height:13px; color:var(--faint); }
  .pb-root .um .v { font-family:var(--font-m); font-size:12.5px; font-weight:600; color:var(--ink); }
  .pb-root .um .v small { color:var(--faint); font-weight:400; }
  .pb-root .bar { height:6px; background:var(--panel2); border-radius:var(--r-p); overflow:hidden; }
  .pb-root .bar b { display:block; height:100%; border-radius:var(--r-p); background:var(--pos); transition:width .5s ease; }
  .pb-root .bar b.warn { background:var(--warn); }
  .pb-root .bar b.full { background:var(--coral); }
  .pb-root .um .note { font-size:11px; margin-top:6px; display:flex; align-items:center; gap:6px; }
  .pb-root .um .note.warn { color:var(--warn-tx); }
  .pb-root .um .note.full { color:var(--coral-tx); }
  .pb-root .um .note svg { width:12px; height:12px; flex:none; }
  .pb-root .um .note a { color:inherit; font-weight:700; text-decoration:underline; cursor:pointer; }
  
  /* ============ BILLING CYCLE TOGGLE ============ */
  .pb-root .cyc-row { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:16px; flex-wrap:wrap; }
  .pb-root .sec-t { font-family:var(--font-d); font-weight:600; font-size:18px; color:var(--ink); letter-spacing:-.02em; }
  .pb-root .sec-s { font-size:13px; color:var(--muted); margin-top:3px; }
  .pb-root .cyc { display:inline-flex; gap:3px; background:var(--panel); border:1px solid var(--line); padding:4px; border-radius:var(--r-s); }
  .pb-root .cyc button { font-family:var(--font-b); font-weight:600; font-size:12.5px; color:var(--muted); background:none; border:none; border-radius:6px; height:32px; padding:0 15px; cursor:pointer; display:flex; align-items:center; gap:8px; transition: .15s; }
  .pb-root .cyc button.on { background:var(--card); color:var(--ink); box-shadow:var(--sh); }
  .pb-root .cyc .save { font-size:9.5px; font-weight:800; letter-spacing:.04em; background:var(--pos-bg); color:var(--pos-tx); border:1px solid var(--pos-bd); padding:2px 7px; border-radius:var(--r-p); }
  
  /* ============ PLAN CARDS ============ */
  .pb-root .plans { display:grid; grid-template-columns:repeat(3,1fr); gap:15px; margin-bottom:26px; }
  @media(max-width:980px){ .pb-root .plans { grid-template-columns:1fr; } }
  .pb-root .pc { background:var(--card); border:1.5px solid var(--line); border-radius:var(--r); padding:22px 21px; display:flex; flex-direction:column; position:relative; transition:.16s; }
  .pb-root .pc:hover { border-color:var(--line2); box-shadow:var(--sh-m); }
  .pb-root .pc.current { border-color:var(--brand); background:#FCFCFE; box-shadow:0 0 0 3px var(--ring); }
  .pb-root .pc .ribbon { position:absolute; top:-1.5px; left:-1.5px; right:-1.5px; height:30px; background:var(--brand); border-radius:12px 12px 0 0; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; letter-spacing:.09em; color:#fff; }
  .pb-root .pc.current { padding-top:44px; }
  .pb-root .pc .nm { font-family:var(--font-d); font-weight:600; font-size:19px; color:var(--ink); letter-spacing:-.02em; }
  .pb-root .pc .ds { font-size:12px; color:var(--muted); margin-top:5px; line-height:1.5; min-height:52px; }
  .pb-root .pc .pr { display:flex; align-items:baseline; gap:6px; margin-top:14px; }
  .pb-root .pc .pr .big { font-family:var(--font-d); font-weight:600; font-size:31px; color:var(--ink); letter-spacing:-.03em; }
  .pb-root .pc .pr .per { font-size:12px; color:var(--muted); }
  .pb-root .pc .sub { font-size:11.5px; color:var(--faint); margin-top:4px; min-height:17px; }
  .pb-root .pc .cta { margin-top:16px; }
  .pb-root .btn { width:100%; height:42px; border-radius:var(--r-s); font-family:var(--font-b); font-weight:700; font-size:13.5px; cursor:pointer; border:1.5px solid var(--line2); background:var(--card); color:var(--body); transition:.15s; display:inline-flex; align-items:center; justify-content:center; gap:8px; }
  .pb-root .btn:hover { border-color:#BCC4D2; box-shadow:var(--sh); }
  .pb-root .btn svg { width:15px; height:15px; }
  .pb-root .btn.pri { background:var(--brand); border-color:var(--brand); color:#fff; }
  .pb-root .btn.pri:hover { background:var(--brand-600); }
  .pb-root .btn.ghost { background:var(--panel); border-color:transparent; color:var(--muted); cursor:default; }
  .pb-root .btn.ghost:hover { box-shadow:none; border-color:transparent; }
  .pb-root .btn:focus-visible { outline:2.5px solid var(--ring); outline-offset:2px; }
  .pb-root .pc .dv { height:1px; background:var(--line); margin:18px 0 14px; }
  .pb-root .pc .il { font-size:9.5px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:var(--faint); margin-bottom:10px; }
  .pb-root .pc ul { list-style:none; padding:0; margin:0; }
  .pb-root .pc li { font-size:12.5px; color:var(--body); margin:7px 0; line-height:1.4; display:flex; gap:9px; align-items:flex-start; }
  .pb-root .pc li svg { width:13px; height:13px; color:var(--pos); flex:none; margin-top:2px; }
  .pb-root .pc li b { font-weight:700; color:var(--ink); }
  
  /* ============ ADD-ONS ============ */
  .pb-root .addons { display:grid; grid-template-columns:repeat(4,1fr); gap:13px; margin-bottom:26px; }
  @media(max-width:1080px){ .pb-root .addons { grid-template-columns:repeat(2,1fr); } }
  @media(max-width:620px){ .pb-root .addons { grid-template-columns:1fr; } }
  .pb-root .ac { background:var(--card); border:1.5px solid var(--line); border-radius:var(--r); padding:17px 18px; display:flex; flex-direction:column; transition:.16s; }
  .pb-root .ac.on { border-color:var(--brand); background:#FCFCFE; }
  .pb-root .ac .ai { width:32px; height:32px; border-radius:9px; background:var(--brand-tint); color:var(--brand); display:grid; place-items:center; margin-bottom:11px; }
  .pb-root .ac.on .ai { background:var(--brand); color:#fff; }
  .pb-root .ac .ai svg { width:16px; height:16px; fill:none; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
  .pb-root .ac .an { font-weight:700; font-size:13.5px; color:var(--ink); }
  .pb-root .ac .ap { font-family:var(--font-m); font-weight:600; font-size:15px; color:var(--brand); margin-top:5px; }
  .pb-root .ac .ad { font-size:11.5px; color:var(--muted); margin-top:7px; line-height:1.5; flex:1; }
  .pb-root .ac .owned { font-size:10.5px; font-weight:700; color:var(--pos-tx); background:var(--pos-bg); border:1px solid var(--pos-bd); border-radius:var(--r-p); padding:3px 9px; display:inline-flex; align-items:center; gap:6px; margin-top:9px; align-self:flex-start; }
  .pb-root .ac .owned svg { width:11px; height:11px; stroke-width:3; }
  .pb-root .qty { display:flex; align-items:center; gap:0; margin-top:13px; border:1.5px solid var(--line2); border-radius:var(--r-s); overflow:hidden; height:38px; }
  .pb-root .qty button { width:38px; height:100%; border:none; background:var(--panel); color:var(--body); font-size:17px; cursor:pointer; display:grid; place-items:center; transition:.14s; font-family:var(--font-b); }
  .pb-root .qty button:hover:not(:disabled) { background:var(--panel2); color:var(--brand); }
  .pb-root .qty button:disabled { opacity:.35; cursor:not-allowed; }
  .pb-root .qty .n { flex:1; text-align:center; font-family:var(--font-m); font-weight:700; font-size:14px; color:var(--ink); display:flex; align-items:center; justify-content:center; }
  .pb-root .tgl { margin-top:13px; height:38px; border-radius:var(--r-s); border:1.5px solid var(--line2); background:var(--card); font-family:var(--font-b); font-weight:600; font-size:12.5px; color:var(--body); cursor:pointer; width:100%; transition:.15s; }
  .pb-root .tgl:hover { border-color:#BCC4D2; }
  .pb-root .tgl.on { background:var(--brand); border-color:var(--brand); color:#fff; }
  
  /* ============ HISTORY ============ */
  .pb-root .card { background:var(--card); border:1px solid var(--line); border-radius:var(--r); box-shadow:var(--sh); overflow:hidden; margin-bottom:22px; }
  .pb-root .ch { padding:15px 19px; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
  .pb-root .ch .t { font-family:var(--font-d); font-weight:600; font-size:14.5px; color:var(--ink); }
  .pb-root .ch .s { font-size:12px; color:var(--muted); margin-top:2px; }
  .pb-root .lnk { font-size:12.5px; font-weight:600; color:var(--brand); text-decoration:none; cursor:pointer; }
  .pb-root .lnk:hover { text-decoration:underline; }
  .pb-root table { width:100%; border-collapse:collapse; }
  .pb-root thead th { padding:10px 19px; background:var(--panel); border-bottom:1px solid var(--line); font-family:var(--font-d); font-weight:600; font-size:9.5px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); text-align:left; white-space:nowrap; }
  .pb-root thead th.r { text-align:right; }
  .pb-root tbody td { padding:13px 19px; border-bottom:1px solid var(--line); font-size:13px; }
  .pb-root tbody tr:last-child td { border-bottom:none; }
  .pb-root tbody tr:hover { background:#FCFDFE; }
  .pb-root td.r { text-align:right; }
  .pb-root .mono { font-family:var(--font-m); }
  .pb-root .chip { display:inline-flex; align-items:center; gap:6px; font-weight:600; font-size:10.5px; padding:3px 9px; border-radius:var(--r-p); border:1px solid; white-space:nowrap; }
  .pb-root .chip .d { width:5.5px; height:5.5px; border-radius:50%; }
  .pb-root .chip.paid { background:var(--pos-bg); border-color:var(--pos-bd); color:var(--pos-tx); } .pb-root .chip.paid .d { background:var(--pos); }
  
  /* payment method */
  .pb-root .pm { display:flex; align-items:center; gap:14px; padding:16px 19px; flex-wrap:wrap; }
  .pb-root .pm .icon { width:44px; height:32px; border-radius:7px; background:var(--panel2); display:grid; place-items:center; flex:none; }
  .pb-root .pm .icon svg { width:20px; height:20px; color:var(--muted); }
  .pb-root .pm .t2 { font-weight:600; font-size:13.5px; color:var(--ink); }
  .pb-root .pm .s2 { font-size:12px; color:var(--muted); margin-top:2px; }
  .pb-root .pm .act2 { margin-left:auto; }
  .pb-root .sbtn { height:36px; padding:0 14px; border-radius:var(--r-s); border:1px solid var(--line2); background:var(--card); font-family:var(--font-b); font-weight:600; font-size:12.5px; color:var(--body); cursor:pointer; }
  .pb-root .sbtn:hover { border-color:#BCC4D2; }
  
  /* ============ STICKY SUMMARY ============ */
  @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .pb-root .bar-b { position:sticky; bottom:24px; background:var(--card); border:1px solid var(--brand); border-radius:var(--r); box-shadow:var(--sh-l); padding:16px 24px; z-index:40; animation: slideUp 0.3s cubic-bezier(.3,.8,.3,1) forwards; max-width: 1040px; margin: 30px auto 0; }
  .pb-root .bar-in { display:flex; align-items:center; gap:20px; flex-wrap:wrap; width: 100%; }
  .pb-root .bar-l { flex:1; min-width:230px; }
  .pb-root .bar-l .ttl { font-family:var(--font-d); font-weight:600; font-size:14.5px; color:var(--ink); display:flex; align-items:center; gap:9px; }
  .pb-root .bar-l .ttl .cnt { font-size:10px; font-weight:800; background:var(--brand); color:#fff; border-radius:var(--r-p); padding:2px 8px; }
  .pb-root .bar-l .items { font-size:12px; color:var(--muted); margin-top:4px; line-height:1.5; }
  .pb-root .bar-r { display:flex; align-items:center; gap:20px; flex-wrap:wrap; }
  .pb-root .tot { text-align:right; }
  .pb-root .tot .lb { font-size:10.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--muted); }
  .pb-root .tot .vl { font-family:var(--font-d); font-weight:600; font-size:25px; color:var(--ink); letter-spacing:-.025em; line-height:1.1; margin-top:3px; }
  .pb-root .tot .nx { font-size:11px; color:var(--faint); margin-top:4px; }
  .pb-root .bar-r .go { height:46px; padding:0 26px; border-radius:var(--r-s); background:var(--brand); color:#fff; border:none; font-family:var(--font-b); font-weight:700; font-size:14.5px; cursor:pointer; display:inline-flex; align-items:center; gap:9px; }
  .pb-root .bar-r .go:hover { background:var(--brand-600); }
  .pb-root .bar-r .go svg { width:16px; height:16px; }
  .pb-root .bar-r .cx { height:46px; padding:0 16px; border-radius:var(--r-s); border:1px solid var(--line2); background:var(--card); font-family:var(--font-b); font-weight:600; font-size:13px; color:var(--muted); cursor:pointer; }
  .pb-root .bar-r .cx:hover { border-color:#BCC4D2; color:var(--body); }
  
  .pb-root .prorate { background:var(--brand-tint); border:1px solid var(--brand-tint2); border-radius:var(--r-s); padding:9px 13px; font-size:11.5px; color:var(--brand-700); margin-top:9px; display:flex; gap:8px; align-items:flex-start; line-height:1.5; }
  .pb-root .prorate svg { width:13px; height:13px; flex:none; margin-top:2px; }
`;

export const PricingPlansPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [catalog, setCatalog] = useState<SubscriptionCatalogResponse | null>(null);
  const [currentSub, setCurrentSub] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  // selection state
  const [selPlan, setSelPlan] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});

  // Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const shopId = localStorage.getItem("shop_id") || "default_shop";

  const randomStats = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + Math.floor(Math.random() * 25) + 5);
    const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const prodCount = Math.floor(Math.random() * 400) + 50;
    const prodLimit = 500;
    const usrCount = Math.floor(Math.random() * 4) + 1;
    const usrLimit = 5;
    const locCount = Math.floor(Math.random() * 2) + 1;
    const locLimit = 3;

    return { dateStr, prodCount, prodLimit, usrCount, usrLimit, locCount, locLimit };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, subRes] = await Promise.all([
        subscriptionApi.getPlans().catch(() => null),
        subscriptionApi.getCurrentSubscription(shopId).catch(() => null),
      ]);

      if (catRes) setCatalog(catRes);
      if (subRes) setCurrentSub(subRes);
    } catch (err) {
      console.error("Failed to load subscription data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  const handleAddonChange = (addonId: string, delta: number) => {
    setSelectedAddons((prev) => {
      const current = prev[addonId] || 0;
      const isToggle = addonId === "verified_badge" || addonId === "sku_expansion";
      if (isToggle) {
        return { ...prev, [addonId]: current > 0 ? 0 : 1 };
      }
      const updated = Math.max(0, Math.min(10, current + delta));
      if (updated === 0) {
        const copy = { ...prev };
        delete copy[addonId];
        return copy;
      }
      return { ...prev, [addonId]: updated };
    });
  };

  const reset = () => {
    setSelPlan(null);
    setSelectedAddons({});
  };

  const pay = () => {
    if (!selPlan && Object.keys(selectedAddons).length === 0) return;
    setIsCheckoutOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Loading pricing plans & features...</p>
      </div>
    );
  }

  const plans = catalog?.plans || [];
  const addons = catalog?.addons || [];
  const curPlanObj = plans.find(p => p.id === currentSub?.plan_id) || plans.find(p => p.id === "basic") || plans[0];
  const curPrice = billingCycle === "monthly" ? curPlanObj?.monthly_price : curPlanObj?.annual_price;

  // Proration calculation mock
  const DAYS_LEFT = 12;
  const DAYS_CYCLE = 30;

  const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

  const lines: string[] = [];
  let monthlyDelta = 0;
  let dueToday = 0;
  let newMonthly = 0;

  if (selPlan && selPlan !== curPlanObj?.id) {
    const np = plans.find(p => p.id === selPlan);
    if (np) {
      const npPrice = billingCycle === "monthly" ? np.monthly_price : np.annual_price;
      const diff = npPrice - (curPrice || 0);
      lines.push(`${curPlanObj?.name} → <b style="color:var(--ink)">${np.name}</b>`);
      monthlyDelta += diff;
      if (diff > 0) dueToday += Math.round((diff * DAYS_LEFT) / DAYS_CYCLE);
      newMonthly = npPrice;
    }
  } else {
    newMonthly = curPrice || 0;
  }

  addons.forEach(a => {
    const v = selectedAddons[a.id];
    if (!v) return;
    const isToggle = a.id === "verified_badge" || a.id === "sku_expansion";
    if (!isToggle) {
      const amt = a.price * v;
      lines.push(`${v} × ${a.name} — ${inr(amt)}/${a.billing_cycle}`);
      monthlyDelta += amt;
      newMonthly += amt;
      dueToday += Math.round((amt * DAYS_LEFT) / DAYS_CYCLE);
    } else {
      lines.push(`${a.name} — ${inr(a.price)}/${a.billing_cycle}`);
      if (a.billing_cycle === "monthly") {
        monthlyDelta += a.price;
        newMonthly += a.price;
        dueToday += Math.round((a.price * DAYS_LEFT) / DAYS_CYCLE);
      } else {
        dueToday += a.price;
      }
    }
  });

  const summaryCount = lines.length;

  const Tick = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  const checkoutPlanObj = plans.find(p => p.id === selPlan) || curPlanObj;

  return (
    <div className="pb-root">
      <style>{STYLES}</style>
      <div className="shell">
        <div className="phead">
          <h1>Plans &amp; Billing</h1>
          <p>Manage your subscription, add-ons and payment details.</p>
        </div>

        {/* ===== CURRENT PLAN + USAGE ===== */}
        <div className="cur-wrap">
          <div className="curplan">
            <div className="lbl">Your current plan</div>
            <div className="nm">{curPlanObj?.name} <span className="act">ACTIVE</span></div>
            <div className="amt"><b>{inr(curPrice || 0)}</b> / {billingCycle}</div>
            <div className="rn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="16" y1="3" x2="16" y2="7" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="3" y1="11" x2="21" y2="11" /></svg>
              Renews automatically on <b style={{ color: '#fff', marginLeft: '3px' }}>{randomStats.dateStr}</b>
            </div>
            <div className="btns">
              <button className="wbtn solid" onClick={() => {
                document.getElementById("plans")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}>Upgrade plan</button>
              <button className="wbtn">Change billing date</button>
              <button className="wbtn">Cancel</button>
            </div>
          </div>

          <div className="usage">
            <div className="uh">
              <div><div className="ut">Your usage</div><div className="us">Resets on renewal</div></div>
            </div>

            <div className="um">
              <div className="r1">
                <span className="k"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>Products (SKUs)</span>
                <span className="v">{randomStats.prodCount} <small>/ {randomStats.prodLimit}</small></span>
              </div>
              <div className="bar"><b className={randomStats.prodCount / randomStats.prodLimit > 0.8 ? "full" : "warn"} style={{ width: `${(randomStats.prodCount / randomStats.prodLimit) * 100}%` }}></b></div>
              <div className={`note ${randomStats.prodCount / randomStats.prodLimit > 0.8 ? "full" : "warn"}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                Only {randomStats.prodLimit - randomStats.prodCount} left — <a onClick={() => handleAddonChange("sku_expansion", 1)}>add SKU expansion</a>
              </div>
            </div>

            <div className="um">
              <div className="r1">
                <span className="k"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>Users</span>
                <span className="v">{randomStats.usrCount} <small>/ {randomStats.usrLimit}</small></span>
              </div>
              <div className="bar"><b className={randomStats.usrCount / randomStats.usrLimit > 0.8 ? "full" : "warn"} style={{ width: `${(randomStats.usrCount / randomStats.usrLimit) * 100}%` }}></b></div>
              <div className={`note ${randomStats.usrCount / randomStats.usrLimit > 0.8 ? "full" : "warn"}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {randomStats.usrLimit - randomStats.usrCount === 0 ? "Limit reached — " : `Only ${randomStats.usrLimit - randomStats.usrCount} left — `}
                <a onClick={() => handleAddonChange("extra_user", 1)}>add a user</a>
              </div>
            </div>

            <div className="um">
              <div className="r1">
                <span className="k"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-5h16l1 5" /><path d="M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" /></svg>Business locations</span>
                <span className="v">{randomStats.locCount} <small>/ {randomStats.locLimit}</small></span>
              </div>
              <div className="bar"><b className={randomStats.locCount / randomStats.locLimit > 0.8 ? "full" : "warn"} style={{ width: `${(randomStats.locCount / randomStats.locLimit) * 100}%` }}></b></div>
            </div>
          </div>
        </div>

        {/* ===== PLANS ===== */}
        <div className="cyc-row" id="plans">
          <div>
            <div className="sec-t">Choose your plan</div>
            <div className="sec-s">Change anytime. We only charge the difference.</div>
          </div>
          <div className="cyc">
            <button className={billingCycle === "monthly" ? "on" : ""} onClick={() => setBillingCycle("monthly")}>Monthly</button>
            <button className={billingCycle === "annual" ? "on" : ""} onClick={() => setBillingCycle("annual")}>Yearly <span className="save">2 MONTHS FREE</span></button>
          </div>
        </div>

        <div className="plans">
          {plans.map((p, idx) => {
            const isCur = curPlanObj?.id === p.id;
            const isSel = selPlan === p.id;
            const price = billingCycle === "monthly" ? p.monthly_price : p.annual_price;
            const per = billingCycle === "monthly" ? "/ month" : "/ year";
            const sub = billingCycle === "annual"
              ? inr(Math.round(p.annual_price / 12)) + " per month · billed yearly"
              : "Billed monthly";

            const curIndex = plans.findIndex(x => x.id === curPlanObj?.id);
            const thisIndex = idx;

            let cta;
            if (isCur && !selPlan) {
              cta = <button className="btn ghost"><Tick /> Your current plan</button>;
            } else if (isCur) {
              cta = <button className="btn" onClick={() => setSelPlan(null)}>Keep this plan</button>;
            } else if (isSel) {
              cta = <button className="btn pri"><Tick /> Selected</button>;
            } else if (thisIndex > curIndex) {
              cta = <button className="btn pri" onClick={() => setSelPlan(p.id)}>Upgrade to {p.name}</button>;
            } else {
              cta = <button className="btn" onClick={() => setSelPlan(p.id)}>Switch to {p.name}</button>;
            }

            const includedLabel = p.id === "digital_store"
              ? "WHAT'S INCLUDED"
              : p.id === "basic"
                ? "EVERYTHING IN DIGITAL STORE, PLUS"
                : "EVERYTHING IN BASIC, PLUS";

            return (
              <div key={p.id} className={`pc ${isCur || isSel ? "current" : ""}`}>
                {isCur && <div className="ribbon">CURRENT PLAN</div>}
                {isSel && !isCur && <div className="ribbon" style={{ background: 'var(--pos)' }}>SELECTED</div>}
                <div className="nm">{p.name}</div>
                <div className="ds">{p.description}</div>
                <div className="pr"><span className="big">{inr(price)}</span><span className="per">{per}</span></div>
                <div className="sub">{sub}</div>
                <div className="cta">{cta}</div>
                <div className="dv"></div>
                <div className="il">{includedLabel}</div>
                <ul>
                  {p.included_features.map((f, i) => (
                    <li key={i}><Tick /><span dangerouslySetInnerHTML={{ __html: f }}></span></li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* ===== ADD-ONS ===== */}
        <div className="cyc-row">
          <div>
            <div className="sec-t">Optional add-ons</div>
            <div className="sec-s">Extend your plan as the business grows. Billed with your subscription.</div>
          </div>
        </div>

        <div className="addons">
          {addons.map(a => {
            const val = selectedAddons[a.id] || 0;
            const isToggle = a.id === "verified_badge" || a.id === "sku_expansion";
            const active = val > 0;

            const iconsMap: Record<string, any> = {
              extra_store: <Store size={16} strokeWidth={2} />,
              extra_user: <Users size={16} strokeWidth={2} />,
              sku_expansion: <Database size={16} strokeWidth={2} />,
              verified_badge: <Award size={16} strokeWidth={2} />,
            };
            const Icon = iconsMap[a.id] || <Sparkles size={16} strokeWidth={2} />;

            let ctrl;
            if (!isToggle) {
              ctrl = (
                <div className="qty">
                  <button onClick={() => handleAddonChange(a.id, -1)} disabled={val <= 0}>−</button>
                  <span className="n">{val}</span>
                  <button onClick={() => handleAddonChange(a.id, 1)} disabled={val >= 10}>+</button>
                </div>
              );
            } else {
              ctrl = (
                <button className={`tgl ${val ? "on" : ""}`} onClick={() => handleAddonChange(a.id, 1)}>
                  {val ? <><Tick /> Added</> : "Add to plan"}
                </button>
              );
            }

            return (
              <div key={a.id} className={`ac ${active ? "on" : ""}`}>
                <span className="ai">{Icon}</span>
                <div className="an">{a.name}</div>
                <div className="ap">{inr(a.price)} / {a.billing_cycle}</div>
                <div className="ad">{a.description}</div>
                {ctrl}
              </div>
            );
          })}
        </div>

        {/* ===== PAYMENT METHOD ===== */}
        <div className="card">
          <div className="ch"><div><div className="t">Payment method</div><div className="s">Used for automatic renewal</div></div></div>
          <div className="pm">
            <span className="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2.5" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg></span>
            <div><div className="t2">UPI — vaathimart@okaxis</div><div className="s2">Auto-pay mandate active · Next charge {randomStats.dateStr}</div></div>
            <div className="act2"><button className="sbtn">Change</button></div>
          </div>
        </div>

        {/* ===== HISTORY ===== */}
        <div className="card">
          <div className="ch">
            <div><div className="t">Billing history</div><div className="s">Your past invoices</div></div>
            <a className="lnk">Download all</a>
          </div>
          <table>
            <thead><tr>
              <th style={{ width: '130px' }}>Date</th><th style={{ width: '140px' }}>Invoice</th><th>Description</th>
              <th className="r" style={{ width: '120px' }}>Amount</th><th style={{ width: '110px' }}>Status</th><th style={{ width: '100px' }}></th>
            </tr></thead>
            <tbody>
              <tr><td>15 Sep 2026</td><td className="mono" style={{ color: 'var(--brand)', fontWeight: 600 }}>SUB-100412</td>
                <td>Basic plan · Monthly</td><td className="r mono" style={{ fontWeight: 600 }}>₹999.00</td>
                <td><span className="chip paid"><span className="d"></span>Paid</span></td><td className="r"><a className="lnk">Download</a></td></tr>
              <tr><td>15 Aug 2026</td><td className="mono" style={{ color: 'var(--brand)', fontWeight: 600 }}>SUB-100388</td>
                <td>Basic plan · Monthly</td><td className="r mono" style={{ fontWeight: 600 }}>₹999.00</td>
                <td><span className="chip paid"><span className="d"></span>Paid</span></td><td className="r"><a className="lnk">Download</a></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== STICKY SUMMARY ===== */}
      {summaryCount > 0 && (
        <div className="bar-b on" id="sum">
          <div className="bar-in">
            <div className="bar-l">
              <div className="ttl">Your changes <span className="cnt">{summaryCount}</span></div>
              <div className="items" dangerouslySetInnerHTML={{ __html: lines.join(" &nbsp;·&nbsp; ") + (summaryCount > 0 ? `<div class="prorate"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg><span>You pay only for the <b>${DAYS_LEFT} days</b> left in this cycle. Full amount starts from your next renewal on ${randomStats.dateStr}.</span></div>` : "") }}></div>
            </div>
            <div className="bar-r">
              <div className="tot">
                <div className="lb">Due today</div>
                <div className="vl">{inr(dueToday)}</div>
                <div className="nx">Then {inr(newMonthly)} / {billingCycle === "monthly" ? "month" : "year"} from {randomStats.dateStr}</div>
              </div>
              <button className="cx" onClick={reset}>Cancel</button>
              <button className="go" onClick={pay}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>
                Confirm &amp; pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutPlanObj && (
        <RazorpayCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          shopId={shopId}
          selectedPlan={checkoutPlanObj}
          billingCycle={billingCycle}
          selectedAddons={selectedAddons}
          addonsCatalog={addons}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};

export default PricingPlansPage;
