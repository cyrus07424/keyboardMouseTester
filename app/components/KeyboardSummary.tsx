'use client';

import {useMemo} from 'react';
import {KNOWN_KEY_CODES} from './Keyboard';

interface KeyEvent {
  timestamp: number;
  key: string;
  isPressed: boolean;
}

interface KeyboardSummaryProps {
  keyPressCounts: Record<string, number>;
  events: KeyEvent[];
  pressedKeys: Set<string>;
  viewMode: 'normal' | 'heatmap';
}

const TOTAL_KEYS_109 = 109;
const RECENT_HISTORY_LIMIT = 20;

export default function KeyboardSummary({ keyPressCounts, events, pressedKeys, viewMode }: KeyboardSummaryProps) {
  const testedKeys = useMemo(
    () => Object.keys(keyPressCounts).filter(code => KNOWN_KEY_CODES.has(code)),
    [keyPressCounts],
  );

  const unknownKeyEntries = useMemo(
    () => Object.entries(keyPressCounts)
      .filter(([code, count]) => !KNOWN_KEY_CODES.has(code) && count > 0)
      .sort((a, b) => b[1] - a[1]),
    [keyPressCounts],
  );

  const testedPercent = useMemo(() => {
    return (testedKeys.length / TOTAL_KEYS_109) * 100;
  }, [testedKeys.length]);

  const recentKeys = useMemo(
    () => events
      .filter(event => event.isPressed && !event.key.startsWith('Mouse'))
      .slice(-RECENT_HISTORY_LIMIT)
      .reverse(),
    [events],
  );

  const maxPressCount = useMemo(
    () => Object.values(keyPressCounts).reduce((max, count) => (count > max ? count : max), 0),
    [keyPressCounts],
  );

  const getHeatmapStyle = (count: number) => {
    if (count <= 0 || maxPressCount <= 0) return undefined;

    const normalized = Math.log(count + 1) / Math.log(maxPressCount + 1);
    const hue = 220 - (220 * normalized);
    const lightness = 32 + (14 * normalized);

    return {
      backgroundColor: `hsl(${hue} 78% ${lightness}%)`,
      color: '#f9fafb',
    };
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 mb-6">
      {unknownKeyEntries.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 border border-amber-600/60 md:col-span-2">
            <h3 className="text-amber-300 font-bold mb-2">未定義キーコードの入力</h3>
            <div className="flex flex-wrap gap-2">
              {unknownKeyEntries.map(([code, count]) => {
                const isPressed = pressedKeys.has(code);
                let baseClassName = 'px-2 py-1 text-xs rounded border border-gray-600';

                if (viewMode === 'heatmap') {
                  baseClassName += ' text-white';
                } else if (isPressed) {
                  baseClassName += ' bg-yellow-400 text-black';
                } else {
                  baseClassName += ' bg-teal-600 text-white';
                }

                return (
                    <span
                        key={code}
                        className={baseClassName}
                        style={viewMode === 'heatmap' ? getHeatmapStyle(count) : undefined}
                    >
                  {viewMode === 'heatmap' ? `${code}: ${count}回` : code}
                </span>
                );
              })}
            </div>
          </div>
      )}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-white font-bold mb-2">キー到達率</h3>
        <div className="text-3xl font-bold text-emerald-400 mb-1">{testedPercent.toFixed(1)}%</div>
        <div className="text-sm text-gray-400">{testedKeys.length} / {TOTAL_KEYS_109} キー</div>
        <div className="w-full h-2 bg-gray-700 rounded mt-3 overflow-hidden">
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${Math.min(testedPercent, 100)}%` }}
          />
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-white font-bold mb-2">直近入力キー</h3>
        {recentKeys.length === 0 ? (
          <div className="text-sm text-gray-500">まだキー入力がありません</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recentKeys.map((event, index) => (
              <span
                key={`${event.timestamp}-${event.key}-${index}`}
                className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-100 border border-gray-600"
              >
                {event.key}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

