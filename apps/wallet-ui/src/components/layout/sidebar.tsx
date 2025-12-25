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
      <div className="p-4 border-b border-midnight-800">
        <div className="flex items-center gap-2">
          <Moon size={28} className="text-shield" />
          <div>
            <h1 className="font-heading font-bold text-midnight-50">Midnight</h1>
            <p className="text-xs text-midnight-400">Wallet</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="p-3 border-t border-midnight-800">
        <NavItem to="/settings" icon={Settings} label="Settings" />
      </div>
    </aside>
  );
}
