import { createRoot } from 'react-dom/client'
import App from './App'
import { StrictMode } from 'react';
import { PurchaseSettingsProvider } from '@/context/PurchaseContext';
import { ApiProvider } from '@/context/ApiContext';

import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { InputBuilderProvider } from '@/components/inputbuilders/context/InputBuilderContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApiProvider>
      <PurchaseSettingsProvider>
        <InputBuilderProvider>
          <App />
        </InputBuilderProvider>
      </PurchaseSettingsProvider>
    </ApiProvider>
  </StrictMode>
)
