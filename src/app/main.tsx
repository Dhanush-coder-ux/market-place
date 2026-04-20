import { createRoot } from 'react-dom/client'
import App from './App'
import { StrictMode } from 'react';
import { PurchaseSettingsProvider } from '@/context/PurchaseContext';

// Add these to your main entry file
import "primereact/resources/themes/lara-light-cyan/theme.css"; // Choose your preferred theme
import "primereact/resources/primereact.min.css";               // Core CSS
import "primeicons/primeicons.css";                             // Icons
import { InputBuilderProvider } from '@/components/inputbuilders/context/InputBuilderContext';
createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <PurchaseSettingsProvider>
        <InputBuilderProvider>
      <App/>
        </InputBuilderProvider>
      </PurchaseSettingsProvider>
    </StrictMode> 
)
