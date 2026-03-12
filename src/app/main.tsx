import { createRoot } from 'react-dom/client'
import App from './App'
import { registerLicense } from '@syncfusion/ej2-base';
import { StrictMode } from 'react';
import { PurchaseSettingsProvider } from '@/context/PurchaseContext';



registerLicense(import.meta.env.VITE_SYNCFUSION_LICENSE_KEY);
createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <PurchaseSettingsProvider>
      <App/>
      </PurchaseSettingsProvider>
    </StrictMode> 
)
