"use client";
import { useUserStore } from '../store/useUserStore';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '../client-lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuthRestore } from '../store/useAuthRestore';
import { Fragment } from 'react';

export default function SettingsPage() {
  // All hooks at the top!
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const setUser = useUserStore((state) => state.setUser);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const requiredPhrase = 'i understand deletions are irreversible';
  const [billingLoading, setBillingLoading] = useState(false);

  useAuthRestore(setLoading);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth/signin');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !(dropdownRef.current as any).contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading || !isAuthenticated) return null;

  const avatarLetter = user?.email ? user.email[0].toUpperCase() : 'A';
  const displayName = user?.displayName ? user.displayName : '';
  const email = user?.email || '';

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar (copied from dashboard) */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white mt-2 shadow-sm rounded-xl">
        <div className="flex items-center gap-2">
          <div className="text-blue-600 font-bold text-2xl">PennPad</div>
        </div>
        <div className="flex-1" />
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
                  <div className="w-9 h-9 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-sm">{avatarLetter}</div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{displayName}</div>
                    <div className="text-gray-700 text-xs">{email}</div>
                  </div>
                </div>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 font-medium rounded-b-xl text-sm"
                  onClick={() => { setDropdownOpen(false); router.push('/settings'); }}
                >
                  Settings
                </button>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-500 font-medium rounded-b-xl text-sm"
                  onClick={async () => {
                    setDropdownOpen(false);
                    logout();
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
      {/* Main settings content */}
      <div className="max-w-xl mx-auto py-10 px-4">
        {/* Back button */}
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>

        {/* Avatar, name, email left-aligned */}
        <div className="mb-8 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/>
            </svg>
          </div>
          <div>
            {displayName ? (
              <div className="text-base text-gray-900">{displayName}</div>
            ) : (
              <div className="text-base text-gray-400 italic">No name set</div>
            )}
            <div className="text-sm text-gray-500">{email}</div>
          </div>
        </div>

        {/* Personal details */}
        <div className="mb-8">
          <h2 className="font-bold text-lg mb-2">Personal details</h2>
          <div className="mb-2 text-sm text-gray-500"><span className='font-semibold text-gray-700'>Edit name</span><br/>This will be visible on your profile.</div>
          <div className="flex items-center justify-between mb-2">
            {editingName ? (
              <>
                <input
                  className="border px-2 py-1 rounded text-base mr-2 w-40"
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  disabled={saving}
                  autoFocus
                />
                <button
                  className="bg-blue-600 text-white px-3 py-1 rounded mr-2 text-sm font-medium disabled:opacity-50"
                  disabled={saving || !newDisplayName.trim() || newDisplayName === displayName}
                  onClick={async () => {
                    setSaving(true);
                    const res = await fetch('/api/me', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ displayName: newDisplayName.trim() })
                    });
                    setSaving(false);
                    if (res.ok) {
                      if (user) {
                        setUser({ 
                          ...user, 
                          displayName: newDisplayName.trim(),
                          id: user.id,
                          email: user.email,
                          createdAt: user.createdAt,
                          isPremium: user.isPremium,
                          lastLoginAt: user.lastLoginAt
                        });
                      }
                      setEditingName(false);
                    } else {
                      // Optionally show error
                    }
                  }}
                >{saving ? 'Saving...' : 'Save'}</button>
                <button
                  className="border px-3 py-1 rounded text-sm font-medium"
                  disabled={saving}
                  onClick={() => { setEditingName(false); setNewDisplayName(displayName); }}
                >Cancel</button>
              </>
            ) : (
              <>
                <span className="text-base">{displayName}</span>
                <button
                  className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 ml-2"
                  onClick={() => setEditingName(true)}
                >Edit</button>
              </>
            )}
          </div>
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-sm font-semibold text-gray-700">Email address</div>
              <div className="text-base text-gray-700">{email}</div>
            </div>
            <span className="text-xs text-gray-400 flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" /></svg>Cannot be changed</span>
          </div>
        </div>

        {/* Manage account */}
        <div className="mb-8">
          <h2 className="font-bold text-lg mb-2">Manage account</h2>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Delete account</div>
              <div className="text-xs text-gray-400">Permanently delete your account.</div>
            </div>
            <button className="bg-red-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-600"
              onClick={() => setShowDeleteModal(true)}
            >Delete</button>
          </div>
        </div>

        {/* Subscription Plan */}
        <div className="mb-8">
          <h2 className="font-bold text-lg mb-2">Subscription Plan</h2>
          <div className="text-green-600 font-semibold text-base">Premium</div>
        </div>

        {/* Billing Center */}
        <div>
          <h2 className="font-bold text-lg mb-2">Billing Center</h2>
          <div className="text-sm text-gray-500 mb-1">Open Billing Center</div>
          <div className="text-xs text-gray-400 mb-2">Edit card details and access invoices.</div>
          <div className="flex justify-end">
            <button
              className="bg-black text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-900 disabled:opacity-50"
              disabled={billingLoading}
              onClick={async () => {
                setBillingLoading(true);
                const res = await fetch('/api/stripe/create-billing-portal-session', { method: 'POST' });
                setBillingLoading(false);
                if (res.ok) {
                  const data = await res.json();
                  window.location.href = data.url;
                } else {
                  alert('Failed to open billing center.');
                }
              }}
            >{billingLoading ? 'Loading...' : 'Open Billing Center'}</button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}>&times;</button>
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
              </svg>
              <h2 className="text-xl font-bold text-center mb-2 text-gray-900">Warning: Account Deletion</h2>
              <p className="text-center text-gray-700 mb-4">To delete your account, please type the text below. All your data will be immediately wiped. PennPad cannot recover any data after deletion.</p>
              <div className="bg-gray-100 rounded px-3 py-2 text-sm text-gray-700 mb-2 w-full text-center">{requiredPhrase}</div>
              <input
                className="border px-3 py-2 rounded w-full mb-4 text-center"
                placeholder="Type confirmation text here"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                disabled={deleting}
              />
              <button
                className="bg-red-500 text-white px-5 py-2 rounded-lg font-semibold w-full disabled:opacity-50"
                disabled={deleteConfirmText !== requiredPhrase || deleting}
                onClick={async () => {
                  setDeleting(true);
                  const res = await fetch('/api/me', { method: 'DELETE' });
                  setDeleting(false);
                  if (res.ok) {
                    logout();
                    await fetch('/api/logout', { method: 'POST' });
                    router.push('/auth/signin');
                  } else {
                    alert('Failed to delete account. Please try again.');
                  }
                }}
              >{deleting ? 'Deleting...' : 'Delete Account'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 