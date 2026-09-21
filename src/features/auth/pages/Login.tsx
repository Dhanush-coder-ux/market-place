import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { authApi } from "@/services/api/auth";
import { useToast } from "@/context/ToastContext";
import {
  Phone,
  Lock,
  ArrowRight,
  Check,
  Copy,
  X,
  PhoneCall
} from "lucide-react";

const SUPPORT_NUMBERS = [
  {
    label: "Direct Technical Support",
    number: "+91 8248692839",
    raw: "+918248692839",
    desc: "Available for POS, counter, & live sync assistance"
  },
  {
    label: "Onboarding & Retail Setup",
    number: "+91 8883442378",
    raw: "+918883442378",
    desc: "New store onboarding, catalog, & hardware setup"
  },
  {
    label: "Billing & Account Assistance",
    number: "+91 8825773207",
    raw: "+918825773207",
    desc: "Invoicing, GST reports, & subscription queries"
  }
];

const SCENE_DURATION = 7000; // 7 seconds per scene

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [kpiValues, setKpiValues] = useState({
    revenue: "₹0",
    profit: "₹0",
    orders: "0",
    avgOrder: "₹0"
  });

  const { showToast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Number counting animation for Scene 1
  const animateKpis = useCallback(() => {
    const targets = { revenue: 482500, profit: 124300, orders: 186, avgOrder: 2594 };
    const startTime = performance.now();
    const duration = 900;

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      setKpiValues({
        revenue: "₹" + Math.round(targets.revenue * ease).toLocaleString("en-IN"),
        profit: "₹" + Math.round(targets.profit * ease).toLocaleString("en-IN"),
        orders: Math.round(targets.orders * ease).toString(),
        avgOrder: "₹" + Math.round(targets.avgOrder * ease).toLocaleString("en-IN")
      });

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }, []);

  const goToScene = useCallback((index: number) => {
    setCurrentScene(index);
    if (index === 0) {
      setTimeout(animateKpis, 100);
    }
  }, [animateKpis]);

  // Scene rotation timer
  useEffect(() => {
    if (currentScene === 0) {
      animateKpis();
    }
  }, [currentScene, animateKpis]);

  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentScene((prev) => (prev + 1) % 3);
    }, SCENE_DURATION);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, currentScene]);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const response = await authApi.getLoginUrl();
      const url = response?.signin_url || response?.url || response?.data?.signin_url || response?.data?.url;

      if (typeof url === "string" && url.startsWith("http")) {
        window.location.href = url;
      } else {
        console.error("Unexpected login URL response:", response);
        showToast("Invalid login URL received from server.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to initialize login. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDial = (rawNumber: string) => {
    window.location.href = `tel:${rawNumber}`;
  };

  const handleCopy = (num: string, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(num);
    setCopiedIndex(idx);
    showToast("Phone number copied to clipboard", "success");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans bg-slate-50 text-slate-800 selection:bg-blue-500/20">
      {/* =========================================================================
          INLINE STYLES FOR EXACT HTML ANIMATIONS & EFFECTS
          ========================================================================= */}
      <style>{`
        /* Showcase container & scene base */
        .showcase-root { position: relative; max-width: 520px; height: 300px; }
        .scene-item {
          position: absolute; inset: 0; opacity: 0; transform: translateY(10px);
          pointer-events: none; transition: opacity .55s ease, transform .55s ease;
        }
        .scene-item.on { opacity: 1; transform: none; pointer-events: auto; }

        /* Scene 1 Animations */
        .scene-item.on .dk-anim { animation: riseIn .5s ease forwards; animation-delay: var(--d); }
        .scene-item.on .trend-ln { animation: draw 1.5s cubic-bezier(.4,0,.2,1) forwards; }
        .scene-item.on .trend-ln.p2 { animation-delay: .25s; }
        .scene-item.on .trend-ar { animation: fadeIn .9s ease .75s forwards; }
        .scene-item.on .paysplit-b { width: var(--w) !important; transition-delay: 1.05s; }

        /* Scene 2 Animations */
        .scene-item.on .fc-anim { animation: riseIn .45s ease forwards; animation-delay: var(--d); }
        .scene-item.on .fc-pick { animation: riseIn .45s ease forwards, fcSel .5s ease 1.25s forwards; animation-delay: var(--d), 0s; }
        .scene-item.on .fc-pick .ripple-anim { animation: rip .7s ease 1.15s; }
        .scene-item.on .cursor-anim { animation: curMove 1.5s cubic-bezier(.4,0,.2,1) forwards; }
        .scene-item.on .fr-anim { animation: riseIn .4s ease forwards; animation-delay: var(--d); }
        .scene-item.on .fr-drop { animation: riseIn .4s ease forwards, collapse .5s ease 1.5s forwards; animation-delay: var(--d), 0s; }
        .scene-item.on .fr-keep { animation: riseIn .4s ease forwards, keepGlow .6s ease 1.6s; animation-delay: var(--d), 0s; }
        .scene-item.on .ffoot-anim { animation: fadeIn .5s ease 2.0s forwards; }

        /* Scene 3 Animations */
        .scene-item.on .mini-anim { animation: riseIn .55s cubic-bezier(.2,.8,.3,1) .1s forwards; }
        .scene-item.on .mcart-anim { animation: popIn .35s cubic-bezier(.2,.9,.3,1.4) 1.15s forwards; }
        .scene-item.on .mgrid-span { animation: popIn .35s cubic-bezier(.2,.9,.3,1.2) forwards; animation-delay: var(--d); }
        .scene-item.on .mgrid-span.tapped::after { animation: tapRing .6s ease .95s; }
        .scene-item.on .flow-pkt { animation: travel 1.1s ease-in-out 1.3s forwards; }
        .scene-item.on .ordcard-anim { animation: slideIn .5s cubic-bezier(.2,.8,.3,1) 2.0s forwards; }
        .scene-item.on .autochk-anim { animation: fadeIn .45s ease 2.55s forwards; }
        .scene-item.on .moneyrow-anim { animation: fadeIn .5s ease 2.9s forwards; }

        /* Keyframes */
        @keyframes riseIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: none; } }
        @keyframes popIn { from { opacity: 0; transform: scale(.7); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeIn { to { opacity: 1; } }
        @keyframes draw { to { stroke-dashoffset: 0; } }
        @keyframes fcSel { to { border-color: rgba(251,191,36,.75); background: rgba(251,191,36,.14); } }
        @keyframes rip { 0% { opacity: .55; box-shadow: 0 0 0 0 rgba(251,191,36,.6); } 100% { opacity: 0; box-shadow: 0 0 0 16px rgba(251,191,36,0); } }
        @keyframes curMove {
          0% { opacity: 0; transform: translate(96px, 74px); }
          25% { opacity: 1; }
          70% { opacity: 1; transform: translate(50px, 16px); }
          82% { transform: translate(50px, 16px) scale(.82); }
          100% { opacity: 0; transform: translate(50px, 16px); }
        }
        @keyframes collapse { to { opacity: 0; height: 0; padding-top: 0; padding-bottom: 0; margin-top: -6px; transform: translateX(-14px); } }
        @keyframes keepGlow { 0% { background: rgba(255,255,255,.05); } 45% { background: rgba(251,191,36,.18); } 100% { background: rgba(255,255,255,.05); } }
        @keyframes tapRing { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.5); } }
        @keyframes travel { 0% { opacity: 0; transform: translateX(-8px); } 20% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; transform: translateX(20px); } }

        /* Progress Bar on Dots */
        .showcase-dot.on i {
          animation: fillProgress 7s linear forwards;
        }
        .showcase-dots:hover .showcase-dot.on i {
          animation-play-state: paused;
        }
        @keyframes fillProgress { from { width: 0; } to { width: 100%; } }
      `}</style>

      {/* =========================================================================
          LEFT PANEL: RetailerPro Brand & Core Theme Blue Gradient Showcase
          ========================================================================= */}
      <aside
        className="w-full lg:w-[48%] xl:w-[46%] text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden shrink-0 shadow-2xl"
        style={{
          background: `
            radial-gradient(960px 540px at 6% 2%, #3B82F6 0%, transparent 54%),
            radial-gradient(800px 620px at 94% 98%, #1E3A8A 0%, transparent 58%),
            linear-gradient(158deg, #2563EB 0%, #1D4ED8 50%, #1E3A8A 100%)
          `
        }}
      >
        {/* Subtle grid texture watermark */}
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)",
            backgroundSize: "46px 46px",
            WebkitMaskImage: "radial-gradient(circle at 24% 12%, #000 0%, transparent 72%)"
          }}
        />

        {/* Antaris Star Watermark */}
        <div className="absolute -right-24 -bottom-20 w-[440px] h-[440px] opacity-[0.06] pointer-events-none select-none">
          <svg viewBox="0 0 100 100" fill="#fff">
            <path fillRule="evenodd" d="M50 2 Q54 22 60 35 L97 29 Q78 42 66 52 L79 96 Q62 82 50 74 Q38 82 21 96 L34 52 Q22 42 3 29 L40 35 Q46 22 50 2 Z M50 24 L59 67 L41 67 Z" />
          </svg>
        </div>

        {/* Top Header & Brand */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3.5">
            <span className="w-[47px] h-[47px] rounded-[13px] bg-white text-blue-600 grid place-items-center flex-none shadow-lg">
              <svg viewBox="0 0 100 100" className="w-7 h-7" aria-label="Antaris">
                <defs>
                  <linearGradient id="mg_logo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#1E3A8A" />
                  </linearGradient>
                </defs>
                <path
                  fill="url(#mg_logo)"
                  fillRule="evenodd"
                  d="M50 2 Q54 22 60 35 L97 29 Q78 42 66 52 L79 96 Q62 82 50 74 Q38 82 21 96 L34 52 Q22 42 3 29 L40 35 Q46 22 50 2 Z M50 24 L59 67 L41 67 Z"
                />
              </svg>
            </span>
            <div>
              <div className="font-bold text-[22px] tracking-[-0.025em] text-white flex items-baseline">
                <span>Reta</span>
                <span className="relative inline-block w-[0.42em] h-[1em]">
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[2.4px] h-[0.62em] bg-white rounded-[1px]" />
                  <svg viewBox="0 0 16 16" className="absolute left-1/2 -translate-x-1/2 -top-[0.31em] w-[0.46em] h-[0.46em]">
                    <path fill="#FBBF24" d="M8 0c0 4 4 8 8 8-4 0-8 4-8 8 0-4-4-8-8-8 4 0 8-4 8-8z" />
                  </svg>
                </span>
                <span>ler</span>
                <span className="text-amber-300">Pro</span>
              </div>
              <div className="text-[10.5px] text-blue-100/70 tracking-[0.13em] uppercase font-semibold mt-0.5">
                from Antaris Software
              </div>
            </div>
          </div>

          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.1em] uppercase text-amber-300 bg-white/10 border border-white/20 rounded-full px-3.5 py-1 backdrop-blur-sm">
            <span>COMPLETE BUSINESS SOLUTION FOR INDEPENDENT RETAILERS</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-3 max-w-[490px]">
            <h1 className="text-3xl sm:text-[34px] font-bold leading-[1.22] tracking-[-0.03em] text-white m-0">
              Everything you need to run your shop —{" "}
              <span className="text-amber-300">from anywhere.</span>
            </h1>
            <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1">
              <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-white/95">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" /> Run your store.
              </span>
              <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-white/95">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" /> Reach more customers.
              </span>
              <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-white/95">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" /> Grow your business.
              </span>
            </div>
          </div>
        </div>

        {/* ===== EXACT SHOWCASE CAROUSEL ===== */}
        <div
          className="relative z-10 my-7"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="showcase-root">
            {/* SCENE 1 : Dashboard */}
            <div className={`scene-item ${currentScene === 0 ? "on" : ""}`}>
              <div className="flex items-start gap-3 mb-3.5">
                <div className="w-[34px] h-[34px] rounded-[10px] bg-amber-400/20 border border-amber-300/30 grid place-items-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
                    <path d="M3 3v18h18" /><path d="m7 14 4-4 3 3 5-6" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-base text-white tracking-[-0.02em]">Know your numbers, daily</div>
                  <div className="text-[12.5px] text-blue-100/70 mt-0.5 leading-relaxed">Revenue, profit, margin and payments — calculated for you.</div>
                </div>
              </div>

              <div className="bg-white/10 border border-white/20 rounded-[15px] p-4 backdrop-blur-md">
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="dk-anim opacity-0 border-l-2 border-white/25 pl-2" style={{ "--d": ".08s" } as React.CSSProperties}>
                    <div className="font-semibold text-[15.5px] text-white tracking-tight leading-tight">{kpiValues.revenue}</div>
                    <div className="text-[9px] text-blue-100/60 mt-1 uppercase font-semibold tracking-wider">Net revenue</div>
                  </div>
                  <div className="dk-anim opacity-0 border-l-2 border-white/25 pl-2" style={{ "--d": ".18s" } as React.CSSProperties}>
                    <div className="font-semibold text-[15.5px] text-emerald-300 tracking-tight leading-tight">{kpiValues.profit}</div>
                    <div className="text-[9px] text-blue-100/60 mt-1 uppercase font-semibold tracking-wider">Total profit</div>
                  </div>
                  <div className="dk-anim opacity-0 border-l-2 border-white/25 pl-2" style={{ "--d": ".28s" } as React.CSSProperties}>
                    <div className="font-semibold text-[15.5px] text-white tracking-tight leading-tight">{kpiValues.orders}</div>
                    <div className="text-[9px] text-blue-100/60 mt-1 uppercase font-semibold tracking-wider">Orders</div>
                  </div>
                  <div className="dk-anim opacity-0 border-l-2 border-white/25 pl-2" style={{ "--d": ".38s" } as React.CSSProperties}>
                    <div className="font-semibold text-[15.5px] text-amber-300 tracking-tight leading-tight">{kpiValues.avgOrder}</div>
                    <div className="text-[9px] text-blue-100/60 mt-1 uppercase font-semibold tracking-wider">Avg. order</div>
                  </div>
                </div>

                {/* Animated Chart SVG */}
                <div className="relative h-24 mb-2.5">
                  <svg viewBox="0 0 300 96" preserveAspectRatio="none" className="w-full h-full block overflow-visible">
                    <defs>
                      <linearGradient id="revfill_chart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="24" x2="300" y2="24" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <line x1="0" y1="52" x2="300" y2="52" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <line x1="0" y1="80" x2="300" y2="80" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <path className="trend-ar opacity-0" fill="url(#revfill_chart)" d="M0,70 L50,58 L100,63 L150,40 L200,45 L250,24 L300,12 L300,96 L0,96 Z" />
                    <path
                      className="trend-ln fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round"
                      style={{ strokeDasharray: 420, strokeDashoffset: 420 }}
                      stroke="#FDE68A"
                      d="M0,70 L50,58 L100,63 L150,40 L200,45 L250,24 L300,12"
                    />
                    <path
                      className="trend-ln p2 fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round"
                      style={{ strokeDasharray: 420, strokeDashoffset: 420 }}
                      stroke="#7EE2A8"
                      d="M0,84 L50,79 L100,81 L150,68 L200,71 L250,58 L300,50"
                    />
                  </svg>
                </div>

                <div className="flex items-center gap-3.5 -mt-1 text-[10px] text-blue-100/70 font-semibold">
                  <span className="flex items-center gap-1.5"><i className="w-3.5 h-[2.5px] rounded bg-amber-300 block" />Revenue</span>
                  <span className="flex items-center gap-1.5"><i className="w-3.5 h-[2.5px] rounded bg-[#7EE2A8] block" />Profit</span>
                  <span className="ml-auto text-blue-100/60">Gross margin 25.8%</span>
                </div>

                {/* Animated Payment Split Bar */}
                <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5 mt-2.5 mb-1.5">
                  <b className="paysplit-b block h-full rounded-l-full transition-all duration-700" style={{ "--w": "62%", width: 0, background: "#93C5FD" } as React.CSSProperties} />
                  <b className="paysplit-b block h-full transition-all duration-700" style={{ "--w": "28%", width: 0, background: "#7EE2A8" } as React.CSSProperties} />
                  <b className="paysplit-b block h-full rounded-r-full transition-all duration-700" style={{ "--w": "10%", width: 0, background: "#DDD6FE" } as React.CSSProperties} />
                </div>
                <div className="flex gap-3 text-[9.5px] text-blue-100/60 font-semibold">
                  <span className="flex items-center gap-1"><i className="w-1.5 h-1.5 rounded-full bg-[#93C5FD] block" />UPI 62%</span>
                  <span className="flex items-center gap-1"><i className="w-1.5 h-1.5 rounded-full bg-[#7EE2A8] block" />Cash 28%</span>
                  <span className="flex items-center gap-1"><i className="w-1.5 h-1.5 rounded-full bg-[#DDD6FE] block" />Card 10%</span>
                </div>
              </div>
            </div>

            {/* SCENE 2 : Instant Filtering */}
            <div className={`scene-item ${currentScene === 1 ? "on" : ""}`}>
              <div className="flex items-start gap-3 mb-3.5">
                <div className="w-[34px] h-[34px] rounded-[10px] bg-amber-400/20 border border-amber-300/30 grid place-items-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
                    <polygon points="22 3 2 3 10 12.5 10 19 14 21 14 12.5 22 3" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-base text-white tracking-[-0.02em]">Answers in one click</div>
                  <div className="text-[12.5px] text-blue-100/70 mt-0.5 leading-relaxed">Low stock, unpaid bills, overdue customers — instantly filtered.</div>
                </div>
              </div>

              <div className="bg-white/10 border border-white/20 rounded-[15px] p-3.5 relative overflow-hidden backdrop-blur-md">
                {/* Moving pointer cursor */}
                <span className="cursor-anim absolute w-[17px] h-[17px] left-0 top-0 opacity-0 pointer-events-none z-10">
                  <svg viewBox="0 0 24 24" fill="#fff" className="w-full h-full drop-shadow-md">
                    <path d="M5 2l14 9-6 1.3 3.2 6.4-2.6 1.3L10.4 14 5 18.6z" />
                  </svg>
                </span>

                <div className="grid grid-cols-3 gap-2 mb-2.5">
                  <div className="fc-anim relative border-[1.5px] border-white/20 bg-white/[0.06] rounded-[10px] p-2 opacity-0" style={{ "--d": ".08s" } as React.CSSProperties}>
                    <div className="font-semibold text-[17px] text-white leading-none">248</div>
                    <div className="text-[9px] text-blue-100/60 mt-1 uppercase font-semibold tracking-wider">All products</div>
                  </div>
                  <div className="fc-pick relative border-[1.5px] border-white/20 bg-white/[0.06] rounded-[10px] p-2 opacity-0" style={{ "--d": ".18s" } as React.CSSProperties}>
                    <span className="ripple-anim absolute inset-0 rounded-[10px] pointer-events-none opacity-0" />
                    <div className="font-semibold text-[17px] text-amber-300 leading-none">12</div>
                    <div className="text-[9px] text-blue-100/60 mt-1 uppercase font-semibold tracking-wider">Low stock</div>
                  </div>
                  <div className="fc-anim relative border-[1.5px] border-white/20 bg-white/[0.06] rounded-[10px] p-2 opacity-0" style={{ "--d": ".28s" } as React.CSSProperties}>
                    <div className="font-semibold text-[17px] text-white leading-none">3</div>
                    <div className="text-[9px] text-blue-100/60 mt-1 uppercase font-semibold tracking-wider">Out of stock</div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 min-h-[96px]">
                  <div className="fr-drop flex items-center gap-2 text-[11.5px] py-1.5 px-2.5 rounded-lg bg-white/[0.06] opacity-0 overflow-hidden" style={{ "--d": ".38s" } as React.CSSProperties}>
                    <span className="flex-1 text-white/90 truncate">Bluetooth headphone</span>
                    <span className="text-[8.5px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#7EE2A8]">IN STOCK</span>
                    <span className="font-mono font-semibold text-white text-[12.5px]">36</span>
                  </div>
                  <div className="fr-keep flex items-center gap-2 text-[11.5px] py-1.5 px-2.5 rounded-lg bg-white/[0.06] opacity-0" style={{ "--d": ".46s" } as React.CSSProperties}>
                    <span className="flex-1 text-white/90 truncate">Cotton Kurta — M</span>
                    <span className="text-[8.5px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300">LOW</span>
                    <span className="font-mono font-semibold text-white text-[12.5px]">3</span>
                  </div>
                  <div className="fr-drop flex items-center gap-2 text-[11.5px] py-1.5 px-2.5 rounded-lg bg-white/[0.06] opacity-0 overflow-hidden" style={{ "--d": ".54s" } as React.CSSProperties}>
                    <span className="flex-1 text-white/90 truncate">Basmati Rice 5kg</span>
                    <span className="text-[8.5px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#7EE2A8]">IN STOCK</span>
                    <span className="font-mono font-semibold text-white text-[12.5px]">48</span>
                  </div>
                  <div className="fr-keep flex items-center gap-2 text-[11.5px] py-1.5 px-2.5 rounded-lg bg-white/[0.06] opacity-0" style={{ "--d": ".62s" } as React.CSSProperties}>
                    <span className="flex-1 text-white/90 truncate">Masala Chai 250g</span>
                    <span className="text-[8.5px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300">LOW</span>
                    <span className="font-mono font-semibold text-white text-[12.5px]">4</span>
                  </div>
                </div>

                <div className="ffoot-anim flex items-center gap-2 text-[10.5px] text-blue-100/70 pt-2 border-t border-white/10 opacity-0 mt-1">
                  <span className="bg-amber-400/25 text-amber-300 px-2 py-0.5 rounded-full font-bold text-[9px] tracking-wider">FILTERED</span>
                  <span>Showing <b className="text-amber-300">12</b> of 248 products that need restocking</span>
                </div>
              </div>
            </div>

            {/* SCENE 3 : Digital Store Order Loop */}
            <div className={`scene-item ${currentScene === 2 ? "on" : ""}`}>
              <div className="flex items-start gap-3 mb-3.5">
                <div className="w-[34px] h-[34px] rounded-[10px] bg-amber-400/20 border border-amber-300/30 grid place-items-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-base text-white tracking-[-0.02em]">Your shop sells while you sleep</div>
                  <div className="text-[12.5px] text-blue-100/70 mt-0.5 leading-relaxed">Customers order from your store — you keep every rupee.</div>
                </div>
              </div>

              <div className="bg-white/10 border border-white/20 rounded-[15px] p-4 backdrop-blur-md">
                <div className="flex items-stretch gap-3 mb-3">
                  {/* Mini Digital Store Mock */}
                  <div className="mini-anim w-24 shrink-0 rounded-[11px] bg-white/15 border border-white/20 p-2 opacity-0" style={{ transform: "translateY(14px)" }}>
                    <div className="flex items-center gap-1 mb-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                      <span className="text-[8.5px] font-bold text-white flex-1 truncate">Vaathi Mart</span>
                      <span className="mcart-anim text-[8px] font-black text-slate-950 bg-amber-400 rounded-full px-1.5 opacity-0">2</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <span className="mgrid-span h-5 rounded bg-white/20 block opacity-0" style={{ "--d": ".28s" } as React.CSSProperties} />
                      <span className="mgrid-span tapped h-5 rounded bg-white/20 block opacity-0 relative" style={{ "--d": ".36s" } as React.CSSProperties} />
                      <span className="mgrid-span h-5 rounded bg-white/20 block opacity-0" style={{ "--d": ".44s" } as React.CSSProperties} />
                      <span className="mgrid-span h-5 rounded bg-white/20 block opacity-0" style={{ "--d": ".52s" } as React.CSSProperties} />
                    </div>
                  </div>

                  {/* Flow Arrow */}
                  <div className="shrink-0 w-6 flex items-center justify-center relative">
                    <svg viewBox="0 0 26 12" className="w-6 h-3 overflow-visible">
                      <path d="M1 6 H25" stroke="rgba(251,191,36,.6)" strokeWidth="1.6" strokeDasharray="3 3" fill="none" />
                      <circle className="flow-pkt" cx="4" cy="6" r="2.6" fill="#FBBF24" opacity="0" />
                    </svg>
                  </div>

                  {/* Order Received Card */}
                  <div className="flex-1 flex flex-col justify-center gap-2 min-w-0">
                    <div className="ordcard-anim bg-emerald-500/20 border border-[#7EE2A8]/30 rounded-[10px] p-2 opacity-0">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#7EE2A8] tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" /> NEW ORDER RECEIVED
                      </div>
                      <div className="text-[12px] text-white mt-0.5 font-mono font-semibold">3 items · ₹640</div>
                    </div>
                    <div className="autochk-anim flex items-center gap-1.5 text-[10.5px] text-blue-100/70 opacity-0">
                      <Check size={13} className="text-[#7EE2A8] shrink-0" strokeWidth={2.6} />
                      <span>Stock and billing updated automatically</span>
                    </div>
                  </div>
                </div>

                {/* Profit Comparison Footer */}
                <div className="moneyrow-anim flex items-center gap-3 pt-2.5 border-t border-white/10 opacity-0">
                  <div className="flex-1">
                    <div className="font-semibold text-[19px] text-[#7EE2A8] leading-tight">₹640</div>
                    <div className="text-[9.5px] text-blue-100/60 uppercase font-semibold tracking-wider">You receive</div>
                  </div>
                  <div className="flex-1 opacity-60">
                    <div className="font-semibold text-[19px] text-white/60 leading-tight line-through">₹448</div>
                    <div className="text-[9.5px] text-blue-100/50 uppercase font-semibold tracking-wider">On marketplaces</div>
                  </div>
                  <span className="text-[10px] font-black tracking-wider text-slate-950 bg-amber-400 px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
                    0% COMMISSION
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Progress Indicator Dots */}
          <div className="showcase-dots flex items-center gap-2 pt-3">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goToScene(idx)}
                className={`showcase-dot h-2 rounded-full overflow-hidden relative transition-all duration-300 ${
                  currentScene === idx ? "on w-8 bg-white/25" : "w-2 bg-white/25 hover:bg-white/45"
                }`}
                aria-label={`Go to scene ${idx + 1}`}
              >
                <i className="absolute inset-0 w-0 bg-amber-300 rounded-full block" />
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="relative z-10 pt-4 border-t border-white/15 flex flex-wrap gap-2.5 mt-auto">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-white/85 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 backdrop-blur-sm">
            <span className="text-amber-300 font-bold">₹</span> Zero commission on orders
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-white/85 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 backdrop-blur-sm">
            <Check size={13} className="text-emerald-300" /> GST-ready invoicing
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-white/85 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-blue-200">
              <rect x="5" y="2" width="14" height="20" rx="2.5" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
            Works on any device
          </span>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT PANEL: Clean Direct Sign-In & Support Section
          ========================================================================= */}
      <main className="flex-1 bg-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between items-center overflow-y-auto">
        <div className="w-full max-w-[392px] my-auto space-y-7">
          {/* Header */}
          <div className="space-y-1.5">
            <h2 className="text-[26px] font-bold text-slate-900 tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-[13.5px] text-slate-500">
              Welcome back. Enter your details to continue.
            </p>
          </div>

          {/* Main Action Hook Card */}
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold shrink-0">
                <Lock size={19} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Secure Store Access</h3>
                <p className="text-xs text-slate-500">Single Sign-On with verified email or mobile OTP</p>
              </div>
            </div>

            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 text-white font-semibold text-[14.5px] flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none group"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                  <span>Connecting to Portal…</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            <p className="text-[11.5px] text-center text-slate-500 leading-relaxed">
              By signing in, you agree to our{" "}
              <Link to="/terms" className="text-blue-600 font-semibold hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-blue-600 font-semibold hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          {/* NEED HELP? Section */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase text-center flex items-center gap-3.5 before:flex-1 before:h-px before:bg-slate-200 after:flex-1 after:h-px after:bg-slate-200">
              NEED HELP?
            </div>

            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-sm hover:border-slate-300 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Phone size={17} />
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-slate-900">Talk to support</h4>
                  <p className="text-[11.5px] text-slate-500">Monday – Saturday, 9am – 8pm IST</p>
                </div>
              </div>

              <button
                onClick={() => setShowSupportModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 shadow-sm transition-all active:scale-95"
              >
                Contact us
              </button>
            </div>

            <div className="text-center pt-1">
              <span className="text-xs text-slate-500">New to RetailerPro? </span>
              <button
                onClick={() => setShowSupportModal(true)}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Request a demo
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full max-w-xl pt-6 text-center space-y-2 border-t border-slate-100 mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11.5px] text-slate-500">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <svg viewBox="0 0 100 100" fill="currentColor" className="w-3.5 h-3.5 text-amber-500">
                <path fillRule="evenodd" d="M50 2 Q54 22 60 35 L97 29 Q78 42 66 52 L79 96 Q62 82 50 74 Q38 82 21 96 L34 52 Q22 42 3 29 L40 35 Q46 22 50 2 Z M50 24 L59 67 L41 67 Z" />
              </svg>
              © 2026 Antaris Software Pvt Ltd. All rights reserved.
            </span>
            <div className="flex items-center gap-4 font-medium">
              <Link to="/terms" className="hover:text-blue-600 transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="hover:text-blue-600 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/security" className="hover:text-blue-600 transition-colors">
                Security
              </Link>
            </div>
          </div>
          <p className="text-[11.5px] text-slate-400 text-center leading-relaxed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-emerald-500 inline-block mr-1.5 -translate-y-px">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            Your business data is encrypted in transit and at rest. RetailerPro is a product of Antaris Software Pvt Ltd, India.
          </p>
        </div>
      </main>

      {/* =========================================================================
          CONTACT SUPPORT / PHONE DIALER MODAL
          ========================================================================= */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6">
            <button
              onClick={() => setShowSupportModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <X size={18} />
            </button>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold mb-3">
                <PhoneCall size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Contact RetailerPro Support</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Choose a direct line to connect with our retail specialists. Tapping a number opens your device dialer automatically.
              </p>
            </div>

            <div className="space-y-3">
              {SUPPORT_NUMBERS.map((item, idx) => (
                <div
                  key={item.raw}
                  onClick={() => handleDial(item.raw)}
                  className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">
                      {item.label}
                    </span>
                    <div className="text-base font-bold text-slate-900 font-mono tracking-tight group-hover:text-blue-600 transition-colors">
                      {item.number}
                    </div>
                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => handleCopy(item.number, idx, e)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-all"
                      title="Copy number"
                    >
                      {copiedIndex === idx ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                    <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                      <Phone size={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center">
              <p className="text-xs text-slate-500">
                Support Hours: <strong className="text-slate-700">Mon – Sat, 9:00 AM – 8:00 PM IST</strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
