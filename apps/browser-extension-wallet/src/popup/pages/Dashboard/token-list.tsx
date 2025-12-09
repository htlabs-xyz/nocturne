import { Card, TokenIcon } from '../../components';
import type { Token } from '../../stores/mock-data';

interface TokenListProps {
  tokens: Token[];
  onTokenClick?: (token: Token) => void;
}

function TokenRow({ token, onClick }: { token: Token; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between py-3 px-1 cursor-pointer hover:bg-midnight-500/50 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3">
        <TokenIcon symbol={token.symbol} icon={token.icon} />
        <div>
          <p className="text-white font-medium">{token.symbol}</p>
          <p className="text-text-muted text-xs">{token.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-white font-medium">{token.balance}</p>
        <p className="text-text-muted text-xs">{token.usd}</p>
      </div>
    </div>
  );
}

export function TokenList({ tokens, onTokenClick }: TokenListProps) {
  return (
    <Card className="p-2">
      <div className="px-2 py-1 mb-1">
        <h3 className="text-text-secondary text-sm font-medium">Tokens</h3>
      </div>
      <div className="divide-y divide-midnight-500">
        {tokens.map((token) => (
          <TokenRow
            key={token.symbol}
            token={token}
            onClick={() => onTokenClick?.(token)}
          />
        ))}
      </div>
    </Card>
  );
}
