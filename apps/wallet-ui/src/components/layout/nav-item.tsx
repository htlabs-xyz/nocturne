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
          isActive && 'bg-midnight-700 text-midnight-50'
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
