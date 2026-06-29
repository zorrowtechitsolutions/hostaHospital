// src/components/super-admin/HospitalPatientsList.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, User, Phone, Mail, MapPin, Loader2, Calendar, Droplet } from 'lucide-react';
import { Card, Button, Pagination } from '../../ui';
import { useGetPatientsQuery } from '../../../../app/service/patients';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';

// ✅ Import socket
import { socket } from '../../../socket/socket';
// ✅ Import socket event listeners
import { registerPatientEvents, unregisterPatientEvents } from '../../../socket/patientEvents';

const HospitalPatientsList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Track if events are registered
  const [eventsRegistered, setEventsRegistered] = useState(false);

  const { data: patientsData, isLoading, refetch } = useGetPatientsQuery({
    hospitalId: id,
    page: currentPage,
    limit: itemsPerPage,
    search_query: searchTerm || undefined
  });

  const patients = patientsData?.data || [];
  const totalItems = patientsData?.pagination?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // ✅ Register socket event listeners for patient events
  useEffect(() => {
    console.log("🔄 Registering patient event listeners for Hospital Patients...");
    console.log("📡 Socket connected:", socket.connected);
    
    registerPatientEvents({
      onPatientRegistered: (data) => {
        console.log("👤 NEW PATIENT REGISTERED:", data);
        showSuccessToast(`New patient registered!`, 3000);
        refetch();
      },
      
      onPatientUpdated: (data) => {
        console.log("✏️ PATIENT UPDATED:", data);
        showSuccessToast(`Patient updated!`, 3000);
        refetch();
      },
      
      onPatientDeleted: (data) => {
        console.log("🗑️ PATIENT DELETED:", data);
        showSuccessToast(`Patient deleted!`, 3000);
        refetch();
      },
      
      onPatientRecovered: (data) => {
        console.log("♻️ PATIENT RECOVERED:", data);
        showSuccessToast(`Patient recovered!`, 3000);
        refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      console.log("🧹 Unregistering patient events for Hospital Patients...");
      unregisterPatientEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // ✅ Listen for socket connection/disconnection
  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Socket CONNECTED - Patient events will work!");
      if (!eventsRegistered) {
        registerPatientEvents({
          onPatientRegistered: (data) => {
            console.log("👤 NEW PATIENT REGISTERED (reconnect):", data);
            showSuccessToast(`New patient registered!`, 3000);
            refetch();
          },
          onPatientUpdated: (data) => {
            console.log("✏️ PATIENT UPDATED (reconnect):", data);
            showSuccessToast(`Patient updated!`, 3000);
            refetch();
          },
          onPatientDeleted: (data) => {
            console.log("🗑️ PATIENT DELETED (reconnect):", data);
            showSuccessToast(`Patient deleted!`, 3000);
            refetch();
          },
          onPatientRecovered: (data) => {
            console.log("♻️ PATIENT RECOVERED (reconnect):", data);
            showSuccessToast(`Patient recovered!`, 3000);
            refetch();
          }
        });
        setEventsRegistered(true);
      }
    };

    const handleDisconnect = () => {
      console.log("❌ Socket DISCONNECTED - Patient events won't work!");
      setEventsRegistered(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [refetch, eventsRegistered]);

  // ✅ Log all socket events for debugging
  useEffect(() => {
    const handleAnyEvent = (event, ...args) => {
      console.log(`📡 ALL SOCKET EVENTS - PATIENT/HOSPITAL: ${event}:`, args);
    };

    socket.onAny(handleAnyEvent);

    return () => {
      socket.offAny(handleAnyEvent);
    };
  }, []);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-[#6366F1]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} className="mr-1" /> Back to Hospital Details
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Patients List</h1>
        <p className="text-sm text-gray-500 mt-1">Total Patients: {totalItems}</p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((patient) => (
          <Card key={patient.id || patient._id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                <p className="text-xs text-gray-500">ID: {patient.id || patient._id}</p>
                <div className="space-y-1 mt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400" />
                    <span>{patient.mobileNumber}</span>
                  </div>
                  {patient.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} className="text-gray-400" />
                      <span>{patient.email}</span>
                    </div>
                  )}
                  {patient.gender && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User size={14} className="text-gray-400" />
                      <span>{patient.gender}, {patient.age} years</span>
                    </div>
                  )}
                  {patient.bloodGroup && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Droplet size={14} className="text-gray-400" />
                      <span>Blood Group: {patient.bloodGroup}</span>
                    </div>
                  )}
                  {patient.address?.place && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin size={14} className="text-gray-400 mt-0.5" />
                      <span>{patient.address.place}, {patient.address.district}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {patients.length === 0 && (
        <div className="text-center py-12">
          <User size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No patients found</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            itemLabel="patients"
          />
        </div>
      )}
    </div>
  );
};

export default HospitalPatientsList;