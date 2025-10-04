declare const process: any;
import { submitAnchor } from './usecases/submitAnchor.js';
import { createServer } from './server/http.js';
import { startBatcher } from './services/batcher.js';
import { loadEnv } from './config/env.js';

export { submitAnchor };

// Demo runner if invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    // start http server & batcher
    const app = createServer();
    const port = process.env.PORT ? Number(process.env.PORT) : 8787;
    app.listen(port, () => console.log(`Relayer API listening on :${port}`));
    startBatcher();
    const env = loadEnv();
    const provider = (process.env.PROVIDER_ADDRESS as `0x${string}`) || '0x0000000000000000000000000000000000000001';
    const windowEnd = Math.floor(Date.now() / 1000);
    const windowStart = windowEnd - 60;
    const merkleRoot = ('0x' + '00'.repeat(32)) as `0x${string}`;
    const totalUsage = 1n;
    const receipt = await submitAnchor({ provider, windowStart, windowEnd, merkleRoot, totalUsage });
    console.log('submitUsageAnchor tx:', receipt.transactionHash);
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
