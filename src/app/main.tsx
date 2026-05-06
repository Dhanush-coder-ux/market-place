import { createRoot } from 'react-dom/client'
import App from './App'
import { PurchaseSettingsProvider } from '@/context/PurchaseContext';
import { ApiProvider } from '@/context/ApiContext';

import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { InputBuilderProvider } from '@/components/inputbuilders/context/InputBuilderContext';
import { HeaderProvider } from '@/context/HeaderContext';
import { ToastProvider } from '@/context/ToastContext';
import { QuickCreateProvider } from '@/features/common/QuickCreate/QuickCreateContext';

createRoot(document.getElementById('root')!).render(
  <ApiProvider>
    <PurchaseSettingsProvider>
      <InputBuilderProvider>
        <HeaderProvider>
          <ToastProvider>
            <QuickCreateProvider>
              <App />
            </QuickCreateProvider>
          </ToastProvider>
        </HeaderProvider>
      </InputBuilderProvider>
    </PurchaseSettingsProvider>
  </ApiProvider>
)
