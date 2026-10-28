import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// Importação da hierarquia de estilos Vanilla CSS com Design Tokens
import './styles/variables.css';
import './styles/animations.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
