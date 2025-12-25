# Midnight Wallet UI Implementation Plan

## Overview

Build `apps/wallet-ui` - a React-based Midnight wallet UI optimized for browser extension tab mode (~800-1000px width). Privacy-first design with three address types (NIGHT, Shield, DUST) and dual-token system.

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build:** Vite 7.x (aligned with wireframe app)
- **Styling:** Tailwind CSS 3.x (reuse wireframe's design tokens)
- **Routing:** React Router v6
- **State:** Zustand (lightweight, TypeScript-friendly)
- **Icons:** Lucide React

## Layout Structure

```
+------------------+-------------------------------+
|    Sidebar       |       Main Content            |
|    (~200px)      |       (~600-800px)            |
|                  |  +-------------------------+  |
|   Logo           |  |  Header (wallet/network)|  |
|   Nav Items      |  +-------------------------+  |
|   - Dashboard    |  |                         |  |
|   - Send         |  |  Page Content           |  |
|   - Receive      |  |                         |  |
|   - History      |  |                         |  |
|   - Addresses    |  |                         |  |
|   - DUST         |  |                         |  |
|   - Settings     |  +-------------------------+  |
+------------------+-------------------------------+
```

## Phases

| Phase | Focus | Deliverables |
|-------|-------|--------------|
| 01 | Project Setup | Vite + React + TS + Tailwind config |
| 02 | Design System | Colors, typography, base components |
| 03 | Layout & Navigation | Sidebar, header, routing structure |
| 04 | Core Screens | Dashboard, send, receive flows |
| 05 | Advanced Screens | History, addresses, DUST, settings |
| 06 | SDK Integration | Connect to wallet SDK, state management |

## Key Decisions

1. **Reuse design tokens** from `apps/wireframe/tailwind.config.js`
2. **Component-first approach** - build atomic components before screens
3. **Desktop-first** - optimize for 800-1000px, not mobile extension
4. **Dark mode primary** - matches Midnight branding

## Midnight-Specific UI Requirements

- **Address type indicators:** NIGHT (amber), Shield (purple), DUST (emerald)
- **Privacy badges:** Public vs Shielded transaction markers
- **DUST capacity bar:** Visual generation/consumption meter
- **Decay warnings:** Alert system for orphaned DUST

## Dependencies

- `/docs/Design.md` - SDK architecture reference
- `/apps/wireframe/design-guideline.md` - Screen wireframes
- `/apps/wireframe/tailwind.config.js` - Reusable design tokens

## File References

- Phase 1: [phase-01-project-setup.md](./phase-01-project-setup.md)
- Phase 2: [phase-02-design-system.md](./phase-02-design-system.md)
- Phase 3: [phase-03-layout-navigation.md](./phase-03-layout-navigation.md)
- Phase 4: [phase-04-core-screens.md](./phase-04-core-screens.md)
- Phase 5: [phase-05-advanced-screens.md](./phase-05-advanced-screens.md)
- Phase 6: [phase-06-integration.md](./phase-06-integration.md)
