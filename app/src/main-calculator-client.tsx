import { createRoot } from 'react-dom/client';
import './index.css';
import CalculatorClientFrame from './frames/CalculatorClientFrame.tsx';

createRoot(document.getElementById('root')!).render(
  <CalculatorClientFrame />,
);
