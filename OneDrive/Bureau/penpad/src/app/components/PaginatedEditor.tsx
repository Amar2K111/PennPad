'use client'

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
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
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useEditorStore } from '@/app/store/useEditorStore'
import { useUserStore } from '@/app/store/useUserStore'
import { countWords, countCharacters, calculateReadingTime } from '@/app/lib/utils'
import Toolbar from './Toolbar'
import AIBubbleMenu from './AIBubbleMenu'
import { LineHeight } from '../client-lib/line-height'
import { franc } from 'franc-min'
import NSpell from 'nspell'
import { createPortal } from 'react-dom'
import ContextMenu from './ContextMenu'
import { Extension } from '@tiptap/core'
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Plugin, PluginKey } from 'prosemirror-state';
import AIAcceptRejectPopup from './AIAcceptRejectPopup';
import debounce from 'lodash/debounce';

// Create lowlight instance
const lowlight = createLowlight(common)

// Plugin key must be a singleton
const spellcheckPluginKey = new PluginKey('spellcheckUnderline');



interface PaginatedEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  className?: string
  onEditorReady?: (editor: any) => void
  showToolbar?: boolean
  fontSize?: number
}

export default function PaginatedEditor({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  className = '',
  onEditorReady,
  showToolbar = true,
  fontSize = 11,
}: PaginatedEditorProps) {
  const { settings } = useUserStore()
  const { 
    updateWordCount, 
    updateCharacterCount, 
    updateDailyCount, 
    dailyCount, 
    dailyGoal, 
    prevWordCount, 
    setPrevWordCount, 
    activeFontSize,
    saveSpellingSettingsToCloud,
    loadSpellingSettingsFromCloud,
    currentDocument
  } = useEditorStore()
  

  const userChangedFontSize = useRef(false);
  const lastUpdateDate = useRef<string>('');
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastContent = useRef('');
  const originalPageHeight = useRef<number>(0);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const isApplyingFontSize = useRef(false);

  // Misspelled word modal state
  const [grammarErrors, setGrammarErrors] = useState([]);
  
  // AI menu rewrite input state
  const [showRewriteInput, setShowRewriteInput] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteInputPosition, setRewriteInputPosition] = useState({ top: 0, left: 0 });
  const [rewriteInputHeight, setRewriteInputHeight] = useState(100);
  const [previousSelection, setPreviousSelection] = useState(null);
  const rewriteTextareaRef = useRef(null);
  
  // AI Accept/Reject popup state
  const [aiPopupVisible, setAiPopupVisible] = useState(false);
  const [aiPopupPosition, setAiPopupPosition] = useState({ top: 0, left: 0 });
  const [clickedAIText, setClickedAIText] = useState({ from: 0, to: 0, originalText: '' });
  const [aiChanges, setAiChanges] = useState(new Map()); // Track AI changes with their original text
  
  // Auto-expand rewrite input based on content length
  const handleRewriteInputChange = (e) => {
    const value = e.target.value;
    const textarea = e.target;
    
    // Auto-adjust textarea height based on content
    textarea.style.height = 'auto'; // Reset height to calculate properly
    
    // Calculate lines based on content and width
    const textareaWidth = textarea.offsetWidth - 16; // Subtract padding
    const charWidth = 7; // Approximate character width in pixels
    const charsPerLine = Math.floor(textareaWidth / charWidth);
    
    // Count actual line breaks and calculate wrapped lines
    const lines = value.split('\n').reduce((total, line) => {
      const wrappedLines = Math.ceil(line.length / charsPerLine);
      return total + Math.max(1, wrappedLines);
    }, 0);
    
    const lineHeight = 20; // Approximate line height
    const buttonHeight = 28; // Height of the button area
    const padding = 16; // Container padding
    const minHeight = 120; // Minimum height
    const maxHeight = 400; // Maximum height - when reached, stop accepting text
    
    // Calculate the ideal height based on content
    const idealTextareaHeight = lines * lineHeight;
    const idealContainerHeight = idealTextareaHeight + buttonHeight + padding;
    
    // Check if we're at or exceeding max height
    const atMaxHeight = idealContainerHeight >= maxHeight;
    
    // If at max height, prevent adding more text
    if (atMaxHeight && value.length > rewriteInstruction.length) {
      console.log('🚫 Text stopped - reached maximum height');
      return; // Don't update the state, keep the previous value
    }
    
    // Enforce min/max bounds - stop growing at maxHeight
    const clampedHeight = Math.min(maxHeight, Math.max(minHeight, idealContainerHeight));
    
    // If we're at max height, don't let the textarea grow anymore
    if (clampedHeight >= maxHeight) {
      textarea.style.height = '372px'; // Fixed height for textarea (maxHeight - buttonHeight)
    } else {
      // Let it grow naturally up to the max
      textarea.style.height = 'auto';
    }
    
    console.log('📏 Rewrite input resize:', {
      length: value.length,
      lines,
      charsPerLine,
      textareaWidth,
      idealHeight: idealContainerHeight,
      clampedHeight,
      maxHeight,
      atMaxHeight,
      textStopped: atMaxHeight && value.length > rewriteInstruction.length
    });
    
    setRewriteInstruction(value);
    setRewriteInputHeight(clampedHeight);
  };

  // Function to highlight AI-generated text
  const highlightAIGeneratedText = (from: number, to: number, newText: string) => {
    if (!editor) return;
    
    console.log('🎨 Highlighting AI-generated text:', { from, to, newText });
    
    // Store the original text for potential rejection
    const originalText = editor.state.doc.textBetween(from, to);
    console.log('📝 Original text stored for rejection:', originalText);
    
    // Store the AI change with original text
    const newFrom = from;
    const newTo = from + newText.length;
    const changeKey = `${newFrom}-${newTo}`;
    setAiChanges(prev => new Map(prev).set(changeKey, originalText));
    
    // Insert the new text
    editor.chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent(newText)
      .run();
    
    // Apply AI highlight using the highlight extension
    editor.chain()
      .focus()
      .setTextSelection({ from: newFrom, to: newTo })
      .toggleHighlight({ color: '#bfdbfe' })
      .run();
    
    // Show popup immediately after highlighting
    setTimeout(() => {
      // Get the position of the highlighted text
      const editorElement = editor.view.dom;
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        const position = {
          top: rect.top + window.scrollY,
          left: rect.left + (rect.width / 2) + window.scrollX
        };
        
        setClickedAIText({ from: newFrom, to: newTo, originalText: originalText });
        setAiPopupPosition(position);
        setAiPopupVisible(true);
      }
      
      // Clear selection
      editor.chain().focus().setTextSelection(newTo).run();
    }, 100);
    
    console.log('✅ AI text highlighted successfully');
  };

  // Function to handle keeping AI changes
  const handleKeepAIChanges = () => {
    if (!editor) return;
    
    console.log('✅ Keeping AI changes');
    
    // Remove the AI highlight but keep the text
    editor.chain()
      .focus()
      .setTextSelection({ from: clickedAIText.from, to: clickedAIText.to })
      .toggleHighlight({ color: '#bfdbfe' })
      .setTextSelection(clickedAIText.to)
      .run();
    
    // Clear selection
    setTimeout(() => {
      editor.chain().focus().setTextSelection(clickedAIText.to).run();
    }, 50);
    
    // Clear the selection
    setTimeout(() => {
      editor.chain().focus().setTextSelection(clickedAIText.to).run();
    }, 100);
    
    // Remove this change from tracking since it's kept
    const changeKey = `${clickedAIText.from}-${clickedAIText.to}`;
    setAiChanges(prev => {
      const newMap = new Map(prev);
      newMap.delete(changeKey);
      return newMap;
    });
    
    // Close the popup
    setAiPopupVisible(false);
  };

  // Function to handle undoing AI changes
  const handleUndoAIChanges = () => {
    if (!editor) return;
    
    console.log('❌ Undoing AI changes');
    
    // Find the original text for this AI change
    const changeKey = `${clickedAIText.from}-${clickedAIText.to}`;
    const originalText = aiChanges.get(changeKey);
    
    if (originalText) {
      // Replace the AI text with the original text at the exact same position
      editor.chain()
        .focus()
        .setTextSelection({ from: clickedAIText.from, to: clickedAIText.to })
        .deleteSelection()
        .insertContent(originalText)
        .setTextSelection(clickedAIText.from + originalText.length)
        .run();
      
      // Remove the highlight from the reverted text
      setTimeout(() => {
        editor.chain()
          .focus()
          .setTextSelection({ from: clickedAIText.from, to: clickedAIText.from + originalText.length })
          .unsetMark('highlight')
          .setTextSelection(clickedAIText.from + originalText.length)
          .run();
      }, 10);
      
      // Remove this change from tracking
      setAiChanges(prev => {
        const newMap = new Map(prev);
        newMap.delete(changeKey);
        return newMap;
      });
    }
    
    // Close the popup
    setAiPopupVisible(false);
  };

  // Function to handle clicking on highlighted AI text
  const handleAITextClick = (event) => {
    if (!editor) return;
    
    // Get the current selection
    const aiTextSelection = editor.state.selection;
    const { from, to } = aiTextSelection;
    
    // Check if there's a selection and if it has AI highlighting
    if (from !== to) {
      // Get the marks at the current position
      const $from = editor.state.doc.resolve(from);
      const marks = $from.marks();
      
      // Check if any mark is a highlight with AI color
      const hasAIHighlight = marks.some(mark => 
        mark.type.name === 'highlight' && 
        mark.attrs.color === '#bfdbfe'
      );
      
      if (hasAIHighlight) {
        console.log('🎯 Clicked on highlighted AI text');
        
        // Get the position of the click
        const rect = event.target.getBoundingClientRect();
        const position = {
          top: rect.top + window.scrollY,
          left: rect.left + (rect.width / 2) + window.scrollX
        };
        
        // Store the clicked text info
        const currentText = editor.state.doc.textBetween(from, to);
        setClickedAIText({ from, to, originalText: currentText });
        
        // Show the popup
        setAiPopupPosition(position);
        setAiPopupVisible(true);
      }
    }
  };

  const handleRewriteSubmit = async () => {
    console.log('🚀 REWRITE BUTTON CLICKED!');
    console.log('📝 Rewrite instruction:', rewriteInstruction);
    console.log('🔍 Current editor state:', editor);
    console.log('📄 Current content:', content);
    
    if (!rewriteInstruction.trim()) {
      console.log('❌ No rewrite instruction provided');
      return;
    }

    if (!editor) {
      console.log('❌ No editor instance available');
      return;
    }

    setIsRewriting(true);
    console.log('🔄 Setting rewriting state to true');

    try {
      console.log('🎯 Starting rewrite process...');
      
      // Get the current selection
      const { from, to } = editor.state.selection;
      console.log('📍 Selection range:', { from, to });
      
      // Get the selected text
      const selectedText = editor.state.doc.textBetween(from, to);
      console.log('📋 Selected text:', selectedText);
      
      if (!selectedText.trim()) {
        console.log('❌ No text selected for rewriting');
        return;
      }

      console.log('🤖 Calling AI API for rewrite...');
      
      // Call the AI API to rewrite the text
      const response = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: selectedText,
          instruction: rewriteInstruction,
        }),
      });

      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ API Error:', errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ AI Response:', result);

      if (result.rewrittenText) {
        console.log('🔄 Replacing text with AI rewrite...');
        
        // Use the highlighting function instead of direct replacement
        highlightAIGeneratedText(from, to, result.rewrittenText);
        
        console.log('✅ Text successfully rewritten and highlighted!');
        
        // Call onChange to update the parent component
        if (onChange) {
          const newContent = editor.getHTML();
          console.log('📤 Calling onChange with new content');
          onChange(newContent);
        }
      } else {
        console.log('❌ No rewritten text in response');
      }

    } catch (error) {
      console.log('💥 Error during rewrite:', error);
      console.log('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    } finally {
      console.log('🧹 Cleaning up rewrite state...');
      setRewriteInstruction('');
      setShowRewriteInput(false);
      setIsRewriting(false);
      console.log('✅ Rewrite process completed');
    }
  };

  // AI handlers for different features
  const handleAIExpand = async (amount: string, option: string) => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    
    if (!selectedText.trim()) return;
    
    try {
      const response = await fetch('/api/ai/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText, amount, option }),
      });
      
      if (!response.ok) throw new Error(`API request failed: ${response.status}`);
      
      const result = await response.json();
      if (result.expandedText) {
        highlightAIGeneratedText(from, to, result.expandedText);
        if (onChange) onChange(editor.getHTML());
      }
    } catch (error) {
      console.error('Error expanding text:', error);
    }
  };

  const handleAIShorten = async (option: string) => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    
    if (!selectedText.trim()) return;
    
    try {
      const response = await fetch('/api/ai/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText, option }),
      });
      
      if (!response.ok) throw new Error(`API request failed: ${response.status}`);
      
      const result = await response.json();
      if (result.shortenedText) {
        highlightAIGeneratedText(from, to, result.shortenedText);
        if (onChange) onChange(editor.getHTML());
      }
    } catch (error) {
      console.error('Error shortening text:', error);
    }
  };

  const handleAIToneChange = async (tone: string) => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    
    if (!selectedText.trim()) return;
    
    try {
      const response = await fetch('/api/ai/tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText, tone }),
      });
      
      if (!response.ok) throw new Error(`API request failed: ${response.status}`);
      
      const result = await response.json();
      if (result.toneChangedText) {
        highlightAIGeneratedText(from, to, result.toneChangedText);
        if (onChange) onChange(editor.getHTML());
      }
    } catch (error) {
      console.error('Error changing tone:', error);
    }
  };
  
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

  // Helper function to save ignored occurrences to localStorage
  const saveIgnoredOccurrences = (ignoredOccurrences) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ignoredOccurrences', JSON.stringify(ignoredOccurrences));
    }
  };

  // Custom context menu handler
  const onContextMenu = async (event) => {
    event.preventDefault();
    
    // Only proceed if we have the spell checker loaded
    if (!nspell) {
      // Load the dictionary synchronously for this right-click
      try {
        const affRes = await fetch('/dictionaries/en_US.aff');
        const dicRes = await fetch('/dictionaries/en_US.dic');
        const aff = await affRes.text();
        const dic = await dicRes.text();
        const NSpell = (await import('nspell')).default;
        const spell = new NSpell(aff, dic);
        
        // Now proceed with spell checking using the loaded spell checker
        await performSpellChecking(spell, event);
      } catch (error) {
        console.error('Failed to load dictionary for right-click:', error);
      }
      return;
    }
    
    // Use the available spell checker
    await performSpellChecking(nspell, event);
  };
  
  // Extract spell checking logic into a reusable function
  const performSpellChecking = async (spellChecker, event) => {
    // Force spell checking to run immediately
    if (editor && spellChecker) {
      const doc = editor.view.state.doc;
      const docSize = doc.content.size;
      const spellingErrors = [];
      let wordCount = 0;
      
      // Use the same ProseMirror-based approach as live spell checking
      doc.descendants((node, pos) => {
        if (node.isText) {
          const text = node.text;
          
          // Find words in this text node
          const wordRegex = /[a-zA-Z]+/g;
          let match;
          while ((match = wordRegex.exec(text)) !== null) {
            const word = match[0];
            const wordStartInNode = match.index;
            const wordEndInNode = wordStartInNode + word.length;
            
            // Calculate actual document positions
            const fromPos = pos + wordStartInNode;
            const toPos = pos + wordEndInNode;
            
            wordCount++;
            
            const isCorrect = spellChecker.correct(word);
            const inPersonalDict = personalDictionary.includes(word);
            
            if (!isCorrect && !inPersonalDict) {
              const suggestions = spellChecker.suggest(word).slice(0, 5);
              const spellingError = {
                from: fromPos,
                to: toPos,
                message: `Spelling: Did you mean "${suggestions[0] || ''}"?`,
                suggestions: suggestions,
                word: word,
                type: 'spelling',
              };
              spellingErrors.push(spellingError);
            }
          }
        }
        return true;
      });
      
      // Find the word under the cursor
      const { from: cursorFrom } = editor.state.selection;
      
      const wordUnderCursor = spellingErrors.find(error => 
        cursorFrom >= error.from && cursorFrom <= error.to
      );
      
      if (wordUnderCursor) {
        // Show context menu for the word under cursor
        setContextMenu({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          word: wordUnderCursor.word,
          suggestions: wordUnderCursor.suggestions,
          errorIndex: spellingErrors.indexOf(wordUnderCursor),
          from: wordUnderCursor.from,
          to: wordUnderCursor.to,
        });
      }
    }
  };
  const [nspell, setNspell] = useState(null);
  const [personalDictionary, setPersonalDictionary] = useState<string[]>([]);
  const [autocorrectMap, setAutocorrectMap] = useState<Record<string, string>>({});
  const [ignoredErrorIndices, setIgnoredErrorIndices] = useState<any[]>([]);
  // State for left-click suggestion popup
  const [leftClickPopup, setLeftClickPopup] = useState({
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
  const isReplacingWord = useRef(false);

  // Define performSpellCheck at component level (before any useEffect)
  const performSpellCheck = useCallback(() => {
    if (!editor || !nspell) return;
    
    // Run spell check in background without blocking
    setTimeout(() => {
      try {
        // Get the ProseMirror document directly
        const doc = editor.view.state.doc;
        const documentText = doc.textBetween(0, doc.content.size);
        const docSize = doc.content.size;
        
        if (!documentText.trim()) {
          return;
        }

        const errors = [];
        let wordCount = 0;
        
        // Let's try a different approach - find words by traversing the document structure
        doc.descendants((node, pos) => {
          if (node.isText) {
            const text = node.text;
            
            // Find words in this text node
            const wordRegex = /[a-zA-Z]+/g;
            let match;
            while ((match = wordRegex.exec(text)) !== null) {
              const word = match[0];
              const wordStartInNode = match.index;
              const wordEndInNode = wordStartInNode + word.length;
              
              // Calculate actual document positions
              const fromPos = pos + wordStartInNode;
              const toPos = pos + wordEndInNode;
              
              wordCount++;
              
              // Skip the last word if user is still typing
              if (toPos === docSize && word.length < 3) {
                continue;
              }

              // Check if word is correct (including personal dictionary)
              const isCorrect = nspell.correct(word) || personalDictionary.includes(word);
              
              if (!isCorrect && word.length > 0) {
                // Check if this specific occurrence is ignored
                const isIgnored = ignoredErrorIndices.some(ignored => 
                  ignored.word === word && 
                  ignored.from === fromPos && 
                  ignored.to === toPos
                );
                
                if (isIgnored) {
                  continue;
                }
                
                // Validate positions are within document bounds
                if (fromPos >= 0 && toPos <= docSize && fromPos < toPos) {
                  errors.push({
                    from: fromPos,
                    to: toPos,
                    message: `Spelling: Did you mean "${word}"?`,
                    suggestions: nspell.suggest(word).slice(0, 3),
                    word: word,
                    type: 'spelling'
                  });
                }
              }
            }
          }
          return true;
        });

        setGrammarErrors(errors);
      } catch (error) {
        // Silently handle errors - don't interrupt user
      }
    }, 0); // Run immediately but asynchronously
  }, [nspell, personalDictionary, ignoredErrorIndices]);

  // Define checkForAutoCorrection at component level (before any useEffect)
  const checkForAutoCorrection = useCallback(() => {
    if (!editor || Object.keys(autocorrectMap).length === 0 || isReplacingWord.current) return;
    
    console.log('🔍 [AUTOCORRECT] Checking for autocorrections, map:', autocorrectMap);
    
    // Run auto-correction in background without blocking
    setTimeout(() => {
      const doc = editor.view.state.doc;
    
    // Check each auto-correction mapping
    Object.entries(autocorrectMap).forEach(([misspelled, correct]) => {
      let corrections = [];
      
      console.log('🔍 [AUTOCORRECT] Looking for:', misspelled, '->', correct);
      
      // Use ProseMirror document traversal to find complete words only
      doc.descendants((node, pos) => {
        if (node.isText) {
          const text = node.text;
          
          // Find complete words in this text node
          const wordRegex = /[a-zA-Z]+/g;
          let match;
          while ((match = wordRegex.exec(text)) !== null) {
            const word = match[0];
            const wordStartInNode = match.index;
            const wordEndInNode = wordStartInNode + word.length;
            
            // Calculate actual document positions
            const fromPos = pos + wordStartInNode;
            const toPos = pos + wordEndInNode;
            
            // Only correct if this is the exact misspelled word by itself
            if (word === misspelled) {
              console.log('🔍 [AUTOCORRECT] Found misspelled word:', word, 'at positions:', fromPos, 'to', toPos);
              corrections.push({
                from: fromPos,
                to: toPos,
                correct: correct
              });
            }
          }
        }
        return true;
      });
      
      // Apply corrections in reverse order to maintain positions
      corrections.reverse().forEach(({ from, to, correct }) => {
        console.log('🔍 [AUTOCORRECT] Applying correction:', from, 'to', to, '->', correct);
        editor.chain()
          .focus()
          .setTextSelection({ from, to })
          .deleteSelection()
          .insertContent(correct)
          .run();
      });
    });
    }, 0); // Run immediately but asynchronously
  }, [autocorrectMap]);

  // Global variable to store current grammar errors for the extension
  let currentGrammarErrors = [];

  // Load nspell dictionary and spelling settings on component mount
  useEffect(() => {
    const loadNspell = async () => {
      try {
        const affRes = await fetch('/dictionaries/en_US.aff');
        const dicRes = await fetch('/dictionaries/en_US.dic');
        const aff = await affRes.text();
        const dic = await dicRes.text();
        const NSpell = (await import('nspell')).default;
        const spell = new NSpell(aff, dic);
        setNspell(spell);
      } catch (error) {
        console.error('Failed to load dictionary:', error);
      }
    };

    const loadSpellingSettings = async () => {
      try {
        if (currentDocument?.id) {
          const settings = await loadSpellingSettingsFromCloud(currentDocument.id);
        setPersonalDictionary(settings.personalDictionary);
        setAutocorrectMap(settings.autocorrectMap);
        setIgnoredErrorIndices(settings.ignoredErrors);
          console.log('🔍 [SPELLING] Loaded settings from cloud for document:', currentDocument.id, settings);
        } else {
          console.log('🔍 [SPELLING] No current document, using default settings');
          // Use default settings if no document is loaded
          setPersonalDictionary([]);
          setAutocorrectMap({});
          setIgnoredErrorIndices([]);
        }
      } catch (error) {
        console.error('Failed to load spelling settings from cloud:', error);
        // Fallback to localStorage if cloud loading fails
        if (typeof window !== 'undefined') {
          const savedDict = localStorage.getItem('personalDictionary');
          const savedAutocorrect = localStorage.getItem('autocorrectMap');
          const savedIgnored = localStorage.getItem('ignoredOccurrences');
          
          if (savedDict) setPersonalDictionary(JSON.parse(savedDict));
          if (savedAutocorrect) setAutocorrectMap(JSON.parse(savedAutocorrect));
          if (savedIgnored) setIgnoredErrorIndices(JSON.parse(savedIgnored));
        }
      }
    };

    loadNspell();
    loadSpellingSettings();
  }, [loadSpellingSettingsFromCloud, currentDocument]);

  const SpellcheckUnderline = Extension.create({
    name: 'spellcheckUnderline',
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: spellcheckPluginKey,
          state: {
            init: () => {
              return { grammarErrors: [] };
            },
            apply(tr, value) {
              const meta = tr.getMeta(spellcheckPluginKey);
              if (meta && meta.grammarErrors) {
                return { 
                  grammarErrors: meta.grammarErrors,
                  ignoredErrorIndices: meta.ignoredErrorIndices || value?.ignoredErrorIndices || []
                };
              }
              return value;
            },
          },
          props: {
            decorations(state) {
              const pluginState = spellcheckPluginKey.getState(state);
              const errors = pluginState?.grammarErrors || [];
              const ignoredErrors = pluginState?.ignoredErrorIndices || [];
              
              const decorations = [];
              errors.forEach((err, index) => {
                // Check if this specific occurrence is ignored
                const isIgnored = ignoredErrors.some(ignored => 
                  ignored.word === err.word && 
                  ignored.from === err.from && 
                  ignored.to === err.to
                );
                
                if (isIgnored) {
                  return;
                }
                
                // Validate positions are within document bounds
                const doc = state.doc;
                const docLength = doc.content.size;
                
                if (err.from < 0 || err.to > docLength || err.from >= err.to) {
                  return;
                }
                
                try {
                  // Get the actual text at these positions
                  const textAtPosition = doc.textBetween(err.from, err.to);
                  
                  decorations.push(
                    Decoration.inline(err.from, err.to, { 
                      class: 'grammar-underline',
                      'data-word': err.word,
                      'data-from': err.from,
                      'data-to': err.to,
                      'data-suggestions': JSON.stringify(err.suggestions)
                    })
                  );
                } catch (error) {
                  // Silently handle errors
                }
              });
              
              return DecorationSet.create(state.doc, decorations);
            },
          },
        })
      ];
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Force single paragraph behavior
        paragraph: {
          HTMLAttributes: {
            class: 'single-paragraph-container',
          },
          // Prevent multiple paragraphs
          keepMarks: true,
          // Ensure all content stays in one paragraph
          content: 'inline*',
        },
      }),
      LineHeight,
      CharacterCount,
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Color,
      TextStyle.configure({
        HTMLAttributes: {
          class: 'text-style',
        },
      }),

      Typography,
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      SpellcheckUnderline,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'max-w-none focus:outline-none p-2 editor-content',
        style: 'font-family: Arial, Helvetica Neue, Helvetica, sans-serif; color: #181818; line-height: var(--line-height, 1.15); word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; white-space: normal;',
        spellcheck: 'false',
        autocorrect: 'off',
        autocapitalize: 'off',
        'data-gramm': 'false',
      },
      transformPastedHTML(html) {
        // Remove font-family from inline styles but keep font-size
        return html.replace(/font-family:[^;"']+;?/gi, '');
      },
      handleKeyPress: (view, event) => {
        // Handle Enter key to insert space instead of new paragraph
        if (event.key === 'Enter') {
          console.log('🔍 Enter key pressed - preventing new paragraph');
          event.preventDefault();
          event.stopPropagation();
          
          // Simply insert a space character
          const { from } = view.state.selection;
          const tr = view.state.tr.insertText(' ');
          view.dispatch(tr);
          console.log('✅ Space inserted');
          
          return true; // Prevent default behavior
        }
        
        // Let normal typing happen, we'll handle font size in onUpdate
        return false;
      },
      // Disable browser spellcheck
      spellCheck: false,
      
      // Handle keydown to clear highlighting when typing
      handleKeyDown: (view, event) => {
        // If user is typing and there's highlighted text, clear the highlight
        const keydownSelection = view.state.selection;
        if (keydownSelection.empty && view.state.selection.$from.marks().some(mark => mark.type.name === 'highlight')) {
          view.dispatch(view.state.tr.removeMark(keydownSelection.from, keydownSelection.to, view.state.schema.marks.highlight));
        }
        
        return false; // Let normal typing continue
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Non-blocking update handler - never block typing
      // Only skip font size operations if needed
      if (isApplyingFontSize.current || isReplacingWord.current) {
        return;
      }
      
      // Simplified approach - just ensure consistent spacing
      // Let CSS handle the single container behavior
      try {
        const editorElement = editor.view.dom as HTMLElement;
        if (editorElement) {
          // Get the current line-height from CSS custom property or toolbar
          const currentLineHeight = getComputedStyle(editorElement).getPropertyValue('--line-height') || '1.15';
          
          console.log('🔧 [PAGINATED-EDITOR] Starting styling application:', {
            currentLineHeight,
            editorElement: editorElement.tagName,
            editorElementClasses: editorElement.className
          });
          
          // Apply single paragraph styling to all paragraphs
          const paragraphs = editorElement.querySelectorAll('p');
          console.log('🔍 [PAGINATED-EDITOR] Found paragraphs:', paragraphs.length);
          
          paragraphs.forEach((p, index) => {
            const pElement = p as HTMLElement;
            const beforeLineHeight = pElement.style.lineHeight;
            const beforeComputedLineHeight = getComputedStyle(pElement).lineHeight;
            
            pElement.classList.add('single-paragraph-container');
            pElement.style.setProperty('margin-bottom', '0', 'important');
            pElement.style.setProperty('margin-top', '0', 'important');
            pElement.style.setProperty('display', 'block', 'important');
            pElement.style.setProperty('min-height', '1em', 'important');
            // Preserve the toolbar's line-height setting
            pElement.style.setProperty('line-height', currentLineHeight, 'important');
            
            console.log(`📄 [PAGINATED-EDITOR] Paragraph ${index}:`, {
              textContent: pElement.textContent?.substring(0, 30) + '...',
              beforeLineHeight,
              afterLineHeight: pElement.style.lineHeight,
              beforeComputedLineHeight,
              afterComputedLineHeight: getComputedStyle(pElement).lineHeight,
              currentLineHeight
            });
          });
          
          // Check if we're overriding toolbar settings
          setTimeout(() => {
            console.log('🔍 [PAGINATED-EDITOR] Checking for toolbar override:');
            const toolbarLineHeight = getComputedStyle(editorElement).getPropertyValue('--line-height');
            console.log('📊 [PAGINATED-EDITOR] Toolbar --line-height:', toolbarLineHeight);
            console.log('📊 [PAGINATED-EDITOR] Editor element line-height:', getComputedStyle(editorElement).lineHeight);
          }, 50);
          
        }
      } catch (error) {
        console.log('⚠️ Error applying single paragraph styling:', error);
      }
      
      // Check for autocorrections only when space is pressed
      const lastChar = editor.state.doc.textContent.slice(-1);
      if (lastChar === ' ' || lastChar === '\n' || lastChar === '\t') {
        checkForAutoCorrection();
      }
      
      // Clear AI highlighting when user starts typing
      const aiSelection = editor.state.selection;
      if (aiSelection.empty && editor.state.selection.$from.marks().some(mark => mark.type.name === 'highlight')) {
        // User is typing and has highlighted text selected, clear the highlight
        // Use a flag to prevent infinite recursion
        isApplyingFontSize.current = true;
        editor.chain()
          .focus()
          .unsetMark('highlight')
          .run();
        // Reset the flag after a short delay
        setTimeout(() => {
          isApplyingFontSize.current = false;
        }, 10);
      }
      
      // Use font size from cloud store, fallback to localStorage, then props
      let defaultSize = 14; // fallback
      if (activeFontSize && activeFontSize > 0) {
        defaultSize = activeFontSize;
      } else {
        // Fallback to localStorage
        const storedFontSize = localStorage.getItem('activeFontSize');
        if (storedFontSize) {
          defaultSize = parseInt(storedFontSize, 10);
        } else if (fontSize) {
          // Map toolbar size to pixel size
          if (fontSize >= 12) defaultSize = fontSize + 3;
          else if (fontSize >= 8) defaultSize = 14 - (11 - fontSize) * 0.5;
          else defaultSize = 12;
        }
      }
      
      // Only apply font size if there's no existing font size mark at the cursor
      const { selection: fontSelection } = editor.state;
      const { from: fontFrom } = fontSelection;
      
      // Check if there's already a font size mark at the current position
      const marksAtPosition = editor.state.doc.resolve(fontFrom).marks();
      const hasFontSizeMark = marksAtPosition.find(mark => mark.type.name === 'textStyle' && mark.attrs.fontSize);
      
      // TEMPORARILY DISABLED: Font size application to prevent cursor interference
      // This was causing the cursor to move back when pressing space
      /*
      // Only apply font size if no font size is set AND we're not at the beginning of a word
      if (!hasFontSizeMark && fontFrom > 0) {
        // Check if we're at a word boundary (not in the middle of typing)
        const text = editor.getText();
        const charBefore = text.charAt(fontFrom - 1);
        const isWordBoundary = /\s/.test(charBefore); // Space, tab, etc.
        
        if (isWordBoundary) {
          // Apply font size to current position only if no font size is already set
          isApplyingFontSize.current = true;
          editor.chain().focus().setMark('textStyle', { fontSize: `${defaultSize}px` }).run();
          isApplyingFontSize.current = false;
        }
      }
      */
      
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
      
      // Temporarily disable auto-save to prevent cursor jumping
      // Auto-save will be handled by the parent component's own logic
    },
    onCreate: ({ editor }) => {
      // Apply font size to entire document on creation
      if (editor && !editor.isDestroyed) {
        const defaultSize = activeFontSize || 14;
        editor.commands.setMark('textStyle', { fontSize: `${defaultSize}px` });
      }
    },
  });

  // Always notify parent when editor is ready - immediate notification
  useEffect(() => {
    if (editor && onEditorReady) {
      // Notify immediately when editor is ready
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Update editor content when content prop changes - prevent interference with typing
  useEffect(() => {
    if (editor && content !== undefined) {
      // Only update if we're not actively replacing a word AND content is actually different
      if (!isReplacingWord.current) {
        const currentEditorContent = editor.getHTML();
        if (currentEditorContent !== content) {
          editor.commands.setContent(content);
        }
      }
    }
  }, [editor, content]);

  // Debounced typing handler to prevent interference with spacebar
  useEffect(() => {
    if (!editor || !onChange) return;
    
    let onChangeTimeout: NodeJS.Timeout;
    let saveTimeout: NodeJS.Timeout;
    
    const handleTyping = () => {
      // Get current content
      const currentContent = editor.getHTML();
      
      // Only call onChange if content actually changed
      if (currentContent !== lastContent.current) {
        // Update last content immediately to prevent duplicate calls
        lastContent.current = currentContent;
        
        // Call onChange immediately
        onChange(currentContent);
      }
      
      // Schedule background save only (completely separate from typing)
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        const currentContent = editor.getHTML();
        if (currentContent !== lastContent.current) {
          lastContent.current = currentContent;
          // Use a separate timeout to avoid blocking typing
          setTimeout(() => {
            onChange(currentContent);
          }, 0);
        }
      }, 1500);
    };
    
    editor.on('update', handleTyping);
    
    return () => {
      editor.off('update', handleTyping);
      clearTimeout(onChangeTimeout);
      clearTimeout(saveTimeout);
    };
  }, [editor, onChange]);

  // Fast spell checking - almost instant response
  useEffect(() => {
    if (!editor) return;
    
    let spellCheckTimeout: NodeJS.Timeout;
    
    const handleSpellCheck = () => {
      clearTimeout(spellCheckTimeout);
      spellCheckTimeout = setTimeout(() => {
        if (!isReplacingWord.current) {
          performSpellCheck();
        }
      }, 2000); // Increased delay to prevent infinite loop
    };
    
    editor.on('update', handleSpellCheck);
    
    // Initial spell check when editor loads
    setTimeout(() => {
      performSpellCheck();
    }, 2000); // Increased delay to prevent infinite loop
    
    return () => {
      editor.off('update', handleSpellCheck);
      clearTimeout(spellCheckTimeout);
    };
  }, [editor, performSpellCheck]);

  // Maintain font size when fontSize prop changes
  useEffect(() => {
    if (editor && fontSize) {
      // Map the toolbar size to actual pixel size
      let actualSize = 2; // Default fallback
      
      if (fontSize >= 12) {
        actualSize = fontSize + 3;
      } else if (fontSize >= 8) {
        actualSize = 14 - (11 - fontSize) * 0.5;
      } else {
        actualSize = 12;
      }
      
      // Apply font size to current selection or entire document
      editor.chain().focus().setMark('textStyle', { fontSize: `${actualSize}px` }).run();
    }
  }, [editor, fontSize]);

  // Load stored font size when editor starts
  useEffect(() => {
    if (editor) {
      const storedFontSize = localStorage.getItem('activeFontSize');
      if (storedFontSize) {
        const fontSize = parseInt(storedFontSize, 10);
        editor.chain().focus().setMark('textStyle', { fontSize: `${fontSize}px` }).run();
      }
    }
  }, [editor]);

  // Initialize mounted state
  useEffect(() => { 
    setMounted(true); 
  }, []);

  // Force editor to update decorations when grammarErrors changes
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      // Update the global variable
      currentGrammarErrors = grammarErrors;
      // REMOVED updateState call to prevent cursor jumping
    }
  }, [grammarErrors, editor]);





  // useEffect to update plugin state when grammarErrors changes
  // useEffect to update plugin state when grammarErrors changes
  useEffect(() => {
    if (editor && editor.view && !editor.isDestroyed) {
      // Create a new transaction with the grammarErrors and ignoredErrorIndices metadata
      const tr = editor.view.state.tr.setMeta(spellcheckPluginKey, { 
        grammarErrors,
        ignoredErrorIndices 
      });
      
      // Force the plugin to update by dispatching the transaction
      editor.view.dispatch(tr);
    }
  }, [grammarErrors, ignoredErrorIndices, editor]);

  // Replace word with suggestion
  // Function to perform immediate spell check after word replacement
  const performImmediateSpellCheck = async () => {
    if (!editor || !nspell) return;
    
    try {
      const doc = editor.view.state.doc;
      const documentText = doc.textBetween(0, doc.content.size);
      const docSize = doc.content.size;
      
      if (!documentText.trim()) {
        setGrammarErrors([]);
        return;
      }

      const errors = [];
      let wordCount = 0;
      
      doc.descendants((node, pos) => {
        if (node.isText) {
          const text = node.text;
          
          const wordRegex = /[a-zA-Z]+/g;
          let match;
          while ((match = wordRegex.exec(text)) !== null) {
            const word = match[0];
            const wordStartInNode = match.index;
            const wordEndInNode = wordStartInNode + word.length;
            
            const fromPos = pos + wordStartInNode;
            const toPos = pos + wordEndInNode;
            
            wordCount++;
            
            if (toPos === docSize && word.length < 3) {
              continue;
            }

            const isCorrect = nspell.correct(word) || personalDictionary.includes(word);
            
            if (!isCorrect && word.length > 0) {
              // Check if this specific occurrence is ignored
              const isIgnored = ignoredErrorIndices.some(ignored => 
                ignored.word === word && 
                ignored.from === fromPos && 
                ignored.to === toPos
              );
              
              if (isIgnored) {
                continue;
              }
              
              if (fromPos >= 0 && toPos <= docSize && fromPos < toPos) {
                errors.push({
                  from: fromPos,
                  to: toPos,
                  message: `Spelling: Did you mean "${word}"?`,
                  suggestions: nspell.suggest(word).slice(0, 3),
                  word: word,
                  type: 'spelling'
                });
              }
            }
          }
        }
        return true;
      });

      setGrammarErrors(errors);
    } catch (error) {
      console.error('Error during immediate spell check:', error);
    }
  };

  // Shared replacement logic for both left and right click
  const replaceWordWithSuggestion = (suggestion, word, from, to, closeContextMenu, closeLeftClickPopup) => {
    if (!editor || !suggestion || !word || from == null || to == null) return;
    try {
      isReplacingWord.current = true;
      // Use ProseMirror transaction for precise replacement
      editor.chain()
        .focus()
        .setTextSelection({ from, to })
        .deleteSelection()
        .insertContent(suggestion)
        .run();
      // Immediately perform spell check to update underlines
      setTimeout(() => {
        performImmediateSpellCheck();
      }, 50);
      isReplacingWord.current = false;
      if (closeContextMenu) closeContextMenu();
      if (closeLeftClickPopup) closeLeftClickPopup();
      // Explicitly trigger onChange to notify parent of content change
      const newContent = editor.getHTML();
      if (onChange) {
        onChange(newContent);
      }
    } catch (error) {
      console.error('Error replacing word:', error);
      isReplacingWord.current = false;
    }
  };

  // Right-click context menu suggestion handler
  const replaceWord = (suggestion) => {
    if (!editor || !contextMenu.word || contextMenu.from == null || contextMenu.to == null) return;
    replaceWordWithSuggestion(
      suggestion,
      contextMenu.word,
      contextMenu.from,
      contextMenu.to,
      () => setContextMenu({ ...contextMenu, visible: false }),
      null
    );
  };

  // Left-click popup suggestion handler
  const handleLeftClickReplace = () => {
    if (!editor || !leftClickPopup.word || leftClickPopup.from == null || leftClickPopup.to == null || !leftClickPopup.suggestions.length) return;
    replaceWordWithSuggestion(
      leftClickPopup.suggestions[0],
      leftClickPopup.word,
      leftClickPopup.from,
      leftClickPopup.to,
      null,
      () => setLeftClickPopup({ ...leftClickPopup, visible: false })
    );
  };

  // Context menu actions
  const ignoreError = () => {
    if (!contextMenu.word || contextMenu.from == null || contextMenu.to == null) return;
    const ignoredOccurrence = { word: contextMenu.word, from: contextMenu.from, to: contextMenu.to };
    const newIgnoredOccurrences = [...ignoredErrorIndices, ignoredOccurrence];
    setIgnoredErrorIndices(newIgnoredOccurrences);
    
    // Save to localStorage and cloud
    saveIgnoredOccurrences(newIgnoredOccurrences);
    if (currentDocument?.id) {
      saveSpellingSettingsToCloud(currentDocument.id, personalDictionary, autocorrectMap, newIgnoredOccurrences);
    }
    
    setContextMenu({ ...contextMenu, visible: false });
  };

  const addToPersonalDictionary = () => {
    if (!contextMenu.word) return;
    
    // Prevent adding duplicate words
    if (personalDictionary.includes(contextMenu.word)) {
      setContextMenu({ ...contextMenu, visible: false });
      return;
    }
    
    const newPersonalDictionary = [...personalDictionary, contextMenu.word];
    setPersonalDictionary(newPersonalDictionary);
    
    // Save to localStorage and cloud silently
    localStorage.setItem('personalDictionary', JSON.stringify(newPersonalDictionary));
    if (currentDocument?.id) {
      saveSpellingSettingsToCloud(currentDocument.id, newPersonalDictionary, autocorrectMap, ignoredErrorIndices).catch(() => {
      // Silently handle errors - don't interrupt user
    });
    }
    
    // Trigger immediate spell check to remove underline
    setTimeout(() => {
      performImmediateSpellCheck();
      // Also force a plugin update to refresh decorations
      if (editor && editor.view) {
        const tr = editor.view.state.tr.setMeta(spellcheckPluginKey, { 
          grammarErrors: [], 
          ignoredErrorIndices: ignoredErrorIndices 
        });
        editor.view.dispatch(tr);
      }
    }, 100);
    setContextMenu({ ...contextMenu, visible: false });
  };

  const alwaysCorrectTo = () => {
    if (!contextMenu.word || !contextMenu.suggestions[0]) return;
    
    // Store the auto-correction mapping
    setAutocorrectMap(prev => {
      const newMap = { ...prev, [contextMenu.word]: contextMenu.suggestions[0] };
      // Save to localStorage
      localStorage.setItem('autocorrectMap', JSON.stringify(newMap));
      // Save to cloud
      if (currentDocument?.id) {
        saveSpellingSettingsToCloud(currentDocument.id, personalDictionary, newMap, ignoredErrorIndices).catch(() => {
          // Silently handle errors - don't interrupt user
        });
      }
      return newMap;
    });
    
    // Replace the current word with the suggestion
    replaceWordWithSuggestion(
      contextMenu.suggestions[0],
      contextMenu.word,
      contextMenu.from,
      contextMenu.to,
      () => setContextMenu({ ...contextMenu, visible: false }),
      null
    );
  };

  // Hide menu on click elsewhere
  useEffect(() => {
    if (!contextMenu.visible) return;
    const handler = () => setContextMenu({ ...contextMenu, visible: false });
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [contextMenu]);

  // Left-click handler for underlined words
  const onUnderlineClick = (event) => {
    // Only handle left-click
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    if (!editor || !editor.view) return;
    // Get ProseMirror position from DOM event
    const pos = editor.view.posAtDOM(event.target, 0);
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
        el.removeEventListener('mousedown', onUnderlineClick);
        el.addEventListener('mousedown', onUnderlineClick);
      });
    }, 0);
  }, [editor]);

  // Left-click popup actions
  const handleLeftClickIgnore = () => {
    if (!leftClickPopup.word || leftClickPopup.from == null || leftClickPopup.to == null) return;
    
    console.log('🔍 [IGNORE] Ignoring word:', leftClickPopup.word, 'from:', leftClickPopup.from, 'to:', leftClickPopup.to);
    
    const ignoredOccurrence = { word: leftClickPopup.word, from: leftClickPopup.from, to: leftClickPopup.to };
    const newIgnoredOccurrences = [...ignoredErrorIndices, ignoredOccurrence];
    
    console.log('🔍 [IGNORE] New ignored occurrences:', newIgnoredOccurrences);
    
    setIgnoredErrorIndices(newIgnoredOccurrences);
    
    // Save to localStorage and cloud
    saveIgnoredOccurrences(newIgnoredOccurrences);
    if (currentDocument?.id) {
      saveSpellingSettingsToCloud(currentDocument.id, personalDictionary, autocorrectMap, newIgnoredOccurrences);
    }
    
    // Force immediate spell check to refresh decorations
    setTimeout(() => {
      console.log('🔍 [IGNORE] Triggering immediate spell check');
      performImmediateSpellCheck();
      
      // Also force a plugin update to refresh decorations
      if (editor && editor.view) {
        const tr = editor.view.state.tr.setMeta(spellcheckPluginKey, { 
          grammarErrors: grammarErrors, 
          ignoredErrorIndices: newIgnoredOccurrences 
        });
        editor.view.dispatch(tr);
        console.log('🔍 [IGNORE] Plugin state updated');
      }
    }, 100);
    
    setLeftClickPopup({ ...leftClickPopup, visible: false });
  };

  // More options dropdown
  const handleMoreOptionsClick = (event) => {
    event.stopPropagation();
    event.preventDefault();
    // Position dropdown closer to the left-click popup
    setMoreOptionsDropdown({
      visible: true,
      x: leftClickPopup.x + 80, // Position closer to the popup
      y: leftClickPopup.y - 60, // Position closer above the popup
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
    
    console.log('🔍 [ALWAYS CORRECT] Adding to autocorrect map:', leftClickPopup.word, '->', leftClickPopup.suggestions[0]);
    
    // Store the auto-correction mapping
    setAutocorrectMap(prev => {
      const newMap = { ...prev, [leftClickPopup.word]: leftClickPopup.suggestions[0] };
      console.log('🔍 [ALWAYS CORRECT] New autocorrect map:', newMap);
      
      // Save to localStorage and cloud silently
      localStorage.setItem('autocorrectMap', JSON.stringify(newMap));
      saveSpellingSettingsToCloud(personalDictionary, newMap, ignoredErrorIndices).catch(() => {
        // Silently handle errors - don't interrupt user
      });
      return newMap;
    });
    
    // Replace the current word with the suggestion
    replaceWordWithSuggestion(
      leftClickPopup.suggestions[0],
      leftClickPopup.word,
      leftClickPopup.from,
      leftClickPopup.to,
      null,
      () => setLeftClickPopup({ ...leftClickPopup, visible: false })
    );
    
    // Force immediate spell check to refresh decorations
    setTimeout(() => {
      console.log('🔍 [ALWAYS CORRECT] Triggering immediate spell check');
      performImmediateSpellCheck();
      
      // Also force a plugin update to refresh decorations
      if (editor && editor.view) {
        const tr = editor.view.state.tr.setMeta(spellcheckPluginKey, { 
          grammarErrors: grammarErrors, 
          ignoredErrorIndices: ignoredErrorIndices 
        });
        editor.view.dispatch(tr);
        console.log('🔍 [ALWAYS CORRECT] Plugin state updated');
      }
    }, 100);
    
    setMoreOptionsDropdown({ ...moreOptionsDropdown, visible: false });
  };
  const handleAddToPersonalDictionary = () => {
    console.log('🔍 [ADD TO DICT] Function called with word:', leftClickPopup.word);
    if (!leftClickPopup.word) {
      console.log('🔍 [ADD TO DICT] No word found, returning');
      return;
    }
    console.log('🔍 [ADD TO DICT] Current personal dictionary:', personalDictionary);
    
    // Prevent adding duplicate words
    if (personalDictionary.includes(leftClickPopup.word)) {
      console.log('🔍 [ADD TO DICT] Word already in dictionary, skipping');
      setMoreOptionsDropdown({ ...moreOptionsDropdown, visible: false });
      setLeftClickPopup({ ...leftClickPopup, visible: false });
      return;
    }
    
    const newPersonalDictionary = [...personalDictionary, leftClickPopup.word];
    console.log('🔍 [ADD TO DICT] New personal dictionary:', newPersonalDictionary);
    setPersonalDictionary(newPersonalDictionary);
    
    // Save to localStorage and cloud silently
    localStorage.setItem('personalDictionary', JSON.stringify(newPersonalDictionary));
    saveSpellingSettingsToCloud(newPersonalDictionary, autocorrectMap, ignoredErrorIndices).catch(() => {
      // Silently handle errors - don't interrupt user
    });
    
    // Force immediate spell check to remove underline
    setTimeout(() => {
      console.log('🔍 [ADD TO DICT] Triggering immediate spell check');
      performImmediateSpellCheck();
      // Also force a plugin update to refresh decorations
      if (editor && editor.view) {
        const tr = editor.view.state.tr.setMeta(spellcheckPluginKey, { 
          grammarErrors: grammarErrors, 
          ignoredErrorIndices: ignoredErrorIndices 
        });
        editor.view.dispatch(tr);
        console.log('🔍 [ADD TO DICT] Plugin state updated');
      }
    }, 100); // Increased delay to ensure state updates
    
    setMoreOptionsDropdown({ ...moreOptionsDropdown, visible: false });
    setLeftClickPopup({ ...leftClickPopup, visible: false });
    console.log('🔍 [ADD TO DICT] Function completed');
  };

  // Dynamic page sizing logic
  useEffect(() => {
    if (editor && editorWrapperRef.current) {
      const updatePageHeight = () => {
        const editorElement = editor.view.dom as HTMLElement;
        if (editorElement) {
          // Remove any height constraints from the editor element itself
          editorElement.style.minHeight = 'auto';
          editorElement.style.maxHeight = 'none';
          editorElement.style.height = 'auto';
          
          // Let the content determine the height naturally
          const contentHeight = editorElement.scrollHeight;
          const currentHeight = editorWrapperRef.current?.offsetHeight || 0;
          
          // Set original height on first load if not set
          if (originalPageHeight.current === 0) {
            originalPageHeight.current = Math.max(currentHeight, 1056); // Never less than A4 height
          }
          
          // Calculate new height: content height + padding, but never less than original
          const newHeight = Math.max(contentHeight + 80, originalPageHeight.current); // 80px for padding
          
          if (editorWrapperRef.current) {
            editorWrapperRef.current.style.minHeight = `${newHeight}px`;
            editorWrapperRef.current.style.height = 'auto';
          }
        }
      };

      // Update height when content changes
      const observer = new ResizeObserver(updatePageHeight);
      const editorElement = editor.view.dom as HTMLElement;
      if (editorElement) {
        observer.observe(editorElement);
      }

      // Initial height update
      updatePageHeight();

      return () => {
        observer.disconnect();
      };
    }
  }, [editor]);

  const [aiMenu, setAIMenu] = useState({ visible: false, top: 0, left: 0 });
  const editorContentRef = useRef<HTMLDivElement>(null);

  // Show AI menu on selection within editor only
  useEffect(() => {
    if (!editor || !editorContentRef.current) return;

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setAIMenu(menu => ({ ...menu, visible: false }));
        // Close rewrite input when selection is cleared
        if (showRewriteInput) {
          setShowRewriteInput(false);
          setRewriteInstruction('');
        }
        setPreviousSelection(null);
        return;
      }

      const range = selection.getRangeAt(0);
      
      // Check if the selection is within the editor
      const editorElement = editorContentRef.current;
      if (!editorElement.contains(range.commonAncestorContainer)) {
        setAIMenu(menu => ({ ...menu, visible: false }));
        // Close rewrite input when selection is outside editor
        if (showRewriteInput) {
          setShowRewriteInput(false);
          setRewriteInstruction('');
        }
        setPreviousSelection(null);
        return;
      }

      // Create a unique identifier for the current selection
      const currentSelectionId = `${range.startContainer.textContent?.slice(range.startOffset, range.startOffset + 10)}_${range.endContainer.textContent?.slice(range.endOffset - 10, range.endOffset)}_${range.startOffset}_${range.endOffset}`;

      // If rewrite input is currently shown, check if this is a different selection
      if (showRewriteInput && previousSelection && currentSelectionId !== previousSelection) {
        console.log('🔄 Different selection detected - closing rewrite input');
        console.log('Previous:', previousSelection);
        console.log('Current:', currentSelectionId);
        setShowRewriteInput(false);
        setRewriteInstruction('');
        setPreviousSelection(null);
        // Don't update AI menu position - let it stay hidden until user clicks rewrite again
        return;
      }

      // Update the previous selection
      setPreviousSelection(currentSelectionId);

      // Get the bounding rect of the selection
      let rect = range.getBoundingClientRect();
      
      // Always try to get the position near the end of the selection (last word selected)
      try {
        const endRange = document.createRange();
        endRange.setStart(range.endContainer, range.endOffset);
        endRange.setEnd(range.endContainer, range.endOffset);
        const endRect = endRange.getBoundingClientRect();
        
        // Use the end position if it's valid, otherwise fall back to the full selection
        if (endRect.width > 0 || endRect.height > 0) {
          rect = endRect;
        }
      } catch (e) {
        // Fallback to using the selection range
        rect = range.getBoundingClientRect();
      }

      // If still no valid rect, hide the menu
      if (rect.width === 0 && rect.height === 0) {
        setAIMenu(menu => menu.visible ? { ...menu, visible: false } : menu);
        return;
      }
      
      // Get the bounding rect of the editor container
      const containerRect = editorContentRef.current.getBoundingClientRect();
      
      // Calculate menu position - position near the end of selection (last word)
      let menuLeft = rect.right - containerRect.left + 2; // 2px to the right of the last word
      let menuTop = rect.top - containerRect.top - 36; // 36px above the last word
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Menu dimensions (approximate)
      const menuWidth = 200; // Approximate width of the AI menu
      const menuHeight = 40; // Approximate height of the AI menu
      
      // Calculate available space on both sides
      const spaceOnRight = viewportWidth - (rect.right - containerRect.left + 2);
      const spaceOnLeft = rect.left - containerRect.left - 2;
      
      // Check if selection is in the right half of the screen
      const selectionCenter = rect.left + (rect.width / 2);
      const screenCenter = viewportWidth / 2;
      const isSelectionOnRightSide = selectionCenter > screenCenter;
      
      // Determine positioning based on screen position and available space
      if (isSelectionOnRightSide || spaceOnRight < menuWidth) {
        // Position on the left side when selection is on right side or not enough space on right
        menuLeft = rect.left - containerRect.left - menuWidth - 2;
      } else {
        // Position on the right side (default for left side selections)
        menuLeft = rect.right - containerRect.left + 2;
      }
      
      // Ensure menu doesn't go off screen on either side
      if (menuLeft < 20) {
        menuLeft = 20; // Minimum left margin
      }
      if (menuLeft + menuWidth > viewportWidth - 20) {
        menuLeft = viewportWidth - menuWidth - 20; // Maximum right margin
      }
      
      // Check if menu would go off the top edge of the viewport
      if (menuTop < 20) {
        // Position below the selection instead
        menuTop = rect.bottom - containerRect.top + 2;
      }
      
      // Check if menu would go off the bottom edge of the viewport
      if (menuTop + menuHeight > viewportHeight - 20) {
        // Position above the selection but ensure it doesn't go off screen
        menuTop = Math.max(rect.top - containerRect.top - menuHeight - 2, 20);
      }
      
      // Position the menu with calculated coordinates
      setAIMenu({
        visible: true,
        top: menuTop,
        left: menuLeft,
      });
    };

    // Listen for selection changes with multiple event types for better consistency
    const editorElement = editorContentRef.current;
    
    // Remove selectionchange listener - only trigger on mouseup after selection is complete
    // document.addEventListener('selectionchange', handleSelectionChange);
    
    // Add mouse and keyboard events for additional triggers
    editorElement.addEventListener('mouseup', handleSelectionChange);
    editorElement.addEventListener('keyup', handleSelectionChange);
    
    // Remove mousedown listener - only trigger on mouseup after selection is complete
    // editorElement.addEventListener('mousedown', () => {
    //   // Small delay to let the selection happen first
    //   setTimeout(handleSelectionChange, 10);
    // });
    
    return () => {
      // document.removeEventListener('selectionchange', handleSelectionChange);
      editorElement.removeEventListener('mouseup', handleSelectionChange);
      editorElement.removeEventListener('keyup', handleSelectionChange);
      // editorElement.removeEventListener('mousedown', handleSelectionChange);
    };
  }, [editor]);

  // Hide AI menu when clicking outside or when selection changes
  useEffect(() => {
    if (!aiMenu.visible) return;
    
    const handleClickOutside = (event) => {
      // Check if click is outside the AI menu and not on selected text
      const aiMenuElement = document.querySelector('.ai-bubble-menu');
      const selection = window.getSelection();
      
      console.log('🔍 Click outside handler triggered');
      console.log('📋 Show rewrite input state:', showRewriteInput);
      console.log('🎯 Click target:', event.target);
      
      // Don't hide AI menu if rewrite input is shown
      if (showRewriteInput) {
        console.log('✅ Keeping AI menu open - rewrite input is active');
        return; // Keep AI menu open if rewrite input is visible
      }
      
      // Don't hide AI menu if there's a rewrite input element
      const rewriteInput = document.querySelector('.ai-bubble-menu input');
      if (rewriteInput) {
        console.log('✅ Keeping AI menu open - rewrite input element found');
        return; // Keep AI menu open if rewrite input is visible
      }
      
      // Don't hide AI menu if user is actively typing in the rewrite input
      const activeElement = document.activeElement;
      if (activeElement && activeElement.closest('.ai-bubble-menu')) {
        console.log('✅ Keeping AI menu open - user is interacting with menu');
        return; // Keep AI menu open if user is interacting with it
      }
      
      if (aiMenuElement && !aiMenuElement.contains(event.target)) {
        // Only hide if there's no selection or selection is collapsed
        if (!selection || selection.isCollapsed) {
          // Don't hide AI menu if rewrite input is active
          if (showRewriteInput) {
            console.log('✅ Keeping AI menu open - rewrite input is active');
            return;
          }
          console.log('❌ Hiding AI menu - click outside and no selection');
          setAIMenu(menu => ({ ...menu, visible: false }));
        }
      }
    };
    
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      
      console.log('🔄 Selection change handler triggered');
      console.log('📋 Show rewrite input state:', showRewriteInput);
      
      // Don't hide AI menu if rewrite input is shown
      if (showRewriteInput) {
        console.log('✅ Keeping AI menu open - rewrite input is active');
        return; // Keep AI menu open if rewrite input is visible
      }
      
      // Don't hide AI menu if there's a rewrite input open
      const rewriteInput = document.querySelector('.ai-bubble-menu input');
      if (rewriteInput) {
        console.log('✅ Keeping AI menu open - rewrite input element found');
        return; // Keep AI menu open if rewrite input is visible
      }
      
      // Don't hide AI menu if user is actively typing in the rewrite input
      const activeElement = document.activeElement;
      if (activeElement && activeElement.closest('.ai-bubble-menu')) {
        console.log('✅ Keeping AI menu open - user is interacting with menu');
        return; // Keep AI menu open if user is interacting with it
      }
      
      if (!selection || selection.isCollapsed) {
        // Don't hide AI menu if rewrite input is active
        if (showRewriteInput) {
          console.log('✅ Keeping AI menu open - rewrite input is active');
          return;
        }
        console.log('❌ Hiding AI menu - no selection');
        setAIMenu(menu => ({ ...menu, visible: false }));
      }
    };
    
    // Prevent selection from being cleared when clicking on AI menu
    const handleAIMenuClick = (event) => {
      const aiMenuElement = document.querySelector('.ai-bubble-menu');
      if (aiMenuElement && aiMenuElement.contains(event.target)) {
        event.stopPropagation();
        event.preventDefault();
        // Don't trigger selection change when clicking on AI menu
        return false;
      }
    };
    
    // Also prevent mousedown events on AI menu from affecting selection
    const handleAIMenuMouseDown = (event) => {
      const aiMenuElement = document.querySelector('.ai-bubble-menu');
      if (aiMenuElement && aiMenuElement.contains(event.target)) {
        event.stopPropagation();
        event.preventDefault();
        return false;
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mousedown', handleAIMenuClick, true);
    document.addEventListener('mousedown', handleAIMenuMouseDown, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mousedown', handleAIMenuClick, true);
      document.removeEventListener('mousedown', handleAIMenuMouseDown, true);
    };
  }, [aiMenu.visible, showRewriteInput]);

  // Update rewrite input position when it's shown
  useEffect(() => {
    if (showRewriteInput && aiMenu.visible) {
      console.log('📍 Setting rewrite input position:', { top: aiMenu.top + 30, left: aiMenu.left });
      setRewriteInputPosition({ top: aiMenu.top + 30, left: aiMenu.left });
    }
  }, [showRewriteInput, aiMenu.visible, aiMenu.top, aiMenu.left]);

  // Auto-reposition rewrite input when it goes off screen
  useEffect(() => {
    if (showRewriteInput) {
      const repositionInput = () => {
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const inputWidth = 200; // Approximate width of the input
        const inputHeight = rewriteInputHeight; // Use dynamic height
        
        console.log('🔄 Checking rewrite input position:', rewriteInputPosition);
        console.log('📐 Viewport dimensions:', { width: viewportWidth, height: viewportHeight });
        
        let newTop = rewriteInputPosition.top;
        let newLeft = rewriteInputPosition.left;
        
        // Check if input goes off the bottom of the viewport
        if (rewriteInputPosition.top + inputHeight > viewportHeight - 20) {
          newTop = rewriteInputPosition.top - inputHeight - 40; // Move up above the selection
          console.log('⬆️ Moving rewrite input up to:', newTop);
        }
        
        // Check if input goes off the right side of the viewport
        if (rewriteInputPosition.left + inputWidth > viewportWidth - 20) {
          newLeft = viewportWidth - inputWidth - 20; // Move to left side
          console.log('⬅️ Moving rewrite input left to:', newLeft);
        }
        
        // Check if input goes off the left side of the viewport
        if (rewriteInputPosition.left < 20) {
          newLeft = 20; // Move to right side
          console.log('➡️ Moving rewrite input right to:', newLeft);
        }
        
        // Check if input goes off the top of the viewport
        if (rewriteInputPosition.top < 20) {
          newTop = 20; // Move to bottom
          console.log('⬇️ Moving rewrite input down to:', newTop);
        }
        
        // Only update if position changed
        if (newTop !== rewriteInputPosition.top || newLeft !== rewriteInputPosition.left) {
          console.log('📍 Updating rewrite input position to:', { top: newTop, left: newLeft });
          setRewriteInputPosition({ top: newTop, left: newLeft });
        }
      };
      
      // Reposition after a short delay to ensure DOM is updated
      const timer = setTimeout(repositionInput, 100);
      return () => clearTimeout(timer);
    }
  }, [showRewriteInput, rewriteInputPosition]);

  // Scroll to ensure rewrite input is visible
  useEffect(() => {
    if (showRewriteInput) {
      const scrollToInput = () => {
        const containerRect = editorContentRef.current?.getBoundingClientRect();
        if (containerRect) {
          const inputBottom = rewriteInputPosition.top + rewriteInputHeight; // Use dynamic height
          const containerBottom = containerRect.bottom;
          
          console.log('📜 Checking scroll position:', {
            inputBottom,
            containerBottom,
            containerTop: containerRect.top
          });
          
          // If input is below the visible area, scroll down
          if (inputBottom > containerBottom - 100) {
            const scrollAmount = inputBottom - containerBottom + 100;
            console.log('⬇️ Scrolling down by:', scrollAmount);
            window.scrollBy(0, scrollAmount);
          }
          
          // If input is above the visible area, scroll up
          if (rewriteInputPosition.top < containerRect.top + 100) {
            const scrollAmount = containerRect.top + 100 - rewriteInputPosition.top;
            console.log('⬆️ Scrolling up by:', scrollAmount);
            window.scrollBy(0, -scrollAmount);
          }
        }
      };
      
      // Scroll after a short delay to ensure positioning is complete
      const timer = setTimeout(scrollToInput, 150);
      return () => clearTimeout(timer);
    }
  }, [showRewriteInput, rewriteInputPosition]);

  // Handle window resize to reposition rewrite input
  useEffect(() => {
    if (showRewriteInput) {
      const handleResize = () => {
        console.log('🔄 Window resized - repositioning rewrite input');
        // Trigger repositioning by updating the position slightly
        setRewriteInputPosition(prev => ({ ...prev }));
        
        // Recalculate height when window is resized
        if (rewriteTextareaRef.current) {
          const textarea = rewriteTextareaRef.current;
          const value = rewriteInstruction;
          
          // Calculate lines based on new width
          const textareaWidth = textarea.offsetWidth - 16;
          const charWidth = 7;
          const charsPerLine = Math.floor(textareaWidth / charWidth);
          
          const lines = value.split('\n').reduce((total, line) => {
            const wrappedLines = Math.ceil(line.length / charsPerLine);
            return total + Math.max(1, wrappedLines);
          }, 0);
          
          const lineHeight = 20;
          const buttonHeight = 28; // Height of the button area
          const padding = 16; // Container padding
          const minHeight = 120; // Increased minimum height
          const maxHeight = 400; // Increased maximum height for much longer text
          const textareaHeight = Math.min(maxHeight - buttonHeight, Math.max(minHeight - buttonHeight, lines * lineHeight));
          const newHeight = textareaHeight + buttonHeight + padding;
          
          console.log('📏 Recalculating height on resize:', {
            textareaWidth,
            charsPerLine,
            lines,
            newHeight
          });
          
          setRewriteInputHeight(newHeight);
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [showRewriteInput, rewriteInstruction]);

  // Recalculate height when textarea is shown or resized
  useEffect(() => {
    if (showRewriteInput && rewriteTextareaRef.current) {
      const textarea = rewriteTextareaRef.current;
      const value = rewriteInstruction;
      
      // Calculate lines based on content and width
      const textareaWidth = textarea.offsetWidth - 16; // Subtract padding
      const charWidth = 7; // Approximate character width in pixels
      const charsPerLine = Math.floor(textareaWidth / charWidth);
      
      // Count actual line breaks and calculate wrapped lines
      const lines = value.split('\n').reduce((total, line) => {
        const wrappedLines = Math.ceil(line.length / charsPerLine);
        return total + Math.max(1, wrappedLines);
      }, 0);
      
      const lineHeight = 20; // Approximate line height
      const buttonHeight = 28; // Height of the button area
      const padding = 16; // Container padding
      const minHeight = 120; // Increased minimum height
      const maxHeight = 400; // Increased maximum height for much longer text
      const textareaHeight = Math.min(maxHeight - buttonHeight, Math.max(minHeight - buttonHeight, lines * lineHeight));
      const newHeight = textareaHeight + buttonHeight + padding;
      
      console.log('🔄 Recalculating height on show:', {
        length: value.length,
        lines,
        charsPerLine,
        textareaWidth,
        newHeight
      });
      
      setRewriteInputHeight(newHeight);
    }
  }, [showRewriteInput, rewriteInstruction]);


    useEffect(() => {
    if (!editor || !nspell) return;

    // Remove spell checking from onUpdate to prevent cursor jumping
    // Spell checking will only happen when explicitly triggered
  }, [editor, nspell, autocorrectMap, personalDictionary]);



  // Add context menu event listener to editor
  useEffect(() => {
    if (!editor) return;
    
    const editorElement = editor.view.dom;
    
    const handleContextMenu = (event) => {
      onContextMenu(event);
    };
    
    const handleClick = (event) => {
      // Check if clicked element has grammar-underline class
      const target = event.target;
      if (target.classList.contains('grammar-underline')) {
        
        const word = target.getAttribute('data-word');
        const from = parseInt(target.getAttribute('data-from'));
        const to = parseInt(target.getAttribute('data-to'));
        const suggestions = JSON.parse(target.getAttribute('data-suggestions') || '[]');
        
        if (word && from !== null && to !== null) {
          setLeftClickPopup({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            word: word,
            suggestions: suggestions,
            from: from,
            to: to,
          });
        }
      }
      
      // Check if clicked on highlighted AI text (only for AI-generated highlights)
      if (target.classList.contains('ProseMirror-highlight') || 
          target.closest('.ProseMirror-highlight')) {
        
        // Get the highlighted element
        const highlightedElement = target.classList.contains('ProseMirror-highlight') ? target : target.closest('.ProseMirror-highlight');
        
        if (highlightedElement) {
          // Get the text content of the highlighted element
          const highlightedText = highlightedElement.textContent;
          
          // Find the position of this text in the editor
          const editorContent = editor.state.doc.textContent;
          const textIndex = editorContent.indexOf(highlightedText);
          
          if (textIndex !== -1) {
            const from = textIndex;
            const to = textIndex + highlightedText.length;
            
            // Check if this is AI-generated text by looking for it in aiChanges
            const changeKey = `${from}-${to}`;
            const isAIGenerated = aiChanges.has(changeKey);
            
            if (isAIGenerated) {
              console.log('🎯 Clicked on AI-generated highlighted text');
              
              // Get the position of the click
              const rect = target.getBoundingClientRect();
              const position = {
                top: rect.top + window.scrollY,
                left: rect.left + (rect.width / 2) + window.scrollX
              };
              
              // Select the highlighted text
              editor.chain()
                .focus()
                .setTextSelection({ from, to })
                .run();
              
              setClickedAIText({ from, to, originalText: highlightedText });
              setAiPopupPosition(position);
              setAiPopupVisible(true);
            } else {
              console.log('🎯 Clicked on user-generated highlighted text - ignoring');
            }
          }
        }
      }
    };
    
    editorElement.addEventListener('contextmenu', handleContextMenu);
    editorElement.addEventListener('click', handleClick);
    
    return () => {
      editorElement.removeEventListener('contextmenu', handleContextMenu);
      editorElement.removeEventListener('click', handleClick);
    };
  }, [editor]);

  // Close rewrite input when clicking outside
  useEffect(() => {
    if (!showRewriteInput) return;
    
    const handleClickOutside = (event) => {
      // Check if click is outside the rewrite input container
      const rewriteInputContainer = document.querySelector('[data-rewrite-input="true"]');
      
      if (rewriteInputContainer && !rewriteInputContainer.contains(event.target)) {
        console.log('🖱️ Click outside rewrite input - closing');
        setShowRewriteInput(false);
        setRewriteInstruction('');
      }
    };
    
    // Add event listener with a small delay to avoid immediate closure
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRewriteInput]);

  // Render the single continuous page
  return (
    <div className={`paginated-editor-container ${className}`}>
      <div 
        ref={editorWrapperRef}
        className="editor-wrapper" 
        style={{ 
          maxWidth: '800px !important',
          width: '800px !important',
          margin: '0 auto',
          backgroundColor: 'white',
          border: 'none',
          borderRadius: '0',
          boxShadow: 'none',
          padding: '40px 5px !important'
        }}
      >
        <div ref={editorContentRef} style={{ position: 'relative' }}>
          <EditorContent 
            editor={editor} 
            className={`${className} ${showToolbar ? 'pt-16' : ''}`}
          />
          <AIBubbleMenu 
          visible={aiMenu.visible} 
          top={aiMenu.top} 
          left={aiMenu.left}
          showRewriteInput={showRewriteInput}
          setShowRewriteInput={setShowRewriteInput}
          rewriteInstruction={rewriteInstruction}
          setRewriteInstruction={setRewriteInstruction}
            onExpand={handleAIExpand}
            onShorten={handleAIShorten}
            onToneChange={handleAIToneChange}
          />
          
          {/* AI Undo/Keep Popup */}
          <AIAcceptRejectPopup
            isVisible={aiPopupVisible}
            position={aiPopupPosition}
            onAccept={handleKeepAIChanges}
            onReject={handleUndoAIChanges}
            onClose={() => setAiPopupVisible(false)}
          />
        
          {/* Rewrite input */}
          {showRewriteInput && (
          <div
              data-rewrite-input="true"
            style={{
              position: 'absolute',
                top: rewriteInputPosition.top,
                left: rewriteInputPosition.left,
              background: '#ffffff',
              border: '2px solid #3b82f6',
              borderRadius: 4,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              padding: '8px',
              zIndex: 10000,
                minWidth: 400, // Increased from 300 to 400 for wider textarea
                height: rewriteInputHeight,
                transition: 'top 0.2s ease-out, left 0.2s ease-out, height 0.2s ease-out',
              }}
              className="no-spell-check"
              onMouseDown={(e) => {
                // Only prevent default if clicking on the container itself, not the textarea
                if (e.target === e.currentTarget) {
                e.stopPropagation();
                e.preventDefault();
                }
                // Allow text selection in textarea
              }}
              onClick={(e) => {
                // Only prevent default if clicking on the container itself, not the textarea
                if (e.target === e.currentTarget) {
                e.stopPropagation();
                e.preventDefault();
                }
                // Allow text selection in textarea
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', height: '100%' }}>
                <textarea
                  ref={rewriteTextareaRef}
                  className="rewrite-input-no-spellcheck"
                  placeholder={isRewriting ? "Rewriting..." : "Tell me how to rewrite this text..."}
                  value={rewriteInstruction}
                  onChange={handleRewriteInputChange}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && !isRewriting && handleRewriteSubmit()}
                  onKeyDown={(e) => {
                    // Allow Ctrl+A to select all text
                    if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                      e.target.select();
                      console.log('⌨️ Select all text in rewrite input');
                    }
                  }}
                  onMouseDown={(e) => {
                    // Allow text selection by not preventing default
                    console.log('🖱️ Rewrite input mousedown - allowing text selection');
                  }}
                  onClick={(e) => {
                    // Allow text selection by not preventing default
                    console.log('🖱️ Rewrite input clicked - allowing text selection');
                  }}
                  onFocus={(e) => {
                    // Allow text selection by not preventing default
                    console.log('🎯 Rewrite input focused - allowing text selection');
                  }}
                  disabled={isRewriting}
                  spellCheck="false"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
              style={{
                width: '100%',
                padding: '4px 8px',
                border: '1px solid #d1d5db',
                borderRadius: 3,
                fontSize: '12px',
                outline: 'none',
                    opacity: isRewriting ? 0.6 : 1,
                    resize: 'none',
                    overflow: 'hidden', // Changed back to 'hidden' to prevent scrolling
                    fontFamily: 'inherit',
                    lineHeight: '1.4',
                    minHeight: '32px',
                    maxHeight: '372px', // Maximum height before stopping (400 - 28 for buttons)
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                    boxSizing: 'border-box',
                    flex: '1',
                    userSelect: 'text', // Enable text selection
                    cursor: 'text', // Show text cursor
                    spellCheck: false, // Disable browser spell checking
                    WebkitSpellCheck: false, // Disable WebKit spell checking
                    MozSpellCheck: false, // Disable Firefox spell checking
                    textDecoration: 'none', // Remove any underlines
                    textDecorationLine: 'none', // Remove any underlines
                    textDecorationStyle: 'none', // Remove any underlines
                    textDecorationColor: 'transparent', // Remove any underlines
              }}
              autoFocus
            />
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                      if (!isRewriting) {
                  handleRewriteSubmit();
                      }
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                    disabled={isRewriting}
                style={{
                  padding: '2px 8px',
                  fontSize: '10px',
                      background: isRewriting ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 3,
                      cursor: isRewriting ? 'not-allowed' : 'pointer',
                }}
              >
                    {isRewriting ? (
                      <div className="flex items-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        <span>Rewriting...</span>
                      </div>
                    ) : (
                      'Submit'
                    )}
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  setShowRewriteInput(false);
                  setRewriteInstruction('');
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                style={{
                  padding: '2px 8px',
                  fontSize: '10px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: 3,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
                </div>
            </div>
          </div>
        )}
        </div>
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
        onAlwaysCorrect={alwaysCorrectTo}
      />

      {/* Left-click suggestion popup portal */}
      {leftClickPopup.visible && (
        createPortal(
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
               <div 
                 style={{ 
                   fontWeight: 400, 
                   cursor: leftClickPopup.suggestions.length ? 'pointer' : 'default', 
                   fontSize: '14px', 
                   color: '#222', 
                   fontFamily: 'Arial, sans-serif',
                   padding: '4px 8px',
                   borderRadius: '3px',
                   transition: 'background-color 0.2s'
                 }}
                 onMouseEnter={e => {
                   if (leftClickPopup.suggestions.length) {
                     e.currentTarget.style.backgroundColor = '#f5f5f5';
                   }
                 }}
                 onMouseLeave={e => {
                   e.currentTarget.style.backgroundColor = 'transparent';
                 }}
                 onClick={handleLeftClickReplace}
                 title="spelling suggestions"
               >
                 {leftClickPopup.suggestions[0] || '(No suggestions)'}
               </div>
              <div title="Ignore" style={{ cursor: 'pointer', borderRadius: '50%', padding: 2, transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, backgroundColor: 'white', border: '1px solid #ddd' }} onClick={handleLeftClickIgnore}>
                {/* Smaller X icon (SVG) */}
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 5L13 13M13 5L5 13" stroke="#666" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div title="More options"
                style={{ cursor: 'pointer', borderRadius: '50%', padding: 2, transition: 'background 0.2s', opacity: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22 }}
                onClick={handleMoreOptionsClick}
              >
                <span style={{ fontSize: 18, fontWeight: 700, color: '#666', letterSpacing: 1 }}>⋮</span>
              </div>
            </div>
          </div>,
          document.body
        )
      )}

      {/* More options dropdown portal */}
      {moreOptionsDropdown.visible && (
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: moreOptionsDropdown.y,
              left: moreOptionsDropdown.x,
              zIndex: 10001,
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              minWidth: 160,
              padding: '4px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: 0
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 13 }} onClick={handleAlwaysCorrect}>
              Always correct to "{leftClickPopup.suggestions[0] || ''}"
            </div>
            <div style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 13 }} onClick={handleAddToPersonalDictionary}>
              Add to personal dictionary
            </div>
          </div>,
          document.body
        )
      )}
    </div>
  );
}