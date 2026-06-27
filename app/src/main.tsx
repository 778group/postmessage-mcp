import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import Home from './pages/Home.tsx';
import CalculatorDemo from './pages/CalculatorDemo.tsx';
import ColorPaletteDemo from './pages/ColorPaletteDemo.tsx';
import AgentBridgeDemo from './pages/AgentBridgeDemo.tsx';

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="calculator" element={<CalculatorDemo />} />
        <Route path="color-palette" element={<ColorPaletteDemo />} />
        <Route path="agent-bridge" element={<AgentBridgeDemo />} />
      </Route>
    </Routes>
  </HashRouter>,
);
