'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { MonadBlitzRoguelike } from '../engine/game';
import { Web3ChainAdapter, MockChainAdapter } from '../engine/chainAdapter';
import {
  type Direction,
  type PlayerRun,
  type DungeonFloor,
  type LeaderboardEntry,
  type CombatLogEntry,
  type FloatingText,
  getDailySeed,
} from '../engine/types';

export function useGame(walletClient: any, address: string | null, isDemoMode: boolean) {
  const engineRef = useRef<MonadBlitzRoguelike | null>(null);

  const [activeRun, setActiveRun] = useState<PlayerRun | null>(null);
  const [currentFloor, setCurrentFloor] = useState<DungeonFloor | null>(null);
  const [prizePool, setPrizePool] = useState<number>(25.0);
  const [combatLogs, setCombatLogs] = useState<CombatLogEntry[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);
  const [gameOverStats, setGameOverStats] = useState<{
    score: number;
    floor: number;
    seed: number;
    payout: number;
    died: boolean;
    txHash?: string;
  } | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState(0);
  const [tick, setTick] = useState(0);

  // Initialize engine
  useEffect(() => {
    const effectiveAddress = address || '0x4f2a8931ebc89d2149b109';
    const adapter =
      walletClient && !isDemoMode
        ? new Web3ChainAdapter(walletClient, effectiveAddress)
        : new MockChainAdapter();

    const engine = new MonadBlitzRoguelike(adapter);
    engineRef.current = engine;
    setPrizePool(engine.getPrizePoolMon());
    setCombatLogs([...engine.combatLogs]);

    const existingRun = engine.getActiveRun(effectiveAddress);
    if (existingRun && existingRun.active) {
      setActiveRun({ ...existingRun });
      const floor = engine.getCurrentFloor(effectiveAddress);
      if (floor) setCurrentFloor(floor);
    }
  }, [walletClient, address, isDemoMode]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 2800);
  }, []);

  const syncState = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const effAddr = address || '0x4f2a8931ebc89d2149b109';
    const run = engine.getActiveRun(effAddr);
    setActiveRun(run ? { ...run } : null);

    const floor = engine.getCurrentFloor(effAddr);
    setCurrentFloor(floor ? floor : null);

    setPrizePool(engine.getPrizePoolMon());
    setCombatLogs([...engine.combatLogs]);
    setFloatingTexts([...engine.floatingTexts]);
    setScreenShake(engine.screenShake);
    setTick(t => t + 1);
  }, [address]);

  const startNewRun = useCallback(
    async (customSeed?: number) => {
      const engine = engineRef.current;
      if (!engine) return;

      const effAddr = address || '0x4f2a8931ebc89d2149b109';
      try {
        // ALWAYS use the deterministic daily seed!
        const seed = customSeed ?? getDailySeed();
        await engine.startRun(effAddr, seed);
        syncState();
        showToast(`⚡ Run Started · Daily Seed ${seed} · 1 MON Escrowed`);
      } catch (e: any) {
        showToast(e.message || 'Failed to start run');
      }
    },
    [address, syncState, showToast]
  );

  const handleAction = useCallback(
    (dir: Direction) => {
      const engine = engineRef.current;
      if (!engine) return;

      const effAddr = address || '0x4f2a8931ebc89d2149b109';
      const runBefore = engine.getActiveRun(effAddr);
      if (!runBefore || !runBefore.active) return;

      engine.act(effAddr, dir);
      syncState();

      // Check if player died during action
      const runAfter = engine.getActiveRun(effAddr);
      if (runBefore && (!runAfter || !runAfter.active)) {
        setGameOverStats({
          score: runBefore.score,
          floor: runBefore.floor,
          seed: runBefore.dungeonSeed,
          payout: runBefore.payoutMon,
          died: true,
        });
        setIsGameOverModalOpen(true);
      }
    },
    [address, syncState]
  );

  const handleCashOut = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;

    const effAddr = address || '0x4f2a8931ebc89d2149b109';
    const run = engine.getActiveRun(effAddr);
    if (!run || !run.active) return;

    try {
      const { payout, score } = engine.extractAndCashOut(effAddr);
      syncState();
      setGameOverStats({
        score,
        floor: run.floor,
        seed: run.dungeonSeed,
        payout,
        died: false,
      });
      setIsGameOverModalOpen(true);
      showToast(`🏆 Cashed out ${payout.toFixed(2)} MON!`);
    } catch (e: any) {
      showToast(e.message || 'Cash out failed');
    }
  }, [address, syncState, showToast]);

  const getLeaderboard = useCallback((): LeaderboardEntry[] => {
    return engineRef.current ? engineRef.current.getLeaderboard() : [];
  }, []);

  return {
    engine: engineRef.current,
    activeRun,
    currentFloor,
    prizePool,
    combatLogs,
    floatingTexts,
    toastMessage,
    toastVisible,
    isGameOverModalOpen,
    setIsGameOverModalOpen,
    gameOverStats,
    isLeaderboardOpen,
    setIsLeaderboardOpen,
    isHelpOpen,
    setIsHelpOpen,
    screenShake,
    startNewRun,
    handleAction,
    handleCashOut,
    getLeaderboard,
    showToast,
    tick,
  };
}
