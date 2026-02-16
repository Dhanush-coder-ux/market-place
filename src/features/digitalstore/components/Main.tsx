import { useState } from 'react';
import { Store, Package, Truck, Rocket, Check, ChevronRight, ChevronLeft } from 'lucide-react';

// Your existing page imports
import DeliveryPreferences from "../pages/Deliveryinfo";
import StoreSetupForm from "../pages/DigitalStoreForm";
import ProductManagement from "../pages/ProductManagement";
import StorePublishFlow from "../pages/PublishStore";

const Main = () => {
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
    <div className="flex h-full w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* --- WIZARD SIDEBAR (Internal) --- */}
      <div className="w-64 bg-slate-50 border-r border-slate-100 flex flex-col shrink-0 hidden md:flex">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-2 text-blue-600">
             <Rocket size={18} />
             <span className="font-bold text-xs tracking-widest text-slate-900 uppercase">Step Guide</span>
          </div>
          <h1 className="text-lg font-bold text-slate-800 leading-tight">Setup Store</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {steps.map((step) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;

            return (
              <div 
                key={step.id} 
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white shadow-sm border border-slate-100' : ''}`}
              >
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all shrink-0
                  ${isCompleted ? 'bg-blue-600 border-blue-600 text-black' : ''}
                  ${isActive ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-transparent border-slate-200 text-slate-300'}
                `}>
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : <step.icon size={14} />}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <p className={`text-xs font-bold truncate ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                    {step.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate uppercase tracking-tighter">
                    {step.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-6">
          <div className="bg-blue-600 rounded-xl p-4 text-white">
            <p className="text-[10px] font-bold opacity-80 uppercase">Progress</p>
            <p className="text-xl font-black">{Math.round((currentStep / 4) * 100)}%</p>
            <div className="w-full bg-blue-400/30 h-1.5 rounded-full mt-2">
              <div 
                className="bg-white h-full rounded-full transition-all duration-500" 
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        
        {/* Step Header */}
        <div className="px-8 pt-8 pb-4 border-b border-slate-50 shrink-0">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-widest">
                Current Phase
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">{steps[currentStep-1].title}</h2>
            </div>
            <div className="text-xs font-bold text-slate-400">
              {currentStep} / 4
            </div>
          </div>
        </div>

        {/* Scrollable Form Zone */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto">
            {renderStepContent()}
          </div>
        </div>

        {/* Action Footer */}
        <div className="h-20 border-t border-slate-100 flex items-center justify-between px-8 bg-white shrink-0">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`flex items-center gap-1 text-sm font-bold transition-all ${
              currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-blue-600'
            }`}
          >
            <ChevronLeft size={18} /> Back
          </button>

          <div className="flex gap-1.5">
             {steps.map(s => (
                <div key={s.id} className={`h-1.5 rounded-full transition-all duration-500 ${s.id <= currentStep ? 'bg-blue-600 w-8' : 'bg-slate-100 w-2'}`} />
             ))}
          </div>

          <button
            onClick={currentStep < 4 ? handleNext : undefined}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 ${
              currentStep < 4 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100' 
              : 'bg-green-600 text-white hover:bg-green-700 shadow-green-100'
            }`}
          >
            {currentStep < 4 ? (
              <>Next <ChevronRight size={18} /></>
            ) : (
              <><Check size={18} /> Finish Setup</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Main;