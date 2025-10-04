import { createConfig, http } from '@wagmi/core';
import { privateKeyToAccount } from 'viem/accounts';
import { writeContract, getAccount, reconnect, disconnect } from '@wagmi/core';
import { createPublicClient } from 'viem';
import { u2uNebulasTestnet } from '../config/chain.js';
import { getEdgeChargeAdapter } from '../contracts/edgeCharge.js';
import { loadEnv } from '../config/env.js';

export type AnchorPayload = {
  provider: `0x${string}`;
  windowStart: bigint | number | string;
  windowEnd: bigint | number | string;
  merkleRoot: `0x${string}`; // bytes32
  totalUsage: bigint | number | string;
};

export async function submitAnchor(payload: AnchorPayload) {
  const env = loadEnv();
  const account = privateKeyToAccount(env.RELAYER_PRIVATE_KEY as `0x${string}`);

  const config = createConfig({
    chains: [u2uNebulasTestnet],
    ssr: true,
    transports: {
      [u2uNebulasTestnet.id]: http(env.U2U_RPC_URL),
    },
  });

  // Create a viem public client to wait for receipt
  const publicClient = createPublicClient({
    chain: u2uNebulasTestnet,
    transport: http(env.U2U_RPC_URL),
  });

  // Prepare adapter and call
  const adapter = getEdgeChargeAdapter(env.EDGECHARGE_ADDRESS as `0x${string}` | undefined);
  const hash = await writeContract(config, {
    abi: adapter.abi,
    address: adapter.address,
    functionName: 'submitUsageAnchor',
    args: [
      payload.provider,
      BigInt(payload.windowStart as any),
      BigInt(payload.windowEnd as any),
      payload.merkleRoot,
      BigInt(payload.totalUsage as any),
    ],
    chainId: u2uNebulasTestnet.id,
    account,
  });

  // Wait for receipt via viem client
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return receipt;
}


