# Hosta — Hospital Management System

<p align="center">
  <strong>A Unified Digital Platform for Modern Healthcare Management</strong>
</p>

<p align="center">
  <a href="https://hostahospital.com/">Official Website</a> •
  <strong>React</strong> •
  <strong>Vite</strong> •
  <strong>Redux Toolkit</strong> •
  <strong>Tailwind CSS</strong> •
  <strong>Socket.IO</strong>
</p>

---

## Overview

**Hosta** is a modern, web-based Hospital Management System designed to streamline healthcare administration and simplify day-to-day hospital operations through a centralized digital platform.

Built with React and Vite, Hosta provides an integrated environment for managing hospitals, doctors, patients, medical staff, appointments, consultations, laboratory operations , ambulance services, blood banks, and administrative workflows.

The platform follows a role-based access control architecture, providing dedicated functionality and permissions for different categories of users.

With centralized management, real-time communication, notification services, and organized healthcare workflows, Hosta aims to improve operational efficiency and provide a more connected healthcare management experience.

**Official Website:** https://hostahospital.com/

---

## Key Highlights

- Centralized hospital administration.
- Multi-role authentication and authorization.
- Dedicated Super Admin and Hospital Admin dashboards.
- Complete patient and doctor management.
- Appointment scheduling and consultation workflows.
- Medical history and prescription management.
- Laboratory tests and results management.
- Pharmacy product management.
- Ambulance and blood bank management.
- Real-time updates using Socket.IO.
- Browser push notifications using Firebase Cloud Messaging.
- Dynamic role and permission management.
- File uploads and document management.
- Excel export and PDF generation.
- Google Maps integration.
- Audit logs and session history.

---

## Features & Modules

### 1. Authentication & Access Management

Hosta implements token-based authentication and protected application routes.

**Features:**
- Hospital registration.
- User sign-in.
- Forgot password.
- Password reset.
- Email verification.
- Access-token management.
- Automatic access-token refresh.
- Protected routes.
- Role-based authorization.

### 2. Role-Based Dashboards

The application supports four primary user roles.

| Role | Responsibilities |
|---|---|
| Super Admin | Platform-wide administration and hospital management |
| Hospital Admin | Hospital operations and administrative management |
| Doctor | Doctor-related workflows and patient consultations |
| Staff | Assigned hospital operations and authorized activities |

Access to application modules is controlled through assigned roles and permissions.

### 3. Super Admin Management

The Super Admin dashboard provides centralized control over the Hosta platform.

**Hospital Management**
- Register and manage hospitals.
- Edit hospital information.
- View hospital profiles and details.
- Access hospital-related patients, doctors, and staff.
- View hospital appointments and visits.
- Manage hospital ambulances and blood banks.
- Manage hospital users and notifications.

**Doctor & Staff Management**
- Add and edit doctors.
- View doctor profiles.
- Manage hospital-associated doctors.
- Register and manage hospital staff.
- View staff information.
- Role assignments.
- Permission management.

**Platform Administration**
- Manage categories and specialties.
- Manage Super Admin and Hospital users.
- Assign roles and permissions.
- Manage advertisements.
- Review audit logs.
- Monitor hospital session history.

### 4. Hospital Management

Hospital administrators receive a dedicated dashboard for managing their hospital operations.

**Dashboard**
- Hospital operational overview.
- Centralized access to management modules.
- Important activity information.

**Patient Management**
- Patient registration.
- Patient profiles.
- Patient appointments.
- Patient visits.
- Medical history.
- Prescriptions.
- Laboratory results.
- Patient vitals.
- Medical documents.

**Doctor Management**
- Doctor registration.
- Doctor profile management.
- Doctor appointment management.
- Doctor reviews and ratings.

**Staff Management**
- Staff registration.
- Staff profiles.
- Staff information updates.


### 5. Appointment & Consultation Management

Manage patient appointments and doctor consultation workflows.

