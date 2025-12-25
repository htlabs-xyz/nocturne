# Phase 01: Project Setup

## Objective

Initialize `apps/wallet-ui` with Vite, React, TypeScript, and Tailwind CSS.

## Prerequisites

- Bun installed (monorepo package manager)
- Node 20+ for TypeScript support

## Directory Structure

```
apps/wallet-ui/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── vite-env.d.ts
    ├── components/
    ├── features/
    ├── hooks/
    ├── stores/
    ├── types/
    └── utils/
```

## Implementation Steps

### Step 1: Create package.json

```json
{
  "name": "@midnight-wallet/ui",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "zustand": "^5.0.0",
    "lucide-react": "^0.454.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.9.3",
    "vite": "^7.3.0"
  }
}
```

### Step 2: Create vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
});
```

### Step 3: Create tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Step 4: Create tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Base Midnight palette
        midnight: {
          900: '#0A0E1A',
          800: '#0F172A',
          700: '#1E293B',
          600: '#334155',
          500: '#475569',
          400: '#64748B',
          300: '#94A3B8',
          200: '#CBD5E1',
          100: '#E2E8F0',
          50: '#F8FAFC',
        },
        // Token colors - NIGHT (amber)
        night: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          dark: '#D97706',
        },
        // Token colors - Shield (purple)
        shield: {
          DEFAULT: '#8B5CF6',
          light: '#A78BFA',
          dark: '#7C3AED',
        },
        // Token colors - DUST (emerald)
        dust: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669',
        },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 20px rgba(245, 158, 11, 0.3)',
        'glow-shield': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-dust': '0 0 20px rgba(16, 185, 129, 0.3)',
      },
      backdropBlur: {
        glass: '16px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
```

### Step 5: Create postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### Step 6: Create index.html

```html
<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fira+Code:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap"
      rel="stylesheet"
    />
    <title>Midnight Wallet</title>
  </head>
  <body class="bg-midnight-900 text-midnight-100">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Step 7: Create src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'DM Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Space Grotesk', sans-serif;
  }

  code, pre {
    font-family: 'Fira Code', monospace;
  }
}

@layer components {
  .glass-panel {
    @apply bg-midnight-800/50 backdrop-blur-glass border border-midnight-700/50 rounded-xl;
  }

  .btn-primary {
    @apply bg-night text-midnight-900 font-semibold px-4 py-2 rounded-lg
           hover:bg-night-light transition-colors duration-200;
  }

  .btn-secondary {
    @apply bg-midnight-700 text-midnight-100 font-medium px-4 py-2 rounded-lg
           hover:bg-midnight-600 transition-colors duration-200;
  }
}
```

### Step 8: Create src/main.tsx

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

### Step 9: Create src/App.tsx

```tsx
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-midnight-900">
      <Routes>
        <Route path="/" element={<div className="p-8 text-midnight-100">Midnight Wallet UI</div>} />
      </Routes>
    </div>
  );
}

export default App;
```

## Verification

```bash
cd apps/wallet-ui
bun install
bun run dev
# Should open http://localhost:3000 with "Midnight Wallet UI" text
bun run typecheck
# Should pass with no errors
```

## Output

- Working Vite dev server at localhost:3000
- TypeScript compilation passing
- Tailwind CSS configured with Midnight design tokens
- Path aliases working (@/ -> src/)
