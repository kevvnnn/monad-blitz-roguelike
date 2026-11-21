import {
  MAP_WIDTH,
  MAP_HEIGHT,
  type Vec2,
  type Enemy,
  type Gravestone,
  type DungeonFloor,
} from './types';

export class SeededRandom {
  private s: number;

  constructor(seed: number) {
    this.s = (seed >>> 0) || 123456789;
  }

  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(min + this.next() * (max - min + 1));
  }
}

export class DungeonFloorClass implements DungeonFloor {
  floorNumber: number;
  seed: number;
  grid: number[][]; // 0: Wall, 1: Floor, 2: Altar, 3: Exit
  spawn: Vec2;
  exit: Vec2;
  enemies: Enemy[] = [];
  gravestones: Gravestone[] = [];
  chests: { pos: Vec2; loot: string; opened: boolean }[] = [];
  seenTiles: Set<string> = new Set<string>();

  constructor(floorNumber: number, seed: number, persistedGravestones: Gravestone[] = []) {
    this.floorNumber = floorNumber;
    this.seed = seed;
    this.grid = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(0));

    // PRNG using seed and floor (matching reference)
    const rng = new SeededRandom(seed * 31 + floorNumber * 977);
    const rooms: number[][] = [];

    // Carve non-overlapping rooms
    for (let attempt = 0; attempt < 90 && rooms.length < 7; attempt++) {
      const rw = 4 + Math.floor(rng.next() * 5); // 4..8
      const rh = 3 + Math.floor(rng.next() * 4); // 3..6
      const rx = 1 + Math.floor(rng.next() * (MAP_WIDTH - rw - 2));
      const ry = 1 + Math.floor(rng.next() * (MAP_HEIGHT - rh - 2));

      const overlaps = rooms.some(
        q =>
          rx - 1 < q[0] + q[2] &&
          rx + rw + 1 > q[0] &&
          ry - 1 < q[1] + q[3] &&
          ry + rh + 1 > q[1]
      );
      if (overlaps) continue;

      rooms.push([rx, ry, rw, rh]);
      for (let j = ry; j < ry + rh; j++) {
        for (let i = rx; i < rx + rw; i++) {
          this.grid[j][i] = 1;
        }
      }
    }

    if (rooms.length === 0) {
      rooms.push([2, 2, 7, 5]);
      for (let j = 2; j < 7; j++) for (let i = 2; i < 9; i++) this.grid[j][i] = 1;
      rooms.push([16, 8, 7, 5]);
      for (let j = 8; j < 13; j++) for (let i = 16; i < 23; i++) this.grid[j][i] = 1;
    }

    const roomCenter = (q: number[]): Vec2 => ({
      x: q[0] + (q[2] >> 1),
      y: q[1] + (q[3] >> 1),
    });

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
      const a = roomCenter(rooms[i - 1]);
      const b = roomCenter(rooms[i]);
      let cx = a.x;
      let cy = a.y;

      const carveH = () => {
        while (cx !== b.x) {
          this.grid[cy][cx] = 1;
          cx += Math.sign(b.x - cx);
        }
      };

      const carveV = () => {
        while (cy !== b.y) {
          this.grid[cy][cx] = 1;
          cy += Math.sign(b.y - cy);
        }
      };

      if (rng.next() < 0.5) {
        carveH();
        carveV();
      } else {
        carveV();
        carveH();
      }
      this.grid[cy][cx] = 1;
    }

    // Spawn in first room
    this.spawn = roomCenter(rooms[0]);

    // Exit stairs in last room
    this.exit = roomCenter(rooms[rooms.length - 1]);
    this.grid[this.exit.y][this.exit.x] = 3;

    // Altar in middle room if >= 3 rooms
    if (rooms.length > 2) {
      const altarPos = roomCenter(rooms[rooms.length >> 1]);
      if (this.grid[altarPos.y][altarPos.x] === 1) {
        this.grid[altarPos.y][altarPos.x] = 2;
      }
    }

    // Spawn regular dungeon enemies
    for (let i = 1; i < rooms.length; i++) {
      const p = roomCenter(rooms[i]);
      if (this.grid[p.y][p.x] !== 1) continue;
      const hp = 35 + floorNumber * 12 + Math.floor(rng.next() * 15);
      const atk = 8 + floorNumber * 3;

      this.enemies.push({
        id: `f${floorNumber}-e${i}`,
        name: 'Shard Fiend',
        pos: { x: p.x, y: p.y },
        renderPos: { x: p.x, y: p.y },
        hp,
        maxHp: hp,
        atk,
        isGhost: false,
        fallenPlayerAddress: null,
        hitAnim: 0,
      });
    }

    // Attach persisted gravestones for this floor
    this.gravestones = [...persistedGravestones];

    // Spawn a Ghost for every gravestone that has not been defeated yet!
    for (const grave of this.gravestones) {
      if (!grave.ghostDefeated) {
        const ghostHp = 45 + floorNumber * 10;
        const ghostAtk = 10 + floorNumber * 3;
        this.enemies.push({
          id: `ghost-${grave.id}`,
          name: 'Ghost of ' + this.shortAddress(grave.ownerAddress),
          pos: { x: grave.pos.x, y: grave.pos.y },
          renderPos: { x: grave.pos.x, y: grave.pos.y },
          hp: ghostHp,
          maxHp: ghostHp,
          atk: ghostAtk,
          isGhost: true,
          fallenPlayerAddress: grave.ownerAddress,
          hitAnim: 0,
          grave: grave,
        });
      }
    }
  }

  isWalkable(x: number, y: number): boolean {
    return x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT && this.grid[y][x] > 0;
  }

  private shortAddress(address: string): string {
    if (!address) return '0x0000';
    return address.length <= 12
      ? address
      : `${address.substring(0, 6)}…${address.substring(address.length - 4)}`;
  }
}