**Features:**
- Appointment listing.
- Appointment creation.
- Appointment editing.
- Appointment calendar.
- Visit calendar.
- Patient consultation.
- Medical history access.
- Appointment request management.
- Request approval and rejection.
- Automatic decline workflows.

### 6. Patient Visit Management

Manage patient visits and maintain visit-related information.

- Patient visit listing.
- Visit history.
- Patient-related visit information.
- Access to associated medical information.


### 9. Ambulance Management

Manage hospital ambulance information and related services.

**Features:**
- Ambulance registration.
- Ambulance listing.
- Edit ambulance information.
- View ambulance details.

### 10. Blood Bank Management

Manage blood bank information and records.

**Features:**
- Blood bank registration.
- Blood bank management.
- Blood bank details.

### 11. Notification Management

Hosta integrates multiple notification technologies to support real-time application communication.

**Technologies:**
- Firebase Cloud Messaging (FCM).
- Socket.IO.
- Service Workers.
- In-app notifications.

**Features:**
- Browser push notifications.
- Appointment notifications.
- Request notifications.
- Notification history.
- Notification panels.
- Real-time application updates.

### 12. Email Management

The platform includes an email notification and template management module.

**Features:**
- Email notifications.
- Email template creation.
- Email template editing.
- Email template management.
- Email history.
- Email composition.

### 13. User, Role & Permission Management

A centralized authorization system helps control application access.

**Features:**
- User management.
- Role creation and management.
- Permission management.
- Role-permission assignments.
- User-specific permissions.
- Super Admin permissions.
- Hospital roles and permissions.

### 14. Audit Logs & Session History

The system provides activity and session-related information for administrative monitoring.

**Features:**
- Super Admin audit logs.
- Hospital session history.
- Login and session tracking.

### 15. Maps & Location Integration

Google Maps integration provides location-related functionality.

**Technology:** `@react-google-maps/api`

**Features:**
- Hospital location selection.
- Map-based location interfaces.

### 16. File & Document Management

Hosta supports document uploading and file handling.

**Technologies:**
- Amazon S3-compatible storage.
- React Dropzone.
- PDF.js.
- Custom file upload components.

### 17. Reports & Data Export

The application supports exporting and generating downloadable documents.

| Technology | Purpose |
|---|---|
| XLSX | Excel spreadsheet export |
| jsPDF | PDF document generation |
| pdfjs-dist | PDF rendering and processing |
| html2canvas | HTML-to-image rendering |

### 18. Real-Time Communication

Socket.IO provides real-time event communication across different application modules.

Real-time event handlers are organized around:

- Hospitals.
- Doctors.
- Patients.
- Appointments.
- Ambulances.
- Blood banks.
- Notifications.
- Permissions.
- Prescriptions.
- Ratings and reviews.
- Roles.
- Specialties.
- Staff.

---

## Technology Stack

Hosta uses a modern frontend technology stack designed for modular development, reusable components, and efficient application management.

### Frontend Technologies

| Technology | Purpose |
|---|---|
| React | Component-based UI development |
| Vite | Development server and build tooling |
| React Router | Client-side navigation |
| Redux Toolkit | Global state management |
| RTK Query | API communication and caching |
| Tailwind CSS | Utility-first styling |
| Radix UI | Accessible UI primitives |
| Lucide React | Icon library |
| Recharts | Data visualization |
| Formik | Form management |
| Sonner | Toast notifications |

### Integrations & Services

| Technology | Purpose |
|---|---|
| REST API | Backend communication |
| Socket.IO Client | Real-time communication |
| Firebase Cloud Messaging | Push notifications |
| Google Maps API | Location integration |
| S3-compatible storage | File and document storage |
| React Dropzone | File uploading |
| XLSX | Excel export |
| jsPDF | PDF generation |

---

## Application Architecture

Hosta follows a modular frontend architecture that separates application pages, reusable components, API services, authentication, utilities, and real-time communication.

