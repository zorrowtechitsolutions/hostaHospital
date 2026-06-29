// src/components/superadmin/permission/HospitalPermissionList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button, Card, Checkbox, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, SearchBar } from "../../ui";
import { showSuccessToast, showWarningToast, showErrorToast } from "../../ui/Toast";
import {
  useCreateRolePermissionMutation,
  useGetRolePermissionsQuery,
} from "../../../../app/service/rolePermission";
import { useGetPermissionsQuery } from "../../../../app/service/permission";

// ✅ Import socket
import { socket } from '../../../socket/socket';
// ✅ Import socket event listeners
import { registerPermissionEvents, unregisterPermissionEvents } from '../../../socket/permissionEvents';
import { registerRolePermissionEvents, unregisterRolePermissionEvents } from '../../../socket/rolePermissionEvents';

const HospitalPermissionList = () => {
  const { hospitalId, roleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hospitalName, roleName } = location.state || {};

  const [mainModules, setMainModules] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Track if events are registered
  const [eventsRegistered, setEventsRegistered] = useState(false);

  const [createRolePermission] = useCreateRolePermissionMutation();

  // Get all permissions data
  const { data: permissionsData, isLoading: isLoadingPermissions, refetch: refetchPermissions } = useGetPermissionsQuery();
  
  // Get role permissions - uses roleId from params
  const { data: permissionData, refetch: refetchRolePermissions } = useGetRolePermissionsQuery({
    roleId,
  });

  // ✅ Register socket event listeners for real-time updates
  useEffect(() => {
    console.log("🔄 Registering permission event listeners for Hospital Permission...");
    
    registerPermissionEvents({
      onPermissionRegistered: (data) => {
        console.log("🔑 New permission registered:", data);
        showSuccessToast(`New permission created!`, 3000);
        refetchPermissions();
      },
      
      onPermissionUpdated: (data) => {
        console.log("✏️ Permission updated:", data);
        showSuccessToast(`Permission updated!`, 3000);
        refetchPermissions();
      },
      
      onPermissionDeleted: (data) => {
        console.log("🗑️ Permission deleted:", data);
        showSuccessToast(`Permission deleted!`, 3000);
        refetchPermissions();
      }
    });

    registerRolePermissionEvents({
      onRolePermissionUpdated: (data) => {
        console.log("🔐 Role permission updated:", data);
        showSuccessToast(`Role permissions updated!`, 3000);
        refetchRolePermissions();
        refetchPermissions();
      }
    });

    setEventsRegistered(true);

    return () => {
      console.log("🧹 Unregistering permission events for Hospital Permission...");
      unregisterPermissionEvents();
      unregisterRolePermissionEvents();
      setEventsRegistered(false);
    };
  }, [refetchPermissions, refetchRolePermissions]);

  // ✅ Listen for socket connection/disconnection
  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Socket CONNECTED - Permission events will work!");
      if (!eventsRegistered) {
        registerPermissionEvents({
          onPermissionRegistered: (data) => {
            console.log("🔑 New permission registered (reconnect):", data);
            showSuccessToast(`New permission created!`, 3000);
            refetchPermissions();
          },
          onPermissionUpdated: (data) => {
            console.log("✏️ Permission updated (reconnect):", data);
            showSuccessToast(`Permission updated!`, 3000);
            refetchPermissions();
          },
          onPermissionDeleted: (data) => {
            console.log("🗑️ Permission deleted (reconnect):", data);
            showSuccessToast(`Permission deleted!`, 3000);
            refetchPermissions();
          }
        });
        registerRolePermissionEvents({
          onRolePermissionUpdated: (data) => {
            console.log("🔐 Role permission updated (reconnect):", data);
            showSuccessToast(`Role permissions updated!`, 3000);
            refetchRolePermissions();
            refetchPermissions();
          }
        });
        setEventsRegistered(true);
      }
    };

    const handleDisconnect = () => {
      console.log("❌ Socket DISCONNECTED - Permission events won't work!");
      setEventsRegistered(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [refetchPermissions, refetchRolePermissions, eventsRegistered]);

  // ✅ Log all socket events for debugging
  useEffect(() => {
    const handleAnyEvent = (event, ...args) => {
      console.log(`📡 ALL SOCKET EVENTS - PERMISSION/HOSPITAL: ${event}:`, args);
    };

    socket.onAny(handleAnyEvent);

    return () => {
      socket.offAny(handleAnyEvent);
    };
  }, []);

  // Log the permissions data to see the structure
  useEffect(() => {
    console.log("permissionsData", permissionsData);
  }, [permissionsData]);

  // Dynamically build modules from permissionsData using module and action fields
  useEffect(() => {
    if (!permissionsData?.data?.length) return;

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

      // ✅ Emit socket event for role permission updated
      socket.emit("role_permission_event", {
        event: "ROLEPERMISSION_UPDATED",
        data: {
          roleId: Number(roleId),
          hospitalId: hospitalId,
          permissionIds: permissionIds,
          count: permissionIds.length,
          timestamp: new Date().toISOString()
        }
      });

      showSuccessToast("Permission saved successfully");
    } catch (error) {
      console.error("Save error:", error);
      showErrorToast(error?.data?.message || "Failed to save permission");
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

  // ✅ Handle back navigation - go to Hospital User Permissions
  const handleBack = () => {
    navigate(`/super-admin/hospital-users/${hospitalId}/permissions`, {
      state: {
        hospitalName: hospitalName,
        from: "HospitalPermissionList"
      }
    });
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
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack} 
            className="mb-3 text-sm flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Back to Roles
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Edit Permission</h1>
              <p className="text-sm text-gray-500 mt-1">
                {hospitalName || `Hospital ID: ${hospitalId}`} • 
                <span className="text-gray-800 font-medium ml-1">{roleName || `Role ID: ${roleId}`}</span>
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 text-sm text-gray-500">
            <span>Hospital ID: <span className="font-medium text-gray-700">{hospitalId}</span></span>
            <span>|</span>
            <span>Role ID: <span className="font-medium text-gray-700">{roleId}</span></span>
          </div>
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

export default HospitalPermissionList;