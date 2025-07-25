'use client'

import { createPortal } from 'react-dom'

interface ContextMenuProps {
  visible: boolean
  x: number
  y: number
  suggestions?: string[]
  onReplace?: (suggestion: string) => void
  onIgnore?: () => void
  onAddToDictionary?: () => void
  onAlwaysCorrect?: () => void
  onSpellingGrammarCheck?: () => void
  onFeedback?: () => void
}

export default function ContextMenu({
  visible,
  x,
  y,
  suggestions = [],
  onReplace,
  onIgnore,
  onAddToDictionary,
  onAlwaysCorrect,
  onSpellingGrammarCheck,
  onFeedback
}: ContextMenuProps) {
  if (!visible) {
    return null;
  }
  
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 1000,
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        minWidth: 200,
        padding: '8px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px'
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Top Section - Spelling */}
      <div style={{ borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
        <div
          style={{
            padding: '8px 16px',
            color: '#666',
            fontStyle: 'italic',
            fontSize: '12px',
            fontWeight: 500
          }}
        >
          Spelling
        </div>
        
        {/* Suggestions */}
        {suggestions.length > 0 ? (
          suggestions.map((suggestion, index) => (
            <div
              key={index}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => onReplace?.(suggestion)}
            >
              {suggestion}
              <span style={{ color: '#999', fontSize: '12px' }}>▶</span>
            </div>
          ))
        ) : (
          <div
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              color: '#999',
              fontStyle: 'italic'
            }}
          >
            No suggestions
          </div>
        )}
        

      </div>

      {/* Middle Section - Ignore Options */}
      <div>
        <div
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          onClick={onIgnore}
        >
          Ignore all
        </div>
        
        <div
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          onClick={onAlwaysCorrect}
        >
          Always correct to "{suggestions[0]}"
        </div>
        
        <div
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          onClick={onAddToDictionary}
        >
          Add to personal dictionary
        </div>
      </div>


    </div>,
    document.body
  )
} 