### Project Structure

```text
Hosta/
└── hostaHospital/
    │
    ├── app/
    │   ├── service/
    │   │   ├── ads.ts
    │   │   ├── ambulance.ts
    │   │   ├── api.ts
    │   │   ├── bloodbank.ts
    │   │   ├── blooddonor.ts
    │   │   ├── category.ts
    │   │   ├── doctorApi.ts
    │   │   ├── documentApi.ts
    │   │   ├── hospitalApi.ts
    │   │   ├── labresults.ts
    │   │   ├── notification.ts
    │   │   ├── patients.ts
    │   │   ├── permission.ts
    │   │   ├── prescription.ts
    │   │   ├── prescriptionTemplate.ts
    │   │   ├── request.ts
    │   │   ├── review.ts
    │   │   ├── role.ts
    │   │   ├── rolePermission.ts
    │   │   ├── S3.ts
    │   │   ├── sessionHistoryApi.ts
    │   │   ├── speciality.ts
    │   │   ├── staffApi.ts
    │   │   ├── users.ts
    │   │   └── vitals.ts
    │   │
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    │
    ├── public/
    │   ├── firebase-messaging-sw.js
    │   ├── icons.svg
    │   ├── logo.png
    │   └── notification.mp3
    │
    ├── src/
    │   │
    │   ├── Authentication/                     
    │   │   ├── ForgotPassword.jsx
    │   │   ├── GoogleMapsLocationPicker.jsx
    │   │   ├── HospitalHomePage.jsx
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   │
    │   ├── components/
    │   │   │
    │   │   ├── Ambulance/
    │   │   │   ├── AddAmbulanceModal.jsx
    │   │   │   ├── Ambulance.jsx
    │   │   │   ├── EditAmbulanceModal.jsx
    │   │   │   └── ViewAmbulanceModal.jsx
    │   │   │
    │   │   ├── Appointment/
    │   │   │   ├── Appointment.jsx
    │   │   │   ├── CalendarPage.jsx
    │   │   │   ├── Consultation.jsx
    │   │   │   ├── ViewMedicalHistory.jsx
    │   │   │   └── VisitCalendar.jsx
    │   │   │
    │   │   ├── auditlogin/
    │   │   │   └── SessionHistory.jsx
    │   │   │
    │   │   ├── BloodBank/
    │   │   │   └── BloodBank.jsx
    │   │   │
    │   │   ├── Doctor/
    │   │   │   ├── AddDoctors.jsx
    │   │   │   ├── AppointmentManagment.jsx
    │   │   │   ├── DeleteDoctor.jsx
    │   │   │   ├── Doctors.jsx
    │   │   │   ├── EditDoctor.jsx
    │   │   │   ├── ReviewTable.jsx
    │   │   │   └── ViewDoctor.jsx
    │   │   │
    │   │   ├── help/
    │   │   │   └── HelpSupport.jsx
    │   │   │
    │   │   ├── imageUploader/
    │   │   │   └── FileUpload.jsx
    │   │   │
    │   │   ├── Laborartory/
    │   │   │   ├── AddEditLabResults.jsx
    │   │   │   ├── AddEditLabTestModal.jsx
    │   │   │   ├── AllLabResults.jsx
    │   │   │   ├── LaboratoryRegistrationForm.jsx
    │   │   │   └── LabTests.jsx
    │   │   │
    │   │   ├── LeaveRequests/
    │   │   │
    │   │   ├── MyProfile/
    │   │   │   ├── DoctorProfile.jsx
    │   │   │   ├── HospitalProfile.jsx
    │   │   │   ├── Profile.jsx
    │   │   │   └── StaffProfile.jsx
    │   │   │
    │   │   ├── Notification/
    │   │   │   ├── CreateEmailTemplate.jsx
    │   │   │   ├── EditEmailTemplate.jsx
    │   │   │   ├── EmailHistory.jsx
    │   │   │   ├── EmailNotification.jsx
    │   │   │   ├── EmailTemplateForm.jsx
    │   │   │   ├── EmailTemplates.jsx
    │   │   │   ├── NotificationsPage.jsx
    │   │   │   └── ViewEmailTemplate.jsx
    │   │   │
    │   │   ├── patients/
    │   │   │   │
    │   │   │   ├── modals/
    │   │   │   │   ├── AppointmentDetailsModal.jsx
    │   │   │   │   ├── LaboratoryReportModal.jsx
    │   │   │   │   ├── MedicalDetailsModal.jsx
    │   │   │   │   ├── PrecriptionReportModal.jsx
    │   │   │   │   ├── VisitDetailsModal.jsx
    │   │   │   │   └── VitalDetailsModal.jsx
    │   │   │   │
    │   │   │   ├── tabs/
    │   │   │   │   ├── AppointmentsTab.jsx
    │   │   │   │   ├── DocumentsTab.jsx
    │   │   │   │   ├── InsuranceTab.jsx
    │   │   │   │   ├── LabResultsTab.jsx
    │   │   │   │   ├── MedicalHistoryTab.jsx
    │   │   │   │   ├── PrescriptionTab.jsx
    │   │   │   │   ├── ProfileTab.jsx
    │   │   │   │   ├── VisitHistoryTab.jsx
    │   │   │   │   └── VitalsTab.jsx
    │   │   │   │
    │   │   │   ├── AddAppointmentModal.jsx
    │   │   │   ├── AddPatientModal.jsx
    │   │   │   ├── DeleteModel.jsx
    │   │   │   ├── EditAppointmentModal.jsx
    │   │   │   ├── EditPatientModal.jsx
    │   │   │   ├── EditVisitHistoryModal.jsx
    │   │   │   ├── PatientDetails.jsx
    │   │   │   └── Patients.jsx
    │   │   │
    │   │   ├── Requests/
    │   │   │   ├── ApproveRequestModel.jsx
    │   │   │   └── AutoDeclineModal.jsx
    │   │   │
    │   │   ├── Settings/
    │   │   │   ├── HospitalReviews.jsx
    │   │   │   ├── Map.jsx
    │   │   │   ├── Notification.jsx
    │   │   │   ├── Preference.jsx
    │   │   │   ├── PrescriptionTemplate.jsx
    │   │   │   ├── Security.jsx
    │   │   │   └── Settings.jsx
    │   │   │
    │   │   ├── specialties/
    │   │   │   └── Specialities.jsx
    │   │   │
    │   │   ├── staffs/
    │   │   │   ├── AddStaff.jsx
    │   │   │   ├── EditStaff.jsx
    │   │   │   └── Staffs.jsx
    │   │   │
    │   │   ├── super admin/
    │   │   │   │
    │   │   │   ├── auditlogs/
    │   │   │   │   ├── HospitalSessionHistory.jsx
    │   │   │   │   └── SuperAdminAuditLog.jsx
    │   │   │   │
    │   │   │   ├── hospitals/
    │   │   │   │   │
    │   │   │   │   ├── Ambulance/
    │   │   │   │   │   ├── AddAmbulance.jsx
    │   │   │   │   │   ├── Ambulance.jsx
    │   │   │   │   │   ├── EditAmbulance.jsx
    │   │   │   │   │   └── ViewAmbulanceModal.jsx
    │   │   │   │   │
    │   │   │   │   ├── BloodBank/
    │   │   │   │   │   ├── AddBloodBank.jsx
    │   │   │   │   │   ├── BloodBankDetails.jsx
    │   │   │   │   │   └── EditBloodBank.jsx
    │   │   │   │   │
    │   │   │   │   ├── Doctors/
    │   │   │   │   │   ├── AddDoctor.jsx
    │   │   │   │   │   ├── DoctorDetails.jsx
    │   │   │   │   │   └── EditDoctor.jsx
    │   │   │   │   │
    │   │   │   │   ├── notification/
    │   │   │   │   │   └── HospitalNotificationList.jsx
    │   │   │   │   │
    │   │   │   │   ├── patients/
    │   │   │   │   │   ├── AddPatients.jsx
    │   │   │   │   │   ├── EditPatient.jsx
    │   │   │   │   │   └── PatientsDetails.jsx
    │   │   │   │   │
    │   │   │   │   ├── staff/
    │   │   │   │   │   ├── AddStaff.jsx
    │   │   │   │   │   ├── EditStaff.jsx
    │   │   │   │   │   └── staffDetails.jsx
    │   │   │   │   │
    │   │   │   │   ├── AddHospital.jsx
    │   │   │   │   ├── EditHospital.jsx
    │   │   │   │   ├── HospitalAmbulancesList.jsx
    │   │   │   │   ├── HospitalAppointmentsList.jsx
    │   │   │   │   ├── HospitalBloodBanksList.jsx
    │   │   │   │   ├── HospitalDetails.jsx
    │   │   │   │   ├── HospitalDoctorsList.jsx
    │   │   │   │   ├── HospitalPatientsList.jsx
    │   │   │   │   ├── Hospitals.jsx
    │   │   │   │   ├── HospitalStaffList.jsx
    │   │   │   │   └── HospitalVisitList.jsx
    │   │   │   │
    │   │   │   ├── notification/
    │   │   │   │   ├── NotificationPanel.jsx
    │   │   │   │   └── NotificationsPage.jsx
    │   │   │   │
    │   │   │   ├── permission/
    │   │   │   │   ├── HospitalPermissionList.jsx
    │   │   │   │   ├── HospitalRoles.jsx
    │   │   │   │   └── SuperPermissionList.jsx
    │   │   │   │
    │   │   │   ├── phone/
    │   │   │   │   │
    │   │   │   │   ├── ambulance/
    │   │   │   │   │   ├── Ambulance.jsx
    │   │   │   │   │   └── AmbulanceDetails.jsx
    │   │   │   │   │
    │   │   │   │   └── blooddonor/
    │   │   │   │       ├── BloodDonors.jsx
    │   │   │   │       └── DonorDetails.jsx
    │   │   │   │   
    │   │   │   ├── speciality/
    │   │   │   │   ├── DoctorsByHospital.jsx
    │   │   │   │   └── HospitalsBySpeciality.jsx
    │   │   │   │
    │   │   │   ├── usermanagment/
    │   │   │   │       ├── HospitalAddUser.jsx
    │   │   │   │       ├── HospitalEditUser.jsx
    │   │   │   │       ├── HospitalUserDetails.jsx
    │   │   │   │       ├── HospitalUserPermissions.jsx
    │   │   │   │       ├── HospitalUsers.jsx
    │   │   │   │       ├── SuperAddNewUser.jsx
    │   │   │   │       ├── SuperEditUser.jsx
    │   │   │   │       ├── SuperUserPermissions.jsx
    │   │   │   │       ├── SuperUsers.jsx
    │   │   │   │       └── SuperViewAssignedRoles.jsx
    │   │   │   │
    │   │   │   ├── users/
    │   │   │   │   └── userslist.jsx
    │   │   │   │
    │   │   │   ├── AdminDashboard.jsx
    │   │   │   ├── Ads.jsx
    │   │   │   ├── Categories.jsx
    │   │   │   ├── RecentActivity.jsx
    │   │   │   ├── RecentAppointments.jsx
    │   │   │   ├── Sidebar.jsx
    │   │   │   ├── Specialities.jsx
    │   │   │   ├── SuperAdminLayout.jsx
    │   │   │   └── TopBar.jsx
    │   │   │
    │   │   ├── ui/
    │   │   │   ├── Alert.jsx
    │   │   │   ├── avatar.jsx
    │   │   │   ├── Badge.jsx
    │   │   │   ├── Breadcrumb.jsx
    │   │   │   ├── button.jsx
    │   │   │   ├── card.jsx
    │   │   │   ├── cards.jsx
    │   │   │   ├── CheckBox.jsx
    │   │   │   ├── CustomSelect.jsx
    │   │   │   ├── DataTable.jsx
    │   │   │   ├── DatePicker.jsx
    │   │   │   ├── ExcelExportButton.jsx
    │   │   │   ├── FilterBar.jsx
    │   │   │   ├── index.js
    │   │   │   ├── input.jsx
    │   │   │   ├── Loader.jsx
    │   │   │   ├── Modal.jsx
    │   │   │   ├── Pagination.jsx
    │   │   │   ├── PermissionDeniedModal.jsx
    │   │   │   ├── RadioGroup.jsx
    │   │   │   ├── SearchBar.jsx
    │   │   │   ├── select.jsx
    │   │   │   ├── Switch.jsx
    │   │   │   ├── table.jsx
    │   │   │   ├── Tabs.jsx
    │   │   │   ├── TextArea.jsx
    │   │   │   └── Toast.jsx
    │   │   │
    │   │   ├── usermanagment/
    │   │   │   ├── AddNewUser.jsx
    │   │   │   ├── EditUser.jsx
    │   │   │   ├── PermissionList.jsx
    │   │   │   ├── UserPermissions.jsx
    │   │   │   └── Users.jsx
    │   │   │
    │   │   ├── visits/
    │   │   │   ├── AddVisitModal.jsx
    │   │   │   ├── EditVisitModal.jsx
    │   │   │   └── Visits.jsx
    │   │   │
    │   │   └── web/
    │   │       ├── Uploader.jsx
    │   │       └── UploadProgress.jsx
    │   │
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ProtectedRoute.jsx
    │   │
    │   ├── lib/
    │   │   ├── S3Client.js
    │   │   └── utils.js
    │   │
    │   ├── notification/
    │   │   └── firebase.js
    │   │
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── NotificationPanel.jsx
    │   │   ├── NotificationsPanel.jsx
    │   │   ├── Settings.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── Topbar.jsx
    │   │
    │   ├── socket/
    │   │   ├── accessCardEvents.js
    │   │   ├── adEvents.js
    │   │   ├── ambulanceEvents.js
    │   │   ├── attendanceEvents.js
    │   │   ├── auditEvents.js
    │   │   ├── bloodBankEvents.js
    │   │   ├── bloodDonorEvents.js
    │   │   ├── bookingEvents.js
    │   │   ├── categoryEvents.js
    │   │   ├── deviceEvents.js
    │   │   ├── doctorEvents.js
    │   │   ├── documentEvents.js
    │   │   ├── emailNotificationEvents.js
    │   │   ├── emailTemplateEvents.js
    │   │   ├── fingerprintEvents.js
    │   │   ├── hospitalEvents.js
    │   │   ├── labEvents.js
    │   │   ├── notificationEvents.js
    │   │   ├── patientEvents.js
    │   │   ├── permissionEvents.js
    │   │   ├── prescriptionEvents.js
    │   │   ├── ratingEvents.js
    │   │   ├── reviewEvents.js
    │   │   ├── roleEvents.js
    │   │   ├── rolePermissionEvents.js
    │   │   ├── socket.js
    │   │   ├── specialityEvents.js
    │   │   └── staffEvents.js
    │   │
    │   ├── utils/
    │   │   ├── auth.ts
    │   │   ├── dateFormatter.js
    │   │   ├── deviceManager.js
    │   │   ├── excelExport.js
    │   │   ├── fcmTokenManager.js
    │   │   ├── permission.js
    │   │   └── timeUtils.js
    │   │
    │   ├── App.css
    │   ├── App.jsx
    │   ├── index.css
    │   ├── main.jsx
    │   └── vite-env.d.ts
    │
    ├── .env
    ├── .env.local
    ├── .gitignore
    ├── components.json
    ├── eslint.config.js
    ├── index.html
    ├── jsconfig.json
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.js
    ├── README.md
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── vercel.json
    └── vite.config.js
```

---

## Getting Started

Follow these instructions to set up the Hosta frontend locally.

### Prerequisites

Make sure you have installed:

- Node.js (compatible with your project dependencies).
- npm.
- Git.
- Access to the Hosta backend API.
- Required Firebase and Google Maps configurations.

### 1. Clone the Repository

```bash
git clone <repository-url>
```

Navigate to the project directory:

```bash
cd Hosta/hostaHospital
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the frontend project root.

Example configuration:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_ENDPOINT_URL_S3=https://hosta-hospital-prod
AWS_REGION=ap-southeast-1

# S3 Bucket Configuration
S3_BUCKET_NAME=hosta-hospital-prod-images-2026
VITE_S3_BASE_URL=https://hosta-hospital-prod-images-2026.s3.ap-southeast-1.amazonaws.com

# API & Socket Configuration
VITE_SOCKET_URL=https://zorrowtek.in
VITE_API_URL=https://zorrowtek.in/api

# Application Environment
VITE_APP_ENV=production

# Google Maps Configuration
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=hosta-7d497.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=hosta-7d497
VITE_FIREBASE_STORAGE_BUCKET=hosta-7d497.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=951235379752
VITE_FIREBASE_APP_ID=1:951235379752:web:2e67b2b522d65f3dafab1d
VITE_FIREBASE_MEASUREMENT_ID=G-NTYMKX72ZE

# Firebase Cloud Messaging
VITE_FIREBASE_VAPID_KEY=your_firebase_vapid_key
```

