import { runShieldedWalletTest } from './shield';
import { runUnshieldedWalletTest } from './unshield';
import { runDustWalletTest } from './dust';
import { NETWORK_CONFIG } from './config';

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Midnight Wallet SDK Test Suite                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Network: ${NETWORK_CONFIG.networkId}`);
  console.log(`Indexer: ${NETWORK_CONFIG.indexerHttp}`);
  console.log(`Node: ${NETWORK_CONFIG.nodeUrl}`);
  console.log(`Prover: ${NETWORK_CONFIG.proofServer}\n`);

  const results: { name: string; success: boolean; error?: unknown }[] = [];

  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│ 1. SHIELDED WALLET TEST                                    │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  try {
    const shieldedSuccess = await runShieldedWalletTest();
    results.push({ name: 'Shielded Wallet', success: shieldedSuccess });
  } catch (error) {
    console.error('Shielded wallet test error:', error);
    results.push({ name: 'Shielded Wallet', success: false, error });
  }

  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│ 2. UNSHIELDED WALLET TEST                                  │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  try {
    const unshieldedSuccess = await runUnshieldedWalletTest();
    results.push({ name: 'Unshielded Wallet', success: unshieldedSuccess });
  } catch (error) {
    console.error('Unshielded wallet test error:', error);
    results.push({ name: 'Unshielded Wallet', success: false, error });
  }

  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│ 3. DUST WALLET TEST                                        │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  try {
    const dustSuccess = await runDustWalletTest();
    results.push({ name: 'Dust Wallet', success: dustSuccess });
  } catch (error) {
    console.error('Dust wallet test error:', error);
    results.push({ name: 'Dust Wallet', success: false, error });
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                          ║');
  console.log('╠════════════════════════════════════════════════════════════╣');

  for (const result of results) {
    const status = result.success ? '✅ PASSED' : '❌ FAILED';
    const name = result.name.padEnd(30);
    console.log(`║ ${name} ${status.padEnd(24)} ║`);
  }

  const allPassed = results.every((r) => r.success);
  const passedCount = results.filter((r) => r.success).length;

  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(
    `║ Total: ${passedCount}/${results.length} tests passed${' '.repeat(38 - String(passedCount).length - String(results.length).length)}║`,
  );
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (!allPassed) {
    console.log('Some tests failed. Check output above for details.\n');
    process.exit(1);
  }

  console.log('All tests passed!\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
