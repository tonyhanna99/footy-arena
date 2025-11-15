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
            <div className="connecting-container">
              <div className="football-spinner">⚽</div>
              <p className="connecting-message">Connecting you...</p>
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