Configure the values according to your development or production environment.

**Important security considerations:**

- Never commit real credentials or secrets to Git.
- Variables prefixed with `VITE_` are exposed to the browser in production builds.
- Never place AWS secret access keys, JWT signing secrets, or other server-side credentials in frontend environment variables.
- Keep S3 credentials and JWT secrets in the backend environment.
- Restrict browser-exposed API keys using appropriate provider restrictions.

### 4. Start the Development Server

```bash
npm run dev
```

The Vite development server will display the local URL.

Default address:

```text
http://localhost:5173
```

---

## Available Scripts

The project provides the following npm commands:

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Generate the production build |
---

## API Integration

Hosta uses REST APIs to communicate with its backend services.

The API configuration is centralized in:

```text
app/service/api.ts
```

The API base URL is configured through:

```env
VITE_API_URL=your_backend_api_url
```

Domain-specific API services are organized under:

```text
app/service/
```

Examples include:

- `hospitalApi.ts`
- `doctorApi.ts`
- `patients.ts`
- `staffApi.ts`
- `ambulance.ts`
- `bloodbank.ts`
- `prescription.ts`
- `notification.ts`
- `permission.ts`
- `role.ts`
- `speciality.ts`

RTK Query provides the application's API integration layer.

---

## Authentication Architecture

