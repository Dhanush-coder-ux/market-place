import { createRoot } from 'react-dom/client'
import App from './App'
import { StrictMode } from 'react';
import { PurchaseSettingsProvider } from '@/context/PurchaseContext';
import { ApiProvider } from '@/context/ApiContext';

import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { InputBuilderProvider } from '@/components/inputbuilders/context/InputBuilderContext';
import { HeaderProvider } from '@/context/HeaderContext';
import { ToastProvider } from '@/context/ToastContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApiProvider>
      <PurchaseSettingsProvider>
        <InputBuilderProvider>
          <HeaderProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </HeaderProvider>
        </InputBuilderProvider>
      </PurchaseSettingsProvider>
    </ApiProvider>
  </StrictMode>
)
