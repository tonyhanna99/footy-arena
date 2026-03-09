import { useLocation } from 'react-router-dom';
import SEOHead from '../shared/components/SEOHead.jsx';

const PAGE_SEO = {
  '/': {
    title: 'FootyArena – Free Football Party Games Online',
    description:
      'Play free football party games with friends on FootyArena. Choose from Football Imposter, Football Guess Who?, Football Alphabet and more.',
    canonical: '/',
    ogTitle: 'FootyArena – Free Football Party Games Online',
    ogDescription:
      'Play free football party games with friends on FootyArena. Choose from Football Imposter, Football Guess Who?, Football Alphabet and more.',
  },
  '/games/football-imposter': {
    title: 'Football Imposter Game – Play with Friends Online | FootyArena',
    description:
      'Play Football Imposter online with friends. A fun football party game where one player is secretly the imposter and must guess the footballer.',
    canonical: '/games/football-imposter',
    ogTitle: 'Football Imposter Game – Play with Friends Online | FootyArena',
    ogDescription:
      'Play Football Imposter online with friends. A fun football party game where one player is secretly the imposter and must guess the footballer.',
    ogImage: '/social-preview.png',
    twitterTitle: 'Football Imposter Game – Play with Friends Online | FootyArena',
    twitterDescription:
      'Play Football Imposter online with friends. A fun football party game where one player is secretly the imposter and must guess the footballer.',
    twitterImage: '/social-preview.png',
  },
  '/games/guess-who': {
    title: 'Football Guess Who? – Multiplayer Board Game Online | FootyArena',
    description:
      'Play Football Guess Who? online with a friend. Ask yes/no questions and flip cards to find your opponent\'s secret footballer before they find yours.',
    canonical: '/games/guess-who',
    ogTitle: 'Football Guess Who? – Multiplayer Board Game Online | FootyArena',
    ogDescription:
      'Play Football Guess Who? online with a friend. Ask yes/no questions and flip cards to find your opponent\'s secret footballer before they find yours.',
    ogImage: '/social-preview.png',
    twitterTitle: 'Football Guess Who? – Multiplayer Board Game Online | FootyArena',
    twitterDescription:
      'Play Football Guess Who? online with a friend. Ask yes/no questions to find the secret footballer.',
    twitterImage: '/social-preview.png',
  },
  '/games/football-alphabet': {
    title: 'Football Alphabet Game – Test Your Knowledge A to Z | FootyArena',
    description:
      'Test your football knowledge from A to Z! Race against time to fill categories with football terms starting with a random letter. Unique answers score more points.',
    canonical: '/games/football-alphabet',
    ogTitle: 'Football Alphabet Game – Test Your Knowledge A to Z | FootyArena',
    ogDescription:
      'Race against time to fill football categories with a random letter. Unique answers score more. Play online with friends on FootyArena.',
    ogImage: '/social-preview.png',
    twitterTitle: 'Football Alphabet Game | FootyArena',
    twitterDescription:
      'A fast-paced football trivia game where you fill categories A to Z. Play online with friends.',
    twitterImage: '/social-preview.png',
  },
};

function RouteSEO() {
  const { pathname } = useLocation();
  const seo = PAGE_SEO[pathname] || PAGE_SEO['/'];

  return <SEOHead {...seo} />;
}

export default RouteSEO;
