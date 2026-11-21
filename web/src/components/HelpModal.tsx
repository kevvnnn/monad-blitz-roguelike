'use client';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📖</span>
            <div>
              <h2 className="text-xl font-mono font-bold text-slate-100">
                Monad Blitz Roguelike Guide
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Gameplay rules & on-chain social persistence architecture
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto my-4 pr-1 text-xs font-mono space-y-4 text-slate-300 leading-relaxed">
          <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl">
            <h3 className="text-sm font-bold text-purple-300 mb-1">
              🎮 How Blockchain Makes Roguelikes Social
            </h3>
            <p className="text-slate-400 text-[11px]">
              Traditional roguelikes discard your dead runs. In Monad Blitz Roguelike,
              your death is immortalized on-chain. When you die, your gravestone, dropped
              loot, and an AI-controlled ghost spawn in that exact location for future
              players exploring the same dungeon seed!
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-2">🕹️ Controls</h3>
            <ul className="space-y-1 list-disc list-inside text-slate-400">
              <li><strong className="text-slate-200">WASD / Arrow Keys</strong>: Move in 4 directions or bump-attack enemies.</li>
              <li><strong className="text-slate-200">Spacebar / Period</strong>: Wait a turn (let enemies step closer).</li>
              <li><strong className="text-slate-200">Touch D-Pad</strong>: Available on mobile/tablet viewports.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-2">🗺️ Dungeon Icons</h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-cyan-400 font-bold text-sm">@</span>
                <span>You (The Adventurer)</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-emerald-400 font-bold text-sm">▼</span>
                <span>Stairs to Deeper Floor (+150 Pts)</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-purple-400 font-bold text-sm">⚡</span>
                <span>Monad Altar (+25 HP, +4 ATK)</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-amber-400 font-bold text-sm">📦</span>
                <span>Chest (Weapons & Potions)</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-bold text-sm">⚰️</span>
                <span>Gravestone (Loot fallen player gear)</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="text-purple-300 font-bold text-sm">👻</span>
                <span>Player Ghost (+250 Pts Ghost Slayer)</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-2">💰 Prize Pool & Payouts</h3>
            <p className="text-slate-400 text-[11px]">
              Each run escrows 0.1 MON into the contract prize pool. When you extract,
              you earn payouts based on your score (<code className="text-amber-400">Score / 250 MON</code>, capped at 5 MON per run). Even if you die, you receive a consolation payout!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition font-mono text-xs font-bold"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}
