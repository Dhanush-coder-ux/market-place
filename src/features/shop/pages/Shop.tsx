import { CircleFadingPlus, Store, ArrowRight } from "lucide-react";
import StoreCard from "../components/StoreCard";


const Shop = () => {
  return (
    <div className="min-h-screen  from-blue-50 via-slate-50 to-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold tracking-wide uppercase mb-4 border border-blue-100">
            <Store size={14} />
            Management Console
          </div>
          
          <h1 className="text-4xl md:text-5xl text-slate-900 font-extrabold tracking-tight mb-4">
            Choose your 
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
            
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Register New Shop</h3>
            <p className="text-sm text-slate-500 mt-3 text-center leading-relaxed">
              Add a new branch or location to your <br /> business ecosystem in seconds.
            </p>

            <div className="mt-6 flex items-center text-blue-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              Get Started <ArrowRight size={16} className="ml-1" />
            </div>
          </button>

          {/* existing Shop Card  */}
          {/* <div className="group relative flex flex-col p-8 bg-white border border-slate-100 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-1">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-slate-50 p-3 rounded-xl">
                <Store className="text-slate-700" size={24} />
              </div>
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase">Verified</span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Second Branch</h3>
            <p className="text-sm text-slate-500 mt-2">Main Street, Hawkins</p>
            
            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
              <span className="text-xs font-medium text-green-700 bg-green-200 p-2 rounded-2xl">124 Orders today</span>
              <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white cursor-pointer hover:bg-blue-600 transition-colors">
                <ArrowRight size={14} />
              </div>
            </div>
          </div> */}
        <StoreCard/>
        </div>
      
      </div>
       
    </div>
  );
};

export default Shop;
