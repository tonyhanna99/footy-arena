import { RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import { router } from './routes.jsx';

function App() {
  useEffect(() => {
    document.title = 'FootyArena — Game Hub';
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
