
import { createRoot } from 'react-dom/client'
import App from './App'
import { registerLicense } from '@syncfusion/ej2-base';
import { Provider } from 'react-redux';
import { store } from '@/store/store';


registerLicense(import.meta.env.VITE_SYNCFUSION_LICENSE_KEY);
createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App/>
  </Provider>,
)
