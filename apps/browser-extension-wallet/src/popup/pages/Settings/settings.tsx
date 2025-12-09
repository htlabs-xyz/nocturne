import { Header, BottomNav, Card } from '../../components';
import { useUIStore } from '../../stores/ui-store';

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  danger?: boolean;
}

function SettingsItem({ icon, label, description, onClick, danger }: SettingsItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-midnight-500 transition-colors"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        danger ? 'bg-accent-red/20 text-accent-red' : 'bg-midnight-500 text-text-secondary'
      }`}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className={`font-medium ${danger ? 'text-accent-red' : 'text-white'}`}>{label}</p>
        {description && <p className="text-text-muted text-xs">{description}</p>}
      </div>
      <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

export function Settings() {
  const { activeTab, setActiveTab, setRoute } = useUIStore();

  return (
    <div className="flex flex-col h-full bg-midnight-900">
      <Header />

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <Card className="p-2">
          <SettingsItem
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            }
            label="Connected Sites"
            description="Manage dApp connections"
            onClick={() => setRoute('connected-sites')}
          />
          <SettingsItem
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
            label="Security"
            description="Password, seed phrase, lock"
            onClick={() => setRoute('security')}
          />
        </Card>

        <Card className="p-2">
          <SettingsItem
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="About"
            description="Version 0.1.0"
            onClick={() => {}}
          />
          <SettingsItem
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Help & Support"
            onClick={() => {}}
          />
        </Card>

        <Card className="p-2">
          <SettingsItem
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            }
            label="Lock Wallet"
            onClick={() => setRoute('welcome')}
            danger
          />
        </Card>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
