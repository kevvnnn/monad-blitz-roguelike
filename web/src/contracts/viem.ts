import { createPublicClient, http, parseEther, formatEther, defineChain } from 'viem';
import { BlitzRoguelikeABI } from './abi';
import type { Gravestone } from '../engine/types';

export const MONAD_TESTNET = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'MonadScan',
      url: 'https://testnet.monadscan.com',
    },
  },
  testnet: true,
});

export const CONTRACT_ADDRESS: `0x${string}` =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ||
  '0x7A1249A7F3b30644e5A9760731f82f254133A11C'; // Default placeholder / deployed testnet address

export const publicClient = createPublicClient({
  chain: MONAD_TESTNET,
  transport: http('https://testnet-rpc.monad.xyz'),
});

export async function getPrizePoolOnChain(): Promise<number> {
  try {
    const raw = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: BlitzRoguelikeABI,
      functionName: 'prizePool',
    });
    return parseFloat(formatEther(raw));
  } catch (e) {
    return 25.0; // fallback default
  }
}

export async function getGravestonesOnChain(seed: number, floor: number): Promise<Gravestone[]> {
  try {
    const raw = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: BlitzRoguelikeABI,
      functionName: 'getGravestones',
      args: [BigInt(seed), floor],
    });

    return (raw as any[]).map((g: any) => ({
      id: `chain-grave-${g.runId.toString()}`,
      ownerAddress: g.player,
      seed: Number(g.seed || seed),
      floor: Number(g.floor),
      pos: { x: Number(g.posX), y: Number(g.posY) },
      loot: ['Soul Ember', 'Monad Shard'],
      finalScore: Number(g.finalScore),
      diedAt: Number(g.diedAt) * 1000,
      lootClaimed: Boolean(g.lootClaimed),
      ghostDefeated: Boolean(g.ghostDefeated),
    }));
  } catch (e) {
    return [];
  }
}

export async function startRunOnChain(walletClient: any, seed: bigint): Promise<`0x${string}`> {
  const account = walletClient.account;
  const hash = await walletClient.writeContract({
    account,
    address: CONTRACT_ADDRESS,
    abi: BlitzRoguelikeABI,
    functionName: 'startRun',
    args: [seed],
    value: parseEther('0.1'),
    chain: MONAD_TESTNET,
  });
  return hash;
}

export async function submitResultOnChain(
  walletClient: any,
  runId: bigint,
  seed: bigint,
  floor: number,
  score: bigint,
  died: boolean
): Promise<`0x${string}`> {
  const account = walletClient.account;
  const hash = await walletClient.writeContract({
    account,
    address: CONTRACT_ADDRESS,
    abi: BlitzRoguelikeABI,
    functionName: 'submitResult',
    args: [runId, seed, floor, score, died],
    chain: MONAD_TESTNET,
  });
  return hash;
}

export async function persistGravestoneOnChain(
  walletClient: any,
  runId: bigint,
  seed: bigint,
  floor: number,
  posX: bigint,
  posY: bigint,
  finalScore: bigint,
  diedAt: bigint
): Promise<`0x${string}`> {
  const account = walletClient.account;
  const hash = await walletClient.writeContract({
    account,
    address: CONTRACT_ADDRESS,
    abi: BlitzRoguelikeABI,
    functionName: 'persistGravestone',
    args: [runId, seed, floor, posX, posY, finalScore, diedAt],
    chain: MONAD_TESTNET,
  });
  return hash;
}
