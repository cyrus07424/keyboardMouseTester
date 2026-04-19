'use client';

import {useEffect, useRef, useState} from 'react';

interface KeyboardProps {
  pressedKeys: Set<string>;
  everPressedKeys: Set<string>;
  onKeyPress: (key: string) => void;
  onKeyRelease: (key: string) => void;
}

// Duration for simulated key press for keys that only fire KeyUp events
const SIMULATED_KEY_PRESS_DURATION = 100;

// Special keys that need to not preventDefault to work properly
// MetaLeft/MetaRight (Windows key), Backquote (Zenkaku/Hankaku), KanaMode often have issues with preventDefault
const SPECIAL_SYSTEM_KEYS = [
  'PrintScreen',
  'KanaMode',
  'Lang1',
  'Lang2',
  'MetaLeft',
  'MetaRight',
  'Backquote',
  'Convert',
  'NonConvert',
  'CapsLock',
];

// Some IME-related keys may miss keydown/keyup depending on browser/IME.
const IME_TOGGLE_KEYS = new Set(['Backquote', 'KanaMode', 'Convert', 'NonConvert', 'CapsLock']);
const IME_RELEASE_FALLBACK_MS = 120;
const KEYUP_TAP_KEYS = new Set(['Backquote', 'KanaMode', 'Convert', 'NonConvert', 'PrintScreen', 'CapsLock']);
const DEBUG_QUERY_KEY = 'kbdDebug';
const DEBUG_STORAGE_KEY = 'keyboardDebug';
const KANA_KEY_ALIASES = new Set([
  'KanaMode',
  'Kana',
  'Hiragana',
  'Katakana',
  'HiraganaKatakana',
  'ModeChange',
  'Process',
  'KanjiMode',
]);

// Absorb browser/IME differences for JIS special keys.
const normalizeJisKeyCode = (code: string, key: string): string => {
  if (code === 'ZenkakuHankaku' || key === 'ZenkakuHankaku') {
    return 'Backquote';
  }

  if (code === 'Lang1' || code === 'Lang2') {
    return 'KanaMode';
  }

  if (KANA_KEY_ALIASES.has(key)) {
    return 'KanaMode';
  }

  // Waterfox/Firefox + IME では code が Unidentified のままになる場合がある
  if (code === 'Unidentified' && (KANA_KEY_ALIASES.has(key) || key === 'Dead')) {
    return 'KanaMode';
  }

  return code;
};

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
    { code: 'Backspace', label: 'BS', width: 1.1 },
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
    { code: 'BracketRight', label: '[\n{', width: 1.3 },
    { code: 'Enter', label: 'Enter', width: 1.4, rowSpan: 2 },
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
    { code: '', label: '', width: 1.4, empty: true }, // Enter continues from above
    { code: '', label: '', width: 0.5, empty: true },
    { code: '', label: '', width: 1, empty: true },
    { code: '', label: '', width: 1, empty: true },
    { code: '', label: '', width: 1, empty: true },
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
    { code: 'ControlLeft', label: 'Ctrl', width: 1.1 },
    { code: 'MetaLeft', label: 'Win', width: 1.1 },
    { code: 'AltLeft', label: 'Alt', width: 1.1 },
    { code: 'NonConvert', label: '無変換', width: 1.1 },
    { code: 'Space', label: 'Space', width: 4.5 },
    { code: 'Convert', label: '変換', width: 1.1 },
    { code: 'KanaMode', label: 'かな', width: 1.1 },
    { code: 'AltRight', label: 'Alt', width: 1.1 },
    { code: 'MetaRight', label: 'Win', width: 1.1 },
    { code: 'ContextMenu', label: 'Menu', width: 1.1 },
    { code: 'ControlRight', label: 'Ctrl', width: 1.1 },
    { code: '', label: '', width: 0.5, empty: true },
    { code: 'ArrowLeft', label: '←', width: 1 },
    { code: 'ArrowDown', label: '↓', width: 1 },
    { code: 'ArrowRight', label: '→', width: 1 },
    { code: '', label: '', width: 0.5, empty: true },
    { code: 'Numpad0', label: '0', width: 2.1 },
    { code: 'NumpadDecimal', label: '.', width: 1 },
    { code: '', label: '', width: 1, empty: true }, // NumpadEnter continues from above
  ],
];

export default function Keyboard({ pressedKeys, everPressedKeys, onKeyPress, onKeyRelease }: KeyboardProps) {
  // useRef を使うことでイベントハンドラ内から同期的に参照・更新できる
  const currentlyPressedKeysRef = useRef<Set<string>>(new Set());
  const releaseTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const lastTapTimeRef = useRef<Map<string, number>>(new Map());
  const [debugEnabled, setDebugEnabled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get(DEBUG_QUERY_KEY);

    if (query === '1' || query === 'true') {
      setDebugEnabled(true);
      window.localStorage.setItem(DEBUG_STORAGE_KEY, '1');
      return;
    }

    if (query === '0' || query === 'false') {
      setDebugEnabled(false);
      window.localStorage.setItem(DEBUG_STORAGE_KEY, '0');
      return;
    }

    setDebugEnabled(window.localStorage.getItem(DEBUG_STORAGE_KEY) === '1');
  }, []);

  const toggleDebug = () => {
    const next = !debugEnabled;
    setDebugEnabled(next);
    window.localStorage.setItem(DEBUG_STORAGE_KEY, next ? '1' : '0');
    console.info(`[KeyboardDebug] ${next ? 'enabled' : 'disabled'}`);
  };

  const debugLog = (tag: string, payload: Record<string, unknown>) => {
    if (!debugEnabled) return;
    console.debug(`[KeyboardDebug] ${tag}`, payload);
  };

  useEffect(() => {
    const forceReleaseAllKeys = (reason: 'blur' | 'hidden' | 'cleanup') => {
      if (currentlyPressedKeysRef.current.size === 0) return;

      const pressedCodes = Array.from(currentlyPressedKeysRef.current);
      debugLog('forceReleaseAllKeys', { reason, pressedCodes });

      pressedCodes.forEach(code => {
        currentlyPressedKeysRef.current.delete(code);
        onKeyRelease(code);
      });
    };

    const clearReleaseTimer = (code: string) => {
      const timer = releaseTimersRef.current.get(code);
      if (timer) {
        clearTimeout(timer);
        releaseTimersRef.current.delete(code);
      }
    };

    const scheduleReleaseFallback = (code: string) => {
      clearReleaseTimer(code);
      debugLog('scheduleReleaseFallback', { code, afterMs: IME_RELEASE_FALLBACK_MS });
      const timer = setTimeout(() => {
        if (currentlyPressedKeysRef.current.has(code)) {
          currentlyPressedKeysRef.current.delete(code);
          onKeyRelease(code);
          debugLog('releaseFallbackFired', { code });
        }
        releaseTimersRef.current.delete(code);
      }, IME_RELEASE_FALLBACK_MS);
      releaseTimersRef.current.set(code, timer);
    };

    const emitTap = (code: string, source: 'keyupOnly' | 'fallback') => {
      const now = performance.now();
      const lastTapAt = lastTapTimeRef.current.get(code) ?? 0;
      if (now - lastTapAt < 40) {
        debugLog('tapSkippedAsDuplicate', { code, source, deltaMs: now - lastTapAt });
        return;
      }

      lastTapTimeRef.current.set(code, now);
      clearReleaseTimer(code);
      currentlyPressedKeysRef.current.delete(code);

      debugLog('emitTapPress', { code, source });
      onKeyPress(code);
      setTimeout(() => {
        debugLog('emitTapRelease', { code, source });
        onKeyRelease(code);
      }, SIMULATED_KEY_PRESS_DURATION);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const normalizedCode = normalizeJisKeyCode(e.code, e.key);
      const isImeToggleKey = IME_TOGGLE_KEYS.has(normalizedCode);
      debugLog('keydown', {
        key: e.key,
        code: e.code,
        normalizedCode,
        repeat: e.repeat,
        isComposing: e.isComposing,
        location: e.location,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        timeStamp: e.timeStamp,
      });

      if (!SPECIAL_SYSTEM_KEYS.includes(normalizedCode)) {
        e.preventDefault();
      }

      // 通常キーは repeat を無視。IMEトグル系は repeat=true のみ届く環境があるため許可する。
      if (e.repeat && !isImeToggleKey) return;
      if (currentlyPressedKeysRef.current.has(normalizedCode)) return;

      currentlyPressedKeysRef.current.add(normalizedCode);
      onKeyPress(normalizedCode);

      // Waterfox/IME では keyup が来ない場合があるためフォールバックで解放する
      if (isImeToggleKey) {
        scheduleReleaseFallback(normalizedCode);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const normalizedCode = normalizeJisKeyCode(e.code, e.key);
      debugLog('keyup', {
        key: e.key,
        code: e.code,
        normalizedCode,
        repeat: e.repeat,
        isComposing: e.isComposing,
        location: e.location,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        timeStamp: e.timeStamp,
      });

      if (!SPECIAL_SYSTEM_KEYS.includes(normalizedCode)) {
        e.preventDefault();
      }

      if (KEYUP_TAP_KEYS.has(normalizedCode) && !currentlyPressedKeysRef.current.has(normalizedCode)) {
        // keydown が来ないキー: keyup を1回タップとして扱う
        emitTap(normalizedCode, 'keyupOnly');
        return;
      }

      // 対応する keydown を見た場合のみ release を発火
      if (currentlyPressedKeysRef.current.has(normalizedCode)) {
        clearReleaseTimer(normalizedCode);
        currentlyPressedKeysRef.current.delete(normalizedCode);
        onKeyRelease(normalizedCode);
      }
    };

    const handleWindowBlur = () => {
      forceReleaseAllKeys('blur');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        forceReleaseAllKeys('hidden');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      forceReleaseAllKeys('cleanup');
      releaseTimersRef.current.forEach(timer => clearTimeout(timer));
      releaseTimersRef.current.clear();
    };
  }, [debugEnabled, onKeyPress, onKeyRelease]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-xl font-bold">キーボード (109キー)</h2>
        <button
          onClick={toggleDebug}
          className={`px-3 py-1 text-xs rounded border transition-colors ${debugEnabled
            ? 'bg-amber-600 border-amber-500 text-white hover:bg-amber-500'
            : 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'}`}
          type="button"
        >
          Debug: {debugEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
      <div className="space-y-1">
        {keyboardLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="relative flex gap-1 h-10">
            {row.map((key, keyIndex) => {
              const keyWidth = `${key.width * 40}px`;

              if (key.empty) {
                return <div key={keyIndex} style={{ width: keyWidth, minWidth: keyWidth }} />;
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

              if (key.rowSpan === 2) {
                return (
                  <div
                    key={keyIndex}
                    className="relative"
                    style={{ width: keyWidth, minWidth: keyWidth }}
                  >
                    <div
                      className={`
                        absolute top-0 left-0 z-10
                        flex items-center justify-center
                        border border-gray-600 rounded
                        text-xs font-semibold text-center
                        transition-colors duration-75
                        ${bgColor}
                        h-21 w-full
                      `}
                    >
                      <span className="whitespace-pre-line leading-tight">{key.label}</span>
                    </div>
                  </div>
                );
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
                    h-10
                  `}
                  style={{
                    width: keyWidth,
                    minWidth: keyWidth,
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
