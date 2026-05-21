import React from 'react';
import { Lock } from 'lucide-react';

function ReadOnlyNotice({ message = 'Demo view is read-only. Sign in with a private staff account to make changes.' }) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
      style={{ backgroundColor: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}
    >
      <Lock size={16} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

export default ReadOnlyNotice;
