'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import Keyboard from './components/Keyboard';
import MouseTester from './components/MouseTester';
import KeyPressGraph from './components/KeyPressGraph';
import EventLog from './components/EventLog';
import KeyboardSummary from './components/KeyboardSummary';

interface KeyEvent {
  timestamp: number;
  key: string;
  isPressed: boolean;
}

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  onLabel: string;
  offLabel: string;
}

function ToggleSwitch({ label, checked, onToggle, onLabel, offLabel }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-gray-900/70 px-4 py-3 border border-gray-700">
      <div className="text-left">
        <p className="text-sm font-semibold text-gray-100">{label}</p>
        <p className="text-xs text-gray-400">{checked ? onLabel : offLabel}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-gray-600'}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-8' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
}

export default function Home() {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [keyPressCounts, setKeyPressCounts] = useState<Record<string, number>>({});
  const [mouseButtonCounts, setMouseButtonCounts] = useState<Record<number, number>>({});
  const [pressedButtons, setPressedButtons] = useState<Set<number>>(new Set());
  const [everPressedKeys, setEverPressedKeys] = useState<Set<string>>(new Set());
  const [everPressedButtons, setEverPressedButtons] = useState<Set<number>>(new Set());
  const [keyEvents, setKeyEvents] = useState<KeyEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'keyboard' | 'mouse'>('keyboard');
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<'normal' | 'heatmap'>('normal');
  const [preventPageScroll, setPreventPageScroll] = useState(true);
  const pressTimeRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const debugParam = params.get('debug');
    const savedDebug = window.localStorage.getItem('testerDebug');
    const savedViewMode = window.localStorage.getItem('testerViewMode');

    if (debugParam === '1' || debugParam === 'true') {
      setDebugEnabled(true);
    } else if (debugParam === '0' || debugParam === 'false') {
      setDebugEnabled(false);
    } else {
      setDebugEnabled(savedDebug === '1');
    }

    if (savedViewMode === 'normal' || savedViewMode === 'heatmap') {
      setViewMode(savedViewMode);
    }

    const savedPreventScroll = window.localStorage.getItem('testerPreventPageScroll');
    if (savedPreventScroll !== null) {
      setPreventPageScroll(savedPreventScroll !== '0');
    }
  }, []);

  // Maximum events to keep in memory (prevents memory exhaustion in long-running sessions)
  const MAX_EVENTS = 10000;

  // Helper function to add event with memory management
  const addEvent = useCallback((event: KeyEvent) => {
    setKeyEvents(prev => {
      const newEvents = [...prev, event];
      return newEvents.length > MAX_EVENTS ? newEvents.slice(-MAX_EVENTS) : newEvents;
    });
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    setPressedKeys(prev => new Set(prev).add(key));
    setEverPressedKeys(prev => new Set(prev).add(key));
    setKeyPressCounts(prev => ({
      ...prev,
      [key]: (prev[key] ?? 0) + 1,
    }));
    pressTimeRef.current.set(key, Date.now());

    // Always capture events regardless of pause state
    addEvent({
      timestamp: Date.now(),
      key,
      isPressed: true
    });
  }, [addEvent]);

  const handleKeyRelease = useCallback((key: string) => {
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });

    pressTimeRef.current.delete(key);

    // Always capture events regardless of pause state
    addEvent({
      timestamp: Date.now(),
      key,
      isPressed: false
    });
  }, [addEvent]);

  const handleButtonPress = useCallback((button: number) => {
    setPressedButtons(prev => new Set(prev).add(button));
    setEverPressedButtons(prev => new Set(prev).add(button));
    setMouseButtonCounts(prev => ({
      ...prev,
      [button]: (prev[button] ?? 0) + 1,
    }));

    // Always capture events regardless of pause state
    addEvent({
      timestamp: Date.now(),
      key: `Mouse${button}`,
      isPressed: true
    });
  }, [addEvent]);

  const handleButtonRelease = useCallback((button: number) => {
    setPressedButtons(prev => {
      const newSet = new Set(prev);
      newSet.delete(button);
      return newSet;
    });

    // Always capture events regardless of pause state
    addEvent({
      timestamp: Date.now(),
      key: `Mouse${button}`,
      isPressed: false
    });
  }, [addEvent]);

  const handleReset = useCallback(() => {
    setPressedKeys(new Set());
    setKeyPressCounts({});
    setMouseButtonCounts({});
    setPressedButtons(new Set());
    setEverPressedKeys(new Set());
    setEverPressedButtons(new Set());
    setKeyEvents([]);
    pressTimeRef.current.clear();
  }, []);

  const toggleDebug = useCallback(() => {
    setDebugEnabled(prev => {
      const next = !prev;
      window.localStorage.setItem('testerDebug', next ? '1' : '0');
      return next;
    });
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode(prev => {
      const next = prev === 'heatmap' ? 'normal' : 'heatmap';
      window.localStorage.setItem('testerViewMode', next);
      return next;
    });
  }, []);

  const togglePreventPageScroll = useCallback(() => {
    setPreventPageScroll(prev => {
      const next = !prev;
      window.localStorage.setItem('testerPreventPageScroll', next ? '1' : '0');
      return next;
    });
  }, []);

  // Event log persistence: Events are kept until manual reset
  // Maximum events retained controlled by MAX_EVENTS constant
  // No automatic cleanup to ensure all events are retained

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
                  ? 'bg-blue-600 text-white active:bg-blue-700'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-800'
              }`}
            >
              キーボード
            </button>
            <button
              onClick={() => setActiveTab('mouse')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'mouse'
                  ? 'bg-blue-600 text-white active:bg-blue-700'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-800'
              }`}
            >
              マウス
            </button>
          </div>

          <div className="mx-auto max-w-dvh rounded-xl border border-gray-700 bg-gray-800/70 p-4">
            <p className="text-sm font-bold text-gray-200 mb-3">設定メニュー</p>
            <div className="grid gap-3 md:grid-cols-3">
              <ToggleSwitch
                label="表示モード"
                checked={viewMode === 'heatmap'}
                onToggle={toggleViewMode}
                onLabel="ヒートマップ"
                offLabel="通常"
              />
              <ToggleSwitch
                label="デバッグモード"
                checked={debugEnabled}
                onToggle={toggleDebug}
                onLabel="ON"
                offLabel="OFF"
              />
              {activeTab === 'mouse' && (
                <ToggleSwitch
                  label="ページスクロール抑制"
                  checked={preventPageScroll}
                  onToggle={togglePreventPageScroll}
                  onLabel="抑制する"
                  offLabel="抑制しない"
                />
              )}
                <div className="flex items-center justify-between gap-4 rounded-lg bg-gray-900/70 px-4 py-3 border border-gray-700">
                    <div className="text-left">
                        <p className="text-sm font-semibold text-gray-100">全体リセット</p>
                    </div>
                    <button
                        onClick={handleReset}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg font-semibold transition-colors"
                    >
                        リセット
                    </button>
                </div>
            </div>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="mb-6">
          {activeTab === 'keyboard' ? (
            <Keyboard
              pressedKeys={pressedKeys}
              everPressedKeys={everPressedKeys}
              keyPressCounts={keyPressCounts}
              viewMode={viewMode}
              debugEnabled={debugEnabled}
              onKeyPress={handleKeyPress}
              onKeyRelease={handleKeyRelease}
            />
          ) : (
            <div className="flex justify-center">
              <MouseTester
                pressedButtons={pressedButtons}
                everPressedButtons={everPressedButtons}
                buttonPressCounts={mouseButtonCounts}
                viewMode={viewMode}
                debugEnabled={debugEnabled}
                preventPageScroll={preventPageScroll}
                onButtonPress={handleButtonPress}
                onButtonRelease={handleButtonRelease}
              />
            </div>
          )}
        </div>

        {activeTab === 'keyboard' && (
            <KeyboardSummary
              keyPressCounts={keyPressCounts}
              events={keyEvents}
              pressedKeys={pressedKeys}
              viewMode={viewMode}
            />
        )}

        <div className="mb-6">
          <KeyPressGraph events={keyEvents} />
        </div>

        <div className="mb-6">
          <EventLog events={keyEvents} />
        </div>

        <footer className="text-center text-gray-400 mt-8">
          &copy; 2026 <a href="https://github.com/cyrus07424" target="_blank" className="hover:text-gray-300">cyrus</a>
        </footer>
      </div>
    </div>
  );
}
