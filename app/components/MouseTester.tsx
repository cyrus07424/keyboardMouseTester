'use client';

import {useEffect, useMemo} from 'react';

interface MouseTesterProps {
  pressedButtons: Set<number>;
  everPressedButtons: Set<number>;
  buttonPressCounts: Record<number, number>;
  viewMode: 'normal' | 'heatmap';
  debugEnabled: boolean;
  onButtonPress: (button: number) => void;
  onButtonRelease: (button: number) => void;
}

export default function MouseTester({
  pressedButtons,
  everPressedButtons,
  buttonPressCounts,
  viewMode,
  debugEnabled,
  onButtonPress,
  onButtonRelease,
}: MouseTesterProps) {
  const debugLog = (tag: string, payload: Record<string, unknown>) => {
    if (!debugEnabled) return;
    console.debug(`[MouseDebug] ${tag}`, payload);
  };

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      debugLog('mousedown', {
        button: e.button,
        buttons: e.buttons,
        clientX: e.clientX,
        clientY: e.clientY,
        timeStamp: e.timeStamp,
      });
      onButtonPress(e.button);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      debugLog('mouseup', {
        button: e.button,
        buttons: e.buttons,
        clientX: e.clientX,
        clientY: e.clientY,
        timeStamp: e.timeStamp,
      });
      onButtonRelease(e.button);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [debugEnabled, onButtonPress, onButtonRelease]);

  const maxPressCount = useMemo(
    () => Object.values(buttonPressCounts).reduce((max, count) => (count > max ? count : max), 0),
    [buttonPressCounts],
  );

  const isLeftPressed = pressedButtons.has(0);
  const isMiddlePressed = pressedButtons.has(1);
  const isRightPressed = pressedButtons.has(2);
  const wasLeftEverPressed = everPressedButtons.has(0);
  const wasMiddleEverPressed = everPressedButtons.has(1);
  const wasRightEverPressed = everPressedButtons.has(2);

  const getButtonHeatmapStyle = (button: number) => {
    if (viewMode !== 'heatmap') return undefined;
    const count = buttonPressCounts[button] ?? 0;
    if (count <= 0 || maxPressCount <= 0) return undefined;

    const normalized = Math.log(count + 1) / Math.log(maxPressCount + 1);
    const hue = 220 - (220 * normalized);
    const lightness = 32 + (14 * normalized);

    return {
      backgroundColor: `hsl(${hue} 78% ${lightness}%)`,
      color: '#f9fafb',
    };
  };

  // ボタンの背景色を決定する関数
  const getButtonColor = (button: number, isPressed: boolean, wasEverPressed: boolean) => {
    if (isPressed) {
      return 'bg-yellow-400';
    } else if (viewMode === 'heatmap' && (buttonPressCounts[button] ?? 0) > 0) {
      return 'text-white';
    } else if (wasEverPressed) {
      return 'bg-teal-600';
    }
    return 'bg-gray-600';
  };

  // テキストの色を決定する関数
  const getTextColor = (isPressed: boolean) => {
    return isPressed ? 'text-black' : 'text-white';
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-white text-xl font-bold mb-4 text-center">マウス</h2>
      <div className="flex justify-center">
        <div className="relative w-48 h-64 bg-gray-700 rounded-t-full rounded-b-3xl border-4 border-gray-600">
          {viewMode === 'heatmap' && (
            <div className="absolute -top-7 left-0 right-0 flex items-center justify-center gap-2 text-xs text-gray-300">
              <span>Heat</span>
              <div className="h-2 w-16 rounded-full bg-linear-to-r from-blue-600 via-emerald-500 to-red-500" />
              <span>Max: {maxPressCount}</span>
            </div>
          )}
          {/* マウスのボタン領域 */}
          <div className="absolute top-0 left-0 right-0 h-40 flex gap-1 p-2">
            {/* 左ボタン */}
            <div
              className={`
                relative flex-1 rounded-tl-full border-2 border-gray-600
                flex items-center justify-center
                transition-colors duration-75
                ${getButtonColor(0, isLeftPressed, wasLeftEverPressed)}
              `}
              style={getButtonHeatmapStyle(0)}
            >
              <span className={`text-sm font-bold ${getTextColor(isLeftPressed)}`}>
                左
              </span>
              {viewMode === 'heatmap' && (buttonPressCounts[0] ?? 0) > 0 && (
                <span className="absolute top-2 right-3 text-[10px] leading-none text-gray-100/90">
                  {buttonPressCounts[0]}
                </span>
              )}
            </div>
            
            {/* 中央ボタン（スクロールホイール） */}
            <div
              className={`
                relative w-8 rounded-lg border-2 border-gray-600
                flex items-center justify-center
                transition-colors duration-75
                ${getButtonColor(1, isMiddlePressed, wasMiddleEverPressed)}
              `}
              style={getButtonHeatmapStyle(1)}
            >
              <span className={`text-sm font-bold ${getTextColor(isMiddlePressed)}`}>
                中
              </span>
              {viewMode === 'heatmap' && (buttonPressCounts[1] ?? 0) > 0 && (
                <span className="absolute top-2 right-2 text-[10px] leading-none text-gray-100/90">
                  {buttonPressCounts[1]}
                </span>
              )}
            </div>
            
            {/* 右ボタン */}
            <div
              className={`
                relative flex-1 rounded-tr-full border-2 border-gray-600
                flex items-center justify-center
                transition-colors duration-75
                ${getButtonColor(2, isRightPressed, wasRightEverPressed)}
              `}
              style={getButtonHeatmapStyle(2)}
            >
              <span className={`text-sm font-bold ${getTextColor(isRightPressed)}`}>
                右
              </span>
              {viewMode === 'heatmap' && (buttonPressCounts[2] ?? 0) > 0 && (
                <span className="absolute top-2 right-3 text-[10px] leading-none text-gray-100/90">
                  {buttonPressCounts[2]}
                </span>
              )}
            </div>
          </div>
          
          {/* マウス本体 */}
          <div className="absolute bottom-0 left-0 right-0 h-24 flex items-center justify-center">
            <div className="text-gray-500 text-xs text-center">
              マウスボタンを<br />クリックしてください
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
