import { useState } from 'react';
import { Button, Card } from '../../components';
import { useUIStore } from '../../stores/ui-store';
import { mockConnectedSites } from '../../stores/mock-data';

export function ConnectedSites() {
  const { goBack } = useUIStore();
  const [sites, setSites] = useState(mockConnectedSites);

  const handleDisconnect = (url: string) => {
    setSites(sites.filter((s) => s.url !== url));
  };

  return (
    <div className="flex flex-col h-full bg-midnight-900">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-midnight-600">
        <button
          onClick={goBack}
          className="p-1 text-text-secondary hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-white">Connected Sites</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {sites.length > 0 ? (
          <Card className="p-2">
            {sites.map((site) => (
              <div
                key={site.url}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-midnight-500 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-midnight-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{site.name}</p>
                    <p className="text-text-muted text-xs">{site.url}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnect(site.url)}
                  className="text-accent-red text-xs font-medium hover:text-accent-red/80 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ))}
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-midnight-700 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <p className="text-text-secondary text-sm">No connected sites</p>
          </div>
        )}
      </main>
    </div>
  );
}
