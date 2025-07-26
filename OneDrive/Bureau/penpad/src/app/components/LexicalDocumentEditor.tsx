'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot, $getSelection, $createParagraphNode, $createTextNode, EditorState, $isRangeSelection, $isTextNode } from 'lexical'
import { LinkNode } from '@lexical/link'
import { ListNode, ListItemNode } from '@lexical/list'
import { CodeNode, CodeHighlightNode } from '@lexical/code'
import LexicalToolbar from './LexicalToolbar'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'

interface LexicalDocumentEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  className?: string
  onEditorReady?: (editor: any) => void
  showToolbar?: boolean
}

// Custom plugin for click prevention
function ClickPreventionPlugin({ isEnabled }: { isEnabled: boolean }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!isEnabled) {
      const handleClick = (e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        return false
      }

      const editorElement = editor.getRootElement()
      if (editorElement) {
        editorElement.addEventListener('click', handleClick)
        editorElement.addEventListener('mousedown', handleClick)
        
        return () => {
          editorElement.removeEventListener('click', handleClick)
          editorElement.removeEventListener('mousedown', handleClick)
        }
      }
    }
  }, [editor, isEnabled])

  return null
}

// Custom plugin for toolbar integration
function ToolbarPlugin({ editorRef, onEditorReady }: { editorRef: any, onEditorReady?: (editor: any) => void }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor
      onEditorReady?.(editor)
    }
  }, [editor, editorRef, onEditorReady])

  return null
}

