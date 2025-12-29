// Football categories for the alphabet game
export const FOOTBALL_CATEGORIES = [
  // Positions
  { id: 'keeper', label: 'Goalkeeper', placeholder: 'Enter a goalkeeper...' },
  { id: 'defender', label: 'Defender', placeholder: 'Enter a defender...' },
  { id: 'midfielder', label: 'Midfielder', placeholder: 'Enter a midfielder...' },
  { id: 'attacker', label: 'Attacker', placeholder: 'Enter an attacker...' },

  // Continent
  { id: 'european_player', label: 'European Player', placeholder: 'Enter a European player...' },
  { id: 'south_american_player', label: 'South American Player', placeholder: 'Enter a South American player...' },
  { id: 'african_player', label: 'African Player', placeholder: 'Enter an African player...' },

  // National Team
  { id: 'world_cup_winner', label: 'World Cup Winner', placeholder: 'Enter a World Cup winner...' },

  // Clubs & Teams
  { id: 'football_club', label: 'Football Club', placeholder: 'Enter a football club...' },
  { id: 'top_5_league_club', label: 'Club from Top 5 Leagues', placeholder: 'Enter a club...' },
  { id: 'premier_league_player', label: 'Premier League Player', placeholder: 'Enter a Premier League player...' },
  { id: 'la_liga_player', label: 'La Liga Player', placeholder: 'Enter a La Liga player...' },
  { id: 'serie_a_player', label: 'Serie A Player', placeholder: 'Enter a Serie A player...' },

  { id: 'real_madrid_player', label: 'Player for Real Madrid', placeholder: 'Enter a Real Madrid player...' },
  { id: 'barcelona_player', label: 'Player for Barcelona', placeholder: 'Enter a Barcelona player...' },
  { id: 'man_united_player', label: 'Played for Man United', placeholder: 'Enter a Man United player...' },
  { id: 'man_city_player', label: 'Played for Man City', placeholder: 'Enter a Man City player...' },
  { id: 'chelsea_player', label: 'Played for Chelsea', placeholder: 'Enter a Chelsea player...' },
  { id: 'liverpool_player', label: 'Played for Liverpool', placeholder: 'Enter a Liverpool player...' },
  { id: 'arsenal_player', label: 'Player for Arsenal', placeholder: 'Enter an Arsenal player...' },

  // Stats & Achievements
  { id: '100_plus_goals', label: '100+ Career Goals', placeholder: 'Enter a player...' },
  { id: '50_plus_international_goals', label: '50+ International Goals', placeholder: 'Enter a player...' },
  { id: '100_plus_caps', label: '100+ International Caps', placeholder: 'Enter a player...' },

  // Other
  { id: 'retired_player', label: 'Retired Player', placeholder: 'Enter a retired player...' },
  { id: 'current_player', label: 'Current Player', placeholder: 'Enter a current player...' },
  { id: 'all_time_manager', label: 'All-Time Manager', placeholder: 'Enter a manager...' },
  { id: 'stadium', label: 'Stadium', placeholder: 'Enter a stadium...' },

  { id: 'managed_by_pep', label: 'Managed by Pep Guardiola', placeholder: 'Enter a player...' },
  { id: 'managed_by_sir_alex', label: 'Managed by Sir Alex Ferguson', placeholder: 'Enter a player...' },
  { id: 'managed_by_mourinho', label: 'Managed by José Mourinho', placeholder: 'Enter a player...' },
  { id: 'played_with_ronaldo', label: 'Played with Cristiano Ronaldo', placeholder: 'Enter a player...' },
  { id: 'played_with_messi', label: 'Played with Messi', placeholder: 'Enter a player...' },

  // Age
  { id: 'under_25', label: 'Under 25', placeholder: 'Enter a player under 25...' },
];


// Letters to use in the game (excluding Q, X, Z)
export const AVAILABLE_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'Y'
];

// Game settings
export const GAME_SETTINGS = {
  ROUND_DURATION: 60, // seconds
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 8,
  POINTS_UNIQUE: 3,
  POINTS_DUPLICATE: 1,
  POINTS_INVALID: 0,
  DEFAULT_CATEGORIES_PER_ROUND: 5, // Default number of categories per round
  MIN_CATEGORIES: 3, // Minimum categories per round
  MAX_CATEGORIES: 10, // Maximum categories per round (or total available)
};
