import { MapPin, Share2, ShieldCheck, Star, ChevronLeft, QrCode, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GeminiInput from "./GeminiInput";
import StatsCard from "@/components/common/StatsCard";


export const DigitalStoreProfile = ({ status }: { status: string }) => {
//  interface Product {
//     id: string;
//     name: string;
//     price: number;
//     image: string;
//     isLatest: boolean;
//     category: string;
//   }

  interface StoreProfile {
    name: string;
    username: string;
    description: string;
    logo: string;
    location: string;
    announcement?: string;
  }

  const MOCK_PROFILE: StoreProfile = {
    name: "Urban Gadgets",
    username: "urbangadgets_official",
    description: "Premium tech accessories for the modern nomad. 🚀 Shipping worldwide. Link in bio for 20% off!",
    logo: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150&q=80",
    location: "San Francisco, CA",
    announcement: "🎉 Grand Opening Sale: Use code HELLO20 for 20% off!"
  };

  // const MOCK_PRODUCTS: Product[] = [
  //   { id: '1', name: 'Noise-Cancel Earbuds', price: 129.99, category: 'Audio', isLatest: true, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80' },
  //   { id: '2', name: 'Minimalist Watch', price: 89.50, category: 'Wearables', isLatest: true, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80' },
  //   { id: '3', name: 'Leather Satchel', price: 245.00, category: 'Bags', isLatest: false, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80' },
  //   { id: '4', name: 'Mechanical Keyboard', price: 150.00, category: 'Tech', isLatest: true, image: 'https://images.unsplash.com/photo-1587829741301-dc798b91a603?w=400&q=80' },
  //   { id: '5', name: 'Ceramic Mug', price: 25.00, category: 'Home', isLatest: false, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80' },
  //   { id: '6', name: 'Desk Mat', price: 45.00, category: 'Home', isLatest: false, image: 'https://images.unsplash.com/photo-1616410011236-7a42121dd981?w=400&q=80' },
  // ];

  if (status !== 'live') return null;
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-white text-black font-sans">
      {/* --- Top Navigation Bar --- */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center">
        <ChevronLeft className="cursor-pointer" onClick={()=>navigate(-1)} size={24} />
        <div className="flex items-center gap-1 font-bold text-sm">
          {MOCK_PROFILE.username}
          <ShieldCheck size={14} className="text-blue-500 fill-blue-500" />
        </div>
       
      </nav>

      <div className=" mx-auto">
        {/* --- Profile Header Section --- */}
        <div className="px-5 pt-6 pb-4  border-b-2 border-blue-400">
          <div className="flex items-center justify-between mb-4">
            {/* Logo */}
            <div className="relative">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-1 bg-blue-600 ">
                    <img 
                        src={MOCK_PROFILE.logo} 
                        alt="logo" 
                        className="w-full h-full rounded-full border-2 border-white object-cover" 
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 md:gap-10 ">
        <QrCode size={48} className="text-gray-600" />
           {/* <Share2 size={18} /> */}
            </div>
          </div>

          {/* Bio Section */}
          <div className="space-y-0.5">
            <div className="flex gap-5">
            <h1 className="font-bold text-sm">{MOCK_PROFILE.name}</h1>
            <Share2 size={18} className="cursor-pointer" /> 
            </div>
            <p className="text-gray-500 text-sm flex items-center gap-1">
              <MapPin size={12} /> {MOCK_PROFILE.location}
            </p>
            <p className="text-sm whitespace-pre-wrap pt-1">{MOCK_PROFILE.description}</p>
            <div className="flex items-center gap-1 text-blue-900 font-medium text-sm pt-1">
                <Star size={14} className="fill-blue-900" /> {MOCK_PROFILE.name} Club Member
            </div>
          </div>

         
        </div>
        {/* Vendor Announcement Form */}
        <GeminiInput/>

        {/* --- Photo Grid --- */}
      <div className="grid grid-cols-3 gap-[2px]">
     
        <StatsCard
         onClick={()=>navigate("/profile-info/product-dashboard")}
        label="Product Management"
        icon={Store}
        description="Add, edit, and manage your product listings"
        />
        <StatsCard
        onClick={()=>navigate('/profile-info/delivery-control')}
        label="Delivery & Logistics"
        icon={Store}
        description="Manage delivery options and logistics for your store"
        />
     
        
       </div>
      

      </div>

    </div>
  );
};