'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection, $isTextNode } from 'lexical'
import { FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND } from 'lexical'
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  ListNumberedIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  MinusIcon,
  PlusIcon,
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
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [fontSize, setFontSize] = useState(15)
  
  // Always call the hook at the top level
  const editor = useLexicalComposerContext()
  
  // If no editor context, return basic toolbar
  if (!editor) {
    return (
      <div className="flex items-center gap-1 p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="text-sm text-gray-600 ml-auto">
          {totalWordCount} words
        </div>
      </div>
    )
  }

  // Update toolbar state based on selection
  useEffect(() => {
    if (!editor) return
    
    // Use the correct Lexical API to register update listener
    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          // Check formatting
          setIsBold(selection.hasFormat('bold'))
          setIsItalic(selection.hasFormat('italic'))
          setIsUnderline(selection.hasFormat('underline'))
        }
      })
    })
    
    return removeUpdateListener
  }, [editor])

  const handleBold = useCallback(() => {
    if (editor) {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
    }
  }, [editor])

  const handleItalic = useCallback(() => {
    if (editor) {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
    }
  }, [editor])

  const handleUnderline = useCallback(() => {
    if (editor) {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
    }
  }, [editor])

  const handleUndo = useCallback(() => {
    if (onUndo) {
      onUndo()
    } else if (editor) {
      editor.dispatchCommand(UNDO_COMMAND, undefined)
    }
  }, [editor, onUndo])

  const handleRedo = useCallback(() => {
    if (onRedo) {
      onRedo()
    } else if (editor) {
      editor.dispatchCommand(REDO_COMMAND, undefined)
    }
  }, [editor, onRedo])

  const handleDecreaseFont = useCallback(() => {
    const newSize = Math.max(12, fontSize - 1)
    setFontSize(newSize)
    // Apply font size to selection
    if (editor) {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          // This is a simplified implementation - in a real app you'd want more sophisticated font size handling
          selection.format = newSize
        }
      })
    }
  }, [editor, fontSize])

  const handleIncreaseFont = useCallback(() => {
    const newSize = Math.min(72, fontSize + 1)
    setFontSize(newSize)
    // Apply font size to selection
    if (editor) {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          // This is a simplified implementation - in a real app you'd want more sophisticated font size handling
          selection.format = newSize
        }
      })
    }
  }, [editor, fontSize])

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

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Font size controls */}
      <div className="flex items-center gap-0.5">
        <button 
          onClick={handleDecreaseFont} 
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded" 
          title="Decrease font size"
        >
          <MinusIcon className="h-4 w-4" />
        </button>
        <span className="w-8 h-8 flex items-center justify-center text-sm font-semibold bg-white border rounded select-none">
          {fontSize}
        </span>
        <button 
          onClick={handleIncreaseFont} 
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded" 
          title="Increase font size"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Text formatting */}
      <button 
        onClick={handleBold} 
        className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 font-bold text-base ${
          isBold ? 'text-blue-700 bg-blue-50' : ''
        }`}
        title="Bold"
      >
        B
      </button>
      <button 
        onClick={handleItalic} 
        className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 italic text-base ${
          isItalic ? 'text-blue-700 bg-blue-50' : ''
        }`}
        title="Italic"
      >
        /
      </button>
      <button 
        onClick={handleUnderline} 
        className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 underline text-base ${
          isUnderline ? 'text-blue-700 bg-blue-50' : ''
        }`}
        title="Underline"
      >
        U
      </button>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Word count */}
      <div className="text-sm text-gray-600 ml-auto">
        {totalWordCount} words
      </div>
    </div>
  )
})

LexicalToolbar.displayName = 'LexicalToolbar'

export default LexicalToolbar 