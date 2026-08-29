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

// Prevent keyboard accidental typing of +, -, e, E in number inputs globally
document.addEventListener(
  "keydown",
  (e) => {
    if (e.target instanceof HTMLInputElement && e.target.type === "number") {
      if (["+", "-", "e", "E"].includes(e.key)) {
        e.preventDefault();
      }
    }
  },
  true // Use capture phase to intercept before React event propagation
);

// Prevent accidental scroll wheel increment/decrement in active number inputs globally
document.addEventListener(
  "wheel",
  () => {
    if (
      document.activeElement instanceof HTMLInputElement &&
      document.activeElement.type === "number"
    ) {
      document.activeElement.blur();
    }
  },
  { passive: true }
);

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
