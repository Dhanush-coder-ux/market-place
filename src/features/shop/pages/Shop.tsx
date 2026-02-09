import {  Store } from "lucide-react";
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
