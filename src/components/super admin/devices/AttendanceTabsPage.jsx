// src/components/super-admin/devices/AttendanceTabsPage.jsx
import React from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, IdCard, Fingerprint } from 'lucide-react';
import { Button } from '../../ui/button';
import { Breadcrumb } from '../../ui/Breadcrumb';

import HospitalAssignAccessCardList from './HospitalAssignAccessCardList';
import HospitalAssignFingerprintList from './HospitalAssignFingerprintList';

const TABS = [
  { id: 'access-card', label: 'Access Cards', icon: IdCard, hint: 'RFID / NFC cards' },
  { id: 'fingerprint', label: 'Fingerprints', icon: Fingerprint, hint: 'Biometric enrollment' },
];

const AttendanceTabsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hospitalId: routeHospitalId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const stateHospitalId = location.state?.hospitalId || null;
  const stateHospitalName = location.state?.hospitalName || null;

  const hospitalId = routeHospitalId || stateHospitalId || null;
  const hospitalName = stateHospitalName || null;

  const activeTab = searchParams.get('tab') || 'access-card';

  const setActiveTab = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', id);
    setSearchParams(next, { replace: true });
  };

  const handleBack = () => {
    if (hospitalId) {
      navigate(`/super-admin/hospitals/${hospitalId}`, {
        state: { hospitalId, hospitalName },
      });
    } else {
      navigate('/super-admin/hospitals');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 md:p-6 font-sans text-gray-800">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleBack}
          className="flex items-center gap-1.5"
        >
          <ArrowLeft size={16} />
          {hospitalId ? 'Back to Hospital' : 'Back to Hospitals'}
        </Button>
      </div>

      <Breadcrumb
        items={
          hospitalId
            ? [
                { label: 'Super Admin', path: '/super-admin' },
                { label: 'Hospitals', path: '/super-admin/hospitals' },
                {
                  label: hospitalName || 'Hospital',
                  path: `/super-admin/hospitals/${hospitalId}`,
                },
                { label: 'Attendance Devices' },
              ]
            : [
                { label: 'Super Admin', path: '/super-admin' },
                { label: 'Attendance Devices' },
              ]
        }
      />

      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Attendance Devices</h1>
        <p className="text-sm text-gray-500 mt-1">
          {hospitalId
            ? `Manage access cards and fingerprints for ${hospitalName || 'this hospital'}`
            : 'Manage access cards and fingerprint enrollments across hospitals'}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-5 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-medium transition-colors border-b-2',
                  isActive
                    ? 'border-[#1C62A0] text-[#1C62A0] bg-blue-50/40'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                ].join(' ')}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                <span
                  className={[
                    'hidden md:inline text-xs',
                    isActive ? 'text-[#1C62A0]/70' : 'text-gray-400',
                  ].join(' ')}
                >
                  · {tab.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-0">
        {activeTab === 'access-card' && (
          <HospitalAssignAccessCardList
            embedded
            hospitalId={hospitalId}
            hospitalName={hospitalName}
            hideBackButton
            basePath="/super-admin/device/access-card"
          />
        )}
        {activeTab === 'fingerprint' && (
          <HospitalAssignFingerprintList
            embedded
            hospitalId={hospitalId}
            hospitalName={hospitalName}
            hideBackButton
            basePath="/super-admin/device/fingerprint"
          />
        )}
      </div>
    </div>
  );
};

export default AttendanceTabsPage;