import { useEffect, useRef } from 'react';

const EMOJIS = [
  '💬', '📢', '🐛', '✨', '🚀', '💡', '🔧', '📝', '🎯', '🏷️',
  '📦', '🛒', '🌐', '📱', '💻', '🖥️', '⚙️', '🔒', '🔑', '📊',
  '📈', '🎨', '🎮', '🎵', '📷', '🎬', '📚', '🏠', '❤️', '⭐',
  '🔥', '⚡', '💎', '🏆', '🎉', '👍', '👥', '💰', '🛡️', '🔔',
  '📌', '🗂️', '📋', '🗳️', '💼', '🏗️', '🔍', '📡', '🧩', '🤖',
  '😀', '😂', '😍', '🤔', '😎', '👋', '🙏', '💪', '✅', '❌',
];

export default function EmojiPickerPopup({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30 p-2 w-[280px]">
      <div className="grid grid-cols-10 gap-0.5">
        {EMOJIS.map(emoji => (
          <button key={emoji} type="button"
            onClick={() => onSelect(emoji)}
            className="w-7 h-7 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
