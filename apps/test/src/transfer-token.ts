import { transferNight } from './transfer-night';
import { transferShielded } from './transfer-shielded';

type TransferType = 'night' | 'shielded' | 'both';

interface TransferConfig {
  type: TransferType;
  nightAmount?: bigint;
  shieldedAmount?: bigint;
}

const DEFAULT_TRANSFER: TransferConfig = {
  type: 'both',
  nightAmount: 1_000_000n,
  shieldedAmount: 1_000_000n,
};

export async function runTransferTest(transferConfig: TransferConfig = DEFAULT_TRANSFER) {
  const results: { night?: boolean; shielded?: boolean } = {};

  if (transferConfig.type === 'night' || transferConfig.type === 'both') {
    if (!transferConfig.nightAmount) throw new Error('Night amount required');
    results.night = await transferNight(transferConfig.nightAmount);
  }

  if (transferConfig.type === 'shielded' || transferConfig.type === 'both') {
    if (!transferConfig.shieldedAmount) throw new Error('Shielded amount required');
    results.shielded = await transferShielded(transferConfig.shieldedAmount);
  }

  const allPassed = Object.values(results).every((r) => r === true);

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log(`║          ALL TRANSFERS ${allPassed ? 'COMPLETE ✅' : 'FAILED ❌'}                       ║`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  return allPassed;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const type = (args[0] as TransferType) || 'both';
  const amount = args[1] ? BigInt(args[1]) : 1_000_000n;

  const config: TransferConfig = {
    type,
    nightAmount: type !== 'shielded' ? amount : undefined,
    shieldedAmount: type !== 'night' ? amount : undefined,
  };

  runTransferTest(config)
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Transfer failed with error:', error);
      process.exit(1);
    });
}
