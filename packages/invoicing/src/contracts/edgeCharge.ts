import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type EdgeChargeAdapter = {
  readonly abi: any[];
  readonly address: `0x${string}`;
};

function readAbi(): any[] {
  const __filename = fileURLToPath(import.meta.url);
  const __dirnameLocal = path.dirname(__filename);
  const file = path.resolve(
    __dirnameLocal,
    '../../../contracts/artifacts/contracts/EdgeCharge.sol/EdgeCharge.json',
  );
  const json = JSON.parse(fs.readFileSync(file, 'utf8')) as { abi: any[] };
  return json.abi;
}

function readDeployedAddress(): `0x${string}` | null {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirnameLocal = path.dirname(__filename);
    const file = path.resolve(
      __dirnameLocal,
      '../../../contracts/ignition/deployments/chain-2484/deployed_addresses.json',
    );
    const json = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string>;
    const addr = json['EdgeChargeModule#EdgeCharge'];
    return addr as `0x${string}`;
  } catch {
    return null;
  }
}

export function getEdgeChargeAdapter(explicitAddress?: `0x${string}`): EdgeChargeAdapter {
  const abi = readAbi();
  const address = explicitAddress ?? readDeployedAddress();
  if (!address) throw new Error('EdgeCharge address not found. Set EDGECHARGE_ADDRESS or deploy via Ignition.');
  return { abi, address };
}
