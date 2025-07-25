"use client";
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../components/ToastContext';

interface BinDoc {
  id: string;
  title?: string;
  isDeleted?: boolean;
}

export default function BinPage() {
  const [binDocs, setBinDocs] = useState<BinDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [restoringDocId, setRestoringDocId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [deletingDocIds, setDeletingDocIds] = useState<string[] | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [pendingDeleteDocId, setPendingDeleteDocId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBinDocs() {
      const res = await fetch('/api/documents?bin=true');
      if (res.ok) {
        const data = await res.json();
        setBinDocs((data.documents || []).filter((doc: BinDoc) => doc.isDeleted));
      }
      setLoading(false);
    }
    fetchBinDocs();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRestore = async (docId: string) => {
    setRestoringDocId(docId);
    setOpenMenuId(null);
    
    // Find the document to get its title
    const docToRestore = binDocs.find(doc => doc.id === docId);
    const docTitle = docToRestore?.title || 'Untitled document';
    
    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isDeleted: false
        }),
      });

      if (response.ok) {
        // Remove the document from the bin list
        setBinDocs(prevDocs => prevDocs.filter(doc => doc.id !== docId));
        // Show toast notification
        showToast(`"${docTitle}" restored to dashboard`, 'success', 3000);
      } else {
        console.error('Failed to restore document');
        showToast('Failed to restore document', 'error', 3000);
      }
    } catch (error) {
      console.error('Error restoring document:', error);
      showToast('Failed to restore document', 'error', 3000);
    } finally {
      setRestoringDocId(null);
    }
  };

  const handleDeleteForever = (docId: string) => {
    setPendingDeleteDocId(docId);
    setShowDeleteModal(true);
  };

  const confirmDeleteForever = async () => {
    if (deletingDocIds && deletingDocIds.length > 0) {
      // Multi-delete
      try {
        await Promise.all(
          deletingDocIds.map(async (docId) => {
            await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
          })
        );
        setBinDocs(prevDocs => prevDocs.filter(doc => !deletingDocIds.includes(doc.id)));
        showToast('Documents permanently deleted', 'success', 3000);
      } catch (error) {
        showToast('Failed to delete documents', 'error', 3000);
      } finally {
        setShowDeleteModal(false);
        setDeletingDocIds(null);
        setSelectionMode(false);
        setSelectedDocs([]);
      }
      return;
    }
    if (!pendingDeleteDocId) return;
    setDeletingDocId(pendingDeleteDocId); // Only set loading state now
    try {
      await fetch(`/api/documents/${pendingDeleteDocId}`, { method: 'DELETE' });
      setBinDocs(prevDocs => prevDocs.filter(doc => doc.id !== pendingDeleteDocId));
      showToast('Document permanently deleted', 'success', 3000);
    } catch (error) {
      showToast('Failed to delete document', 'error', 3000);
    } finally {
      setShowDeleteModal(false);
      setDeletingDocId(null);
      setPendingDeleteDocId(null);
    }
  };

  const handleShowSelect = () => {
    setSelectionMode(true);
    setOpenMenuId(null);
  };

  const handleToggleSelect = (docId: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center gap-4 px-10 py-4 border-b border-gray-200 bg-white shadow-sm rounded-xl text-3xl">
        <Link href="/dashboard">
          <div
            className="w-10 h-10 flex items-center justify-center rounded-md transition bg-transparent hover:bg-gray-200 cursor-pointer"
            title="Back to Dashboard"
          >
            <svg
              className="w-8 h-8 text-blue-600"
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
          </div>
        </Link>
        <span className="text-base font-medium text-gray-900">Bin</span>
      </header>
      <main className="max-w-5xl mx-auto px-4 mt-[40px] mb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center border rounded bg-white shadow-sm py-12 px-4 w-full">
            <div className="text-xl font-semibold text-gray-700 mb-2">Loading...</div>
          </div>
        ) : binDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center border rounded bg-white shadow-sm py-12 px-4 w-full">
            <div className="text-xl font-semibold text-gray-700 mb-2">Bin is empty</div>
            <div className="text-gray-500 text-base">Delete a file for it to appear here.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {binDocs.map((doc: BinDoc) => (
              <div key={doc.id} className="w-full h-72 bg-white rounded-2xl shadow flex flex-col justify-between border relative">
                {/* Selection circle icon (visible if selectionMode) */}
                {selectionMode && (
                  <button
                    className={`absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full border border-black z-10 transition ${selectedDocs.includes(doc.id) ? 'bg-gray-400' : 'bg-transparent'}`}
                    onClick={() => handleToggleSelect(doc.id)}
                    tabIndex={0}
                    aria-label={selectedDocs.includes(doc.id) ? 'Deselect' : 'Select'}
                  />
                )}
                <div className="flex-1 px-4 pt-4"></div>
                <div className="border-t border-gray-200 w-full" />
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
                        <circle cx="10" cy="4" r="1.5" />
                        <circle cx="10" cy="10" r="1.5" />
                        <circle cx="10" cy="16" r="1.5" />
                      </svg>
                    </div>
                    {/* Dropdown menu */}
                    {openMenuId === doc.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 bottom-10 z-50 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-2 translate-x-1/2"
                      >
                        <button 
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium" 
                          onClick={e => {
                            e.stopPropagation();
                            handleShowSelect();
                          }}
                        >
                          Select
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium disabled:opacity-50" 
                          onClick={e => {
                            e.stopPropagation();
                            handleRestore(doc.id);
                          }}
                          disabled={restoringDocId === doc.id}
                        >
                          {restoringDocId === doc.id ? 'Restoring...' : 'Restore'}
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500 font-medium" 
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteForever(doc.id);
                          }}
                        >
                          Delete forever
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <div className="text-lg font-semibold text-gray-900 mb-2">Are you sure you want to delete?</div>
            <div className="text-gray-600 mb-6 text-sm">If you delete this document, it will be permanently removed and cannot be recovered.</div>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
                onClick={() => { setShowDeleteModal(false); setDeletingDocId(null); setDeletingDocIds(null); }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 font-medium flex items-center justify-center min-w-[80px]"
                onClick={confirmDeleteForever}
                disabled={!!deletingDocId}
              >
                {deletingDocId ? (
                  <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating action panel for selection mode */}
      {selectionMode && (
        <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center bg-white rounded-xl shadow-lg p-4 gap-3 border border-gray-200">
          <button
            className="w-24 px-4 py-2 rounded-md bg-white text-black font-semibold border border-black hover:bg-gray-100 transition"
            onClick={() => {
              setSelectedDocs(binDocs.map(doc => doc.id));
            }}
          >
            Select all
          </button>
          <button
            className="w-24 px-4 py-2 rounded-md bg-black text-white font-semibold border border-black hover:bg-gray-800 transition"
            onClick={() => {
              setSelectedDocs([]);
            }}
          >
            Deselect all
          </button>
          <button
            className="w-24 px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            onClick={() => {
              setSelectionMode(false);
              setSelectedDocs([]);
            }}
          >
            Cancel
          </button>
          <button
            className="w-24 px-4 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition"
            onClick={() => {
              setDeletingDocIds(selectedDocs);
              setShowDeleteModal(true);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
} 