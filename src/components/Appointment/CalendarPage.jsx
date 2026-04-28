// CalendarPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CalendarPage = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate dynamic visit records based on today's date with detailed data
  const generateVisitRecords = () => {
    const records = {};
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    // Detailed visit data structure with more medicines and longer descriptions
    const visitData = [
      { 
        monthsAgo: 24, 
        day: 15, 
        complaint: "Severe sore throat with difficulty swallowing, high fever (103°F), and swollen lymph nodes in the neck. Patient reports loss of appetite and general weakness for the past 5 days.",
        assessment: "Acute bacterial tonsillitis diagnosed. Throat swab showed Group A Streptococcus. Patient advised complete bed rest for 3 days. Warm salt water gargles recommended 3 times daily. Follow-up in 1 week if symptoms persist. Complete blood count showed elevated WBC (14,500).",
        medications: "Amoxicillin 875mg - twice daily for 10 days, Ibuprofen 600mg - every 8 hours for pain and fever, Paracetamol 500mg - as needed for fever, Multivitamin tablets once daily",
        doctor: "Dr. Sarah Johnson",
        department: "ENT"
      },
      { 
        monthsAgo: 18, 
        day: 22, 
        complaint: "Persistent dry cough for 3 weeks, low-grade fever (100.4°F), chest tightness, and shortness of breath on exertion. Patient has history of seasonal allergies. No relief from OTC cough medications.",
        assessment: "Post-viral bronchitis with reactive airway disease. Chest X-ray showed mild bronchial thickening. Spirometry revealed mild obstructive pattern. Prescribed bronchodilators and advised steam inhalation. Avoid cold drinks and smoke exposure. Review in 2 weeks.",
        medications: "Azithromycin 500mg - day 1 then 250mg days 2-5, Dextromethorphan syrup 10ml - three times daily, Guaifenesin 600mg - twice daily for mucus clearance, Montelukast 10mg - once daily at bedtime, Albuterol inhaler - 2 puffs as needed",
        doctor: "Dr. Michael Chen",
        department: "Pulmonology"
      },
      { 
        monthsAgo: 14, 
        day: 8, 
        complaint: "Intermittent chest pain radiating to left arm, palpitations, anxiety, and episodes of dizziness. Pain worsens with stress and improves with rest. Patient reports poor sleep quality for 2 months.",
        assessment: "Anxiety-induced chest pain with panic attacks. ECG, Troponin, and 2D Echo all normal. Stress test negative for ischemia. Referred to cardiology for reassurance. Cognitive behavioral therapy recommended. Stress management techniques advised.",
        medications: "Alprazolam 0.5mg - twice daily as needed, Propranolol 20mg - twice daily for palpitations, Escitalopram 10mg - once daily, Melatonin 5mg - at bedtime for sleep, Omega-3 fatty acids 1000mg daily",
        doctor: "Dr. Emily Rodriguez",
        department: "Cardiology"
      },
      { 
        monthsAgo: 10, 
        day: 12, 
        complaint: "Severe throbbing headache on right side, nausea, vomiting, photophobia, and phonophobia. Headache lasts 6-8 hours and occurs 3-4 times per month. Patient identifies triggers including lack of sleep and certain foods.",
        assessment: "Classic migraine with aura. Neurological examination normal. MRI brain normal. Migraine diary recommended to identify triggers. Lifestyle modifications including regular sleep schedule, hydration, and stress reduction. Follow-up in 1 month.",
        medications: "Sumatriptan 100mg - at onset of migraine (max 2 doses per week), Rizatriptan 10mg - alternative abortive therapy, Propranolol 40mg - twice daily for prevention, Topiramate 25mg - at bedtime (titrate slowly), Vitamin B2 400mg daily, Magnesium glycinate 400mg daily",
        doctor: "Dr. David Kim",
        department: "Neurology"
      },
      { 
        monthsAgo: 8, 
        day: 5, 
        complaint: "Chronic lower back pain radiating to left leg, numbness in toes, difficulty sitting for long periods, and morning stiffness lasting 30 minutes. Pain rated 7/10. No history of trauma.",
        assessment: "Lumbar radiculopathy due to L4-L5 disc bulge confirmed by MRI. Physical therapy evaluation completed. Core strengthening exercises prescribed. Ergonomic assessment recommended for workplace. Avoid heavy lifting and prolonged sitting. Reassess in 6 weeks.",
        medications: "Cyclobenzaprine 10mg - three times daily for muscle spasm, Gabapentin 300mg - at bedtime (increase to 300mg twice daily after 1 week), Acetaminophen 650mg - every 6 hours as needed, Diclofenac gel - apply to affected area 3 times daily, Methylcobalamin 1500mcg daily for nerve health",
        doctor: "Dr. Lisa Wong",
        department: "Orthopedics"
      },
      { 
        monthsAgo: 6, 
        day: 18, 
        complaint: "Generalized itchy skin rash with red raised bumps on arms, legs, and trunk. Rash appeared after using new laundry detergent. Patient reports mild swelling of lips and difficulty sleeping due to itching.",
        assessment: "Severe allergic contact dermatitis. Patch testing scheduled for next month. Skin biopsy showed acute spongiotic dermatitis. Avoid identified allergens. Cool compresses advised for itching. Short course of oral steroids prescribed. Follow-up in 2 weeks.",
        medications: "Cetirizine 20mg - once daily, Fexofenadine 180mg - twice daily for severe itching, Hydrocortisone 2.5% cream - apply twice daily, Triamcinolone 0.1% ointment - for resistant areas, Prednisone 40mg - daily for 5 days then taper, Calamine lotion - as needed for relief",
        doctor: "Dr. James Wilson",
        department: "Dermatology"
      },
      { 
        monthsAgo: 4, 
        day: 10, 
        complaint: "Burning epigastric pain after meals, bloating, excessive belching, and occasional nausea. Symptoms worse with spicy foods and empty stomach. No blood in stool. Patient reports using NSAIDs frequently for headaches.",
        assessment: "Moderate erosive gastritis confirmed by endoscopy. H. pylori test negative. NSAID-induced gastritis suspected. Dietary modifications including small frequent meals, avoid spicy/oily foods, and no lying down after meals. Eradication therapy not required. Review in 4 weeks.",
        medications: "Omeprazole 40mg - once daily before breakfast, Sucralfate 1g - four times daily before meals and at bedtime, Domperidone 10mg - three times daily before meals, Antacid suspension 20ml - as needed for breakthrough symptoms, Probiotics once daily",
        doctor: "Dr. Priya Sharma",
        department: "Gastroenterology"
      },
      { 
        monthsAgo: 3, 
        day: 25, 
        complaint: "Frequent urination (every 1-2 hours), increased thirst, blurred vision, fatigue, and unexplained weight loss of 8 kg over 3 months. Family history of type 2 diabetes.",
        assessment: "Newly diagnosed Type 2 Diabetes Mellitus. HbA1c 8.9%, fasting glucose 168 mg/dL. Diabetes education provided including glucose monitoring, diet planning, and exercise recommendations. Referred to dietitian for medical nutrition therapy. Eye exam and foot exam scheduled.",
        medications: "Metformin 500mg - once daily with dinner (increase to twice daily after 1 week), Glimepiride 1mg - once daily with breakfast, Atorvastatin 20mg - at bedtime, Lisinopril 5mg - once daily, Vitamin D3 2000 IU daily, Aspirin 81mg daily",
        doctor: "Dr. Robert Taylor",
        department: "Endocrinology"
      },
      { 
        monthsAgo: 2, 
        day: 3, 
        complaint: "Urinary burning sensation, frequent urge to urinate, lower abdominal discomfort, and cloudy urine with strong odor. Symptoms started 4 days ago. No fever or chills.",
        assessment: "Acute uncomplicated urinary tract infection. Urinalysis showed leukocytes, nitrites, and bacteria. Urine culture sent for sensitivity. Increased fluid intake advised. Avoid caffeine and alcohol until symptoms resolve. Complete full course of antibiotics. Follow-up if no improvement in 48 hours.",
        medications: "Nitrofurantoin 100mg - twice daily for 7 days, Phenazopyridine 200mg - three times daily for pain relief (max 2 days), D-mannose 500mg - twice daily for prevention, Probiotics for women once daily, Cranberry extract 500mg daily, Ibuprofen 400mg - as needed for discomfort",
        doctor: "Dr. Michelle Lee",
        department: "Urology"
      },
      { 
        monthsAgo: 1, 
        day: 14, 
        complaint: "Joint pain and swelling in both knees and wrists, morning stiffness lasting 2 hours, fatigue, and low-grade fever. Symptoms worse in the morning and improve with activity. Family history of rheumatoid arthritis.",
        assessment: "Seropositive Rheumatoid Arthritis diagnosed. Rheumatoid factor positive (78 IU/mL), Anti-CCP positive, ESR elevated (45 mm/hr), CRP elevated (24 mg/L). X-rays showed mild joint space narrowing. Referred to rheumatology for ongoing management. Physical therapy recommended for joint protection.",
        medications: "Methotrexate 15mg - once weekly, Folic acid 1mg - daily (except methotrexate day), Hydroxychloroquine 200mg - twice daily, Prednisone 5mg - daily (taper over 4 weeks), Celecoxib 200mg - once daily, Calcium 600mg with Vitamin D twice daily",
        doctor: "Dr. Andrew Patel",
        department: "Rheumatology"
      },
      { 
        monthsAgo: 0, 
        day: today.getDate() - 3, 
        complaint: "Acute onset fever (102°F), chills, body aches, headache, and sore throat for 3 days. Patient reports exposure to sick family member. No difficulty breathing. Vaccination status unknown.",
        assessment: "Acute viral upper respiratory infection. Rapid flu test negative, COVID-19 negative. Supportive care advised. Monitor for warning signs including difficulty breathing, chest pain, confusion, or persistent high fever. Return to ER if symptoms worsen. Complete isolation recommended for 5 days.",
        medications: "Oseltamivir 75mg - twice daily for 5 days (empiric), Paracetamol 650mg - every 6 hours for fever, Ibuprofen 400mg - every 8 hours for body aches, Dextromethorphan-guaifenesin syrup 10ml - every 4 hours, Vitamin C 1000mg daily, Zinc 50mg daily for 5 days, Normal saline nasal spray as needed",
        doctor: "Dr. Amanda Foster",
        department: "Internal Medicine"
      }
    ];

    visitData.forEach(visit => {
      const visitDate = new Date(currentYear, currentMonth - visit.monthsAgo, visit.day);
      if (visitDate <= today) {
        const dateString = visitDate.toISOString().split('T')[0];
        records[dateString] = {
          complaint: visit.complaint,
          assessment: visit.assessment,
          medications: visit.medications,
          doctor: visit.doctor,
          department: visit.department
        };
      }
    });

    return records;
  };

  const [visitRecords, setVisitRecords] = useState(generateVisitRecords());

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const isVisitedDate = (date) => {
    if (!date) return false;
    const dateString = date.toISOString().split('T')[0];
    return visitRecords[dateString] !== undefined;
  };

  const getVisitDetails = (date) => {
    if (!date) return null;
    const dateString = date.toISOString().split('T')[0];
    return visitRecords[dateString];
  };

  const isToday = (date) => {
    if (!date) return false;
    return date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
  };

  const isFutureDate = (date) => {
    if (!date) return false;
    return date > today;
  };

  const handleDateClick = (date) => {
    if (date && !isFutureDate(date)) {
      setSelectedDate(date);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    const currentDate = new Date();
    if (nextMonth.getFullYear() < currentDate.getFullYear() || 
        (nextMonth.getFullYear() === currentDate.getFullYear() && nextMonth.getMonth() <= currentDate.getMonth())) {
      setCurrentMonth(nextMonth);
    }
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const days = getDaysInMonth(currentMonth);
  const selectedVisitDetails = selectedDate ? getVisitDetails(selectedDate) : null;

  // Helper function to split medications into array
  const getMedicationsList = (medications) => {
    return medications.split(', ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Visit History Calendar</h1>
                <p className="text-sm text-gray-500">Reyan Verol • ID: #C243546</p>
              </div>
            </div>
            <button 
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Back to Consultation
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Calendar Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <button 
                  onClick={goToPreviousMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-lg font-semibold text-gray-900">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <button 
                  onClick={goToNextMonth}
                  disabled={currentMonth.getMonth() >= today.getMonth() && currentMonth.getFullYear() >= today.getFullYear()}
                  className={`p-2 rounded-lg transition-colors ${
                    currentMonth.getMonth() >= today.getMonth() && currentMonth.getFullYear() >= today.getFullYear()
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 border-b border-gray-200">
                {weekdays.map(day => (
                  <div key={day} className="py-3 text-center">
                    <span className="text-xs font-medium text-gray-500">{day}</span>
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {days.map((date, index) => {
                  const isVisited = date && isVisitedDate(date);
                  const isSelected = date && selectedDate && 
                    date.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];
                  const today_date = date && isToday(date);
                  const future = date && isFutureDate(date);
                  
                  return (
                    <div
                      key={index}
                      onClick={() => handleDateClick(date)}
                      className={`
                        min-h-[100px] p-2 border-b border-r border-gray-100 transition-all
                        ${future ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-blue-50'}
                        ${isSelected ? 'bg-blue-100 ring-2 ring-blue-500 ring-inset' : ''}
                      `}
                    >
                      {date && (
                        <div className="flex flex-col h-full">
                          <div className="flex justify-between items-start">
                            <span className={`
                              text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full
                              ${today_date ? 'bg-blue-600 text-white' : 'text-gray-700'}
                              ${future ? 'text-gray-400' : ''}
                            `}>
                              {date.getDate()}
                            </span>
                            {isVisited && !future && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          {isVisited && !future && (
                            <div className="mt-1">
                              <span className="text-[10px] text-green-600 font-medium">✓ Visited</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Today Button */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-center">
                <button
                  onClick={goToToday}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Today
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Visit Details - WITH HIDDEN SCROLLBAR */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide">
              <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white sticky top-0">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Visit Details
                </h3>
              </div>
              
              <div className="p-5">
                {selectedDate ? (
                  selectedVisitDetails ? (
                    <div className="space-y-4">
                      {/* Date Header */}
                      <div className="text-center pb-4 border-b border-gray-100">
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}
                        </p>
                      </div>

                      {/* Visit Details */}
                      <div className="space-y-4">
                        {/* Complaint */}
                        <div className="bg-red-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Complaint
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">{selectedVisitDetails.complaint}</p>
                        </div>

                        {/* Assessment */}
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Assessment & Plan
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">{selectedVisitDetails.assessment}</p>
                        </div>

                        {/* Medications */}
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            Prescribed Medications
                          </p>
                          <ul className="space-y-1">
                            {getMedicationsList(selectedVisitDetails.medications).map((med, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">•</span>
                                <span className="leading-relaxed">{med.trim()}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Doctor & Department */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-[10px] font-medium text-gray-500">Doctor</p>
                            <p className="text-xs text-gray-700 font-medium mt-0.5">{selectedVisitDetails.doctor}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-[10px] font-medium text-gray-500">Department</p>
                            <p className="text-xs text-gray-700 font-medium mt-0.5">{selectedVisitDetails.department}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">No visit record for this date</p>
                      <p className="text-xs text-gray-400 mt-1">Select a different date</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">Select a date to view visit details</p>
                    <p className="text-xs text-gray-400 mt-1">Click on any date with a green dot</p>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
                <p className="text-xs font-medium text-gray-700 mb-3">Legend</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Date with visit record</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                    <span className="text-xs text-gray-600">Today</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-100 ring-2 ring-blue-500 ring-inset rounded"></div>
                    <span className="text-xs text-gray-600">Selected date</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                    <span className="text-xs text-gray-400">Future date (disabled)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hide scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;