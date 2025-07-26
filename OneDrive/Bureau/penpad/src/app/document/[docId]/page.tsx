"use client";
import { useParams, useRouter } from 'next/navigation';
import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Toolbar from '../../components/Toolbar';
import PaginatedEditor from '../../components/PaginatedEditor';
import { useEditorStore } from '@/app/store/useEditorStore';
import { useUserStore } from '@/app/store/useUserStore';
import { useAuthRestore } from '@/app/store/useAuthRestore';
import { Bars3Icon, DocumentTextIcon, EllipsisVerticalIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import './chapterListScroll.css';
import Toast from '../../components/Toast';

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Note {
  id: string;
  title: string;
  content: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function DocumentPage() {
  // Authentication checks - must be at the very top
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const [authLoading, setAuthLoading] = useState(true);
  
  useAuthRestore(setAuthLoading);
  
  // Show loading while authentication is being restored
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-blue-600 font-medium text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  // Place these hooks at the very top, before any logic or other hooks
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pages, setPages] = useState<string[]>(['']);
  const [isPageViewMode, setIsPageViewMode] = useState(false);
  const [showPageOverview, setShowPageOverview] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Function to extract text from HTML content
  const extractTextFromHTML = (htmlContent: string): string => {
    if (!htmlContent) return '';
    
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Extract text content, removing HTML tags
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Clean up extra whitespace
    return textContent.replace(/\s+/g, ' ').trim();
  };

  // Function to split content into pages
  const splitContentIntoPages = (content: string): string[] => {
    if (!content || content.trim() === '') {
      return [''];
    }
    
    // Extract plain text from HTML content
    const plainText = extractTextFromHTML(content);
    console.log('📄 Plain text extracted:', plainText.substring(0, 100));
    
    // Split content into pages based on word count (approximately 25 words per page)
    const wordsPerPage = 25;
    const words = plainText.split(/\s+/).filter(word => word.length > 0);
    const pages: string[] = [];
    
    console.log('📄 Total words in content:', words.length);
    
    for (let i = 0; i < words.length; i += wordsPerPage) {
      const pageWords = words.slice(i, i + wordsPerPage);
      const pageContent = pageWords.join(' ');
      pages.push(pageContent);
    }
    
    // If no pages were created, return the original content as one page
    if (pages.length === 0) {
      return [plainText || content];
    }
    
    console.log('📄 Split content into', pages.length, 'pages');
    console.log('📄 Pages:', pages.map((page, i) => `Page ${i + 1}: ${page.split(/\s+/).length} words`));
    return pages;
  };

  const params = useParams();
  const docId = params?.docId;

  // Lazy loading system - only keep current and previous content in memory
  const loadedChapters = useRef<Set<string>>(new Set());
  const loadedNotes = useRef<Set<string>>(new Set());
  const maxLoadedItems = 3; // Keep current + 2 previous items

  // Load chapter content lazily
  const loadChapterLazily = useCallback(async (chapterId: string) => {
    // If already loaded, return cached content
    if (loadedChapters.current.has(chapterId)) {
      return chapterContentCache.current.get(chapterId) || '';
    }
    
    // Load from API
    try {
      const response = await fetch(`/api/chapters/${chapterId}?documentId=${docId}`);
      const data = await response.json();
      const content = data.content || '';
      
      // Cache the content
      chapterContentCache.current.set(chapterId, content);
      loadedChapters.current.add(chapterId);
      
      // Unload old chapters if we have too many
      if (loadedChapters.current.size > maxLoadedItems) {
        const chaptersToUnload = Array.from(loadedChapters.current).slice(0, -maxLoadedItems);
        chaptersToUnload.forEach(id => {
          loadedChapters.current.delete(id);
          // Keep content in cache but mark as unloaded
        });
      }
      
      return content;
    } catch (error) {
      console.error('Failed to load chapter:', error);
      return '';
    }
  }, [docId]);

  // Load note content lazily
  const loadNoteLazily = useCallback(async (noteId: string) => {
    // If already loaded, return cached content
    if (loadedNotes.current.has(noteId)) {
      return noteContentCache.current.get(noteId) || '';
    }
    
    // Load from API
    try {
      const response = await fetch(`/api/notes/${noteId}?documentId=${docId}`);
      const data = await response.json();
      const content = data.content || '';
      
      // Cache the content
      noteContentCache.current.set(noteId, content);
      loadedNotes.current.add(noteId);
      
      // Unload old notes if we have too many
      if (loadedNotes.current.size > maxLoadedItems) {
        const notesToUnload = Array.from(loadedNotes.current).slice(0, -maxLoadedItems);
        notesToUnload.forEach(id => {
          loadedNotes.current.delete(id);
          // Keep content in cache but mark as unloaded
        });
      }
      
      return content;
    } catch (error) {
      console.error('Failed to load note:', error);
      return '';
    }
  }, [docId]);

  // Cache for chapter content to avoid API calls during switching
  const chapterContentCache = useRef<Map<string, string>>(new Map());
  // Cache for note content to avoid API calls during switching
  const noteContentCache = useRef<Map<string, string>>(new Map());

  // Content state - simple like Google Docs
  const [content, setContent] = useState('');

  const [title, setTitle] = useState('');
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const spanRef = useRef(null);
  const mirrorRef = useRef(null);
  const [inputWidth, setInputWidth] = useState(0);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);
  const hasMounted = useRef(false);
  const router = useRouter();
  const [history, setHistory] = useState<string[]>([]);
  const [redoHistory, setRedoHistory] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState(11);
  const [editor, setEditor] = useState<any>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chapter' | 'notes'>('chapter');
  const [openChapterMenuId, setOpenChapterMenuId] = useState<string | null>(null);
  const [chapterPopupPosition, setChapterPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [openNoteMenuId, setOpenNoteMenuId] = useState<string | null>(null);
  const [notePopupPosition, setNotePopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Batch save system - collect all changes and save together
  const batchSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const pendingChanges = useRef({
    content: null,
    title: null,
    analytics: null,
    spelling: null
  });
  
  // Track last saved content to avoid duplicate saves
  const lastSavedContent = useRef(new Map<string, string>());
  const lastSavedTitle = useRef<string>('');

  // Batch save function - saves everything together
  const batchSave = useCallback(async () => {
    const changes = pendingChanges.current;
    const hasChanges = Object.values(changes).some(change => change !== null);
    
    if (!hasChanges) return;
    
    try {
      const batchData: any = {};
      
      // Add content changes - only if content actually changed
      if (changes.content && activeTab === 'chapter' && currentChapterId) {
        const lastSaved = lastSavedContent.current.get(currentChapterId);
        if (lastSaved !== changes.content) {
          batchData.chapterContent = {
            chapterId: currentChapterId,
            content: changes.content,
            documentId: docId
          };
          lastSavedContent.current.set(currentChapterId, changes.content);
        }
      } else if (changes.content && activeTab === 'notes' && currentNoteId) {
        const lastSaved = lastSavedContent.current.get(currentNoteId);
        if (lastSaved !== changes.content) {
          batchData.noteContent = {
            noteId: currentNoteId,
            content: changes.content,
            documentId: docId
          };
          lastSavedContent.current.set(currentNoteId, changes.content);
        }
      }
      
      // Add title changes - only if title actually changed
      if (changes.title && documentId && changes.title !== lastSavedTitle.current) {
        batchData.documentTitle = {
          documentId: documentId,
          title: changes.title
        };
        lastSavedTitle.current = changes.title;
      }
      
      // Add analytics changes - only if significant changes
      if (changes.analytics) {
        batchData.analytics = changes.analytics;
      }
      
      // Add spelling changes - only if significant changes
      if (changes.spelling) {
        batchData.spelling = changes.spelling;
      }
      
      // Only save if there are actual changes
      if (Object.keys(batchData).length === 0) {
        // Clear pending changes since nothing changed
        pendingChanges.current = {
          content: null,
          title: null,
          analytics: null,
          spelling: null
        };
        return;
      }
      
      // Send batch save request
      await fetch('/api/batch-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchData),
      });
      
      // Clear pending changes after successful save
      pendingChanges.current = {
        content: null,
        title: null,
        analytics: null,
        spelling: null
      };
      
    } catch (error) {
      console.error('Batch save failed:', error);
      // Don't interrupt user - silent fail
    }
  }, [activeTab, currentChapterId, currentNoteId, documentId, docId]);

  // Schedule batch save - reduced from 5 seconds to 2 seconds
  const scheduleBatchSave = useCallback(() => {
    if (batchSaveTimeout.current) {
      clearTimeout(batchSaveTimeout.current);
    }
    
    batchSaveTimeout.current = setTimeout(() => {
      batchSave();
    }, 2000); // 2 second debounce - much faster response
  }, [batchSave]);

  // Add change to batch
  const addToBatch = useCallback((type: 'content' | 'title' | 'analytics' | 'spelling', data: any) => {
    pendingChanges.current[type] = data;
    scheduleBatchSave();
  }, [scheduleBatchSave]);
  
  // Modal states for rename/delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemType, setDeleteItemType] = useState<'chapter' | 'note' | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteItemTitle, setDeleteItemTitle] = useState('');
  
  // Inline editing states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemType, setEditingItemType] = useState<'chapter' | 'note' | null>(null);
  const [editingItemTitle, setEditingItemTitle] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showThreeDotsMenu, setShowThreeDotsMenu] = useState(false);
  const chapterMenuRef = useRef<HTMLDivElement>(null);
  const noteMenuRef = useRef<HTMLDivElement>(null);

  // Persistence helpers
  const setActiveTabWithPersistence = (tab: 'chapter' | 'notes') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeTab', tab);
    }
  };

  const setCurrentChapterIdWithPersistence = (chapterId: string) => {
    setCurrentChapterId(chapterId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentChapterId', chapterId);
    }
  };

  const setCurrentNoteIdWithPersistence = (noteId: string) => {
    setCurrentNoteId(noteId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentNoteId', noteId);
    }
  };

  // Handlers for rename/delete modals
  const handleRenameClick = (type: 'chapter' | 'note', id: string, currentTitle: string) => {
    setEditingItemType(type);
    setEditingItemId(id);
    setEditingItemTitle(currentTitle);
    setOpenChapterMenuId(null);
    setOpenNoteMenuId(null);
    
    // Small delay to ensure the input field is rendered before focusing
    setTimeout(() => {
      const inputElement = document.querySelector(`input[data-editing-id="${id}"]`) as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
        inputElement.select(); // Select all text for easy editing
      }
    }, 10);
  };

  const handleDeleteClick = (type: 'chapter' | 'note', id: string, currentTitle: string) => {
    setDeleteItemType(type);
    setDeleteItemId(id);
    setDeleteItemTitle(currentTitle);
    setShowDeleteModal(true);
    setOpenChapterMenuId(null);
    setOpenNoteMenuId(null);
  };

  const handleRenameSubmit = async () => {
    if (!editingItemId || !editingItemType || !editingItemTitle.trim()) return;
    
    try {
      let response;
      
      if (editingItemType === 'chapter') {
        response = await fetch(`/api/chapters/${editingItemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: editingItemTitle.trim(),
            documentId: docId 
          }),
        });
        
        if (response.ok) {
          // Update local state
          setChapters(chapters.map(ch => 
            ch.id === editingItemId 
              ? { ...ch, title: editingItemTitle.trim() }
              : ch
          ));
          setToast({ message: 'Chapter renamed successfully', type: 'success' });
        } else {
          throw new Error('Failed to rename chapter');
        }
      } else if (editingItemType === 'note') {
        response = await fetch(`/api/notes/${editingItemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: editingItemTitle.trim(),
            documentId: docId 
          }),
        });
        
        if (response.ok) {
          // Update local state
          setNotes(notes.map(note => 
            note.id === editingItemId 
              ? { ...note, title: editingItemTitle.trim() }
              : note
          ));
          setToast({ message: 'Note renamed successfully', type: 'success' });
        } else {
          throw new Error('Failed to rename note');
        }
      }
    } catch (error) {
      console.error('Failed to rename:', error);
      setToast({ 
        message: `Failed to rename ${editingItemType === 'chapter' ? 'chapter' : 'note'}`, 
        type: 'error' 
      });
    }
    
    // Exit editing mode
    setEditingItemId(null);
    setEditingItemType(null);
    setEditingItemTitle('');
  };

  const handleRenameBlur = () => {
    // Save on blur if user has made changes
    if (editingItemId && editingItemTitle.trim()) {
      handleRenameSubmit();
    } else {
      // Only cancel if no changes were made
      handleRenameCancel();
    }
  };

  const handleRenameCancel = () => {
    setEditingItemId(null);
    setEditingItemType(null);
    setEditingItemTitle('');
  };

  const handleDeleteSubmit = async () => {
    if (!deleteItemId || !deleteItemType) return;
    
    try {
      let response;
      
      if (deleteItemType === 'chapter') {
        // Delete chapter
        response = await fetch(`/api/chapters/${deleteItemId}?documentId=${documentId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          // Remove from local state
          setChapters(chapters.filter(ch => ch.id !== deleteItemId));
          
          // If we deleted the current chapter, switch to first chapter
          if (currentChapterId === deleteItemId) {
            const remainingChapters = chapters.filter(ch => ch.id !== deleteItemId);
            if (remainingChapters.length > 0) {
              setCurrentChapterIdWithPersistence(remainingChapters[0].id);
              const cachedContent = chapterContentCache.current.get(remainingChapters[0].id) || '';
              setContent(cachedContent);
            } else {
              setCurrentChapterId(null);
              setContent('');
            }
          }
          
          // Clear cache for deleted chapter
          chapterContentCache.current.delete(deleteItemId);
          lastSavedContent.current.delete(deleteItemId);
          
          setToast({ message: 'Chapter deleted successfully', type: 'success' });
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to delete chapter`);
        }
      } else if (deleteItemType === 'note') {
        // Delete note
        response = await fetch(`/api/notes/${deleteItemId}?documentId=${documentId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          // Remove from local state
          setNotes(notes.filter(note => note.id !== deleteItemId));
          
          // If we deleted the current note, switch to first note
          if (currentNoteId === deleteItemId) {
            const remainingNotes = notes.filter(note => note.id !== deleteItemId);
            if (remainingNotes.length > 0) {
              setCurrentNoteIdWithPersistence(remainingNotes[0].id);
              const cachedContent = noteContentCache.current.get(remainingNotes[0].id) || '';
              setContent(cachedContent);
            } else {
              setCurrentNoteId(null);
              setContent('');
            }
          }
          
          // Clear cache for deleted note
          noteContentCache.current.delete(deleteItemId);
          lastSavedContent.current.delete(deleteItemId);
          
          setToast({ message: 'Note deleted successfully', type: 'success' });
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to delete note`);
        }
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      setToast({ 
        message: error instanceof Error ? error.message : `Failed to delete ${deleteItemType === 'chapter' ? 'chapter' : 'note'}`, 
        type: 'error' 
      });
    }
    
    // Close modal and reset state
    setShowDeleteModal(false);
    setDeleteItemType(null);
    setDeleteItemId(null);
    setDeleteItemTitle('');
  };

  const handleEditorReady = useCallback((editorInstance: any) => {
    // Prevent infinite re-renders by checking if editor is already set
    if (editor && editor === editorInstance) return;
    
    setEditor(editorInstance);
    
    // Apply initial font size when editor is ready (non-blocking)
    if (editorInstance && fontSize) {
      // Apply font size in background to prevent blocking
      setTimeout(() => {
        try {
          // Map the toolbar size to actual pixel size
          let actualSize = 14; // Default fallback
          
          if (fontSize >= 12) {
            actualSize = fontSize + 3;
          } else if (fontSize >= 8) {
            actualSize = 14 - (11 - fontSize) * 0.5;
          } else {
            actualSize = 12;
          }
          
          // Apply to entire document and set in store
          editorInstance.chain().focus().setMark('textStyle', { fontSize: `${actualSize}px` }).run();
          
          // Update the store with the actual pixel size
          const { setActiveFontSize } = useEditorStore.getState();
          setActiveFontSize(actualSize);
          
        } catch (error) {
          console.error('Error applying initial font size:', error);
        }
      }, 0); // Apply immediately but asynchronously
    }
  }, [editor, fontSize]);

  // Load chapters from API
  const loadChapters = useCallback(async () => {
    if (!documentId) return;
    try {
      const response = await fetch(`/api/chapters?documentId=${documentId}`);
      if (response.ok) {
        const data = await response.json();
      setChapters(data.chapters || []);
        
        // Set current chapter from localStorage or first chapter
        const savedChapterId = localStorage.getItem('currentChapterId');
        const chaptersArray = data.chapters || [];
        if (savedChapterId && chaptersArray.some((ch: any) => ch.id === savedChapterId)) {
          setCurrentChapterIdWithPersistence(savedChapterId);
        } else if (chaptersArray.length > 0) {
          setCurrentChapterIdWithPersistence(chaptersArray[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load chapters:', error);
    }
  }, [documentId]);

  // Load notes from API
  const loadNotes = useCallback(async () => {
    if (!documentId) return;
    try {
      const response = await fetch(`/api/notes?documentId=${documentId}`);
      if (response.ok) {
        const data = await response.json();
      setNotes(data.notes || []);
        
        // Set current note from localStorage or first note
        const savedNoteId = localStorage.getItem('currentNoteId');
        const notesArray = data.notes || [];
        if (savedNoteId && notesArray.some((note: any) => note.id === savedNoteId)) {
          setCurrentNoteIdWithPersistence(savedNoteId);
        } else if (notesArray.length > 0) {
          setCurrentNoteIdWithPersistence(notesArray[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  }, [documentId]);

  // Save current chapter content (non-blocking)
  const saveCurrentChapter = useCallback(() => {
    if (!currentChapterId || !content || activeTab !== 'chapter') return;
    
    // Don't save if content hasn't changed
    const lastSaved = lastSavedContent.current.get(currentChapterId);
    if (lastSaved === content) return;
    
    // Mark as saved immediately to prevent duplicate saves
    lastSavedContent.current.set(currentChapterId, content);
    
    // Fire and forget - don't wait for response
    fetch(`/api/chapters/${currentChapterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, documentId: docId }),
    }).catch(() => {
      // Silently handle errors - don't interrupt user
    });
  }, [currentChapterId, content, activeTab, docId]);

  // Save current note content (non-blocking)
  const saveCurrentNote = useCallback(() => {
    if (!currentNoteId || !content || activeTab !== 'notes') return;
    
    // Don't save if content hasn't changed
    const lastSaved = lastSavedContent.current.get(currentNoteId);
    if (lastSaved === content) return;
    
    // Mark as saved immediately to prevent duplicate saves
    lastSavedContent.current.set(currentNoteId, content);
    
    // Fire and forget - don't wait for response
    fetch(`/api/notes/${currentNoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, documentId: docId }),
    }).catch(() => {
      // Silently handle errors - don't interrupt user
    });
  }, [currentNoteId, content, activeTab, docId]);



  let updateTimeout: NodeJS.Timeout | null = null;
  const { updateWordCount } = useEditorStore();

  const [isLoading, setIsLoading] = useState(true);
  // We'll use a helper state to track when both are loaded
  const [docLoaded, setDocLoaded] = useState(false);
  const [chaptersLoaded, setChaptersLoaded] = useState(false);
  const [notesLoaded, setNotesLoaded] = useState(false);

  // Load active tab from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('activeTab') as 'chapter' | 'notes';
      if (savedTab) {
        setActiveTab(savedTab);
      }
    }
  }, []);

  // Load current chapter/note from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedChapterId = localStorage.getItem('currentChapterId');
      if (savedChapterId) {
        setCurrentChapterId(savedChapterId);
      }
      
      const savedNoteId = localStorage.getItem('currentNoteId');
      if (savedNoteId) {
        setCurrentNoteId(savedNoteId);
      }
    }
  }, []);

  // Load chapter content when switching chapters
  useEffect(() => {
    if (!currentChapterId || activeTab !== 'chapter') return;
    
    console.log('🔍 Loading chapter content for:', currentChapterId);
    
    // Check if we have cached content
    const cachedContent = chapterContentCache.current.get(currentChapterId);
    if (cachedContent !== undefined) {
      console.log('📊 Using cached content for chapter:', currentChapterId, 'Length:', cachedContent.length);
      setContent(cachedContent);
      return;
    }
    
    console.log('📊 Loading chapter from API:', currentChapterId);
    // Load from API
    fetch(`/api/chapters/${currentChapterId}?documentId=${docId}`)
      .then(res => res.json())
      .then(data => {
        const chapterContent = data.content || '';
        console.log('📊 Loaded chapter content from API:', currentChapterId, 'Length:', chapterContent.length);
        console.log('📊 API content preview:', chapterContent.substring(0, 100) + '...');
        chapterContentCache.current.set(currentChapterId, chapterContent);
        setContent(chapterContent);
      })
      .catch(err => {
        console.error('Failed to load chapter:', err);
        setContent('');
      });
  }, [currentChapterId, activeTab]);

  // Load note content when switching notes
  useEffect(() => {
    if (!currentNoteId || activeTab !== 'notes') return;
    
    // Check if we have cached content
    const cachedContent = noteContentCache.current.get(currentNoteId);
    if (cachedContent !== undefined) {
      setContent(cachedContent);
      return;
    }
    
    // Load from API
    fetch(`/api/notes/${currentNoteId}?documentId=${docId}`)
      .then(res => res.json())
      .then(data => {
        const noteContent = data.content || '';
        noteContentCache.current.set(currentNoteId, noteContent);
        setContent(noteContent);
      })
      .catch(err => {
        console.error('Failed to load note:', err);
        setContent('');
      });
  }, [currentNoteId, activeTab]);

  // Content loading optimization
  const contentLoadingRef = useRef(new Set<string>());
  const contentCache = useRef(new Map<string, string>());
  
  // Load content with caching
  const loadContent = useCallback(async (id: string, type: 'chapter' | 'note') => {
    // Check if already loading
    if (contentLoadingRef.current.has(id)) return;
    
    // Check cache first
    const cached = contentCache.current.get(id);
    if (cached) {
      setContent(cached);
      return;
    }
    
    // Mark as loading
    contentLoadingRef.current.add(id);
    
    try {
      const response = await fetch(`/api/${type}s/${id}?documentId=${docId}`);
      if (response.ok) {
        const data = await response.json();
        const content = data.content || '';
        
        // Cache the content
        contentCache.current.set(id, content);
        setContent(content);
        
        // Update last saved content
        lastSavedContent.current.set(id, content);
      }
    } catch (error) {
      console.error(`Failed to load ${type} content:`, error);
    } finally {
      contentLoadingRef.current.delete(id);
    }
  }, [docId]);

  // Optimized click handlers for chapters and notes
  const handleChapterClick = useCallback(async (chapterId: string) => {
    // Save current content before switching
    if (activeTab === 'chapter' && currentChapterId && content !== undefined) {
      chapterContentCache.current.set(currentChapterId, content);
    } else if (activeTab === 'notes' && currentNoteId && content !== undefined) {
      noteContentCache.current.set(currentNoteId, content);
    }
    
    setCurrentChapterIdWithPersistence(chapterId);
    setActiveTabWithPersistence('chapter');
    
    // Load chapter content with caching
    await loadContent(chapterId, 'chapter');
    
    // Initialize pages for the content
    const cachedContent = contentCache.current.get(chapterId) || '';
    const newPages = splitContentIntoPages(cachedContent);
    setPages(newPages);
  }, [content, activeTab, currentChapterId, currentNoteId, splitContentIntoPages]);
  
  const handleNoteClick = useCallback(async (noteId: string) => {
    // Save current content before switching
    if (activeTab === 'chapter' && currentChapterId && content !== undefined) {
      chapterContentCache.current.set(currentChapterId, content);
    } else if (activeTab === 'notes' && currentNoteId && content !== undefined) {
      noteContentCache.current.set(currentNoteId, content);
    }
    
    setCurrentNoteIdWithPersistence(noteId);
    setActiveTabWithPersistence('notes');
    
    // Load note content with caching
    await loadContent(noteId, 'note');
    
    // Initialize pages for the content
    const cachedContent = contentCache.current.get(noteId) || '';
    const newPages = splitContentIntoPages(cachedContent);
    setPages(newPages);
  }, [content, activeTab, currentChapterId, currentNoteId, splitContentIntoPages]);

  // Load document and chapters
  useEffect(() => {
    if (!docId || docId === 'new') return;
    fetch(`/api/documents/${docId}`)
      .then(res => {
        if (!res.ok) throw new Error('Document not found');
        return res.text();
      })
      .then(text => {
        if (!text) throw new Error('Empty response');
        const data = JSON.parse(text);
        setTitle(data.title === 'Untitled document' ? '' : data.title || '');
        setDocumentId(docId as string);
        setDocLoaded(true);
      })
      .catch(err => {
        setTitle('');
        setDocumentId(docId as string);
        setDocLoaded(true);
      });
  }, [docId]);

  // Load chapters when document is loaded
  useEffect(() => {
    if (documentId) {
      loadChapters().then(() => setChaptersLoaded(true));
    }
  }, [documentId, loadChapters]);

  // Load notes when document is loaded
  useEffect(() => {
    if (documentId) {
      loadNotes().then(() => setNotesLoaded(true));
    }
  }, [documentId, loadNotes]);

  // Set content based on active tab - allow immediate typing
  useEffect(() => {
    if (activeTab && (chaptersLoaded || notesLoaded)) {
      if (activeTab === 'chapter' && currentChapterId) {
        const cachedContent = chapterContentCache.current.get(currentChapterId) || '';
        setContent(cachedContent);
      } else if (activeTab === 'notes' && currentNoteId) {
        const cachedContent = noteContentCache.current.get(currentNoteId) || '';
        setContent(cachedContent);
      }
    }
  }, [chaptersLoaded, notesLoaded, activeTab, currentChapterId, currentNoteId]);

  // Set isLoading to false when document is loaded (allow typing even if chapters/notes are still loading)
  useEffect(() => {
    if (docLoaded) setIsLoading(false);
  }, [docLoaded]);

  // Update cache when content changes
  useEffect(() => {
    if (currentChapterId && content !== undefined && activeTab === 'chapter') {
      chapterContentCache.current.set(currentChapterId, content);
    }
    if (currentNoteId && content !== undefined && activeTab === 'notes') {
      noteContentCache.current.set(currentNoteId, content);
    }
  }, [content, currentChapterId, currentNoteId, activeTab]);

  // Debounced auto-save for chapters (removed natural breaks for smoother typing)
  useEffect(() => {
    if (!currentChapterId || !content || activeTab !== 'chapter') return;
    
    // Don't save if content hasn't changed
    const lastSaved = lastSavedContent.current.get(currentChapterId);
    if (lastSaved === content) return;
    
    if (updateTimeout) clearTimeout(updateTimeout);
    
    // Save only after 5 seconds of no typing (smoother experience)
    updateTimeout = setTimeout(() => {
      saveCurrentChapter();
    }, 5000);
    
    return () => {
      if (updateTimeout) clearTimeout(updateTimeout);
    };
  }, [content, currentChapterId, activeTab, saveCurrentChapter]);

  // Debounced auto-save for notes (removed natural breaks for smoother typing)
  useEffect(() => {
    if (!currentNoteId || !content || activeTab !== 'notes') return;
    
    // Don't save if content hasn't changed
    const lastSaved = lastSavedContent.current.get(currentNoteId);
    if (lastSaved === content) return;
    
    if (updateTimeout) clearTimeout(updateTimeout);
    
    // Save only after 5 seconds of no typing (smoother experience)
    updateTimeout = setTimeout(() => {
      saveCurrentNote();
    }, 5000);
    
    return () => {
      if (updateTimeout) clearTimeout(updateTimeout);
    };
  }, [content, currentNoteId, activeTab, saveCurrentNote]);

  // Final save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentChapterId && content && activeTab === 'chapter') {
        saveCurrentChapter();
      }
      if (currentNoteId && content && activeTab === 'notes') {
        saveCurrentNote();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentChapterId, currentNoteId, content, activeTab, saveCurrentChapter, saveCurrentNote]);

  // Title saving - add to batch instead of individual save
  useEffect(() => {
    if (title && documentId && title !== lastSavedTitle.current) {
      addToBatch('title', title);
    }
  }, [title, documentId, addToBatch]);

  useEffect(() => {
    if (isFocused && inputRef.current && title.length > 0 && !hasAutoSelected) {
      const el = inputRef.current;
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
      setHasAutoSelected(true);
    }
  }, [isFocused, title, hasAutoSelected]);

  // Update word count when content or editor changes (use editor.getText for accuracy)
  useEffect(() => {
    if (editor && content !== undefined && activeTab === 'chapter') {
      const text = editor.getText ? editor.getText() : '';
      const count = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
      updateWordCount(count);
    }
  }, [editor, content, activeTab, updateWordCount]);

  const handleTitleClick = () => {
    // console.log('Title clicked!');
    setEditing(true);
    setTimeout(() => {
      if (title === 'Untitled document') {
        setTitle('');
      }
      inputRef.current?.focus();
    }, 0);
  };

  const handleTitleBlur = () => {
    setEditing(false);
    if (!title.trim()) setTitle('');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (!hasEdited && e.target.value.trim() !== '') setHasEdited(true);
  };

  // Simple onChange handler - like Google Docs (non-blocking)
  const handleContentChange = (newContent: string) => {
    // Update content immediately but don't block typing
    setContent(newContent);
    
    // Update cache immediately
    if (activeTab === 'chapter' && currentChapterId) {
      chapterContentCache.current.set(currentChapterId, newContent);
    } else if (activeTab === 'notes' && currentNoteId) {
      noteContentCache.current.set(currentNoteId, newContent);
    }
    
    // Update history for undo/redo
    setHistory((prev) => [...prev, content]);
    setRedoHistory([]);
    
    if (!hasEdited && newContent.trim() !== '') setHasEdited(true);
    
    // Only add to batch if content actually changed significantly
    const lastSaved = activeTab === 'chapter' && currentChapterId 
      ? lastSavedContent.current.get(currentChapterId)
      : activeTab === 'notes' && currentNoteId 
        ? lastSavedContent.current.get(currentNoteId)
        : null;
    
    // Only save if content changed by more than just whitespace
    const contentChanged = lastSaved !== newContent && 
      newContent.trim() !== lastSaved?.trim();
    
    if (contentChanged) {
      addToBatch('content', newContent);
    }
    
    // Show saving indicator (non-blocking) - only if actually saving
    if (contentChanged) {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
      }, 1000);
    }
  };

  const handleUndo = () => {
    if (editor) {
      editor.chain().focus().undo().run();
    } else {
      // Fallback to custom history if editor not available
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoHistory((r) => [content, ...r]);
    setContent(prev);
    setHistory((h) => h.slice(0, h.length - 1));
    }
  };

  const handleRedo = () => {
    if (editor) {
      editor.chain().focus().redo().run();
    } else {
      // Fallback to custom history if editor not available
    if (redoHistory.length === 0) return;
    const next = redoHistory[0];
    setHistory((h) => [...h, content]);
    setContent(next);
    setRedoHistory((r) => r.slice(1));
    }
  };

  // Calculate current chapter word count
  const [totalWordCount, setTotalWordCount] = useState(0);
  
  const calculateCurrentChapterWordCount = useCallback(() => {
    if (!currentChapterId || activeTab !== 'chapter') return 0;
    
    let text = (chapterContentCache.current.get(currentChapterId) || content || '').trim();
    // Remove HTML tags
    text = text.replace(/<[^>]*>/g, '').trim();
    const count = text ? text.split(/\s+/).filter(Boolean).length : 0;
    return count;
  }, [currentChapterId, content, activeTab]);

  // Update current chapter word count when content changes
  useEffect(() => {
    const newCount = calculateCurrentChapterWordCount();
    setTotalWordCount(newCount);
  }, [content, currentChapterId, activeTab, calculateCurrentChapterWordCount]);

  // Toast auto-hide effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Close context menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      
      // Close chapter menu if clicked outside
      if (openChapterMenuId && chapterMenuRef.current && !chapterMenuRef.current.contains(target)) {
        setOpenChapterMenuId(null);
        setChapterPopupPosition(null);
      }
      
      // Close note menu if clicked outside
      if (openNoteMenuId && noteMenuRef.current && !noteMenuRef.current.contains(target)) {
        setOpenNoteMenuId(null);
        setNotePopupPosition(null);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openChapterMenuId, openNoteMenuId]);

  // External scrollbar functionality
  useEffect(() => {
    // Add a small delay to ensure DOM elements are ready
    const timer = setTimeout(() => {
      const chapterList = document.querySelector('.chapter-list-scroll') as HTMLElement;
      const externalScrollbar = document.getElementById('external-scrollbar') as HTMLElement;
      const scrollbarThumb = externalScrollbar?.querySelector('.absolute') as HTMLElement;
      
      if (chapterList && externalScrollbar && scrollbarThumb) {
        // Sync scrollbar position with chapter list
        const updateScrollbar = () => {
          const scrollTop = chapterList.scrollTop;
          const scrollHeight = chapterList.scrollHeight;
          const clientHeight = chapterList.clientHeight;
          const maxScroll = scrollHeight - clientHeight;
          
          if (maxScroll > 0) {
            const scrollbarHeight = externalScrollbar.clientHeight;
            const thumbHeight = Math.max(60, (scrollbarHeight / scrollHeight) * scrollbarHeight);
            const maxThumbTop = scrollbarHeight - thumbHeight;
            const thumbTop = (scrollTop / maxScroll) * maxThumbTop;
            
            scrollbarThumb.style.height = `${thumbHeight}px`;
            scrollbarThumb.style.top = `${Math.min(thumbTop, maxThumbTop)}px`;
          }
        };
        
        // Make scrollbar draggable
        let isDragging = false;
        let startY = 0;
        let startScrollTop = 0;
        
        const handleMouseDown = (e: MouseEvent) => {
          isDragging = true;
          startY = e.clientY;
          startScrollTop = chapterList.scrollTop;
          document.body.style.cursor = 'grabbing';
          e.preventDefault();
        };
        
        const handleMouseMove = (e: MouseEvent) => {
          if (!isDragging) return;
          
          const deltaY = e.clientY - startY;
          const scrollRatio = deltaY / (externalScrollbar.clientHeight - scrollbarThumb.clientHeight);
          const maxScroll = chapterList.scrollHeight - chapterList.clientHeight;
          const newScrollTop = startScrollTop + (scrollRatio * maxScroll);
          
          chapterList.scrollTop = Math.max(0, Math.min(maxScroll, newScrollTop));
        };
        
        const handleMouseUp = () => {
          isDragging = false;
          document.body.style.cursor = '';
        };
        
        // Add event listeners
        scrollbarThumb.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        chapterList.addEventListener('scroll', updateScrollbar);
        
        // Initial update with a small delay to ensure proper sizing
        setTimeout(updateScrollbar, 100);
        
        return () => {
          scrollbarThumb.removeEventListener('mousedown', handleMouseDown);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          chapterList.removeEventListener('scroll', updateScrollbar);
        };
      }
    }, 200); // Wait 200ms for DOM to be ready
    
    return () => clearTimeout(timer);
  }, [chapters, activeTab]);

  const [creatingNewDoc, setCreatingNewDoc] = useState(false);

  useEffect(() => {
    if (docId === 'new') {
      setCreatingNewDoc(true);
      // Create a new document via API
      fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled document', content: '' })
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.document && data.document.id) {
            router.replace(`/document/${data.document.id}`);
          } else {
            // Handle error (show toast or fallback)
            setCreatingNewDoc(false);
            setToast({ message: 'Failed to create new document.', type: 'error' });
          }
        })
        .catch(() => {
          setCreatingNewDoc(false);
          setToast({ message: 'Failed to create new document.', type: 'error' });
        });
    }
  }, [docId, router]);

  if (creatingNewDoc) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span className="text-blue-600 font-medium text-lg">Creating new document...</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header with loading state */}
        <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
          <div className="flex justify-between items-start h-24 px-4 py-8">
            <div className="flex items-center space-x-4 ml-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
                <BookOpenIcon className="h-16 w-16 p-1 rounded hover:bg-gray-100 transition-colors" style={{ marginTop: '-8px' }} />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-blue-600 text-base font-medium">Loading document...</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Content area with loading placeholder */}
        <div className="pt-24 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
            {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex justify-between items-start h-24 px-4 py-8">
          {/* Left side - Logo and Title */}
          <div className="flex items-center space-x-4 ml-4">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 relative group">
              <BookOpenIcon className="h-16 w-16 p-1 rounded hover:bg-gray-100 transition-colors" style={{ marginTop: '-12px' }} />
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-1 py-0.5 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-[10px]">
                Dashboard
              </div>
          </Link>
            

            
            <div className="flex items-center">
                {editing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={title}
                    onChange={handleTitleChange}
                    onBlur={() => {
                      setEditing(false);
                      if (!title.trim()) setTitle('');
                    }}
                    onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        setEditing(false);
                    }
                  }}
                    className="text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                      width: Math.max(200, Math.min(900, (title?.length || 0) * 7 + 20)),
                      marginTop: '-80px' 
                    }}
                  />
                ) : (
                <span
                    ref={spanRef}
                    onClick={() => {
                      // console.log('Title clicked!');
                      setEditing(true);
                    }}
                    className={`text-sm font-medium cursor-pointer hover:text-gray-600 hover:bg-gray-100 rounded px-2 py-1 transition-colors ${title ? 'text-gray-900' : 'text-gray-400'}`}
                    style={{ marginTop: '-80px' }}
                >
                  {title || 'Untitled document'}
                </span>
                )}
              </div>
            </div>
          
          {/* Right side - Toolbar */}
          <div className="flex items-center space-x-4">
            <Toolbar 
              editor={editor}
              totalWordCount={totalWordCount}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={editor ? editor.can().undo() : false}
              canRedo={editor ? editor.can().redo() : false}
              fontSize={fontSize}
              setFontSize={setFontSize}
              onViewAllPages={async () => {
                // Show page overview popup instantly with cached content only
                console.log('📄 Opening page overview instantly');
                setShowPageOverview(true);
                
                // Load uncached chapters in background
                const uncachedChapters = chapters.filter(chapter => 
                  !chapterContentCache.current.has(chapter.id)
                );
                
                if (uncachedChapters.length > 0) {
                  console.log(`📄 Loading ${uncachedChapters.length} uncached chapters in background`);
                  
                  // Load chapters in parallel for speed
                  const loadPromises = uncachedChapters.map(async (chapter) => {
                    try {
                      const response = await fetch(`/api/chapters/${chapter.id}?documentId=${docId}`);
                      const data = await response.json();
                      const chapterContent = data.content || '';
                      chapterContentCache.current.set(chapter.id, chapterContent);
                      console.log(`📄 Loaded chapter: ${chapter.title || chapter.id}`);
                    } catch (error) {
                      console.error('Failed to load chapter:', chapter.id, error);
                    }
                  });
                  
                  // Load in background - don't wait
                  Promise.all(loadPromises).then(() => {
                    console.log('📄 All background chapters loaded');
                  });
                }
              }}
            />
        </div>
        </div>
      </header>

      {/* Saving indicator - fixed position that doesn't affect layout */}
      {isSaving && (
        <div 
          className="fixed flex items-center space-x-1 text-blue-600 z-50"
          style={{
            left: '140px',
            top: '60px',
            pointerEvents: 'none'
          }}
        >
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span className="text-xs">Saving...</span>
        </div>
      )}

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          left: 40,
          top: '140px',
          width: '240px',
          zIndex: 20,
          pointerEvents: 'auto',
        }}
        className="flex flex-col items-start group"
      >
        {/* External Scrollbar Container - Only show when 13 or more chapters (Chapter 13) */}
        {chapters.length >= 13 && (
          <div
            style={{
              position: 'fixed',
              left: '320px', // Further right
              top: '140px',
              width: '12px',
              height: '550px',
              zIndex: 15,
            }}
            className="rounded-r overflow-y-auto opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity duration-200"
            id="external-scrollbar"
          >
            {/* Scrollbar track */}
            <div className="w-full h-full relative bg-gray-100">
              {/* Scrollbar thumb */}
              <div 
                className="absolute w-2 bg-gray-400 rounded-full cursor-pointer hover:bg-gray-500 transition-colors"
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  right: '2px'
                }}
              ></div>
            </div>
          </div>
        )}
        <div className="flex flex-row gap-2 items-center" style={{ marginLeft: '20px' }}>
        <div className="flex flex-row gap-2 items-center">
          <button
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors border-2 ${activeTab === 'chapter' ? 'bg-white shadow text-blue-600 border-blue-400' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-blue-400'}`}
            onClick={() => {
              // Save current note content before switching
              if (activeTab === 'notes' && currentNoteId && content !== undefined) {
                noteContentCache.current.set(currentNoteId, content);
              }
              setActiveTabWithPersistence('chapter');
              // Load current chapter content
              if (currentChapterId) {
                const cachedContent = chapterContentCache.current.get(currentChapterId) || '';
                setContent(cachedContent);
                
                // Initialize pages for the content
                const newPages = splitContentIntoPages(cachedContent);
                setPages(newPages);
              }
            }}
            type="button"
          >
            Chapters
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors border-2 ${activeTab === 'notes' ? 'bg-white shadow text-blue-600 border-blue-400' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-blue-400'}`}
            onClick={() => {
              // Save current chapter content before switching
              if (activeTab === 'chapter' && currentChapterId && content !== undefined) {
                chapterContentCache.current.set(currentChapterId, content);
              }
              setActiveTabWithPersistence('notes');
              // Load current note content
              if (currentNoteId) {
                const cachedContent = noteContentCache.current.get(currentNoteId) || '';
                setContent(cachedContent);
                
                // Initialize pages for the content
                const newPages = splitContentIntoPages(cachedContent);
                setPages(newPages);
              }
            }}
            type="button"
          >
            Notes
          </button>
        </div>
        {activeTab === 'chapter' && (
          <button
                onClick={async () => {
                  if (!documentId || isAddingChapter) return;
                  setIsAddingChapter(true);
                  try {
                    const response = await fetch('/api/chapters', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        documentId,
                        title: `Chapter ${chapters.length + 1}`,
                        content: '',
                        order: chapters.length,
                      }),
                    });
                    if (response.ok) {
                      const newChapter = await response.json();
                      setChapters([...chapters, newChapter]);
                      setCurrentChapterIdWithPersistence(newChapter.id);
                      setContent('');
                      setPages(['']);
                    }
                  } catch (error) {
                    console.error('Failed to create chapter:', error);
                  } finally {
                    setIsAddingChapter(false);
                  }
                }}
                disabled={isAddingChapter}
              className={`w-6 h-6 rounded-full text-white flex items-center justify-center transition-colors ml-6 ${
                isAddingChapter 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              style={{ fontSize: '14px', lineHeight: '1', zIndex: 50, fontWeight: 'normal', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
              >
                {isAddingChapter ? (
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : (
                  '+'
                )}
          </button>
          )}
          {activeTab === 'notes' && (
            <button
              onClick={async () => {
                if (!documentId || isAddingNote) return;
                setIsAddingNote(true);
                try {
                  const response = await fetch('/api/notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      documentId,
                      title: `Note ${notes.length + 1}`,
                      content: '',
                      order: notes.length,
                    }),
                  });
                  if (response.ok) {
                    const newNote = await response.json();
                    setNotes([...notes, newNote]);
                    setCurrentNoteIdWithPersistence(newNote.id);
                    setContent('');
                    setPages(['']);
                  }
                } catch (error) {
                  console.error('Failed to create note:', error);
                } finally {
                  setIsAddingNote(false);
                }
              }}
              disabled={isAddingNote}
              className={`w-6 h-6 rounded-full text-white flex items-center justify-center transition-colors ml-6 ${
                isAddingNote 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              style={{ fontSize: '14px', lineHeight: '1', zIndex: '50', fontWeight: 'normal', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
            >
              {isAddingNote ? (
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              ) : (
                '+'
              )}
            </button>
          )}
        </div>

                {/* Chapters List - Always Visible */}
        <div className="mt-2 w-full" style={{ width: '270px' }}>
          <div className="space-y-1 max-h-[520px] overflow-y-auto chapter-list-scroll pr-0">
            {chapters.map((chapter, idx) => (
              <div
                key={chapter.id}
                className={`p-4 rounded-2xl transition-all duration-200 relative group cursor-pointer ${
                  currentChapterId === chapter.id && activeTab === 'chapter'
                    ? 'bg-blue-50 border-2 border-blue-200 text-blue-700 shadow-sm'
                    : 'hover:bg-blue-50 hover:border-blue-200 border-2 border-transparent'
                }`}
                onClick={() => handleChapterClick(chapter.id)}
                style={{ minHeight: '60px' }}
              >
                  {editingItemId === chapter.id ? (
                    // Inline editing mode
                    <div className="flex-1 mr-3">
                      <input
                        type="text"
                        value={editingItemTitle}
                        onChange={(e) => setEditingItemTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleRenameSubmit();
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            handleRenameCancel();
                          }
                        }}
                        onBlur={handleRenameBlur}
                        className="w-full text-base font-medium text-gray-800 bg-transparent border border-blue-300 rounded-sm outline-none focus:outline-none focus:border-blue-500"
                        style={{ 
                          padding: '1px 2px',
                          margin: '0',
                          height: 'auto',
                          minHeight: '0',
                          lineHeight: 'inherit'
                        }}
                        data-editing-id={chapter.id}
                      />
                    </div>
                  ) : (
                    // Normal display mode
                    <div className="flex items-center" style={{ marginRight: '40px' }}>
                      <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-3" style={{ marginLeft: '8px' }} />
                      <span 
                        className="text-lg font-medium truncate text-blue-700"
                        style={{ marginLeft: '8px' }}
                      >
                      {chapter.title || `Chapter ${idx + 1}`}
                  </span>
                    </div>
                  )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const menuHeight = 80; // Approximate height of the menu
                          const windowHeight = window.innerHeight;
                          const spaceBelow = windowHeight - rect.bottom;
                          const spaceAbove = rect.top;
                          
                          // Determine if menu should open up or down
                          const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > menuHeight;
                          
                          setOpenChapterMenuId(chapter.id);
                          setChapterPopupPosition({ 
                            x: e.clientX, 
                            y: shouldOpenUp ? rect.top - menuHeight : e.clientY 
                          });
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}
                      >
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notes List - Only visible when notes tab is active */}
        {activeTab === 'notes' && (
          <div className="mt-2 w-full" style={{ width: '270px' }}>
            <div className="space-y-1 max-h-[520px] overflow-y-auto chapter-list-scroll pr-0">
              {notes.map((note, idx) => (
                <div
                  key={note.id}
                  className={`p-4 rounded-2xl transition-all duration-200 relative group cursor-pointer ${
                    currentNoteId === note.id
                      ? 'bg-blue-50 border-2 border-blue-200 text-blue-700 shadow-sm'
                      : 'hover:bg-blue-50 hover:border-blue-200 border-2 border-transparent'
                  }`}
                  onClick={() => handleNoteClick(note.id)}
                  style={{ minHeight: '60px' }}
                >
                    {editingItemId === note.id ? (
                      // Inline editing mode
                      <div className="flex-1 mr-3">
                        <input
                          type="text"
                          value={editingItemTitle}
                          onChange={(e) => setEditingItemTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleRenameSubmit();
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              handleRenameCancel();
                            }
                          }}
                          onBlur={handleRenameBlur}
                          className="w-full text-base font-medium text-gray-800 bg-transparent border border-blue-300 rounded-sm outline-none focus:outline-none focus:border-blue-500"
                          style={{ 
                            padding: '1px 2px',
                            margin: '0',
                            height: 'auto',
                            minHeight: '0',
                            lineHeight: 'inherit'
                          }}
                          data-editing-id={note.id}
                        />
                      </div>
                    ) : (
                      // Normal display mode
                      <div className="flex items-center" style={{ marginRight: '40px' }}>
                        <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-3" style={{ marginLeft: '8px' }} />
                        <span 
                          className="text-lg font-medium truncate text-blue-700"
                          style={{ marginLeft: '8px' }}
                        >
                        {note.title || `Note ${idx + 1}`}
                    </span>
                      </div>
                    )}
                                                <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const menuHeight = 80; // Approximate height of the menu
                            const windowHeight = window.innerHeight;
                            const spaceBelow = windowHeight - rect.bottom;
                            const spaceAbove = rect.top;
                            
                            // Determine if menu should open up or down
                            const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > menuHeight;
                            
                            setOpenNoteMenuId(note.id);
                            setNotePopupPosition({ 
                              x: e.clientX, 
                              y: shouldOpenUp ? rect.top - menuHeight : e.clientY 
                            });
                          }}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                          style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-2" style={{ paddingTop: '140px' }}>
        <div className="mx-auto mt-2" style={{ maxWidth: '820px' }}>
          {/* Simple editor container */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <PaginatedEditor
              content={content}
              onChange={handleContentChange}
              placeholder={activeTab === 'chapter' ? "Start writing your chapter..." : "Start writing your note..."}
              onEditorReady={handleEditorReady}
              showToolbar={false}
              fontSize={fontSize}
            />
          </div>
        </div>
      </main>
      
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Chapter Menu Popup */}
      {openChapterMenuId && chapterPopupPosition && (
        <div
          ref={chapterMenuRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
          style={{
            left: chapterPopupPosition.x,
            top: chapterPopupPosition.y,
          }}
        >
          <button
            onClick={() => {
              const chapter = chapters.find(ch => ch.id === openChapterMenuId);
              if (chapter) {
                handleRenameClick('chapter', chapter.id, chapter.title || `Chapter ${chapters.findIndex(ch => ch.id === openChapterMenuId) + 1}`);
              }
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Rename
          </button>
          {/* Show delete option only for non-first chapters */}
          {chapters.findIndex(ch => ch.id === openChapterMenuId) > 0 && (
            <button
              onClick={() => {
                const chapter = chapters.find(ch => ch.id === openChapterMenuId);
                if (chapter) {
                  handleDeleteClick('chapter', chapter.id, chapter.title || `Chapter ${chapters.findIndex(ch => ch.id === openChapterMenuId) + 1}`);
                }
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center text-red-600"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          )}
        </div>
      )}

      {/* Note Menu Popup */}
      {openNoteMenuId && notePopupPosition && (
        <div
          ref={noteMenuRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
          style={{
            left: notePopupPosition.x,
            top: notePopupPosition.y,
          }}
        >
          <button
            onClick={() => {
              const note = notes.find(n => n.id === openNoteMenuId);
              if (note) {
                handleRenameClick('note', note.id, note.title || `Note ${notes.findIndex(n => n.id === openNoteMenuId) + 1}`);
              }
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Rename
          </button>
          <button
            onClick={() => {
              const note = notes.find(n => n.id === openNoteMenuId);
              if (note) {
                handleDeleteClick('note', note.id, note.title || `Note ${notes.findIndex(n => n.id === openNoteMenuId) + 1}`);
              }
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center text-red-600"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      )}



      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div 
            className="bg-white rounded-lg p-6 w-96 max-w-md shadow-lg"
            style={{
              position: 'absolute',
              left: '280px', // Position near the sidebar
              top: '200px',  // Position below the header
            }}
          >
            <h3 className="text-lg font-semibold mb-4 text-red-600">
              Delete {deleteItemType === 'chapter' ? 'Chapter' : 'Note'}
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{deleteItemTitle}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteItemType(null);
                  setDeleteItemId(null);
                  setDeleteItemTitle('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Overview Popup */}
      {showPageOverview && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-50 flex items-center justify-center p-8"
          onClick={() => setShowPageOverview(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl w-full h-full max-w-[90vw] max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-2 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-sm font-medium text-gray-700">Page Overview</h2>
              <button
                onClick={() => setShowPageOverview(false)}
                className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Page Grid */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <div className={`grid gap-4 pb-4 ${
                chapters.length <= 5 ? 'grid-cols-4' : 
                chapters.length <= 15 ? 'grid-cols-5' : 
                'grid-cols-6'
              }`}>
                {chapters.map((chapter, index) => {
                  const chapterContent = chapterContentCache.current.get(chapter.id) || '';
                  // Calculate directly without hooks to avoid Rules of Hooks violation
                  const plainText = extractTextFromHTML(chapterContent);
                  const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
                  
                  // Adaptive sizing based on chapter count
                  const getCardSize = () => {
                    if (chapters.length <= 5) {
                      return {
                        minHeight: '240px',
                        maxHeight: '280px',
                        padding: '16px'
                      };
                    } else if (chapters.length <= 15) {
                      return {
                        minHeight: '200px',
                        maxHeight: '240px',
                        padding: '12px'
                      };
                    } else {
                      return {
                        minHeight: '180px',
                        maxHeight: '200px',
                        padding: '8px'
                      };
                    }
                  };
                  
                  const cardSize = getCardSize();
                  
                  return (
                    <div
                      key={chapter.id}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                      style={{
                        aspectRatio: '0.7',
                        minHeight: cardSize.minHeight,
                        maxHeight: cardSize.maxHeight,
                        padding: cardSize.padding,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-600" style={{ fontSize: '8px' }}>{chapter.title || `Ch ${index + 1}`}</span>
                        <span className="text-gray-400" style={{ fontSize: '8px' }}>words: {wordCount}</span>
                      </div>
                      <div
                        className="text-sm text-gray-700 leading-relaxed overflow-hidden"
                        style={{ fontSize: `${Math.max(8, fontSize * 0.4)}px` }}
                      >
                        {plainText ? plainText : <span className="text-gray-400 italic">No content</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 