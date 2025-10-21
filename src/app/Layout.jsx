import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import Sidebar from './Sidebar.jsx';

function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="content-area">
          <Suspense fallback={
            <div className="text-center" style={{ padding: '2rem' }}>
              <div style={{ color: 'var(--muted)' }}>Loading...</div>
            </div>
          }>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

export default Layout;
