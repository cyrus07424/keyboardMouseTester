'use client';

import {useEffect, useMemo, useRef, useState} from 'react';

interface MouseTesterProps {
  pressedButtons: Set<number>;
  everPressedButtons: Set<number>;
  buttonPressCounts: Record<number, number>;
  viewMode: 'normal' | 'heatmap';
  debugEnabled: boolean;
  preventPageScroll: boolean;
  onButtonPress: (button: number) => void;
  onButtonRelease: (button: number) => void;
}

// Virtual button IDs for wheel events (not real mouse buttons)
const WHEEL_UP_ID    = 10; // scroll up
const WHEEL_DOWN_ID  = 11; // scroll down
const WHEEL_LEFT_ID  = 12; // tilt left
const WHEEL_RIGHT_ID = 13; // tilt right

const WHEEL_FLASH_MS = 200;

const BUTTON_LABELS: Record<number, string> = {
  0: '左',
  1: '中',
  2: '右',
  3: 'サイド\n後退',
  4: 'サイド\n前進',
  10: '↑',
  11: '↓',
  12: '←',
  13: '→',
};

export default function MouseTester({
  pressedButtons,
  everPressedButtons,
  buttonPressCounts,
  viewMode,
  debugEnabled,
  preventPageScroll,
  onButtonPress,
  onButtonRelease,
}: MouseTesterProps) {
  const [activeWheels, setActiveWheels] = useState<Set<number>>(new Set());
  const wheelTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const debugLog = (tag: string, payload: Record<string, unknown>) => {
    if (!debugEnabled) return;
    console.debug(`[MouseDebug] ${tag}`, payload);
  };

  const flashWheel = (id: number) => {
    // Cancel existing timer for this wheel direction
    const existing = wheelTimers.current.get(id);
    if (existing) clearTimeout(existing);

    setActiveWheels(prev => new Set(prev).add(id));
    onButtonPress(id);

    const timer = setTimeout(() => {
      setActiveWheels(prev => { const s = new Set(prev); s.delete(id); return s; });
      onButtonRelease(id);
      wheelTimers.current.delete(id);
    }, WHEEL_FLASH_MS);
    wheelTimers.current.set(id, timer);
  };

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      debugLog('mousedown', { button: e.button, buttons: e.buttons, timeStamp: e.timeStamp });
      onButtonPress(e.button);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      debugLog('mouseup', { button: e.button, buttons: e.buttons, timeStamp: e.timeStamp });
      onButtonRelease(e.button);
    };

    const handleWheel = (e: WheelEvent) => {
      if (preventPageScroll) e.preventDefault();
      debugLog('wheel', { deltaX: e.deltaX, deltaY: e.deltaY, deltaZ: e.deltaZ, deltaMode: e.deltaMode, timeStamp: e.timeStamp });

      if (e.deltaY < 0) flashWheel(WHEEL_UP_ID);
      else if (e.deltaY > 0) flashWheel(WHEEL_DOWN_ID);

      if (e.deltaX < 0) flashWheel(WHEEL_LEFT_ID);
      else if (e.deltaX > 0) flashWheel(WHEEL_RIGHT_ID);
    };

    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('contextmenu', handleContextMenu);
      wheelTimers.current.forEach(t => clearTimeout(t));
    };
  }, [debugEnabled, preventPageScroll, onButtonPress, onButtonRelease]);

  const maxPressCount = useMemo(
    () => Object.values(buttonPressCounts).reduce((max, count) => (count > max ? count : max), 0),
    [buttonPressCounts],
  );

  const getHeatmapStyle = (button: number) => {
    if (viewMode !== 'heatmap') return undefined;
    const count = buttonPressCounts[button] ?? 0;
    if (count <= 0 || maxPressCount <= 0) return undefined;
    const normalized = Math.log(count + 1) / Math.log(maxPressCount + 1);
    const hue = 220 - (220 * normalized);
    const lightness = 32 + (14 * normalized);
    return { backgroundColor: `hsl(${hue} 78% ${lightness}%)`, color: '#f9fafb' };
  };

  const getBtnClass = (button: number) => {
    const isPressed = pressedButtons.has(button) || activeWheels.has(button);
    const wasEver = everPressedButtons.has(button) || (buttonPressCounts[button] ?? 0) > 0;
    if (isPressed) return 'bg-yellow-400 text-black';
    if (viewMode === 'heatmap' && (buttonPressCounts[button] ?? 0) > 0) return 'text-white';
    if (wasEver) return 'bg-teal-600 text-white';
    return 'bg-gray-600 text-white';
  };

  const renderCount = (button: number) =>
    viewMode === 'heatmap' && (buttonPressCounts[button] ?? 0) > 0 ? (
      <span className="absolute top-0.5 right-1 text-[9px] leading-none text-gray-100/90">
        {buttonPressCounts[button]}
      </span>
    ) : null;

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-white text-xl font-bold mb-4 text-center">マウス</h2>

      {viewMode === 'heatmap' && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-300 mb-3">
          <span>Heat</span>
          <div className="h-2 w-16 rounded-full bg-linear-to-r from-blue-600 via-emerald-500 to-red-500" />
          <span>Max: {maxPressCount}</span>
        </div>
      )}

      <div className="flex gap-4 justify-center">
        {/* マウス本体 */}
        <div className="relative w-44 flex flex-col gap-1">
          {/* ボタン上段: 左・中・右 */}
          <div className="flex gap-1 h-28">
            {/* 左 */}
            <div
              className={`relative flex-1 rounded-tl-2xl border-2 border-gray-600 flex items-center justify-center transition-colors duration-75 ${getBtnClass(0)}`}
              style={getHeatmapStyle(0)}
            >
              <span className="text-sm font-bold whitespace-pre-line text-center">左</span>
              {renderCount(0)}
            </div>
            {/* 中（ホイール） */}
            <div className="flex flex-col gap-1 w-9">
              {/* ホイール上 */}
              <div className={`relative flex-1 border-2 border-gray-600 rounded flex items-center justify-center transition-colors duration-75 ${getBtnClass(WHEEL_UP_ID)}`} style={getHeatmapStyle(WHEEL_UP_ID)}>
                <span className="text-xs font-bold">↑</span>
                {renderCount(WHEEL_UP_ID)}
              </div>
              {/* 中ボタン押下 */}
              <div className={`relative flex-1 border-2 border-gray-600 rounded flex items-center justify-center transition-colors duration-75 ${getBtnClass(1)}`} style={getHeatmapStyle(1)}>
                <span className="text-xs font-bold">中</span>
                {renderCount(1)}
              </div>
              {/* ホイール下 */}
              <div className={`relative flex-1 border-2 border-gray-600 rounded flex items-center justify-center transition-colors duration-75 ${getBtnClass(WHEEL_DOWN_ID)}`} style={getHeatmapStyle(WHEEL_DOWN_ID)}>
                <span className="text-xs font-bold">↓</span>
                {renderCount(WHEEL_DOWN_ID)}
              </div>
            </div>
            {/* 右 */}
            <div
              className={`relative flex-1 rounded-tr-2xl border-2 border-gray-600 flex items-center justify-center transition-colors duration-75 ${getBtnClass(2)}`}
              style={getHeatmapStyle(2)}
            >
              <span className="text-sm font-bold">右</span>
              {renderCount(2)}
            </div>
          </div>

          {/* 横チルト行 */}
          <div className="flex gap-1 h-9">
            <div className={`relative flex-1 border-2 border-gray-600 rounded-bl-2xl flex items-center justify-center transition-colors duration-75 ${getBtnClass(WHEEL_LEFT_ID)}`} style={getHeatmapStyle(WHEEL_LEFT_ID)}>
              <span className="text-xs font-bold">◀ チルト</span>
              {renderCount(WHEEL_LEFT_ID)}
            </div>
            <div className="w-9" />
            <div className={`relative flex-1 border-2 border-gray-600 rounded-br-2xl flex items-center justify-center transition-colors duration-75 ${getBtnClass(WHEEL_RIGHT_ID)}`} style={getHeatmapStyle(WHEEL_RIGHT_ID)}>
              <span className="text-xs font-bold">チルト ▶</span>
              {renderCount(WHEEL_RIGHT_ID)}
            </div>
          </div>

          {/* 本体下部 */}
          <div className="h-12 bg-gray-700 border-2 border-gray-600 rounded-b-3xl flex items-center justify-center">
            <span className="text-gray-500 text-[10px] text-center">マウスを操作</span>
          </div>
        </div>

        {/* サイドボタン（縦並び） */}
        <div className="flex flex-col gap-1 justify-start pt-2">
          <p className="text-gray-400 text-xs mb-1 text-center">サイド</p>
          {[4, 3].map(btn => (
            <div
              key={btn}
              className={`relative w-14 h-10 border-2 border-gray-600 rounded flex items-center justify-center transition-colors duration-75 ${getBtnClass(btn)}`}
              style={getHeatmapStyle(btn)}
            >
              <span className="text-xs font-bold whitespace-pre-line text-center leading-tight">{BUTTON_LABELS[btn]}</span>
              {renderCount(btn)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
