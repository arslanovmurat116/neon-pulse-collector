
import React, { useState, useEffect, useRef, useCallback } from "react";
import { GameStatus, Particle, Point, ParticleType } from "./types";
import { COLORS, INITIAL_ENERGY, ENERGY_DECAY, ENERGY_GAIN, SPAWN_RATE, BONUS_DURATION } from "./constants";
import { WalletConnect } from "./components/WalletConnect";
import { PaymentShop } from "./components/PaymentShop";

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(INITIAL_ENERGY);
  const [isMuted, setIsMuted] = useState(false);
  const [activeBonuses, setActiveBonuses] = useState({ shield: 0, magnet: 0 });
  
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('neon-pulse-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  const audioCtx = useRef<AudioContext | null>(null);

  const gameState = useRef({
    particles: [] as Particle[],
    playerPos: { x: window.innerWidth / 2, y: window.innerHeight / 2 } as Point,
    frame: 0,
    energy: INITIAL_ENERGY,
    score: 0,
    bonuses: { shield: 0, magnet: 0 },
    dpr: window.devicePixelRatio || 1
  });

  const playSound = (type: 'collect' | 'hit' | 'bonus' | 'start') => {
    if (isMuted) return;
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtx.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      switch (type) {
        case 'collect':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start();
          osc.stop(now + 0.1);
          break;
        case 'bonus':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(1320, now + 0.3);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          osc.start();
          osc.stop(now + 0.3);
          break;
        case 'hit':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.linearRampToValueAtTime(40, now + 0.4);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
          osc.start();
          osc.stop(now + 0.4);
          break;
        case 'start':
          osc.type = 'square';
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
  };

  const resetGame = useCallback(() => {
    gameState.current = {
      ...gameState.current,
      particles: [],
      playerPos: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      frame: 0,
      energy: INITIAL_ENERGY,
      score: 0,
      bonuses: { shield: 0, magnet: 0 }
    };
    setEnergy(INITIAL_ENERGY);
    setScore(0);
    setActiveBonuses({ shield: 0, magnet: 0 });
    setStatus(GameStatus.PLAYING);
    playSound('start');
  }, [isMuted]);

  const togglePause = useCallback(() => {
    setStatus(prev => {
      if (prev === GameStatus.PLAYING) return GameStatus.PAUSED;
      if (prev === GameStatus.PAUSED) return GameStatus.PLAYING;
      return prev;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') togglePause();
      if (e.key === 'm' || e.key === 'M') setIsMuted(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePause]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      gameState.current.dpr = dpr;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const updatePlayerPos = (x: number, y: number) => {
      if (status === GameStatus.PLAYING) {
        gameState.current.playerPos = { x, y };
      }
    };

    const handleMouseMove = (e: MouseEvent) => updatePlayerPos(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePlayerPos(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    let animationId: number;

    const spawnParticle = (width: number, height: number) => {
      const typeRand = Math.random();
      let type: ParticleType = 'decoration';
      let color = COLORS.DECO;
      
      if (typeRand > 0.98) {
        type = Math.random() > 0.5 ? 'shield' : 'magnet';
        color = type === 'shield' ? COLORS.SHIELD : COLORS.MAGNET;
      } else if (typeRand > 0.85) {
        type = 'hazard';
        color = COLORS.HAZARD;
      } else if (typeRand > 0.4) {
        type = 'energy';
        color = COLORS.ENERGY;
      }

      const side = Math.floor(Math.random() * 4);
      let x = 0, y = 0;
      const margin = 50;

      if (side === 0) { x = Math.random() * width; y = -margin; }
      else if (side === 1) { x = width + margin; y = Math.random() * height; }
      else if (side === 2) { x = Math.random() * width; y = height + margin; }
      else { x = -margin; y = Math.random() * height; }

      const angle = Math.atan2(height / 2 - y, width / 2 - x) + (Math.random() - 0.5);
      const baseSpeed = 1.5 + (width < 600 ? 0.5 : 0);
      const speed = baseSpeed + Math.random() * 2 + (gameState.current.score / 500);

      gameState.current.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: (type === 'hazard' || type === 'shield' || type === 'magnet') ? 10 + Math.random() * 5 : 5 + Math.random() * 4,
        color,
        type,
        pulse: 0
      });
    };

    const update = () => {
      if (status !== GameStatus.PLAYING) return;

      gameState.current.frame++;
      gameState.current.energy -= ENERGY_DECAY;
      setEnergy(Math.max(0, gameState.current.energy));

      if (gameState.current.bonuses.shield > 0) gameState.current.bonuses.shield--;
      if (gameState.current.bonuses.magnet > 0) gameState.current.bonuses.magnet--;
      
      if (gameState.current.frame % 10 === 0) {
        setActiveBonuses({
          shield: gameState.current.bonuses.shield,
          magnet: gameState.current.bonuses.magnet
        });
      }

      if (gameState.current.energy <= 0) {
        playSound('hit');
        setStatus(GameStatus.GAMEOVER);
      }

      const currentSpawnRate = SPAWN_RATE + (gameState.current.score / 10000);
      if (Math.random() < currentSpawnRate) {
        spawnParticle(window.innerWidth, window.innerHeight);
      }

      gameState.current.particles = gameState.current.particles.filter(p => {
        if (gameState.current.bonuses.magnet > 0 && p.type === 'energy') {
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
        
        // Dynamic collision distance for shield
        const baseColDist = 12;
        const shieldActive = gameState.current.bonuses.shield > 0;
        const colDist = p.radius + (shieldActive && p.type === 'hazard' ? 25 : baseColDist);

        if (dist < colDist) {
          if (p.type === 'energy') {
            gameState.current.energy = Math.min(100, gameState.current.energy + ENERGY_GAIN);
            gameState.current.score += 10;
            setScore(gameState.current.score);
            playSound('collect');
            return false;
          } else if (p.type === 'hazard') {
            if (shieldActive) {
              gameState.current.score += 5;
              setScore(gameState.current.score);
              // Give extra visual punch when destroying hazard with shield
              playSound('collect'); 
              return false;
            } else {
              playSound('hit');
              setStatus(GameStatus.GAMEOVER);
              return false;
            }
          } else if (p.type === 'shield') {
            gameState.current.bonuses.shield = BONUS_DURATION;
            playSound('bonus');
            return false;
          } else if (p.type === 'magnet') {
            gameState.current.bonuses.magnet = BONUS_DURATION;
            playSound('bonus');
            return false;
          }
        }

        return p.x > -200 && p.x < window.innerWidth + 200 && p.y > -200 && p.y < window.innerHeight + 200;
      });
    };

    const draw = () => {
      ctx.fillStyle = COLORS.BG;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      gameState.current.particles.forEach(p => {
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

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationId);
    };
  }, [status, isMuted]);

  useEffect(() => {
    if (status === GameStatus.GAMEOVER && score > highScore) {
      setHighScore(score);
      localStorage.setItem('neon-pulse-highscore', score.toString());
    }
  }, [status, score, highScore]);

  return (
    <div className="relative w-full h-full font-sans selection:bg-blue-500 selection:text-white overflow-hidden bg-slate-950">
      <canvas ref={canvasRef} className="block w-full h-full cursor-none" />

      {/* HUD - Responsive Layout */}
      <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex flex-col md:flex-row justify-between items-center md:items-start pointer-events-none select-none gap-4">
        <div className="flex flex-col items-center md:items-start gap-1 pointer-events-auto">
          <div className="text-white text-2xl md:text-3xl font-black tracking-tighter drop-shadow-lg flex items-center gap-3">
            <span>SCORE: <span className="text-blue-400">{score}</span></span>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 bg-slate-800/60 rounded-xl hover:bg-slate-700/80 transition-colors text-lg"
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              <button 
                onClick={togglePause}
                className="p-2 bg-slate-800/60 rounded-xl hover:bg-slate-700/80 transition-colors text-lg"
              >
                {status === GameStatus.PAUSED ? '▶️' : '⏸️'}
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
          </div>
        </div>
        
        <div className="w-full max-w-[200px] md:max-w-[256px] h-3 md:h-4 bg-slate-900/60 rounded-full border border-slate-700/30 overflow-hidden backdrop-blur-sm relative">
          <div 
            className="h-full transition-all duration-100 ease-linear"
            style={{ 
              width: `${energy}%`,
              backgroundColor: energy > 30 ? COLORS.ENERGY : COLORS.HAZARD,
              boxShadow: `0 0 12px ${energy > 30 ? COLORS.ENERGY : COLORS.HAZARD}`
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-white/40 uppercase tracking-[0.2em]">Energy</div>
        </div>
      </div>

      {/* Overlays */}
      {status === GameStatus.START && (
  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl z-50 p-4">
    <div className="p-6 md:p-10 bg-slate-900/60 border border-slate-800 rounded-[2.5rem] shadow-2xl max-w-4xl w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="text-center md:text-left">
          <div className="mb-6 inline-block p-5 bg-blue-600/10 rounded-3xl border border-blue-500/20">
            <div className="w-14 h-14 bg-blue-500 rounded-full animate-pulse shadow-[0_0_30px_#3b82f6]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">
            NEON PULSE
          </h1>
          <div className="text-slate-400 mb-6 space-y-2 text-sm md:text-base">
            <p>Collect energy to stay alive.</p>
            <p>Avoid hazards and grab shields or magnets.</p>
            <p>Unlock boosts with TON payments.</p>
          </div>
          <button
            onClick={resetGame}
            className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-[0_10px_30px_rgba(37,99,235,0.3)] text-lg"
          >
            Start Game
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-slate-900/70 border border-slate-700/50 rounded-2xl p-5">
            <h2 className="text-lg font-bold text-white mb-3">Wallet</h2>
            <WalletConnect />
          </div>
          <PaymentShop />
        </div>
      </div>
    </div>
  </div>
)}

      {status === GameStatus.PAUSED && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-md z-40 p-4">
          <div className="text-center p-8 bg-slate-900/40 border border-slate-800/50 rounded-[2.5rem] max-w-sm w-full">
            <h2 className="text-5xl font-black text-white mb-6 italic tracking-tighter drop-shadow-2xl">PAUSED</h2>
            
            <div className="text-slate-400 mb-8 space-y-3 text-sm border-y border-slate-800/50 py-6">
              <p className="font-bold text-white uppercase tracking-widest text-xs mb-2">Правила:</p>
              <p>Собирайте <span className="text-green-400 font-bold">энергию</span>.</p>
              <p>Избегайте <span className="text-red-500 font-bold">разломов</span>.</p>
              <p>Ищите <span className="text-pink-400 font-bold">щиты</span> и <span className="text-purple-400 font-bold">магниты</span>.</p>
            </div>

            <button 
              onClick={togglePause}
              className="w-full px-14 py-5 bg-white text-slate-950 font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all text-lg shadow-2xl"
            >
              ПРОДОЛЖИТЬ
            </button>
          </div>
        </div>
      )}

      {status === GameStatus.GAMEOVER && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-950/30 backdrop-blur-lg z-50 p-4">
          <div className="text-center p-8 md:p-12 bg-slate-900/80 border border-red-900/30 rounded-[2.5rem] shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-300">
            <h2 className="text-4xl md:text-5xl font-black text-red-500 mb-4 tracking-tighter uppercase">ПОРАЖЕНИЕ</h2>
            <div className="text-white mb-10 flex flex-col gap-1">
              <span className="text-sm text-slate-400 uppercase tracking-widest">Результат</span>
              <span className="text-4xl font-black text-blue-400">{score}</span>
              {score >= highScore && score > 0 && <span className="text-yellow-400 text-xs font-bold animate-bounce mt-3 uppercase tracking-widest">Новый рекорд!</span>}
            </div>
            <button 
              onClick={resetGame}
              className="w-full px-8 py-5 bg-white text-slate-950 hover:bg-slate-200 font-bold rounded-2xl transition-all active:scale-95 shadow-xl text-lg"
            >
              ПЕРЕЗАГРУЗКА
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

