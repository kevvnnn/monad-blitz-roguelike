'use client';

import { useEffect, useRef } from 'react';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  CELL_SIZE,
  DIRECTIONS,
  type DungeonFloor,
  type PlayerRun,
  type FloatingText,
  type Direction,
} from '../engine/types';

interface GameCanvasProps {
  run: PlayerRun | null;
  floor: DungeonFloor | null;
  floatingTexts: FloatingText[];
  onAction: (dir: Direction) => void;
  onStartRun: () => void;
  shake?: number;
}

export default function GameCanvas({
  run,
  floor,
  floatingTexts,
  onAction,
  onStartRun,
  shake = 0,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const currentShakeRef = useRef(0);

  // Key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const key = e.key.toLowerCase();
      let dir: Direction | null = null;

      switch (key) {
        case 'arrowup':
        case 'w':
          dir = DIRECTIONS.UP;
          break;
        case 'arrowdown':
        case 's':
          dir = DIRECTIONS.DOWN;
          break;
        case 'arrowleft':
        case 'a':
          dir = DIRECTIONS.LEFT;
          break;
        case 'arrowright':
        case 'd':
          dir = DIRECTIONS.RIGHT;
          break;
        case ' ':
        case '.':
          dir = DIRECTIONS.STAY; // Wait / Rest
          break;
        default:
          return;
      }

      if (dir) {
        e.preventDefault();
        onAction(dir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAction]);

  useEffect(() => {
    if (shake > 0) currentShakeRef.current = shake;
  }, [shake]);

  // Main 60fps Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext('2d');
    if (!g) return;

    const T = CELL_SIZE; // 32
    canvas.width = MAP_WIDTH * T;
    canvas.height = MAP_HEIGHT * T;

    // Pseudo-random hash for decorative floor/wall specks
    const hs = (x: number, y: number) => {
      const h = Math.imul(x * 374761393 + y * 668265263, 1274126177);
      return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
    };

    const isVisible = (x: number, y: number, px: number, py: number) => {
      return (x - px) ** 2 + (y - py) ** 2 <= 49;
    };

    const render = (time: number) => {
      g.clearRect(0, 0, canvas.width, canvas.height);

      if (!floor || !run) {
        renderTitleScreen(g, canvas.width, canvas.height, time);
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      g.save();

      // Screen shake
      if (currentShakeRef.current > 0) {
        g.translate(
          (Math.random() - 0.5) * currentShakeRef.current,
          (Math.random() - 0.5) * currentShakeRef.current
        );
        currentShakeRef.current *= 0.8;
        if (currentShakeRef.current < 0.3) currentShakeRef.current = 0;
      }

      // Smooth player interpolation
      run.renderPos.x += (run.pos.x - run.renderPos.x) * 0.35;
      run.renderPos.y += (run.pos.y - run.renderPos.y) * 0.35;

      // 1. Draw Map Tiles
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          const isSeen = floor.seenTiles.has(`${x},${y}`);
          if (!isSeen) continue;

          const px = x * T;
          const py = y * T;
          const h = hs(x, y);
          const t = floor.grid[y][x];

          if (t === 0) {
            // Wall (Reference design)
            g.fillStyle = '#211942';
            g.fillRect(px, py, T, T);
            g.fillStyle = '#2b2155';
            g.fillRect(px, py, T, T - 8);
            g.fillStyle = '#120d26';
            g.fillRect(px, py + T - 8, T, 8);
            g.fillStyle = '#352a68';
            g.fillRect(px, py + T / 2 - 8, T, 2);
            g.fillRect(px + (h < 0.5 ? 10 : 20), py, 2, T / 2 - 8);
          } else {
            // Floor
            g.fillStyle = (x + y) & 1 ? '#2a2150' : '#2f2559';
            g.fillRect(px, py, T, T);
            if (h > 0.8) {
              g.fillStyle = '#3a2f70';
              g.fillRect(px + 8 + h * 10, py + 10, 3, 3);
            }

            // Altar (tile === 2)
            if (t === 2) {
              const a = 0.6 + 0.3 * Math.sin(time / 300);
              g.fillStyle = `rgba(131, 110, 249, ${a})`;
              g.beginPath();
              g.moveTo(px + 16, py + 4);
              g.lineTo(px + 28, py + 16);
              g.lineTo(px + 16, py + 28);
              g.lineTo(px + 4, py + 16);
              g.fill();
              g.fillStyle = '#e9e4ff';
              g.fillRect(px + 14, py + 14, 4, 4);
            }

            // Exit Stairs (tile === 3)
            if (t === 3) {
              g.fillStyle = '#0b0818';
              g.fillRect(px + 3, py + 3, 26, 26);
              g.fillStyle = '#836ef9';
              for (let i = 0; i < 4; i++) {
                g.fillRect(px + 5 + i * 3, py + 6 + i * 6, 22 - i * 6, 3);
              }
            }
          }

          // Fog of war shadow if seen but not currently visible
          if (!isVisible(x, y, run.pos.x, run.pos.y)) {
            g.fillStyle = 'rgba(8, 5, 20, 0.6)';
            g.fillRect(px, py, T, T);
          }
        }
      }

      // 2. Draw Gravestones (Reference HTML gravestone styling!)
      floor.gravestones.forEach(q => {
        // Gravestones show if tile has been seen or is visible
        const isSeen = floor.seenTiles.has(`${q.pos.x},${q.pos.y}`);
        if (!isSeen && !isVisible(q.pos.x, q.pos.y, run.pos.x, run.pos.y)) return;

        const px = q.pos.x * T;
        const py = q.pos.y * T;

        // Gravestone slab
        g.fillStyle = q.lootClaimed ? '#525464' : '#8d8fa3';
        g.beginPath();
        g.moveTo(px + 8, py + 28);
        g.lineTo(px + 8, py + 14);
        g.arc(px + 16, py + 14, 8, Math.PI, 0);
        g.lineTo(px + 24, py + 28);
        g.fill();

        // Engraved cross
        g.fillStyle = '#3a3b4d';
        g.fillRect(px + 15, py + 12, 2, 9);
        g.fillRect(px + 12, py + 15, 8, 2);

        // Nameplate banner & Loot indicator
        if (isVisible(q.pos.x, q.pos.y, run.pos.x, run.pos.y)) {
          g.fillStyle = '#e9d5ff';
          g.font = 'bold 9px monospace';
          g.textAlign = 'center';
          const shortAddr = q.ownerAddress.length > 10 ? q.ownerAddress.slice(0, 6) + '…' : q.ownerAddress;
          g.fillText(`⚰️ ${shortAddr}`, px + 16, py + 4);

          if (!q.lootClaimed) {
            g.fillStyle = '#f5c451';
            g.beginPath();
            g.arc(px + 24, py + 25, 3.5, 0, Math.PI * 2);
            g.fill();
          }
        }
      });

      // 3. Draw Enemies & Ghosts (Reference HTML body styling)
      floor.enemies.forEach(m => {
        if (m.hp <= 0) return;

        // Smooth enemy movement interpolation
        m.renderPos.x += (m.pos.x - m.renderPos.x) * 0.3;
        m.renderPos.y += (m.pos.y - m.renderPos.y) * 0.3;
        if (m.hitAnim > 0) m.hitAnim -= 0.08;

        if (!isVisible(m.pos.x, m.pos.y, run.pos.x, run.pos.y)) return;

        const px = m.renderPos.x * T;
        const py = m.renderPos.y * T + Math.sin(time / 260 + m.pos.x) * 2;

        if (m.isGhost) {
          // Floating Ghost Body (Reference HTML)
          g.globalAlpha = 0.75;
          g.fillStyle = '#b9a7ff';
          g.beginPath();
          g.arc(px + 16, py + 14, 10, Math.PI, 0);
          g.lineTo(px + 26, py + 28);
          for (let i = 0; i < 3; i++) {
            g.lineTo(px + 22 - i * 6, py + 24 + (i & 1 ? 0 : 4));
          }
          g.lineTo(px + 6, py + 28);
          g.fill();

          // Dark hollow eyes
          g.fillStyle = '#26215c';
          g.fillRect(px + 11, py + 12, 3, 4);
          g.fillRect(px + 18, py + 12, 3, 4);
          g.globalAlpha = 1;

          // Ghost title
          g.fillStyle = '#e9d5ff';
          g.font = '9px monospace';
          g.textAlign = 'center';
          g.fillText(m.name.replace('Ghost of ', '👻 '), px + 16, py - 4);
        } else {
          // Normal Monster (Reference HTML Shard Fiend)
          g.fillStyle = m.hitAnim > 0 ? '#ffffff' : '#ff5d8f';
          g.beginPath();
          g.moveTo(px + 16, py + 3);
          g.lineTo(px + 27, py + 14);
          g.lineTo(px + 22, py + 28);
          g.lineTo(px + 10, py + 28);
          g.lineTo(px + 5, py + 14);
          g.fill();

          g.fillStyle = '#ffb3cc';
          g.beginPath();
          g.moveTo(px + 16, py + 3);
          g.lineTo(px + 12, py + 16);
          g.lineTo(px + 16, py + 26);
          g.lineTo(px + 20, py + 16);
          g.fill();

          g.fillStyle = '#2a0a18';
          g.fillRect(px + 11, py + 14, 3, 3);
          g.fillRect(px + 18, py + 14, 3, 3);
        }

        // Enemy Health Bar
        if (m.hp < m.maxHp) {
          g.fillStyle = '#000000';
          g.fillRect(px + 4, py - 5, 24, 4);
          g.fillStyle = m.isGhost ? '#b9a7ff' : '#ff5d8f';
          g.fillRect(px + 4, py - 5, (24 * m.hp) / m.maxHp, 4);
        }
      });

      // 4. Draw Player Character (Reference HTML Warrior styling)
      const px = run.renderPos.x * T;
      const py = run.renderPos.y * T + Math.sin(time / 300) * 1.5;

      g.fillStyle = '#836ef9';
      g.beginPath();
      g.moveTo(px + 8, py + 10);
      g.lineTo(px + 24, py + 10);
      g.lineTo(px + 28, py + 29);
      g.lineTo(px + 4, py + 29);
      g.fill();

      g.fillStyle = '#e9e4ff';
      g.fillRect(px + 10, py + 6, 12, 20);
      g.fillStyle = '#22d3ee';
      g.fillRect(px + 12, py + 11, 8, 4);
      g.fillStyle = '#e9e4ff';
      g.fillRect(px + 13, py + 2, 6, 5);

      // 5. Radial Torchlight Gradient (Reference HTML)
      const rg = g.createRadialGradient(
        run.renderPos.x * T + 16,
        run.renderPos.y * T + 16,
        70,
        run.renderPos.x * T + 16,
        run.renderPos.y * T + 16,
        230
      );
      rg.addColorStop(0, 'rgba(8, 5, 20, 0)');
      rg.addColorStop(1, 'rgba(8, 5, 20, 0.58)');
      g.fillStyle = rg;
      g.fillRect(0, 0, canvas.width, canvas.height);

      // 6. Floating Text (Combat / Loot)
      const now = Date.now();
      for (const f of floatingTexts) {
        const age = now - f.createdAt;
        if (age < f.duration) {
          const progress = age / f.duration;
          const fx = f.x * T + 16;
          const fy = f.y * T - progress * 24;
          const alpha = 1 - progress;

          g.save();
          g.globalAlpha = Math.max(0, alpha);
          g.fillStyle = f.color;
          g.font = 'bold 13px ui-monospace, Menlo, Consolas, monospace';
          g.textAlign = 'center';
          g.fillText(f.text, fx, fy);
          g.restore();
        }
      }

      g.restore();
      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [run, floor, floatingTexts]);

  const renderTitleScreen = (
    g: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: number
  ) => {
    g.fillStyle = '#05030d';
    g.fillRect(0, 0, w, h);

    const floatY = Math.sin(time / 400) * 6;

    g.save();
    g.shadowColor = '#836ef9';
    g.shadowBlur = 24;
    g.fillStyle = '#836ef9';
    g.font = 'bold 32px ui-monospace, Menlo, Consolas, monospace';
    g.textAlign = 'center';
    g.fillText('BLITZ ROGUELIKE', w / 2, h / 2 - 40 + floatY);
    g.restore();

    g.fillStyle = '#9a90c8';
    g.font = '14px ui-monospace, Menlo, Consolas, monospace';
    g.textAlign = 'center';
    g.fillText('Everyone explores the same dungeon today.', w / 2, h / 2 + floatY);
    g.fillText(
      'Die, and your ghost guards your loot for the next player.',
      w / 2,
      h / 2 + 24 + floatY
    );
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-3 relative select-none">
      <div className="relative border-2 border-[#2d2450] rounded-xl overflow-hidden shadow-2xl bg-[#05030d]">
        <canvas ref={canvasRef} className="block cursor-crosshair" />

        {/* Start Run Overlay if no active run */}
        {!run && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
            <button
              onClick={onStartRun}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-base rounded-xl shadow-xl shadow-purple-950 border border-purple-400/40 flex items-center gap-3 transition transform hover:scale-105 active:scale-95"
            >
              <span>⚔️</span>
              <span>ENTER DUNGEON · 1 MON</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
