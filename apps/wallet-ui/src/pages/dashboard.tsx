import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Zap, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddressDisplay, DustCapacityBar, TokenBadge, PrivacyIndicator } from '@/components/wallet';
import { useNavigate } from 'react-router-dom';

const mockData = {
  nightBalance: 2.5,
  nightUsd: 5000,
  priceChange: 2.3,
  dustCurrent: 800,
  dustMax: 1000,
  dustRate: 50,
  dustStatus: 'active' as const,
  addresses: {
    night: '0x1234567890abcdef1234567890abcdef12345678',
    shield: '0xfedcba0987654321fedcba0987654321fedcba09',
  },
  recentTx: [
    { id: '1', type: 'receive', token: 'night', amount: 1.0, date: 'Dec 24', isPrivate: false },
    { id: '2', type: 'send', token: 'dust', amount: 50, date: 'Dec 23', isPrivate: true },
    { id: '3', type: 'generation', token: 'dust', amount: 50, date: 'Dec 22', isPrivate: false },
  ],
};

export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-midnight-800 to-midnight-900 border-night/30">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TokenBadge type="night" size="sm" />
                <span className="text-midnight-400 text-sm">NIGHT Balance</span>
              </div>
              <p className="font-heading text-4xl font-bold text-midnight-50">
                {mockData.nightBalance.toLocaleString()} NIGHT
              </p>
              <p className="text-midnight-300 mt-1">
                ≈ ${mockData.nightUsd.toLocaleString()} USD
              </p>
            </div>
            <div className={`flex items-center gap-1 text-sm ${mockData.priceChange >= 0 ? 'text-dust' : 'text-red-400'}`}>
              {mockData.priceChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{mockData.priceChange >= 0 ? '+' : ''}{mockData.priceChange}%</span>
              <span className="text-midnight-500">(24h)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <DustCapacityBar
        current={mockData.dustCurrent}
        max={mockData.dustMax}
        generationRate={mockData.dustRate}
        status={mockData.dustStatus}
      />

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button onClick={() => navigate('/send?token=night')} className="flex-1 gap-2">
            <Send size={18} />
            Send NIGHT
          </Button>
          <Button
            onClick={() => navigate('/send?token=dust')}
            variant="secondary"
            className="flex-1 gap-2 bg-dust/20 text-dust-light border border-dust/30 hover:bg-dust/30"
          >
            <Zap size={18} />
            Send DUST
          </Button>
          <Button onClick={() => navigate('/receive')} variant="secondary" className="flex-1 gap-2">
            <ArrowDownLeft size={18} />
            Receive
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Addresses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <AddressDisplay
            address={mockData.addresses.night}
            type="night"
            label="NIGHT Address (Unshielded)"
            showCopy
            showExplorer
          />
          <div className="border-t border-midnight-700" />
          <AddressDisplay
            address={mockData.addresses.shield}
            type="shield"
            label="Shield Address (Private)"
            showCopy
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
            View All
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockData.recentTx.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  tx.type === 'receive' ? 'bg-dust/20 text-dust' :
                  tx.type === 'send' ? 'bg-night/20 text-night' :
                  'bg-shield/20 text-shield'
                }`}>
                  {tx.type === 'receive' ? <ArrowDownLeft size={16} /> :
                   tx.type === 'send' ? <ArrowUpRight size={16} /> :
                   <Zap size={16} />}
                </div>
                <div>
                  <p className="text-midnight-100 font-medium">
                    {tx.type === 'receive' ? 'Received' :
                     tx.type === 'send' ? 'Sent' :
                     'Generated'} {tx.token.toUpperCase()}
                  </p>
                  <p className="text-midnight-400 text-sm">{tx.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-mono font-medium ${
                  tx.type === 'send' ? 'text-red-400' : 'text-dust'
                }`}>
                  {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.token.toUpperCase()}
                </span>
                {tx.isPrivate && <PrivacyIndicator isPrivate size="sm" showLabel={false} />}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
