import {
  type Direction,
  type PlayerRun,
  type LeaderboardEntry,
  type DungeonFloor,
  type ChainAdapter,
  type CombatLogEntry,
  type FloatingText,
  type Gravestone,
  getDailySeed,
} from './types';
import { DungeonFloorClass } from './dungeon';
import { sounds } from './audio';

export class MonadBlitzRoguelike {
  public static readonly ENTRY_FEE_MON = 1.0; // 1 MON entry fee (as in reference HTML)
  public static readonly MAX_PAYOUT_PER_RUN_MON = 5.0; // 5 MON cap

  public chainAdapter: ChainAdapter;
  private activeRunsByAddress = new Map<string, PlayerRun>();
  private gravestonesByFloorKey = new Map<string, Gravestone[]>();
  private leaderboard = new Map<string, LeaderboardEntry>();
  private floorCache = new Map<string, DungeonFloor>();
  private runCounter = 1;
  private graveCounter = 1;
  private prizePoolMon = 25.0;

  // Visual/UI feedback queues
  public combatLogs: CombatLogEntry[] = [];
  public floatingTexts: FloatingText[] = [];
  public screenShake = 0;

  constructor(chainAdapter: ChainAdapter) {
    this.chainAdapter = chainAdapter;
  }

  getPrizePoolMon(): number {
    return this.prizePoolMon;
  }

  setPrizePoolMon(val: number) {
    this.prizePoolMon = Math.max(0, val);
  }

  async loadGravestonesForFloor(seed: number, floorNumber: number): Promise<Gravestone[]> {
    const key = `${seed}:${floorNumber}`;
    try {
      const onChainGraveList = await this.chainAdapter.getGravestones(seed, floorNumber);
      if (onChainGraveList && onChainGraveList.length > 0) {
        this.gravestonesByFloorKey.set(key, onChainGraveList);
        return onChainGraveList;
      }
    } catch (e) {
      console.warn('Failed to load gravestones from chain adapter:', e);
    }
    return this.gravestonesByFloorKey.get(key) || [];
  }

  async startRun(playerAddress: string, optionalSeed?: number): Promise<PlayerRun> {
    const addr = this.normalizeAddress(playerAddress);
    if (this.activeRunsByAddress.has(addr)) {
      this.activeRunsByAddress.delete(addr); // Reset previous run if starting new
    }

    // Always use the deterministic daily seed unless specified!
    const seed = optionalSeed ?? getDailySeed();

    // Clear floorCache for the new run so newly persisted gravestones appear immediately!
    this.floorCache.clear();

    const gravesOnFloor1 = await this.loadGravestonesForFloor(seed, 1);
    this.prizePoolMon += MonadBlitzRoguelike.ENTRY_FEE_MON;

    const floor1 = new DungeonFloorClass(1, seed, gravesOnFloor1);
    const key1 = `${seed}:1`;
    this.floorCache.set(key1, floor1);

    const runId = `run-${Date.now()}-${this.runCounter++}`;
    const run: PlayerRun = {
      runId,
      address: addr,
      dungeonSeed: seed,
      floor: 1,
      pos: { ...floor1.spawn },
      renderPos: { ...floor1.spawn },
      hp: 100,
      maxHp: 100,
      atk: 22,
      score: 0,
      inventory: ['MON Shard'],
      active: true,
      payoutMon: 0,
      monstersSlain: 0,
      gravestonesLooted: 0,
      altarsUsed: 0,
      steps: 0,
    };

    // Reveal initial tiles around spawn
    this.revealFog(floor1, run.pos.x, run.pos.y);

    this.activeRunsByAddress.set(addr, run);
    this.addLog(`⚡ Run started on Daily Seed ${seed}. Entry fee escrowed.`, 'system');

    if (gravesOnFloor1.some(g => !g.ghostDefeated)) {
      this.addLog('👻 You sense a restless ghost on this floor…', 'chain');
    }

    // Trigger onchain run start
    this.chainAdapter.onRunStarted(addr, seed, MonadBlitzRoguelike.ENTRY_FEE_MON).catch(err => {
      console.error('onRunStarted error:', err);
    });

    return run;
  }

  getActiveRun(playerAddress: string): PlayerRun | undefined {
    const addr = this.normalizeAddress(playerAddress);
    return this.activeRunsByAddress.get(addr);
  }

