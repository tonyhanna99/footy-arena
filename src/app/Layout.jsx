import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import Sidebar from './Sidebar.jsx';
import { Analytics } from '@vercel/analytics/react';
import RouteSEO from './RouteSEO.jsx';
import { InstagramBanner } from '../shared/components';

function Layout() {
  return (
    <>
      <RouteSEO />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="content-area">
            <Suspense fallback={
              <div className="connecting-container">
                <div className="football-spinner">⚽</div>
                <p className="connecting-message">Connecting you...</p>
              </div>
            }>
              <InstagramBanner />
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
      <Analytics />
    </>
  );
}

export default Layout;
