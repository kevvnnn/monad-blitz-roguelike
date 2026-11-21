'use client';

import { DIRECTIONS, type Direction, type PlayerRun } from '../engine/types';

interface ActionControlsProps {
  run: PlayerRun | null;
  onAction: (dir: Direction) => void;
  onStartRun: () => void;
  onCashOut: () => void;
}

export default function ActionControls({
  run,
  onAction,
  onStartRun,
  onCashOut,
}: ActionControlsProps) {
  const isActive = Boolean(run && run.active);
  const potentialPayout = run ? Math.min(run.score / 250, 5.0) : 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 bg-[#0f172a] border-t border-slate-800">
      {/* Left: Inventory & Quick Stats */}
      <div className="flex items-center gap-2 overflow-x-auto max-w-full text-xs">
        <span className="text-slate-400 font-mono">Backpack:</span>
        {run && run.inventory.length > 0 ? (
          run.inventory.map((item, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-slate-800/80 border border-slate-700 text-slate-300 rounded font-mono whitespace-nowrap"
            >
              💎 {item}
            </span>
          ))
        ) : (
          <span className="text-slate-500 italic font-mono">Empty</span>
        )}
      </div>

      {/* Center: Main Game Actions */}
      <div className="flex items-center gap-2">
        {!isActive ? (
          <button
            onClick={onStartRun}
            className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-sm rounded-lg shadow-lg shadow-purple-950 border border-purple-400/30 transition transform hover:scale-102 active:scale-98 flex items-center gap-2"
          >
            <span>⚡</span>
            <span>Start Run (0.1 MON)</span>
          </button>
        ) : (
          <>
            <button
              onClick={() => onAction(DIRECTIONS.STAY)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono rounded-lg transition"
              title="Skip turn / Wait (Spacebar)"
            >
              ⏳ Wait (Space)
            </button>

            <button
              onClick={onCashOut}
              className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/30 text-white text-xs font-mono font-bold rounded-lg shadow-md transition flex items-center gap-1.5 transform hover:scale-102 active:scale-98"
            >
              <span>💰</span>
              <span>Cash Out ({potentialPayout.toFixed(3)} MON)</span>
            </button>
          </>
        )}
      </div>

      {/* Right: On-screen D-Pad for Mobile */}
      <div className="flex sm:hidden items-center gap-1">
        <button
          onClick={() => onAction(DIRECTIONS.LEFT)}
          className="w-8 h-8 bg-slate-800 border border-slate-700 rounded text-slate-200 active:bg-slate-700 flex items-center justify-center font-bold"
        >
          ◀
        </button>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onAction(DIRECTIONS.UP)}
            className="w-8 h-8 bg-slate-800 border border-slate-700 rounded text-slate-200 active:bg-slate-700 flex items-center justify-center font-bold"
          >
            ▲
          </button>
          <button
            onClick={() => onAction(DIRECTIONS.DOWN)}
            className="w-8 h-8 bg-slate-800 border border-slate-700 rounded text-slate-200 active:bg-slate-700 flex items-center justify-center font-bold"
          >
            ▼
          </button>
        </div>
        <button
          onClick={() => onAction(DIRECTIONS.RIGHT)}
          className="w-8 h-8 bg-slate-800 border border-slate-700 rounded text-slate-200 active:bg-slate-700 flex items-center justify-center font-bold"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
