'use client';

import { useEffect, useRef, useState } from 'react';

interface KeyEvent {
  timestamp: number;
  key: string;
  isPressed: boolean;
}

interface EventLogProps {
  events: KeyEvent[];
}

export default function EventLog({ events }: EventLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);

  // Detect manual scrolling
  const handleScroll = () => {
    if (logContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
      setAutoScroll(isAtBottom);
    }
  };

  // Format timestamp to readable time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  };

  // Display only the last 100 events to prevent performance issues
  const displayEvents = events.slice(-100);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-xl font-bold">
          イベントログ
        </h2>
        <div className="text-sm text-gray-400">
          {autoScroll ? '自動スクロール: ON' : '自動スクロール: OFF (下にスクロールでON)'}
        </div>
      </div>
      <div
        ref={logContainerRef}
        onScroll={handleScroll}
        className="bg-gray-900 rounded p-3 h-64 overflow-y-auto font-mono text-sm"
      >
        {displayEvents.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            キーを押すとイベントがここに表示されます
          </div>
        ) : (
          <div className="space-y-1">
            {displayEvents.map((event, index) => (
              <div
                key={`${event.timestamp}-${index}`}
                className={`flex gap-3 ${
                  event.isPressed
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                <span className="text-gray-500 w-28 flex-shrink-0">
                  {formatTime(event.timestamp)}
                </span>
                <span className="w-16 flex-shrink-0">
                  {event.isPressed ? 'DOWN' : 'UP'}
                </span>
                <span className="text-white font-semibold">
                  {event.key}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
