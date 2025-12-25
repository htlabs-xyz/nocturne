# Phase 03: Layout & Navigation

## Objective

Build the desktop wallet shell with sidebar navigation, header, and routing structure.

## Layout Architecture

```
+-------------------------------------------------------------------+
|  WalletLayout (~1000px total)                                     |
|  +------------+--------------------------------------------------+ |
|  |            |                                                  | |
|  |  Sidebar   |              MainContent                         | |
|  |  (200px)   |  +--------------------------------------------+  | |
|  |            |  |  Header                                    |  | |
|  |  Logo      |  |  - Wallet name/selector                    |  | |
|  |  NavItems  |  |  - Network badge                           |  | |
|  |            |  +--------------------------------------------+  | |
|  |            |  |                                            |  | |
|  |            |  |  PageContent                               |  | |
|  |            |  |  (children)                                |  | |
|  |            |  |                                            |  | |
|  |            |  |                                            |  | |
|  |            |  +--------------------------------------------+  | |
|  +------------+--------------------------------------------------+ |
+-------------------------------------------------------------------+
```

## Directory Structure

```
src/
├── components/
│   └── layout/
│       ├── wallet-layout.tsx
│       ├── sidebar.tsx
│       ├── header.tsx
│       ├── nav-item.tsx
│       └── index.ts
├── pages/
│   ├── dashboard.tsx
│   ├── send.tsx
│   ├── receive.tsx
│   ├── history.tsx
│   ├── addresses.tsx
│   ├── dust.tsx
│   ├── settings.tsx
│   └── index.ts
└── router.tsx
```

## Implementation Steps

### Step 1: Navigation Item Component

```tsx
// src/components/layout/nav-item.tsx
import { clsx } from 'clsx';
import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: string | number;
}

export function NavItem({ to, icon: Icon, label, badge }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200',
          'text-midnight-300 hover:text-midnight-100 hover:bg-midnight-700/50',
          isActive && 'bg-midnight-700 text-midnight-50 shadow-glow-shield'
        )
      }
    >
      <Icon size={20} />
      <span className="font-medium flex-1">{label}</span>
      {badge !== undefined && (
        <span className="px-2 py-0.5 text-xs font-semibold bg-night/20 text-night rounded-full">
          {badge}
        </span>
      )}
    </NavLink>
  );
}
```

### Step 2: Sidebar Component

```tsx
// src/components/layout/sidebar.tsx
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Send,
  Download,
  Clock,
  MapPin,
  Zap,
  Settings,
  Moon,
} from 'lucide-react';
import { NavItem } from './nav-item';

interface SidebarProps {
  className?: string;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/send', icon: Send, label: 'Send' },
  { to: '/receive', icon: Download, label: 'Receive' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/addresses', icon: MapPin, label: 'Addresses' },
  { to: '/dust', icon: Zap, label: 'DUST' },
];

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={clsx(
        'w-[200px] min-h-screen flex flex-col',
        'bg-midnight-900 border-r border-midnight-800',
        className
      )}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-midnight-800">
        <div className="flex items-center gap-2">
          <Moon size={28} className="text-shield" />
          <div>
            <h1 className="font-heading font-bold text-midnight-50">Midnight</h1>
            <p className="text-xs text-midnight-400">Wallet</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Footer - Settings */}
      <div className="p-3 border-t border-midnight-800">
        <NavItem to="/settings" icon={Settings} label="Settings" />
      </div>
    </aside>
  );
}
```

### Step 3: Header Component

```tsx
// src/components/layout/header.tsx
import { clsx } from 'clsx';
import { ChevronDown, Globe, Bell } from 'lucide-react';
import { Badge } from '../ui/badge';

interface HeaderProps {
  walletName?: string;
  network?: 'mainnet' | 'testnet';
  className?: string;
}

export function Header({ walletName = 'My Wallet', network = 'testnet', className }: HeaderProps) {
  return (
    <header
      className={clsx(
        'h-16 px-6 flex items-center justify-between',
        'bg-midnight-800/50 border-b border-midnight-700/50',
        className
      )}
    >
      {/* Left: Wallet Selector */}
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-midnight-700/50 transition-colors">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-shield to-night flex items-center justify-center">
          <span className="text-sm font-bold text-midnight-900">
            {walletName.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="font-semibold text-midnight-100">{walletName}</span>
        <ChevronDown size={16} className="text-midnight-400" />
      </button>

      {/* Right: Network & Notifications */}
      <div className="flex items-center gap-4">
        <Badge
          variant={network === 'mainnet' ? 'success' : 'warning'}
          className="flex items-center gap-1.5"
        >
          <Globe size={12} />
          {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
        </Badge>

        <button className="relative p-2 text-midnight-400 hover:text-midnight-200 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-night rounded-full" />
        </button>
      </div>
    </header>
  );
}
```

