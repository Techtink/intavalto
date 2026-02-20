import React from 'react';

const MENTION_REGEX = /@([a-zA-Z0-9_]{2,20})/g;

export default function MentionText({ children, className = '' }) {
  const text = children || '';
  const parts = [];
  let lastIndex = 0;
  let match;

  const regex = new RegExp(MENTION_REGEX.source, 'g');
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} className="text-[#50ba4b] font-medium">
        {match[0]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
}
