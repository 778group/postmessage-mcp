import { createRoot } from 'react-dom/client';
import './index.css';
import CRMServerFrame from './frames/CRMServerFrame.tsx';

createRoot(document.getElementById('root')!).render(
  <CRMServerFrame />,
);
