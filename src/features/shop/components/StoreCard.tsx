import { useState} from "react";
export  interface ShopInfo {
  shopName?: string;
}

export interface StoreCardProps {
  setShowInfo: React.Dispatch<React.SetStateAction<boolean>>;
  shopInfo?: ShopInfo;
}

export interface AppProps {
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  shopInfo?: ShopInfo;
}

const StoreCard = ({
  setShowInfo,
  shopInfo,
}: StoreCardProps) => {
  const [doorOpen, setDoorOpen] = useState(false);
  



  const shopLabel = shopInfo?.shopName ?? "My Store";

  return (
    <div className="flex justify-center items-center  select-none" onClick={()=>setShowInfo(true)}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;600;700;800&display=swap');

        @keyframes bulbGlow {
          0%,100%{ box-shadow:0 0 5px 2px #fde68a,0 0 12px 3px #fbbf24; }
          50%    { box-shadow:0 0 9px 4px #fde68a,0 0 20px 7px #f59e0b; }
        }
        @keyframes signSwing {
          0%,100%{ transform:rotate(-1.5deg); }
          50%    { transform:rotate(1.5deg);  }
        }
        @keyframes doorSwing {
          from{ transform:perspective(700px) rotateY(0deg);   }
          to  { transform:perspective(700px) rotateY(-72deg); }
        }
        @keyframes doorSwingBack {
          from{ transform:perspective(700px) rotateY(-72deg); }
          to  { transform:perspective(700px) rotateY(0deg);   }
        }
        @keyframes sunPulseAnim {
          0%,100%{ box-shadow:0 0 18px 7px #fde04760,0 0 36px 14px #fbbf2430; }
          50%    { box-shadow:0 0 28px 12px #fde04790,0 0 55px 24px #fbbf2450; }
        }
        @keyframes flagWave {
          0%,100%{ transform:skewY(0deg) scaleX(1);    }
          33%    { transform:skewY(2deg)  scaleX(0.96); }
          66%    { transform:skewY(-2deg) scaleX(0.98); }
        }
        @keyframes birdFly {
          0%  { transform:translate(0,0);    opacity:0; }
          5%  { opacity:1; }
          90% { opacity:1; }
          100%{ transform:translate(60px,-8px); opacity:0; }
        }

        .bulb       { animation:bulbGlow    2s ease-in-out infinite; }
        .sign-swing { animation:signSwing   3s ease-in-out infinite; transform-origin:top center; }
        .door-open  { animation:doorSwing     0.5s ease-out forwards; transform-origin:left center; }
        .door-close { animation:doorSwingBack 0.5s ease-in  forwards; transform-origin:left center; }
        .sun-glow   { animation:sunPulseAnim 2.5s ease-in-out infinite; }
        .flag-wave  { animation:flagWave 2.2s ease-in-out infinite; transform-origin:left center; }
        .bird       { animation:birdFly 8s ease-in-out infinite; }

        .blue-brick {
          background-color:#1d4ed8;
          background-image:
            repeating-linear-gradient(0deg, transparent,transparent 17px,rgba(0,0,0,0.18) 17px,rgba(0,0,0,0.18) 19px),
            repeating-linear-gradient(90deg,transparent,transparent 37px,rgba(0,0,0,0.10) 37px,rgba(0,0,0,0.10) 39px);
          position:relative;
        }
        .glass-pane {
          background:linear-gradient(135deg,
            rgba(186,230,253,0.55) 0%,rgba(224,242,254,0.75) 40%,
            rgba(186,230,253,0.4) 70%,rgba(255,255,255,0.6) 100%
          );
        }
        .awning-stripe {
          background:repeating-linear-gradient(90deg,
            #2563eb 0px,#2563eb 22px,
            #f1f5f9 22px,#f1f5f9 44px
          );
        }
      `}</style>

      <div
        className="relative cursor-pointer"
        style={{ width:370, fontFamily:"'DM Sans',sans-serif" }}
        onMouseEnter={() => setDoorOpen(true)}
        onMouseLeave={() => setDoorOpen(false)}
        onClick={() => setShowInfo(true)}
      >
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-72 h-5 bg-black/25 blur-xl rounded-full z-0" />

        <div className="flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-blue-900/20 relative z-10"
             style={{ height:520 }}>

          

          {/* REAL TILE ROOF */}
          <div className="shrink-0 relative overflow-visible" style={{ background:"#1e3a5f" }}>

            {/* Flag pole */}
            <div className="absolute right-14 -top-10 flex flex-col items-center z-30" style={{ zIndex:30 }}>
              <div style={{ width:2, height:42, background:"linear-gradient(180deg,#cbd5e1,#94a3b8)" }} />
              <div className="flag-wave absolute"
                   style={{ width:30, height:18, top:0, left:3,
                            background:"linear-gradient(90deg,#ef4444,#dc2626)",
                            borderRadius:"0 4px 4px 0", boxShadow:"1px 1px 4px rgba(0,0,0,0.3)" }}>
                <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(180deg,transparent,transparent 5px,rgba(255,255,255,0.15) 5px,rgba(255,255,255,0.15) 6px)", borderRadius:"0 4px 4px 0" }} />
              </div>
            </div>

            {/* Ridge cap */}
            <div className="w-full flex items-center justify-between"
                 style={{ height:16, background:"linear-gradient(180deg,#fde68a 0%,#f59e0b 100%)", boxShadow:"0 2px 4px rgba(0,0,0,0.3)" }}>
              {/* Ridge end caps */}
              <div className="w-8 h-full flex items-center justify-center" style={{ background:"linear-gradient(90deg,#f59e0b,#fbbf24)" }}>
                <div style={{ width:18, height:18, borderRadius:"50%", border:"2px solid #b45309", background:"linear-gradient(135deg,#fde68a,#f59e0b)" }} />
              </div>
              {/* Decorative ridge pattern */}
              <div className="flex gap-1 flex-1 justify-center">
                {[...Array(8)].map((_,i) => (
                  <div key={i} style={{ width:6, height:8, background:"rgba(0,0,0,0.12)", borderRadius:"0 0 3px 3px" }} />
                ))}
              </div>
              <div className="w-8 h-full flex items-center justify-center" style={{ background:"linear-gradient(270deg,#f59e0b,#fbbf24)" }}>
                <div style={{ width:18, height:18, borderRadius:"50%", border:"2px solid #b45309", background:"linear-gradient(135deg,#fde68a,#f59e0b)" }} />
              </div>
            </div>

            {/* Row 1 — first tile course (widest) */}
            {[
              { color:"#1e3a8a", dark:"#172554", highlight:"rgba(255,255,255,0.12)", count:11, offset:false },
              { color:"#1d4ed8", dark:"#1e40af", highlight:"rgba(255,255,255,0.10)", count:10, offset:true  },
              { color:"#2563eb", dark:"#1d4ed8", highlight:"rgba(255,255,255,0.08)", count:9,  offset:false },
            ].map((row, ri) => (
              <div key={ri} className="flex" style={{ marginTop: ri===0 ? 0 : -5, position:"relative" }}>
                {row.offset && <div style={{ width:`${100/(row.count*2)}%` }} />}
                {[...Array(row.count)].map((_,i) => (
                  <div key={i} style={{
                    flex:1, height:18,
                    background:`linear-gradient(180deg,${row.highlight} 0%,${row.color} 30%,${row.dark} 100%)`,
                    borderRadius:"0 0 50% 50%",
                    borderBottom:`2px solid rgba(0,0,0,0.25)`,
                    borderRight:`0.5px solid rgba(0,0,0,0.12)`,
                    boxShadow:`inset 0 2px 3px ${row.highlight}, 0 2px 3px rgba(0,0,0,0.2)`,
                  }} />
                ))}
              </div>
            ))}

            {/* Fascia board with dentils */}
            <div className="w-full flex items-center"
                 style={{ height:14, background:"linear-gradient(180deg,#fbbf24,#f59e0b)", boxShadow:"0 3px 8px rgba(0,0,0,0.4)" }}>
              <div className="flex justify-around flex-1 h-full px-1">
                {[...Array(18)].map((_,i) => (
                  <div key={i} style={{ width:8, height:"85%", alignSelf:"flex-end", background:"rgba(0,0,0,0.18)", borderRadius:"2px 2px 0 0" }} />
                ))}
              </div>
            </div>
          </div>

          {/* AWNING */}
          <div className="shrink-0 relative z-10">
            <div className="awning-stripe h-7 shadow-md" />
            <div className="flex">
              {[...Array(9)].map((_,i) => (
                <div key={i} className="flex-1 h-5 rounded-b-full"
                     style={{ background:i%2===0?"#2563eb":"#f8fafc", borderBottom:"2px solid #1d4ed8",
                              boxShadow:"inset 0 -2px 4px rgba(0,0,0,0.12)" }} />
              ))}
            </div>

            {/* Hanging sign */}
            <div className="absolute -bottom-11 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
              <div className="flex gap-6 mb-0.5">
                <div className="w-px h-3 rounded-full" style={{ background:"#78350f" }} />
                <div className="w-px h-3 rounded-full" style={{ background:"#78350f" }} />
              </div>
              <div className="sign-swing px-5 py-1.5 rounded-lg border-2 shadow-lg"
                   style={{ background:"linear-gradient(135deg,#fbbf24,#f59e0b,#fbbf24)", borderColor:"#b45309",  }}>
                <span className="font-semibold  text-sm uppercase text-white whitespace-nowrap"
                      >
                  {shopLabel.length > 15 ? shopLabel.slice(0,15)+"…" : shopLabel}
                </span>
              </div>
            </div>
          </div>

          {/* BLUE BRICK WALL */}
          <div className="blue-brick flex-1 flex flex-col pt-14">
            {/* Bulb string */}
            <div className="flex justify-around items-center px-3 py-1 relative">
              <div className="absolute inset-x-3 top-3 border-t" style={{ borderColor:"rgba(255,255,255,0.15)" }} />
              {[...Array(7)].map((_,i) => (
                <div key={i} className="flex flex-col items-center gap-0.5 z-10">
                  <div className="w-px h-2" style={{ background:"rgba(255,255,255,0.3)" }} />
                  <div className="bulb w-2.5 h-2.5 rounded-full border border-yellow-300"
                       style={{ background:"#fde68a", animationDelay:`${i*0.28}s` }} />
                </div>
              ))}
            </div>

            {/* Windows + Door */}
            <div className="flex-1 flex items-end gap-2 px-4 pb-0">
              {/* Left window */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-32 rounded-t-lg overflow-hidden relative border-4"
                     style={{ background:"#0f172a", borderColor:"#fbbf24", boxShadow:"0 0 0 2px #1e40af" }}>
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px p-1.5">
                    {[...Array(4)].map((_,i) => <div key={i} className="glass-pane rounded-sm" />)}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5" style={{ background:"rgba(251,191,36,0.5)" }} />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-full w-0.5" style={{ background:"rgba(251,191,36,0.5)" }} />
                  </div>
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[7px] font-black whitespace-nowrap"
                       style={{ background:"#fbbf24", color:"#1e3a8a" }}>SALE 25% OFF</div>
                </div>
                <div className="w-28 h-2.5 rounded-sm" style={{ background:"linear-gradient(180deg,#fbbf24,#f59e0b)" }} />
                <div className="w-32 h-1.5 rounded-sm" style={{ background:"#1e3a8a" }} />
              </div>

              {/* Door */}
              <div className="flex flex-col items-center flex-1 relative">
                <div className="relative"
                     style={{ width:90, height:150, border:"4px solid #fbbf24", borderRadius:"14px 14px 0 0",
                              background:"#020617", boxShadow:"0 0 0 3px #1e40af, inset 0 0 20px rgba(0,0,0,0.8)" }}>
                  {/* Interior */}
                  <div className="absolute inset-0 rounded-t-xl overflow-hidden"
                       style={{ background:"linear-gradient(180deg,#0c0a00,#1a0f00 60%,#0a0500)" }}>
                    <div className="absolute inset-0" style={{ background:"radial-gradient(ellipse at 50% 85%,rgba(251,146,60,0.35) 0%,transparent 65%)" }} />
                    <div className="absolute bottom-8 inset-x-3 h-px bg-amber-900/60" />
                    <div className="absolute bottom-9 flex gap-1 left-3">
                      {["#3b82f6","#ef4444","#22c55e","#f59e0b"].map((c,i) => (
                        <div key={i} className="rounded-sm" style={{ width:7, height:14, background:c, opacity:0.65 }} />
                      ))}
                    </div>
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full"
                         style={{ background:"rgba(251,191,36,0.4)", boxShadow:"0 0 10px 4px rgba(251,191,36,0.3)" }} />
                  </div>

                  {/* Door panel */}
                  <div className={doorOpen ? "door-open" : "door-close"}
                       style={{ position:"absolute", inset:0, borderRadius:"10px 10px 0 0",
                                background:"linear-gradient(180deg,#1e3a8a 0%,#1e40af 40%,#1d4ed8 100%)",
                                transformOrigin:"left center", zIndex:10 }}>
                    <div className="absolute inset-x-2 top-2 h-16 rounded-xl border-2" style={{ borderColor:"rgba(251,191,36,0.3)" }}>
                      <div className="glass-pane absolute inset-1 rounded-lg" />
                    </div>
                    <div className="absolute inset-x-2 top-20 bottom-6 rounded border" style={{ borderColor:"rgba(255,255,255,0.1)" }} />
                    <div className="absolute right-2.5 top-1/2 w-3 h-3 rounded-full border-2"
                         style={{ background:"linear-gradient(135deg,#fde68a,#f59e0b)", borderColor:"#b45309", boxShadow:"0 1px 4px rgba(0,0,0,0.5)" }} />
                    <div className="absolute bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[7px] font-black tracking-widest"
                         style={{ background:"#16a34a", color:"white" }}>OPEN</div>
                  </div>
                </div>
                <div className="h-3 rounded-sm" style={{ width:96, background:"linear-gradient(180deg,#94a3b8,#64748b)" }} />
                <div className="h-2 rounded-sm" style={{ width:112, background:"linear-gradient(180deg,#64748b,#475569)" }} />
                <div className="h-1.5 rounded-sm" style={{ width:128, background:"#334155" }} />
              </div>

              {/* Right window */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-32 rounded-t-lg overflow-hidden relative border-4"
                     style={{ background:"#0f172a", borderColor:"#fbbf24", boxShadow:"0 0 0 2px #1e40af" }}>
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px p-1.5">
                    {[...Array(4)].map((_,i) => <div key={i} className="glass-pane rounded-sm" />)}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5" style={{ background:"rgba(251,191,36,0.5)" }} />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-full w-0.5" style={{ background:"rgba(251,191,36,0.5)" }} />
                  </div>
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[7px] font-black whitespace-nowrap"
                       style={{ background:"#dbeafe", color:"#1e40af" }}>NEW ARRIVALS</div>
                </div>
                <div className="w-28 h-2.5 rounded-sm" style={{ background:"linear-gradient(180deg,#fbbf24,#f59e0b)" }} />
                <div className="w-32 h-1.5 rounded-sm" style={{ background:"#1e3a8a" }} />
              </div>
            </div>

            {/* Pavement */}
            <div className="shrink-0 relative flex items-center px-4" style={{ height:36, background:"linear-gradient(180deg,#64748b,#475569)" }}>
              {[...Array(7)].map((_,i) => (
                <div key={i} className="flex-1 h-full border-r" style={{ borderColor:"rgba(255,255,255,0.05)" }} />
              ))}
              <span className="absolute left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-widest uppercase"
                    style={{ color:"rgba(255,255,255,0.3)" }}>
                hover · click for info
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App({
  setShow,
  shopInfo,
}: AppProps) {
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <StoreCard setShowInfo={setShow} shopInfo={shopInfo} />
    </div>
  );
}