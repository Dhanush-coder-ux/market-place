
import {  DoorOpen, MapPin, Verified } from 'lucide-react';

const StoreCard = () => {
  return (
    <div className="group relative flex flex-col w-full max-w-sm mt-4 cursor-pointer">
     
      <div className="relative h-16 w-full z-20 mx-auto -mb-4">
        <div className="w-[96%] mx-auto h-full rounded-t-lg shadow-lg border-x border-t border-blue-900/10 overflow-hidden relative">
           {/* Blue & White Stripes Pattern */}
           <div 
             className="w-full h-full" 
             style={{
               backgroundImage: "repeating-linear-gradient(135deg, #2563eb 0px, #2563eb 15px, #ffffff 15px, #ffffff 30px)"
             }} 
           />
           {/* Scalloped Edge Illusion */}
           <div className="absolute bottom-0 w-full h-2 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      </div>

      {/* --- 2. The Main Building --- */}
      <div className="relative bg-white border border-slate-200 pt-10 pb-6 px-6 rounded-xl shadow-md transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-blue-200 ">
        
        {/* The Hanging Sign */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex flex-col items-center z-30">
             {/* The Chains */}
             <div className="flex gap-12 mb-[-4px]">
                <div className="h-4 w-0.5 bg-slate-300"></div>
                <div className="h-4 w-0.5 bg-slate-300"></div>
             </div>
             {/* The Sign Board */}
             <div className="bg-white border border-slate-100 shadow-md px-4 py-1.5 rounded-lg flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Open</span>
             </div>
        </div>

        {/* Shop Content */}
        <div className="mt-4 flex flex-col items-center text-center">
            
          <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
            Tech Haven
          </h3>
          
          <div className="flex items-center gap-1 mt-1 text-slate-400">
            <MapPin size={12} />
            <p className="text-xs font-medium">124 Blue Avenue, NY</p>
          </div>

          {/* Rating Badge */}
          <div className="mt-4 flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
            <Verified size={12}  />
            <span className="text-[10px] font-bold uppercase">Verified Seller</span>
          </div>
        </div>

        {/* --- 3. The Shop Floor --- */}
        <div className="mt-6 pt-5 border-t border-dashed border-slate-200 flex justify-between items-center">
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Today's Sales</span>
            <span className="text-lg font-bold text-slate-800">124 <span className="text-xs font-normal text-slate-400">Items</span></span>
          </div>
          
          <div className="h-10 w-10 rounded-full bg-slate-900 group-hover:bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-slate-300 transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-[-45deg]">
            {/* <ArrowRight size={18} /> */}
            <DoorOpen  size={18}/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreCard;