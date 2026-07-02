// src/components/Sidebar.jsx - With proper immutability and memoization
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  FlaskConical,
  Pill,
  UserCog,
  Settings,
  ChevronDown,
  ChevronRight,
  FileText,
  Microscope,
  PlusCircle,
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

// ✅ Menu with permission IDs - Dashboard has no permission (always visible)
const menu = [
  {
    title: "MAIN",
    items: [
      { 
        label: "Dashboard", 
        icon: LayoutDashboard, 
        path: "/dashboard" 
        // ✅ No permissionId - always visible for all roles
      },
    ],
  },
  {
    title: "HEALTHCARE",
    items: [
      { label: "Patients", icon: Users, path: "/patients", permissionId: 14 },
      { label: "Doctors", icon: Stethoscope, path: "/doctors", permissionId: 2 },
      { label: "Requests", icon: ClipboardList, path: "/requests", permissionId: 7 },
      {
        label: "Appointments",
        icon: CalendarDays,
        permissionId: 6,
        hasDropdown: true,
        dropdownItems: [
          { label: "Appointments List", icon: FileClock, path: "/appointments", permissionId: 6 },
          { label: "Consultation", icon: Stethoscope, path: "/appointments/consultation", permissionId: 6 },
        ],
      },
      { label: "Visits", icon: Activity, path: "/visits", permissionId: 9 },
      { label: "Ambulance", icon: Ambulance, path: "/ambulance", permissionId: 46 },
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
        permissionId: 52,
      },
      {
        label: "User Management",
        icon: UserCog,
        permissionId: 50,
        hasDropdown: true,
        dropdownItems: [
          {
            label: "Users",
            icon: Users,
            path: "/users",
            permissionId: 50,
          },
          {
            label: "Group Permission",
            icon: ShieldCheck,
            path: "/roles",
            permissionId: 51,
          },
        ],
      },
    ],
  },
  {
    title: "HELP",
    items: [{ label: "Help & Support", icon: HelpCircle, path: "/help", permissionId: 53 }],
  },
];

export default function Sidebar({ sidebarOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openDropdowns, setOpenDropdowns] = useState({});

  const toggleDropdown = (label) => {
    setOpenDropdowns((prev) => ({
      [label]: !prev[label],
    }));
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const shouldKeepOpen = (dropdownItems) => {
    return dropdownItems?.some(
      (item) => location.pathname.startsWith(item.path)
    );
  };

  const isDropdownItemActive = (dropdownItems) => {
    return dropdownItems?.some(
      (item) => location.pathname === item.path
    );
  };

  // ✅ Memoize filtered menu to prevent unnecessary recalculations
  const filteredMenu = useMemo(() => {
    return menu
      .map((section) => {
        // ✅ Create new items array without mutating original
        const visibleItems = section.items
          .map((item) => {
            // ✅ Dashboard is always visible (no permissionId)
            if (item.path === "/dashboard") return item;
            
            // For items with dropdown
            if (item.hasDropdown) {
              // ✅ Filter dropdown items without mutating original
              const visibleDropdownItems = item.dropdownItems.filter(
                (dropdownItem) => {
                  if (!dropdownItem.permissionId) return true;
                  return hasPermission(dropdownItem.permissionId);
                }
              );
              
              // If no dropdown items are visible, hide the parent
              if (visibleDropdownItems.length === 0) return null;
              
              // ✅ Return new object instead of mutating
              return {
                ...item,
                dropdownItems: visibleDropdownItems,
              };
            }
            
            // For regular items
            if (!item.permissionId) return item;
            if (!hasPermission(item.permissionId)) return null;
            
            return item;
          })
          .filter(Boolean); // Remove null items

        // ✅ Only return section if it has visible items
        if (visibleItems.length === 0) return null;

        return {
          ...section,
          items: visibleItems,
        };
      })
      .filter(Boolean); // Remove null sections
  }, []); // ✅ Empty dependency array - menu is static

  // ✅ Effect only depends on location.pathname
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

  // ✅ Check if we should show section titles
  const shouldShowTitles = filteredMenu.length > 1;

  return (
    <div
      className={`${
        sidebarOpen ? "w-64" : "w-20"
      } bg-[#0f172a] text-white h-screen fixed left-0 top-0 flex flex-col shadow-lg transition-all duration-300 z-20`}
    >
      {/* Logo Section */}
      <div className="p-5 border-b border-slate-700">
        {sidebarOpen ? (
          <h1 className="text-lg font-semibold truncate">
            {user?.name || "Hospital"}
          </h1>
        ) : (
          <h1 className="text-lg font-semibold text-center">
            {(user?.name || "H").charAt(0).toUpperCase()}
          </h1>
        )}
      </div>

      {/* Menu with custom scrollbar - Only render filtered sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
        {filteredMenu.map((section) => (
          <div key={section.title}>
            {/* ✅ Only show section title if there are multiple sections */}
            {sidebarOpen && shouldShowTitles && (
              <p className="text-xs text-gray-400 mb-2">{section.title}</p>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                // For items with dropdown
                if (item.hasDropdown) {
                  const dropdownActive = isDropdownItemActive(item.dropdownItems);
                  const isOpen = openDropdowns[item.label] || shouldKeepOpen(item.dropdownItems);

                  return (
                    <div key={item.label}>
                      {/* Dropdown Button */}
                      <button
                        onClick={() => {
                          if (sidebarOpen) {
                            toggleDropdown(item.label);
                          } else if (!sidebarOpen && item.dropdownItems?.[0]) {
                            navigate(item.dropdownItems[0].path);
                          }
                        }}
                        className={`
                          w-full h-12 flex items-center justify-between
                          ${sidebarOpen ? "px-3" : "justify-center"}
                          rounded-md text-sm transition
                          ${
                            dropdownActive
                              ? "bg-slate-700 text-white"
                              : "text-gray-300 hover:bg-slate-700"
                          }
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

                      {/* Dropdown Items */}
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
                                className={`
                                  w-full h-12 flex items-center
                                  ${sidebarOpen ? "px-3 gap-3 justify-start" : "justify-center"}
                                  rounded-md text-sm transition relative group
                                  ${
                                    dropdownItemActive
                                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                                      : "text-gray-400 hover:bg-slate-700 hover:text-gray-200"
                                  }
                                `}
                              >
                                <dropdownItem.icon size={16} />
                                {dropdownItem.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {/* Collapsed sidebar tooltip */}
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

                // Regular items without dropdown
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      w-full h-12 flex items-center
                      ${sidebarOpen ? "px-3 gap-3 justify-start" : "justify-center"}
                      rounded-md text-sm transition relative group
                      ${
                        active
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                          : "text-gray-300 hover:bg-slate-700"
                      }
                    `}
                  >
                    <item.icon size={18} />
                    {sidebarOpen && item.label}

                    {/* Tooltip for collapsed sidebar */}
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