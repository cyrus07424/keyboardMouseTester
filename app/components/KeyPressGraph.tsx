'use client';

import { useEffect, useRef, useState } from 'react';

interface KeyEvent {
  timestamp: number;
  key: string;
  isPressed: boolean;
}

interface KeyPressGraphProps {
  events: KeyEvent[];
  isPaused: boolean;
}

export default function KeyPressGraph({ events, isPaused }: KeyPressGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [keys, setKeys] = useState<string[]>([]);
  const [renderTrigger, setRenderTrigger] = useState(0);

  useEffect(() => {
    // 過去10秒間のイベントから一意なキーを抽出
    const now = Date.now();
    const recentEvents = events.filter(e => now - e.timestamp <= 10000);
    const uniqueKeys = Array.from(new Set(recentEvents.map(e => e.key)));
    setKeys(uniqueKeys);
  }, [events]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const now = Date.now();

    // キャンバスをクリア
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);

    // グリッド線を描画
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;

    // 縦線（1秒ごと）
    for (let i = 0; i <= 10; i++) {
      const x = width - (i * width / 10);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 横線（キーごと）
    const keyHeight = keys.length > 0 ? height / keys.length : height;
    for (let i = 0; i <= keys.length; i++) {
      const y = i * keyHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 各キーの状態を折れ線グラフで描画
    keys.forEach((key, keyIndex) => {
      const y = keyIndex * keyHeight + keyHeight / 2;
      const keyEvents = events.filter(e => e.key === key && now - e.timestamp <= 10000);

      // キー名を描画
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px Arial';
      ctx.fillText(key, 5, y + 5);

      // イベントを時系列順にソート
      const sortedEvents = [...keyEvents].sort((a, b) => a.timestamp - b.timestamp);

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();

      let currentState = false;

      // 現在から過去に向かって描画
      for (let x = width; x >= 0; x -= 1) {
        const time = now - ((width - x) / width) * 10000;
        
        // この時点での状態を判定
        let stateAtTime = false;
        for (const event of sortedEvents) {
          if (event.timestamp <= time) {
            stateAtTime = event.isPressed;
          }
        }

        const graphY = stateAtTime ? y - keyHeight / 4 : y + keyHeight / 4;

        if (x === width) {
          ctx.moveTo(x, graphY);
        } else {
          ctx.lineTo(x, graphY);
        }
      }

      ctx.stroke();
    });

    // 一時停止表示
    if (isPaused) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('一時停止中', width / 2, height / 2);
      ctx.textAlign = 'left';
    }
  }, [events, keys, isPaused, renderTrigger]);

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        // Trigger re-render to update the graph animation
        setRenderTrigger(prev => prev + 1);
      }, 50); // 20 FPS

      return () => clearInterval(interval);
    }
  }, [isPaused]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-white text-xl font-bold mb-4 text-center">
        キー入力履歴 (過去10秒)
      </h2>
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="w-full bg-gray-900 rounded border-2 border-gray-700"
      />
    </div>
  );
}
