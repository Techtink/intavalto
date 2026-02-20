import { useState, useRef, useCallback, useEffect } from 'react';
import EmojiPickerPopup from './EmojiPickerPopup';
import api from '../utils/api';

export default function MentionTextarea({ value, onChange, placeholder, rows = 3, className = '', required, id }) {
  const [showPicker, setShowPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef(null);
  const debounceRef = useRef(null);

  const handleEmojiSelect = useCallback((emoji) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newValue = value.substring(0, start) + emoji + value.substring(end);
    onChange(newValue);
    setShowPicker(false);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
    });
  }, [value, onChange]);

  // Detect @mention trigger
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    onChange(newValue);

    const ta = e.target;
    const cursor = ta.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursor);
    const match = textBeforeCursor.match(/@(\w{2,})$/);

    if (match) {
      setMentionQuery(match[1]);
      setShowMentions(true);
      setSelectedIndex(0);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  }, [onChange]);

  // Debounced user search
  useEffect(() => {
    if (!mentionQuery || mentionQuery.length < 2) {
      setMentionResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/users/search?q=${encodeURIComponent(mentionQuery)}`);
        setMentionResults(data);
      } catch {
        setMentionResults([]);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [mentionQuery]);

  const insertMention = useCallback((username) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const cursor = ta.selectionStart;
    const textBeforeCursor = value.substring(0, cursor);
    const match = textBeforeCursor.match(/@(\w*)$/);
    if (!match) return;

    const start = cursor - match[0].length;
    const newValue = value.substring(0, start) + `@${username} ` + value.substring(cursor);
    onChange(newValue);
    setShowMentions(false);
    setMentionQuery('');
    setMentionResults([]);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + username.length + 2; // @username + space
      ta.setSelectionRange(pos, pos);
    });
  }, [value, onChange]);

  const handleKeyDown = useCallback((e) => {
    if (!showMentions || mentionResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % mentionResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + mentionResults.length) % mentionResults.length);
    } else if (e.key === 'Enter' && showMentions) {
      e.preventDefault();
      insertMention(mentionResults[selectedIndex].username);
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  }, [showMentions, mentionResults, selectedIndex, insertMention]);

  const API_ORIGIN = (process.env.REACT_APP_API_URL || `${window.location.origin}/api`).replace('/api', '');

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
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
      {showMentions && mentionResults.length > 0 && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-40 max-h-48 overflow-y-auto">
          {mentionResults.map((user, i) => (
            <button
              key={user.id}
              type="button"
              onClick={() => insertMention(user.username)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                i === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-[#50ba4b] flex items-center justify-center text-white text-[10px] font-bold overflow-hidden flex-shrink-0">
                {user.avatar ? (
                  <img src={`${API_ORIGIN}${user.avatar}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  (user.username || '?')[0].toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <span className="text-gray-900 dark:text-gray-100 font-medium">{user.username}</span>
                {user.displayName && user.displayName !== user.username && (
                  <span className="text-gray-400 dark:text-gray-500 ml-1">{user.displayName}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
