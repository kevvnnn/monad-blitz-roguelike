'use client';

import { useEffect } from 'react';

interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  stats: {
    score: number;
    floor: number;
    seed: number;
    payout: number;
    died: boolean;
    txHash?: string;
  } | null;
}

export default function GameOverModal({
  isOpen,
  onClose,
  onPlayAgain,
  stats,
}: GameOverModalProps) {
  useEffect(() => {
    if (isOpen && stats && !stats.died) {
      import('canvas-confetti')
        .then(mod => {
          const confetti = mod.default || mod;
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#836ef9', '#3ecf8e', '#f5c451', '#ff5d8f'],
          });
        })
        .catch(() => {});
    }
  }, [isOpen, stats]);

  if (!isOpen || !stats) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#171229] border border-[#2d2450] w-full max-w-md rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div
          className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-30 ${
            stats.died ? 'bg-[#ff5d8f]' : 'bg-[#3ecf8e]'
          }`}
        />

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">{stats.died ? '💀' : '🏆'}</div>
          <h2
            className={`text-2xl font-mono font-bold ${
              stats.died ? 'text-[#ff5d8f]' : 'text-[#3ecf8e]'
            }`}
          >
            {stats.died ? 'You Died' : 'Cashed Out'}
          </h2>
          <div className="text-slate-300 text-sm font-mono mt-1">
            Score <b>{stats.score}</b> · Floor <b>{stats.floor}</b>
          </div>
          <div className="text-[#f5c451] text-lg font-mono font-bold mt-1">
            Payout {stats.payout.toFixed(2)} MON
          </div>
        </div>

        {/* Graveyard / Persistence explanation */}
        <div className="p-3 bg-[#0e0b1a] border border-[#2d2450] rounded-xl mb-6 text-xs font-mono leading-relaxed">
          {stats.died ? (
            <div className="text-[#b9a7ff]">
              ⚰️ <strong>Your gravestone and ghost now guard Floor B{stats.floor}</strong> on Daily Seed {stats.seed}.
              <div className="text-slate-400 mt-1 text-[11px]">
                When you or another player descends back to <strong>Floor B{stats.floor}</strong> today, your gravestone and ghost will be waiting to be looted and challenged!
              </div>
            </div>
          ) : (
            <div className="text-slate-300">
              You escaped the dungeon with your loot! Your score has been verified and settled on the Monad leaderboard.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onClose();
              onPlayAgain();
            }}
            className="flex-1 py-3 bg-[#836ef9] hover:bg-[#725cf5] text-white font-mono font-bold text-sm rounded-xl shadow-lg transition transform hover:scale-102"
          >
            ⚔️ Run Again · 1 MON
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 bg-[#241b45] hover:bg-[#2d2256] text-slate-300 font-mono text-sm rounded-xl border border-[#2d2450] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
