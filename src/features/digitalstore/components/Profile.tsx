import { MapPin, Share2, ShieldCheck, Star, Megaphone, Grid,ChevronLeft, QrCode } from "lucide-react";

export const Profile = ({ status }: { status: string }) => {
  interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    isLatest: boolean;
    category: string;
  }

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

  const MOCK_PRODUCTS: Product[] = [
    { id: '1', name: 'Noise-Cancel Earbuds', price: 129.99, category: 'Audio', isLatest: true, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80' },
    { id: '2', name: 'Minimalist Watch', price: 89.50, category: 'Wearables', isLatest: true, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80' },
    { id: '3', name: 'Leather Satchel', price: 245.00, category: 'Bags', isLatest: false, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80' },
    { id: '4', name: 'Mechanical Keyboard', price: 150.00, category: 'Tech', isLatest: true, image: 'https://images.unsplash.com/photo-1587829741301-dc798b91a603?w=400&q=80' },
    { id: '5', name: 'Ceramic Mug', price: 25.00, category: 'Home', isLatest: false, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80' },
    { id: '6', name: 'Desk Mat', price: 45.00, category: 'Home', isLatest: false, image: 'https://images.unsplash.com/photo-1616410011236-7a42121dd981?w=400&q=80' },
  ];

  if (status !== 'live') return null;

  return (
    <div className="w-full min-h-screen bg-white text-black font-sans">
      {/* --- Top Navigation Bar --- */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center">
        <ChevronLeft size={24} />
        <div className="flex items-center gap-1 font-bold text-sm">
          {MOCK_PROFILE.username}
          <ShieldCheck size={14} className="text-blue-500 fill-blue-500" />
        </div>
       
      </nav>

      <div className=" mx-auto">
        {/* --- Profile Header Section --- */}
        <div className="px-5 pt-6 pb-4">
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
            <div className="flex gap-6 md:gap-10 pr-4">
        <QrCode size={48} className="text-gray-600" />
           <Share2 size={18} />
            </div>
          </div>

          {/* Bio Section */}
          <div className="space-y-0.5">
            <h1 className="font-bold text-sm">{MOCK_PROFILE.name}</h1>
            <p className="text-gray-500 text-sm flex items-center gap-1">
              <MapPin size={12} /> {MOCK_PROFILE.location}
            </p>
            <p className="text-sm whitespace-pre-wrap pt-1">{MOCK_PROFILE.description}</p>
            <div className="flex items-center gap-1 text-blue-900 font-medium text-sm pt-1">
                <Star size={14} className="fill-blue-900" /> {MOCK_PROFILE.name} Club Member
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6">
          
            <button className="bg-gray-100 hover:bg-gray-200 p-1.5 rounded-lg transition">
           
            </button>
          </div>
        </div>

        {/* --- Announcement Bar --- */}
        {MOCK_PROFILE.announcement && (
          <div className="bg-gray-50 border-y border-gray-100 px-5 py-2 flex items-center gap-3 my-2">
            <div className="bg-white p-1.5 rounded-full shadow-sm">
                <Megaphone size={14} className="text-indigo-600" />
            </div>
            <p className="text-xs font-medium text-gray-700">{MOCK_PROFILE.announcement}</p>
          </div>
        )}

        {/* --- Grid Tabs --- */}
        <div className="flex border-t border-gray-100 mt-4">
          <div className="flex-1 flex justify-center py-3 border-t border-black -mt-[1px]">
            <Grid size={20} />
          </div>
      
        </div>

        {/* --- Photo Grid --- */}
      <div className="grid grid-cols-4 gap-[2px]">
  {MOCK_PRODUCTS.map((product) => (
    <div
      key={product.id}
      className=" relative group cursor-pointer overflow-hidden bg-gray-100 h-[110px] sm:h-[130px]"
    >
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-full object-cover"
      />

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <p className="text-white text-[11px] font-semibold">
          ₹{product.price}
        </p>
      </div>
    </div>
  ))}
</div>

      </div>

      {/* Footer padding for mobile nav if needed */}
      <div className="h-20" />
    </div>
  );
};