import { useState, useRef, useCallback } from 'react';
import EmojiPickerPopup from './EmojiPickerPopup';

export default function TextareaWithEmoji({ value, onChange, placeholder, rows = 3, className = '', required, id }) {
  const [showPicker, setShowPicker] = useState(false);
  const textareaRef = useRef(null);

  const handleEmojiSelect = useCallback((emoji) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newValue = value.substring(0, start) + emoji + value.substring(end);
    onChange(newValue);
    setShowPicker(false);
    // Restore cursor position after emoji
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
    });
  }, [value, onChange]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={className}
        required={required}
        id={id}
      />
      <div className="absolute top-1.5 right-1.5">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-sm"
          title="Add emoji"
        >
          😀
        </button>
        {showPicker && (
          <EmojiPickerPopup
            onSelect={handleEmojiSelect}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    </div>
  );
}
