'use client';

import { type LeaderboardEntry } from '../engine/types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LeaderboardEntry[];
}

export default function LeaderboardModal({
  isOpen,
  onClose,
  entries,
}: LeaderboardModalProps) {
  if (!isOpen) return null;

  const shortAddr = (addr: string) => {
    if (!addr) return '0x0000';
    return addr.length <= 12 ? addr : `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏆</span>
            <div>
              <h2 className="text-xl font-mono font-bold text-slate-100">
                Monad Hall of Heroes
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Verified high scores and total prize pool payouts on Monad Testnet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition font-mono"
          >
            ✕
          </button>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto my-4 pr-1">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-sm">
              No brave souls have entered the dungeon yet. Be the first!
            </div>
          ) : (
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/80">
                  <th className="pb-2.5 pl-2">Rank</th>
                  <th className="pb-2.5">Hero Address</th>
                  <th className="pb-2.5 text-center">Floor</th>
                  <th className="pb-2.5 text-right">Best Score</th>
                  <th className="pb-2.5 text-right pr-2">Total Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {entries.map((entry, index) => {
                  const isTop3 = index < 3;
                  const medal =
                    index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                  return (
                    <tr
                      key={entry.address + index}
                      className={`hover:bg-slate-800/40 transition ${
                        index === 0 ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="py-3 pl-2 font-bold text-slate-300">{medal}</td>
                      <td className="py-3 text-purple-300 font-medium">
                        {shortAddr(entry.address)}
                      </td>
                      <td className="py-3 text-center text-emerald-400">
                        B{entry.highestFloor || 1}
                      </td>
                      <td className="py-3 text-right font-bold text-cyan-400">
                        {entry.bestScore}
                      </td>
                      <td className="py-3 text-right pr-2 text-amber-400 font-bold">
                        {entry.totalPayoutMon.toFixed(2)} MON
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs font-mono text-slate-500">
          <span>Contract: 0x7A12...A11C • Monad Testnet (10143)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