  getCurrentFloor(playerAddress: string): DungeonFloor | undefined {
    const addr = this.normalizeAddress(playerAddress);
    const run = this.activeRunsByAddress.get(addr);
    if (!run) return undefined;
    return this.getOrCreateFloor(run.dungeonSeed, run.floor);
  }

  private getOrCreateFloor(seed: number, floorNumber: number): DungeonFloor {
    const key = `${seed}:${floorNumber}`;
    if (this.floorCache.has(key)) {
      return this.floorCache.get(key)!;
    }

    const persisted = this.gravestonesByFloorKey.get(key) ?? [];
    const floor = new DungeonFloorClass(floorNumber, seed, persisted);
    this.floorCache.set(key, floor);
    return floor;
  }

  private revealFog(floor: DungeonFloor, px: number, py: number) {
    for (let j = -7; j <= 7; j++) {
      for (let i = -7; i <= 7; i++) {
        if (i * i + j * j <= 49) {
          floor.seenTiles.add(`${px + i},${py + j}`);
        }
      }
    }
  }

  async descendToNextFloor(run: PlayerRun): Promise<DungeonFloor> {
    run.floor += 1;
    run.score += 150;
    sounds.playDescend();

    const graves = await this.loadGravestonesForFloor(run.dungeonSeed, run.floor);
    const nextFloor = new DungeonFloorClass(run.floor, run.dungeonSeed, graves);
    const key = `${run.dungeonSeed}:${run.floor}`;
    this.floorCache.set(key, nextFloor);

    run.pos = { ...nextFloor.spawn };
    run.renderPos = { ...nextFloor.spawn };
    this.revealFog(nextFloor, run.pos.x, run.pos.y);

    this.addFloatingText(`FLOOR ${run.floor}!`, run.pos.x, run.pos.y, '#3ecf8e');
    this.addLog(`🌀 Descended to Floor ${run.floor} (+150 Score)!`, 'system');

    if (graves.some(g => !g.ghostDefeated)) {
      this.addLog(`👻 You sense a restless ghost on Floor B${run.floor}…`, 'chain');
    }

    return nextFloor;
  }