Authentication is managed through a centralized context and protected routing system.

**Authentication Context**

```text
src/context/AuthContext.jsx
```

**Protected Routes**

```text
src/context/ProtectedRoute.jsx
```

The authentication workflow includes:

1. User authentication through the backend API.
2. Access-token management.
3. Authenticated API requests.
4. Detection of unauthorized responses.
5. Automatic access-token refresh.
6. Role-specific refresh handling where required.
7. Retrying requests after successful token refresh.
8. Clearing authentication state when the session cannot be renewed.

---

## Real-Time Architecture

Hosta uses Socket.IO Client to handle real-time application events.

Socket initialization:

```text
src/socket/socket.js
```

Event handlers are organized by application domain:

```text
src/socket/
```

This modular approach helps keep real-time functionality organized and maintainable.

---

## Firebase Push Notifications

Firebase Cloud Messaging provides browser push notification functionality.

Relevant files:

```text
src/notification/firebase.js
```

```text
public/firebase-messaging-sw.js
```

The application uses Firebase configuration supplied through environment variables.

The notification workflow includes browser notification permission requests and FCM token generation for authenticated users.

---

## Deployment

The project includes Vercel deployment configuration.

Configuration file:

```text
vercel.json
```

The configuration supports SPA route handling by rewriting incoming routes to:

