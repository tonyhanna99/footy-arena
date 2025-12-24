import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import Layout from './Layout.jsx';
import Home from './Home.jsx';

// Lazy load game components
const FootballImposterGame = lazy(() => import('../games/football-imposter/Game.jsx'));
const GuessWhoGame = lazy(() => import('../games/guess-who/Game.jsx'));
const PlayerReview = lazy(() => import('../games/guess-who/components/PlayerReview.jsx'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'games/football-imposter',
        element: <FootballImposterGame />,
      },
      {
        path: 'games/guess-who',
        element: <GuessWhoGame />,
      },
      {
        path: 'games/guess-who/review-players',
        element: <PlayerReview />,
      },
    ],
  },
]);
