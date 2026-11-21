'use client';

import HUD from '../components/HUD';
import GameCanvas from '../components/GameCanvas';
import ActionControls from '../components/ActionControls';
import CombatLog from '../components/CombatLog';
import Toast from '../components/Toast';
import GameOverModal from '../components/GameOverModal';
import LeaderboardModal from '../components/LeaderboardModal';
import HelpModal from '../components/HelpModal';
import { useWallet } from '../hooks/useWallet';
import { useGame } from '../hooks/useGame';
import { getDailySeed } from '../engine/types';

export default function Page() {
  const { walletClient, address, isConnected, isDemoMode, setIsDemoMode, connect, disconnect, error } =
    useWallet();

  const game = useGame(walletClient, address, isDemoMode);

  const shortAddress = (addr: string | null) => {
    if (!addr) return '';
    return addr.length <= 12 ? addr : `${addr.substring(0, 6)}…${addr.substring(addr.length - 4)}`;
  };

  const dailySeed = game.activeRun ? game.activeRun.dungeonSeed : getDailySeed();

  return (
    <main className="w-full h-screen bg-[#0e0b1a] text-[#ece8ff] flex flex-col overflow-hidden font-mono">
      {/* 1. Top HUD */}
      <HUD
        hp={game.activeRun ? game.activeRun.hp : 100}
        maxHp={game.activeRun ? game.activeRun.maxHp : 100}
        atk={game.activeRun ? game.activeRun.atk : 22}
        floor={game.activeRun ? game.activeRun.floor : 1}
        score={game.activeRun ? game.activeRun.score : 0}
        prizePool={game.prizePool}
        seed={dailySeed}
        gravestonesCount={game.currentFloor ? game.currentFloor.gravestones.length : 0}
        isDemoMode={isDemoMode}
        onOpenLeaderboard={() => game.setIsLeaderboardOpen(true)}
        onOpenHelp={() => game.setIsHelpOpen(true)}
      />

      {/* 2. Middle Game Canvas */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#05030d]">
        <GameCanvas
          run={game.activeRun}
          floor={game.currentFloor}
          floatingTexts={game.floatingTexts}
          onAction={game.handleAction}
          onStartRun={() => game.startNewRun(dailySeed)}
          shake={game.screenShake}
        />

        {/* Floating Toast */}
        <Toast message={game.toastMessage} visible={game.toastVisible} />
      </div>

      {/* 3. Action Controls */}
      <ActionControls
        run={game.activeRun}
        onAction={game.handleAction}
        onStartRun={() => game.startNewRun(dailySeed)}
        onCashOut={game.handleCashOut}
      />

      {/* 4. Live Adventure / Combat Feed */}
      <CombatLog logs={game.combatLogs} />

      {/* 5. Bottom Status Bar */}
      <footer className="h-10 bg-[#0e0b1a] border-t border-[#2d2450] flex items-center justify-between px-4 text-xs font-mono text-[#9a90c8]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#836ef9]" />
            <strong className="text-[#ece8ff]">Monad Testnet</strong> (10143)
          </span>
          <span className="hidden md:inline text-[#2d2450]">|</span>
          <span className="hidden md:inline text-[#9a90c8]">Daily Seed: {dailySeed}</span>
          <span className="hidden md:inline text-[#2d2450]">|</span>
          <span className="hidden md:inline text-[#9a90c8]">Move: WASD / Arrows · Space: Wait</span>
        </div>

        <div className="flex items-center gap-3">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="text-[#3ecf8e] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#3ecf8e] animate-pulse" />
                <span>{shortAddress(address)}</span>
              </span>
              <button
                onClick={disconnect}
                className="text-[10px] text-[#9a90c8] hover:text-[#ece8ff] underline"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={connect}
                className="px-2.5 py-1 bg-[#836ef9] hover:bg-[#725cf5] text-white rounded font-medium transition text-xs flex items-center gap-1"
              >
                <span>🦊</span>
                <span>Connect Wallet</span>
              </button>
              <button
                onClick={() => setIsDemoMode(!isDemoMode)}
                className={`text-[10px] px-2 py-0.5 rounded border ${
                  isDemoMode
                    ? 'border-[#f5c451]/50 text-[#f5c451] bg-[#f5c451]/10'
                    : 'border-[#2d2450] text-[#9a90c8]'
                }`}
                title="Toggle simulated testnode mode"
              >
                {isDemoMode ? 'Demo Mode Active' : 'Enable Demo Mode'}
              </button>
            </div>
          )}
          {error && <span className="text-[#ff5d8f] text-[11px] truncate max-w-xs">{error}</span>}
        </div>
      </footer>

      {/* Modals */}
      <GameOverModal
        isOpen={game.isGameOverModalOpen}
        onClose={() => game.setIsGameOverModalOpen(false)}
        onPlayAgain={() => game.startNewRun(dailySeed)}
        stats={game.gameOverStats}
      />

      <LeaderboardModal
        isOpen={game.isLeaderboardOpen}
        onClose={() => game.setIsLeaderboardOpen(false)}
        entries={game.getLeaderboard()}
      />

      <HelpModal
        isOpen={game.isHelpOpen}
        onClose={() => game.setIsHelpOpen(false)}
      />
    </main>
  );
}