```text
/index.html
```

### Production Deployment Steps

1. Configure the required environment variables.
2. Ensure the backend API is accessible.
3. Verify Firebase and Google Maps configurations.
4. Run the production build.
5. Deploy the generated build using your hosting platform.

Build command:

```bash
npm run build
```

Preview command:

```bash
npm run preview
```

---

## Development Guidelines

To maintain consistency and code quality, follow the existing project architecture when adding new features.

### Adding a New Feature

**1. Create Feature Components**

Place feature-specific components inside:

```text
src/components/<feature>/
```

**2. Create API Services**

Add API integration inside:

```text
app/service/
```

**3. Register Application Routes**

Add the required routes to the application's routing configuration.

**4. Configure Permissions**

Update role and permission configurations when access restrictions are required.

**5. Implement Real-Time Events**

If the feature requires real-time updates, create the corresponding handler under:

```text
src/socket/
```

**6. Reuse UI Components**

Use existing reusable components from:

```text
src/components/ui/
```

Avoid unnecessary duplication of existing functionality.

---

## Git Workflow

Follow a consistent Git workflow when contributing to the project.

```text
Create Branch
     |
Implement Feature
     |
Run Linter
     |
Test Feature
     |
Build Application
     |
Review Changes
     |
Commit Changes
     |
Push Changes
     |
Create Pull Request
```

