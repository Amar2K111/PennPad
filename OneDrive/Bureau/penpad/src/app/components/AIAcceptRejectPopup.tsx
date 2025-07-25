'use client'

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface AIAcceptRejectPopupProps {
  isVisible: boolean
  position: { top: number; left: number }
  onAccept: () => void
  onReject: () => void
  onClose: () => void
}

export default function AIAcceptRejectPopup({
  isVisible,
  position,
  onAccept,
  onReject,
  onClose
}: AIAcceptRejectPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const autoDismissTimer = useRef<NodeJS.Timeout | null>(null)

  // No auto-dismiss timer - popup stays until user chooses
  useEffect(() => {
    // Popup will stay visible until user clicks "Keep" or "Undo"
    // No automatic dismissal
  }, [isVisible, onClose])

  if (!isVisible) return null

  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex gap-1 items-center"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px'
      }}
    >
      {/* Keep Button (Green Check) */}
      <button
        onClick={onAccept}
        className="flex items-center justify-center w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors duration-200 shadow-sm"
        title="Keep AI changes"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </button>

      {/* Undo Button (Red X) */}
      <button
        onClick={onReject}
        className="flex items-center justify-center w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors duration-200 shadow-sm"
        title="Undo AI changes"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>,
    document.body
  )
} 