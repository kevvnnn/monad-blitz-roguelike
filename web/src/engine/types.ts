export const TILE = {
  WALL: '#',
  FLOOR: '.',
  ALTAR: 'A',
  EXIT: '>',
  GRAVESTONE: '+',
  CHEST: '$',
} as const;

export type TileType = typeof TILE[keyof typeof TILE];

export const MAP_WIDTH = 28;
export const MAP_HEIGHT = 18;
export const CELL_SIZE = 32;
export const TICK_MS = 100;

export const getDailySeed = (): number => {
  return Math.floor(Date.now() / 864e5) * 7919 + 1042;
};

export interface Vec2 {
  x: number;
  y: number;
}

export interface Direction {
  dx: number;
  dy: number;
}

export const DIRECTIONS: Record<string, Direction> = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 },
  STAY: { dx: 0, dy: 0 },
};

export interface Enemy {
  id: string;
  name: string;
  pos: Vec2;
  renderPos: Vec2; // for smooth 60fps interpolation
  hp: number;
  maxHp: number;
  atk: number;
  isGhost: boolean;
  fallenPlayerAddress: string | null;
  lootDropped?: string;
  hitAnim: number; // for flash on hit
  grave?: Gravestone;
}

export interface Gravestone {
  id: string;
  ownerAddress: string;
  seed: number;
  floor: number;
  pos: Vec2;
  loot: string[];
  finalScore: number;
  diedAt: number;
  lootClaimed: boolean;
  ghostDefeated: boolean;
  txHash?: string;
}

export interface PlayerRun {
  runId: string;
  address: string;
  dungeonSeed: number;
  floor: number;
  pos: Vec2;
  renderPos: Vec2; // for smooth 60fps interpolation
  hp: number;
  maxHp: number;
  atk: number;
  score: number;
  inventory: string[];
  active: boolean;
  payoutMon: number;
  monstersSlain: number;
  gravestonesLooted: number;
  altarsUsed: number;
  steps: number;
}

export interface LeaderboardEntry {
  address: string;
  bestScore: number;
  highestFloor: number;
  totalPayoutMon: number;
  runsPlayed: number;
  lastPlayed: number;
}

export interface DungeonFloor {
  floorNumber: number;
  seed: number;
  grid: number[][]; // 0: wall, 1: floor, 2: altar, 3: exit
  spawn: Vec2;
  exit: Vec2;
  enemies: Enemy[];
  gravestones: Gravestone[];
  chests: { pos: Vec2; loot: string; opened: boolean }[];
  seenTiles: Set<string>;
  isWalkable(x: number, y: number): boolean;
}

export interface CombatLogEntry {
  id: string;
  text: string;
  type: 'combat' | 'loot' | 'move' | 'system' | 'chain' | 'death' | 'victory';
  timestamp: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  createdAt: number;
  duration: number;
}

export interface ChainAdapter {
  isMock: boolean;
  onRunStarted(address: string, seed: number, feeMon: number): Promise<{ txHash?: string }>;
  onGravestonePersisted(g: Gravestone): Promise<{ txHash?: string }>;
  onPayoutSettled(address: string, amountMon: number, score: number): Promise<{ txHash?: string }>;
  getGravestones(seed: number, floor: number): Promise<Gravestone[]>;
  getPrizePool(): Promise<number>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
}
