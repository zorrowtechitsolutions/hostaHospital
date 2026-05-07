// src/components/Settings/PermissionList.jsx - With toast notifications
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Input, Card, Checkbox, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, SearchBar } from "../ui";
import { showSuccessToast, showWarningToast, showErrorToast } from "../ui/Toast";

const PermissionList = () => {
  const { roleName } = useParams();
  const navigate = useNavigate();

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

  const [medicalModules, setMedicalModules] = useState([
    { id: "labResults", name: "Lab Results", create: false, edit: false, delete: false, view: false },
    { id: "medicalRecords", name: "Medical Records", create: false, edit: false, delete: false, view: false },
  ]);

  const [manageModules, setManageModules] = useState([
    { id: "pharmacy", name: "Pharmacy", create: false, edit: false, delete: false, view: false },
    { id: "staffs", name: "Staffs", create: false, edit: false, delete: false, view: false },
    { id: "settings", name: "Settings", create: false, edit: false, delete: false, view: false },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const togglePermission = (setter, moduleId, permissionType) => {
    setter(prev => prev.map(module =>
      module.id === moduleId ? { ...module, [permissionType]: !module[permissionType] } : module
    ));
  };

  const toggleAllowAll = (setter, moduleId) => {
    setter(prev => prev.map(module => {
      if (module.id === moduleId) {
        const newValue = !(module.create && module.edit && module.delete && module.view);
        return { ...module, create: newValue, edit: newValue, delete: newValue, view: newValue };
      }
      return module;
    }));
  };

  const isAllowAllChecked = (module) => module.create && module.edit && module.delete && module.view;

  const filteredMainModules = mainModules.filter(module => module.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredMedicalModules = medicalModules.filter(module => module.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredManageModules = manageModules.filter(module => module.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      const permissions = { main: mainModules, medical: medicalModules, manage: manageModules };
      console.log("Saved permissions:", permissions);
      
      const totalPermissions = [...mainModules, ...medicalModules, ...manageModules].length;
      const enabledPermissions = [...mainModules, ...medicalModules, ...manageModules].filter(m => m.create || m.edit || m.delete || m.view).length;
      
      showSuccessToast(
        `Permissions for "${roleName}" saved successfully!`,
        4000,
        {
          'Role': roleName,
          'Total Modules': totalPermissions,
          'Enabled Permissions': enabledPermissions
        }
      );
      setIsSaving(false);
    }, 500);
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to discard your changes?")) {
      showWarningToast("Changes discarded. Permissions restored to previous state.", 3000);
      window.location.reload();
    }
  };

  const PermissionCheckbox = ({ checked, onToggle }) => (
    <TableCell className="text-center">
      <Checkbox checked={checked} onChange={onToggle} />
    </TableCell>
  );

  const PermissionsTable = ({ title, modules, setter, filteredModules }) => (
    <Card className="mb-8">
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <TableHeader>Module</TableHeader>
              <TableHeader className="text-center">Create</TableHeader>
              <TableHeader className="text-center">Edit</TableHeader>
              <TableHeader className="text-center">Delete</TableHeader>
              <TableHeader className="text-center">View</TableHeader>
              <TableHeader className="text-center">Allow All</TableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredModules.length > 0 ? (
              filteredModules.map((module) => (
                <tr key={module.id} className="hover:bg-gray-50 transition">
                  <TableCell><span className="text-sm font-medium text-gray-800">{module.name}</span></TableCell>
                  <PermissionCheckbox checked={module.create} onToggle={() => togglePermission(setter, module.id, "create")} />
                  <PermissionCheckbox checked={module.edit} onToggle={() => togglePermission(setter, module.id, "edit")} />
                  <PermissionCheckbox checked={module.delete} onToggle={() => togglePermission(setter, module.id, "delete")} />
                  <PermissionCheckbox checked={module.view} onToggle={() => togglePermission(setter, module.id, "view")} />
                  <PermissionCheckbox checked={isAllowAllChecked(module)} onToggle={() => toggleAllowAll(setter, module.id)} />
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No modules found matching "{searchTerm}"</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/settings", { state: { tab: "User Permissions" } })} className="mb-3 text-sm flex items-center gap-1">← Back</Button>
          <h1 className="text-2xl font-bold text-gray-800">Edit Permission</h1>
          <p className="text-sm text-gray-500 mt-1">Users | <span className="text-gray-800 font-medium">{roleName}</span></p>
        </div>

        <div className="mb-4 text-right">
          <span className="text-xs text-gray-400">Last updated: {new Date().toLocaleDateString()}</span>
        </div>

        <SearchBar placeholder="Search modules..." value={searchTerm} onChange={setSearchTerm} className="mb-5 w-80" />

        <PermissionsTable title="MAIN" modules={mainModules} setter={setMainModules} filteredModules={filteredMainModules} />
        <PermissionsTable title="MEDICAL" modules={medicalModules} setter={setMedicalModules} filteredModules={filteredMedicalModules} />
        <PermissionsTable title="MANAGE" modules={manageModules} setter={setManageModules} filteredModules={filteredManageModules} />

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving} loading={isSaving}>
            {isSaving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PermissionList;