import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { i18nReady } from './i18n';
import './theme.css';
import './styles.css';

void i18nReady.then(() => {
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
});