export default function LexicalDocumentEditor({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  className = '',
  onEditorReady,
  showToolbar = true,
}: LexicalDocumentEditorProps) {
  const [isEditorEnabled, setIsEditorEnabled] = useState(false)
  const editorRef = useRef<any>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [wordCount, setWordCount] = useState(0)

  // Lexical configuration
  const initialConfig = {
    namespace: 'DocumentEditor',
    nodes: [
      LinkNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
    ],
    theme: {
      root: 'editor-root',
      paragraph: 'editor-paragraph',
      text: {
        bold: 'editor-text-bold',
        italic: 'editor-text-italic',
        underline: 'editor-text-underline',
      },
    },
    onError: (error: Error) => {
      console.error('Lexical error:', error)
    },
  }

  // Handle key events for Enter key
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !isEditorEnabled) {
        setIsEditorEnabled(true)
        if (editorRef.current) {
          editorRef.current.focus()
        }
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [isEditorEnabled])

  // Add CSS for Google Docs-style document styling
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .document-editor-container {
        background: #f5f5f5;
        min-height: 100vh;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .editor-wrapper {
        background: white;
        width: 800px;
        min-height: 1056px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
        border-radius: 2px;
        position: relative;
        margin-bottom: 20px;
      }
      
      .editor-root {
        font-family: Arial, Helvetica Neue, Helvetica, sans-serif;
        color: #181818;
        line-height: 1.1;
        padding: 50px 40px 96px 40px;
        min-height: 1056px;
        background: white;
        width: 100%;
        margin: 0;
        position: relative;
        box-sizing: border-box;
        outline: none;
        resize: none;
        overflow: visible;
      }
      
      .editor-root:focus {
        outline: none;
      }
      
      .editor-paragraph {
        margin: 0;
        padding: 0;
      }
      
      .editor-text-bold {
        font-weight: bold;
      }
      
      .editor-text-italic {
        font-style: italic;
      }
      
      .editor-text-underline {
        text-decoration: underline;
      }
      
      /* Google Docs-style page breaks */
      .editor-root::after {
        content: '';
        position: absolute;
        top: 960px;
        left: 40px;
        right: 40px;
        height: 1px;
        background-color: #d1d5db;
        pointer-events: none;
      }
      
      /* Additional page breaks for content that exceeds one page */
      .editor-root[data-pages="2"]::after {
        box-shadow: 
          0 960px 0 0 #d1d5db,
          0 1056px 0 0 #e5e7eb;
      }
      
      .editor-root[data-pages="3"]::after {
        box-shadow: 
          0 960px 0 0 #d1d5db,
          0 1056px 0 0 #e5e7eb,
          0 2016px 0 0 #d1d5db,
          0 2112px 0 0 #e5e7eb;
      }
      
      .editor-root[data-pages="4"]::after {
        box-shadow: 
          0 960px 0 0 #d1d5db,
          0 1056px 0 0 #e5e7eb,
          0 2016px 0 0 #d1d5db,
          0 2112px 0 0 #e5e7eb,
          0 3072px 0 0 #d1d5db,
          0 3168px 0 0 #e5e7eb;
      }
      
      .editor-root[data-pages="5"]::after {
        box-shadow: 
          0 960px 0 0 #d1d5db,
          0 1056px 0 0 #e5e7eb,
          0 2016px 0 0 #d1d5db,
          0 2112px 0 0 #e5e7eb,
          0 3072px 0 0 #d1d5db,
          0 3168px 0 0 #e5e7eb,
          0 4128px 0 0 #d1d5db,
          0 4224px 0 0 #e5e7eb;
      }
      
      /* Container height adjustment based on content */
      .editor-wrapper[data-pages="1"] {
        min-height: 1056px;
      }
      
      .editor-wrapper[data-pages="2"] {
        min-height: 2112px;
      }
      
      .editor-wrapper[data-pages="3"] {
        min-height: 3168px;
      }
      
      .editor-wrapper[data-pages="4"] {
        min-height: 4224px;
      }
      
      .editor-wrapper[data-pages="5"] {
        min-height: 5280px;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Handle undo/redo
  const handleUndo = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.dispatchCommand('undo')
    }
  }, [])

  const handleRedo = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.dispatchCommand('redo')
    }
  }, [])

  // Calculate page count based on content
  const calculatePageCount = useCallback((content: string) => {
    const lineHeight = 1.1
    const fontSize = 15
    const lineHeightPx = fontSize * lineHeight
    const charactersPerLine = 800 / (fontSize * 0.6)
    const lines = content.length / charactersPerLine
    const estimatedHeight = lines * lineHeightPx
    const pageHeight = 960 // Content area height (1056 - margins)
    return Math.max(1, Math.ceil(estimatedHeight / pageHeight))
  }, [])

  return (
    <div className={`document-editor-container ${className}`}>
      {/* Editor */}
      <LexicalComposer initialConfig={initialConfig}>
        {/* Toolbar inside LexicalComposer context */}
        {showToolbar && (
          <div style={{ flexShrink: 0, marginBottom: '20px' }}>
            <LexicalToolbar 
              totalWordCount={wordCount}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          </div>
        )}
        
        <div className="editor-wrapper" data-pages="1">
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="editor-root"
                style={{
                  cursor: isEditorEnabled ? 'text' : 'default',
                  userSelect: isEditorEnabled ? 'text' : 'none',
                  opacity: isEditorEnabled ? 1 : 0.7,
                  pointerEvents: isEditorEnabled ? 'auto' : 'none'
                }}
              />
            }
            placeholder={
              <div style={{
                position: 'absolute',
                top: '50px',
                left: '40px',
                color: '#999',
                pointerEvents: 'none',
                userSelect: 'none'
              }}>
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          
          <HistoryPlugin />
          <AutoFocusPlugin />
          <LinkPlugin />
          <ListPlugin />
          
          <OnChangePlugin
            onChange={(editorState: EditorState) => {
              editorState.read(() => {
                const root = $getRoot()
                const content = root.getTextContent()
                onChange?.(content)
                
                // Update word count
                const words = content.trim().split(/\s+/).filter(word => word.length > 0)
                setWordCount(words.length)
                
                // Update page count
                const pageCount = calculatePageCount(content)
                const editorWrapper = document.querySelector('.editor-wrapper')
                const editorRoot = document.querySelector('.editor-root')
                if (editorWrapper && editorRoot) {
                  editorWrapper.setAttribute('data-pages', pageCount.toString())
                  editorRoot.setAttribute('data-pages', pageCount.toString())
                }
              })
            }}
          />
          
          <ClickPreventionPlugin isEnabled={isEditorEnabled} />
          <ToolbarPlugin editorRef={editorRef} onEditorReady={onEditorReady} />
        </div>
      </LexicalComposer>
    </div>
  )
} 