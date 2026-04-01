import { createRoot } from 'react-dom/client'
import App from './App'
import { StrictMode } from 'react';
import { PurchaseSettingsProvider } from '@/context/PurchaseContext';


createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <PurchaseSettingsProvider>
      <App/>
      </PurchaseSettingsProvider>
    </StrictMode> 
)
