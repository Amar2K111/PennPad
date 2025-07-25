'use client'

import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  ListBulletIcon,
  CodeBracketIcon,
  PhotoIcon,
  LinkIcon,
  TableCellsIcon,
  PaintBrushIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  MinusIcon,
  PlusIcon,
  PencilIcon,
  ChevronDownIcon,
  CheckIcon,
  ViewColumnsIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/app/lib/utils'
import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useEditorStore } from '@/app/store/useEditorStore'

export default function Toolbar({ 
  editor, 
  totalWordCount, 
  onUndo, 
  onRedo, 
  canUndo = true, 
  canRedo = true, 
  fontSize: fontSizeProp, 
  setFontSize: setFontSizeProp, 
  onViewAllPages
}: {
  editor: any;
  totalWordCount: number;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  fontSize?: number;
  setFontSize?: (size: number) => void;
  onViewAllPages?: () => void;
}) {
  const [fontSizeState, setFontSizeState] = useState(11)
  const fontSize = fontSizeProp !== undefined ? fontSizeProp : fontSizeState
  const setFontSize = setFontSizeProp || setFontSizeState
  const [alignDropdownOpen, setAlignDropdownOpen] = useState(false)
  const [alignment, setAlignment] = useState('left')
  const alignBtnRef = useRef(null)
  const [spacingDropdownOpen, setSpacingDropdownOpen] = useState(false)
  const BASE_LINE_HEIGHT = 1.15;
  const lineSpacingOptions = [
    { label: 'Single', value: '1.0' },
    { label: '1.15', value: '1.15' },
    { label: '1.5', value: '1.5' },
    { label: 'Double', value: '2.0' },
  ];
  const [lineSpacing, setLineSpacing] = useState('1.15');
  const spacingBtnRef = useRef(null)
  const dropdownRef = useRef(null)
  const [dropdownPos, setDropdownPos] = useState({ left: 0, top: 0 })
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false)
  const colorBtnRef = useRef(null)
  const colorDropdownRef = useRef(null)
  const [colorDropdownPos, setColorDropdownPos] = useState({ left: 0, top: 0 })
  const [highlightDropdownOpen, setHighlightDropdownOpen] = useState(false)
  const highlightBtnRef = useRef(null)
  const highlightDropdownRef = useRef(null)
  const [highlightDropdownPos, setHighlightDropdownPos] = useState({ left: 0, top: 0 })
  const spacingDropdownRef = useRef(null)
  const {
    wordCount,
    dailyCount,
    wordGoal,
    dailyGoal,
    setWordGoal,
    setDailyGoal,
    resetDailyCount,
    setDailyStartCount,
    setPrevWordCount,
    loadAnalyticsFromCloud,
    saveAnalyticsToCloud,
    celebration,
    setCelebration,
    activeFontSize,
    setActiveFontSize,
  } = useEditorStore()
  const [editingWordGoal, setEditingWordGoal] = useState(false)
  const [editingDailyGoal, setEditingDailyGoal] = useState(false)
  const [wordGoalInput, setWordGoalInput] = useState(wordGoal)
  const [dailyGoalInput, setDailyGoalInput] = useState(dailyGoal);
  const [showResetPopup, setShowResetPopup] = useState(false);
  const [showDailyGoalModal, setShowDailyGoalModal] = useState(false);
  const dailyCountRef = useRef(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [flash, setFlash] = useState(false);
  const [fontSizeInput, setFontSizeInput] = useState('11');
  // Font size management
  const [currentFontSize, setCurrentFontSize] = useState(11);
  const [fontSizeDropdownOpen, setFontSizeDropdownOpen] = useState(false);
  const fontSizeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setWordGoalInput(wordGoal) }, [wordGoal])
  useEffect(() => { setDailyGoalInput(dailyGoal) }, [dailyGoal]);

  // Load analytics from cloud when component mounts
  useEffect(() => {
    loadAnalyticsFromCloud();
  }, [loadAnalyticsFromCloud]);

  // Save analytics to cloud when daily goal changes
  useEffect(() => {
    if (dailyGoal > 0) {
      saveAnalyticsToCloud();
    }
  }, [dailyGoal, saveAnalyticsToCloud]);

  // Removed word count analytics saving - only save on breaks

  // Update font size input when current font size changes
  useLayoutEffect(() => {
    // Use the exact currentFontSize value, not the closest match
    const currentLabel = pxToLabel(currentFontSize);
    
    // Update both React state and DOM directly
    setFontSizeInput(currentLabel);
    
    // Also update the DOM input field directly as a backup
    const inputElement = document.querySelector('input[title="Font size"]') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = currentLabel;
    }
  }, [currentFontSize]);

  useEffect(() => {
    const currentLabel = pxToLabel(currentFontSize);
    setFontSizeInput(currentLabel);
    const inputElement = document.querySelector('input[type="text"][value="' + currentLabel + '"]') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = currentLabel;
    }
  }, [currentFontSize]);

  useEffect(() => {
    const currentLabel = pxToLabel(currentFontSize);
    setFontSizeInput(currentLabel);
  }, [currentFontSize]);

  const handleWordGoalSave = () => {
    if (setWordGoal) setWordGoal(Number(wordGoalInput) || 0)
    setEditingWordGoal(false)
  }
  // Remove handleDailyGoalSave function and any references to it
  // Only call setDailyGoal in the Save button's onClick

  const fontOptions = [
    { label: 'Arial', value: 'Arial, Helvetica Neue, Helvetica, sans-serif' },
    { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Courier New', value: '"Courier New", Courier, monospace' },
    { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
    { label: 'Trebuchet MS', value: '"Trebuchet MS", Helvetica, sans-serif' },
    { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive, sans-serif' },
    { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
    { label: 'Garamond', value: 'Garamond, serif' },
  ];

  const alignmentOptions = [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
    { label: 'Justify', value: 'justify' },
  ];
  const [fontFamily, setFontFamily] = useState(fontOptions[0].value);

  // Test console.log is working - moved after state declarations
  // console.log('=== TOOLBAR COMPONENT RENDERED ===')
  // console.log('Editor available:', !!editor, editor)
  // console.log('alignDropdownOpen state:', alignDropdownOpen)
  // console.log('dailyGoal from store:', dailyGoal)
  // console.log('dailyCount from store:', dailyCount)

  const toggleBold = () => {}
  const toggleItalic = () => {}
  const toggleUnderline = () => {}
  const toggleStrike = () => {}
  const toggleBulletList = () => {}
  const toggleOrderedList = () => {}
  const toggleBlockquote = () => {}
  const toggleCodeBlock = () => {}
  // Remove unused setTextAlign stub

  const addImage = () => {
    const url = window.prompt('Enter image URL')
    if (url) {
      // editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addLink = () => {
    const url = window.prompt('Enter URL')
    if (url) {
      // editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const insertTable = () => {
    // editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const setColor = (color: string) => {
    // editor.chain().focus().setColor(color).run()
  }

  const setHighlight = (color: string) => {
    // editor.chain().focus().setHighlight({ color }).run()
  }

  const handleUndo = () => {
    if (onUndo) return onUndo();
    if (editor) editor.chain().focus().undo().run();
  }
  const handleRedo = () => {
    if (onRedo) return onRedo();
    if (editor) editor.chain().focus().redo().run();
  }

  // Complete list of Google Docs-style font sizes in px, strictly increasing
  const FONT_SIZES_PX = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 60, 72, 96];
  // Corresponding labels for display (Google Docs style)
  const pxToLabel = (px: number) => {
    return px.toString();
  }
  const labelToPx = (label: string) => {
    const px = parseInt(label, 10);
    return isNaN(px) ? 11 : px;
  }

  const handleFontSizeDropdownClick = (size: number) => {
    console.log('🔍 === FONT SIZE DROPDOWN CLICK ===');
    console.log('📊 Selected size:', size);
    console.log('📊 Editor available:', !!editor);
    
    if (!editor) {
      console.log('❌ Editor not available');
      return;
    }
    
    // Debug editor state
    console.log('📊 Editor state:', editor.state);
    console.log('📊 Editor commands:', Object.keys(editor.commands));
    console.log('📊 Available marks:', Object.keys(editor.schema.marks));
    console.log('📊 TextStyle mark exists:', !!editor.schema.marks.textStyle);
    
    setCurrentFontSize(size);
    setFontSizeInput(size.toString());
    
    // Focus the editor first, then apply font size
    editor.commands.focus();
    
    // Simple test - try the most basic approach
    console.log('📊 Trying simple font size application...');
    try {
      // Map size to actual pixel size
      let actualSize = 2;
      if (size >= 12) {
        actualSize = size + 3;
      } else if (size >= 8) {
        actualSize = 14 - (11 - size) * 0.5;
      } else {
        actualSize = 12;
      }
      
      console.log(`📊 Size ${size} → ${actualSize}px`);
      
      // Test different approaches
      console.log('📊 Testing approach 1: setMark with textStyle');
      const result1 = editor.chain().focus().setMark('textStyle', { fontSize: `${actualSize}px` }).run();
      console.log('📊 Result 1:', result1);
      
      console.log('📊 Testing approach 3: direct mark application');
      const { state } = editor;
      const { selection } = state;
      const mark = state.schema.marks.textStyle.create({ fontSize: `${actualSize}px` });
      const tr = state.tr.addMark(selection.from, selection.to, mark);
      editor.view.dispatch(tr);
      console.log('📊 Result 3: direct dispatch completed');
      
      // Store the current font size as the active font size for future typing
      localStorage.setItem('activeFontSize', actualSize.toString());
      console.log('📊 Stored in localStorage:', actualSize);
      
      // Check if it worked
      setTimeout(() => {
        const { selection } = editor.state;
        const marks = selection.$from.marks();
        console.log('📊 Marks after application:', marks);
        
        const fontSizeMark = marks.find(mark => mark.type.name === 'textStyle');
        if (fontSizeMark) {
          console.log('✅ Font size mark found:', fontSizeMark.attrs);
        } else {
          console.log('❌ No font size mark found');
        }
        
        // Verify localStorage was set
        const stored = localStorage.getItem('activeFontSize');
        console.log('📊 localStorage verification:', stored);
      }, 50);
      
    } catch (error) {
      console.error('❌ Error applying font size:', error);
    }
    
    setFontSizeDropdownOpen(false);
    
    console.log('📊 Font size dropdown closed');
  };

  // Remove old helper functions - now using simple +1/-1 increments

  const handleFontSizeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFontSizeInput(e.target.value);
  };

  const handleFontSizeInputBlur = () => {
    const inputValue = fontSizeInput.trim();
    
    if (inputValue && editor) {
      const newPx = labelToPx(inputValue);
      
              if (newPx) {
          setCurrentFontSize(newPx);
          
          // Apply font size using helper function
          applyFontSizeToDOM(newPx);
        }
    }
    
    // Don't reset input here - let the useEffect handle it
  };

  const handleFontSizeInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  // Global variable to store next font size
  let nextFontSize: string | null = null;
  let fontSizeChangeTimeout: NodeJS.Timeout | null = null;

  // Helper function to apply font size to DOM
  const applyFontSizeToDOM = (newSize: number) => {
    console.log('🔍 === APPLY FONT SIZE TO DOM START ===');
    console.log('📊 Requested size:', newSize);
    console.log('📊 Editor available:', !!editor);
    console.log('📊 Editor type:', typeof editor);
    console.log('📊 Editor state:', editor?.state);
    console.log('📊 Editor commands:', editor?.commands);
    
    if (!editor) {
      console.log('❌ Editor not available');
      return;
    }
    
    console.log('📊 Editor object:', editor);
    
    try {
      // LOGICAL SIZE MAPPING: Map toolbar sizes to actual pixel sizes
      let actualSize = 2; // Default fallback
      
      if (newSize >= 12) {
        // For sizes 12 and up: add 3 to get actual pixel size
        actualSize = newSize + 3;
        console.log(`📊 Size ${newSize} → ${actualSize}px`);
      } else if (newSize >= 8) {
        // For sizes 8-11: use 0.5 increments down from 11
        actualSize = 14 - (11 - newSize) * 0.5;
        console.log(`📊 Size ${newSize} → ${actualSize}px`);
      } else {
        // For very small sizes: minimum 12px
        actualSize = 12;
        console.log(`📊 Size ${newSize} → ${actualSize}px (minimum)`);
      }
      
      console.log('📊 Applying actual size:', `${actualSize}px`);
      
      // Apply font size using TipTap's FontSize extension
      const { from, to } = editor.state.selection;
      console.log('📊 Selection from:', from, 'to:', to);
      
      // Try different approaches to apply font size
      console.log('📊 Available marks:', editor.schema.marks);
      console.log('📊 Available nodes:', editor.schema.nodes);
      
      if (from !== to) {
        // If text is selected, apply to selection
        console.log('📊 Applying to selected text');
        console.log('📊 Selection from:', from, 'to:', to);
        
        // Apply font size to the selected text
        try {
          // Try the direct approach first
          const result = editor.chain().focus().setMark('textStyle', { fontSize: `${actualSize}px` }).run();
          console.log('✅ Applied font size to selected text:', `${actualSize}px`);
          console.log('📊 Command result:', result);
        } catch (e1) {
          console.log('📊 First approach failed:', e1);
          try {
            // Try alternative approach
            const result = editor.chain().focus().setMark('textStyle', { fontSize: `${actualSize}px` }).run();
            console.log('✅ Applied font size to selected text (alternative):', `${actualSize}px`);
            console.log('📊 Command result:', result);
          } catch (e2) {
            console.log('📊 Second approach failed:', e2);
            try {
              // Try inline style approach
              const result = editor.chain().focus().setMark('textStyle', { style: `font-size: ${actualSize}px` }).run();
              console.log('✅ Applied font size to selected text (inline):', `${actualSize}px`);
              console.log('📊 Command result:', result);
            } catch (e3) {
              console.log('📊 Third approach failed:', e3);
              // Try setting the mark directly on the selection
              const { state } = editor;
              const { selection } = state;
              const mark = state.schema.marks.textStyle.create({ fontSize: `${actualSize}px` });
              const tr = state.tr.addMark(selection.from, selection.to, mark);
              editor.view.dispatch(tr);
              console.log('✅ Applied font size directly to selection:', `${actualSize}px`);
              
              // Also try applying CSS directly to the selected text
              const editorElement = editor.view.dom as HTMLElement;
              if (editorElement) {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  const span = document.createElement('span');
                  span.style.fontSize = `${actualSize}px`;
                  range.surroundContents(span);
                  console.log('✅ Applied font size via CSS:', `${actualSize}px`);
                }
              }
            }
          }
        }
      } else {
        // If no selection, apply to current position (affects next typed character)
        console.log('📊 Applying to cursor position for next typed character');
        try {
          // Try the direct approach first
          const result = editor.chain().focus().setMark('textStyle', { fontSize: `${actualSize}px` }).run();
          console.log('✅ Applied font size to cursor position:', `${actualSize}px`);
          console.log('📊 Command result:', result);
        } catch (e1) {
          console.log('📊 First approach failed:', e1);
          try {
            // Try alternative approach
            const result = editor.chain().focus().setMark('textStyle', { fontSize: `${actualSize}px` }).run();
            console.log('✅ Applied font size to cursor position (alternative):', `${actualSize}px`);
            console.log('📊 Command result:', result);
          } catch (e2) {
            console.log('📊 Second approach failed:', e2);
            try {
              // Try inline style approach
              const result = editor.chain().focus().setMark('textStyle', { style: `font-size: ${actualSize}px` }).run();
              console.log('✅ Applied font size to cursor position (inline):', `${actualSize}px`);
              console.log('📊 Command result:', result);
            } catch (e3) {
              console.log('📊 Third approach failed:', e3);
              // Try setting the mark directly on the cursor position
              const { state } = editor;
              const { selection } = state;
              const mark = state.schema.marks.textStyle.create({ fontSize: `${actualSize}px` });
              const tr = state.tr.addMark(selection.from, selection.from, mark);
              editor.view.dispatch(tr);
              console.log('✅ Applied font size directly to cursor position:', `${actualSize}px`);
            }
          }
        }
      }
      
      console.log('✅ Applied font size via TipTap extension:', `${actualSize}px`);
      
      // STORE IN CLOUD FOR PERSISTENCE
      console.log('📊 Setting activeFontSize in store:', actualSize);
      setActiveFontSize(actualSize);
      // Silent background analytics save
      setTimeout(() => {
        saveAnalyticsToCloud().catch(() => {
          // Silently handle errors - don't interrupt user
        });
      }, 2000);
      
      // Also store in localStorage as backup
      localStorage.setItem('activeFontSize', actualSize.toString());
      console.log('📊 Also stored in localStorage as backup:', actualSize);
      
    } catch (error) {
      console.error('❌ Error applying font size:', error);
    }
    
    console.log('🔍 === APPLY FONT SIZE TO DOM END ===');
  };



  // Get current text color from editor selection if available
  let currentColor = '#183153';
      if (editor && editor.isActive('textStyle')) {
      const attrs = editor.getAttributes('textStyle');
      if (attrs.color) {
        currentColor = attrs.color;
      }
    }

  // Get current highlight color from editor selection if available
  let currentHighlight = '#ffffff';
  if (editor && editor.isActive('highlight')) {
    const attrs = editor.getAttributes('highlight');
    if (attrs.color) {
      currentHighlight = attrs.color;
    }
  }

  // Google Docs-style color palette
  const COLOR_PALETTE = [
    ['#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff'],
    ['#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff', '#e6b8af'],
    ['#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc', '#dd7e6b'],
    ['#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd', '#cc4125'],
    ['#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0', '#a61c00'],
    ['#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79', '#85200c'],
    ['#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47', '#5b0f00'],
  ];

  const increaseFontSize = () => {
    console.log('🔍 === INCREASE FONT SIZE START ===');
    console.log('📊 Current font size:', currentFontSize);
    console.log('📊 Editor available:', !!editor);
    
    if (!editor) {
      console.log('❌ Editor not available');
      return;
    }
    
    // Clear any pending font size changes
    if (fontSizeChangeTimeout) {
      clearTimeout(fontSizeChangeTimeout);
    }
    
    const newSize = currentFontSize + 1; // Increase by 1
    console.log('📊 New size after increase:', newSize);
    console.log('📊 Editor state before:', editor.state);
    console.log('📊 Editor selection before:', editor.state.selection);
    
    setCurrentFontSize(newSize);
    console.log('📊 Set current font size state to:', newSize);
    
    // Debounce the font size application
    fontSizeChangeTimeout = setTimeout(() => {
      applyFontSizeToDOM(newSize); // This will use proper size mapping
      
      // Store in cloud for persistence
      const actualSize = newSize >= 12 ? newSize + 3 : (newSize >= 8 ? 14 - (11 - newSize) * 0.5 : 12);
      setActiveFontSize(actualSize);
      // Removed word count analytics saving - only save on breaks

    }, 50);
    
    console.log('🔍 === INCREASE FONT SIZE END ===');
    
    // Focus the editor after a short delay
    setTimeout(() => {
      console.log('📊 Focusing editor after timeout');
      editor.commands.focus();
      console.log('📊 Editor state after focus:', editor.state);
    }, 100);
  };

  const decreaseFontSize = () => {
    console.log('🔍 === DECREASE FONT SIZE START ===');
    console.log('📊 Current font size:', currentFontSize);
    console.log('📊 Editor available:', !!editor);
    
    if (!editor) {
      console.log('❌ Editor not available');
      return;
    }
    
    // Clear any pending font size changes
    if (fontSizeChangeTimeout) {
      clearTimeout(fontSizeChangeTimeout);
    }
    
    const newSize = Math.max(8, currentFontSize - 1); // Decrease by 1, minimum 8
    console.log('📊 New size after decrease:', newSize);
    console.log('📊 Editor state before:', editor.state);
    console.log('📊 Editor selection before:', editor.state.selection);
    
    setCurrentFontSize(newSize);
    console.log('📊 Set current font size state to:', newSize);
    
    // Debounce the font size application
    fontSizeChangeTimeout = setTimeout(() => {
      applyFontSizeToDOM(newSize); // This will use proper size mapping
      
      // Store in cloud for persistence
      const actualSize = newSize >= 12 ? newSize + 3 : (newSize >= 8 ? 14 - (11 - newSize) * 0.5 : 12);
      setActiveFontSize(actualSize);
      // Removed word count analytics saving - only save on breaks

    }, 50);
    
    console.log('🔍 === DECREASE FONT SIZE END ===');
    
    // Focus the editor after a short delay
    setTimeout(() => {
      console.log('📊 Focusing editor after timeout');
      editor.commands.focus();
      console.log('📊 Editor state after focus:', editor.state);
    }, 100);
  };
  const handleBold = () => {
    if (editor) {
      editor.chain().focus().toggleBold().run();
    }
  }
  const handleItalic = () => {
    if (editor) {
      editor.chain().focus().toggleItalic().run();
    }
  }
  const handleUnderline = () => {
    if (editor) {
      editor.chain().focus().toggleUnderline().run();
    }
  }
  const handleTextColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    if (editor) {
      editor.chain().focus().setColor(color).run();
    }
  }
  const handleHighlight = () => {}
  const handleAlignClick = () => {
    if (!editor) {
      return
    }
    setAlignDropdownOpen(v => !v)
  }
  const handleSelectAlign = (align: string) => {
    if (editor) {
      const result = editor.chain().focus().setTextAlign(align).run();
      setAlignment(align);
    }
    setAlignDropdownOpen(false);
  }

  // Map lineSpacing to line-height only (no margin to prevent conflicts)
  const spacingToMargin = {
    '1.0': { lineHeight: '1.0' },      // Single
    '1.15': { lineHeight: '1.286' },   // 1.286 (18px for 14px font)
    '1.5': { lineHeight: '1.5' },     // 1.5
    '2.0': { lineHeight: '2.0' },      // Double
  };

  useEffect(() => {
    if (!editor) return;
    const spacing = spacingToMargin[lineSpacing] || { lineHeight: '1.286' };
    
    // Apply spacing only to selected text or from cursor position forward
    try {
      const editorElement = editor.view.dom as HTMLElement;
      if (editorElement) {
        const lineHeightValue = spacing.lineHeight;
        
        console.log('🔧 [TOOLBAR] Starting selective line spacing application:', {
          lineSpacing,
          lineHeightValue,
          editorElement: editorElement.tagName,
          editorElementClasses: editorElement.className
        });
        
        // Get current selection
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;
        
        console.log('🎯 [TOOLBAR] Selection analysis:', {
          from,
          to,
          hasSelection,
          selectionEmpty: editor.state.selection.empty,
          selectionContent: editor.state.selection.content().size,
          docSize: editor.state.doc.content.size
        });
        
        if (hasSelection) {
          // Apply to selected text only
          console.log('🎯 [TOOLBAR] Applying to selected text only:', { from, to });
          
          // Apply line-height to paragraphs that contain the selection
          const paragraphs = editorElement.querySelectorAll('p');
          console.log('🔍 [TOOLBAR] Found paragraphs for selection:', paragraphs.length);
          
          paragraphs.forEach((p, index) => {
            const pElement = p as HTMLElement;
            const pRange = editor.state.doc.resolve(editor.state.selection.from).start();
            const pEnd = editor.state.doc.resolve(editor.state.selection.to).end();
            
            // Check if this paragraph is within the selection
            const paragraphStart = editor.state.doc.resolve(pRange).start();
            const paragraphEnd = editor.state.doc.resolve(pEnd).end();
            
            console.log(`📄 [TOOLBAR] Analyzing paragraph ${index}:`, {
              textContent: pElement.textContent?.substring(0, 30) + '...',
              paragraphStart,
              paragraphEnd,
              selectionFrom: from,
              selectionTo: to,
              isInSelection: from <= paragraphEnd && to >= paragraphStart
            });
            
            if (from <= paragraphEnd && to >= paragraphStart) {
              console.log(`✅ [TOOLBAR] Applying to selected paragraph ${index}:`, {
                textContent: pElement.textContent?.substring(0, 30) + '...',
                beforeLineHeight: pElement.style.lineHeight,
                afterLineHeight: lineHeightValue
              });
              
              // Apply line-height with maximum specificity
              pElement.style.setProperty('line-height', lineHeightValue, 'important');
              pElement.style.setProperty('margin-bottom', '0', 'important');
              pElement.style.setProperty('margin-top', '0', 'important');
              pElement.style.setProperty('display', 'block', 'important');
              pElement.style.setProperty('min-height', '1em', 'important');
              
              // Also set a custom attribute to mark this paragraph
              pElement.setAttribute('data-line-height', lineHeightValue);
              
              // Set the CSS custom property for the attribute
              pElement.style.setProperty('--data-line-height', lineHeightValue, 'important');
              
              // Force a reflow to ensure the style is applied
              pElement.offsetHeight;
            } else {
              console.log(`❌ [TOOLBAR] Skipping paragraph ${index} - not in selection`);
            }
          });
        } else {
          // Apply from cursor position forward (new text)
          console.log('🎯 [TOOLBAR] Applying from cursor position forward');
          
          // Get the current paragraph and apply to it and all following paragraphs
          const currentPos = editor.state.selection.from;
          const paragraphs = editorElement.querySelectorAll('p');
          
          console.log('🔍 [TOOLBAR] Cursor position analysis:', {
            currentPos,
            totalParagraphs: paragraphs.length,
            docContent: editor.state.doc.textContent.substring(0, 100) + '...'
          });
          
          // Find which paragraph contains the cursor
          console.log('🔍 [TOOLBAR] Finding cursor paragraph:');
          let cursorParagraphIndex = -1;
          
          // Calculate actual paragraph positions in the document
          let docPosition = 0;
          for (let i = 0; i < paragraphs.length; i++) {
            const paragraphText = (paragraphs[i] as HTMLElement).textContent || '';
            const paragraphLength = paragraphText.length;
            const paragraphStart = docPosition;
            const paragraphEnd = docPosition + paragraphLength;
            
            console.log(`📄 [TOOLBAR] Paragraph ${i} analysis:`, {
              textContent: paragraphText.substring(0, 30) + '...',
              paragraphLength,
              paragraphStart,
              paragraphEnd,
              currentPos,
              containsCursor: currentPos >= paragraphStart && currentPos <= paragraphEnd,
              docPosition
            });
            
            // Check if cursor is within this paragraph's range
            if (currentPos >= paragraphStart && currentPos <= paragraphEnd) {
              cursorParagraphIndex = i;
              console.log(`✅ [TOOLBAR] Found cursor in paragraph ${i}!`);
              break;
            }
            docPosition += paragraphLength + 1; // +1 for the paragraph break
          }
          
          // If cursor is at the very end of the document, it's in the last paragraph
          if (cursorParagraphIndex === -1 && currentPos >= docPosition) {
            cursorParagraphIndex = paragraphs.length - 1;
            console.log(`✅ [TOOLBAR] Cursor at end of document, using last paragraph ${cursorParagraphIndex}!`);
          }
          
          console.log('🔍 [TOOLBAR] Cursor analysis result:', {
            cursorParagraphIndex,
            totalParagraphs: paragraphs.length,
            currentPos,
            docPosition
          });
          
          // Apply spacing to NEW text only (from cursor paragraph forward)
          console.log('🔍 [TOOLBAR] Applying spacing to NEW text only:');
          paragraphs.forEach((p, index) => {
            const pElement = p as HTMLElement;
            
            // Only apply to the VERY NEXT paragraph after the cursor paragraph
            // OR to the current paragraph if cursor is at the end of the document
            const isAtEndOfDocument = cursorParagraphIndex === paragraphs.length - 1;
            const shouldApply = index === cursorParagraphIndex + 1 || (isAtEndOfDocument && index === cursorParagraphIndex);
            
            console.log(`📄 [TOOLBAR] Paragraph ${index} spacing decision:`, {
              textContent: pElement.textContent?.substring(0, 30) + '...',
              index,
              cursorParagraphIndex,
              shouldApply,
              reason: shouldApply ? (isAtEndOfDocument && index === cursorParagraphIndex ? 'CURRENT paragraph (at end)' : 'NEXT paragraph only') : 'NOT next paragraph',
              beforeLineHeight: pElement.style.lineHeight,
              afterLineHeight: shouldApply ? lineHeightValue : 'unchanged'
            });
            
            // Apply to ONLY the next paragraph
            if (shouldApply) {
              console.log(`✅ [TOOLBAR] APPLYING to paragraph ${index} (NEXT line only):`, {
                textContent: pElement.textContent?.substring(0, 30) + '...',
                currentPos,
                beforeLineHeight: pElement.style.lineHeight,
                afterLineHeight: lineHeightValue
              });
              
              // Apply line-height with maximum specificity
              pElement.style.setProperty('line-height', lineHeightValue, 'important');
              pElement.style.setProperty('margin-bottom', '0', 'important');
              pElement.style.setProperty('margin-top', '0', 'important');
              pElement.style.setProperty('display', 'block', 'important');
              pElement.style.setProperty('min-height', '1em', 'important');
              
              // Also set a custom attribute to mark this paragraph
              pElement.setAttribute('data-line-height', lineHeightValue);
              
              // Set the CSS custom property for the attribute
              pElement.style.setProperty('--data-line-height', lineHeightValue, 'important');
              
              // Force a reflow to ensure the style is applied
              pElement.offsetHeight;
            } else {
              console.log(`❌ [TOOLBAR] SKIPPING paragraph ${index} - not next line`);
              
              // Ensure skipped paragraphs don't have the line-height
              pElement.style.removeProperty('line-height');
              pElement.removeAttribute('data-line-height');
            }
          });
        }
        
        // Also set the CSS custom property for future text
        editorElement.style.setProperty('--line-height', lineHeightValue, 'important');
        console.log('✅ [TOOLBAR] Set --line-height for future text:', lineHeightValue);
        
        // Final verification
        setTimeout(() => {
          console.log('🔍 [TOOLBAR] Final verification - checking all paragraphs:');
          const allParagraphs = editorElement.querySelectorAll('p');
          allParagraphs.forEach((p, index) => {
            const pElement = p as HTMLElement;
            console.log(`📊 [TOOLBAR] Paragraph ${index} final state:`, {
              textContent: pElement.textContent?.substring(0, 30) + '...',
              lineHeight: pElement.style.lineHeight,
              computedLineHeight: getComputedStyle(pElement).lineHeight
            });
          });
        }, 100);
        
      } else {
        console.log('❌ [TOOLBAR] Editor element NOT FOUND!');
      }
    } catch (error) {
      console.log('⚠️ Error applying selective line spacing:', error);
    }
  }, [lineSpacing, editor, spacingToMargin]);

  // Listen for new paragraphs and apply line-height immediately
  useEffect(() => {
    if (!editor) return;
    
            const applyLineHeightToAllContent = () => {
          const spacing = spacingToMargin[lineSpacing] || { lineHeight: '1.286' };
          const lineHeightValue = spacing.lineHeight;

          const editorElement = editor.view.dom as HTMLElement;
          if (editorElement) {
            console.log('🔄 [TOOLBAR-UPDATE] Starting selective update application:', {
              lineSpacing,
              lineHeightValue,
              editorElement: editorElement.tagName
            });

            // Get current selection
            const { from, to } = editor.state.selection;
            const hasSelection = from !== to;
            
            console.log('🎯 [TOOLBAR-UPDATE] Selection analysis:', {
              from,
              to,
              hasSelection,
              selectionEmpty: editor.state.selection.empty,
              selectionContent: editor.state.selection.content().size,
              docSize: editor.state.doc.content.size
            });
            
            if (hasSelection) {
              // Apply to selected text only
              console.log('🎯 [TOOLBAR-UPDATE] Applying to selected text only:', { from, to });
              
              const paragraphs = editorElement.querySelectorAll('p');
              console.log('🔍 [TOOLBAR-UPDATE] Found paragraphs for selection:', paragraphs.length);
              
              paragraphs.forEach((p, index) => {
                const pElement = p as HTMLElement;
                const pRange = editor.state.doc.resolve(editor.state.selection.from).start();
                const pEnd = editor.state.doc.resolve(editor.state.selection.to).end();
                
                // Check if this paragraph is within the selection
                const paragraphStart = editor.state.doc.resolve(pRange).start();
                const paragraphEnd = editor.state.doc.resolve(pEnd).end();
                
                console.log(`📄 [TOOLBAR-UPDATE] Analyzing paragraph ${index}:`, {
                  textContent: pElement.textContent?.substring(0, 30) + '...',
                  paragraphStart,
                  paragraphEnd,
                  selectionFrom: from,
                  selectionTo: to,
                  isInSelection: from <= paragraphEnd && to >= paragraphStart
                });
                
                if (from <= paragraphEnd && to >= paragraphStart) {
                  console.log(`✅ [TOOLBAR-UPDATE] Applying to selected paragraph ${index}:`, {
                    textContent: pElement.textContent?.substring(0, 30) + '...',
                    beforeLineHeight: pElement.style.lineHeight,
                    afterLineHeight: lineHeightValue
                  });
                  
                  // Apply line-height with maximum specificity
                  pElement.style.setProperty('line-height', lineHeightValue, 'important');
                  pElement.style.setProperty('margin-bottom', '0', 'important');
                  pElement.style.setProperty('margin-top', '0', 'important');
                  pElement.style.setProperty('display', 'block', 'important');
                  pElement.style.setProperty('min-height', '1em', 'important');
                  
                  // Also set a custom attribute to mark this paragraph
                  pElement.setAttribute('data-line-height', lineHeightValue);
                  
                  // Set the CSS custom property for the attribute
                  pElement.style.setProperty('--data-line-height', lineHeightValue, 'important');
                  
                  // Force a reflow to ensure the style is applied
                  pElement.offsetHeight;
                } else {
                  console.log(`❌ [TOOLBAR-UPDATE] Skipping paragraph ${index} - not in selection`);
                }
              });
            } else {
              // Apply from cursor position forward (new text)
              console.log('🎯 [TOOLBAR] Applying from cursor position forward');
              
              // Get the current paragraph and apply to it and all following paragraphs
              const currentPos = editor.state.selection.from;
              const paragraphs = editorElement.querySelectorAll('p');
              
              console.log('🔍 [TOOLBAR] Cursor position analysis:', {
                currentPos,
                totalParagraphs: paragraphs.length,
                docContent: editor.state.doc.textContent.substring(0, 100) + '...'
              });
              
              // Find which paragraph contains the cursor
              console.log('🔍 [TOOLBAR] Finding cursor paragraph:');
              let cursorParagraphIndex = -1;
              
              // Calculate actual paragraph positions in the document
              let docPosition = 0;
              for (let i = 0; i < paragraphs.length; i++) {
                const paragraphText = (paragraphs[i] as HTMLElement).textContent || '';
                const paragraphLength = paragraphText.length;
                const paragraphStart = docPosition;
                const paragraphEnd = docPosition + paragraphLength;
                
                console.log(`📄 [TOOLBAR] Paragraph ${i} analysis:`, {
                  textContent: paragraphText.substring(0, 30) + '...',
                  paragraphLength,
                  paragraphStart,
                  paragraphEnd,
                  currentPos,
                  containsCursor: currentPos >= paragraphStart && currentPos <= paragraphEnd,
                  docPosition
                });
                
                // Check if cursor is within this paragraph's range
                if (currentPos >= paragraphStart && currentPos <= paragraphEnd) {
                  cursorParagraphIndex = i;
                  console.log(`✅ [TOOLBAR] Found cursor in paragraph ${i}!`);
                  break;
                }
                docPosition += paragraphLength + 1; // +1 for the paragraph break
              }
              
              // If cursor is at the very end of the document, it's in the last paragraph
              if (cursorParagraphIndex === -1 && currentPos >= docPosition) {
                cursorParagraphIndex = paragraphs.length - 1;
                console.log(`✅ [TOOLBAR] Cursor at end of document, using last paragraph ${cursorParagraphIndex}!`);
              }
              
              console.log('🔍 [TOOLBAR] Cursor analysis result:', {
                cursorParagraphIndex,
                totalParagraphs: paragraphs.length,
                currentPos,
                docPosition
              });
              
              // Apply spacing to NEW text only (from cursor paragraph forward)
              console.log('🔍 [TOOLBAR] Applying spacing to NEW text only:');
              paragraphs.forEach((p, index) => {
                const pElement = p as HTMLElement;
                
                // Only apply to the VERY NEXT paragraph after the cursor paragraph
                // OR to the current paragraph if cursor is at the end of the document
                const isAtEndOfDocument = cursorParagraphIndex === paragraphs.length - 1;
                const shouldApply = index === cursorParagraphIndex + 1 || (isAtEndOfDocument && index === cursorParagraphIndex);
                
                console.log(`📄 [TOOLBAR] Paragraph ${index} spacing decision:`, {
                  textContent: pElement.textContent?.substring(0, 30) + '...',
                  index,
                  cursorParagraphIndex,
                  shouldApply,
                  reason: shouldApply ? (isAtEndOfDocument && index === cursorParagraphIndex ? 'CURRENT paragraph (at end)' : 'NEXT paragraph only') : 'NOT next paragraph',
                  beforeLineHeight: pElement.style.lineHeight,
                  afterLineHeight: shouldApply ? lineHeightValue : 'unchanged'
                });
                
                // Apply to ONLY the next paragraph
                if (shouldApply) {
                  console.log(`✅ [TOOLBAR] APPLYING to paragraph ${index} (NEXT line only):`, {
                    textContent: pElement.textContent?.substring(0, 30) + '...',
                    currentPos,
                    beforeLineHeight: pElement.style.lineHeight,
                    afterLineHeight: lineHeightValue
                  });
                  
                  // Apply line-height with maximum specificity
                  pElement.style.setProperty('line-height', lineHeightValue, 'important');
                  pElement.style.setProperty('margin-bottom', '0', 'important');
                  pElement.style.setProperty('margin-top', '0', 'important');
                  pElement.style.setProperty('display', 'block', 'important');
                  pElement.style.setProperty('min-height', '1em', 'important');
                  
                  // Also set a custom attribute to mark this paragraph
                  pElement.setAttribute('data-line-height', lineHeightValue);
                  
                  // Set the CSS custom property for the attribute
                  pElement.style.setProperty('--data-line-height', lineHeightValue, 'important');
                  
                  // Force a reflow to ensure the style is applied
                  pElement.offsetHeight;
                } else {
                  console.log(`❌ [TOOLBAR] SKIPPING paragraph ${index} - not next line`);
                  
                  // Ensure skipped paragraphs don't have the line-height
                  pElement.style.removeProperty('line-height');
                  pElement.removeAttribute('data-line-height');
                }
              });
            }
            
            // Also set the CSS custom property for future text
            editorElement.style.setProperty('--line-height', lineHeightValue, 'important');
            console.log('✅ [TOOLBAR-UPDATE] Set --line-height for future text:', lineHeightValue);
            
            // Final verification
            setTimeout(() => {
              console.log('🔍 [TOOLBAR-UPDATE] Final verification - checking all paragraphs:');
              const allParagraphs = editorElement.querySelectorAll('p');
              allParagraphs.forEach((p, index) => {
                const pElement = p as HTMLElement;
                console.log(`📊 [TOOLBAR-UPDATE] Paragraph ${index} final state:`, {
                  textContent: pElement.textContent?.substring(0, 30) + '...',
                  lineHeight: pElement.style.lineHeight,
                  computedLineHeight: getComputedStyle(pElement).lineHeight
                });
              });
            }, 100);
            
          } else {
            console.log('❌ [TOOLBAR-UPDATE] Editor element NOT FOUND!');
          }
        };
    
    // Apply immediately
    applyLineHeightToAllContent();
    
    // Listen to editor updates to catch any changes
    editor.on('update', applyLineHeightToAllContent);
    
    return () => {
      editor.off('update', applyLineHeightToAllContent);
    };
  }, [lineSpacing, editor, spacingToMargin]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        alignBtnRef.current &&
        !alignBtnRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setAlignDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [])

  useEffect(() => {
    if (!spacingDropdownOpen) return;
    function handleClickOutside(event) {
      if (
        spacingBtnRef.current &&
        !spacingBtnRef.current.contains(event.target) &&
        spacingDropdownRef.current &&
        !spacingDropdownRef.current.contains(event.target)
      ) {
        setSpacingDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [spacingDropdownOpen]);

  // Helper to check if a mark is active or stored
  const isMarkActive = (mark) => {
    if (!editor) return false;
    if (editor.isActive(mark)) return true;
    const stored = editor.state.storedMarks;
    return stored ? stored.some(m => m.type.name === mark) : false;
  }

  // Helper to check current text alignment
  const getCurrentAlignment = () => {
    if (!editor) return 'left';
    
    // Check for active text alignment
    if (editor.isActive({ textAlign: 'left' })) return 'left';
    if (editor.isActive({ textAlign: 'center' })) return 'center';
    if (editor.isActive({ textAlign: 'right' })) return 'right';
    if (editor.isActive({ textAlign: 'justify' })) return 'justify';
    
    // Check the current selection for alignment
    const { selection } = editor.state;
    if (selection) {
      const { from, to } = selection;
      const node = editor.state.doc.nodeAt(from);
      if (node && node.attrs.textAlign) {
        return node.attrs.textAlign;
      }
    }
    
    return 'left';
  }

  // Update alignment state when editor changes
  useEffect(() => {
    if (editor) {
      const currentAlign = getCurrentAlignment();
      setAlignment(currentAlign);
    }
  }, [editor]);

  // Listen to editor updates to sync alignment state
  useEffect(() => {
    if (!editor) return;
    
    const updateAlignment = () => {
      const currentAlign = getCurrentAlignment();
      setAlignment(currentAlign);
    };

    // Update immediately
    updateAlignment();
    
    // Listen to editor updates
    editor.on('update', updateAlignment);
    editor.on('selectionUpdate', updateAlignment);
    
    return () => {
      editor.off('update', updateAlignment);
      editor.off('selectionUpdate', updateAlignment);
    };
  }, [editor]);

  // Helper to render dropdown in a portal
  const alignDropdown = alignDropdownOpen && typeof window !== 'undefined' && createPortal(
    <div
      ref={dropdownRef}
      className="fixed bg-white rounded-md shadow-lg border border-gray-200 z-[999999] py-1 px-1 text-sm select-none"
      style={{
        left: dropdownPos.left,
        top: dropdownPos.top,
        minWidth: 120,
        pointerEvents: 'auto',
        zIndex: 999999,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex items-center gap-1">
        {alignmentOptions.map(option => (
          <button
            key={option.value}
            onClick={() => handleSelectAlign(option.value)}
            className={`
              w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 ${alignment === option.value ? 'bg-blue-50' : ''}
            `}
          >
            {option.value === 'left' && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="2" width="14" height="1" rx="0.5" fill={alignment === 'left' ? '#1d4ed8' : '#374151'} />
                <rect x="1" y="5" width="10" height="1" rx="0.5" fill={alignment === 'left' ? '#1d4ed8' : '#374151'} />
                <rect x="1" y="8" width="14" height="1" rx="0.5" fill={alignment === 'left' ? '#1d4ed8' : '#374151'} />
                <rect x="1" y="11" width="12" height="1" rx="0.5" fill={alignment === 'left' ? '#1d4ed8' : '#374151'} />
              </svg>
            )}
            {option.value === 'center' && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="2" width="14" height="1" rx="0.5" fill={alignment === 'center' ? '#1d4ed8' : '#374151'} />
                <rect x="3" y="5" width="10" height="1" rx="0.5" fill={alignment === 'center' ? '#1d4ed8' : '#374151'} />
                <rect x="1" y="8" width="14" height="1" rx="0.5" fill={alignment === 'center' ? '#1d4ed8' : '#374151'} />
                <rect x="2" y="11" width="12" height="1" rx="0.5" fill={alignment === 'center' ? '#1d4ed8' : '#374151'} />
              </svg>
            )}
            {option.value === 'right' && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="2" width="14" height="1" rx="0.5" fill={alignment === 'right' ? '#1d4ed8' : '#374151'} />
                <rect x="5" y="5" width="10" height="1" rx="0.5" fill={alignment === 'right' ? '#1d4ed8' : '#374151'} />
                <rect x="1" y="8" width="14" height="1" rx="0.5" fill={alignment === 'right' ? '#1d4ed8' : '#374151'} />
                <rect x="3" y="11" width="12" height="1" rx="0.5" fill={alignment === 'right' ? '#1d4ed8' : '#374151'} />
              </svg>
            )}
            {option.value === 'justify' && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="2" width="14" height="1" rx="0.5" fill={alignment === 'justify' ? '#1d4ed8' : '#374151'} />
                <rect x="1" y="5" width="14" height="1" rx="0.5" fill={alignment === 'justify' ? '#1d4ed8' : '#374151'} />
                <rect x="1" y="8" width="14" height="1" rx="0.5" fill={alignment === 'justify' ? '#1d4ed8' : '#374151'} />
                <rect x="1" y="11" width="14" height="1" rx="0.5" fill={alignment === 'justify' ? '#1d4ed8' : '#374151'} />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );

  useEffect(() => {
    if (alignDropdownOpen && alignBtnRef.current) {
      const rect = alignBtnRef.current.getBoundingClientRect();
      setDropdownPos({
        left: rect.left + rect.width / 2,
        top: rect.bottom + 4
      });
    }
  }, [alignDropdownOpen]);

  useLayoutEffect(() => {
    function updateDropdownPos() {
      if (alignDropdownOpen && alignBtnRef.current) {
        const rect = alignBtnRef.current.getBoundingClientRect();
        setDropdownPos({
          left: rect.left + rect.width / 2,
          top: rect.bottom + 4 // 4px gap below the button
        });
      }
    }
    if (alignDropdownOpen) {
      updateDropdownPos();
      window.addEventListener('resize', updateDropdownPos);
      window.addEventListener('scroll', updateDropdownPos, true);
    }
    return () => {
      window.removeEventListener('resize', updateDropdownPos);
      window.removeEventListener('scroll', updateDropdownPos, true);
    }
  }, [alignDropdownOpen])

  useLayoutEffect(() => {
    function updateColorDropdownPos() {
      if (colorDropdownOpen && colorBtnRef.current) {
        const rect = colorBtnRef.current.getBoundingClientRect();
        setColorDropdownPos({
          left: rect.left + rect.width / 2,
          top: rect.bottom + 4
        });
      }
    }
    if (colorDropdownOpen) {
      updateColorDropdownPos();
      window.addEventListener('resize', updateColorDropdownPos);
      window.addEventListener('scroll', updateColorDropdownPos, true);
    }
    return () => {
      window.removeEventListener('resize', updateColorDropdownPos);
      window.removeEventListener('scroll', updateColorDropdownPos, true);
    }
  }, [colorDropdownOpen])

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        colorBtnRef.current &&
        !colorBtnRef.current.contains(event.target) &&
        colorDropdownRef.current &&
        !colorDropdownRef.current.contains(event.target)
      ) {
        setColorDropdownOpen(false);
      }
    }
    if (colorDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [colorDropdownOpen])

  useLayoutEffect(() => {
    function updateHighlightDropdownPos() {
      if (highlightDropdownOpen && highlightBtnRef.current) {
        const rect = highlightBtnRef.current.getBoundingClientRect();
        setHighlightDropdownPos({
          left: rect.left + rect.width / 2,
          top: rect.bottom + 4
        });
      }
    }
    if (highlightDropdownOpen) {
      updateHighlightDropdownPos();
      window.addEventListener('resize', updateHighlightDropdownPos);
      window.addEventListener('scroll', updateHighlightDropdownPos, true);
    }
    return () => {
      window.removeEventListener('resize', updateHighlightDropdownPos);
      window.removeEventListener('scroll', updateHighlightDropdownPos, true);
    }
  }, [highlightDropdownOpen])

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        highlightBtnRef.current &&
        !highlightBtnRef.current.contains(event.target) &&
        highlightDropdownRef.current &&
        !highlightDropdownRef.current.contains(event.target)
      ) {
        setHighlightDropdownOpen(false);
      }
    }
    if (highlightDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [highlightDropdownOpen])

  // Font size dropdown click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        fontSizeDropdownRef.current &&
        !fontSizeDropdownRef.current.contains(event.target)
      ) {
        console.log('📊 Font size dropdown closed by clicking outside');
        setFontSizeDropdownOpen(false);
      }
    }
    if (fontSizeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [fontSizeDropdownOpen])

  useEffect(() => {
    if (!showDailyGoalModal) return;
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowDailyGoalModal(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDailyGoalModal]);

  // Calculate clamped values
  const clampedDailyCount = dailyGoal > 0 ? Math.min(dailyCount, dailyGoal) : 0;
  const clampedPercent = dailyGoal > 0 ? Math.min(100, Math.round((dailyCount / dailyGoal) * 100)) : 0;
  
  useEffect(() => {
    if (clampedPercent === 100 && !celebration) {
      setCelebration(true);
      // Only save celebration state, not word count
    }
    if (clampedPercent < 100 && celebration) {
      setCelebration(false);
      // Only save celebration state, not word count
    }
  }, [clampedPercent, celebration, setCelebration]);
  
  const highlight = dailyGoal > 0 && dailyCount >= dailyGoal;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (celebration) {
      setFlash(true);
      interval = setInterval(() => setFlash(f => !f), 800);
    } else {
      setFlash(false);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [celebration]);

  // Helper to detect current font size from editor
  const detectCurrentFontSize = () => {
    if (!editor) return 11;
    
    // Check if textStyle is active
    if (editor.isActive('textStyle')) {
      const attrs = editor.getAttributes('textStyle');
      
      if (attrs.style) {
        const fontSizeMatch = attrs.style.match(/font-size:\s*(\d+)px/);
        if (fontSizeMatch) {
          const detectedSize = parseInt(fontSizeMatch[1], 10);
          return detectedSize;
        }
      }
    }
    
    // Check selection for inline styles
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      
      if (container.nodeType === Node.TEXT_NODE) {
        const parent = container.parentElement;
        if (parent) {
          const computedStyle = window.getComputedStyle(parent);
          const fontSize = computedStyle.fontSize;
          
          const match = fontSize.match(/(\d+)px/);
          if (match) {
            const detectedSize = parseInt(match[1], 10);
            return detectedSize;
          }
        }
      }
    }
    
    return 11;
  };

  // Listen to editor updates to sync font size state
  useEffect(() => {
    if (!editor) return;
    
    // DISABLED: Font size detection system that was overriding our changes
    // const updateFontSizeFromCursor = () => {
    //   console.log('=== UPDATE FONT SIZE FROM CURSOR ===');
    //   // Only update if there's a significant change to prevent infinite loops
    //   const detectedSize = detectCurrentFontSize();
    //   console.log('Detected font size:', detectedSize);
    //   console.log('Current font size state:', currentFontSize);
    //   
    //   if (detectedSize !== currentFontSize && detectedSize > 0) {
    //     console.log('Updating font size state to:', detectedSize);
    //     setCurrentFontSize(detectedSize);
    //   } else {
    //     console.log('No font size update needed');
    //   }
    //   console.log('=== END UPDATE FONT SIZE FROM CURSOR ===');
    // };

    // DISABLED: Listen to editor updates with debouncing
    // let timeoutId: NodeJS.Timeout;
    // const debouncedUpdate = () => {
    //   clearTimeout(timeoutId);
    //   timeoutId = setTimeout(updateFontSizeFromCursor, 100);
    // };
    // 
    // editor.on('update', debouncedUpdate);
    // editor.on('selectionUpdate', debouncedUpdate);
    // 
    // return () => {
    //   editor.off('update', debouncedUpdate);
    //   editor.off('selectionUpdate', debouncedUpdate);
    //   clearTimeout(timeoutId);
    // };
    
    console.log('📊 Font size detection system DISABLED');
  }, [editor]); // Remove currentFontSize from dependencies to prevent infinite loop



  // Remove the useEffect that was applying font size to editor element
  // This was causing existing text to change when it shouldn't

  // Load line spacing from localStorage on mount
  useEffect(() => {
    const savedLineSpacing = localStorage.getItem('lineSpacing');
    if (savedLineSpacing) {
      setLineSpacing(savedLineSpacing);
    }
  }, []);

  // Save line spacing to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('lineSpacing', lineSpacing);
  }, [lineSpacing]);

  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-0 z-10 mt-2">
      <div className={`rounded-3xl border border-gray-100 bg-white flex items-center${flash ? ' flash-bg' : ''}`} style={{ minHeight: '40px' }}>
        {/* Word Tracker */}
        <div className="flex flex-col items-start justify-center px-4 py-0.5 mr-2 min-w-[180px]">
          {/* Total Word Goal */}
          <div className="flex items-center gap-2 text-xs font-medium mt-1">
                            <span className="text-gray-900">Chapter words:</span>
            <span className="font-semibold text-gray-900">{totalWordCount}</span>
          </div>
          {/* (Spacer for removed progress bar below total words) */}
          <div className="w-full h-0.5 bg-transparent rounded mt-0 mb-0"></div>
          {/* Daily Word Goal - all on one line */}
          <div
            className={`flex items-center gap-2 text-xs font-medium w-full whitespace-nowrap relative select-none transition hover:bg-gray-100 hover:cursor-pointer rounded py-0.5 mb-0 ${dailyGoal > 0 ? 'text-gray-900' : 'text-gray-400'}${flash ? ' flash-bg' : ''}`}
            onClick={() => setShowDailyGoalModal(true)}
            style={{ position: 'relative' }}
          >
            <span>Daily words:</span>
            <span className={dailyGoal > 0 ? 'font-semibold' : ''}>{dailyGoal > 0 ? clampedDailyCount : 0}</span>
            <span>/</span>
            <span className={dailyGoal > 0 ? 'font-semibold' : ''}>{dailyGoal > 0 ? dailyGoal : 0}</span>
            <span className={`ml-1 ${dailyGoal > 0 ? 'font-semibold' : 'text-gray-300'}`}>({dailyGoal > 0 ? clampedPercent : 0}%)</span>
          </div>
          {showDailyGoalModal && (
  <div ref={popupRef} className="absolute left-0 top-full mt-4 bg-white border border-gray-300 rounded shadow-lg p-2 z-50 min-w-[120px] w-max" style={{opacity: 1}}>
    <div className="text-sm font-semibold text-gray-900 mb-1 text-center">Set Goal</div>
    <div className="flex items-center justify-center gap-1 mb-2">
      <div className="mb-2 relative w-20">
        <input
          type="number"
          className="w-full px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-xs"
          value={dailyGoalInput}
          min={0}
          placeholder="Enter daily word goal"
          onChange={e => setDailyGoalInput(parseInt(e.target.value) || 0)}
          disabled={dailyGoal > 0}
        />
      </div>
    </div>
    <div className="flex justify-center">
      {dailyGoal > 0 ? (
        <button
          className="mt-1 px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-semibold"
          onClick={async () => {
            setDailyGoal(0);
            setDailyGoalInput(0);
            setCelebration(false);
            setShowDailyGoalModal(false);
            // Save the stopped state to cloud
            await saveAnalyticsToCloud();
          }}
        >
          Stop
        </button>
      ) : (
        <button
          className="mt-1 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs font-semibold"
          onClick={async () => {
            setDailyGoal(dailyGoalInput);
            setDailyStartCount(wordCount);
            setPrevWordCount(wordCount);
            resetDailyCount();
            setShowDailyGoalModal(false);
            // Save the new goal to cloud
            await saveAnalyticsToCloud();
          }}
        >
          Save
        </button>
      )}
    </div>
  </div>
)}
          {/* End Word Tracker */}
          <div className="w-full h-1 bg-gray-200 rounded mt-0.5">
            <div
              className="h-1 bg-green-400 rounded"
              style={{
                width: `${clampedPercent}%`,
                transition: 'width 0.3s'
              }}
            />
          </div>
        </div>
        {/* End Word Tracker */}
        <div className="flex items-center gap-2 px-3 py-0 font-sans max-w-fit">
          {/* Grid/Preview Icon */}
          <button 
            title="View all pages" 
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100" 
            onClick={onViewAllPages}
          >
            <ViewColumnsIcon className="h-5 w-5" />
          </button>
          {/* Export Icon */}
          <button title="Export" className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100">
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>
          {/* Undo */}
          <button onClick={handleUndo} title="Undo" className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-40" disabled={!canUndo}>
            <ArrowUturnLeftIcon className="h-5 w-5" />
        </button>
          {/* Redo */}
          <button onClick={handleRedo} title="Redo" className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-40" disabled={!canRedo}>
            <ArrowUturnRightIcon className="h-5 w-5" />
        </button>
          {/* Font family dropdown (replaces static Arial label) */}
          <select
            value={fontFamily}
            onChange={e => {
              setFontFamily(e.target.value);
              if (editor) {
                // Apply font family using CSS styling with !important to override existing styles
                const editorElement = editor.view.dom as HTMLElement;
                if (editorElement) {
                  editorElement.style.setProperty('font-family', e.target.value, 'important');
                }
              }
            }}
            className="h-8 px-2 rounded border border-gray-300 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 mx-1"
            style={{ minWidth: 120 }}
            title="Font family"
          >
            {fontOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {/* Font size controls */}
          <div className="flex items-center gap-0.5">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                decreaseFontSize();
              }} 
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded" 
              title="Decrease font size"
              type="button"
            >
              <MinusIcon className="h-5 w-5" />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('📊 Font size button clicked, toggling dropdown');
                  setFontSizeDropdownOpen(!fontSizeDropdownOpen);
                }}
                className={`w-8 h-8 flex items-center justify-center text-sm font-semibold border border-gray-300 rounded text-center hover:bg-gray-50 focus:outline-none focus:ring-0 cursor-pointer ${
                  fontSizeDropdownOpen ? 'bg-gray-100' : 'bg-white'
                }`}
                style={{ minWidth: 32 }}
                title="Font size"
              >
                {fontSizeInput}
              </button>
              {/* Font size dropdown */}
              {fontSizeDropdownOpen && (
                <div
                  ref={fontSizeDropdownRef}
                  className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-[999999] py-1 min-w-[60px]"
                >
                  {FONT_SIZES_PX.map((size) => (
                    <button
                      key={size}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔍 === DROPDOWN BUTTON CLICKED ===');
                        console.log('📊 Size clicked:', size);
                        handleFontSizeDropdownClick(size);
                      }}
                      className={`
                        w-full text-left px-3 py-1 text-sm hover:bg-gray-100 ${currentFontSize === size ? 'bg-blue-100 text-blue-700 font-medium' : ''}
                      `}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                increaseFontSize();
              }} 
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded" 
              title="Increase font size"
              type="button"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
          {/* Bold */}
          <button onClick={handleBold} title="Bold" className={cn("w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 font-bold text-base", isMarkActive('bold') ? 'text-blue-700 bg-blue-50' : '')}>B</button>
          {/* Italic */}
          <button onClick={handleItalic} title="Italic" className={cn("w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 italic text-base", isMarkActive('italic') ? 'text-blue-700 bg-blue-50' : '')}>/</button>
          {/* Underline */}
          <button onClick={handleUnderline} title="Underline" className={cn("w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 underline text-base", isMarkActive('underline') ? 'text-blue-700 bg-blue-50' : '')}>U</button>
          {/* Text color palette button */}
          <button
            ref={colorBtnRef}
            title="Text color"
            className="w-8 h-8 flex flex-col items-center justify-center hover:bg-gray-100 rounded relative"
            onClick={() => setColorDropdownOpen(v => !v)}
            style={{ position: 'relative' }}
          >
            <span className="font-bold text-base leading-none" style={{ color: '#183153' }}>A</span>
            <span className="block w-4 h-0.5 rounded-full mt-0.5" style={{ background: currentColor }}></span>
          </button>
          {/* Color palette dropdown */}
          {colorDropdownOpen && typeof window !== 'undefined' && createPortal(
            <div
              ref={colorDropdownRef}
              className="fixed bg-white rounded-md shadow-lg border border-gray-200 z-[999999] p-2"
              style={{
                left: colorDropdownPos.left,
                top: colorDropdownPos.top,
                transform: 'translateX(-50%)',
                minWidth: 180
              }}
            >
              <div className="flex flex-col gap-1">
                {COLOR_PALETTE.map((row, i) => (
                  <div key={i} className="flex flex-row gap-1">
                    {row.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          if (editor) editor.chain().focus().setColor(color).run();
                          setColorDropdownOpen(false);
                        }}
                        className="w-6 h-6 rounded-full border border-gray-200 hover:border-black focus:outline-none"
                        style={{ background: color }}
                        title={color}
                        aria-label={color}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>,
            document.body
          )}
          {/* Highlight color palette button */}
          <button
            ref={highlightBtnRef}
            title="Highlight color"
            className="w-8 h-8 flex flex-col items-center justify-center hover:bg-gray-100 rounded relative ml-1"
            onClick={() => setHighlightDropdownOpen(v => !v)}
            style={{ position: 'relative' }}
          >
            <PaintBrushIcon className="h-5 w-5" style={{ color: '#183153' }} />
            <span className="block w-4 h-0.5 rounded-full mt-0.5" style={{ background: currentHighlight }}></span>
          </button>
          {/* Highlight palette dropdown */}
          {highlightDropdownOpen && typeof window !== 'undefined' && createPortal(
            <div
              ref={highlightDropdownRef}
              className="fixed bg-white rounded-md shadow-lg border border-gray-200 z-[999999] p-2"
              style={{
                left: highlightDropdownPos.left,
                top: highlightDropdownPos.top,
                transform: 'translateX(-50%)',
                minWidth: 180
              }}
            >
              <div className="flex flex-col gap-1">
                {COLOR_PALETTE.map((row, i) => (
                  <div key={i} className="flex flex-row gap-1">
                    {row.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          if (editor) editor.chain().focus().toggleMark('highlight', { color }).run();
                          setHighlightDropdownOpen(false);
                        }}
                        className="w-6 h-6 rounded-full border border-gray-200 hover:border-black focus:outline-none"
                        style={{ background: color }}
                        title={color}
                        aria-label={color}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>,
            document.body
          )}
          {/* Alignment dropdown */}
          <div className="relative">
            <button
              ref={alignBtnRef}
              onClick={handleAlignClick}
              title="Text alignment"
              className={`w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded relative${!editor ? ' opacity-50' : ''}`}
              disabled={!editor}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="2" width="14" height="1" rx="0.5" fill="#183153" />
                <rect x="1" y="5" width="10" height="1" rx="0.5" fill="#183153" />
                <rect x="1" y="8" width="14" height="1" rx="0.5" fill="#183153" />
                <rect x="1" y="11" width="12" height="1" rx="0.5" fill="#183153" />
              </svg>
              <span className="absolute bottom-0.5 right-0.5 pointer-events-none">
                <ChevronDownIcon className="h-2.5 w-2.5 text-gray-600" />
              </span>
            </button>
          </div>
          {alignDropdown}
          {/* Line & Paragraph Spacing */}
          <div className="relative">
            <button
              ref={spacingBtnRef}
              title="Line & Paragraph Spacing"
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 ml-1"
              onClick={() => {
                setSpacingDropdownOpen(v => !v);
              }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="10" y="6" width="12" height="1.7" rx="0.85" fill="#183153" />
                <rect x="10" y="12" width="12" height="1.7" rx="0.85" fill="#183153" />
                <rect x="10" y="18" width="12" height="1.7" rx="0.85" fill="#183153" />
                <path d="M6 6V18" stroke="#183153" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M4.5 7L6 5.5L7.5 7" stroke="#183153" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M4.5 17L6 18.5L7.5 17" stroke="#183153" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
            {spacingDropdownOpen && typeof window !== 'undefined' && createPortal(
              <>
                <div
                  ref={spacingDropdownRef}
                  className="fixed bg-white rounded-lg shadow-lg border border-gray-200 z-[999999] py-2 px-0 text-sm select-none"
                  style={{
                    left: spacingBtnRef.current ? spacingBtnRef.current.getBoundingClientRect().left : 0,
                    top: spacingBtnRef.current ? spacingBtnRef.current.getBoundingClientRect().bottom + 4 : 0,
                    minWidth: 160,
                    pointerEvents: 'auto',
                    zIndex: 999999,
                    transform: 'translateX(0%)',
                  }}
                >
                  {lineSpacingOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setLineSpacing(opt.value);
                        setSpacingDropdownOpen(false);
                      }}
                      className={`
                        w-full text-left px-4 py-1 hover:bg-gray-100 ${lineSpacing === opt.value ? 'bg-blue-50 text-blue-700' : ''}
                      `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            , document.body)}
          </div>
        </div>
      </div>
    </div>
  );
}