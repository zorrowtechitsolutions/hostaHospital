import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const PermissionList = () => {
    const { roleName } = useParams();   // ✅ get role name    
   const navigate = useNavigate();     // ✅ back navigation


  // Main modules with CRUD permissions
  const [mainModules, setMainModules] = useState([
    { id: "patients", name: "Patients", create: false, edit: false, delete: false, view: false },
    { id: "doctors", name: "Doctors", create: false, edit: false, delete: false, view: true },
    { id: "visits", name: "Visits", create: false, edit: false, delete: false, view: false },
    { id: "requests", name: "Requests", create: false, edit: false, delete: false, view: false },
    { id: "appointments", name: "Appointments", create: false, edit: false, delete: false, view: false },
    { id: "laboratory", name: "Laboratory", create: false, edit: false, delete: false, view: false },
    { id: "messages", name: "Messages", create: false, edit: false, delete: false, view: false },
    { id: "contacts", name: "Contacts", create: false, edit: false, delete: false, view: false },
    { id: "notifications", name: "Notifications", create: false, edit: false, delete: false, view: false },
  ]);

  // Medical modules with CRUD permissions (same as main)
  const [medicalModules, setMedicalModules] = useState([
    { id: "labResults", name: "Lab Results", create: false, edit: false, delete: false, view: false },
    { id: "medicalRecords", name: "Medical Records", create: false, edit: false, delete: false, view: false },
  ]);

  // Manage modules with CRUD permissions (same as main)
  const [manageModules, setManageModules] = useState([
    { id: "pharmacy", name: "Pharmacy", create: false, edit: false, delete: false, view: false },
    { id: "staffs", name: "Staffs", create: false, edit: false, delete: false, view: false },
    { id: "settings", name: "Settings", create: false, edit: false, delete: false, view: false },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  // Toggle single permission in main modules
  const toggleMainPermission = (moduleId, permissionType) => {
    setMainModules(prev =>
      prev.map(module =>
        module.id === moduleId
          ? { ...module, [permissionType]: !module[permissionType] }
          : module
      )
    );
  };

  // Toggle allow all for main module
  const toggleMainAllowAll = (moduleId) => {
    setMainModules(prev =>
      prev.map(module => {
        if (module.id === moduleId) {
          const newValue = !(module.create && module.edit && module.delete && module.view);
          return {
            ...module,
            create: newValue,
            edit: newValue,
            delete: newValue,
            view: newValue,
          };
        }
        return module;
      })
    );
  };

  // Check if main module has all permissions
  const isMainAllowAllChecked = (module) => {
    return module.create && module.edit && module.delete && module.view;
  };

  // Toggle single permission in medical modules
  const toggleMedicalPermission = (moduleId, permissionType) => {
    setMedicalModules(prev =>
      prev.map(module =>
        module.id === moduleId
          ? { ...module, [permissionType]: !module[permissionType] }
          : module
      )
    );
  };

  // Toggle allow all for medical module
  const toggleMedicalAllowAll = (moduleId) => {
    setMedicalModules(prev =>
      prev.map(module => {
        if (module.id === moduleId) {
          const newValue = !(module.create && module.edit && module.delete && module.view);
          return {
            ...module,
            create: newValue,
            edit: newValue,
            delete: newValue,
            view: newValue,
          };
        }
        return module;
      })
    );
  };

  // Check if medical module has all permissions
  const isMedicalAllowAllChecked = (module) => {
    return module.create && module.edit && module.delete && module.view;
  };

  // Toggle single permission in manage modules
  const toggleManagePermission = (moduleId, permissionType) => {
    setManageModules(prev =>
      prev.map(module =>
        module.id === moduleId
          ? { ...module, [permissionType]: !module[permissionType] }
          : module
      )
    );
  };

  // Toggle allow all for manage module
  const toggleManageAllowAll = (moduleId) => {
    setManageModules(prev =>
      prev.map(module => {
        if (module.id === moduleId) {
          const newValue = !(module.create && module.edit && module.delete && module.view);
          return {
            ...module,
            create: newValue,
            edit: newValue,
            delete: newValue,
            view: newValue,
          };
        }
        return module;
      })
    );
  };

  // Check if manage module has all permissions
  const isManageAllowAllChecked = (module) => {
    return module.create && module.edit && module.delete && module.view;
  };

  // Filter main modules by search
  const filteredMainModules = mainModules.filter(module =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter medical modules by search
  const filteredMedicalModules = medicalModules.filter(module =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter manage modules by search
  const filteredManageModules = manageModules.filter(module =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    const permissions = {
      main: mainModules,
      medical: medicalModules,
      manage: manageModules,
    };
    console.log("Saved permissions:", permissions);
    alert("Permissions saved successfully!");
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to discard your changes?")) {
      window.location.reload();
    }
  };

  // Reusable Checkbox component
  const CheckboxCell = ({ checked, onToggle }) => (
    <td className="px-4 py-4 text-center">
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center mx-auto transition ${
          checked
            ? "bg-[#1C62A0] border-[#1C62A0]"
            : "border-gray-300 hover:border-[#1C62A0]"
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
    </td>
  );

  // Reusable Table component for modules
  const PermissionsTable = ({ title, modules, onTogglePermission, onToggleAllowAll, isAllowAllChecked, filteredModules }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Module
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Create
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Edit
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Delete
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                View
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Allow All
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredModules.length > 0 ? (
              filteredModules.map((module) => (
                <tr key={module.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-800">{module.name}</span>
                  </td>
                  <CheckboxCell
                    checked={module.create}
                    onToggle={() => onTogglePermission(module.id, "create")}
                  />
                  <CheckboxCell
                    checked={module.edit}
                    onToggle={() => onTogglePermission(module.id, "edit")}
                  />
                  <CheckboxCell
                    checked={module.delete}
                    onToggle={() => onTogglePermission(module.id, "delete")}
                  />
                  <CheckboxCell
                    checked={module.view}
                    onToggle={() => onTogglePermission(module.id, "view")}
                  />
                  <CheckboxCell
                    checked={isAllowAllChecked(module)}
                    onToggle={() => onToggleAllowAll(module.id)}
                  />
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  No modules found matching "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        

        
{/* Header */}
<div className="mb-6">



  {/* Title */}
  <h1 className="text-2xl font-bold text-gray-800">

      {/* Back Button */}
<button
  onClick={() => navigate("/settings", { state: { tab: "User Permissions" } })}
  className="mb-3 text-sm text-[#090909]  flex items-center gap-1"
>
  ← Back
</button>

    Edit Permission
  </h1>

  {/* Breadcrumb */}
  <p className="text-sm text-gray-500 mt-1">
    Users | <span className="text-gray-800 font-medium">{roleName}</span>
  </p>

</div>


        {/* Last Updated */}
        <div className="mb-4 text-right">
          <span className="text-xs text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </span>
        </div>

        {/* Search Bar */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-80 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
          />
        </div>

        {/* Main Modules Table */}
        <PermissionsTable
          title="MAIN"
          modules={mainModules}
          onTogglePermission={toggleMainPermission}
          onToggleAllowAll={toggleMainAllowAll}
          isAllowAllChecked={isMainAllowAllChecked}
          filteredModules={filteredMainModules}
        />

        {/* Medical Modules Table */}
        <PermissionsTable
          title="MEDICAL"
          modules={medicalModules}
          onTogglePermission={toggleMedicalPermission}
          onToggleAllowAll={toggleMedicalAllowAll}
          isAllowAllChecked={isMedicalAllowAllChecked}
          filteredModules={filteredMedicalModules}
        />

        {/* Manage Modules Table */}
        <PermissionsTable
          title="MANAGE"
          modules={manageModules}
          onTogglePermission={toggleManagePermission}
          onToggleAllowAll={toggleManageAllowAll}
          isAllowAllChecked={isManageAllowAllChecked}
          filteredModules={filteredManageModules}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-5 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-white bg-[#1C62A0] rounded-lg hover:bg-[#1C62A0]/90 transition font-medium"
          >
            Save Permissions
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionList;