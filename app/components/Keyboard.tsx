'use client';

import { useEffect, useState } from 'react';

interface KeyboardProps {
  pressedKeys: Set<string>;
  everPressedKeys: Set<string>;
  onKeyPress: (key: string) => void;
  onKeyRelease: (key: string) => void;
}

// 109キーボードのレイアウト定義
const keyboardLayout = [
  // Row 1: ESC, F1-F12, etc.
  [
    { code: 'Escape', label: 'Esc', width: 1 },
    { code: '', label: '', width: 1, empty: true },
    { code: 'F1', label: 'F1', width: 1 },
    { code: 'F2', label: 'F2', width: 1 },
    { code: 'F3', label: 'F3', width: 1 },
    { code: 'F4', label: 'F4', width: 1 },
    { code: '', label: '', width: 0.5, empty: true },
    { code: 'F5', label: 'F5', width: 1 },
    { code: 'F6', label: 'F6', width: 1 },
    { code: 'F7', label: 'F7', width: 1 },
    { code: 'F8', label: 'F8', width: 1 },
    { code: '', label: '', width: 0.5, empty: true },
    { code: 'F9', label: 'F9', width: 1 },
    { code: 'F10', label: 'F10', width: 1 },
    { code: 'F11', label: 'F11', width: 1 },
    { code: 'F12', label: 'F12', width: 1 },
    { code: '', label: '', width: 0.5, empty: true },
    { code: 'PrintScreen', label: 'PrtSc', width: 1 },
    { code: 'ScrollLock', label: 'ScrLk', width: 1 },
    { code: 'Pause', label: 'Pause', width: 1 },
  ],
  // Row 2: 数字行
  [
    { code: 'Backquote', label: '半角/\n全角', width: 1 },
    { code: 'Digit1', label: '1\n!', width: 1 },
    { code: 'Digit2', label: '2\n"', width: 1 },
    { code: 'Digit3', label: '3\n#', width: 1 },
    { code: 'Digit4', label: '4\n$', width: 1 },
    { code: 'Digit5', label: '5\n%', width: 1 },
    { code: 'Digit6', label: '6\n&', width: 1 },
    { code: 'Digit7', label: '7\n\'', width: 1 },
    { code: 'Digit8', label: '8\n(', width: 1 },
    { code: 'Digit9', label: '9\n)', width: 1 },
    { code: 'Digit0', label: '0', width: 1 },
    { code: 'Minus', label: '-\n=', width: 1 },
    { code: 'Equal', label: '^\n~', width: 1 },
    { code: 'IntlYen', label: '¥\n|', width: 1 },
    { code: 'Backspace', label: 'Backspace', width: 1.5 },
    { code: '', label: '', width: 0.5, empty: true },
    { code: 'Insert', label: 'Ins', width: 1 },
    { code: 'Home', label: 'Home', width: 1 },
    { code: 'PageUp', label: 'PgUp', width: 1 },
    { code: '', label: '', width: 0.5, empty: true },
    { code: 'NumLock', label: 'NumLk', width: 1 },
    { code: 'NumpadDivide', label: '/', width: 1 },
    { code: 'NumpadMultiply', label: '*', width: 1 },
    { code: 'NumpadSubtract', label: '-', width: 1 },
  ],
  // Row 3: Tab行
  [
    { code: 'Tab', label: 'Tab', width: 1.5 },
    { code: 'KeyQ', label: 'Q', width: 1 },
    { code: 'KeyW', label: 'W', width: 1 },
    { code: 'KeyE', label: 'E', width: 1 },
    { code: 'KeyR', label: 'R', width: 1 },
    { code: 'KeyT', label: 'T', width: 1 },
    { code: 'KeyY', label: 'Y', width: 1 },
    { code: 'KeyU', label: 'U', width: 1 },
    { code: 'KeyI', label: 'I', width: 1 },
    { code: 'KeyO', label: 'O', width: 1 },
    { code: 'KeyP', label: 'P', width: 1 },
    { code: 'BracketLeft', label: '@\n`', width: 1 },
    { code: 'BracketRight', label: '[\n{', width: 1 },
    { code: 'Enter', label: 'Enter', width: 1.5, rowSpan: 2 },
    { code: '', label: '', width: 0.5, empty: true },
    { code: 'Delete', label: 'Del', width: 1 },
    { code: 'End', label: 'End', width: 1 },
    { code: 'PageDown', label: 'PgDn', width: 1 },
    { code: '', label: '', width: 0.5, empty: true },
    { code: 'Numpad7', label: '7', width: 1 },
    { code: 'Numpad8', label: '8', width: 1 },
    { code: 'Numpad9', label: '9', width: 1 },
    { code: 'NumpadAdd', label: '+', width: 1, rowSpan: 2 },
  ],
  // Row 4: CapsLock行
  [
    { code: 'CapsLock', label: 'CapsLock', width: 1.8 },
    { code: 'KeyA', label: 'A', width: 1 },
    { code: 'KeyS', label: 'S', width: 1 },
    { code: 'KeyD', label: 'D', width: 1 },
    { code: 'KeyF', label: 'F', width: 1 },
    { code: 'KeyG', label: 'G', width: 1 },
    { code: 'KeyH', label: 'H', width: 1 },
    { code: 'KeyJ', label: 'J', width: 1 },
    { code: 'KeyK', label: 'K', width: 1 },
    { code: 'KeyL', label: 'L', width: 1 },
    { code: 'Semicolon', label: ';\n+', width: 1 },
    { code: 'Quote', label: ':\n*', width: 1 },
    { code: 'Backslash', label: ']\n}', width: 1 },
    { code: '', label: '', width: 1.5, empty: true }, // Enter continues from above
    { code: '', label: '', width: 0.5, empty: true },
    { code: '', label: '', width: 3, empty: true },
    { code: '', label: '', width: 0.5, empty: true },
    { code: 'Numpad4', label: '4', width: 1 },
    { code: 'Numpad5', label: '5', width: 1 },
    { code: 'Numpad6', label: '6', width: 1 },
    { code: '', label: '', width: 1, empty: true }, // NumpadAdd continues from above
  ],
  // Row 5: Shift行
  [
    { code: 'ShiftLeft', label: 'Shift', width: 2.3 },
    { code: 'KeyZ', label: 'Z', width: 1 },
    { code: 'KeyX', label: 'X', width: 1 },
    { code: 'KeyC', label: 'C', width: 1 },
    { code: 'KeyV', label: 'V', width: 1 },
    { code: 'KeyB', label: 'B', width: 1 },
    { code: 'KeyN', label: 'N', width: 1 },
    { code: 'KeyM', label: 'M', width: 1 },
    { code: 'Comma', label: ',\n<', width: 1 },
    { code: 'Period', label: '.\n>', width: 1 },
    { code: 'Slash', label: '/\n?', width: 1 },
    { code: 'IntlRo', label: '\\\n_', width: 1 },
    { code: 'ShiftRight', label: 'Shift', width: 2 },
    { code: '', label: '', width: 0.5, empty: true },
    { code: '', label: '', width: 1, empty: true },
    { code: 'ArrowUp', label: '↑', width: 1 },
    { code: '', label: '', width: 1, empty: true },
    { code: '', label: '', width: 0.5, empty: true },
    { code: 'Numpad1', label: '1', width: 1 },
    { code: 'Numpad2', label: '2', width: 1 },
    { code: 'Numpad3', label: '3', width: 1 },
    { code: 'NumpadEnter', label: 'Enter', width: 1, rowSpan: 2 },
  ],
  // Row 6: Control行
  [
    { code: 'ControlLeft', label: 'Ctrl', width: 1.3 },
    { code: 'MetaLeft', label: 'Win', width: 1.3 },
    { code: 'AltLeft', label: 'Alt', width: 1.3 },
    { code: 'NonConvert', label: '無変換', width: 1.3 },
    { code: 'Space', label: 'Space', width: 4.5 },
    { code: 'Convert', label: '変換', width: 1.3 },
    { code: 'KanaMode', label: 'かな', width: 1.3 },
    { code: 'AltRight', label: 'Alt', width: 1.3 },
    { code: 'MetaRight', label: 'Win', width: 1.3 },
    { code: 'ContextMenu', label: 'Menu', width: 1.3 },
    { code: 'ControlRight', label: 'Ctrl', width: 1.3 },
    { code: '', label: '', width: 0.5, empty: true },
    { code: 'ArrowLeft', label: '←', width: 1 },
    { code: 'ArrowDown', label: '↓', width: 1 },
    { code: 'ArrowRight', label: '→', width: 1 },
    { code: '', label: '', width: 0.5, empty: true },
    { code: 'Numpad0', label: '0', width: 2 },
    { code: 'NumpadDecimal', label: '.', width: 1 },
    { code: '', label: '', width: 1, empty: true }, // NumpadEnter continues from above
  ],
];

export default function Keyboard({ pressedKeys, everPressedKeys, onKeyPress, onKeyRelease }: KeyboardProps) {
  const [currentlyPressedKeys, setCurrentlyPressedKeys] = useState<Set<string>>(new Set());
  
  // Duration for simulated key press for keys that only fire KeyUp events
  const SIMULATED_KEY_PRESS_DURATION = 100;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Special keys that need to not preventDefault to work properly
      // MetaLeft/MetaRight (Windows key), Backquote (Zenkaku/Hankaku), KanaMode often have issues with preventDefault
      const specialSystemKeys = ['PrintScreen', 'KanaMode', 'Lang1', 'Lang2', 'MetaLeft', 'MetaRight', 'Backquote'];
      
      if (!specialSystemKeys.includes(e.code)) {
        e.preventDefault();
      }
      
      // Prevent repeat events and duplicate keydown events
      if (e.repeat) {
        return;
      }
      
      // Check if key is already pressed before updating state
      setCurrentlyPressedKeys(prev => {
        if (prev.has(e.code)) {
          return prev;
        }
        const newSet = new Set(prev);
        newSet.add(e.code);
        return newSet;
      });
      
      // Call onKeyPress after state update
      onKeyPress(e.code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Special keys that need to not preventDefault to work properly
      const specialSystemKeys = ['PrintScreen', 'KanaMode', 'Lang1', 'Lang2', 'MetaLeft', 'MetaRight', 'Backquote'];
      
      if (!specialSystemKeys.includes(e.code)) {
        e.preventDefault();
      }
      
      let shouldCallRelease = false;
      let shouldSimulatePress = false;
      
      // Check current state and decide what to do
      setCurrentlyPressedKeys(prev => {
        const specialKeysWithoutKeyDown = ['PrintScreen'];
        
        if (specialKeysWithoutKeyDown.includes(e.code) && !prev.has(e.code)) {
          // Special key that only fires KeyUp - simulate press and release
          shouldSimulatePress = true;
          return prev;
        }
        
        // Only process keyup if we've seen a keydown for this key
        if (prev.has(e.code)) {
          const newSet = new Set(prev);
          newSet.delete(e.code);
          shouldCallRelease = true;
          return newSet;
        }
        
        return prev;
      });
      
      // Call callbacks after state update
      if (shouldSimulatePress) {
        onKeyPress(e.code);
        setTimeout(() => onKeyRelease(e.code), SIMULATED_KEY_PRESS_DURATION);
      } else if (shouldCallRelease) {
        onKeyRelease(e.code);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onKeyPress, onKeyRelease, SIMULATED_KEY_PRESS_DURATION]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-white text-xl font-bold mb-4 text-center">キーボード (109キー)</h2>
      <div className="space-y-1">
        {keyboardLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1">
            {row.map((key, keyIndex) => {
              if (key.empty) {
                return <div key={keyIndex} style={{ width: `${key.width * 40}px` }} />;
              }

              const isPressed = pressedKeys.has(key.code);
              const wasEverPressed = everPressedKeys.has(key.code);

              // 3つの状態を表現:
              // 1. 現在押されている: 黄色 (bg-yellow-400)
              // 2. 過去に押されたことがある (現在は押されていない): 青緑色 (bg-teal-600)
              // 3. 一度も押されていない: グレー (bg-gray-700)
              let bgColor = 'bg-gray-700 text-white';
              if (isPressed) {
                bgColor = 'bg-yellow-400 text-black';
              } else if (wasEverPressed) {
                bgColor = 'bg-teal-600 text-white';
              }

              return (
                <div
                  key={keyIndex}
                  className={`
                    relative
                    flex items-center justify-center
                    border border-gray-600 rounded
                    text-xs font-semibold text-center
                    transition-colors duration-75
                    ${bgColor}
                    ${key.rowSpan === 2 ? 'h-20' : 'h-10'}
                  `}
                  style={{
                    width: `${key.width * 40}px`,
                    minWidth: `${key.width * 40}px`,
                  }}
                >
                  <span className="whitespace-pre-line leading-tight">{key.label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
