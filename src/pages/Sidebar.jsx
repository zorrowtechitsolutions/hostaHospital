// src/components/Sidebar.jsx - With proper role-based user data
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  UserCog,
  Settings,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Activity,
  Ambulance,
  FileClock,
  Droplet,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../utils/permission";
import { useGetHospitalByIdQuery } from "../../app/service/hospitalApi";
import { useGetDoctorByIdQuery } from "../../app/service/doctorApi";
import { useGetStaffByIdQuery } from "../../app/service/staffApi";

// Menu with permission IDs - Dashboard and Help have no permission (always visible)
const menu = [
  {
    title: "MAIN",
    items: [
      { 
        label: "Dashboard", 
        icon: LayoutDashboard, 
        path: "/dashboard" 
      },
    ],
  },
  {
    title: "HEALTHCARE",
    items: [
      { label: "Patients", icon: Users, path: "/patients", permissionId: 14 },
      { label: "Doctors", icon: Stethoscope, path: "/doctors", permissionId: 2 },
      { label: "Requests", icon: ClipboardList, path: "/requests", permissionId: 34 },
      {
        label: "Appointments",
        icon: CalendarDays,
        permissionId: 34,
        hasDropdown: true,
        dropdownItems: [
          { label: "Appointments List", icon: FileClock, path: "/appointments", permissionId: 34 },
        ],
      },
      { label: "Visits", icon: Activity, path: "/visits", permissionId: 34 },
      { label: "Ambulance", icon: Ambulance, path: "/ambulance", permissionId: 30 },
      { label: "Blood Bank", icon: Droplet, path: "/blood", permissionId: 26 },
    ],
  },
  {
    title: "MANAGE",
    items: [{ label: "Staffs", icon: UserCog, path: "/staffs", permissionId: 10 }],
  },
  {
    title: "SYSTEM",
    items: [
      {
        label: "Settings",
        icon: Settings,
        path: "/settings",
        permissionId: 58,
      },
      {
        label: "User Management",
        icon: UserCog,
        permissionId: 58,
        hasDropdown: true,
        dropdownItems: [
          {
            label: "Users",
            icon: Users,
            path: "/users",
            permissionId: 58,
          },
          {
            label: "Group Permission",
            icon: ShieldCheck,
            path: "/roles",
            permissionId: 58,
          },
        ],
      },
    ],
  },
  {
    title: "HELP",
    items: [{ label: "Help & Support", icon: HelpCircle, path: "/help" }], // No permissionId - always visible
  },
];

