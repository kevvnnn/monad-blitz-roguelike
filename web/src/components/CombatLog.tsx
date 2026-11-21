'use client';

import { type CombatLogEntry } from '../engine/types';

interface CombatLogProps {
  logs: CombatLogEntry[];
}

export default function CombatLog({ logs }: CombatLogProps) {
  const getLogColor = (type: CombatLogEntry['type']) => {
    switch (type) {
      case 'combat':
        return 'text-slate-300';
      case 'loot':
        return 'text-amber-300';
      case 'system':
        return 'text-cyan-300';
      case 'chain':
        return 'text-purple-300';
      case 'victory':
        return 'text-emerald-400 font-bold';
      case 'death':
        return 'text-red-400 font-bold';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="h-28 bg-[#090d16] border-t border-slate-800 p-2.5 overflow-y-auto font-mono text-[11px] select-text">
      <div className="flex flex-col-reverse gap-1">
        {logs.length === 0 ? (
          <div className="text-slate-600 italic">Adventure log will appear here...</div>
        ) : (
          logs.map(log => (
            <div key={log.id} className={`${getLogColor(log.type)} leading-tight`}>
              <span className="text-slate-600 mr-2">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>
              <span>{log.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
