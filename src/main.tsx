import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@tabler/core/dist/css/tabler.min.css';
import App from './App';
import { tenant } from './config/tenant';
import './styles.css';

document.title = tenant.appTitle;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
