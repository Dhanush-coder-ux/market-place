import { useState } from 'react';

// Your existing page imports
import DeliveryPreferences from "../pages/Deliveryinfo";
import StoreSetupForm from "../pages/DigitalStoreForm";
import ProductManagement from "../pages/ProductManagement";
import StorePublishFlow from "../pages/PublishStore";

const Main = () => {
  // State to track the current step (1 to 4)
  const [currentStep, setCurrentStep] = useState(1);

  // Helper to render the correct component based on the step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StoreSetupForm />;
      case 2:
        return <ProductManagement />;
      case 3:
        return <DeliveryPreferences />;
      case 4:
        return <StorePublishFlow />;
      default:
        return <StoreSetupForm />;
    }
  };

  // Navigation handlers
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="p-6">
      <div className=" p-8">
        
        {/* Progress Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Create Your Digital Store
          </h1>
          
          {/* Simple Progress Bar */}
          <div className="flex items-center justify-between text-sm font-medium text-gray-500">
            <span className={currentStep >= 1 ? "text-blue-600" : ""}>1. Setup</span>
            <span className={currentStep >= 2 ? "text-blue-600" : ""}>2. Products</span>
            <span className={currentStep >= 3 ? "text-blue-600" : ""}>3. Delivery</span>
            <span className={currentStep >= 4 ? "text-blue-600" : ""}>4. Publish</span>
          </div>
          <div className="w-full bg-gray-200 h-2 mt-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="mb-8 min-h-[300px]">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between border-t pt-6">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-md font-semibold transition ${
              currentStep === 1 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Back
          </button>

          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition"
            >
              Next Step
            </button>
          ) : (
             /* The Publish component likely handles the final submission, 
                so we might not need a button here, or this button could submit the whole form */
            <span className="text-sm text-gray-500 flex items-center">
              Ready to Publish
            </span>
          )}
        </div>

      </div>
    </div>
  );
};

export default Main;