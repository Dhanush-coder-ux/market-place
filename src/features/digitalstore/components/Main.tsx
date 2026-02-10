import { useState } from 'react';
import { Store, Package, Truck, Rocket, Check, ChevronRight, ChevronLeft, X } from 'lucide-react';

// Your existing page imports
import DeliveryPreferences from "../pages/Deliveryinfo";
import StoreSetupForm from "../pages/DigitalStoreForm";
import ProductManagement from "../pages/ProductManagement";
import StorePublishFlow from "../pages/PublishStore";
import { Link } from 'react-router-dom';


const Main = ({ onClose }: { onClose?: () => void }) => {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, title: "Store Details", subtitle: "Name & Branding", icon: Store },
    { id: 2, title: "Add Products", subtitle: "Inventory Setup", icon: Package },
    { id: 3, title: "Delivery", subtitle: "Shipping Methods", icon: Truck },
    { id: 4, title: "Publish", subtitle: "Go Live", icon: Rocket },
  ];

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return <StoreSetupForm />;
      case 2: return <ProductManagement />;
      case 3: return <DeliveryPreferences />;
      case 4: return <StorePublishFlow />;
      default: return <StoreSetupForm />;
    }
  };

  return (
    // FIXED FULL SCREEN OVERLAY
    <div className="fixed inset-0 w-screen h-screen bg-slate-100 flex items-center justify-center p-0 md:p-4 z-[9999] overflow-hidden">
      
      {/* FLOATABLE CARD CONTAINER */}
      <div className="flex w-full h-full md:max-w-[1440px] md:h-[90vh] bg-white rounded-none md:rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
     <Link to={"/shop"} 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-full z-[60] transition-all border border-slate-200 shadow-sm group"
        >
          <X size={15} className="group-hover:scale-110 transition-transform" />
        </Link >
        {/* --- LEFT SIDEBAR (Fixed & Non-Scrollable) --- */}
        <div className="w-72 bg-slate-900 text-white flex flex-col shrink-0 z-20">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6 text-blue-400">
               <Rocket size={24} />
               <span className="font-bold text-lg tracking-tight text-white uppercase">Launchpad</span>
            </div>
            <h1 className="text-md font-semibold text-slate-100">Setup Your Store</h1>
            <p className="text-slate-400 text-[11px] leading-relaxed mt-1">Complete these steps to go live.</p>
          </div>
          
          <nav className="flex-1 px-6 space-y-4">
            {steps.map((step) => {
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;

              return (
                <div key={step.id} className="flex items-center gap-4 group">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0
                    ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                    ${isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'}
                  `}>
                    {isCompleted ? <Check size={14} strokeWidth={3} /> : <step.icon size={14} />}
                  </div>
                  <div className={isActive ? 'opacity-100' : 'opacity-40'}>
                    <p className="text-xs font-bold leading-none">{step.title}</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">{step.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="p-6 text-[10px] text-slate-600 border-t border-slate-800">
            &copy; 2026 DigitalStore Inc.
          </div>
        </div>

        {/* --- RIGHT MAIN CONTENT (Self-Contained) --- */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          
          {/* Header Area */}
          <div className="px-8 pt-8 pb-4 shrink-0">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">Step 0{currentStep}</span>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">{steps[currentStep-1].title}</h2>
              </div>
              <div className="text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                {currentStep} / 4
              </div>
            </div>
          </div>

          {/* DYNAMIC CONTENT ZONE - No Scrollbar on main page, only here if needed */}
          <div className="flex-1 overflow-hidden px-8 py-2">
            <div className="h-full w-full rounded-xl overflow-y-auto pr-2 custom-scrollbar">
               {renderStepContent()}
            </div>
          </div>

          {/* ACTION FOOTER */}
          <div className="h-20 border-t border-slate-100 flex items-center justify-between px-8 bg-white shrink-0">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 text-sm font-bold transition-all ${
                currentStep === 1 ? 'opacity-20 cursor-not-allowed' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ChevronLeft size={18} /> Back
            </button>

            <div className="flex gap-1.5">
               {steps.map(s => (
                  <div key={s.id} className={`h-1.5 w-6 rounded-full transition-all duration-500 ${s.id <= currentStep ? 'bg-blue-600 w-10' : 'bg-slate-100'}`} />
               ))}
            </div>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-100"
              >
                Continue <ChevronRight size={18} />
              </button>
            ) : (
              <button className="flex items-center gap-2 bg-green-600 text-white px-8 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-green-100">
                <Check size={18} /> Launch Store
              </button>
            )}
          </div>
        </div>

      </div>
      
      {/* Background Dimmer/Blur */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm -z-10" />
    </div>
  );
};

export default Main;