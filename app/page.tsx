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
  const [everPressedKeys, setEverPressedKeys] = useState<Set<string>>(new Set());
  const [everPressedButtons, setEverPressedButtons] = useState<Set<number>>(new Set());
  const [keyEvents, setKeyEvents] = useState<KeyEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState<'keyboard' | 'mouse'>('keyboard');
  const pressTimeRef = useRef<Map<string, number>>(new Map());

  const handleKeyPress = useCallback((key: string) => {
    setPressedKeys(prev => new Set(prev).add(key));
    setEverPressedKeys(prev => new Set(prev).add(key));
    pressTimeRef.current.set(key, Date.now());
    
    if (!isPaused) {
      setKeyEvents(prev => [...prev, {
        timestamp: Date.now(),
        key,
        isPressed: true
      }]);
    }
  }, [isPaused]);

  const handleKeyRelease = useCallback((key: string) => {
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
    
    pressTimeRef.current.delete(key);
    
    if (!isPaused) {
      setKeyEvents(prev => [...prev, {
        timestamp: Date.now(),
        key,
        isPressed: false
      }]);
    }
  }, [isPaused]);

  const handleButtonPress = useCallback((button: number) => {
    setPressedButtons(prev => new Set(prev).add(button));
    setEverPressedButtons(prev => new Set(prev).add(button));
    
    if (!isPaused) {
      setKeyEvents(prev => [...prev, {
        timestamp: Date.now(),
        key: `Mouse${button}`,
        isPressed: true
      }]);
    }
  }, [isPaused]);

  const handleButtonRelease = useCallback((button: number) => {
    setPressedButtons(prev => {
      const newSet = new Set(prev);
      newSet.delete(button);
      return newSet;
    });
    
    if (!isPaused) {
      setKeyEvents(prev => [...prev, {
        timestamp: Date.now(),
        key: `Mouse${button}`,
        isPressed: false
      }]);
    }
  }, [isPaused]);

  const handleReset = useCallback(() => {
    setPressedKeys(new Set());
    setPressedButtons(new Set());
    setEverPressedKeys(new Set());
    setEverPressedButtons(new Set());
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
          
          {/* タブ切り替え */}
          <div className="flex gap-2 justify-center mb-4">
            <button
              onClick={() => setActiveTab('keyboard')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'keyboard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              キーボード
            </button>
            <button
              onClick={() => setActiveTab('mouse')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'mouse'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              マウス
            </button>
          </div>

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

        {/* コンテンツ */}
        <div className="mb-6">
          {activeTab === 'keyboard' ? (
            <Keyboard
              pressedKeys={pressedKeys}
              everPressedKeys={everPressedKeys}
              onKeyPress={handleKeyPress}
              onKeyRelease={handleKeyRelease}
            />
          ) : (
            <div className="flex justify-center">
              <MouseTester
                pressedButtons={pressedButtons}
                everPressedButtons={everPressedButtons}
                onButtonPress={handleButtonPress}
                onButtonRelease={handleButtonRelease}
              />
            </div>
          )}
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
