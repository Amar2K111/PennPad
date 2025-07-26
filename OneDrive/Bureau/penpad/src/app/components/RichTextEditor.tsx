'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import BubbleMenu from '@tiptap/extension-bubble-menu'
import CharacterCount from '@tiptap/extension-character-count'
import Color from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlock from '@tiptap/extension-code-block'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '@/app/store/useEditorStore'
import { useUserStore } from '@/app/store/useUserStore'
import { countWords, countCharacters, calculateReadingTime } from '@/app/lib/utils'
import Toolbar from './Toolbar'
import AIBubbleMenu from './AIBubbleMenu'
import { franc } from 'franc-min'
import NSpell from 'nspell'
import { createPortal } from 'react-dom'
import ContextMenu from './ContextMenu'

// Create lowlight instance
const lowlight = createLowlight(common)

interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  className?: string
  onEditorReady?: (editor: any) => void
  showToolbar?: boolean
}

export default function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  className = '',
  onEditorReady,
  showToolbar = true,
}: RichTextEditorProps) {
  const { settings } = useUserStore()
  const { 
    updateWordCount, 
    updateCharacterCount, 
    updateDailyCount, 
    dailyCount, 
    dailyGoal, 
    dailyStartCount, 
    prevWordCount, 
    setPrevWordCount,
    saveSpellingSettingsToCloud,
    loadSpellingSettingsFromCloud
  } = useEditorStore()
  const userChangedFontSize = useRef(false);
  const lastUpdateDate = useRef<string>('');
  const [grammarErrors, setGrammarErrors] = useState<Array<{ from: number; to: number; message: string; suggestions: any; word: string; type: string }>>([]);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    word: '',
    suggestions: [],
    errorIndex: null,
    from: null,
    to: null,
  });
  const [nspell, setNspell] = useState<any>(null);
  const [personalDictionary, setPersonalDictionary] = useState<string[]>([]);
  const [autocorrectMap, setAutocorrectMap] = useState({});
  const [ignoredErrorIndices, setIgnoredErrorIndices] = useState(() => {
    // Load ignored occurrences from localStorage on component mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ignoredOccurrences');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  // State for left-click suggestion popup
  const [leftClickPopup, setLeftClickPopup] = useState<{
    visible: boolean;
    x: number;
    y: number;
    word: string;
    suggestions: any[];
    from: number | null;
    to: number | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    word: '',
    suggestions: [],
    from: null,
    to: null,
  });
  const [mounted, setMounted] = useState(false);
  const [moreOptionsDropdown, setMoreOptionsDropdown] = useState({
    visible: false,
    x: 0,
    y: 0,
  });

  useEffect(() => { 
    setMounted(true); 
    // Initialize last update date
    lastUpdateDate.current = new Date().toDateString()
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false,
      }),
      BubbleMenu,
      CharacterCount,
      Color,
      FontFamily,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      TextStyle.configure({
        HTMLAttributes: {
          class: 'text-style',
        },
      }),
      Typography,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlock,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML()
      const text = editor.getText()
      const wordCount = countWords(text)
      const characterCount = countCharacters(text)
      
      // Check if it's a new day
      const today = new Date().toDateString()
      if (lastUpdateDate.current !== today) {
        // Reset daily count for new day
        if (dailyGoal > 0) {
          updateDailyCount(0)
        }
        lastUpdateDate.current = today
      }
      
      // Always update dailyCount to match wordCount if a goal is active
      if (dailyGoal > 0) {
        if (wordCount > prevWordCount) {
          updateDailyCount(dailyCount + (wordCount - prevWordCount));
        }
        setPrevWordCount(wordCount);
      }
      
      updateWordCount(wordCount)
      updateCharacterCount(characterCount)
      onChange?.(content)
    },
    onCreate: ({ editor }) => {
      // Initialize editor without forcing font size
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])



  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor)
    }
  }, [editor, onEditorReady])

  useEffect(() => {
    if (!editor) return;
    const logParagraphStyles = () => {
      const editorEl = document.querySelector('.tiptap');
      if (editorEl) {
        const p = editorEl.querySelector('p');
        if (p) {
          const styles = window.getComputedStyle(p);
        } else {
        }
      } else {
      }
    };
    logParagraphStyles();
  }, [editor]);

  // Load nspell dictionary and spelling settings on mount
  useEffect(() => {
    async function loadDictionary() {
      const affRes = await fetch('/dictionaries/en_US.aff');
      const dicRes = await fetch('/dictionaries/en_US.dic');
      const aff = await affRes.text();
      const dic = await dicRes.text();
      const spell = new NSpell(aff, dic);
      setNspell(spell);
    }

    async function loadSpellingSettings() {
      try {
        // Fallback to localStorage if cloud loading fails
        if (typeof window !== 'undefined') {
          const savedDict = localStorage.getItem('personalDictionary');
          const savedAutocorrect = localStorage.getItem('autocorrectMap');
          const savedIgnored = localStorage.getItem('ignoredOccurrences');
          
          if (savedDict) setPersonalDictionary(JSON.parse(savedDict));
          if (savedAutocorrect) setAutocorrectMap(JSON.parse(savedAutocorrect));
          if (savedIgnored) setIgnoredErrorIndices(JSON.parse(savedIgnored));
        }
      } catch (error) {
        console.error('Failed to load spelling settings:', error);
      }
    }

    loadDictionary();
    loadSpellingSettings();
  }, [loadSpellingSettingsFromCloud]);

  // On editor update, check spelling with nspell ONLY (disable LanguageTool for now)
  useEffect(() => {
    if (!editor || !nspell) return;

    let timeoutId: NodeJS.Timeout | undefined;
    const handler = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        let text = editor.getText();
        // Only autocorrect completed words (not the one currently being typed)
        // Find all words followed by a boundary (space, punctuation, or end of text)
        const wordRegex = /\b(\w+)(?=[\s.,;:!?\-\)\]\}\/]|$)/g;
        let match;
        let newText = '';
        let lastIndex = 0;
        // Get cursor position
        const selection = editor.state.selection;
        const cursorAtEnd = selection.from === selection.to && selection.from === text.length + 1;
        // Find the last word
        let lastWordMatch = null;
        let lastMatchIndex = -1;
        while ((match = wordRegex.exec(text)) !== null) {
          lastWordMatch = match;
          lastMatchIndex = match.index;
        }
        wordRegex.lastIndex = 0;
        while ((match = wordRegex.exec(text)) !== null) {
          const word = match[1];
          const from = match.index + 1;
          const to = match.index + word.length + 1;
          // If this is the last word and the cursor is at the end and the last char is a letter, skip autocorrect
          if (
            lastWordMatch &&
            match.index === lastMatchIndex &&
            cursorAtEnd &&
            /[a-zA-Z]$/.test(text)
          ) {
            continue;
          }
          // Autocorrect only completed words
          if (autocorrectMap[word as keyof typeof autocorrectMap]) {
            newText += text.slice(lastIndex, match.index) + autocorrectMap[word as keyof typeof autocorrectMap];
            lastIndex = match.index + word.length;
          }
        }
        // Add the rest of the text
        newText += text.slice(lastIndex);
        if (newText && newText !== text) {
          editor.commands.setTextSelection(newText.length); // Move cursor to end
          editor.commands.setContent(newText);
          text = newText;
        }
        // Only underline completed words (not the one currently being typed)
        wordRegex.lastIndex = 0;
        const spellingErrors = [];
        while ((match = wordRegex.exec(text)) !== null) {
          const word = match[1];
          const from = match.index + 1;
          const to = match.index + word.length + 1;
          if (
            lastWordMatch &&
            match.index === lastMatchIndex &&
            cursorAtEnd &&
            /[a-zA-Z]$/.test(text)
          ) {
            continue;
          }
          if (
            !nspell.correct(word) &&
            !personalDictionary.includes(word)
          ) {
            const spellingError = {
              from,
              to,
              message: `Spelling: Did you mean "${nspell.suggest(word)[0] || ''}"?`,
              suggestions: nspell.suggest(word),
              word: word,
              type: 'spelling',
            };
            const isIgnored = ignoredErrorIndices.some((ignored: { word: string; from: number; to: number }) =>
              ignored.word === spellingError.word &&
              ignored.from === spellingError.from &&
              ignored.to === spellingError.to
            );
            if (!isIgnored) {
              spellingErrors.push(spellingError);
            }
          }
        }
        setGrammarErrors(spellingErrors);
      }, 800); // Increased to 800ms for smoother experience
    };
    editor.on('update', handler);
    handler();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      editor.off('update', handler);
    };
  }, [editor, nspell, personalDictionary, autocorrectMap, ignoredErrorIndices]);

  // Helper function to save ignored occurrences to localStorage
  const saveIgnoredOccurrences = (ignoredOccurrences: any[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ignoredOccurrences', JSON.stringify(ignoredOccurrences));
    }
  };

  // Replace word with suggestion
  const replaceWord = (suggestion: string) => {
    if (!editor || contextMenu.from == null || contextMenu.to == null) return;
    // Use the exact ProseMirror positions from the underline/context menu
    editor.chain()
      .focus()
      .setTextSelection({ from: contextMenu.from, to: contextMenu.to })
      .deleteSelection()
      .insertContent(suggestion)
      .run();
    setContextMenu({ ...contextMenu, visible: false });
  };

  // Context menu actions
  const ignoreError = () => {
    if (!contextMenu.word || contextMenu.from == null || contextMenu.to == null) return;
    const ignoredOccurrence = { word: contextMenu.word, from: contextMenu.from, to: contextMenu.to };
    const newIgnoredOccurrences = [...ignoredErrorIndices, ignoredOccurrence];
    setIgnoredErrorIndices(newIgnoredOccurrences);
    
    // Save to localStorage and cloud
    saveIgnoredOccurrences(newIgnoredOccurrences);
    
    setContextMenu({ ...contextMenu, visible: false });
  };

  const addToPersonalDictionary = () => {
    if (!contextMenu.word) return;
    const newPersonalDictionary = [...personalDictionary, contextMenu.word];
    setPersonalDictionary(newPersonalDictionary);
    
    // Save to localStorage and cloud
    localStorage.setItem('personalDictionary', JSON.stringify(newPersonalDictionary));
    
    setContextMenu({ ...contextMenu, visible: false });
  };

  const alwaysCorrectTo = () => {
    if (!contextMenu.word || !contextMenu.suggestions[0]) return;
    const newAutocorrectMap = { ...autocorrectMap, [contextMenu.word]: contextMenu.suggestions[0] };
    setAutocorrectMap(newAutocorrectMap);
    
    // Save to localStorage and cloud
    localStorage.setItem('autocorrectMap', JSON.stringify(newAutocorrectMap));
    
    setContextMenu({ ...contextMenu, visible: false });
  };

  // Hide menu on click elsewhere
  useEffect(() => {
    if (!contextMenu.visible) return;
    const handler = () => setContextMenu({ ...contextMenu, visible: false });
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [contextMenu]);

  // Disable browser spellcheck
  const editorContentProps = {
    editor,
    className: 'pt-12 pr-4 pb-4 pl-4',
    spellCheck: false,
  };



  // Left-click handler for underlined words
  const onUnderlineClick = (event: MouseEvent) => {
    // Only handle left-click
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    if (!editor || !editor.view) return;
    // Get ProseMirror position from DOM event
    const pos = editor.view.posAtDOM(event.target as Node, 0);
    // Find the error at that position
    const errorAtPos = grammarErrors.find(
      err => pos >= err.from && pos < err.to
    );
    if (errorAtPos) {
      setLeftClickPopup({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        word: errorAtPos.word,
        suggestions: errorAtPos.suggestions,
        from: errorAtPos.from,
        to: errorAtPos.to,
      });
    }
  };

  // Hide left-click popup on click elsewhere (delayed registration)
  useEffect(() => {
    if (!leftClickPopup.visible) return;
    const handler = () => setLeftClickPopup({ ...leftClickPopup, visible: false });
    const timeout = setTimeout(() => {
      window.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousedown', handler);
    };
  }, [leftClickPopup]);

  // Attach left-click handler to underlines after render
  useEffect(() => {
    if (!editor) return;
    // Delay to ensure DOM is updated
    setTimeout(() => {
      const underlineEls = document.querySelectorAll('.grammar-underline');
      underlineEls.forEach(el => {
        el.removeEventListener('mousedown', onUnderlineClick as any);
        el.addEventListener('mousedown', onUnderlineClick as any);
      });
    }, 0);
  }, [editor]);

  // Left-click popup actions
  const handleLeftClickReplace = () => {
    if (!editor || leftClickPopup.from == null || leftClickPopup.to == null || !leftClickPopup.suggestions.length) return;
    editor.chain()
      .focus()
      .setTextSelection({ from: leftClickPopup.from, to: leftClickPopup.to })
      .deleteSelection()
      .insertContent(leftClickPopup.suggestions[0])
      .run();
    setLeftClickPopup({ ...leftClickPopup, visible: false });
  };
  const handleLeftClickIgnore = () => {
    if (!leftClickPopup.word || leftClickPopup.from == null || leftClickPopup.to == null) return;
    const ignoredOccurrence = { word: leftClickPopup.word, from: leftClickPopup.from, to: leftClickPopup.to };
    const newIgnoredOccurrences = [...ignoredErrorIndices, ignoredOccurrence];
    setIgnoredErrorIndices(newIgnoredOccurrences);
    
    // Save to localStorage and cloud
    saveIgnoredOccurrences(newIgnoredOccurrences);
    
    setLeftClickPopup({ ...leftClickPopup, visible: false });
  };

  // Left-click suggestion popup as a portal (client-only)
  const leftClickPopupPortal = (mounted && typeof window !== 'undefined' && leftClickPopup.visible)
    ? createPortal(
        <div
          style={{
            position: 'fixed',
            top: leftClickPopup.y,
            left: leftClickPopup.x,
            zIndex: 1000,
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            minWidth: 0,
            padding: '4px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontWeight: 600, cursor: leftClickPopup.suggestions.length ? 'pointer' : 'default', paddingRight: 8 }}
              onClick={handleLeftClickReplace}
            >
              {leftClickPopup.suggestions[0] || '(No suggestions)'}
            </div>
            <div title="Ignore" style={{ cursor: 'pointer', borderRadius: '50%', padding: 2, transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26 }} onClick={handleLeftClickIgnore}>
              {/* Bold X icon (SVG) */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 5L13 13M13 5L5 13" stroke="#222" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div title="More options"
              style={{ cursor: 'pointer', borderRadius: '50%', padding: 2, transition: 'background 0.2s', opacity: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26 }}
              onClick={() => setMoreOptionsDropdown({
                visible: true,
                x: leftClickPopup.x,
                y: leftClickPopup.y + 28,
              })}
            >
              <span style={{ fontSize: 20, fontWeight: 700, color: '#222', letterSpacing: 2 }}>⋮</span>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  // More options dropdown
  const handleMoreOptionsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    // Position dropdown below the icon
    const rect = event.currentTarget.getBoundingClientRect();
    setMoreOptionsDropdown({
      visible: true,
      x: rect.left,
      y: rect.bottom + 4,
    });
  };

  // Hide dropdown on click elsewhere
  useEffect(() => {
    if (!moreOptionsDropdown.visible) return;
    const handler = () => setMoreOptionsDropdown({ ...moreOptionsDropdown, visible: false });
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [moreOptionsDropdown]);

  const handleAlwaysCorrect = () => {
    if (!leftClickPopup.word || !leftClickPopup.suggestions[0]) return;
    const newAutocorrectMap = { ...autocorrectMap, [leftClickPopup.word]: leftClickPopup.suggestions[0] };
    setAutocorrectMap(newAutocorrectMap);
    
    // Save to localStorage and cloud
    localStorage.setItem('autocorrectMap', JSON.stringify(newAutocorrectMap));
    
    setMoreOptionsDropdown({ ...moreOptionsDropdown, visible: false });
    setLeftClickPopup({ ...leftClickPopup, visible: false });
  };
  const handleAddToPersonalDictionary = () => {
    if (!leftClickPopup.word) return;
    const newPersonalDictionary = [...personalDictionary, leftClickPopup.word];
    setPersonalDictionary(newPersonalDictionary);
    
    // Save to localStorage and cloud
    localStorage.setItem('personalDictionary', JSON.stringify(newPersonalDictionary));
    
    setMoreOptionsDropdown({ ...moreOptionsDropdown, visible: false });
    setLeftClickPopup({ ...leftClickPopup, visible: false });
  };

  // More options dropdown as a portal (client-only)
  const moreOptionsDropdownPortal = (mounted && typeof window !== 'undefined' && moreOptionsDropdown.visible)
    ? createPortal(
        <div
          style={{
            position: 'fixed',
            top: moreOptionsDropdown.y,
            left: moreOptionsDropdown.x,
            zIndex: 10001,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            minWidth: 200,
            padding: '8px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 0
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          <div style={{ padding: '10px 18px', cursor: 'pointer', fontSize: 16 }} onClick={handleAlwaysCorrect}>
            Always correct to "{leftClickPopup.suggestions[0] || ''}"
          </div>
          <div style={{ padding: '10px 18px', cursor: 'pointer', fontSize: 16 }} onClick={handleAddToPersonalDictionary}>
            Add to personal dictionary
          </div>
        </div>,
        document.body
      )
    : null;

  if (!editor) {
    return <div>Loading editor...</div>
  }

  return (
    <div className={className}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          className="w-full min-h-[900px]"
          style={{ height: 900, marginBottom: 48, overflow: 'hidden', background: 'transparent', border: 'none', boxShadow: 'none', borderRadius: 0, padding: 0 }}
        >
          {editor && showToolbar && <Toolbar editor={editor} totalWordCount={0} />}
          <EditorContent editor={editor} />
          </div>
        {/* Future: Render more pages here if content overflows */}
      </div>

      {/* Right-click context menu portal */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        suggestions={contextMenu.suggestions}
        onReplace={replaceWord}
        onIgnore={ignoreError}
        onAddToDictionary={addToPersonalDictionary}
        onSpellingGrammarCheck={() => {
          // TODO: Implement spelling and grammar check
          console.log('Spelling and grammar check clicked');
        }}
        onFeedback={() => {
          // TODO: Implement feedback functionality
          console.log('Feedback clicked');
        }}
      />

      {/* Left-click suggestion popup portal */}
      {leftClickPopupPortal}

      {/* More options dropdown portal */}
      {moreOptionsDropdownPortal}
    </div>
  );
} 