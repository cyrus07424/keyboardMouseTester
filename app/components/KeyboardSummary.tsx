'use client';

import {useMemo} from 'react';

interface KeyEvent {
  timestamp: number;
  key: string;
  isPressed: boolean;
}

interface KeyboardSummaryProps {
  keyPressCounts: Record<string, number>;
  events: KeyEvent[];
}

const TOTAL_KEYS_109 = 109;
const RECENT_HISTORY_LIMIT = 20;

export default function KeyboardSummary({ keyPressCounts, events }: KeyboardSummaryProps) {
  const testedKeys = useMemo(() => Object.keys(keyPressCounts), [keyPressCounts]);

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

  return (
    <div className="grid gap-4 md:grid-cols-2 mb-6">
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

