import { Outlet } from 'react-router-dom';
import AppleNav from './components/AppleNav.tsx';

export default function App() {
  return (
    <>
      <AppleNav />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Outlet />
      </main>
    </>
  );
}
