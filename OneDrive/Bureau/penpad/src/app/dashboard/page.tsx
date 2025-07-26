'use client'

import { useUserStore } from '../store/useUserStore';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthRestore } from '../store/useAuthRestore';
import { useToast } from '../components/ToastContext';
import type { Document } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  // All hooks must be called in the same order every time
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { showToast } = useToast();
  
  // Authentication hook
  useAuthRestore(setLoading);
  
  // All other state hooks
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameDocId, setRenameDocId] = useState<string | null>(null);
  const [renameLoading, setRenameLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [creatingDoc, setCreatingDoc] = useState(false);
  const [clickedDocId, setClickedDocId] = useState<string | null>(null);
  
  // All ref hooks
  const dropdownRef = useRef(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRenameRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Computed values
  const avatarLetter = user?.email ? user.email[0].toUpperCase() : 'A';
  const displayName = user?.displayName || 'User';
  const email = user?.email || '';

  // Authentication effect - must come after all hooks
  useEffect(() => {
    // Only redirect if we're done loading and still not authenticated
    if (!loading && !isAuthenticated) {
      router.replace('/auth/signin');
    }
  }, [loading, isAuthenticated, router]);

  // Show loading screen while authentication is being restored
  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-blue-600 font-medium text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && (dropdownRef.current as HTMLElement).contains(event.target as Node)) return;
      setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && (menuRef.current as HTMLElement).contains(event.target as Node)) return;
      setOpenMenuId(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Define fetchDocuments before using it in useEffect
  const fetchDocuments = async () => {
    const res = await fetch('/api/documents');
    if (res.ok) {
      const data = await res.json();
      // Only show documents that are not deleted
      setDocuments((data.documents || []).filter((doc: Document) => !doc.isDeleted));
    }
  };

  useEffect(() => {
    // Only fetch documents when user is authenticated and not loading
    if (!loading && isAuthenticated) {
      fetchDocuments();
    }
  }, [loading, isAuthenticated]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchQuery('');
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSearchQuery('');
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (!searchQuery || documents.length === 0) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlightedIndex(idx => (idx + 1) % documents.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlightedIndex(idx => (idx - 1 + documents.length) % documents.length);
      } else if (event.key === 'Enter' && highlightedIndex >= 0) {
        event.preventDefault();
        const doc = documents[highlightedIndex];
        if (doc) {
          router.push(`/document/${doc.id}`);
          setSearchQuery('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchQuery, documents, highlightedIndex, router]);

  const handleCreateBlankBook = async () => {
    setCreatingDoc(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled document', content: '' })
      });
      const data = await res.json();
      if (data && data.id) {
        // Refresh documents list after creating new document
        await fetchDocuments();
        router.push(`/document/${data.id}`);
      } else {
        showToast('Failed to create new document', 'error', 3000);
      }
    } catch (error) {
      showToast('Failed to create new document', 'error', 3000);
    } finally {
      setCreatingDoc(false);
    }
  };

  const handleDocumentClick = async (docId: string) => {
    setClickedDocId(docId);
    setLoadingDocId(docId);
    console.log('Clicked document:', docId); // Debug log
    try {
      // Add a small delay to make the loading icon visible
      await new Promise(resolve => setTimeout(resolve, 500));
      await router.push(`/document/${docId}`);
    } catch (error) {
      console.error('Error navigating to document:', error);
    } finally {
      setLoadingDocId(null);
      setClickedDocId(null);
    }
  };

  // Open rename modal
  const openRenameModal = useCallback((doc: Document) => {
    setRenameDocId(doc.id);
    setRenameValue(doc.title || '');
    setRenameModalOpen(true);
    setOpenMenuId(null);
    setTimeout(() => inputRenameRef.current?.select(), 100);
  }, []);

  // Close rename modal
  const closeRenameModal = useCallback(() => {
    setRenameModalOpen(false);
    setRenameValue('');
    setRenameDocId(null);
  }, []);

  // Handle rename OK
  const handleRenameOk = useCallback(async () => {
    if (!renameDocId || !renameValue.trim()) return;
    setRenameLoading(true);
    try {
      await fetch(`/api/documents/${renameDocId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameValue.trim() }),
      });
      setDocuments((docs: Document[]) => docs.map(doc => doc.id === renameDocId ? { ...doc, title: renameValue.trim() } : doc));
      closeRenameModal();
    } finally {
      setRenameLoading(false);
    }
  }, [renameDocId, renameValue, closeRenameModal]);

  // Soft delete (move to bin)
  const handleRemove = async (docId: string) => {
    // Find the document to get its title
    const docToRemove = documents.find(doc => doc.id === docId);
    const docTitle = docToRemove?.title || 'Untitled document';
    
    await fetch(`/api/documents/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDeleted: true }),
    });
    setDocuments((docs: Document[]) => docs.filter(doc => doc.id !== docId));
    
    // Show toast notification with UNDO
    showToast(
      'Moved to the bin',
      'success',
      4000,
      {
        actionLabel: 'UNDO',
        onAction: async () => {
          // Restore the document
          await fetch(`/api/documents/${docId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isDeleted: false }),
          });
          // Add the document back to the list
          setDocuments((docs: Document[]) => docToRemove ? [docToRemove, ...docs] : docs);
        }
      }
    );
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title
      .toLowerCase()
      .split(' ')
      .some(word => word.startsWith(searchQuery.toLowerCase()))
  );

  // Reset highlight when searchQuery changes
  useEffect(() => {
    setHighlightedIndex(filteredDocuments.length > 0 ? 0 : -1);
  }, [searchQuery, filteredDocuments.length]);



  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white mt-2 shadow-sm rounded-xl">
        <div className="flex items-center gap-2">
          <div className="text-blue-600 font-bold text-2xl">PennPad</div>
        </div>
        <div className="flex-1 mx-8 flex justify-center">
          <div className="relative" ref={searchContainerRef}>
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          <input
            type="text"
            placeholder="Search"
              className="w-[800px] pl-12 pr-4 py-3 border rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {/* Search dropdown */}
            {searchQuery && (
              <div className="absolute left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc, idx) => (
                    <div
                      key={doc.id}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition cursor-pointer ${highlightedIndex === idx ? 'bg-blue-100' : ''} ${
                        loadingDocId === doc.id ? 'pointer-events-none' : ''
                      } relative`}
                      onClick={() => handleDocumentClick(doc.id)}
                      tabIndex={-1}
                    >
                      {loadingDocId === doc.id && (
                        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                      {/* Pen icon (same as bin) */}
                      <svg
                        className="w-6 h-6 text-blue-600 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 3.487a2.25 2.25 0 013.182 3.182L7.5 19.212l-4 1 1-4L16.862 3.487z"
                        />
                      </svg>
                      <span className="text-base text-gray-900 font-medium truncate">{doc.title || 'Untitled document'}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-base">No results found</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center bg-white border border-gray-300 rounded-full px-3 py-1 shadow-sm focus:outline-none"
              onClick={() => setDropdownOpen((open) => !open)}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/>
                </svg>
              </div>
              <svg
                className="ml-2 w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                <div className="flex items-center gap-3 px-3 py-2 border-b">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    <svg className="w-7 h-7 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{displayName}</div>
                    <div className="text-gray-500 text-xs">{email}</div>
                  </div>
                </div>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 font-medium rounded-b-xl text-sm"
                  onClick={() => { setDropdownOpen(false); router.push('/settings'); }}
                >
                  Settings
                </button>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 font-medium text-sm"
                  onClick={() => { setDropdownOpen(false); router.push('/bin'); }}
                >
                  Bin
                </button>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-500 font-medium rounded-b-xl text-sm"
                  onClick={async () => {
                    setDropdownOpen(false);
                    await fetch('/api/logout', { method: 'POST' });
                    router.push('/auth/signin');
                  }}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Start a new book - full width */}
      <div className="w-full bg-gray-50 pt-4 pb-8 mb-8">
        <div className="max-w-5xl mx-auto px-4">
          <section>
            <h2 className="text-base font-semibold text-gray-700 mb-2">Start a new book</h2>
            <div className="flex gap-6">
              {/* Blank book card */}
              <div className="w-36 h-40 bg-white rounded-xl shadow flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition relative" onClick={handleCreateBlankBook}>
                {creatingDoc && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
                <div className="text-5xl text-blue-500 mb-2">+</div>
                <div className="text-sm text-gray-700 font-medium">Blank book</div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-4">
        {/* Recent books */}
        <section className="mt-[-20px]">
          <h2 className="text-base font-semibold text-gray-700 mb-4 -ml-8">Recent books</h2>
          {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center border rounded bg-white shadow-sm py-12 px-4 w-full">
            <div className="text-xl font-semibold text-gray-700 mb-2">No books yet</div>
            <div className="text-gray-500 text-base">Select a blank book above to get started</div>
          </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
              {documents.map((doc: Document) => (
                <div
                  key={doc.id}
                  className={`w-full h-72 bg-white rounded-2xl shadow flex flex-col justify-between cursor-pointer border transition-all hover:border-blue-500 hover:shadow-lg relative ${
                    loadingDocId === doc.id ? 'pointer-events-none' : ''
                  }`}
                  onClick={() => handleDocumentClick(doc.id)}
                >
                  {/* Preview area (empty for now) with loading spinner if loading */}
                  <div className="flex-1 px-4 pt-4 flex items-center justify-center relative">
                    {loadingDocId === doc.id && (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                    {/* Loading icon in the center of the preview area */}
                    {clickedDocId === doc.id && (
                      <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-90">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  {/* Divider */}
                  <div className="border-t border-gray-200 w-full" />
                  {/* Title at the bottom */}
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between relative">
                      <div className="font-medium text-gray-900 text-sm truncate text-left">{doc.title || 'Untitled document'}</div>
                      {/* Three-dot menu icon */}
                      <div
                        className="ml-2 p-2 rounded-full hover:bg-gray-200 transition flex items-center justify-center cursor-pointer"
                        onClick={e => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                        }}
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <circle cx="10" cy="6" r="1.5" />
                          <circle cx="10" cy="10" r="1.5" />
                          <circle cx="10" cy="14" r="1.5" />
                        </svg>
                      </div>
                      {/* Dropdown menu */}
                      {openMenuId === doc.id && (
                        <div
                          ref={menuRef}
                          className="absolute -right-24 bottom-10 z-50 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2"
                        >
                          <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium" onClick={e => { e.stopPropagation(); openRenameModal(doc); }}>Rename</button>
                          <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium" onClick={e => { e.stopPropagation(); handleRemove(doc.id); }}>Remove</button>
                          <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium" onClick={e => { e.stopPropagation(); window.open(`/document/${doc.id}`, '_blank'); }}>Open in new tab</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Rename Modal */}
      {renameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Dimmed background */}
          <div className="absolute inset-0 bg-black opacity-40"></div>
          {/* Modal content */}
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm z-10 flex flex-col">
            <div className="text-xl font-medium mb-1">Rename</div>
            <div className="mb-3 text-gray-500 text-sm">Please enter a new name for the item:</div>
            <input
              ref={inputRenameRef}
              className="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition"
                onClick={closeRenameModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition flex items-center justify-center min-w-[56px]"
                onClick={handleRenameOk}
                disabled={!renameValue.trim() || renameLoading}
              >
                {renameLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : (
                  'OK'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 