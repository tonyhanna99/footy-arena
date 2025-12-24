# Shared Components

This directory contains reusable components that are shared across all games in the Footy Arena application.

## Components

### LobbyCodeDisplay

A standardized component for displaying and sharing lobby codes across all multiplayer games.

**Usage:**

```jsx
import LobbyCodeDisplay from '../../../shared/components/LobbyCodeDisplay.jsx';
// or
import { LobbyCodeDisplay } from '../../../shared/components';

function MyLobbyComponent({ lobby }) {
  return (
    <div>
      <LobbyCodeDisplay 
        code={lobby.code} 
        label="Share this code with your friends:" // Optional, has default
      />
    </div>
  );
}
```

**Props:**
- `code` (string, required): The lobby code to display
- `label` (string, optional): Custom label text. Defaults to "Share this code with your friend:"

**Features:**
- Displays lobby code in large, monospace font
- Copy to clipboard button for the code
- Copy to clipboard button for the full URL with join parameter
- Consistent styling across all games using global CSS variables
- Fully accessible with proper ARIA labels

## Adding New Shared Components

When creating a new shared component:

1. Create the component file in `/src/shared/components/`
2. Export it in `/src/shared/components/index.js`
3. Document it in this README
4. Use CSS variables from `/src/index.css` for theming consistency
5. Make components game-agnostic (they should work for any game)

## Styling

All shared components use the global CSS variables defined in `/src/index.css`:
- `--bg`: Main background color
- `--surface`: Surface/card background color
- `--text`: Primary text color
- `--muted`: Secondary/muted text color
- `--accent`: Accent/brand color
- `--accent-dark`: Darker shade of accent
- `--danger`: Error/danger color
- `--success`: Success color
- `--border`: Border color

The actual styling for shared components is defined in `/src/index.css` with class names like `.lobby-code-display`, ensuring consistency across all games.
