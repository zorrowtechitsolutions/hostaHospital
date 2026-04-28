import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DeleteDoctor from "./DeleteDoctor";

const Doctors = () => {
  const navigate = useNavigate();

  const initialDoctors = [
    { id: 2, name: "Dr. Katherine Brooks", specialty: "Periodontist", experience: "3+ Years", appointments: 350, email: "katherine@example.com", phone: "+1 75964 25493", photo: "https://randomuser.me/api/portraits/women/44.jpg", dob: "1975-08-22", gender: "Female", registrationNumber: "REG12346", knownLanguages: "English, Spanish", about: "Specialized in periodontics", address: "456 Dental Ave", country: "USA", state: "NY", city: "New York", pinCode: "10001", displayName: "Dr. Katherine Brooks", userName: "katherine.brooks" },
    { id: 3, name: "Dr. Benjamin Harris", specialty: "Dermatopathologist", experience: "6+ Years", appointments: 400, email: "benjamin@example.com", phone: "+1 83217 65984", photo: "https://randomuser.me/api/portraits/men/45.jpg", dob: "1968-03-10", gender: "Male", registrationNumber: "REG12347", knownLanguages: "English", about: "Skin specialist", address: "789 Medical Blvd", country: "USA", state: "TX", city: "Houston", pinCode: "77001", displayName: "Dr. Benjamin Harris", userName: "benjamin.harris" },
    { id: 4, name: "Dr. Laura Mitchell", specialty: "ENT Surgeon", experience: "2+ Years", appointments: 150, email: "laura@example.com", phone: "+1 91745 36289", photo: "https://randomuser.me/api/portraits/women/68.jpg", dob: "1980-11-30", gender: "Female", registrationNumber: "REG12348", knownLanguages: "English, French", about: "Ear, Nose, Throat specialist", address: "321 Healthcare Dr", country: "USA", state: "FL", city: "Miami", pinCode: "33101", displayName: "Dr. Laura Mitchell", userName: "laura.mitchell" },
    { id: 5, name: "Dr. Christopher Lewis", specialty: "Medicine Physician", experience: "6+ Years", appointments: 200, email: "christopher@example.com", phone: "+1 75894 25721", photo: "https://randomuser.me/api/portraits/men/52.jpg", dob: "1965-07-19", gender: "Male", registrationNumber: "REG12349", knownLanguages: "English", about: "Internal medicine specialist", address: "654 Wellness Way", country: "USA", state: "WA", city: "Seattle", pinCode: "98101", displayName: "Dr. Christopher Lewis", userName: "christopher.lewis" },
    { id: 6, name: "Dr. Emily Clark", specialty: "Pediatrician", experience: "4+ Years", appointments: 300, email: "emily@example.com", phone: "+1 75894 25721", photo: "https://randomuser.me/api/portraits/women/55.jpg", dob: "1985-02-18", gender: "Female", registrationNumber: "REG12350", knownLanguages: "English, Spanish", about: "Child healthcare specialist", address: "258 Children's Way", country: "USA", state: "MA", city: "Boston", pinCode: "02101", displayName: "Dr. Emily Clark", userName: "emily.clark" }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('All');
  const [doctors, setDoctors] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(false);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fileInputRef = useRef(null);

  // Reset page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterSpecialty]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenu !== null && !event.target.closest('.menu-container')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenu]);

  useEffect(() => {
    const savedDoctors = localStorage.getItem('doctors');
    if (savedDoctors) {
      const doctors = JSON.parse(savedDoctors);
      const needsCleaning = doctors.some(doctor =>
        typeof doctor.id === 'string' || String(doctor.id).includes('#')
      );

      if (needsCleaning) {
        console.log('⚠️ Found IDs that need cleaning!');
        const cleanedDoctors = doctors.map(doctor => ({
          ...doctor,
          id: typeof doctor.id === 'string' ? parseInt(doctor.id.replace(/[^0-9]/g, '')) : doctor.id
        }));
        setDoctors(cleanedDoctors);
        localStorage.setItem('doctors', JSON.stringify(cleanedDoctors));
      } else {
        setDoctors(doctors);
      }
    } else {
      setDoctors(initialDoctors);
      localStorage.setItem('doctors', JSON.stringify(initialDoctors));
    }
  }, []);

  const specialties = ['All', ...new Set(doctors.map(d => d.specialty))];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterSpecialty === 'All' || doctor.specialty === filterSpecialty;
    return matchesSearch && matchesFilter;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDoctors = filteredDoctors.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        const maxId = doctors.length > 0 ? Math.max(...doctors.map(d => d.id)) : 0;

        const newDoctors = importedData.map((row, index) => ({
          id: maxId + index + 1,
          name: row['Name'] || row.name || 'Unknown Doctor',
          specialty: row['Specialty'] || row.specialty || 'General',
          experience: row['Experience'] || row.experience || '0+ Years',
          appointments: row['Appointments'] || row.appointments || 0,
          email: row['Email'] || row.email || '',
          phone: row['Phone'] || row.phone || '',
          photo: row.photo || `https://randomuser.me/api/portraits/lego/${index}.jpg`,
          dob: row.dob || '',
          gender: row.gender || '',
          registrationNumber: row.registrationNumber || '',
          knownLanguages: row.knownLanguages || '',
          about: row.about || '',
          address: row.address || '',
          country: row.country || '',
          state: row.state || '',
          city: row.city || '',
          pinCode: row.pinCode || '',
          displayName: row.displayName || '',
          userName: row.userName || ''
        }));

        const updatedDoctors = [...doctors, ...newDoctors];
        setDoctors(updatedDoctors);
        localStorage.setItem('doctors', JSON.stringify(updatedDoctors));
        alert(`${newDoctors.length} doctors imported successfully!`);
      } catch (error) {
        alert('Error parsing JSON file. Please ensure it is a valid JSON array.');
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const handleExport = () => {
    const exportData = filteredDoctors.map(doctor => ({
      'ID': doctor.id,
      'Name': doctor.name,
      'Specialty': doctor.specialty,
      'Experience': doctor.experience,
      'Appointments': doctor.appointments,
      'Email': doctor.email,
      'Phone': doctor.phone,
      'DOB': doctor.dob,
      'Gender': doctor.gender,
      'Registration Number': doctor.registrationNumber,
      'Known Languages': doctor.knownLanguages,
      'About': doctor.about,
      'Address': doctor.address,
      'Country': doctor.country,
      'State': doctor.state,
      'City': doctor.city,
      'Pin Code': doctor.pinCode,
      'Display Name': doctor.displayName,
      'Username': doctor.userName
    }));
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `doctors_export_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
  };

  const handleRefresh = () => {
    setLoading(true);
    setSearchTerm('');
    setFilterSpecialty('All');
    setActiveMenu(null);
    setCurrentPage(1);

    setTimeout(() => {
      const savedDoctors = localStorage.getItem('doctors');
      setDoctors(savedDoctors ? JSON.parse(savedDoctors) : initialDoctors);
      setLoading(false);
    }, 500);
  };

  const handleViewDetails = (doctor) => {
    navigate(`/doctor/${doctor.id}`);
    setActiveMenu(null);
  };

  const handleEdit = (doctor) => {
    const cleanId = doctor.id;
    navigate(`/edit-doctor/${cleanId}`);
  };

  const toggleMenu = (id, e) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Go back"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Doctors</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Doctors</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Doctors</h1>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-1 gap-3 w-full lg:w-auto">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search by name, specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1C62A0]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
            <button className="absolute right-2 top-1.5 bg-[#1C62A0] p-1 rounded">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </div>

          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1C62A0]"
          >
            {specialties.map(s => <option key={s} value={s}>{s === 'All' ? 'All Specialties' : s}</option>)}
          </select>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex border border-gray-200 rounded-md bg-white mr-2">
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-[#1C62A0] text-white' : 'text-gray-400'}`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" /></svg>
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-[#1C62A0] text-white' : 'text-gray-400'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>

          <button onClick={handleRefresh} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50" title="Refresh & Reset Filters">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50"
            title="Import Doctors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>

          <button onClick={handleExport} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50" title="Export Doctors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          </button>

          <Link to="/add-doctor" className="px-4 py-2 text-sm font-medium text-white bg-[#1C62A0] rounded-md flex items-center gap-2 hover:bg-[#154A7D]">
            <span className="text-lg">+</span> New Doctor
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1C62A0]"></div>
        </div>
      )}

      {/* GRID VIEW */}
      {!loading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedDoctors.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-lg border border-gray-100 p-5 relative flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-full flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-[#1C62A0] bg-blue-50 px-2 py-0.5 rounded">
                  {`#DR${String(doctor.id).padStart(4, '0')}`}
                </span>
                <div className="relative menu-container">
                  <button
                    onClick={(e) => toggleMenu(doctor.id, e)}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl font-bold"
                  >
                    ⋮
                  </button>
                  {activeMenu === doctor.id && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                      <button
                        onClick={() => handleViewDetails(doctor)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        View Details
                      </button>
                      <button
                        onClick={() => handleEdit(doctor)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(doctor.id);
                          setShowDelete(true);
                          setActiveMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="relative mb-3">
                <img src={doctor.photo} alt={doctor.name} className="w-16 h-16 rounded-full border-2 border-white shadow-sm object-cover" />
                <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <h3
                onClick={() => handleViewDetails(doctor)}
                className="text-[14px] font-bold text-gray-800 cursor-pointer hover:text-[#1C62A0]"
              >
                {doctor.name}
              </h3>
              <p className="text-[11px] text-gray-500 mb-4">{doctor.specialty}</p>
              <div className="grid grid-cols-2 gap-4 w-full border-t border-gray-50 pt-4 mb-4">
                <div className="text-center">
                  <p className="text-[9px] text-gray-400 uppercase font-bold">Experience</p>
                  <p className="text-xs font-bold text-gray-700">{doctor.experience}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-gray-400 uppercase font-bold">Appointments</p>
                  <p className="text-xs font-bold text-gray-700">{doctor.appointments}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIST VIEW WITH PAGINATION */}
      {!loading && viewMode === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Total Doctors
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
                {filteredDoctors.length}
              </span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Doctor ID</th>
                  <th className="px-6 py-3">Doctor Name</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Qualification</th>
                  <th className="px-6 py-3">Experience</th>
                  <th className="px-6 py-3">Appointments</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDoctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="px-6 py-4 text-[#1C62A0] font-medium">
                      #DR{String(doctor.id).padStart(4, "0")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={doctor.photo} className="w-8 h-8 rounded-full object-cover" alt={doctor.name} />
                        <span
                          onClick={() => handleViewDetails(doctor)}
                          className="font-medium text-gray-800 cursor-pointer hover:text-[#1C62A0]"
                        >
                          {doctor.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{doctor.specialty}</td>
                    <td className="px-6 py-4 text-gray-600">MBBS</td>
                    <td className="px-6 py-4 text-gray-600">{doctor.experience}</td>
                    <td className="px-6 py-4 text-gray-600">{doctor.appointments}</td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">Active</span>
                    </td>
                    <td className="px-6 py-4 text-right relative menu-container">
                      <button
                        onClick={(e) => toggleMenu(doctor.id, e)}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-xl font-bold"
                      >
                        ⋮
                      </button>
                      {activeMenu === doctor.id && (
                        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                          <button
                            onClick={() => handleViewDetails(doctor)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            View Details
                          </button>
                          <button
                            onClick={() => handleEdit(doctor)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeleteId(doctor.id);
                              setShowDelete(true);
                              setActiveMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination - Same style as RequestTable */}
          {filteredDoctors.length > 0 && (
            <div className="px-6 py-3 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredDoctors.length)} of {filteredDoctors.length} doctors
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 border rounded-md text-sm transition-all ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  Previous
                </button>
                <span className="px-3 py-1 bg-[#1C62A0] text-white rounded-md text-sm">
                  {currentPage}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`px-3 py-1 border rounded-md text-sm transition-all ${
                    currentPage === totalPages || totalPages === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results Found */}
      {!loading && filteredDoctors.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterSpecialty('All');
            }}
            className="px-4 py-2 bg-[#1C62A0] text-white rounded-md hover:bg-[#154A7D]"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Modal for View Details */}
      {showModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedDoctor.name}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="flex flex-col items-center mb-4">
                <img src={selectedDoctor.photo} alt={selectedDoctor.name} className="w-24 h-24 rounded-full object-cover mb-2" />
                <div className="text-center">
                  <p className="text-sm text-gray-500">{selectedDoctor.specialty}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Doctor ID</label>
                  <p className="text-sm text-gray-800">#DR{String(selectedDoctor.id).padStart(4, '0')}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                  <p className="text-sm text-gray-800">{selectedDoctor.email}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
                  <p className="text-sm text-gray-800">{selectedDoctor.phone}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Experience</label>
                  <p className="text-sm text-gray-800">{selectedDoctor.experience}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Appointments</label>
                  <p className="text-sm text-gray-800">{selectedDoctor.appointments}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigate(`/edit-doctor/${selectedDoctor.id}`);
                  setShowModal(false);
                }}
                className="flex-1 px-4 py-2 bg-[#1C62A0] text-white rounded-md hover:bg-[#154A7D]"
              >
                Edit Doctor
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteDoctor
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        doctorId={deleteId}
        onDelete={() => {
          const updated = doctors.filter(d => d.id !== deleteId);
          setDoctors(updated);
          localStorage.setItem("doctors", JSON.stringify(updated));
        }}
      />
    </div>
  );
};

export default Doctors;