export default function Sidebar({ sidebarOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openDropdowns, setOpenDropdowns] = useState({});
  
  // ✅ Get user role and IDs
  const userRole = user?.role || localStorage.getItem('userRole') || 'hospital';
  const hospitalId = localStorage.getItem('hospitalId') || '';
  
  // ✅ Get user ID based on role
  const getUserIdByRole = () => {
    const authId = localStorage.getItem('authId');
    const userId = localStorage.getItem('userId');
    const doctorId = localStorage.getItem('doctorId');
    const staffId = localStorage.getItem('staffId');
    
    let userData = {};
    try {
      userData = JSON.parse(localStorage.getItem('userData') || '{}');
    } catch (e) {}
    
    switch (userRole) {
      case 'hospital':
        return authId || userId || hospitalId || userData?.authId || userData?.hospitalId || userData?.id;
      case 'doctor':
        return authId || userId || doctorId || userData?.authId || userData?.id;
      case 'staff':
        return staffId || staffNumericId || userData?.authId || userData?.id;
      case 'super_admin':
        return authId || userId || userData?.authId || userData?.id;
      default:
        return authId || userId || hospitalId;
    }
  };
  
  const userId = getUserIdByRole();
  
  // ✅ Fetch data based on user role
  const { data: hospitalData } = useGetHospitalByIdQuery(
    userId,
    { skip: userRole !== 'hospital' || !userId || userId === 'undefined' || userId === 'null' }
  );
  
  const { data: doctorData } = useGetDoctorByIdQuery(
    userId,
    { skip: userRole !== 'doctor' || !userId || userId === 'undefined' || userId === 'null' }
  );
  
  const { data: staffData } = useGetStaffByIdQuery(
    userId,
    { skip: userRole !== 'staff' || !userId || userId === 'undefined' || userId === 'null' }
  );
  
  // ✅ Get user data from localStorage as fallback
  let userDataFromStorage = {};
  try {
    userDataFromStorage = JSON.parse(localStorage.getItem('userData') || '{}');
  } catch (e) {}
  
  let storedUser = {};
  try {
    storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  } catch (e) {}
  
  // ✅ Get the correct display name based on role
  const getDisplayName = () => {
    // For DOCTOR role
    if (userRole === 'doctor') {
      const doctor = doctorData?.data || doctorData;
      return doctor?.name || 
             (doctor?.firstName && doctor?.lastName ? `${doctor.firstName} ${doctor.lastName}` : null) ||
             user?.name || 
             userDataFromStorage?.name || 
             storedUser?.name || 
             'Doctor';
    }
    
    // For STAFF role
    if (userRole === 'staff') {
      const staff = staffData?.data || staffData;
      return staff?.name || 
             user?.name || 
             userDataFromStorage?.name || 
             storedUser?.name || 
             'Staff';
    }
    
    // For SUPER_ADMIN role
    if (userRole === 'super_admin') {
      return user?.name || 
             userDataFromStorage?.name || 
             storedUser?.name || 
             'Super Admin';
    }
    
    // Default: HOSPITAL role
    const hospital = hospitalData?.data || hospitalData;
    return user?.name || 
           user?.hospitalName || 
           hospital?.name || 
           userDataFromStorage?.name || 
           userDataFromStorage?.hospitalName || 
           storedUser?.name || 
           storedUser?.hospitalName || 
           'Hospital';
  };
  
  // ✅ Get the raw display name without prefix
  const displayName = getDisplayName();
  
  // ✅ Create the final display title with role-based prefix
  const getDisplayTitle = () => {
    if (userRole === 'doctor') {
      return `Dr. ${displayName}`;
    } else if (userRole === 'hospital') {
      return displayName; // Hospital name without prefix
    } else if (userRole === 'staff') {
      return displayName; // Staff name without prefix
    } else if (userRole === 'super_admin') {
      return displayName; // Super Admin without prefix
    }
    return displayName;
  };
  
  const displayTitle = getDisplayTitle();

  const toggleDropdown = (label) => {
    setOpenDropdowns((prev) => ({
      [label]: !prev[label],
    }));
  };

  const isActive = (path) => location.pathname === path;

  const shouldKeepOpen = (dropdownItems) => {
    return dropdownItems?.some((item) => location.pathname.startsWith(item.path));
  };

  const isDropdownItemActive = (dropdownItems) => {
    return dropdownItems?.some((item) => location.pathname === item.path);
  };

  // Memoize filtered menu to prevent unnecessary recalculations
  const filteredMenu = useMemo(() => {
    return menu
      .map((section) => {
        const visibleItems = section.items
          .map((item) => {
            // Dashboard and Help are always visible (no permission check)
            if (item.path === "/dashboard" || item.path === "/help") {
              return item;
            }
            
            // For items with dropdown
            if (item.hasDropdown) {
              const visibleDropdownItems = item.dropdownItems.filter(
                (dropdownItem) => {
                  if (!dropdownItem.permissionId) return true;
                  return hasPermission(dropdownItem.permissionId);
                }
              );
              
              if (visibleDropdownItems.length === 0) return null;
              
              return {
                ...item,
                dropdownItems: visibleDropdownItems,
              };
            }
            
            // For regular items with permission
            if (!item.permissionId) return item;
            if (!hasPermission(item.permissionId)) return null;
            
            return item;
          })
          .filter(Boolean);

        if (visibleItems.length === 0) return null;

        return {
          ...section,
          items: visibleItems,
        };
      })
      .filter(Boolean);
  }, []);

  // Effect only depends on location.pathname
  useEffect(() => {
    const newOpenState = {};
    filteredMenu.forEach((section) => {
      section.items.forEach((item) => {
        if (item.hasDropdown && shouldKeepOpen(item.dropdownItems)) {
          newOpenState[item.label] = true;
        }
      });
    });
    setOpenDropdowns((prev) => ({ ...prev, ...newOpenState }));
  }, [location.pathname, filteredMenu]);

  const shouldShowTitles = filteredMenu.length > 1;

  // Helper function for menu item classes
  const getMenuItemClasses = (isActive, isDropdown = false) => {
    const baseClasses = "w-full h-12 flex items-center rounded-md text-sm transition";
    const activeClasses = isActive 
      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" 
      : "text-gray-300 hover:bg-slate-700";
    
    if (isDropdown) {
      return `${baseClasses} ${sidebarOpen ? "px-3 gap-3 justify-start" : "justify-center"} ${activeClasses}`;
    }
    
    return `${baseClasses} ${sidebarOpen ? "px-3 gap-3 justify-start" : "justify-center"} relative group ${activeClasses}`;
  };

  return (
    <div
      className={`${
        sidebarOpen ? "w-64" : "w-20"
      } bg-[#0f172a] text-white h-screen fixed left-0 top-0 flex flex-col shadow-lg transition-all duration-300 z-20`}
    >
      {/* Logo Section - Shows user identity based on role */}
      <div className="p-5 border-b border-slate-700">
        {sidebarOpen ? (
          <h1 className="text-lg font-semibold truncate">
            {displayTitle}
          </h1>
        ) : (
          <h1 className="text-lg font-semibold text-center">
            {displayTitle.charAt(0).toUpperCase()}
          </h1>
        )}
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
        {filteredMenu.map((section) => (
          <div key={section.title}>
            {sidebarOpen && shouldShowTitles && (
              <p className="text-xs text-gray-400 mb-2">{section.title}</p>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                if (item.hasDropdown) {
                  const dropdownActive = isDropdownItemActive(item.dropdownItems);
                  const isOpen = openDropdowns[item.label] || shouldKeepOpen(item.dropdownItems);

                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => {
                          if (sidebarOpen) {
                            toggleDropdown(item.label);
                          } else if (item.dropdownItems?.[0]) {
                            navigate(item.dropdownItems[0].path);
                          }
                        }}
                        className={`
                          w-full h-12 flex items-center justify-between
                          ${sidebarOpen ? "px-3" : "justify-center"}
                          rounded-md text-sm transition
                          ${dropdownActive ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-700"}
                        `}
                      >
                        <div className={`flex items-center ${sidebarOpen ? "gap-3" : "justify-center w-full"}`}>
                          <item.icon size={18} />
                          {sidebarOpen && item.label}
                        </div>
                        {sidebarOpen && (
                          isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                        )}
                      </button>

                      {sidebarOpen && isOpen && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.dropdownItems.map((dropdownItem) => {
                            const dropdownItemActive = isActive(dropdownItem.path);
                            return (
                              <Link
                                key={dropdownItem.path}
                                to={dropdownItem.path}
                                onClick={() => {
                                  setOpenDropdowns((prev) => ({
                                    ...prev,
                                    [item.label]: true,
                                  }));
                                }}
                                className={getMenuItemClasses(dropdownItemActive, true)}
                              >
                                <dropdownItem.icon size={16} />
                                {dropdownItem.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {!sidebarOpen && (
                        <div className="relative group">
                          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50 shadow-lg">
                            {item.label}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={getMenuItemClasses(active)}
                  >
                    <item.icon size={18} />
                    {sidebarOpen && item.label}

                    {!sidebarOpen && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50 shadow-lg">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}