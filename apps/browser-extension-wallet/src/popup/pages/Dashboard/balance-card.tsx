import { useState } from 'react';
import { Card } from '../../components';

interface BalanceCardProps {
  totalUsd?: string;
  shielded?: { hidden: boolean; amount: string };
  unshielded?: { token: string; amount: string };
  dust?: { amount: string };
}

export function BalanceCard({
  totalUsd = '$0.00',
  shielded = { hidden: true, amount: '●●●●●' },
  unshielded = { token: 'NIGHT', amount: '0' },
  dust = { amount: '0' },
}: BalanceCardProps) {
  const [showShielded, setShowShielded] = useState(false);

  return (
    <Card className="bg-gradient-to-br from-accent-purple/20 to-midnight-600">
      <div className="text-center mb-4">
        <p className="text-text-secondary text-sm">Total Balance</p>
        <h1 className="text-3xl font-bold text-white">{totalUsd}</h1>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="text-center">
          <p className="text-text-muted text-xs">Shielded</p>
          <button
            onClick={() => setShowShielded(!showShielded)}
            className="text-white font-medium hover:text-accent-purple transition-colors"
          >
            {showShielded ? shielded.amount : '●●●●●'}
          </button>
        </div>
        <div className="text-center">
          <p className="text-text-muted text-xs">Unshielded</p>
          <p className="text-white font-medium">
            {unshielded.amount} {unshielded.token}
          </p>
        </div>
        <div className="text-center">
          <p className="text-text-muted text-xs">Dust</p>
          <p className="text-white font-medium">{dust.amount} tDUST</p>
        </div>
      </div>
    </Card>
  );
}
