import { useState, ReactNode, CSSProperties, useEffect } from "react";
import { Clock, MapPin, Star, Store, Sun } from "lucide-react";
import App from "../components/StoreCard";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
export interface CloudProps {
  className?: string;
  style?: CSSProperties;
  size?: number;
}

export interface SkyLayoutProps {
  children: ReactNode;
}

export interface ShopInfo {
  shopName: string;
  shopDescription: string;
  location: string;
  operatingHours: string;
  rating: number;
}
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

  @keyframes cloudDrift1 { from{transform:translateX(-150px)} to{transform:translateX(100vw)} }
  @keyframes cloudDrift2 { from{transform:translateX(-100px)} to{transform:translateX(100vw)} }
  @keyframes birdFly     { 0%{transform:translate(0,0)} 50%{transform:translate(40vw,-20px)} 100%{transform:translate(100vw,10px)} }
  @keyframes sunPulse    { 0%,100%{box-shadow:0 0 20px 8px #fde04760} 50%{box-shadow:0 0 40px 18px #fde04790} }
  @keyframes titleReveal { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

  .cloud1 { animation: cloudDrift1 35s linear infinite; }
  .cloud2 { animation: cloudDrift2 45s linear infinite 10s; }
  .bird1  { animation: birdFly 25s ease-in-out infinite; }
  .sun-pulse { animation: sunPulse 4s ease-in-out infinite; }
  .title-reveal { animation: titleReveal 0.8s cubic-bezier(0.16,1,0.3,1) both; }

  .brick-wall {
    background-color:#b91c1c;
    background-image: 
      repeating-linear-gradient(0deg,transparent,transparent 17px,rgba(0,0,0,0.1) 17px,rgba(0,0,0,0.1) 19px),
      repeating-linear-gradient(90deg,transparent,transparent 37px,rgba(0,0,0,0.05) 37px,rgba(0,0,0,0.05) 39px);
  }
`;

/* ─────────────────────────────────────────────
   HELPER COMPONENTS
───────────────────────────────────────────── */
function Cloud({ className, style, size = 1 }: CloudProps) {
  const w = 60 * size, h = 25 * size;
  return (
    <div className={`absolute pointer-events-none ${className}`} style={style}>
      <div style={{ width:w, height:h, background:"rgba(255,255,255,0.8)", borderRadius:999 }} />
      <div style={{ width:w*0.6, height:h*0.8, background:"rgba(255,255,255,0.7)", borderRadius:999, position:"absolute", left:w*0.2, top:-h*0.4 }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   FULL SCREEN SKY WRAPPER
───────────────────────────────────────────── */
function SkyLayout({ children }: SkyLayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col" 
         style={{ background:"linear-gradient(180deg,#0ea5e9 0%,#7dd3fc 100%)", fontFamily:"'DM Sans',sans-serif" }}>
      
      {/* Animated Elements */}
      <Cloud className="cloud1" style={{ top:'10%', left:"-150px" }} size={2} />
      <Cloud className="cloud2" style={{ top:'25%', left:"-100px" }} size={1.5} />
      <div className="bird1 absolute" style={{ top:'15%', left:'-50px' }}>
         <svg width="30" height="15" viewBox="0 0 22 10"><path d="M1 8 Q5.5 2 11 5 Q16.5 2 21 8" stroke="white" fill="none" opacity="0.4" /></svg>
      </div>

      {/* Sun */}
      <div className="absolute top-10 right-10 sm:right-20 z-0">
        <div className="sun-pulse w-20 h-20 rounded-full bg-amber-300 flex items-center justify-center">
          <Sun size={40} className="text-amber-600 opacity-80" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center py-12 px-4">
        {children}
      </div>

      {/* Rooftop - Fixed at bottom of viewport */}
      <div className="sticky bottom-0 left-0 w-full flex items-end pointer-events-none z-20">
        {[...Array(15)].map((_,i)=>(
          <div key={i} className="flex-1 h-10 brick-wall" style={{ clipPath:"polygon(50% 0%, 0% 100%, 100% 100%)" }} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN SHOP COMPONENT
───────────────────────────────────────────── */
export default function Shop() {
  const [showInfo, setShowInfo] = useState(false);
  const { getData } = useApi();
  const [shopInfo, setShopInfo] = useState<ShopInfo>({
    shopName: "Loading…",
    shopDescription: "",
    location: "",
    operatingHours: "",
    rating: 0,
  });

  useEffect(() => {
    getData(ENDPOINTS.SHOPS + "/by/" + SHOP_ID).then(res => {
      if (!res) return;
      const d = Array.isArray(res.data) ? res.data[0] : res.data;
      if (!d) return;
      setShopInfo({
        shopName: String(d.datas?.shop_name ?? d.datas?.name ?? "My Shop"),
        shopDescription: String(d.datas?.description ?? d.datas?.about ?? ""),
        location: String(d.datas?.location ?? d.datas?.address ?? ""),
        operatingHours: String(d.datas?.operating_hours ?? d.datas?.timings ?? ""),
        rating: Number(d.datas?.rating ?? 0),
      });
    });
  }, []);

  return (
    <SkyLayout>
      <style>{STYLES}</style>

      {/* 1. HERO TEXT SECTION */}
      <div className="flex flex-col items-center text-center mb-12 max-w-3xl">
        <div className="title-reveal inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold uppercase tracking-widest mb-6">
          <Store size={14} /> Management Console
        </div>

        <h1 className="title-reveal text-5xl md:text-7xl font-black text-white leading-tight mb-6">
          Your <span className="text-amber-200">Digital Empire</span> <br/> Starts Here
        </h1>

        <p className="title-reveal text-sky-50 text-lg md:text-xl font-medium opacity-90 max-w-xl">
          Manage your storefronts, track live orders, and scale your business from the clouds.
        </p>
      </div>

      {/* 2. INTERACTIVE CARDS SECTION */}
      <div className="w-full max-w-6xl flex  md:gap-4 lg:gap-8 px-4 items-start justify-center">
        
        {/* The Main Store Card */}
        <div className="title-reveal" style={{ animationDelay: "0.4s" }}>
          <App shopInfo={shopInfo} setShow={setShowInfo}/>
        </div>

        {/* The Fly-out Info Panel */}
        {showInfo && (
          <div className="title-reveal flex flex-col overflow-hidden bg-white border border-white/10 rounded-3xl md:rounded-r-3xl md:rounded-l-none shadow-2xl"
               style={{ width: 340, height: 520, animationDelay: "0.1s" }}>
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black text-white">
                  {shopInfo.shopName[0]}
                </div>
                <div className="text-right">
                  <div className="flex gap-1 justify-end">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verified Seller</span>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-black mb-2">{shopInfo.shopName}</h2>
              <p className="text-gray-800 text-sm leading-relaxed mb-8">{shopInfo.shopDescription}</p>

              <div className="space-y-4">
                <div className="flex items-center gap-4 text-gray-600">
                  <MapPin size={18} className="text-blue-400" />
                  <span className="text-sm font-medium">{shopInfo.location}</span>
                </div>
                <div className="flex items-center gap-4 text-gray-600">
                  <Clock size={18} className="text-emerald-400" />
                  <span className="text-sm font-medium">{shopInfo.operatingHours}</span>
                </div>
              </div>
            </div>

            <div className="mt-auto p-8 border-t border-white/5">
               <button className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all transform active:scale-95 shadow-lg shadow-blue-900/40">
                 Enter Dashboard
               </button>
            </div>
          </div>
        )}
      </div>
    </SkyLayout>
  );
}