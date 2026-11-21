'use client';

interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  if (!visible || !message) return null;

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-3">
      <div className="bg-[#0f172a]/95 border border-purple-500/60 shadow-2xl shadow-purple-950/80 px-4 py-2.5 rounded-xl flex items-center gap-2.5 backdrop-blur-md">
        <span className="text-purple-400 font-bold text-sm">⚡</span>
        <span className="font-mono text-xs text-slate-100 font-medium">
          {message}
        </span>
      </div>
    </div>
  );
}
