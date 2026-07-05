// src/components/patients/tabs/VitalsTab.jsx
import React, { useState, useMemo } from "react";
import { MoreVertical, Eye, Trash2, Activity } from "lucide-react";
import { Button, Pagination } from "../../ui";
import { useGetDoctorsQuery } from "../../../../app/service/doctorApi";
import { useGetBookingsQuery } from "../../../../app/service/request";
import { useGetPrescriptionsQuery } from "../../../../app/service/prescription";

const VitalsTab = ({ 
  patient, 
  handleViewVitalDetails, 
  handleDeleteClick, 
  openMenu, 
  setOpenMenu
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data: doctorsData, isLoading: doctorsLoading } = useGetDoctorsQuery();
  const { data: bookingResponse, isLoading: bookingLoading } = useGetBookingsQuery({});
  const { data: prescriptionsResponse, isLoading: prescriptionsLoading } = useGetPrescriptionsQuery({});

  const vitalsList = patient?.vitalsList || [];
  
  const bookingsList = useMemo(() => {
    if (!bookingResponse) return [];
    
    if (Array.isArray(bookingResponse)) {
      return bookingResponse;
    } else if (bookingResponse.data && Array.isArray(bookingResponse.data)) {
      return bookingResponse.data;
    } else if (bookingResponse.bookings && Array.isArray(bookingResponse.bookings)) {
      return bookingResponse.bookings;
    } else if (bookingResponse.result && Array.isArray(bookingResponse.result)) {
      return bookingResponse.result;
    } else if (bookingResponse.data?.result && Array.isArray(bookingResponse.data?.result)) {
      return bookingResponse.data.result;
    }
    
    return [];
  }, [bookingResponse]);
  
  const doctorsList = useMemo(() => {
    if (!doctorsData) return [];
    
    if (Array.isArray(doctorsData)) {
      return doctorsData;
    } else if (doctorsData.data && Array.isArray(doctorsData.data)) {
      return doctorsData.data;
    } else if (doctorsData.doctors && Array.isArray(doctorsData.doctors)) {
      return doctorsData.doctors;
    } else if (doctorsData.result && Array.isArray(doctorsData.result)) {
      return doctorsData.result;
    }
    
    return [];
  }, [doctorsData]);

  const prescriptionsList = useMemo(() => {
    if (!prescriptionsResponse) return [];
    
    if (Array.isArray(prescriptionsResponse)) {
      return prescriptionsResponse;
    } else if (prescriptionsResponse.data && Array.isArray(prescriptionsResponse.data)) {
      return prescriptionsResponse.data;
    } else if (prescriptionsResponse.prescriptions && Array.isArray(prescriptionsResponse.prescriptions)) {
      return prescriptionsResponse.prescriptions;
    } else if (prescriptionsResponse.result && Array.isArray(prescriptionsResponse.result)) {
      return prescriptionsResponse.result;
    }
    
    return [];
  }, [prescriptionsResponse]);

  const getNestedValue = (obj, path, defaultValue = null) => {
    if (!obj) return defaultValue;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current !== undefined && current !== null ? current : defaultValue;
  };

  const mappedVitalsList = useMemo(() => {
    if (!vitalsList || vitalsList.length === 0) return [];

    return vitalsList.map((item) => {
      let doctor = null;
      let doctorName = null;
      let doctorSpecialization = null;
      
      const possibleDoctorIds = [
        item.doctorId,
        item.doctor_id,
        getNestedValue(item, 'doctor.id'),
        getNestedValue(item, 'doctor.doctorId'),
        getNestedValue(item, 'fullData.doctorId'),
        getNestedValue(item, 'fullData.doctor_id'),
        getNestedValue(item, 'consultation.doctorId'),
        getNestedValue(item, 'consultation.doctor_id'),
        getNestedValue(item, 'prescription.doctorId'),
        getNestedValue(item, 'prescription.doctor_id'),
        getNestedValue(item, 'appointment.doctorId'),
        getNestedValue(item, 'appointment.doctor_id'),
      ];
      
      const validDoctorIds = possibleDoctorIds.filter(id => 
        id !== null && id !== undefined && id !== "" && id !== "null" && id !== "undefined"
      );
      
      const possibleDoctorNames = [
        item.doctorName,
        item.doctor_name,
        getNestedValue(item, 'doctor.name'),
        getNestedValue(item, 'doctor.displayName'),
        getNestedValue(item, 'doctor.doctorName'),
        getNestedValue(item, 'fullData.doctorName'),
        getNestedValue(item, 'fullData.doctor_name'),
        getNestedValue(item, 'consultation.doctorName'),
        getNestedValue(item, 'consultation.doctor_name'),
        getNestedValue(item, 'prescription.doctorName'),
        getNestedValue(item, 'prescription.doctor_name'),
        getNestedValue(item, 'appointment.doctorName'),
        getNestedValue(item, 'appointment.doctor_name'),
      ];
      
      const validDoctorNames = possibleDoctorNames.filter(
        name =>
          name &&
          name !== "Dr. Unknown" &&
          name !== "null" &&
          name !== "undefined"
      );
      
      const possibleSpecializations = [
        item.specialization,
        item.department,
        item.doctorSpecialization,
        item.doctor_specialization,
        getNestedValue(item, 'doctor.specialization'),
        getNestedValue(item, 'doctor.department'),
        getNestedValue(item, 'fullData.specialization'),
        getNestedValue(item, 'fullData.department'),
        getNestedValue(item, 'consultation.specialization'),
        getNestedValue(item, 'consultation.department'),
        getNestedValue(item, 'prescription.specialization'),
        getNestedValue(item, 'prescription.department'),
        getNestedValue(item, 'appointment.specialization'),
        getNestedValue(item, 'appointment.department'),
      ];
      
      const validSpecializations = possibleSpecializations.filter(spec => 
        spec !== null && spec !== undefined && spec !== "" && 
        spec !== "null" && spec !== "undefined"
      );
      
      // Strategy 1: Find doctor by ID
      if (validDoctorIds.length > 0 && doctorsList.length > 0) {
        for (const id of validDoctorIds) {
          const foundDoctor = doctorsList.find(doc => {
            const docId = doc.id || doc._id || doc.doctorId;
            return String(docId) === String(id);
          });
          
          if (foundDoctor) {
            doctor = foundDoctor;
            break;
          }
        }
      }
      
      // Strategy 2: Find doctor by name
      if (!doctor && validDoctorNames.length > 0 && doctorsList.length > 0) {
        for (const name of validDoctorNames) {
          const searchName = String(name).toLowerCase().trim();
          
          const foundDoctor = doctorsList.find(doc => {
            const docName1 = (doc.displayName || doc.name || doc.doctorName || "").toLowerCase().trim();
            const docName2 = (doc.fullName || "").toLowerCase().trim();
            
            return docName1 === searchName || docName2 === searchName;
          });
          
          if (foundDoctor) {
            doctor = foundDoctor;
            break;
          }
        }
      }
      
      // Strategy 3: Find from booking
      if (!doctor) {
        const bookingIds = [
          item.bookingId,
          item.booking_id,
          getNestedValue(item, 'fullData.bookingId'),
          getNestedValue(item, 'fullData.booking_id'),
          getNestedValue(item, 'consultation.bookingId'),
          getNestedValue(item, 'consultation.booking_id'),
          getNestedValue(item, 'appointment.bookingId'),
          getNestedValue(item, 'appointment.booking_id'),
        ];
        
        const validBookingIds = bookingIds.filter(id => 
          id !== null && id !== undefined && id !== "" && id !== "null" && id !== "undefined"
        );
        
        if (validBookingIds.length > 0 && bookingsList.length > 0) {
          for (const bookingId of validBookingIds) {
            const booking = bookingsList.find(b => {
              const bId = b.id || b._id || b.bookingId || b.booking_id;
              return String(bId) === String(bookingId);
            });
            
            if (booking) {
              const bookingDoctorName = booking.doctor_name || 
                                       booking.doctorName || 
                                       booking.displayName || 
                                       getNestedValue(booking, 'doctor.name') ||
                                       getNestedValue(booking, 'doctor.displayName');
              
              const bookingDoctorSpecialization = booking.department || 
                                                  booking.specialization || 
                                                  booking.doctor_department ||
                                                  getNestedValue(booking, 'doctor.specialization') ||
                                                  getNestedValue(booking, 'doctor.department');
              
              if (bookingDoctorName && doctorsList.length > 0) {
                const searchName = String(bookingDoctorName).toLowerCase().trim();
                const foundDoctor = doctorsList.find(doc => {
                  const docName = (doc.displayName || doc.name || doc.doctorName || "").toLowerCase().trim();
                  return docName === searchName || 
                         docName.includes(searchName) || 
                         searchName.includes(docName);
                });
                
                if (foundDoctor) {
                  doctor = foundDoctor;
                  break;
                }
              }
              
              if (!doctor && bookingDoctorName) {
                doctorName = bookingDoctorName;
                doctorSpecialization = bookingDoctorSpecialization;
                break;
              }
            }
          }
        }
      }
      
      // Strategy 4: Find from consultation data
      if (!doctor && !doctorName) {
        const consultation = item.consultation || getNestedValue(item, 'fullData.consultation');
        if (consultation) {
          const consultationDoctorName = consultation.doctorName || 
                                        consultation.doctor_name || 
                                        getNestedValue(consultation, 'doctor.name') ||
                                        getNestedValue(consultation, 'doctor.displayName');
          
          const consultationSpecialization = consultation.specialization || 
                                             consultation.department;
          
          if (consultationDoctorName && doctorsList.length > 0) {
            const searchName = String(consultationDoctorName).toLowerCase().trim();
            const foundDoctor = doctorsList.find(doc => {
              const docName = (doc.displayName || doc.name || doc.doctorName || "").toLowerCase().trim();
              return docName === searchName || 
                     docName.includes(searchName) || 
                     searchName.includes(docName);
            });
            
            if (foundDoctor) {
              doctor = foundDoctor;
            }
          }
          
          if (!doctor && consultationDoctorName) {
            doctorName = consultationDoctorName;
            doctorSpecialization = consultationSpecialization || "General Medicine";
          }
        }
      }
      
      // Strategy 5: Find from prescription
      if (!doctor && !doctorName) {
        const prescription = item.prescription || getNestedValue(item, 'fullData.prescription');
        if (prescription) {
          const prescriptionDoctorName = prescription.doctorName || 
                                        prescription.doctor_name || 
                                        prescription.prescribedBy;
          
          const prescriptionSpecialization = prescription.specialization || 
                                             prescription.department;
          
          if (prescriptionDoctorName) {
            if (doctorsList.length > 0) {
              const searchName = String(prescriptionDoctorName).toLowerCase().trim();
              const foundDoctor = doctorsList.find(doc => {
                const docName = (doc.displayName || doc.name || doc.doctorName || "").toLowerCase().trim();
                return docName === searchName || 
                       docName.includes(searchName) || 
                       searchName.includes(docName);
              });
              
              if (foundDoctor) {
                doctor = foundDoctor;
              }
            }
            
            if (!doctor) {
              doctorName = prescriptionDoctorName;
              doctorSpecialization = prescriptionSpecialization || "General Medicine";
            }
          }
        }
      }

      // Strategy 6: Find from prescription by ID
      if (!doctor && !doctorName) {
        const prescriptionId = 
          item.prescriptionId ||
          item.prescription_id ||
          getNestedValue(item, 'fullData.prescriptionId') ||
          getNestedValue(item, 'fullData.prescription_id') ||
          getNestedValue(item, 'prescription.id') ||
          getNestedValue(item, 'fullData.prescription.id');

        if (prescriptionId && prescriptionsList.length > 0) {
          const prescription = prescriptionsList.find(
            (p) => {
              const pId = p.id || p._id || p.prescriptionId || p.prescription_id;
              return String(pId) === String(prescriptionId);
            }
          );

          if (prescription) {
            const prescriptionDoctorName = 
              prescription.doctorName ||
              prescription.doctor_name ||
              prescription.prescribedBy ||
              prescription.doctor?.name ||
              prescription.doctor?.displayName ||
              prescription.doctor?.doctorName ||
              getNestedValue(prescription, 'doctor.name') ||
              getNestedValue(prescription, 'doctor.displayName') ||
              getNestedValue(prescription, 'doctor.doctorName') ||
              getNestedValue(prescription, 'prescribedBy.name') ||
              getNestedValue(prescription, 'doctor.fullName') ||
              getNestedValue(prescription, 'doctorName.name');

            const prescriptionSpecialization = 
              prescription.doctorSpecialization ||
              prescription.specialization ||
              prescription.department ||
              prescription.doctor?.specialization ||
              prescription.doctor?.department ||
              getNestedValue(prescription, 'doctor.specialization') ||
              getNestedValue(prescription, 'doctor.department') ||
              getNestedValue(prescription, 'specialization.name') ||
              prescription.doctorSpeciality ||
              getNestedValue(prescription, 'doctor.speciality');

            if (prescriptionDoctorName) {
              if (doctorsList.length > 0) {
                const searchName = String(prescriptionDoctorName).toLowerCase().trim();
                const foundDoctor = doctorsList.find(doc => {
                  const docName = (doc.displayName || doc.name || doc.doctorName || "").toLowerCase().trim();
                  return docName === searchName || 
                         docName.includes(searchName) || 
                         searchName.includes(docName);
                });
                
                if (foundDoctor) {
                  doctor = foundDoctor;
                }
              }

              if (!doctor) {
                doctorName = prescriptionDoctorName;
                doctorSpecialization = prescriptionSpecialization || "General Medicine";
              }
            } else {
              const prescriptionDoctorId = 
                prescription.doctorId ||
                prescription.doctor_id ||
                prescription.doctor?.id ||
                getNestedValue(prescription, 'doctor.doctorId') ||
                getNestedValue(prescription, 'doctor.id');

              if (prescriptionDoctorId && doctorsList.length > 0) {
                const foundDoctor = doctorsList.find(doc => {
                  const docId = doc.id || doc._id || doc.doctorId;
                  return String(docId) === String(prescriptionDoctorId);
                });
                
                if (foundDoctor) {
                  doctor = foundDoctor;
                }
              }
            }
          }
        }
      }
      
      if (doctor) {
        doctorName = doctor.displayName || doctor.name || doctor.doctorName || "Dr. Unknown";
        doctorSpecialization = doctor.specialization || doctor.department || "General Medicine";
      } else if (!doctorName) {
        const fallbackName = validDoctorNames.length > 0 ? validDoctorNames[0] : "Dr. Unknown";
        const fallbackSpecialization = validSpecializations.length > 0 ? validSpecializations[0] : "General Medicine";
        
        doctorName = fallbackName;
        doctorSpecialization = fallbackSpecialization;
      }

      return {
        ...item,
        doctorName: doctorName,
        doctorSpecialization: doctorSpecialization,
        department: doctorSpecialization,
      };
    });
  }, [vitalsList, doctorsList, bookingsList, prescriptionsList]);

  const totalItems = mappedVitalsList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVitals = mappedVitalsList.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getVitalSummary = (vital) => {
    const metrics = [];
    
    if (vital.bloodPressure && vital.bloodPressure !== "null" && vital.bloodPressure !== "") 
      metrics.push(`BP: ${vital.bloodPressure}`);
    
    if (vital.temperature && vital.temperature !== "null" && vital.temperature !== "") 
      metrics.push(`${vital.temperature}°F`);
    
    if (vital.pulse && vital.pulse !== "null" && vital.pulse !== "") 
      metrics.push(`Pulse: ${vital.pulse}`);
    
    if (vital.heartRate && vital.heartRate !== "null" && vital.heartRate !== "") 
      metrics.push(`HR: ${vital.heartRate}`);
    
    if (vital.spo2 && vital.spo2 !== "null" && vital.spo2 !== "") 
      metrics.push(`SPO2: ${vital.spo2}%`);
    
    if (vital.respiratoryRate && vital.respiratoryRate !== "null" && vital.respiratoryRate !== "") 
      metrics.push(`RR: ${vital.respiratoryRate}`);
    
    if (vital.weight && vital.weight !== "null" && vital.weight !== "") 
      metrics.push(`Wt: ${vital.weight}kg`);
    
    if (vital.height && vital.height !== "null" && vital.height !== "") 
      metrics.push(`Ht: ${vital.height}cm`);
    
    if (vital.bmi && vital.bmi !== "null" && vital.bmi !== "") 
      metrics.push(`BMI: ${vital.bmi}`);
    
    if (vital.bloodSugar && vital.bloodSugar !== "null" && vital.bloodSugar !== "") 
      metrics.push(`Sugar: ${vital.bloodSugar}mg/dL`);
    
    return metrics.length > 0 ? metrics.join(" • ") : "No vital signs recorded";
  };

  const formatDate = (item) => {
    const dateSources = [
      item.date,
      item.recordedDate,
      item.recorded_date,
      getNestedValue(item, 'fullData.date'),
      getNestedValue(item, 'fullData.recordedDate'),
      getNestedValue(item, 'createdAt'),
    ];
    
    const validDate = dateSources.find(d => 
      d !== null && d !== undefined && d !== "" && d !== "null" && d !== "undefined"
    );
    
    if (validDate) {
      try {
        const dateObj = new Date(validDate);
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
      } catch (e) {}
      return validDate;
    }
    
    return "Date not available";
  };

  const formatTime = (item) => {
    const timeSources = [
      item.time,
      item.recordedTime,
      item.recorded_time,
      getNestedValue(item, 'fullData.time'),
      getNestedValue(item, 'fullData.recordedTime'),
      getNestedValue(item, 'createdAt'),
    ];
    
    const validTime = timeSources.find(t => 
      t !== null && t !== undefined && t !== "" && t !== "null" && t !== "undefined"
    );
    
    if (validTime) {
      try {
        const dateObj = new Date(validTime);
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
        }
      } catch (e) {}
      return validTime;
    }
    
    return null;
  };

  const getInitials = (name) => {
    if (!name || name === "Dr. Unknown") return "D";
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  if (doctorsLoading || bookingLoading || prescriptionsLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading vitals data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">
          Total Vitals Records
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
            {totalItems}
          </span>
        </h2>
      </div>

      {totalItems === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Activity size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500">No vital records found</p>
          <p className="text-sm text-gray-400 mt-1">Vitals will appear here after consultation</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Doctor Name</th>
                  <th className="px-6 py-3">Specialization</th>
                  <th className="px-6 py-3">Vitals Summary</th>
                  <th className="px-6 py-3 text-right w-16"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedVitals.map((item, index) => (
                  <tr
                    key={item.id || item._id || index}
                    className="hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100"
                    onClick={() => handleViewVitalDetails(item)}
                  >
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(item)}
                      {formatTime(item) && (
                        <span className="text-gray-400 text-xs block">{formatTime(item)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {getInitials(item.doctorName)}
                          </span>
                        </div>
                        <span className="font-medium text-gray-800">
                          {item.doctorName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-500 text-xs">
                        {item.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-md truncate" title={getVitalSummary(item)}>
                        {getVitalSummary(item)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right relative action-menu-container">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setOpenMenu(openMenu === `vitals-${item.id || item._id}` ? null : `vitals-${item.id || item._id}`);
                        }}
                        className="p-2"
                      >
                        <MoreVertical size={16} className="text-gray-500" />
                      </Button>
                      {openMenu === `vitals-${item.id || item._id}` && (
                        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleViewVitalDetails(item);
                              setOpenMenu(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye size={15} /> View Details
                          </button>
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleDeleteClick('vital', item.id || item._id, `vitals from ${formatDate(item)}`);
                              setOpenMenu(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                          >
                            <Trash2 size={15} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalItems > 0 && totalPages > 1 && (
            <div className="px-6 py-3 border-t bg-gray-50">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemLabel="vital records"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VitalsTab;