// src/components/Settings/PermissionList.jsx - With dynamic permissions and hidden modules filter (Fixed with save logging)
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Input, Card, Checkbox, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, SearchBar } from "../ui";
import { showSuccessToast, showWarningToast, showErrorToast } from "../ui/Toast";
import {
  useCreateRolePermissionMutation,
  useGetRolePermissionsQuery,
} from "../../../app/service/rolePermission";
import { useGetPermissionsQuery } from "../../../app/service/permission";
import { getHospitalId } from '../../utils/auth';

const PermissionList = () => {
  const { roleId } = useParams();
  const navigate = useNavigate();

  // Initialize as empty array
  const [mainModules, setMainModules] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Get hospitalId from auth utility
  const hospitalId = getHospitalId();

  const [createRolePermission] = useCreateRolePermissionMutation();

  // Get all permissions data
  const { data: permissionsData, isLoading: isLoadingPermissions } = useGetPermissionsQuery();
  
  // Log the permissions data to see the structure
  useEffect(() => {
    console.log("permissionsData", permissionsData);
  }, [permissionsData]);

  const { data: permissionData } = useGetRolePermissionsQuery({
    roleId,
  });

  // Dynamically build modules from permissionsData using module and action fields
  useEffect(() => {
    if (!permissionsData?.data?.length) return;

    // Define modules to hide/exclude
    const hiddenModules = [
      "users",
      "donors",
      "ad",
      "medicinremainder",
      "report",
      "test",
      "speciality",
      "role",
      "permission",
      "role-permission",
    ];

    const modulesMap = new Map();

    permissionsData.data.forEach((permission) => {
      const moduleName = permission.module;
      const action = permission.action;

      // Skip hidden modules
      if (hiddenModules.includes(moduleName?.toLowerCase())) {
        return;
      }

      if (!moduleName || !action) return;

      if (!modulesMap.has(moduleName)) {
        modulesMap.set(moduleName, {
          id: moduleName,
          name: moduleName.charAt(0).toUpperCase() + moduleName.slice(1),
          createId: null,
          editId: null,
          deleteId: null,
          viewId: null,
          create: false,
          edit: false,
          delete: false,
          view: false,
        });
      }

      const module = modulesMap.get(moduleName);

      switch (action.toLowerCase()) {
        case "create":
          module.createId = permission.id;
          break;
        case "edit":
          module.editId = permission.id;
          break;
        case "delete":
          module.deleteId = permission.id;
          break;
        case "view":
          module.viewId = permission.id;
          break;
        default:
          console.warn("Unknown action:", action);
      }
    });

    const modulesArray = Array.from(modulesMap.values());
    console.log("Built modules (hidden modules excluded):", modulesArray);
    setMainModules(modulesArray);
  }, [permissionsData]);

  // Apply assigned permissions to modules
  useEffect(() => {
    if (permissionData?.data && mainModules.length > 0) {
      const assignedPermissions = permissionData.data.map(
        (item) => Number(item.permissionId)
      );

      setMainModules((prev) =>
        prev.map((module) => ({
          ...module,
          create: module.createId ? assignedPermissions.includes(Number(module.createId)) : false,
          edit: module.editId ? assignedPermissions.includes(Number(module.editId)) : false,
          delete: module.deleteId ? assignedPermissions.includes(Number(module.deleteId)) : false,
          view: module.viewId ? assignedPermissions.includes(Number(module.viewId)) : false,
        }))
      );
    }
  }, [permissionData]);

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

  const filteredMainModules = mainModules.filter(module => 
    module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    try {
      setIsSaving(true);

      let permissionIds = [];

      mainModules.forEach((module) => {
        if (module.create && module.createId) permissionIds.push(module.createId);
        if (module.edit && module.editId) permissionIds.push(module.editId);
        if (module.delete && module.deleteId) permissionIds.push(module.deleteId);
        if (module.view && module.viewId) permissionIds.push(module.viewId);
      });

      // Log what's being saved
      console.log("Saving permissions:", permissionIds);
      console.log("Saving permissions details:", {
        roleId: Number(roleId),
        permissionIds: permissionIds,
        count: permissionIds.length
      });

      const payload = {
        roleId: Number(roleId),
        permissionIds,
      };

      const result = await createRolePermission(payload).unwrap();
      console.log("Save result:", result);

      showSuccessToast("Permission saved successfully");
    } catch (error) {
      console.error("Save error:", error);
      showErrorToast("Failed to save permission");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to discard your changes?")) {
      showWarningToast("Changes discarded. Permissions restored to previous state.", 3000);
      window.location.reload();
    }
  };

  const PermissionCheckbox = ({ checked, onToggle, disabled = false }) => (
    <TableCell className="text-center">
      <Checkbox checked={checked} onChange={onToggle} disabled={disabled} />
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
                  <PermissionCheckbox 
                    checked={module.create} 
                    onToggle={() => togglePermission(setter, module.id, "create")}
                    disabled={!module.createId}
                  />
                  <PermissionCheckbox 
                    checked={module.edit} 
                    onToggle={() => togglePermission(setter, module.id, "edit")}
                    disabled={!module.editId}
                  />
                  <PermissionCheckbox 
                    checked={module.delete} 
                    onToggle={() => togglePermission(setter, module.id, "delete")}
                    disabled={!module.deleteId}
                  />
                  <PermissionCheckbox 
                    checked={module.view} 
                    onToggle={() => togglePermission(setter, module.id, "view")}
                    disabled={!module.viewId}
                  />
                  <PermissionCheckbox 
                    checked={isAllowAllChecked(module)} 
                    onToggle={() => toggleAllowAll(setter, module.id)}
                    disabled={!module.createId && !module.editId && !module.deleteId && !module.viewId}
                  />
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

  // Show loading state while fetching permissions
  if (isLoadingPermissions) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/settings", { state: { tab: "User Permissions" } })} className="mb-3 text-sm flex items-center gap-1">← Back</Button>
          <h1 className="text-2xl font-bold text-gray-800">Edit Permission</h1>
          <p className="text-sm text-gray-500 mt-1">Users | <span className="text-gray-800 font-medium">{roleId}</span></p>
        </div>

        <div className="mb-4 text-right">
          <span className="text-xs text-gray-400">Last updated: {new Date().toLocaleDateString()}</span>
        </div>

        <SearchBar placeholder="Search modules..." value={searchTerm} onChange={setSearchTerm} className="mb-5 w-80" />

        {mainModules.length === 0 && !isLoadingPermissions ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No permissions found. Please check the API response structure.</p>
            <p className="text-xs text-gray-400 mt-2">Check console for permissionsData log</p>
          </Card>
        ) : (
          <PermissionsTable title="MAIN" modules={mainModules} setter={setMainModules} filteredModules={filteredMainModules} />
        )}

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