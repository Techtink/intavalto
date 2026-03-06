import { useState, useRef, useEffect } from 'react';

const EMOJIS = [
  '💬', '📢', '🐛', '✨', '🚀', '💡', '🔧', '📝', '🎯', '🏷️',
  '📦', '🛒', '🌐', '📱', '💻', '🖥️', '⚙️', '🔒', '🔑', '📊',
  '📈', '🎨', '🎮', '🎵', '📷', '🎬', '📚', '🏠', '❤️', '⭐',
  '🔥', '⚡', '💎', '🏆', '🎉', '👍', '👥', '💰', '🛡️', '🔔',
  '📌', '🗂️', '📋', '🗳️', '💼', '🏗️', '🔍', '📡', '🧩', '🤖',
];

export default function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(!open)}
          className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
          {value || '😀'}
        </button>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} readOnly
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 text-lg"
          placeholder="Click to pick" />
      </div>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30 p-2 w-full min-w-[200px]">
          <div className="grid grid-cols-10 gap-0.5">
            {EMOJIS.map(emoji => (
              <button key={emoji} type="button"
                onClick={() => { onChange(emoji); setOpen(false); }}
                className="w-7 h-7 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
