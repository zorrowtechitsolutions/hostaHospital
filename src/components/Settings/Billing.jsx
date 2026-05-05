// src/components/Settings/Billing.jsx - Refactored
import React, { useState } from 'react';
import { Button, Card, Badge, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Alert } from '../ui';

const Billing = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const billingHistory = [
    { id: '#IV0020', createdDate: '22 Jun 2025', amount: '$299', plan: 'Basic', status: 'Success' },
    { id: '#IV0019', createdDate: '10 Jun 2025', amount: '$399', plan: 'Standard', status: 'Success' },
    { id: '#IV0018', createdDate: '22 May 2025', amount: '$499', plan: 'Professional', status: 'Success' },
    { id: '#IV0017', createdDate: '15 May 2025', amount: '$355', plan: 'Basic', status: 'Success' },
    { id: '#IV0016', createdDate: '05 May 2025', amount: '$499', plan: 'Standard', status: 'Success' },
  ];

  const savedCards = [
    { id: 1, type: 'VISA', holderName: 'James Peterson', lastDigits: '1568', isDefault: true },
    { id: 2, type: 'Mastercard', holderName: 'Sarah Johnson', lastDigits: '2345', isDefault: false },
  ];

  const handleSetDefault = (cardId) => {
    setSelectedCard(cardId);
    alert(`Card set as default successfully!`);
  };

  const handleUpgrade = () => {
    setIsUpgrading(true);
    alert('Upgrade plan modal would open here');
    setIsUpgrading(false);
  };

  const getStatusBadge = (status) => {
    const variants = { Success: 'success', Pending: 'warning', Failed: 'danger' };
    return variants[status] || 'default';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Plan Information */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Current Plan Information</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-[#1C62A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Basic Plan</h3>
              <p className="text-gray-500 mt-2">20 Days Left</p>
              <div className="mt-6 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[#1C62A0] h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">40% used of 50GB storage</p>
            </div>
            <Button variant="primary" onClick={handleUpgrade} disabled={isUpgrading} fullWidth className="mt-4">
              {isUpgrading ? 'Processing...' : 'Upgrade Plan'}
            </Button>
          </div>
        </Card>

        {/* Saved Cards */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Saved Cards</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {savedCards.map((card) => (
                <div key={card.id} className={`p-4 rounded-lg border transition-all ${card.isDefault ? 'border-[#1C62A0] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-7 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{card.type === 'VISA' ? 'VISA' : 'MC'}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{card.holderName}</p>
                        <p className="text-sm text-gray-500">{card.type} •••• {card.lastDigits}</p>
                      </div>
                    </div>
                    {card.isDefault && <Badge variant="success">Default</Badge>}
                  </div>
                  {!card.isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => handleSetDefault(card.id)} className="mt-2 text-sm text-[#1C62A0]">
                      Set as Default
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={() => alert('Add new card form would open')} fullWidth className="mt-4 border-2 border-dashed">
              + Add New Card
            </Button>
          </div>
        </Card>
      </div>

      {/* Billing History */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Billing History</h2>
          <p className="text-sm text-gray-500 mt-1">View your past invoices and payments</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr><TableHeader>Invoice ID</TableHeader><TableHeader>Created Date</TableHeader><TableHeader>Amount</TableHeader><TableHeader>Plan</TableHeader><TableHeader>Status</TableHeader><TableHeader>Action</TableHeader></tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {billingHistory.map((invoice, idx) => (
                <TableRow key={idx} hover>
                  <TableCell><span className="text-sm font-medium text-gray-900">{invoice.id}</span></TableCell>
                  <TableCell><span className="text-sm text-gray-500">{invoice.createdDate}</span></TableCell>
                  <TableCell><span className="text-sm font-medium text-gray-900">{invoice.amount}</span></TableCell>
                  <TableCell><span className="text-sm text-gray-500">{invoice.plan}</span></TableCell>
                  <TableCell><Badge variant={getStatusBadge(invoice.status)}>{invoice.status}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="sm" onClick={() => alert(`Download invoice ${invoice.id}`)} className="text-[#1C62A0]">Download</Button></TableCell>
                </TableRow>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-500">Showing {billingHistory.length} invoices</p>
          <Button variant="ghost" size="sm" onClick={() => alert('View all invoices')} className="text-[#1C62A0]">View All</Button>
        </div>
      </Card>
    </div>
  );
};

export default Billing;