  act(playerAddress: string, dir: Direction): { moved: boolean; hit: boolean; log: string } {
    const addr = this.normalizeAddress(playerAddress);
    const run = this.activeRunsByAddress.get(addr);
    if (!run || !run.active) {
      return { moved: false, hit: false, log: `No active run for ${addr}` };
    }

    const floor = this.getOrCreateFloor(run.dungeonSeed, run.floor);
    const nx = run.pos.x + dir.dx;
    const ny = run.pos.y + dir.dy;
    run.steps++;

    let playerActed = false;
    let hitEnemy = false;

    // 1. Attack enemy if one is in target tile
    const targetEnemy = floor.enemies.find(
      e => e.hp > 0 && e.pos.x === nx && e.pos.y === ny
    );

    if (targetEnemy) {
      targetEnemy.hp -= run.atk;
      targetEnemy.hitAnim = 1.0;
      this.screenShake = 5;
      playerActed = true;
      hitEnemy = true;
      sounds.playHit();

      this.addFloatingText(`-${run.atk}`, targetEnemy.pos.x, targetEnemy.pos.y, '#ffffff');

      if (targetEnemy.hp <= 0) {
        targetEnemy.hp = 0;
        const pts = targetEnemy.isGhost ? 250 : 100;
        run.score += pts;
        run.monstersSlain++;

        this.addFloatingText(`+${pts}`, targetEnemy.pos.x, targetEnemy.pos.y, '#3ecf8e');
        this.addLog(`💀 Defeated ${targetEnemy.name} (+${pts})`, targetEnemy.isGhost ? 'victory' : 'combat');

        if (targetEnemy.isGhost && targetEnemy.grave) {
          targetEnemy.grave.ghostDefeated = true;
          this.chainAdapter.onGravestonePersisted(targetEnemy.grave).catch(console.error);
          this.addLog(`✨ The fallen hero's ghost has been rested on-chain.`, 'chain');
        }
      }
    } else if (floor.isWalkable(nx, ny)) {
      // 2. Move to walkable tile
      run.pos.x = nx;
      run.pos.y = ny;
      this.revealFog(floor, nx, ny);
      playerActed = true;

      // Check gravestones in this tile
      const grave = floor.gravestones.find(
        g => g.pos.x === nx && g.pos.y === ny && !g.lootClaimed
      );
      if (grave) {
        grave.lootClaimed = true;
        run.score += 75;
        run.atk += 2;
        run.gravestonesLooted++;
        sounds.playLoot();

        this.addFloatingText('+75 SCORE & +2 ATK!', run.pos.x, run.pos.y, '#f5c451');
        this.addLog(
          `⚰️ Looted gravestone of ${this.shortAddress(grave.ownerAddress)} (+75 Score, +2 ATK)!`,
          'loot'
        );

        this.chainAdapter.onGravestonePersisted(grave).catch(console.error);
      }

      // Check tile events (Altar, Exit)
      const currentTile = floor.grid[ny][nx];
      if (currentTile === 2) {
        // Altar
        floor.grid[ny][nx] = 1;
        run.hp = Math.min(run.maxHp, run.hp + 25);
        run.atk += 4;
        run.score += 50;
        run.altarsUsed++;
        sounds.playAltar();

        this.addFloatingText('+25 HP, +4 ATK, +50', run.pos.x, run.pos.y, '#836ef9');
        this.addLog(`🔮 Altar: +25 HP, +4 ATK, +50 Score.`, 'loot');
      } else if (currentTile === 3) {
        // Exit Stairs
        this.descendToNextFloor(run);
        return { moved: true, hit: false, log: `Descended to Floor ${run.floor}` };
      }
    } else if (dir.dx === 0 && dir.dy === 0) {
      // Spacebar wait / rest turn
      playerActed = true;
    } else {
      return { moved: false, hit: false, log: 'Blocked by wall.' };
    }

    // 3. Enemy AI Turn
    if (playerActed) {
      for (const m of floor.enemies) {
        if (m.hp <= 0) continue;

        const dist = Math.abs(m.pos.x - run.pos.x) + Math.abs(m.pos.y - run.pos.y);
        if (dist === 1) {
          // Adjacent enemy attacks player
          run.hp -= m.atk;
          this.screenShake = 6;
          sounds.playPlayerHurt();

          this.addFloatingText(`-${m.atk}`, run.pos.x, run.pos.y, '#ff5d8f');
          this.addLog(`${m.name} hits you for ${m.atk}! (HP: ${Math.max(0, run.hp)}/${run.maxHp})`, 'combat');

          if (run.hp <= 0) {
            run.hp = 0;
            this.handleDeath(run, floor);
            return { moved: true, hit: hitEnemy, log: 'You died!' };
          }
        } else if (dist <= 6) {
          // Pathfind towards player
          const sx = m.pos.x + Math.sign(run.pos.x - m.pos.x);
          const sy = m.pos.y + Math.sign(run.pos.y - m.pos.y);

          // Try stepping horizontally or vertically towards player
          const moves = [
            { x: sx, y: m.pos.y },
            { x: m.pos.x, y: sy },
          ];

          for (const cand of moves) {
            if (
              floor.isWalkable(cand.x, cand.y) &&
              !(cand.x === run.pos.x && cand.y === run.pos.y) &&
              !floor.enemies.some(o => o !== m && o.hp > 0 && o.pos.x === cand.x && o.pos.y === cand.y) &&
              (cand.x !== m.pos.x || cand.y !== m.pos.y)
            ) {
              m.pos.x = cand.x;
              m.pos.y = cand.y;
              break;
            }
          }
        }
      }
    }

    return { moved: true, hit: hitEnemy, log: 'Turn completed.' };
  }

  extractAndCashOut(playerAddress: string): { payout: number; score: number } {
    const addr = this.normalizeAddress(playerAddress);
    const run = this.activeRunsByAddress.get(addr);
    if (!run || !run.active) {
      throw new Error(`No active run to cash out for ${addr}`);
    }

    run.active = false;
    this.activeRunsByAddress.delete(addr);

    run.score += 100; // Extraction bonus
    const payout = this.calculateCappedPayout(run.score);
    run.payoutMon = payout;

    sounds.playCashOut();
    this.addFloatingText(`+${payout.toFixed(2)} MON!`, run.pos.x, run.pos.y, '#3ecf8e');
    this.addLog(
      `🏆 Cashed out! Final Score: ${run.score} | Payout: ${payout.toFixed(2)} MON`,
      'victory'
    );

    this.recordLeaderboardAndPay(run, payout, false);
    return { payout, score: run.score };
  }