### Recommended Commit Convention

```text
feat: add patient management
fix: resolve appointment validation
refactor: improve doctor service
style: update dashboard layout
docs: update README
chore: update dependencies
```

Before pushing changes, run:

```bash
npm run lint
npm run build
```

---

## Security & Best Practices

Because Hosta handles healthcare-related information, security and responsible data management are important.

Recommended practices include:

- Use secure authentication mechanisms.
- Enforce authorization on backend APIs.
- Apply role-based access restrictions.
- Keep sensitive credentials on the server.
- Use HTTPS in production.
- Protect patient information from unauthorized access.
- Validate user inputs.
- Secure file upload and storage operations.
- Apply appropriate Firebase security rules.
- Restrict API keys to authorized domains and APIs.
- Maintain appropriate audit and session records.
- Rotate credentials immediately if they are exposed.

**Note:** Application-level role restrictions should always be supported by backend authorization. Frontend route protection alone is not a security boundary.

---

## Future Development & Extensibility

The modular architecture provides a foundation for maintaining existing modules and extending the platform with additional healthcare management capabilities.

New functionality should follow the existing component, API service, permission, and real-time event architecture.

---

## Support & Issue Reporting

For project-related issues, bugs, or feature requests, contact the project development or maintenance team.

When reporting an issue, provide:

- Affected module.
- Steps to reproduce.
- Expected behavior.
- Actual behavior.
- Browser and device information.
- Error messages or screenshots.
- Relevant console or API errors.

**Official Website:** https://hostahospital.com/

---

## License

License information should be added according to the project's actual distribution and ownership terms.

For a proprietary repository, an appropriate notice can be used:

> This project is proprietary software. Unauthorized copying, distribution, modification, or commercial use is prohibited without explicit permission from the copyright owner.

---

## Built With

React · Vite · Redux Toolkit · RTK Query · Tailwind CSS · Radix UI · Firebase · Socket.IO · Google Maps · S3-compatible Storage · Recharts

---

<p align="center">
  <strong>Hosta — Connecting Healthcare Through Technology.</strong>
  <br/>
  <a href="https://hostahospital.com/">Visit the Official Website</a>
</p>