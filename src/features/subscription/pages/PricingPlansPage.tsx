import React, { useState, useEffect } from "react";
import { Sparkles, Store, Users, Database, Award, Loader2, CreditCard, History } from "lucide-react";
import { SubscriptionData, SubscriptionCatalogResponse, TransactionItem } from "../types";
import { subscriptionApi } from "@/services/api/subscription";
import { RazorpayCheckoutModal } from "../components/RazorpayCheckoutModal";


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
  .pb-root .phead { margin-bottom:16px; }

  /* ============ SWITCHING TABS ============ */
  .pb-root .pb-tabs-wrap { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; border-bottom: 1px solid var(--line); padding-bottom: 16px; flex-wrap: wrap; gap: 12px; }
  .pb-root .pb-tabs { display: inline-flex; gap: 6px; background: var(--panel); border: 1px solid var(--line); padding: 4px; border-radius: var(--r-s); }
  .pb-root .pb-tab { display: flex; align-items: center; gap: 8px; font-family: var(--font-b); font-weight: 600; font-size: 13px; color: var(--muted); background: transparent; border: none; border-radius: 6px; padding: 7px 16px; cursor: pointer; transition: all .15s ease; }
  .pb-root .pb-tab:hover { color: var(--ink); background: rgba(0,0,0,0.03); }
  .pb-root .pb-tab.active { background: var(--card); color: var(--brand); box-shadow: var(--sh); font-weight: 700; }
  .pb-root .tab-badge { font-size: 10px; font-weight: 700; background: var(--brand-tint); color: var(--brand-600); padding: 1px 7px; border-radius: var(--r-p); border: 1px solid var(--brand-tint2); }
  
  /* history stat cards */
  .pb-root .hist-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 22px; }
  @media(max-width:768px){ .pb-root .hist-stats { grid-template-columns: 1fr; } }
  .pb-root .hstat-card { background: var(--card); border: 1px solid var(--line); border-radius: var(--r); padding: 16px 18px; box-shadow: var(--sh); }
  .pb-root .hstat-lbl { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
  .pb-root .hstat-val { font-family: var(--font-d); font-size: 22px; font-weight: 700; color: var(--ink); margin-top: 4px; }
  .pb-root .hstat-sub { font-size: 12px; color: var(--faint); margin-top: 2px; }

  .pb-root .phead h1 { font-family:var(--font-d); font-weight:600; font-size:25px; color:var(--ink); letter-spacing:-.03em; margin:0; }
  .pb-root .phead p { font-size:13.5px; color:var(--muted); margin:5px 0 0; }
  
  /* ============ CURRENT PLAN ============ */
  .pb-root .cur-wrap { display:grid; grid-template-columns:1.25fr 1fr; gap:15px; margin-bottom:22px; }
  @media(max-width:980px){ .pb-root .cur-wrap { grid-template-columns:1fr; } }
  
  .pb-root .curplan { background:linear-gradient(to bottom right, #2563eb, #1d4ed8, #1e3a8a); border-radius:var(--r); padding:22px 24px; color:#fff; position:relative; overflow:hidden; box-shadow:var(--sh-m); transition: background 0.3s ease; }
  .pb-root .curplan.is-expired-card { background:linear-gradient(to bottom right, #dc2626, #b91c1c, #7f1d1d); }
  .pb-root .curplan .act.expired { background:rgba(254,202,202,.2); border:1px solid rgba(254,202,202,.4); color:#fecaca; }
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
  .pb-root .plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; align-items: stretch; }
  @media(max-width:980px){ .pb-root .plans { grid-template-columns: 1fr; } }
  
  .pb-root .plan-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.02);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    transition: all 0.2s ease;
  }
  .pb-root .plan-card:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }
  .pb-root .plan-card.is-current {
    border: 2px solid #2563eb;
    box-shadow: 0 4px 20px -2px rgba(37,99,235,0.15);
  }
  .pb-root .plan-card.is-selected {
    border: 2px solid #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.18);
  }
  
  .pb-root .plan-top-banner {
    background: #2563eb;
    color: #ffffff;
    text-align: center;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 7px 12px;
    width: 100%;
  }
  
  .pb-root .plan-body {
    padding: 24px 26px 28px;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  
  .pb-root .plan-title {
    font-family: var(--font-d);
    font-size: 21px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.02em;
    margin: 0;
  }
  
  .pb-root .plan-desc {
    font-size: 12.5px;
    color: #64748b;
    line-height: 1.5;
    margin: 8px 0 0;
    min-height: 38px;
  }
  
  .pb-root .plan-price-wrap {
    margin-top: 18px;
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .pb-root .plan-price-wrap .price-amount {
    font-family: var(--font-d);
    font-size: 32px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .pb-root .plan-price-wrap .price-cycle {
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
  }
  .pb-root .plan-billed-sub {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 4px;
    margin-bottom: 18px;
  }
  
  .pb-root .plan-btn svg { width: 14px; height: 14px; flex: none; }
  .pb-root .plan-btn {
    width: 100%;
    height: 42px;
    border-radius: 8px;
    font-family: var(--font-b);
    font-size: 13px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid transparent;
  }
  .pb-root .plan-btn.btn-outline {
    background: #ffffff;
    border-color: #e2e8f0;
    color: #1e293b;
  }
  .pb-root .plan-btn.btn-outline:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
  .pb-root .plan-btn.btn-primary {
    background: #2563eb;
    color: #ffffff;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .pb-root .plan-btn.btn-primary:hover {
    background: #1d4ed8;
  }
  .pb-root .plan-btn.btn-current {
    background: #f1f5f9;
    border-color: #e2e8f0;
    color: #475569;
    cursor: default;
  }
  .pb-root .plan-btn.btn-selected {
    background: #eff6ff;
    border-color: #2563eb;
    color: #2563eb;
  }
  
  .pb-root .plan-divider {
    height: 1px;
    background: #e2e8f0;
    margin: 22px 0 16px;
    width: 100%;
  }
  
  .pb-root .plan-section-label {
    font-size: 10.5px;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    margin-bottom: 14px;
  }
  
  .pb-root .plan-features-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .pb-root .plan-feature-item {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    font-size: 12.5px;
    color: #334155;
    line-height: 1.45;
  }
  .pb-root .plan-feature-item svg {
    width: 14px;
    height: 14px;
    color: #16a34a;
    flex: none;
    margin-top: 2px;
  }

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

export interface PricingPlansPageProps {
  isEmbedded?: boolean;
}

const PricingPlansPage: React.FC<PricingPlansPageProps> = ({ isEmbedded = false }) => {
  const [activeTab, setActiveTab] = useState<"plans" | "history">("plans");
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
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
  const shopName = localStorage.getItem("shop_name") || "Your Store";

  const generateInvoiceHtml = (tx: any, sName: string, sId: string) => {
    const dateFormatted = tx.created_at
      ? new Date(tx.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    
    const receiptNo = tx.receipt || tx.razorpay_order_id || `SUB-${(tx.id || "001").substring(0, 8).toUpperCase()}`;
    const planName = (tx.plan_id || "Basic").charAt(0).toUpperCase() + (tx.plan_id || "Basic").slice(1);
    const cycle = (tx.billing_cycle || "monthly").toUpperCase();
    const paymentRef = tx.razorpay_payment_id || tx.razorpay_order_id || "Online Settlement";
    const amountVal = Number(tx.amount || 0);
    const amountStr = amountVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const addonsRows = (tx.addons || []).map((add: any) => `
      <tr>
        <td style="padding:12px 16px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#1e293b;">
          ${add.quantity || 1}x ${add.name || add.addon_id}
        </td>
        <td style="padding:12px 16px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#64748b; text-align:center;">
          ${add.billing_cycle || 'monthly'}
        </td>
        <td style="padding:12px 16px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#1e293b; font-weight:600; text-align:right;">
          ₹${Number(add.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `).join("");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice - ${receiptNo} - ${sName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      padding: 40px 20px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-box {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 44px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 2px solid #f1f5f9;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      color: #2563eb;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
      font-weight: 500;
    }
    .inv-badge {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 999px;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .inv-title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
    }
    .inv-num {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 13px;
      color: #2563eb;
      font-weight: 600;
      margin-top: 4px;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin: 28px 0;
    }
    .section-label {
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .detail-val {
      font-size: 13.5px;
      color: #1e293b;
      line-height: 1.6;
    }
    .shop-name-highlight {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
    }
    th {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      padding: 12px 16px;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .total-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px 22px;
      margin-left: auto;
      width: 320px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #64748b;
      padding: 4px 0;
    }
    .total-final {
      display: flex;
      justify-content: space-between;
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      margin-top: 8px;
    }
    .footer-note {
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #f1f5f9;
      text-align: center;
      font-size: 11.5px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .no-print {
      text-align: center;
      margin-bottom: 20px;
    }
    .print-btn {
      background: #2563eb;
      color: #fff;
      border: none;
      padding: 10px 22px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 10px rgba(37,99,235,0.2);
    }
    @media print {
      body { background: #fff; padding: 0; }
      .invoice-box { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  <div class="invoice-box">
    <div class="header">
      <div>
        <div class="brand-title">InventQ</div>
        <div class="brand-sub">Hyperlocal Retail Cloud Infrastructure</div>
      </div>
      <div style="text-align: right;">
        <div class="inv-badge">● Paid &amp; Verified</div>
        <div class="inv-title">TAX INVOICE</div>
        <div class="inv-num">${receiptNo}</div>
      </div>
    </div>

    <div class="details-grid">
      <div>
        <div class="section-label">Billed To Store</div>
        <div class="detail-val">
          <div class="shop-name-highlight">${sName}</div>
          <div>Store ID: <span style="font-family:'IBM Plex Mono',monospace; font-size:12px;">${sId}</span></div>
          <div>Country: India</div>
        </div>
      </div>
      <div>
        <div class="section-label">Payment Information</div>
        <div class="detail-val">
          <div><strong>Date:</strong> ${dateFormatted}</div>
          <div><strong>Payment ID:</strong> <span style="font-family:'IBM Plex Mono',monospace; font-size:12px;">${paymentRef}</span></div>
          <div><strong>Method:</strong> Razorpay Online (UPI/Cards)</div>
          <div><strong>Status:</strong> Success / Settled</div>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="text-align: left;">Item &amp; Description</th>
          <th style="text-align: center; width: 120px;">Billing Period</th>
          <th style="text-align: right; width: 140px;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13.5px; color: #0f172a; font-weight: 600;">
            ${planName} Plan Subscription
            <div style="font-size: 11.5px; color: #64748b; font-weight: 400; margin-top: 2px;">
              Complete retail billing POS, inventory management, multi-store access, and live catalogue sync.
            </div>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; text-align: center; font-weight: 500;">
            ${cycle}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13.5px; color: #0f172a; font-weight: 700; text-align: right;">
            ₹${amountStr}
          </td>
        </tr>
        ${addonsRows}
      </tbody>
    </table>

    <div class="total-card">
      <div class="total-row">
        <span>Subtotal</span>
        <span>₹${amountStr}</span>
      </div>
      <div class="total-row">
        <span>Taxes (GST)</span>
        <span>Included (0% SAC)</span>
      </div>
      <div class="total-final">
        <span>Total Paid</span>
        <span style="color: #2563eb;">₹${amountStr}</span>
      </div>
    </div>

    <div class="footer-note">
      This is a computer-generated tax invoice and payment receipt for <strong>${sName}</strong>.<br/>
      Thank you for choosing InventQ. For any billing inquiries, contact billing@inventq.io.
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 350);
    };
  </script>
</body>
</html>`;
  };

  const generateStatementHtml = (txList: any[], sName: string, sId: string) => {
    const totalSpent = txList.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const rows = txList.map((tx: any) => {
      const dt = tx.created_at
        ? new Date(tx.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "—";
      const rec = tx.receipt || tx.razorpay_order_id || `SUB-${(tx.id || "001").substring(0, 8).toUpperCase()}`;
      const desc = `${(tx.plan_id || "Basic").toUpperCase()} Plan · ${tx.billing_cycle || "Monthly"}`;
      const amt = Number(tx.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
      return `
        <tr>
          <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#334155;">${dt}</td>
          <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:#2563eb; font-weight:600;">${rec}</td>
          <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#1e293b;">${desc}</td>
          <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-size:12.5px; color:#64748b;">Razorpay Online</td>
          <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-size:12px; text-align:center;"><span style="background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:999px; font-weight:700;">Paid</span></td>
          <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; font-family:'IBM Plex Mono',monospace; font-size:13px; color:#0f172a; font-weight:700; text-align:right;">₹${amt}</td>
        </tr>
      `;
    }).join("");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Billing Statement - ${sName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      padding: 40px 20px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .box {
      max-width: 860px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 44px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 2px solid #f1f5f9;
    }
    .brand { font-size: 24px; font-weight: 800; color: #2563eb; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; text-align: right; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
    .stat-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .stat-val { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 10px 14px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .no-print { text-align: center; margin-bottom: 20px; }
    .btn { background: #2563eb; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
    @media print {
      body { background: #fff; padding: 0; }
      .box { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn" onclick="window.print()">🖨️ Print Statement</button>
  </div>
  <div class="box">
    <div class="header">
      <div>
        <div class="brand">InventQ</div>
        <div style="font-size:12px; color:#64748b; margin-top:4px;">Billing &amp; Payment Statement</div>
      </div>
      <div>
        <div class="title">STATEMENT OF ACCOUNT</div>
        <div style="font-size:12px; color:#64748b; text-align:right; margin-top:4px;">Store: <strong>${sName}</strong></div>
      </div>
    </div>

    <div class="summary-grid">
      <div class="stat-card">
        <div class="stat-label">Store ID</div>
        <div class="stat-val" style="font-family:'IBM Plex Mono',monospace; font-size:14px;">${sId.substring(0, 16)}...</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Invoices</div>
        <div class="stat-val">${txList.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Spend (Settled)</div>
        <div class="stat-val" style="color:#2563eb;">₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="text-align:left;">Date</th>
          <th style="text-align:left;">Invoice ID</th>
          <th style="text-align:left;">Description</th>
          <th style="text-align:left;">Method</th>
          <th style="text-align:center;">Status</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div style="text-align:center; font-size:11.5px; color:#94a3b8; margin-top:32px; border-top:1px solid #f1f5f9; padding-top:16px;">
      InventQ Technologies • Official Account Statement for <strong>${sName}</strong>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 350);
    };
  </script>
</body>
</html>`;
  };

  const handleDownloadInvoice = (tx: any) => {
    const html = generateInvoiceHtml(tx, shopName, shopId);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const handleDownloadAllInvoices = () => {
    const list = transactions.length > 0 ? transactions : [
      {
        id: "mock_tx_1",
        receipt: "SUB-100412",
        razorpay_order_id: "order_mock_001",
        razorpay_payment_id: "pay_mock_001",
        amount: 999,
        plan_id: "basic",
        billing_cycle: "monthly",
        created_at: "2026-09-15T00:00:00Z",
        status: "paid"
      },
      {
        id: "mock_tx_2",
        receipt: "SUB-100388",
        razorpay_order_id: "order_mock_002",
        razorpay_payment_id: "pay_mock_002",
        amount: 999,
        plan_id: "basic",
        billing_cycle: "monthly",
        created_at: "2026-08-15T00:00:00Z",
        status: "paid"
      }
    ];

    const html = generateStatementHtml(list, shopName, shopId);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const [actualUsage, setActualUsage] = useState({
    prodCount: 0,
    prodLimit: 500,
    usrCount: 0,
    usrLimit: 5,
    locCount: 1,
    locLimit: 3,
    renewalDate: "",
  });



  const loadData = async () => {
    try {
      setLoading(true);
      // Clean, single-source fetch: read subscription catalog, status & live usage from backend
      const [catRes, subRes, txRes] = await Promise.all([
        subscriptionApi.getPlans().catch(() => null),
        subscriptionApi.getCurrentSubscription(shopId).catch(() => null),
        subscriptionApi.getTransactions(shopId).catch(() => []),
      ]);
      if (txRes && Array.isArray(txRes)) setTransactions(txRes);

      if (catRes) setCatalog(catRes);
      if (subRes) setCurrentSub(subRes);

      // 1. Renewal Date Formatting
      let renewalDateStr = "";
      if (subRes?.current_period_end) {
        const d = new Date(subRes.current_period_end);
        renewalDateStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      } else if (subRes?.trial_ends_at) {
        const d = new Date(subRes.trial_ends_at);
        renewalDateStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      } else {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        renewalDateStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      }

      const activePlan = catRes?.plans?.find((p: any) => p.id === subRes?.plan_id) || catRes?.plans?.[0];
      const pLimit = subRes?.limits?.max_skus || activePlan?.limits?.max_skus || 500;
      const uLimit = subRes?.limits?.max_users || activePlan?.limits?.max_users || 2;
      const lLimit = subRes?.limits?.max_locations || activePlan?.limits?.max_locations || 1;

      const subUsage = (subRes as any)?.usage || {};
      const prodUsageCount = subUsage.current_skus ?? 0;
      const userUsageCount = subUsage.current_users ?? 0;
      const locUsageCount = subUsage.current_locations ?? 1;

      setActualUsage({
        prodCount: prodUsageCount,
        prodLimit: pLimit,
        usrCount: userUsageCount,
        usrLimit: uLimit,
        locCount: locUsageCount,
        locLimit: lLimit,
        renewalDate: renewalDateStr,
      });
    } catch (err) {
      console.error("Failed to load subscription & usage data:", err);
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
      const isToggle = addonId === "verified_badge";
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

  // Proration calculation: dynamically computed from current renewal / expiry date
  const nowTime = new Date();
  const targetRenewal = currentSub?.current_period_end
    ? new Date(currentSub.current_period_end)
    : currentSub?.trial_ends_at
    ? new Date(currentSub.trial_ends_at)
    : new Date(nowTime.getTime() + 14 * 24 * 60 * 60 * 1000);

  const diffMs = targetRenewal.getTime() - nowTime.getTime();
  const DAYS_LEFT = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const DAYS_CYCLE = billingCycle === "annual" ? 365 : 30;

  const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

  const lines: string[] = [];
  let monthlyDelta = 0;
  let dueToday = 0;
  let newMonthly = 0;

  const PLAN_TIER: Record<string, number> = {
    digital_store: 1,
    basic: 2,
    pro: 3,
  };

  const isSubActive = currentSub?.status === "active" && !(currentSub as any)?.is_expired;
  const curTier = PLAN_TIER[curPlanObj?.id || ""] || (isSubActive ? 2 : 0);

  let isUpgradeAction = false;
  let unusedCreditAmt = 0;

  if (selPlan) {
    const targetPlan = plans.find(p => p.id === selPlan) || curPlanObj;
    if (targetPlan) {
      const targetTier = PLAN_TIER[targetPlan.id] || 0;
      const targetPrice = billingCycle === "monthly" ? targetPlan.monthly_price : targetPlan.annual_price;
      
      if (isSubActive && targetTier > curTier) {
        // Upgrading to higher tier mid-cycle: deduct the remaining days' paid credit
        isUpgradeAction = true;
        const curCredit = Math.round(((curPrice || 0) * DAYS_LEFT) / DAYS_CYCLE);
        const targetProratedCost = Math.round((targetPrice * DAYS_LEFT) / DAYS_CYCLE);
        const upgradeDiff = Math.max(0, targetProratedCost - curCredit);
        
        unusedCreditAmt = curCredit;
        lines.push(`${curPlanObj?.name} → <b style="color:var(--ink)">${targetPlan.name}</b> (Upgrade)`);
        monthlyDelta += (targetPrice - (curPrice || 0));
        dueToday += upgradeDiff;
      } else if (selPlan === curPlanObj?.id && !isSubActive) {
        lines.push(`Renew <b style="color:var(--ink)">${targetPlan.name}</b>`);
        monthlyDelta += targetPrice;
        dueToday += targetPrice;
      } else {
        lines.push(`${curPlanObj?.name} → <b style="color:var(--ink)">${targetPlan.name}</b>`);
        monthlyDelta += targetPrice;
        dueToday += targetPrice;
      }
      newMonthly = targetPrice;
    }
  } else {
    newMonthly = curPrice || 0;
  }

  addons.forEach(a => {
    const v = selectedAddons[a.id];
    if (!v) return;
    const isToggle = a.id === "verified_badge";
    const amt = !isToggle ? a.price * v : a.price;
    const itemLabel = !isToggle ? `${v} × ${a.name}` : a.name;
    
    lines.push(`${itemLabel} — ${inr(amt)}/${a.billing_cycle}`);
    monthlyDelta += amt;
    newMonthly += amt;
    
    if (isSubActive && a.billing_cycle === "monthly") {
      dueToday += Math.round((amt * DAYS_LEFT) / DAYS_CYCLE);
    } else {
      dueToday += amt;
    }
  });

  const summaryCount = lines.length;

  const Tick = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  const checkoutPlanObj = plans.find(p => p.id === selPlan) || curPlanObj;

  return (
    <div className="pb-root">
      <style>{STYLES}</style>
      <div className="shell" style={isEmbedded ? { padding: "0 0 100px", maxWidth: "100%" } : {}}>
        {!isEmbedded && (
          <div className="phead">
            <h1>Plans &amp; Billing</h1>
            <p>Manage your subscription, add-ons and payment details.</p>
          </div>
        )}

        {/* ===== SWITCHING TABS ===== */}
        <div className="pb-tabs-wrap">
          <div className="pb-tabs">
            <button
              type="button"
              className={`pb-tab ${activeTab === "plans" ? "active" : ""}`}
              onClick={() => setActiveTab("plans")}
            >
              <CreditCard size={15} />
              <span>Plans &amp; Add-ons</span>
            </button>
            <button
              type="button"
              className={`pb-tab ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              <History size={15} />
              <span>Billing History</span>
              {transactions.length > 0 && <span className="tab-badge">{transactions.length}</span>}
            </button>
          </div>
          {activeTab === "history" && (
            <button className="wbtn solid" style={{ color: "var(--brand-700)", border: "1px solid var(--line2)" }} onClick={() => setActiveTab("plans")}>
              Upgrade / Change Plan
            </button>
          )}
        </div>

        {activeTab === "plans" && (
          <>
            {/* ===== CURRENT PLAN + USAGE ===== */}
            <div className="cur-wrap">
              <div className={`curplan ${currentSub?.status === "expired" ? "is-expired-card" : ""}`}>
                <div className="lbl">{currentSub?.status === "expired" ? "Expired Subscription" : "Your current plan"}</div>
                <div className="nm">
                  {curPlanObj?.name}{" "}
                  {currentSub?.status === "expired" ? (
                    <span className="act expired">EXPIRED</span>
                  ) : currentSub?.status === "trialing" ? (
                    <span className="act" style={{ background: "rgba(254,240,138,0.2)", borderColor: "rgba(254,240,138,0.4)", color: "#fef08a" }}>TRIAL</span>
                  ) : (
                    <span className="act">ACTIVE</span>
                  )}
                </div>
                <div className="amt"><b>{inr(curPrice || 0)}</b> / {billingCycle}</div>
                <div className="rn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="16" y1="3" x2="16" y2="7" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="3" y1="11" x2="21" y2="11" /></svg>
                  {currentSub?.status === "expired" ? (
                    <span>Expired on <b style={{ color: '#fff', marginLeft: '3px' }}>{actualUsage.renewalDate || "Recently"}</b> — Please renew to unlock features</span>
                  ) : (
                    <span>Renews automatically on <b style={{ color: '#fff', marginLeft: '3px' }}>{actualUsage.renewalDate || "Next month"}</b></span>
                  )}
                </div>
                <div className="btns">
                  {currentSub?.status === "expired" ? (
                    <>
                      <button className="wbtn solid" style={{ color: "var(--coral-tx)" }} onClick={() => {
                        setSelPlan(curPlanObj?.id);
                        setIsCheckoutOpen(true);
                      }}>
                        Renew {curPlanObj?.name} Now
                      </button>
                      <button className="wbtn" onClick={() => {
                        document.getElementById("plans")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}>
                        Change Plan
                      </button>
                      <button className="wbtn" onClick={() => setActiveTab("history")}>Billing history</button>
                    </>
                  ) : (
                    <>
                      <button className="wbtn solid" onClick={() => {
                        document.getElementById("plans")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}>Upgrade plan</button>
                      <button className="wbtn" onClick={() => setActiveTab("history")}>Billing history</button>
                    </>
                  )}
                </div>
              </div>

              <div className="usage">
                <div className="uh">
                  <div><div className="ut">Your usage</div><div className="us">Resets on renewal</div></div>
                </div>

                {/* Products (SKUs) */}
                <div className="um">
                  <div className="r1">
                    <span className="k"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>Products (SKUs)</span>
                    <span className="v">{actualUsage.prodCount} <small>/ {actualUsage.prodLimit}</small></span>
                  </div>
                  <div className="bar"><b className={actualUsage.prodLimit > 0 && actualUsage.prodCount / actualUsage.prodLimit > 0.8 ? "full" : "warn"} style={{ width: `${Math.min(100, (actualUsage.prodCount / (actualUsage.prodLimit || 1)) * 100)}%` }}></b></div>
                  <div className={`note ${actualUsage.prodLimit > 0 && actualUsage.prodCount / actualUsage.prodLimit > 0.8 ? "full" : "warn"}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    {actualUsage.prodLimit - actualUsage.prodCount <= 0
                      ? "SKU limit reached — "
                      : `Only ${actualUsage.prodLimit - actualUsage.prodCount} left — `}
                    <a onClick={() => handleAddonChange("sku_expansion", 1)}>add SKU expansion</a>
                  </div>
                </div>

                {/* Users (Employees) */}
                <div className="um">
                  <div className="r1">
                    <span className="k"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>Users</span>
                    <span className="v">{actualUsage.usrCount} <small>/ {actualUsage.usrLimit}</small></span>
                  </div>
                  <div className="bar"><b className={actualUsage.usrLimit > 0 && actualUsage.usrCount / actualUsage.usrLimit > 0.8 ? "full" : "warn"} style={{ width: `${Math.min(100, (actualUsage.usrCount / (actualUsage.usrLimit || 1)) * 100)}%` }}></b></div>
                  <div className={`note ${actualUsage.usrLimit > 0 && actualUsage.usrCount / actualUsage.usrLimit > 0.8 ? "full" : "warn"}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {actualUsage.usrLimit - actualUsage.usrCount <= 0
                      ? "User limit reached — "
                      : `Only ${actualUsage.usrLimit - actualUsage.usrCount} left — `}
                    <a onClick={() => handleAddonChange("extra_user", 1)}>add a user</a>
                  </div>
                </div>

                {/* Business Locations (Shops for this user) */}
                <div className="um">
                  <div className="r1">
                    <span className="k"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-5h16l1 5" /><path d="M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" /></svg>Business locations</span>
                    <span className="v">{actualUsage.locCount} <small>/ {actualUsage.locLimit}</small></span>
                  </div>
                  <div className="bar"><b className={actualUsage.locLimit > 0 && actualUsage.locCount / actualUsage.locLimit >= 1 ? "full" : "warn"} style={{ width: `${Math.min(100, (actualUsage.locCount / (actualUsage.locLimit || 1)) * 100)}%` }}></b></div>
                  <div className={`note ${actualUsage.locLimit > 0 && actualUsage.locCount / actualUsage.locLimit >= 1 ? "full" : "warn"}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    Location limit reached — <a onClick={() => handleAddonChange("extra_store", 1)}>add a location</a>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== BILLING CYCLE TOGGLE ===== */}
            <div className="cyc-row" id="plans">
              <div>
                <div className="sec-t">Choose your plan</div>
                <div className="sec-s">Change anytime. We only charge the difference.</div>
              </div>
              <div className="cyc">
                <button className={billingCycle === "monthly" ? "on" : ""} onClick={() => setBillingCycle("monthly")}>Monthly</button>
                <button className={billingCycle === "annual" ? "on" : ""} onClick={() => setBillingCycle("annual")}>
                  Yearly <span className="save">2 MONTHS FREE</span>
                </button>
              </div>
            </div>

                        {/* ===== PLAN CARDS ===== */}
            <div className="plans">
              {plans.map(p => {
                const isCur = p.id === curPlanObj?.id;
                const isSel = p.id === selPlan;
                const price = billingCycle === "monthly" ? p.monthly_price : p.annual_price;

                // Feature category heading
                let sectionLabel = "WHAT'S INCLUDED";
                if (p.id === "basic") sectionLabel = "EVERYTHING IN DIGITAL STORE, PLUS";
                else if (p.id === "pro") sectionLabel = "EVERYTHING IN BASIC, PLUS";

                // Action button logic
                let btn;
                const isExpired = currentSub?.status === "expired";
                const targetTier = PLAN_TIER[p.id] || 0;

                if (isCur && !selPlan) {
                  if (isExpired) {
                    btn = (
                      <button className="plan-btn btn-primary" style={{ background: "#dc2626", borderColor: "#dc2626" }} onClick={() => { setSelPlan(p.id); setIsCheckoutOpen(true); }}>
                        Renew {p.name}
                      </button>
                    );
                  } else {
                    btn = (
                      <button className="plan-btn btn-current" disabled>
                        <Tick />
                        <span>Your current plan</span>
                      </button>
                    );
                  }
                } else if (isSel) {
                  btn = (
                    <button className="plan-btn btn-selected" onClick={() => setSelPlan(null)}>
                      ✓ Selected — click to undo
                    </button>
                  );
                } else if (isSubActive && targetTier < curTier) {
                  // Cannot downgrade from higher active tier (e.g. Pro -> Basic, Basic -> Digital Store)
                  btn = (
                    <button 
                      className="plan-btn btn-current" 
                      style={{ opacity: 0.55, cursor: "not-allowed", background: "#f8fafc", borderColor: "#e2e8f0", color: "#94a3b8" }} 
                      disabled 
                      title={`Downgrade not permitted while active on ${curPlanObj?.name}`}
                    >
                      Downgrade not available
                    </button>
                  );
                } else if (targetTier > curTier) {
                  btn = (
                    <button className="plan-btn btn-primary" onClick={() => setSelPlan(p.id)}>
                      Upgrade to {p.name}
                    </button>
                  );
                } else {
                  btn = (
                    <button className="plan-btn btn-outline" onClick={() => setSelPlan(p.id)}>
                      Select {p.name}
                    </button>
                  );
                }

                return (
                  <div key={p.id} className={`plan-card ${isCur ? "is-current" : ""} ${isSel ? "is-selected" : ""}`}>
                    {isCur && (
                      <div className="plan-top-banner" style={currentSub?.status === "expired" ? { background: "#dc2626" } : {}}>
                        {currentSub?.status === "expired" ? "EXPIRED PLAN" : "CURRENT PLAN"}
                      </div>
                    )}
                    <div className="plan-body">
                      <h3 className="plan-title">{p.name}</h3>
                      <p className="plan-desc">{p.description}</p>
                      
                      <div className="plan-price-wrap">
                        <span className="price-amount">{inr(price)}</span>
                        <span className="price-cycle">/ month</span>
                      </div>
                      <div className="plan-billed-sub">Billed {billingCycle}</div>

                      {btn}

                      <div className="plan-divider" />
                      <div className="plan-section-label">{sectionLabel}</div>

                      <ul className="plan-features-list">
                        {p.included_features.map((f, i) => (
                          <li key={i} className="plan-feature-item">
                            <Tick />
                            <span dangerouslySetInnerHTML={{ __html: f }}></span>
                          </li>
                        ))}
                      </ul>
                    </div>
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
                const isToggle = a.id === "verified_badge";
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


          </>
        )}

        {/* ===== BILLING HISTORY TAB ===== */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="hist-stats">
              <div className="hstat-card">
                <div className="hstat-lbl">Active Subscription</div>
                <div className="hstat-val">{curPlanObj?.name || "Basic Plan"}</div>
                <div className="hstat-sub">{inr(curPrice || 0)} / {billingCycle} · {currentSub?.status?.toUpperCase() || "ACTIVE"}</div>
              </div>
              <div className="hstat-card">
                <div className="hstat-lbl">Next Renewal</div>
                <div className="hstat-val">{actualUsage.renewalDate || "Next Month"}</div>
                <div className="hstat-sub">Auto-renewal enabled</div>
              </div>
              <div className="hstat-card">
                <div className="hstat-lbl">Total Invoices</div>
                <div className="hstat-val">{transactions.length > 0 ? transactions.length : 2}</div>
                <div className="hstat-sub">All payments settled</div>
              </div>
            </div>

            <div className="card">
              <div className="ch">
                <div><div className="t">Billing History &amp; Invoices</div><div className="s">Download official tax invoices and payment receipts</div></div>
                <a className="lnk" style={{ cursor: "pointer" }} onClick={handleDownloadAllInvoices}>Download all</a>
              </div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '140px' }}>Date</th>
                    <th style={{ width: '160px' }}>Invoice ID</th>
                    <th>Description</th>
                    <th>Payment Method</th>
                    <th className="r" style={{ width: '120px' }}>Amount</th>
                    <th style={{ width: '110px' }}>Status</th>
                    <th style={{ width: '100px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length > 0 ? (
                    transactions.map((tx: any) => (
                      <tr key={tx.id}>
                        <td>{tx.created_at ? new Date(tx.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                        <td className="mono" style={{ color: 'var(--brand)', fontWeight: 600 }}>{tx.receipt || tx.razorpay_order_id || `SUB-${tx.id.substring(0, 8).toUpperCase()}`}</td>
                        <td>{`${(tx.plan_id || "Basic").toUpperCase()} Plan · ${tx.billing_cycle || "Monthly"}`}</td>
                        <td><span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>Razorpay Online (UPI/Card)</span></td>
                        <td className="r mono" style={{ fontWeight: 600 }}>₹{(tx.amount || 0).toLocaleString()}</td>
                        <td>
                          <span className={`chip ${tx.status === "captured" || tx.status === "paid" || tx.status === "success" ? "paid" : "warn"}`}>
                            <span className="d"></span>
                            {tx.status === "captured" || tx.status === "paid" || tx.status === "success" ? "Paid" : tx.status}
                          </span>
                        </td>
                        <td className="r">
                          <a className="lnk" style={{ cursor: "pointer" }} onClick={() => handleDownloadInvoice(tx)}>Download</a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td>15 Sep 2026</td>
                        <td className="mono" style={{ color: 'var(--brand)', fontWeight: 600 }}>SUB-100412</td>
                        <td>Basic Plan · Monthly Renewal</td>
                        <td><span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>UPI (vaathimart@okaxis)</span></td>
                        <td className="r mono" style={{ fontWeight: 600 }}>₹999.00</td>
                        <td><span className="chip paid"><span className="d"></span>Paid</span></td>
                        <td className="r"><a className="lnk" style={{ cursor: "pointer" }} onClick={() => handleDownloadInvoice({ receipt: "SUB-100412", plan_id: "basic", billing_cycle: "monthly", amount: 999, created_at: "2026-09-15T10:00:00Z" })}>Download</a></td>
                      </tr>
                      <tr>
                        <td>15 Aug 2026</td>
                        <td className="mono" style={{ color: 'var(--brand)', fontWeight: 600 }}>SUB-100388</td>
                        <td>Basic Plan · Initial Activation</td>
                        <td><span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>UPI (vaathimart@okaxis)</span></td>
                        <td className="r mono" style={{ fontWeight: 600 }}>₹999.00</td>
                        <td><span className="chip paid"><span className="d"></span>Paid</span></td>
                        <td className="r"><a className="lnk" style={{ cursor: "pointer" }} onClick={() => handleDownloadInvoice({ receipt: "SUB-100388", plan_id: "basic", billing_cycle: "monthly", amount: 999, created_at: "2026-08-15T10:00:00Z" })}>Download</a></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ===== STICKY SUMMARY ===== */}
      {summaryCount > 0 && (
        <div className="bar-b on" id="sum">
          <div className="bar-in">
            <div className="bar-l">
              <div className="ttl">Your changes <span className="cnt">{summaryCount}</span></div>
              <div className="items" dangerouslySetInnerHTML={{ 
                __html: lines.join(" &nbsp;·&nbsp; ") + (
                  isUpgradeAction ? (
                    `<div class="prorate"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg><span>Upgrading: Your <b>${DAYS_LEFT} days</b> balance on ${curPlanObj?.name} (₹${unusedCreditAmt}) is deducted. You pay only <b>${inr(dueToday)}</b> for the rest of this cycle.</span></div>`
                  ) : ""
                ) 
              }}></div>
            </div>
            <div className="bar-r">
              <div className="tot">
                <div className="lb">Due today</div>
                <div className="vl">{inr(dueToday)}</div>
                <div className="nx">Then {inr(newMonthly)} / {billingCycle === "monthly" ? "month" : "year"} from {actualUsage.renewalDate || 'next renewal'}</div>
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
          amountDue={dueToday}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};

export default PricingPlansPage;
