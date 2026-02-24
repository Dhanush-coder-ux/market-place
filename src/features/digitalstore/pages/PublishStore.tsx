import  { useEffect, useState,  } from 'react';
import { 
  Store, 
  CheckCircle2, 
  Loader2, 

} from 'lucide-react';
import { useNavigate } from 'react-router-dom';




const StorePublishFlow = () => {
  // States: 'draft' | 'validating' | 'success' | 'live'
  const [status, setStatus] = useState<'draft' | 'validating' | 'success' | 'live'>('draft');
  const [validationStep, setValidationStep] = useState(0);
  const navigate = useNavigate();
  
  // Handlers
  useEffect(() => {
  if (status === "live") {
    navigate("/profile-info");
  }
}, [status, navigate]);
  const handlePublish = () => {
    setStatus('validating');
    
    // Simulate Validation Steps
    const steps = [
      () => setValidationStep(1), // Validating Inventory
      () => setValidationStep(2), // Checking Payment Gateway
      () => setValidationStep(3), // Generating Store URL
      () => {
        setStatus('success'); // All done
        setTimeout(() => setStatus('live'), 2000); // Show success for 2s then go live
      }
    ];

    // Execute simulation with delays
    steps.forEach((step, index) => {
      setTimeout(step, (index + 1) * 1200);
    });
  };

 

  return (
    <div onClick={()=>handlePublish} className=" bg-white flex items-center justify-center ">
      
      {/* 1. ADMIN DRAFT VIEW */}
      {status === 'draft' && (
        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-slate-900 p-6 text-white">
            <h1 className="text-2xl font-bold">Store Dashboard</h1>
            <p className="text-slate-400 text-sm">Your store is currently hidden.</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Checklist */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">Readiness Checklist</h3>
              <div className="flex items-center gap-3 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle2 size={18} />
                <span className="text-sm font-medium">5 Products Added</span>
              </div>
              <div className="flex items-center gap-3 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle2 size={18} />
                <span className="text-sm font-medium">Store Profile Complete</span>
              </div>
         
            </div>

        
          </div>
        </div>
      )}

      {/* 2. VALIDATION & LOADING VIEW */}
      {status === 'validating' && (
        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            <Store className="absolute inset-0 m-auto text-blue-600" size={24} />
          </div>
          
          <div className="space-y-4 text-left max-w-xs mx-auto">
            <h2 className="text-xl font-bold text-center text-gray-800">Going Live...</h2>
            
            <ValidationItem label="Validating Inventory" status={validationStep >= 1 ? 'done' : 'waiting'} />
            <ValidationItem label="Secure Connection" status={validationStep >= 2 ? 'done' : 'waiting'} />
            <ValidationItem label="Building Storefront" status={validationStep >= 3 ? 'done' : 'waiting'} />
          </div>
        </div>
      )}

      {/* 3. SUCCESS ANIMATION VIEW */}
      {status === 'success' && (
       
        <div className="bg-green-500 w-full max-w-md rounded-2xl shadow-xl p-12 text-center text-white space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg">
            <CheckCircle2 size={48} className="text-green-500 animate-bounce" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Success!</h1>
            <p className="text-green-100 mt-2">Your store is now live.</p>
          </div>
          <p className="text-sm opacity-80">Redirecting to store...</p>
        </div>
      )}
   
     
    </div>
  );
};

// --- Sub-Components ---

const ValidationItem = ({ label, status }: { label: string, status: 'waiting' | 'done' }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <span className={`text-sm font-medium ${status === 'done' ? 'text-gray-700' : 'text-gray-400'}`}>
      {label}
    </span>
    {status === 'done' ? (
      <CheckCircle2 size={18}  className="text-green-500" />
    ) : (
      <Loader2 size={18} className="text-blue-400 animate-spin" />
    )}
  </div>
);



export default StorePublishFlow;