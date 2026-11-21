import {
  type ChainAdapter,
  type Gravestone,
  type LeaderboardEntry,
} from './types';
import {
  startRunOnChain,
  submitResultOnChain,
  persistGravestoneOnChain,
  getGravestonesOnChain,
  getPrizePoolOnChain,
} from '../contracts/viem';

export class Web3ChainAdapter implements ChainAdapter {
  public isMock = false;
  private walletClient: any;
  private address: string;

  constructor(walletClient: any, address: string) {
    this.walletClient = walletClient;
    this.address = address;
  }

  async onRunStarted(address: string, seed: number, feeMon: number): Promise<{ txHash?: string }> {
    if (!this.walletClient) return {};
    try {
      const txHash = await startRunOnChain(this.walletClient, BigInt(seed));
      return { txHash };
    } catch (e: any) {
      console.warn('Live startRun tx bypassed or failed, continuing off-chain:', e.message);
      return {};
    }
  }

  async onGravestonePersisted(g: Gravestone): Promise<{ txHash?: string }> {
    if (!this.walletClient) return {};
    try {
      const txHash = await persistGravestoneOnChain(
        this.walletClient,
        BigInt(Date.now()),
        BigInt(g.seed),
        g.floor,
        BigInt(g.pos.x),
        BigInt(g.pos.y),
        BigInt(g.finalScore),
        BigInt(Math.floor(g.diedAt / 1000))
      );
      g.txHash = txHash;
      return { txHash };
    } catch (e: any) {
      console.warn('Live persistGravestone tx failed:', e.message);
      return {};
    }
  }

  async onPayoutSettled(address: string, amountMon: number, score: number): Promise<{ txHash?: string }> {
    if (!this.walletClient) return {};
    try {
      const txHash = await submitResultOnChain(
        this.walletClient,
        BigInt(Date.now()),
        BigInt(1042),
        1,
        BigInt(score),
        false
      );
      return { txHash };
    } catch (e: any) {
      console.warn('Live submitResult tx failed:', e.message);
      return {};
    }
  }

  async getGravestones(seed: number, floor: number): Promise<Gravestone[]> {
    return getGravestonesOnChain(seed, floor);
  }

  async getPrizePool(): Promise<number> {
    return getPrizePoolOnChain();
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return [];
  }
}

export class MockChainAdapter implements ChainAdapter {
  public isMock = true;
  private db: {
    pool: number;
    bal: number;
    graves: Record<string, any[]>;
    board: Record<string, { best: number; floor?: number; paid?: number }>;
    addr: string;
  };

  constructor() {
    let saved: any = null;
    if (typeof window !== 'undefined') {
      try {
        saved = JSON.parse(localStorage.getItem('mbr2') || '');
      } catch (e) {}
    }

    this.db = saved || {
      pool: 25.0,
      bal: 10.0,
      graves: {},
      board: {
        '0x89f2a7143c08': { best: 2450, floor: 5, paid: 4.85 },
        '0x3b89e812ca49': { best: 1820, floor: 4, paid: 3.4 },
        '0x7e221008cb92': { best: 1350, floor: 3, paid: 2.15 },
      },
      addr:
        '0x' +
        Math.random().toString(16).slice(2, 10) +
        '…' +
        Math.random().toString(16).slice(2, 6),
    };

    this.save();
  }

  private save() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('mbr2', JSON.stringify(this.db));
    } catch (e) {}
  }

  async onRunStarted(address: string, seed: number, feeMon: number): Promise<{ txHash?: string }> {
    this.db.pool += feeMon;
    if (this.db.bal >= feeMon) {
      this.db.bal -= feeMon;
    }
    this.save();
    // Simulate ~600ms Monad block finality
    await new Promise(r => setTimeout(r, 600));
    const txHash = '0x' + Array.from({ length: 8 }, () => (Math.random() * 16 | 0).toString(16)).join('') + '…';
    return { txHash };
  }

  async onGravestonePersisted(g: Gravestone): Promise<{ txHash?: string }> {
    const key = `${g.seed}:${g.floor}`;
    const list = this.db.graves[key] || [];

    const record = {
      id: g.id,
      addr: g.ownerAddress,
      x: g.pos.x,
      y: g.pos.y,
      score: g.finalScore,
      loot: g.loot,
      claimed: g.lootClaimed,
      beaten: g.ghostDefeated,
      diedAt: g.diedAt,
    };

    // Update if exists or push
    const existingIdx = list.findIndex((q: any) => q.id === g.id);
    if (existingIdx >= 0) {
      list[existingIdx] = record;
    } else {
      list.push(record);
    }

    this.db.graves[key] = list;
    this.save();

    await new Promise(r => setTimeout(r, 600));
    const txHash = '0x' + Array.from({ length: 8 }, () => (Math.random() * 16 | 0).toString(16)).join('') + '…';
    g.txHash = txHash;
    return { txHash };
  }

  async onPayoutSettled(address: string, amountMon: number, score: number): Promise<{ txHash?: string }> {
    this.db.pool = Math.max(0, this.db.pool - amountMon);
    this.db.bal += amountMon;

    const b = this.db.board[address] || (this.db.board[address] = { best: 0, paid: 0 });
    b.best = Math.max(b.best, score);
    b.paid = (b.paid || 0) + amountMon;
    this.save();

    await new Promise(r => setTimeout(r, 600));
    const txHash = '0x' + Array.from({ length: 8 }, () => (Math.random() * 16 | 0).toString(16)).join('') + '…';
    return { txHash };
  }

  async getGravestones(seed: number, floor: number): Promise<Gravestone[]> {
    const key = `${seed}:${floor}`;
    const list = this.db.graves[key] || [];

    return list.map((q: any) => ({
      id: q.id || `grave-${q.addr}-${q.x}-${q.y}`,
      ownerAddress: q.addr,
      seed,
      floor,
      pos: { x: q.x, y: q.y },
      loot: Array.isArray(q.loot) ? q.loot : ['Soul Ember', 'Monad Dagger (+2 ATK)'],
      finalScore: q.score || 0,
      diedAt: q.diedAt || Date.now(),
      lootClaimed: Boolean(q.claimed),
      ghostDefeated: Boolean(q.beaten),
    }));
  }

  async getPrizePool(): Promise<number> {
    return this.db.pool;
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return Object.entries(this.db.board)
      .map(([addr, data]) => ({
        address: addr,
        bestScore: data.best,
        highestFloor: data.floor || 1,
        totalPayoutMon: data.paid || Math.min(data.best / 250, 5),
        runsPlayed: 1,
        lastPlayed: Date.now(),
      }))
      .sort((a, b) => b.bestScore - a.bestScore);
  }
}
