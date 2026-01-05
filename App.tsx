
import React, { useState, useCallback } from 'react';
import GameView from './components/GameView';
import { GameState } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState<number>(0);

  const startGame = () => {
    setGameState(GameState.PLAYING);
    setScore(0);
  };

  const handleGameOver = useCallback((state: GameState, finalScore?: number) => {
    setGameState(state);
    if (finalScore !== undefined) setScore(finalScore);
  }, []);

  const getRank = (s: number) => {
    if (s > 9000) return { text: "黄金尿袋 (传说级)", color: "text-yellow-500" };
    if (s > 7000) return { text: "铁甲膀胱 (史诗级)", color: "text-purple-500" };
    if (s > 4000) return { text: "憋尿达人 (稀有级)", color: "text-blue-500" };
    return { text: "勉强憋住 (普通级)", color: "text-gray-500" };
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-sky-50 font-sans">
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <h1 className="text-4xl md:text-6xl font-black text-blue-600 mb-4 text-center">
            极速急救 🚽
          </h1>
          <p className="text-gray-600 mb-8 px-6 text-center max-w-md">
            雪道湿滑，而你的<b>膀胱快要炸了</b>！在悲剧发生前赶快冲向山下的厕所。
          </p>
          <div className="space-y-4 bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
            <h3 className="font-bold text-blue-800">游戏玩法：</h3>
            <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
              <li><b>不点击屏幕：</b> 持续加速（重力下落）</li>
              <li><b>快速点击：</b> 左右移动并触发<b>刹车</b></li>
              <li>在压力条达到 100% 前抵达终点厕所</li>
              <li><b>注意：</b> 终点前速度过快会导致<b>翻车</b>！</li>
            </ul>
          </div>
          <button
            onClick={startGame}
            className="mt-10 px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transform transition active:scale-95 text-xl"
          >
            开始冲刺
          </button>
        </div>
      )}

      {gameState === GameState.PLAYING && (
        <GameView onGameOver={handleGameOver} />
      )}

      {(gameState === GameState.WON || gameState === GameState.EXPLODED || gameState === GameState.CRASHED) && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center animate-bounce-short max-w-sm w-full mx-4">
            {gameState === GameState.WON ? (
              <>
                <div className="text-6xl mb-4">✨</div>
                <h2 className="text-4xl font-black text-green-600 mb-2">太爽了!</h2>
                <p className="text-gray-500 mb-4 font-medium">你成功及时赶到了厕所！</p>
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="text-sm text-gray-400 uppercase font-bold tracking-widest mb-1">最终得分</div>
                  <div className="text-4xl font-black text-blue-600">{Math.floor(score)}</div>
                  <div className={`mt-2 font-bold ${getRank(score).color}`}>{getRank(score).text}</div>
                </div>
              </>
            ) : gameState === GameState.EXPLODED ? (
              <>
                <div className="text-6xl mb-4">💥</div>
                <h2 className="text-4xl font-black text-red-600 mb-2">炸了!</h2>
                <p className="text-red-500 mb-6 font-bold uppercase tracking-widest">膀胱爆裂！</p>
                <p className="text-gray-500 mb-6 italic">你应该滑得再快一点...</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🎿</div>
                <h2 className="text-4xl font-black text-orange-600 mb-2">翻车了!</h2>
                <p className="text-orange-500 mb-6 font-bold uppercase tracking-widest">速度太快，没进坑！</p>
                <p className="text-gray-500 mb-6 italic">终点前记得刹车，稳一点。</p>
              </>
            )}
            
            <button
              onClick={startGame}
              className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transform transition active:scale-95 text-lg"
            >
              再来一发
            </button>
            <button
              onClick={() => setGameState(GameState.MENU)}
              className="block w-full mt-4 text-gray-400 hover:text-gray-600 text-sm underline"
            >
              返回主菜单
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
