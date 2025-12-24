import { createClient } from 'graphql-ws';
import WebSocket from 'ws';
import { network } from './config';

const DUST_LEDGER_EVENTS_SUBSCRIPTION = `
  subscription DustLedgerEvents($id: Int) {
    dustLedgerEvents(id: $id) {
      __typename
      id
      raw
      maxId
    }
  }
`;

async function queryDustEvents(startId: number = 0, maxEvents: number = 10) {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Query Dust Ledger Events Directly                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Indexer WS: ${network.indexerWs}`);
  console.log(`Start ID: ${startId}`);
  console.log(`Max events to fetch: ${maxEvents}\n`);

  const client = createClient({
    url: network.indexerWs,
    webSocketImpl: WebSocket,
  });

  let eventCount = 0;

  return new Promise<void>((resolve, reject) => {
    const unsubscribe = client.subscribe(
      {
        query: DUST_LEDGER_EVENTS_SUBSCRIPTION,
        variables: { id: startId },
      },
      {
        next: (result) => {
          eventCount++;
          const event = (result.data as { dustLedgerEvents: unknown }).dustLedgerEvents;

          console.log(`┌─── Event #${eventCount} ───────────────────────────────────────┐`);
          console.log(JSON.stringify(event, null, 2));
          console.log(`└────────────────────────────────────────────────────────────┘\n`);

          if (eventCount >= maxEvents) {
            console.log(`Reached max events (${maxEvents}). Stopping...`);
            unsubscribe();
            client.dispose();
            resolve();
          }
        },
        error: (err) => {
          console.error('Subscription error:', err);
          reject(err);
        },
        complete: () => {
          console.log('Subscription completed');
          resolve();
        },
      },
    );

    setTimeout(() => {
      console.log(`\nTimeout reached. Received ${eventCount} events.`);
      unsubscribe();
      client.dispose();
      resolve();
    }, 30000);
  });
}

if (import.meta.main) {
  const startId = process.argv[2] ? parseInt(process.argv[2]) : 0;
  const maxEvents = process.argv[3] ? parseInt(process.argv[3]) : 10;

  queryDustEvents(startId, maxEvents)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
