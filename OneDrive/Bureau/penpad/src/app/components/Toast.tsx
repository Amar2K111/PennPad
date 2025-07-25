'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export default function Toast({ message, type = 'info', duration = 3000, onClose, actionLabel, onAction }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 200); // Wait for fade out animation
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`min-w-[340px] max-w-md px-6 py-2 shadow-xl transition-all duration-200
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        bg-[#222] text-white flex items-center justify-between select-none rounded-md`}
    >
      <span className="text-sm font-normal mr-4 whitespace-nowrap overflow-hidden text-ellipsis">{message}</span>
      {actionLabel && onAction && (
        <button
          className="ml-2 text-blue-400 font-medium text-sm hover:underline focus:outline-none"
          onClick={() => {
            onAction();
            setIsVisible(false);
            setTimeout(onClose, 200);
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
} 