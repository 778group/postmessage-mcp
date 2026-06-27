import { createRoot } from 'react-dom/client';
import './index.css';
import PaletteServerFrame from './frames/PaletteServerFrame.tsx';

createRoot(document.getElementById('root')!).render(
  <PaletteServerFrame />,
);
