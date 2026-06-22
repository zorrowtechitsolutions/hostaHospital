// src/components/HelpSupport/HelpSupport.jsx - Only Contact Us
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Phone,
  X,
} from 'lucide-react';
import { Button, Card } from '../ui';
import { showSuccessToast } from '../ui/Toast';

const HelpSupport = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-200 rounded transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Contact Us</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Contact Us</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Contact Us</h1>
        <p className="text-sm text-gray-500 mt-1">Get in touch with our support team</p>
      </div>

      {/* Contact Card - Only Phone and Email */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">
              Contact Us
            </h3>
          </div>

          <div className="p-6 space-y-4">
            {/* Phone */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Phone className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">1234567890</span>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Mail className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">
                mpmuhammedsafvan@gmail.com
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HelpSupport;