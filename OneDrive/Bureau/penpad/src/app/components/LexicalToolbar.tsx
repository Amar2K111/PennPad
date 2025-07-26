'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'


import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from '@heroicons/react/24/outline'

interface LexicalToolbarProps {
  totalWordCount: number
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
}

const LexicalToolbar = React.memo(({ 
  totalWordCount, 
  onUndo, 
  onRedo, 
  canUndo = true, 
  canRedo = true 
}: LexicalToolbarProps) => {

  


  const handleUndo = useCallback(() => {
    if (onUndo) {
      onUndo()
    }
  }, [onUndo])

  const handleRedo = useCallback(() => {
    if (onRedo) {
      onRedo()
    }
  }, [onRedo])


  


  return (
    <div className="flex items-center gap-1 p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Undo/Redo */}
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded disabled:opacity-50"
        title="Undo"
      >
        <ArrowUturnLeftIcon className="h-4 w-4" />
      </button>
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded disabled:opacity-50"
        title="Redo"
      >
        <ArrowUturnRightIcon className="h-4 w-4" />
      </button>





      {/* Word count */}
      <div className="text-sm text-gray-600 ml-auto">
        {totalWordCount} words
      </div>
    </div>
  )
})

LexicalToolbar.displayName = 'LexicalToolbar'

export default LexicalToolbar 