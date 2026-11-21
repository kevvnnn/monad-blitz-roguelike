'use client';

import { useState } from 'react';
import { sounds } from '../engine/audio';

interface HUDProps {
  hp: number;
  maxHp: number;
  atk: number;
  floor: number;
  score: number;
  prizePool: number;
  seed: number;
  gravestonesCount?: number;
  isDemoMode: boolean;
  onOpenLeaderboard: () => void;
  onOpenHelp: () => void;
}

export default function HUD({
  hp,
  maxHp,
  atk,
  floor,
  score,
  prizePool,
  seed,
  gravestonesCount = 0,
  isDemoMode,
  onOpenLeaderboard,
  onOpenHelp,
}: HUDProps) {
  const [audioEnabled, setAudioEnabled] = useState(sounds.enabled);

  const toggleAudio = () => {
    sounds.enabled = !sounds.enabled;
    setAudioEnabled(sounds.enabled);
  };

  const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    <header className="h-14 bg-[#0e0b1a] border-b border-[#2d2450] flex items-center justify-between px-4 z-20 select-none shadow-md">
      {/* Left: Player Stats */}
      <div className="flex items-center gap-4">
        {/* HP Bar */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-bold text-[#ff5d8f]">HP</span>
          <div className="w-28 sm:w-36 h-3 bg-[#2a1530] rounded-full overflow-hidden border border-[#2d2450] p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                hpPct > 50
                  ? 'bg-[#3ecf8e]'
                  : hpPct > 25
                  ? 'bg-[#f5c451]'
                  : 'bg-[#ff5d8f] animate-pulse'
              }`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-[#ece8ff] min-w-[50px]">
            {hp} / {maxHp}
          </span>
        </div>

        {/* ATK */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#171229] rounded-lg border border-[#2d2450]">
          <span className="text-xs text-[#f5c451]">⚔️</span>
          <span className="text-xs font-mono text-[#ece8ff]">{atk} ATK</span>
        </div>

        {/* Floor */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#171229] rounded-lg border border-[#2d2450]">
          <span className="text-xs text-[#9a90c8]">Floor</span>
          <span className="text-sm font-mono font-bold text-[#3ecf8e]">{floor}</span>
        </div>

        {/* Gravestones on this floor badge */}
        {gravestonesCount > 0 && (
          <div
            className="flex items-center gap-1.5 px-3 py-1 bg-purple-950/60 rounded-lg border border-[#836ef9]/60 animate-pulse"
            title="There are player gravestones and ghosts on this floor!"
          >
            <span className="text-xs">⚰️</span>
            <span className="text-xs font-mono font-bold text-[#b9a7ff]">
              {gravestonesCount} Gravestone{gravestonesCount > 1 ? 's' : ''} Here!
            </span>
          </div>
        )}

        {/* Score */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#171229] rounded-lg border border-[#2d2450]">
          <span className="text-xs text-[#9a90c8]">Score</span>
          <span className="text-sm font-mono font-bold text-[#22d3ee]">{score}</span>
        </div>

        {/* Prize Pool */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[#171229] rounded-lg border border-[#2d2450]">
          <span className="text-xs text-[#9a90c8]">Pool</span>
          <span className="text-sm font-mono font-bold text-[#f5c451]">
            {prizePool.toFixed(2)} MON
          </span>
        </div>
      </div>

      {/* Right: Quick actions & network mode */}
      <div className="flex items-center gap-2.5">
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-[#171229] rounded-full border border-[#2d2450] text-xs">
          <span className="font-mono text-[#9a90c8]">Daily Seed {seed}</span>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={toggleAudio}
          title={audioEnabled ? 'Mute SFX' : 'Unmute SFX'}
          className="p-1.5 bg-[#171229] hover:bg-[#241b45] text-[#ece8ff] rounded-lg border border-[#2d2450] transition"
        >
          {audioEnabled ? '🔊' : '🔇'}
        </button>

        {/* Leaderboard button */}
        <button
          onClick={onOpenLeaderboard}
          className="px-2.5 py-1.5 bg-[#171229] hover:bg-[#241b45] text-[#ece8ff] text-xs font-mono rounded-lg border border-[#2d2450] transition flex items-center gap-1"
        >
          <span>🏆</span>
          <span className="hidden sm:inline">Leaderboard</span>
        </button>

        {/* Help button */}
        <button
          onClick={onOpenHelp}
          className="p-1.5 bg-[#171229] hover:bg-[#241b45] text-[#ece8ff] text-xs font-mono rounded-lg border border-[#2d2450] transition"
          title="Game Guide & Monad Mechanics"
        >
          ❓
        </button>
      </div>
    </header>
  );
}
