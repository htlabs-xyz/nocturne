# Phase 01: Project Setup

**Status**: pending | **Est. Effort**: 1 day

## Context Links

- [tech-stack.md](../../docs/tech-stack.md) - Approved technologies
- [Design.md](../../docs/Design.md) - SDK architecture
- [chrome-mv3-extension.md](../../docs/research/chrome-mv3-extension.md) - MV3 patterns

## Overview

Initialize `apps/browser-extension-wallet` as a Yarn workspace with Webpack 5, React 19, TypeScript, and Tailwind CSS 4. Configure for Chrome MV3 with proper CSP and monorepo integration.

## Key Insights

1. Use Webpack (not WXT) for full control over SDK bundling and WASM
2. Must handle Effect library tree-shaking (SDK dependency)
3. Service worker requires ES modules (`"type": "module"`)
4. Monorepo integration via workspace dependencies

## Requirements

- Chrome 116+ (MV3 required features)
- Yarn 4.10 workspace member
- TypeScript 5.9 strict mode
- Tailwind with custom dark theme

## Architecture

```
apps/browser-extension-wallet/
├── src/
│   ├── popup/           # React app entry
│   ├── background/      # Service worker
│   ├── content/         # Provider injection
│   └── shared/          # Types, utils
├── public/
│   └── icons/           # 16, 48, 128px
├── manifest.json
├── webpack.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Implementation Steps

### Step 1: Create package.json

```json
{
  "name": "@midnight-ntwrk/browser-extension-wallet",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "webpack --mode development --watch",
    "build": "webpack --mode production",
    "typecheck": "tsc -b ./tsconfig.json --noEmit",
    "lint": "eslint --max-warnings 0",
    "test": "vitest run",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "@midnight-ntwrk/wallet-sdk-facade": "workspace:*",
    "@midnight-ntwrk/wallet-sdk-hd": "workspace:*",
    "@midnight-ntwrk/wallet-sdk-address-format": "workspace:*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.2",
    "rxjs": "^7.8.1",
    "webextension-polyfill": "^0.12.0"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.287",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "autoprefixer": "^10.4.21",
    "copy-webpack-plugin": "^13.0.0",
    "css-loader": "^7.1.2",
    "html-webpack-plugin": "^5.6.3",
    "mini-css-extract-plugin": "^2.9.2",
    "postcss": "^8.5.3",
    "postcss-loader": "^8.1.1",
    "tailwindcss": "^4.0.0",
    "ts-loader": "^9.5.1",
    "typescript": "^5.9.3",
    "webpack": "^5.97.1",
    "webpack-cli": "^6.0.1"
  }
}
```

### Step 2: Create manifest.json

```json
{
  "manifest_version": 3,
  "name": "Midnight Wallet",
  "version": "0.1.0",
  "description": "Secure wallet for Midnight Network",
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_start",
      "all_frames": false
    }
  ],
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
  }
}
```

### Step 3: Create webpack.config.ts

```typescript
import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default (env: unknown, argv: { mode: string }) => ({
  entry: {
    popup: './src/popup/index.tsx',
    background: './src/background/index.ts',
    content: './src/content/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.wasm$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/popup/popup.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'public/icons', to: 'icons' },
      ],
    }),
    new MiniCssExtractPlugin({ filename: '[name].css' }),
  ],
  optimization: {
    splitChunks: false, // MV3 requires single files per entry
  },
  devtool: argv.mode === 'development' ? 'cheap-module-source-map' : false,
  experiments: {
    asyncWebAssembly: true,
  },
});
```

### Step 4: Create tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{tsx,ts,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a24',
          600: '#22222e',
          500: '#2a2a38',
        },
        accent: {
          purple: '#7c3aed',
          blue: '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### Step 5: Create tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["chrome"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 6: Create folder structure

```bash
mkdir -p src/{popup/{pages,components,hooks,stores},background,content,shared/{types,utils}}
mkdir -p public/icons
```

### Step 7: Create entry files

**src/popup/index.tsx**:
```tsx
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}
```

**src/background/index.ts**:
```typescript
// Register listeners at top level (MV3 requirement)
chrome.runtime.onInstalled.addListener(() => {
  console.log('Midnight Wallet installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Message handler placeholder
  return true;
});
```

**src/content/index.ts**:
```typescript
// Provider injection placeholder
console.log('Midnight Wallet content script loaded');
```

## Todo List

- [ ] Create package.json with dependencies
- [ ] Create manifest.json (MV3)
- [ ] Create webpack.config.ts with WASM support
- [ ] Create tailwind.config.js with dark theme
- [ ] Create tsconfig.json extending base
- [ ] Create folder structure
- [ ] Create popup entry (React)
- [ ] Create background entry (Service Worker)
- [ ] Create content entry
- [ ] Add placeholder icons (16, 48, 128px)
- [ ] Verify `yarn install` resolves workspace deps
- [ ] Verify `yarn build` produces valid extension
- [ ] Load unpacked in Chrome and verify popup opens

## Success Criteria

- [ ] `yarn build` produces `dist/` with popup.html, background.js, content.js
- [ ] Extension loads in Chrome without errors
- [ ] Popup renders React app with Tailwind styles
- [ ] Service worker registers without errors
- [ ] No CSP violations in console

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| WASM loading fails | Medium | High | CSP `wasm-unsafe-eval`, async experiments |
| SDK bundle too large | Medium | Medium | Tree-shaking, lazy loading |
| Workspace resolution issues | Low | Medium | Verify tsconfig paths |
