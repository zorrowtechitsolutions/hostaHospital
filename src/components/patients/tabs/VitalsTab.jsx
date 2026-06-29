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
  setOpenMenu, 
  getStatusBadge 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch doctors data for mapping
  const { data: doctorsData, error: doctorsError, isLoading: doctorsLoading } = useGetDoctorsQuery();
  
  // Fetch bookings to get doctor info from appointments
  const { data: bookingResponse, error: bookingError, isLoading: bookingLoading } = useGetBookingsQuery({});
  
  // Fetch prescriptions to get doctor info
  const { data: prescriptionsResponse, isLoading: prescriptionsLoading } = useGetPrescriptionsQuery({});

  const vitalsList = patient?.vitalsList || [];
  
  // Debug logs for API responses
  console.log("Original Vitals List:", vitalsList);

  // Log first vital item structure
  if (vitalsList.length > 0) {
    console.log("First Vital Item Keys:", Object.keys(vitalsList[0]));
    console.log("First Vital Item Full Data:", vitalsList[0]);
  }
  
  // Get bookings list with proper structure handling
  const bookingsList = useMemo(() => {
    if (!bookingResponse) return [];
    
    // Handle different response structures
    let bookings = [];
    if (Array.isArray(bookingResponse)) {
      bookings = bookingResponse;
    } else if (bookingResponse.data && Array.isArray(bookingResponse.data)) {
      bookings = bookingResponse.data;
    } else if (bookingResponse.bookings && Array.isArray(bookingResponse.bookings)) {
      bookings = bookingResponse.bookings;
    } else if (bookingResponse.result && Array.isArray(bookingResponse.result)) {
      bookings = bookingResponse.result;
    } else if (bookingResponse.data?.result && Array.isArray(bookingResponse.data?.result)) {
      bookings = bookingResponse.data.result;
    }
    
    console.log("Processed Bookings List:", bookings);
    return bookings;
  }, [bookingResponse]);
  
  // Get doctors list
  const doctorsList = useMemo(() => {
    if (!doctorsData) return [];
    
    let doctors = [];
    if (Array.isArray(doctorsData)) {
      doctors = doctorsData;
    } else if (doctorsData.data && Array.isArray(doctorsData.data)) {
      doctors = doctorsData.data;
    } else if (doctorsData.doctors && Array.isArray(doctorsData.doctors)) {
      doctors = doctorsData.doctors;
    } else if (doctorsData.result && Array.isArray(doctorsData.result)) {
      doctors = doctorsData.result;
    }
    
    console.log("Processed Doctors List:", doctors);
    return doctors;
  }, [doctorsData]);

  // Get prescriptions list
  const prescriptionsList = useMemo(() => {
    if (!prescriptionsResponse) return [];
    
    let prescriptions = [];
    if (Array.isArray(prescriptionsResponse)) {
      prescriptions = prescriptionsResponse;
    } else if (prescriptionsResponse.data && Array.isArray(prescriptionsResponse.data)) {
      prescriptions = prescriptionsResponse.data;
    } else if (prescriptionsResponse.prescriptions && Array.isArray(prescriptionsResponse.prescriptions)) {
      prescriptions = prescriptionsResponse.prescriptions;
    } else if (prescriptionsResponse.result && Array.isArray(prescriptionsResponse.result)) {
      prescriptions = prescriptionsResponse.result;
    }
    
    console.log("Processed Prescriptions List:", prescriptions);
    return prescriptions;
  }, [prescriptionsResponse]);

  // Helper function to safely get nested property
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

  // Map vitals with correct doctor information
  const mappedVitalsList = useMemo(() => {
    if (!vitalsList || vitalsList.length === 0) return [];

    console.log("=== VitalsTab Debug Logs ===");
    console.log("Doctors Data:", doctorsData);
    console.log("Doctors Error:", doctorsError);
    console.log("Booking Response:", bookingResponse);
    console.log("Booking Error:", bookingError);
    console.log("Prescriptions Response:", prescriptionsResponse);
    
    return vitalsList.map((item, index) => {
      let doctor = null;
      let doctorName = null;
      let doctorSpecialization = null;
      
      console.log(`\n--- Processing Vital Item ${index} ---`);
      console.log("Item ID:", item.id || item._id || 'unknown');
      console.log("Full Item:", item);
      console.log(JSON.stringify(item, null, 2));
      
      // Get all possible doctor ID sources
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
      
      // Filter out null/undefined/empty values
      const validDoctorIds = possibleDoctorIds.filter(id => 
        id !== null && id !== undefined && id !== "" && id !== "null" && id !== "undefined"
      );
      
      console.log("Valid Doctor IDs found:", validDoctorIds);
      
      // Get all possible doctor name sources
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
      
      // Filter out null/undefined/empty values and "Dr. Unknown"
      const validDoctorNames = possibleDoctorNames.filter(
        name =>
          name &&
          name !== "Dr. Unknown" &&
          name !== "null" &&
          name !== "undefined"
      );

      console.log("Valid Doctor Names found:", validDoctorNames);
      
      // Get all possible specialization sources
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
      
      console.log("Valid Specializations found:", validSpecializations);
      
      // STRATEGY 1: Try to find doctor by ID from vitals
      if (validDoctorIds.length > 0 && doctorsList.length > 0) {
        for (const id of validDoctorIds) {
          const foundDoctor = doctorsList.find(doc => {
            const docId = doc.id || doc._id || doc.doctorId;
            return String(docId) === String(id);
          });
          
          if (foundDoctor) {
            doctor = foundDoctor;
            console.log(`Found doctor by ID ${id}:`, doctor);
            break;
          }
        }
      }
      
      // STRATEGY 2: Try to find doctor by name
      if (!doctor && validDoctorNames.length > 0 && doctorsList.length > 0) {
        for (const name of validDoctorNames) {
          const searchName = String(name).toLowerCase().trim();
          
          const foundDoctor = doctorsList.find(doc => {
            const docName1 = (doc.displayName || doc.name || doc.doctorName || "").toLowerCase().trim();
            const docName2 = (doc.fullName || "").toLowerCase().trim();
            
            return (
              docName1 === searchName ||
              docName2 === searchName
            );
          });
          
          if (foundDoctor) {
            doctor = foundDoctor;
            console.log(`Found doctor by name "${name}":`, doctor);
            break;
          }
        }
      }
      
      // STRATEGY 3: Try to find from booking
      if (!doctor) {
        // Get booking ID from various sources
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
        
        console.log("Valid Booking IDs:", validBookingIds);
        
        if (validBookingIds.length > 0 && bookingsList.length > 0) {
          for (const bookingId of validBookingIds) {
            const booking = bookingsList.find(b => {
              const bId = b.id || b._id || b.bookingId || b.booking_id;
              return String(bId) === String(bookingId);
            });
            
            if (booking) {
              console.log("Found booking:", booking);
              
              // Try to get doctor info from booking
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
              
              console.log("Booking doctor info:", { bookingDoctorName, bookingDoctorSpecialization });
              
              // Try to find the doctor in doctors list using booking info
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
                  console.log("Found doctor from booking:", doctor);
                  break;
                }
              }
              
              // If no doctor found but we have booking doctor info, use it
              if (!doctor && bookingDoctorName) {
                doctorName = bookingDoctorName;
                doctorSpecialization = bookingDoctorSpecialization;
                console.log("Using booking doctor info directly:", { doctorName, doctorSpecialization });
                break;
              }
            }
          }
        }
      }
      
      // STRATEGY 4: Try to find from consultation data
      if (!doctor && !doctorName) {
        const consultation = item.consultation || getNestedValue(item, 'fullData.consultation');
        if (consultation) {
          console.log("Found consultation data:", consultation);
          
          const consultationDoctorName = consultation.doctorName || 
                                        consultation.doctor_name || 
                                        getNestedValue(consultation, 'doctor.name') ||
                                        getNestedValue(consultation, 'doctor.displayName');
          
          const consultationSpecialization = consultation.specialization || 
                                             consultation.department;
          
          console.log("Consultation doctor info:", { consultationDoctorName, consultationSpecialization });
          
          // Try to find doctor in doctors list
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
              console.log("Found doctor from consultation:", doctor);
            }
          }
          
          if (!doctor && consultationDoctorName) {
            doctorName = consultationDoctorName;
            doctorSpecialization = consultationSpecialization || "General Medicine";
            console.log("Using consultation doctor info directly:", { doctorName, doctorSpecialization });
          }
        }
      }
      
      // STRATEGY 5: Try to find from prescription data (nested)
      if (!doctor && !doctorName) {
        const prescription = item.prescription || getNestedValue(item, 'fullData.prescription');
        if (prescription) {
          console.log("Found prescription data:", prescription);
          
          const prescriptionDoctorName = prescription.doctorName || 
                                        prescription.doctor_name || 
                                        prescription.prescribedBy;
          
          const prescriptionSpecialization = prescription.specialization || 
                                             prescription.department;
          
          if (prescriptionDoctorName) {
            // Try to find doctor in doctors list
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
                console.log("Found doctor from prescription:", doctor);
              }
            }
            
            if (!doctor) {
              doctorName = prescriptionDoctorName;
              doctorSpecialization = prescriptionSpecialization || "General Medicine";
              console.log("Using prescription doctor info directly:", { doctorName, doctorSpecialization });
            }
          }
        }
      }

      // STRATEGY 6: Get doctor from prescription by ID (ENHANCED)
      if (!doctor && !doctorName) {
        // Check both top-level and nested fullData for prescriptionId
        const prescriptionId = 
          item.prescriptionId ||
          item.prescription_id ||
          getNestedValue(item, 'fullData.prescriptionId') ||
          getNestedValue(item, 'fullData.prescription_id') ||
          getNestedValue(item, 'prescription.id') ||
          getNestedValue(item, 'fullData.prescription.id');

        console.log("Looking for prescription ID:", prescriptionId);

        if (prescriptionId && prescriptionsList.length > 0) {
          const prescription = prescriptionsList.find(
            (p) => {
              const pId = p.id || p._id || p.prescriptionId || p.prescription_id;
              return String(pId) === String(prescriptionId);
            }
          );

          console.log("Prescription lookup result:", { prescriptionId, prescription });
          console.log("Full prescription object:", JSON.stringify(prescription, null, 2));

          if (prescription) {
            // Log all possible doctor-related fields in the prescription
            console.log("Prescription doctor fields:", {
              doctorName: prescription.doctorName,
              doctor_name: prescription.doctor_name,
              prescribedBy: prescription.prescribedBy,
              doctor: prescription.doctor,
              doctorId: prescription.doctorId,
              doctor_id: prescription.doctor_id,
              doctorSpecialization: prescription.doctorSpecialization,
              specialization: prescription.specialization,
              department: prescription.department,
              doctorSpeciality: prescription.doctorSpeciality
            });

            // Get doctor name from prescription - try all possible paths
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

            // Get specialization from prescription - try all possible paths
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

            console.log("Extracted prescription doctor data:", { 
              prescriptionDoctorName, 
              prescriptionSpecialization 
            });

            if (prescriptionDoctorName) {
              // Try to find the doctor in doctors list
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
                  console.log("Found doctor from prescription ID lookup:", doctor);
                }
              }

              // If doctor not found in doctors list, use the prescription data
              if (!doctor) {
                doctorName = prescriptionDoctorName;
                doctorSpecialization = prescriptionSpecialization || "General Medicine";
                console.log("Using prescription doctor info from ID lookup:", { doctorName, doctorSpecialization });
              }
            } else {
              // If no doctor name found in prescription, try to get it from doctor ID
              const prescriptionDoctorId = 
                prescription.doctorId ||
                prescription.doctor_id ||
                prescription.doctor?.id ||
                getNestedValue(prescription, 'doctor.doctorId') ||
                getNestedValue(prescription, 'doctor.id');

              console.log("Looking for doctor by ID from prescription:", prescriptionDoctorId);

              if (prescriptionDoctorId && doctorsList.length > 0) {
                const foundDoctor = doctorsList.find(doc => {
                  const docId = doc.id || doc._id || doc.doctorId;
                  return String(docId) === String(prescriptionDoctorId);
                });
                
                if (foundDoctor) {
                  doctor = foundDoctor;
                  console.log("Found doctor by ID from prescription:", doctor);
                }
              }
            }
          }
        }
      }
      
      // If doctor found from any strategy, get the name and specialization
      if (doctor) {
        doctorName = doctor.displayName || doctor.name || doctor.doctorName || "Dr. Unknown";
        doctorSpecialization = doctor.specialization || doctor.department || "General Medicine";
        console.log("Final: Using doctor object:", { doctorName, doctorSpecialization });
      } else if (!doctorName) {
        // Final fallback - use whatever is in the vital record
        const fallbackName = validDoctorNames.length > 0 ? validDoctorNames[0] : "Dr. Unknown";
        const fallbackSpecialization = validSpecializations.length > 0 ? validSpecializations[0] : "General Medicine";
        
        doctorName = fallbackName;
        doctorSpecialization = fallbackSpecialization;
        console.log("Final: Using fallback values:", { doctorName, doctorSpecialization });
      }

      const result = {
        ...item,
        doctorName: doctorName,
        doctorSpecialization: doctorSpecialization,
        department: doctorSpecialization,
      };
      
      console.log("Final mapped result:", { 
        id: result.id || result._id,
        doctorName: result.doctorName, 
        department: result.department 
      });
      
      return result;
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
    
    // Blood Pressure
    if (vital.bloodPressure && vital.bloodPressure !== "null" && vital.bloodPressure !== "") 
      metrics.push(`BP: ${vital.bloodPressure}`);
    
    // Temperature
    if (vital.temperature && vital.temperature !== "null" && vital.temperature !== "") 
      metrics.push(`${vital.temperature}°F`);
    
    // Pulse
    if (vital.pulse && vital.pulse !== "null" && vital.pulse !== "") 
      metrics.push(`Pulse: ${vital.pulse}`);
    
    // Heart Rate
    if (vital.heartRate && vital.heartRate !== "null" && vital.heartRate !== "") 
      metrics.push(`HR: ${vital.heartRate}`);
    
    // SPO2
    if (vital.spo2 && vital.spo2 !== "null" && vital.spo2 !== "") 
      metrics.push(`SPO2: ${vital.spo2}%`);
    
    // Respiratory Rate
    if (vital.respiratoryRate && vital.respiratoryRate !== "null" && vital.respiratoryRate !== "") 
      metrics.push(`RR: ${vital.respiratoryRate}`);
    
    // Weight
    if (vital.weight && vital.weight !== "null" && vital.weight !== "") 
      metrics.push(`Wt: ${vital.weight}kg`);
    
    // Height
    if (vital.height && vital.height !== "null" && vital.height !== "") 
      metrics.push(`Ht: ${vital.height}cm`);
    
    // BMI
    if (vital.bmi && vital.bmi !== "null" && vital.bmi !== "") 
      metrics.push(`BMI: ${vital.bmi}`);
    
    // Blood Sugar
    if (vital.bloodSugar && vital.bloodSugar !== "null" && vital.bloodSugar !== "") 
      metrics.push(`Sugar: ${vital.bloodSugar}mg/dL`);
    
    return metrics.length > 0 ? metrics.join(" • ") : "No vital signs recorded";
  };

  // Format date display
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
      // If it's a date object or ISO string, format it
      try {
        const dateObj = new Date(validDate);
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
      } catch (e) {
        // If formatting fails, return the original value
      }
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
      } catch (e) {
        // If formatting fails, return the original value
      }
      return validTime;
    }
    
    return null;
  };

  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name || name === "Dr. Unknown") return "D";
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Loading state
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
                {paginatedVitals.map((item, index) => {
                  return (
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
                                handleDeleteClick('vital', item.id || item._id, startIndex + index, `vitals from ${formatDate(item)}`);
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
                  );
                })}
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