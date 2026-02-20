import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameStatus, Particle, Point, ParticleType } from "@/game/types";
import {
  BONUS_DURATION,
  COLORS,
  ENERGY_DECAY,
  ENERGY_GAIN,
  INITIAL_ENERGY,
  SPAWN_RATE,
} from "@/game/constants";
import type { PlayerUpgrades } from "@/utils/playerUpgrades";

type GameScreenProps = {
  upgrades: PlayerUpgrades;
  onGameOver?: (score: number) => void;
  active?: boolean;
};

export const GameScreen: React.FC<GameScreenProps> = ({
  upgrades,
  onGameOver,
  active = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(INITIAL_ENERGY);
  const [isMuted, setIsMuted] = useState(false);
  const [activeBonuses, setActiveBonuses] = useState({ shield: 0, magnet: 0 });
  const [highScore, setHighScore] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const audioCtx = useRef<AudioContext | null>(null);
  const gameState = useRef({
    particles: [] as Particle[],
    playerPos: { x: 0, y: 0 } as Point,
    frame: 0,
    energy: INITIAL_ENERGY,
    score: 0,
    bonuses: { shield: 0, magnet: 0 },
    maxEnergy: INITIAL_ENERGY,
    dpr: 1,
  });

  const prevEnergyBonus = useRef(upgrades.energyBonus);
  const reportedGameOver = useRef(false);
  const loopActive = useRef(false);
  const activeRef = useRef(active);
  const statusRef = useRef<GameStatus>(GameStatus.START);
  const sizeRef = useRef({ width: 0, height: 0 });
  const upgradesRef = useRef(upgrades);
  const fullscreenRequestedRef = useRef(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    console.log("[GAME] mounted");
    return () => {
      console.log("[GAME] unmounted");
    };
  }, []);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    upgradesRef.current = upgrades;
  }, [upgrades]);

  useEffect(() => {
    if (!mounted) return;
    try {
      const saved = localStorage.getItem("neon-pulse-highscore");
      setHighScore(saved ? parseInt(saved, 10) : 0);
    } catch {
      setHighScore(0);
    }
  }, [mounted]);

  const maxEnergy = useMemo(
    () => Math.max(10, INITIAL_ENERGY + upgrades.energyBonus),
    [upgrades.energyBonus]
  );

  useEffect(() => {
    gameState.current.maxEnergy = maxEnergy;
    setEnergy((prev) => Math.min(prev, maxEnergy));
  }, [maxEnergy]);

  useEffect(() => {
    const delta = upgrades.energyBonus - prevEnergyBonus.current;
    if (delta > 0) {
      gameState.current.energy = Math.min(
        gameState.current.maxEnergy,
        gameState.current.energy + delta
      );
      setEnergy(gameState.current.energy);
    }
    prevEnergyBonus.current = upgrades.energyBonus;
  }, [upgrades.energyBonus]);

  const playSound = useCallback(
    (type: "collect" | "hit" | "bonus" | "start") => {
      if (isMuted) return;
      try {
        if (!audioCtx.current) {
          audioCtx.current = new (window.AudioContext ||
            (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
        }
        const ctx = audioCtx.current;
        if (ctx.state === "suspended") ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        switch (type) {
          case "collect":
            osc.type = "triangle";
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start();
            osc.stop(now + 0.1);
            break;
          case "bonus":
            osc.type = "sine";
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(1320, now + 0.3);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start();
            osc.stop(now + 0.3);
            break;
          case "hit":
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(40, now + 0.4);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
            osc.start();
            osc.stop(now + 0.4);
            break;
          case "start":
            osc.type = "square";
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.setValueAtTime(330, now + 0.1);
            osc.frequency.setValueAtTime(440, now + 0.2);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start();
            osc.stop(now + 0.3);
            break;
        }
      } catch (e) {
        console.warn("Audio Context error", e);
      }
    },
    [isMuted]
  );


  const requestTelegramFullscreen = useCallback(() => {
    if (fullscreenRequestedRef.current) return;
    fullscreenRequestedRef.current = true;
    try {
      const tg = (window as typeof window & { Telegram?: { WebApp?: any } }).Telegram?.WebApp;
      tg?.expand?.();
      if (tg?.isVersionAtLeast?.("8.0")) tg.requestFullscreen?.();
    } catch (error) {
      console.warn("[GAME] fullscreen request failed", error);
    }
  }, []);

  const resetGame = useCallback(() => {
    requestTelegramFullscreen();
    const centerX = size.width / 2;
    const centerY = size.height / 2;
    gameState.current = {
      ...gameState.current,
      particles: [],
      playerPos: { x: centerX, y: centerY },
      frame: 0,
      energy: maxEnergy,
      score: 0,
      bonuses: { shield: 0, magnet: 0 },
      maxEnergy,
    };
    setEnergy(maxEnergy);
    setScore(0);
    setActiveBonuses({ shield: 0, magnet: 0 });
    setStatus(GameStatus.PLAYING);
    reportedGameOver.current = false;
    playSound("start");
  }, [maxEnergy, playSound, requestTelegramFullscreen, size.height, size.width]);

  const togglePause = useCallback(() => {
    setStatus((prev) => {
      if (prev === GameStatus.PLAYING) return GameStatus.PAUSED;
      if (prev === GameStatus.PAUSED) return GameStatus.PLAYING;
      return prev;
    });
  }, []);



  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onFirstPointerDown = () => {
      requestTelegramFullscreen();
    };

    canvas.addEventListener("pointerdown", onFirstPointerDown, { once: true });
    return () => {
      canvas.removeEventListener("pointerdown", onFirstPointerDown);
    };
  }, [mounted, requestTelegramFullscreen]);

  useEffect(() => {
    if (!active) return;

    const preventTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    const container = containerRef.current;
    container?.addEventListener("touchmove", preventTouchMove, { passive: false });
    document.body.addEventListener("touchmove", preventTouchMove, { passive: false });

    return () => {
      container?.removeEventListener("touchmove", preventTouchMove);
      document.body.removeEventListener("touchmove", preventTouchMove);
    };
  }, [active]);

  useEffect(() => {
    if (!mounted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "p" || e.key === "P") togglePause();
      if (e.key === "m" || e.key === "M") setIsMuted((prev) => !prev);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mounted, togglePause]);

  useEffect(() => {
    if (!mounted) return;
    const el = containerRef.current;
    if (!el) return;
    let raf = 0;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const next = { width: Math.max(1, rect.width), height: Math.max(1, rect.height) };
        sizeRef.current = next;
        setSize(next);
      });
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const applySize = () => {
      const { width, height } = sizeRef.current;
      if (!width || !height) return;
      const dpr = window.devicePixelRatio || 1;
      gameState.current.dpr = dpr;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    applySize();

    const updatePlayerPos = (clientX: number, clientY: number) => {
      if (statusRef.current !== GameStatus.PLAYING) return;
      const rect = canvas.getBoundingClientRect();
      const { width, height } = sizeRef.current;
      const x = Math.min(Math.max(clientX - rect.left, 0), width);
      const y = Math.min(Math.max(clientY - rect.top, 0), height);
      gameState.current.playerPos = { x, y };
    };

    const handleMouseMove = (e: MouseEvent) => updatePlayerPos(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePlayerPos(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    let animationId: number;

    const spawnParticle = (width: number, height: number) => {
      const typeRand = Math.random();
      let type: ParticleType = "decoration";
      let color = COLORS.DECO;
      const bonusBoost = Math.min(
        0.06,
        (upgradesRef.current.shieldBoost + upgradesRef.current.magnetBoost) * 0.01
      );

      if (typeRand > 0.98 - bonusBoost) {
        type = Math.random() > 0.5 ? "shield" : "magnet";
        color = type === "shield" ? COLORS.SHIELD : COLORS.MAGNET;
      } else if (typeRand > 0.85) {
        type = "hazard";
        color = COLORS.HAZARD;
      } else if (typeRand > 0.4) {
        type = "energy";
        color = COLORS.ENERGY;
      }

      const side = Math.floor(Math.random() * 4);
      let x = 0;
      let y = 0;
      const margin = 50;

      if (side === 0) {
        x = Math.random() * width;
        y = -margin;
      } else if (side === 1) {
        x = width + margin;
        y = Math.random() * height;
      } else if (side === 2) {
        x = Math.random() * width;
        y = height + margin;
      } else {
        x = -margin;
        y = Math.random() * height;
      }

      const angle = Math.atan2(height / 2 - y, width / 2 - x) + (Math.random() - 0.5);
      const baseSpeed = 1.5 + (width < 600 ? 0.5 : 0);
      const speed = baseSpeed + Math.random() * 2 + gameState.current.score / 500;

      gameState.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius:
          type === "hazard" || type === "shield" || type === "magnet"
            ? 10 + Math.random() * 5
            : 5 + Math.random() * 4,
        color,
        type,
        pulse: 0,
      });
    };

    const shieldDuration = () => BONUS_DURATION + upgradesRef.current.shieldBoost * 120;
    const magnetDuration = () => BONUS_DURATION + upgradesRef.current.magnetBoost * 120;
    const maxParticles = () => 120 + upgradesRef.current.ballsBonus;

    const update = () => {
      if (statusRef.current !== GameStatus.PLAYING) return;
      if (!activeRef.current) return;

      gameState.current.frame++;
      gameState.current.energy -= ENERGY_DECAY;
      setEnergy(Math.max(0, gameState.current.energy));

      if (gameState.current.bonuses.shield > 0) gameState.current.bonuses.shield--;
      if (gameState.current.bonuses.magnet > 0) gameState.current.bonuses.magnet--;

      if (gameState.current.frame % 10 === 0) {
        setActiveBonuses({
          shield: gameState.current.bonuses.shield,
          magnet: gameState.current.bonuses.magnet,
        });
      }

      if (gameState.current.energy <= 0) {
        playSound("hit");
        setStatus(GameStatus.GAMEOVER);
      }

      const currentSpawnRate = SPAWN_RATE + gameState.current.score / 10000;
      if (Math.random() < currentSpawnRate && gameState.current.particles.length < maxParticles()) {
        const { width, height } = sizeRef.current;
        spawnParticle(width, height);
      }

      gameState.current.particles = gameState.current.particles.filter((p) => {
        if (gameState.current.bonuses.magnet > 0 && p.type === "energy") {
          const dx = gameState.current.playerPos.x - p.x;
          const dy = gameState.current.playerPos.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 250) {
            p.vx += (dx / dist) * 0.6;
            p.vy += (dy / dist) * 0.6;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        p.pulse = (p.pulse || 0) + 0.1;

        const dx = p.x - gameState.current.playerPos.x;
        const dy = p.y - gameState.current.playerPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const baseColDist = 12;
        const shieldActive = gameState.current.bonuses.shield > 0;
        const colDist = p.radius + (shieldActive && p.type === "hazard" ? 25 : baseColDist);

        if (dist < colDist) {
          if (p.type === "energy") {
            gameState.current.energy = Math.min(
              gameState.current.maxEnergy,
              gameState.current.energy + ENERGY_GAIN
            );
            gameState.current.score += 10;
            setScore(gameState.current.score);
            playSound("collect");
            return false;
          }
          if (p.type === "hazard") {
            if (shieldActive) {
              gameState.current.score += 5;
              setScore(gameState.current.score);
              playSound("collect");
              return false;
            }
            playSound("hit");
            setStatus(GameStatus.GAMEOVER);
            return false;
          }
          if (p.type === "shield") {
            gameState.current.bonuses.shield = shieldDuration();
            playSound("bonus");
            return false;
          }
          if (p.type === "magnet") {
            gameState.current.bonuses.magnet = magnetDuration();
            playSound("bonus");
            return false;
          }
        }

        const { width, height } = sizeRef.current;
        return p.x > -200 && p.x < width + 200 && p.y > -200 && p.y < height + 200;
      });
    };

    const draw = () => {
      if (!activeRef.current) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      const { width, height } = sizeRef.current;
      ctx.fillStyle = COLORS.BG;
      ctx.fillRect(0, 0, width, height);

      gameState.current.particles.forEach((p) => {
        ctx.beginPath();
        const pulseAmt = Math.sin(p.pulse || 0) * 2;
        ctx.arc(p.x, p.y, p.radius + pulseAmt, 0, Math.PI * 2);
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.closePath();
      });

      const { x, y } = gameState.current.playerPos;

      if (gameState.current.bonuses.shield > 0) {
        ctx.beginPath();
        ctx.arc(x, y, 25 + Math.sin(Date.now() / 100) * 3, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.SHIELD;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.SHIELD;
        ctx.stroke();
      }

      if (gameState.current.bonuses.magnet > 0) {
        ctx.beginPath();
        ctx.arc(x, y, 40 + Math.sin(Date.now() / 150) * 10, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.MAGNET;
        ctx.setLineDash([5, 10]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.shadowBlur = 20;
      ctx.shadowColor = COLORS.PLAYER;
      ctx.fillStyle = COLORS.PLAYER;
      ctx.fill();
      ctx.closePath();

      ctx.beginPath();
      ctx.strokeStyle = COLORS.PLAYER;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.2;
      ctx.arc(x, y, 25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(() => {
        update();
        draw();
      });
    };

    if (!loopActive.current) {
      loopActive.current = true;
      console.log("[GAME] loop started");
    }
    draw();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      cancelAnimationFrame(animationId);
      if (loopActive.current) {
        loopActive.current = false;
        console.log("[GAME] loop stopped");
      }
    };
  }, [mounted, playSound, size.height, size.width]);

  useEffect(() => {
    if (status === GameStatus.GAMEOVER && score > highScore) {
      setHighScore(score);
      localStorage.setItem("neon-pulse-highscore", score.toString());
    }
    if (status === GameStatus.GAMEOVER && !reportedGameOver.current) {
      reportedGameOver.current = true;
      onGameOver?.(score);
    }
  }, [status, score, highScore, onGameOver]);

  const energyColor = useMemo(() => (energy > 30 ? COLORS.ENERGY : COLORS.HAZARD), [energy]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="game-container relative w-full h-full font-sans selection:bg-blue-500 selection:text-white overflow-hidden bg-slate-950"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      <div className="absolute top-0 left-0 w-full pt-16 md:pt-20 px-3 md:px-4 flex flex-col md:flex-row justify-between items-center md:items-start pointer-events-none select-none gap-3">
        <div className="flex flex-col items-center md:items-start gap-1 pointer-events-auto">
          <div className="text-white text-xl md:text-2xl font-black tracking-tighter drop-shadow-lg flex items-center gap-3">
            <span>
              SCORE: <span className="text-blue-400">{score}</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="px-2 py-1 bg-slate-800/60 rounded-lg hover:bg-slate-700/80 transition-colors text-xs"
              >
                {isMuted ? "Muted" : "Sound"}
              </button>
              <button
                onClick={togglePause}
                className="px-2 py-1 bg-slate-800/60 rounded-lg hover:bg-slate-700/80 transition-colors text-xs"
              >
                {status === GameStatus.PAUSED ? "Resume" : "Pause"}
              </button>
            </div>
          </div>
          <div className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">
            High Score: {highScore}
          </div>

          <div className="flex gap-2 mt-2">
            {activeBonuses.shield > 0 && (
              <div className="px-3 py-1 bg-pink-500/20 border border-pink-400/40 rounded-full text-pink-400 text-[9px] font-black uppercase tracking-widest animate-pulse backdrop-blur-sm">
                Shield {Math.ceil(activeBonuses.shield / 60)}s
              </div>
            )}
            {activeBonuses.magnet > 0 && (
              <div className="px-3 py-1 bg-purple-500/20 border border-purple-400/40 rounded-full text-purple-400 text-[9px] font-black uppercase tracking-widest animate-pulse backdrop-blur-sm">
                Magnet {Math.ceil(activeBonuses.magnet / 60)}s
              </div>
            )}
            <div className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-full text-slate-300 text-[9px] font-black uppercase tracking-widest">
              Max balls: {120 + upgrades.ballsBonus}
            </div>
          </div>
        </div>

        <div className="w-full max-w-[200px] md:max-w-[256px] h-3 md:h-4 bg-slate-900/60 rounded-full border border-slate-700/30 overflow-hidden backdrop-blur-sm relative">
          <div
            className="h-full transition-all duration-100 ease-linear"
            style={{
              width: `${(energy / maxEnergy) * 100}%`,
              backgroundColor: energyColor,
              boxShadow: `0 0 12px ${energyColor}`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-white/40 uppercase tracking-[0.2em]">
            Energy
          </div>
        </div>
      </div>

      {status === GameStatus.START && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl z-50 p-4">
          <div className="p-6 md:p-8 bg-slate-900/60 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full text-center">
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
              Neon Pulse
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              Collect energy, avoid hazards, and unlock upgrades with TON.
            </p>
            <button
              onClick={resetGame}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all active:scale-95"
            >
              Start Game
            </button>
          </div>
        </div>
      )}

      {status === GameStatus.PAUSED && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-md z-40 p-4">
          <div className="text-center p-6 bg-slate-900/40 border border-slate-800/50 rounded-2xl max-w-sm w-full">
            <h2 className="text-3xl font-black text-white mb-4">Paused</h2>
            <button
              onClick={togglePause}
              className="w-full px-6 py-3 bg-white text-slate-950 font-bold rounded-xl hover:scale-105 active:scale-95 transition-all"
            >
              Resume
            </button>
          </div>
        </div>
      )}

      {status === GameStatus.GAMEOVER && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-950/30 backdrop-blur-lg z-50 p-4">
          <div className="text-center p-6 bg-slate-900/80 border border-red-900/30 rounded-2xl shadow-2xl max-w-sm w-full">
            <h2 className="text-3xl font-black text-red-400 mb-4 tracking-tight">Game Over</h2>
            <div className="text-white mb-6">
              <div className="text-xs text-slate-400 uppercase tracking-widest">Score</div>
              <div className="text-3xl font-black text-blue-400">{score}</div>
              {score >= highScore && score > 0 && (
                <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest mt-2">
                  New record
                </div>
              )}
            </div>
            <button
              onClick={resetGame}
              className="w-full px-6 py-3 bg-white text-slate-950 hover:bg-slate-200 font-bold rounded-xl transition-all active:scale-95"
            >
              Restart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
