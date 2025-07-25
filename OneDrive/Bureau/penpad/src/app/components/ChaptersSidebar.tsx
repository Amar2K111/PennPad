import React from 'react';

export default function ChaptersSidebar() {
  return (
    <aside
      className="fixed top-[120px] left-0 w-56 min-h-[500px] flex flex-col p-4 z-30"
      style={{ height: 'calc(100vh - 120px)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-semibold text-gray-700">Chapters</span>
        <button
          className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
          title="Add chapter"
        >
          <span className="text-2xl leading-none">+</span>
        </button>
      </div>
      <ul className="flex flex-col gap-2">
        <li className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium cursor-pointer">Chapter 1</li>
      </ul>
    </aside>
  );
} 