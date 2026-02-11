import { GradientButton } from "@/components/ui/GradientButton";
import { Clock, DoorOpen, MapPin, Store, User } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
export type StoreCardProps = {
  shopName:string;
  shopDescription:string;
  shopType:string;
  shopLocation:string;
  shopHours:string
}
const StoreCard :React.FC<StoreCardProps>= ({shopName,shopDescription,shopHours,shopType,shopLocation}) => {
  return (
    <div className=" flex justify-center items-center py-8">

      {/* perspective */}
      <div className="group [perspective:1200px]">

        {/* flip wrapper */}
        <div
          className="
            relative w-[370px] h-[240px]
            transition-all duration-700
            [transform-style:preserve-3d]
            group-hover:[transform:rotateY(180deg)]
            group-hover:scale-[1.02]
          "
        >

          {/* ================= FRONT ================= */}
          <div className="absolute inset-0 [backface-visibility:hidden]">

            {/* ground shadow */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[260px] h-6 bg-black/30 blur-xl rounded-full" />

            {/* header */}
            <div className="
                w-[370px]
                bg-gradient-to-r from-cyan-600 via-cyan-500 to-sky-400
                rounded-t-xl
                flex justify-center
                shadow-md
                pt-6
                ">

              <div className="
                    w-60
                    bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300
                    -mt-8 py-2
                    rounded-xl
                    shadow-lg
                    flex justify-center items-center
                    relative z-20 bottom-5
                  ">
                <h1 className="font-bold tracking-wide">
                 {shopName}
                </h1>
              </div>
            </div>

            {/* body */}
            <div
              className="
                relative
                w-[370px] h-[240px]

                rounded-b-xl
                border border-gray-300
                bg-gradient-to-b from-gray-50 to-gray-200
                shadow-inner
              "
            >
              <div className="flex justify-between px-3 pb-3 h-full">

                {/* window */}
                <div className="space-y-3.5">
                <img
                  src="/Shops_Assets/9870864-removebg-preview.png"
                  alt=""
                  width={140}
                  height={140}
                  className="drop-shadow-md h-30 mt-3"
                />
                
                {/* <span className="bg-green-200 rounded-full flex items-center">
                    <Dot size={40} className="text-green-400 animate-pulse"/>
                  <p className="text-green-500 font-bold mb-1">Current</p>    
                </span> */}

                </div>
                {/* door */}
                <img
                  src="/Shops_Assets/GST_DACAR_099-03-removebg-preview.png"
                  alt=""
                  width={190}
                  className="drop-shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* ================= BACK ================= */}
          <div
            className="
            absolute inset-0
            rounded-xl
            h-[270px]
            bg-gradient-to-br from-slate-900 via-cyan-900 to-cyan-800
            text-white
            shadow-xl
            [transform:rotateY(180deg)]
            [backface-visibility:hidden]
          "
          >

            {/* BACK HEADER (same as front) */}
            <div className="
          w-[370px]
        
          bg-gradient-to-r from-cyan-600 via-cyan-500 to-sky-400
          rounded-t-xl
          flex justify-center
          shadow-md
          pt-6
        ">

              <div className="
          w-60
          bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300
          -mt-8 py-2
          rounded-xl
          shadow-lg
          flex justify-center items-center
          relative z-20 bottom-5
        ">

                <h1 className="font-bold tracking-wide">
                 {shopName}
                </h1>
              </div>
            </div>

            {/* BACK CONTENT */}
            <div className="flex flex-col justify-center items-center pt-5 text-center h-[calc(100%-80px)]">
              <h2 className="text-xl font-bold mb-2">
                About This Store
              </h2>

              <p className="text-sm opacity-90 mb-4 line-clamp-2 pb-10 px-2">
                {shopDescription} 
              </p>

              <div className="space-y-2 text-sm mb-3">
                <div className="flex gap-2">
                  <Store size={18} />
                  <p>{shopType}</p>
                </div>
                <div className="flex gap-2">
                  <MapPin size={18} />
                  <p>{shopLocation }</p>
                </div>
                <div className="flex gap-2">
                  <Clock size={18} />
                  <p> {shopHours}</p>
                </div>

              </div>


            </div>
            <div className="relative flex justify-center top-6">
              <Link to={'/create-store'}>
              <GradientButton type="button" title="Open Store" icon={<DoorOpen size={20} />}>
                Create Store
              </GradientButton>
              </Link>
              <Link to={'/profile-info'}>
              <GradientButton type="button" title="View Profile" icon={<User size={20} />}>
                View Profile
              </GradientButton>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StoreCard;
