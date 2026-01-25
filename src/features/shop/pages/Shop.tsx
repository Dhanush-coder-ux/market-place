import { CircleFadingPlus, Store, ArrowRight } from "lucide-react";
import StoreCard from "../components/StoreCard";




const Shop = () => {
  return (
    <div className="min-h-screen  from-blue-50 via-slate-50 to-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">


        <div className="flex flex-col items-center mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold tracking-wide uppercase mb-4 border border-blue-100">
            <Store size={14} />
            Management Console
          </div>

          <h1 className="text-4xl md:text-5xl text-slate-900 font-extrabold tracking-tight mb-4">
            Choose your Existing
            <span className="relative inline-block text-blue-600 ml-3">
               Digital Store
              <svg
                className="absolute -bottom-4 left-0 w-full h-4 text-blue-500"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 8 Q 50 2, 100 8"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="text-slate-500 text-lg max-w-xl">
            Select an existing workspace or create a new digital storefront to start managing your business.
          </p>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {/* Create New Shop Card */}
          <button className="group relative flex flex-col items-center p-8 bg-white/60 backdrop-blur-md border border-dashed border-slate-300 rounded-3xl transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-xl hover:shadow-blue-500/5">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md">
              <CircleFadingPlus className="text-blue-600" size={32} strokeWidth={1.5} />
            </div>

            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Register New Digital Store</h3>
            <p className="text-sm text-slate-500 mt-3 text-center leading-relaxed">
              Create a new digital store <br />for your business 
            </p>

            <div className="mt-6 flex items-center text-blue-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              Get Started <ArrowRight size={16} className="ml-1" />
            </div>
          </button>

          {/* existing Shop Card  */}
          <StoreCard
            shopName="Zenitsu"
            shopDescription="Thunder breething 7th form"
            shopHours="10AM-7PM"
            shopType="DemonSlayer"
            shopLocation="Japan ,shicanshina"
          />

          <StoreCard
            shopName="tanjiro"
            shopDescription="unokamikagura breething 7th form"
            shopHours="10AM-7PM"
            shopType="DemonSlayer"
            shopLocation="Japan ,shicanshina"
          />

        </div>

      </div>

    </div>
  );
};

export default Shop;