  private handleDeath(run: PlayerRun, floor: DungeonFloor) {
    run.active = false;
    this.activeRunsByAddress.delete(run.address);
    sounds.playDeath();

    const droppedLoot = ['Soul Ember', 'Monad Dagger (+2 ATK)'];

    // Create gravestone with EXACT seed and floor
    const grave: Gravestone = {
      id: `grave-${Date.now()}-${this.graveCounter++}`,
      ownerAddress: run.address,
      seed: run.dungeonSeed,
      floor: run.floor,
      pos: { ...run.pos },
      loot: droppedLoot,
      finalScore: run.score,
      diedAt: Date.now(),
      lootClaimed: false,
      ghostDefeated: false,
    };

    floor.gravestones.push(grave);
    const key = `${run.dungeonSeed}:${run.floor}`;
    if (!this.gravestonesByFloorKey.has(key)) {
      this.gravestonesByFloorKey.set(key, []);
    }
    this.gravestonesByFloorKey.get(key)!.push(grave);

    // Spawn Ghost for immediate feedback if game continues
    floor.enemies.push({
      id: `ghost-${grave.id}`,
      name: 'Ghost of ' + this.shortAddress(run.address),
      pos: { ...run.pos },
      renderPos: { ...run.pos },
      hp: 45 + run.floor * 10,
      maxHp: 45 + run.floor * 10,
      atk: 10 + run.floor * 3,
      isGhost: true,
      fallenPlayerAddress: run.address,
      hitAnim: 0,
      grave: grave,
    });

    const consolation = this.calculateCappedPayout(Math.floor(run.score / 2));
    run.payoutMon = consolation;

    this.addLog(
      `💀 YOU DIED on Floor ${run.floor}! Your gravestone & ghost now guard Floor B${run.floor} on Daily Seed ${run.dungeonSeed}.`,
      'death'
    );

    this.recordLeaderboardAndPay(run, consolation, true);

    // Trigger on-chain persistence
    this.chainAdapter.onGravestonePersisted(grave).catch(err => {
      console.error('onGravestonePersisted error:', err);
    });
  }

  public calculateCappedPayout(score: number): number {
    if (score <= 0 || this.prizePoolMon <= 0) return 0;
    let raw = score / 250;
    raw = Math.min(raw, MonadBlitzRoguelike.MAX_PAYOUT_PER_RUN_MON);
    raw = Math.min(raw, this.prizePoolMon);
    return Math.max(raw, 0);
  }

  private recordLeaderboardAndPay(run: PlayerRun, payout: number, died: boolean) {
    this.prizePoolMon = Math.max(0, this.prizePoolMon - payout);

    const existing = this.leaderboard.get(run.address);
    if (!existing) {
      this.leaderboard.set(run.address, {
        address: run.address,
        bestScore: run.score,
        highestFloor: run.floor,
        totalPayoutMon: payout,
        runsPlayed: 1,
        lastPlayed: Date.now(),
      });
    } else {
      existing.bestScore = Math.max(existing.bestScore, run.score);
      existing.highestFloor = Math.max(existing.highestFloor, run.floor);
      existing.totalPayoutMon += payout;
      existing.runsPlayed += 1;
      existing.lastPlayed = Date.now();
    }

    this.chainAdapter.onPayoutSettled(run.address, payout, run.score).catch(err => {
      console.error('onPayoutSettled error:', err);
    });
  }

  getLeaderboard(): LeaderboardEntry[] {
    return Array.from(this.leaderboard.values()).sort((a, b) => b.bestScore - a.bestScore);
  }

  addLog(text: string, type: CombatLogEntry['type']) {
    this.combatLogs.push({
      id: `log-${Date.now()}-${Math.random()}`,
      text,
      type,
      timestamp: Date.now(),
    });
    if (this.combatLogs.length > 30) {
      this.combatLogs.shift();
    }
  }

  addFloatingText(text: string, x: number, y: number, color: string) {
    this.floatingTexts.push({
      id: `float-${Date.now()}-${Math.random()}`,
      text,
      x,
      y,
      color,
      createdAt: Date.now(),
      duration: 1000,
    });
  }

  private normalizeAddress(address: string): string {
    return address ? address.trim().toLowerCase() : '0x0000000000000000000000000000000000000000';
  }

  private shortAddress(address: string): string {
    const n = this.normalizeAddress(address);
    return n.length <= 12 ? n : `${n.substring(0, 6)}…${n.substring(n.length - 4)}`;
  }
}
