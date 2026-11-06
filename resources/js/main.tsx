import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
createInertiaApp({ resolve: () => App, setup({ el, App, props }) { createRoot(el).render(<App {...props} />); } });
