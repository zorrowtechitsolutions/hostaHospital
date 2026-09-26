// src/components/devices/DeviceCredentialsModal.jsx
import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  KeyRound,
  ShieldCheck,
  Hash,
} from 'lucide-react';
import { Button } from '../../../ui/button';
import CredentialRow from './CredentialRow';

/* ============================================================ */
/* Main modal — wraps the credentials view in a centered dialog */
/* ============================================================ */
const DeviceCredentialsModal = ({
  isOpen,
  credentials,
  title = 'Device Credentials',
  subtitle = 'Save these credentials now. The Secret Key will not be shown again for security reasons.',
  onClose,
}) => {
  if (!isOpen || !credentials) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <CredentialsView
          credentials={credentials}
          title={title}
          subtitle={subtitle}
          onFinish={onClose}
        />
      </div>
    </div>
  );
};

/* ============================================================ */
/* CREDENTIALS VIEW                                              */
/* ============================================================ */
export const CredentialsView = ({
  credentials,
  title = 'Device Registered Successfully',
  subtitle = 'Save these credentials now. The Secret Key will not be shown again for security reasons.',
  onFinish,
}) => {
  const [copiedAll, setCopiedAll] = useState(false);

  const copyAll = async () => {
    const text =
      `Device ID: ${credentials.deviceId}\n` +
      `API Key: ${credentials.apiKey}\n` +
      `Secret Key: ${credentials.secretKey}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <>
      <div className="flex items-start justify-between p-6 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center shrink-0 border border-green-100">
            <CheckCircle2 className="text-green-600" size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start gap-2 mb-5 p-3 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>
            {credentials.warning ||
              'Please save the secret key securely. It will not be shown again.'}
          </span>
        </div>

        <CredentialRow
          icon={<Hash size={16} className="text-gray-500" />}
          label="Device ID"
          value={credentials.deviceId}
          maskable={false}
        />

        <CredentialRow
          icon={<KeyRound size={16} className="text-gray-500" />}
          label="API Key"
          value={credentials.apiKey}
          defaultRevealed
        />

        <CredentialRow
          icon={<ShieldCheck size={16} className="text-gray-500" />}
          label="Secret Key"
          value={credentials.secretKey}
          defaultRevealed
          highlight
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
        <button
          type="button"
          onClick={copyAll}
          className={`flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-md border transition-colors ${
            copiedAll
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {copiedAll ? (
            <>
              <Check size={14} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy All
            </>
          )}
        </button>

        <Button
          type="button"
          onClick={onFinish}
          className="flex items-center justify-center gap-2 bg-[#1C62A0] hover:bg-[#154a7a] text-white px-6"
        >
          <Check size={16} />
          Done
        </Button>
      </div>
    </>
  );
};

export default DeviceCredentialsModal;