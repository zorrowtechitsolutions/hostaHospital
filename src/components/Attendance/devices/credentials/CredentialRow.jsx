// src/components/devices/credentials/CredentialRow.jsx
import React, { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';

/**
 * A single credential row: label, masked value, reveal toggle, copy button.
 *
 * Props:
 *  - icon            : optional React node (small icon next to label)
 *  - label           : string, e.g. "API Key"
 *  - value           : string
 *  - maskable        : boolean (default true) — show eye toggle
 *  - defaultRevealed : boolean (default false)
 *  - highlight       : boolean (default false) — amber border for secret
 *  - helpText        : optional string shown under the field
 *  - onCopied        : optional callback after copy
 */
const CredentialRow = ({
  icon,
  label,
  value,
  maskable = true,
  defaultRevealed = false,
  highlight = false,
  helpText,
  onCopied,
}) => {
  const [revealed, setRevealed] = useState(defaultRevealed);
  const [copied, setCopied] = useState(false);

  const hasValue = !!value;
  const display = !hasValue
    ? '— not available —'
    : maskable && !revealed
    ? '•'.repeat(Math.min(value.length, 32))
    : value;

  const handleCopy = async () => {
    if (!hasValue) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="mb-4 min-w-0">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>

      <div
        className={`relative min-w-0 rounded-md border ${
          highlight
            ? 'border-amber-200 bg-amber-50/40'
            : 'border-gray-200 bg-gray-50/60'
        }`}
      >
        <div className="w-full min-w-0 px-3 py-2 pr-20 text-sm font-mono text-gray-800 break-all">
          {display}
        </div>

        {hasValue && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {maskable && (
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-white"
                title={revealed ? 'Hide' : 'Show'}
              >
                {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className={`p-1 rounded hover:bg-white ${
                copied ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Copy"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>

      {helpText && (
        <p className="text-[11px] text-gray-500 mt-1">{helpText}</p>
      )}
    </div>
  );
};

export default CredentialRow;