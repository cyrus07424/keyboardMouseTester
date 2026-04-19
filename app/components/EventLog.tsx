'use client';

import {useEffect, useMemo, useRef, useState} from 'react';

interface KeyEvent {
  timestamp: number;
  key: string;
  isPressed: boolean;
}

interface EventLogProps {
  events: KeyEvent[];
}

export default function EventLog({ events }: EventLogProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const checkIsAtBottom = () => {
    if (!logContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    return scrollHeight - (scrollTop + clientHeight) < 8;
  };

  const scrollToBottom = () => {
    if (!logContainerRef.current) return;
    logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    setIsAtBottom(true);
  };

  useEffect(() => {
    if (!logContainerRef.current) return;
    // Auto-follow only when already at bottom.
    if (isAtBottom) {
      scrollToBottom();
    } else {
      setIsAtBottom(checkIsAtBottom());
    }
  }, [events.length, isAtBottom]);

  const handleScroll = () => {
    setIsAtBottom(checkIsAtBottom());
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
  const displayEvents = useMemo(() => events.slice(-100), [events]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-xl font-bold">
          イベントログ
        </h2>
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
                key={`${event.timestamp}-${event.key}-${event.isPressed ? 'down' : 'up'}-${index}`}
                className={`flex gap-3 ${
                  event.isPressed
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                <span className="text-gray-500 w-28 shrink-0">
                  {formatTime(event.timestamp)}
                </span>
                <span className="w-16 shrink-0">
                  {event.isPressed ? 'DOWN' : 'UP'}
                </span>
                <span className="text-white font-semibold">
                  {event.key}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {!isAtBottom && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={scrollToBottom}
            className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 transition-colors"
          >
            最下部へスクロール
          </button>
        </div>
      )}
    </div>
  );
}
