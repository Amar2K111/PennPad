'use client'

import { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import FontFamily from '@tiptap/extension-font-family'

import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Toolbar from './Toolbar'


interface MultiPageEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  className?: string
  onEditorReady?: (editor: any) => void
  showToolbar?: boolean
}

export default function MultiPageEditor({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  className = '',
  onEditorReady,
  showToolbar = true,
}: MultiPageEditorProps) {
  const [pageCount, setPageCount] = useState(1)
  const [isEditorEnabled, setIsEditorEnabled] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'single-paragraph',
          },
        },
      }),
      TextStyle.configure({
        HTMLAttributes: {
          class: 'text-style',
        },
      }),
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '<p class="single-paragraph"></p>',
    editable: true,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none editor-content single-editor',
        style: 'font-family: Arial, Helvetica Neue, Helvetica, sans-serif; font-size: 11px; color: #181818; line-height: 1.1; height: 100%; overflow: hidden; padding: 0; margin: 0;',
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML()
      onChange?.(content)
    },
    onCreate: ({ editor }) => {
      // Reset page count to 1 when editor is created
      setPageCount(1)
      setTimeout(() => {
        if (editor && !editor.isDestroyed) {
          editor.commands.focus()
        }
      }, 100)
    },
  })

  // Handle key events for Enter key
  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Allow typing only when Enter is pressed to create new content
      if (event.key === 'Enter') {
        // Enable the editor and allow typing
        setIsEditorEnabled(true)
        editor.commands.focus()
      }
    }

    // Add global key listener to catch Enter even when editor isn't focused
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !isEditorEnabled) {
        setIsEditorEnabled(true)
        if (editor && !editor.isDestroyed) {
          editor.commands.focus()
        }
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    editor.view.dom.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
      editor.view.dom.removeEventListener('keydown', handleKeyDown)
    }
  }, [editor, isEditorEnabled])

  // Always notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor)
    }
  }, [editor, onEditorReady])

  // Add CSS to constrain editor content area
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .multi-page-editor .ProseMirror {
        cursor: text !important;
        user-select: text !important;
      }
      .multi-page-editor .ProseMirror:focus {
        outline: none !important;
      }
      .multi-page-editor .ProseMirror p {
        margin: 0;
        padding: 0;
      }
      .multi-page-editor .ProseMirror p:empty {
        display: none !important;
      }
      .multi-page-editor .ProseMirror p:empty::before {
        content: '';
        display: none !important;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Render editor
  return (
    <div className={`multi-page-editor ${className}`} ref={containerRef}>
      {/* Toolbar */}
      {showToolbar && (
        <div style={{ flexShrink: 0, marginBottom: '20px' }}>
          <Toolbar editor={editor} totalWordCount={0} />
        </div>
      )}
      
      {/* Editor container */}
      <div
        style={{
          position: 'relative',
          background: 'white',
          width: '800px',
          margin: '0 auto',
          border: '0.5px solid #d1d5db',
          minHeight: `${pageCount * 1056}px`,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {!editor ? (
          <div>Loading editor...</div>
        ) : (
          <>
            <div 
              style={{
                position: 'relative',
                padding: '50px 40px 96px 40px',
                boxSizing: 'border-box',
                minHeight: `${pageCount * 1056}px`,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <EditorContent 
                editor={editor} 
                onClick={(e) => {
                  // Prevent all clicks when editor is not enabled
                  if (!isEditorEnabled) {
                    e.preventDefault()
                    e.stopPropagation()
                    return false
                  }
                }}
                onMouseDown={(e) => {
                  // Prevent all mouse down events when editor is not enabled
                  if (!isEditorEnabled) {
                    e.preventDefault()
                    e.stopPropagation()
                    return false
                  }
                }}
                style={{
                  minHeight: `${pageCount * 1056}px`,
                  padding: '0',
                  margin: '0',
                  cursor: isEditorEnabled ? 'text' : 'default',
                  userSelect: isEditorEnabled ? 'text' : 'none',
                  opacity: isEditorEnabled ? 1 : 0.7,
                  pointerEvents: isEditorEnabled ? 'auto' : 'none'
                }}
              />
            </div>
            
            {/* Visual page dividers */}
            {Array.from({ length: pageCount - 1 }, (_, index) => (
              <div 
                key={`divider-${index}`}
                style={{
                  position: 'absolute',
                  top: `${(index + 1) * 1056}px`,
                  left: '0',
                  right: '0',
                  height: '1px',
                  backgroundColor: '#e5e7eb',
                  pointerEvents: 'none'
                }}
              />
            ))}
            
            {/* Bottom line indicators for each page */}
            {Array.from({ length: pageCount }, (_, index) => (
              <div 
                key={`bottom-line-${index}`}
                className="page-bottom-line"
                style={{
                  position: 'absolute',
                  top: `${(index + 1) * 1056 - 96}px`,
                  left: '40px',
                  right: '40px',
                  height: '1px',
                  backgroundColor: '#d1d5db',
                  pointerEvents: 'none'
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
} 