### Step 4: Wallet Layout Component

```tsx
// src/components/layout/wallet-layout.tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';

export function WalletLayout() {
  return (
    <div className="min-h-screen flex bg-midnight-900">
      <Sidebar />

      <div className="flex-1 flex flex-col max-w-[800px]">
        <Header walletName="Midnight Wallet" network="testnet" />

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### Step 5: Layout Index Export

```tsx
// src/components/layout/index.ts
export { WalletLayout } from './wallet-layout';
export { Sidebar } from './sidebar';
export { Header } from './header';
export { NavItem } from './nav-item';
```

### Step 6: Page Stubs

```tsx
// src/pages/dashboard.tsx
export function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight-50">Dashboard</h1>
      <p className="text-midnight-400">Welcome to Midnight Wallet</p>
    </div>
  );
}
```

```tsx
// src/pages/send.tsx
export function SendPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight-50">Send</h1>
      <p className="text-midnight-400">Send NIGHT or DUST tokens</p>
    </div>
  );
}
```

```tsx
// src/pages/receive.tsx
export function ReceivePage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight-50">Receive</h1>
      <p className="text-midnight-400">Receive NIGHT or DUST tokens</p>
    </div>
  );
}
```

```tsx
// src/pages/history.tsx
export function HistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight-50">Transaction History</h1>
      <p className="text-midnight-400">View your past transactions</p>
    </div>
  );
}
```

```tsx
// src/pages/addresses.tsx
export function AddressesPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight-50">Addresses</h1>
      <p className="text-midnight-400">Manage your wallet addresses</p>
    </div>
  );
}
```

```tsx
// src/pages/dust.tsx
export function DustPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight-50">DUST Management</h1>
      <p className="text-midnight-400">Monitor DUST generation and capacity</p>
    </div>
  );
}
```

```tsx
// src/pages/settings.tsx
export function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight-50">Settings</h1>
      <p className="text-midnight-400">Configure your wallet preferences</p>
    </div>
  );
}
```

```tsx
// src/pages/index.ts
export { DashboardPage } from './dashboard';
export { SendPage } from './send';
export { ReceivePage } from './receive';
export { HistoryPage } from './history';
export { AddressesPage } from './addresses';
export { DustPage } from './dust';
export { SettingsPage } from './settings';
```

### Step 7: Router Configuration

```tsx
// src/router.tsx
import { Routes, Route } from 'react-router-dom';
import { WalletLayout } from './components/layout';
import {
  DashboardPage,
  SendPage,
  ReceivePage,
  HistoryPage,
  AddressesPage,
  DustPage,
  SettingsPage,
} from './pages';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<WalletLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="send" element={<SendPage />} />
        <Route path="receive" element={<ReceivePage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="addresses" element={<AddressesPage />} />
        <Route path="dust" element={<DustPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
```

### Step 8: Update App.tsx

```tsx
// src/App.tsx
import { AppRouter } from './router';

function App() {
  return <AppRouter />;
}

export default App;
```

## Responsive Considerations

The layout targets 800-1000px width for browser extension tab mode:

```tsx
// Ensure proper container sizing in wallet-layout.tsx
<div className="flex-1 flex flex-col max-w-[800px]">
```

For smaller extension popup mode (340px), a separate mobile layout would be needed (out of scope for this plan).

## Navigation Routes Summary

| Path | Component | Description |
|------|-----------|-------------|
| `/` | DashboardPage | Home with balances, quick actions |
| `/send` | SendPage | Send NIGHT or DUST |
| `/receive` | ReceivePage | Address & QR display |
| `/history` | HistoryPage | Transaction list |
| `/addresses` | AddressesPage | NIGHT, Shield, DUST addresses |
| `/dust` | DustPage | DUST generation & capacity |
| `/settings` | SettingsPage | Privacy, security, preferences |

## Verification

```bash
bun run dev
# Navigate to http://localhost:3000
# - Sidebar visible on left (200px)
# - Header shows wallet name and network badge
# - Navigation links switch pages correctly
# - Active nav item highlighted with purple glow
```

## Output

- Working sidebar navigation with 7 routes
- Header with wallet selector and network indicator
- Responsive main content area (~600-800px)
- Page routing with React Router v6
