import React, { useState } from 'react';

const Billing = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Billing history data
  const billingHistory = [
    { id: '#IV0020', createdDate: '22 Jun 2025', amount: '$299', plan: 'Basic', status: 'Success' },
    { id: '#IV0019', createdDate: '10 Jun 2025', amount: '$399', plan: 'Standard', status: 'Success' },
    { id: '#IV0018', createdDate: '22 May 2025', amount: '$499', plan: 'Professional', status: 'Success' },
    { id: '#IV0017', createdDate: '15 May 2025', amount: '$355', plan: 'Basic', status: 'Success' },
    { id: '#IV0016', createdDate: '05 May 2025', amount: '$499', plan: 'Standard', status: 'Success' },
  ];

  // Saved cards data
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'Success':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan and Saved Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Plan Information */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="w-full mt-4 px-4 py-2 bg-[#1C62A0] hover:bg-[#1C62A0] text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              {isUpgrading ? 'Processing...' : 'Upgrade Plan'}
            </button>
          </div>
        </div>

        {/* Saved Cards */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Saved Cards</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {savedCards.map((card) => (
                <div
                  key={card.id}
                  className={`p-4 rounded-lg border transition-all ${
                    card.isDefault 
                      ? 'border-[#1C62A0] bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-7 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{card.type === 'VISA' ? 'VISA' : 'MC'}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{card.holderName}</p>
                        <p className="text-sm text-gray-500">
                          {card.type} •••• {card.lastDigits}
                        </p>
                      </div>
                    </div>
                    {card.isDefault && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  {!card.isDefault && (
                    <button
                      onClick={() => handleSetDefault(card.id)}
                      className="mt-2 text-sm text-[#1C62A0] hover:text-[#1C62A0] font-medium"
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => alert('Add new card form would open')}
              className="w-full mt-4 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 font-medium rounded-lg hover:border-[#1C62A0] hover:text-[#1C62A0] transition-colors"
            >
              + Add New Card
            </button>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Billing History</h2>
          <p className="text-sm text-gray-500 mt-1">View your past invoices and payments</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {billingHistory.map((invoice, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{invoice.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">{invoice.createdDate}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{invoice.amount}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">{invoice.plan}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => alert(`Download invoice ${invoice.id}`)}
                      className="text-[#1C62A0] hover:text-[#1C62A0] font-medium text-sm"
                    >
                      Download
                    </button>
                   </td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Showing {billingHistory.length} invoices</p>
            <button
              onClick={() => alert('View all invoices')}
              className="text-sm text-[#1C62A0] hover:text-[#1C62A0] font-medium"
            >
              View All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;