// src/components/devices/CredentialsDrawer.jsx
import React, { useState } from 'react';
import {
  X,
  Info,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Hash,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../../ui/button';
import CredentialRow from './CredentialRow';

const CredentialsDrawer = ({
  isOpen,
  onClose,
  deviceId,
  apiKey,
  secretKey,
  onRegenerate,
  isRegenerating,
  defaultReveal = false,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      <aside className="fixed top-0 right-0 h-full w-full max-w-md min-w-0 bg-white z-50 shadow-2xl border-l border-gray-200 flex flex-col overflow-x-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Device Credentials</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-5">
          <div className="flex gap-2 p-3 rounded-md bg-blue-50 border border-blue-100 text-xs text-blue-800 mb-5">
            <Info size={14} className="shrink-0 mt-0.5" />
            <p>
              These credentials are used by the RFID device to authenticate
              with Hosta backend. Keep them secure and do not share with
              unauthorized people.
            </p>
          </div>

          <CredentialRow
            icon={<Hash size={14} className="text-gray-500" />}
            label="Device ID"
            value={deviceId}
            maskable={false}
          />

          <CredentialRow
            icon={<KeyRound size={14} className="text-gray-500" />}
            label="API Key"
            value={apiKey}
            defaultRevealed={defaultReveal}
            helpText="Use this key for device authentication."
          />

          <CredentialRow
            icon={<ShieldCheck size={14} className="text-gray-500" />}
            label="Secret Key"
            value={secretKey}
            defaultRevealed={defaultReveal}
            highlight
            helpText="Keep this key secure. It will be shown only once when generated or regenerated."
          />

          <div className="flex gap-2 p-3 rounded-md bg-amber-50 border border-amber-100 text-xs text-amber-800 mb-5">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <p>If you suspect the key has been exposed, regenerate it immediately.</p>
          </div>

          <Button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="w-full flex items-center justify-center gap-2 mb-3"
          >
            {isRegenerating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            {isRegenerating ? 'Regenerating…' : 'Regenerate Credentials'}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </aside>
    </>
  );
};

export default CredentialsDrawer;