
import React, { useEffect, useRef, useState } from 'react';
import { GameState, Particle, Obstacle } from '../types';
import { 
  WORLD_WIDTH, TRACK_LENGTH, GRAVITY, BRAKE_FORCE, 
  MAX_SPEED, MIN_SPEED, BLADDER_MAX, PRESSURE_GROWTH, 
  TOILET_POSITION, COLORS, LATERAL_SPEED, COLLISION_RADIUS 
} from '../constants';

interface GameViewProps {
  onGameOver: (state: GameState, score?: number) => void;
}

const PLAYER_VISUAL_Y = 200; 

const GameView: React.FC<GameViewProps> = ({ onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pressure, setPressure] = useState(0);
  const [distance, setDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);

  const gameStateRef = useRef<GameState>(GameState.PLAYING);
  const pressureRef = useRef(0);
  const distanceRef = useRef(0);
  const speedRef = useRef(MIN_SPEED);
  const playerLateralXRef = useRef(WORLD_WIDTH / 2);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const lastSpawnDistanceRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number>();

  const createParticles = (x: number, y: number, color: string, count: number, spread: number = 10) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * spread,
        vy: (Math.random() - 0.5) * spread,
        life: 1,
        color
      });
    }
  };

  const handleInput = (e: React.PointerEvent) => {
    if (gameStateRef.current !== GameState.PLAYING) return;
    
    speedRef.current = Math.max(MIN_SPEED, speedRef.current - BRAKE_FORCE);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const tapX = e.clientX - rect.left;
      if (tapX < rect.width / 2) {
        playerLateralXRef.current = Math.max(60, playerLateralXRef.current - LATERAL_SPEED);
      } else {
        playerLateralXRef.current = Math.min(WORLD_WIDTH - 60, playerLateralXRef.current + LATERAL_SPEED);
      }
    }
    createParticles(playerLateralXRef.current, PLAYER_VISUAL_Y + 15, '#ffffff', 10, 4);
  };

  const update = () => {
    if (gameStateRef.current !== GameState.PLAYING) return;

    speedRef.current = Math.min(MAX_SPEED, speedRef.current + GRAVITY);
    distanceRef.current += speedRef.current;
    pressureRef.current += PRESSURE_GROWTH;

    setPressure(pressureRef.current);
    setDistance(distanceRef.current);
    setCurrentSpeed(speedRef.current);

    if (distanceRef.current - lastSpawnDistanceRef.current > 150) {
      if (Math.random() < 0.6 && distanceRef.current < TOILET_POSITION - 800) {
        obstaclesRef.current.push({
          id: Date.now() + Math.random(),
          x: 70 + Math.random() * (WORLD_WIDTH - 140),
          y: distanceRef.current + 1000,
          type: Math.random() > 0.5 ? 'tree' : 'rock'
        });
      }
      lastSpawnDistanceRef.current = distanceRef.current;
    }

    const playerY_in_world = distanceRef.current + PLAYER_VISUAL_Y; 
    for (const obs of obstaclesRef.current) {
        const dx = obs.x - playerLateralXRef.current;
        const dy = obs.y - playerY_in_world;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < COLLISION_RADIUS + 10) {
            gameStateRef.current = GameState.CRASHED;
            createParticles(playerLateralXRef.current, PLAYER_VISUAL_Y, COLORS.BLOOD, 60, 15);
            onGameOver(GameState.CRASHED);
            return;
        }
    }

    obstaclesRef.current = obstaclesRef.current.filter(obs => obs.y > distanceRef.current - 200);

    // 判定逻辑
    if (pressureRef.current >= BLADDER_MAX) {
      gameStateRef.current = GameState.EXPLODED;
      createParticles(playerLateralXRef.current, PLAYER_VISUAL_Y, COLORS.EXPLOSION, 60, 15);
      onGameOver(GameState.EXPLODED);
      return;
    }

    // 厕所精确碰撞判定
    const toiletYInWorld = TOILET_POSITION;
    const verticalDistToToilet = toiletYInWorld - playerY_in_world;

    // 当滑雪者坐标接近厕所中心 Y 坐标时进行判定
    if (verticalDistToToilet < 30 && verticalDistToToilet > -30) {
      const horizontalDist = Math.abs(playerLateralXRef.current - WORLD_WIDTH / 2);
      // 厕所宽度 80px，判断玩家是否在中心 40px 范围内
      if (horizontalDist < 40) {
        if (speedRef.current > MAX_SPEED * 0.45) { // 进坑速度限制
            gameStateRef.current = GameState.CRASHED;
            createParticles(playerLateralXRef.current, PLAYER_VISUAL_Y, COLORS.BLOOD, 60, 15);
            onGameOver(GameState.CRASHED);
        } else {
            gameStateRef.current = GameState.WON;
            onGameOver(GameState.WON, (BLADDER_MAX - pressureRef.current) * 100);
        }
        return;
      }
    }

    // 如果错过了厕所（已经滑过厕所一定距离）
    if (playerY_in_world > toiletYInWorld + 60) {
      gameStateRef.current = GameState.CRASHED;
      onGameOver(GameState.CRASHED);
      return;
    }

    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = COLORS.SNOW;
    ctx.fillRect(0, 0, width, height);

    const scrollY = distanceRef.current % 400;
    ctx.strokeStyle = COLORS.TRACK_EDGE;
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(50, -scrollY);
    ctx.lineTo(50, height + 400);
    ctx.moveTo(width - 50, -scrollY);
    ctx.lineTo(width - 50, height + 400);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let i = -1; i < 8; i++) {
        const dY = (i * 300) - (distanceRef.current % 300);
        ctx.fillStyle = '#166534';
        ctx.beginPath(); ctx.moveTo(25, dY + 50); ctx.lineTo(5, dY + 100); ctx.lineTo(45, dY + 100); ctx.fill();
        ctx.beginPath(); ctx.moveTo(width - 25, dY + 150); ctx.lineTo(width - 45, dY + 200); ctx.lineTo(width - 5, dY + 200); ctx.fill();
    }

    obstaclesRef.current.forEach(obs => {
        const screenY = obs.y - distanceRef.current;
        if (screenY > -100 && screenY < height + 100) {
            if (obs.type === 'tree') {
                ctx.fillStyle = '#166534';
                ctx.beginPath(); ctx.moveTo(obs.x, screenY - 25); ctx.lineTo(obs.x - 15, screenY + 10); ctx.lineTo(obs.x + 15, screenY + 10); ctx.fill();
                ctx.fillStyle = '#451a03'; ctx.fillRect(obs.x - 3, screenY + 10, 6, 8);
            } else {
                ctx.fillStyle = '#64748b'; ctx.beginPath(); ctx.arc(obs.x, screenY, 12, 0, Math.PI * 2); ctx.fill();
            }
        }
    });

    const toiletYInWorld = TOILET_POSITION;
    const screenToiletY = toiletYInWorld - distanceRef.current;
    if (screenToiletY > -100 && screenToiletY < height + 100) {
      ctx.fillStyle = COLORS.TOILET;
      ctx.fillRect(width / 2 - 40, screenToiletY - 40, 80, 80);
      ctx.fillStyle = 'white';
      ctx.fillRect(width / 2 - 30, screenToiletY - 30, 60, 20);
      ctx.fillStyle = 'black';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("厕所", width / 2, screenToiletY - 15);
    }

    particlesRef.current.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.color === '#ffffff' ? 3 + p.life * 5 : 4, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    });

    const playerX = playerLateralXRef.current;
    const playerY = PLAYER_VISUAL_Y;
    
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(playerX - 10, playerY - 10); ctx.lineTo(playerX - 10, playerY + 30);
    ctx.moveTo(playerX + 10, playerY - 10); ctx.lineTo(playerX + 10, playerY + 30); ctx.stroke();

    ctx.fillStyle = COLORS.PLAYER;
    ctx.beginPath(); ctx.arc(playerX, playerY, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.arc(playerX, playerY - 5, 6, 0, Math.PI * 2); ctx.fill();

    if (speedRef.current > 20) {
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const lx = Math.random() * width;
            const ly = Math.random() * height;
            ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly - speedRef.current * 3); ctx.stroke();
        }
    }
  };

  const loop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    update();
    draw(ctx);
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, []);

  const bladderPercent = Math.min(100, (pressure / BLADDER_MAX) * 100);
  const distancePercent = Math.min(100, (distance / TOILET_POSITION) * 100);
  const speedPercent = Math.min(100, (currentSpeed / MAX_SPEED) * 100);

  return (
    <div className="relative w-full h-full cursor-pointer touch-none" onPointerDown={handleInput}>
      <canvas
        ref={canvasRef}
        width={WORLD_WIDTH}
        height={window.innerHeight}
        className="mx-auto h-full"
        style={{ width: `${WORLD_WIDTH}px` }}
      />
      
      <div className="absolute inset-x-0 top-0 p-4 flex flex-col items-center pointer-events-none space-y-3">
        <div className="w-full max-w-[320px] space-y-3">
          <div className="bg-white/95 p-3 rounded-xl shadow-2xl border-b-4 border-red-500">
            <div className="flex justify-between items-center mb-1">
              <span className={`text-[10px] font-black uppercase ${bladderPercent > 80 ? 'animate-pulse text-red-600' : 'text-gray-500'}`}>
                膀胱压力
              </span>
              <span className="text-xs font-bold text-red-600">{Math.floor(pressure)}%</span>
            </div>
            <div className="w-full h-5 bg-gray-300 rounded-full overflow-hidden p-[2px]">
              <div 
                className={`h-full rounded-full ${bladderPercent > 80 ? 'bg-red-600' : bladderPercent > 50 ? 'bg-orange-500' : 'bg-yellow-400'}`}
                style={{ width: `${bladderPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-black/90 p-3 rounded-xl shadow-2xl border-b-4 border-blue-400">
            <div className="flex justify-between items-center mb-1 text-white">
              <span className="text-[10px] font-black uppercase tracking-tighter">当前时速</span>
              <span className="text-xs font-mono">{Math.floor(currentSpeed * 5)} km/h</span>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-colors duration-200 ${speedPercent > 80 ? 'bg-red-500' : 'bg-blue-400'}`}
                style={{ width: `${speedPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white/90 p-2 rounded-full shadow-lg flex items-center space-x-3 px-4">
             <span className="text-base">🎿</span>
             <div className="flex-1 h-3 bg-gray-300 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: `${distancePercent}%` }}
                ></div>
             </div>
             <span className="text-base">🚽</span>
          </div>
        </div>
      </div>

      {distance < 1000 && (
        <div className="absolute inset-x-0 bottom-32 flex flex-col items-center pointer-events-none space-y-2 text-center px-4">
            <div className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg font-black text-lg border-2 border-white animate-bounce">
              点击两侧移动并刹车
            </div>
            <p className="text-blue-900 font-bold bg-white/50 px-2 rounded">对准厕所，终点前减速！</p>
        </div>
      )}
    </div>
  );
};

export default GameView;
