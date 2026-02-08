'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Keyboard from './components/Keyboard';
import MouseTester from './components/MouseTester';
import KeyPressGraph from './components/KeyPressGraph';

interface KeyEvent {
  timestamp: number;
  key: string;
  isPressed: boolean;
}

export default function Home() {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [pressedButtons, setPressedButtons] = useState<Set<number>>(new Set());
  const [keyEvents, setKeyEvents] = useState<KeyEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const pressTimeRef = useRef<Map<string, number>>(new Map());

  const handleKeyPress = useCallback((key: string) => {
    setPressedKeys(prev => new Set(prev).add(key));
    pressTimeRef.current.set(key, Date.now());
    
    setKeyEvents(prev => [...prev, {
      timestamp: Date.now(),
      key,
      isPressed: true
    }]);
  }, []);

  const handleKeyRelease = useCallback((key: string) => {
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
    
    pressTimeRef.current.delete(key);
    
    setKeyEvents(prev => [...prev, {
      timestamp: Date.now(),
      key,
      isPressed: false
    }]);
  }, []);

  const handleButtonPress = useCallback((button: number) => {
    setPressedButtons(prev => new Set(prev).add(button));
    
    setKeyEvents(prev => [...prev, {
      timestamp: Date.now(),
      key: `Mouse${button}`,
      isPressed: true
    }]);
  }, []);

  const handleButtonRelease = useCallback((button: number) => {
    setPressedButtons(prev => {
      const newSet = new Set(prev);
      newSet.delete(button);
      return newSet;
    });
    
    setKeyEvents(prev => [...prev, {
      timestamp: Date.now(),
      key: `Mouse${button}`,
      isPressed: false
    }]);
  }, []);

  const handleReset = useCallback(() => {
    setPressedKeys(new Set());
    setPressedButtons(new Set());
    setKeyEvents([]);
    pressTimeRef.current.clear();
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // 古いイベントを定期的に削除（メモリ管理）
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setKeyEvents(prev => prev.filter(e => now - e.timestamp <= 10000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            キーボード・マウステスター
          </h1>
          <p className="text-gray-400 mb-4">
            キーボードのキーやマウスのボタンを押すと、リアルタイムで反応します。
            チャタリング検出にも対応しています。
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={togglePause}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              {isPaused ? 'グラフ再開' : 'グラフ一時停止'}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              全体リセット
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Keyboard
              pressedKeys={pressedKeys}
              onKeyPress={handleKeyPress}
              onKeyRelease={handleKeyRelease}
            />
          </div>
          <div>
            <MouseTester
              pressedButtons={pressedButtons}
              onButtonPress={handleButtonPress}
              onButtonRelease={handleButtonRelease}
            />
          </div>
        </div>

        <div className="mb-6">
          <KeyPressGraph events={keyEvents} isPaused={isPaused} />
        </div>

        <footer className="text-center text-gray-400 mt-8">
          &copy; 2026 <a href="https://github.com/cyrus07424" target="_blank" className="hover:text-gray-300">cyrus</a>
        </footer>
      </div>
    </div>
  );
}
