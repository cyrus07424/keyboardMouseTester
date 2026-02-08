'use client';

import { useEffect } from 'react';

interface MouseTesterProps {
  pressedButtons: Set<number>;
  onButtonPress: (button: number) => void;
  onButtonRelease: (button: number) => void;
}

export default function MouseTester({ pressedButtons, onButtonPress, onButtonRelease }: MouseTesterProps) {
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      onButtonPress(e.button);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
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
  }, [onButtonPress, onButtonRelease]);

  const isLeftPressed = pressedButtons.has(0);
  const isMiddlePressed = pressedButtons.has(1);
  const isRightPressed = pressedButtons.has(2);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-white text-xl font-bold mb-4 text-center">マウス</h2>
      <div className="flex justify-center">
        <div className="relative w-48 h-64 bg-gray-700 rounded-t-full rounded-b-3xl border-4 border-gray-600">
          {/* マウスのボタン領域 */}
          <div className="absolute top-0 left-0 right-0 h-40 flex gap-1 p-2">
            {/* 左ボタン */}
            <div
              className={`
                flex-1 rounded-tl-full border-2 border-gray-600
                flex items-center justify-center
                transition-colors duration-75
                ${isLeftPressed ? 'bg-yellow-400' : 'bg-gray-600'}
              `}
            >
              <span className={`text-sm font-bold ${isLeftPressed ? 'text-black' : 'text-white'}`}>
                左
              </span>
            </div>
            
            {/* 中央ボタン（スクロールホイール） */}
            <div
              className={`
                w-8 rounded-lg border-2 border-gray-600
                flex items-center justify-center
                transition-colors duration-75
                ${isMiddlePressed ? 'bg-yellow-400' : 'bg-gray-600'}
              `}
            >
              <span className={`text-sm font-bold ${isMiddlePressed ? 'text-black' : 'text-white'}`}>
                中
              </span>
            </div>
            
            {/* 右ボタン */}
            <div
              className={`
                flex-1 rounded-tr-full border-2 border-gray-600
                flex items-center justify-center
                transition-colors duration-75
                ${isRightPressed ? 'bg-yellow-400' : 'bg-gray-600'}
              `}
            >
              <span className={`text-sm font-bold ${isRightPressed ? 'text-black' : 'text-white'}`}>
                右
              </span>
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
