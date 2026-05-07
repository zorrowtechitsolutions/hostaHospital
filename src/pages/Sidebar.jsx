// src/components/Sidebar.jsx - With proper parent/child active states
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
} from "lucide-react";
import { useState, useEffect } from "react";

const menu = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    ],
  },
  {
    title: "HEALTHCARE",
    items: [
      { label: "Patients", icon: Users, path: "/patients" },
      { label: "Doctors", icon: Stethoscope, path: "/doctors" },
      { label: "Requests", icon: CalendarDays, path: "/requests" },
      {
        label: "Appointments",
        icon: CalendarDays,
        hasDropdown: true,
        dropdownItems: [
          { label: "Appointments List", icon: CalendarDays, path: "/appointments" },
          { label: "Consultation", icon: Stethoscope, path: "/appointments/consultation" },
        ],
      },
      { label: "Visits", icon: CalendarDays, path: "/visits" },
      // {
      //   label: "Laboratory",
      //   icon: FlaskConical,
      //   hasDropdown: true,
      //   dropdownItems: [
      //     { label: "Register Lab", icon: PlusCircle, path: "/laboratory" },
      //     { label: "Lab Tests", icon: Microscope, path: "/lab/tests" },
      //     { label: "Lab Results", icon: FileText, path: "/lab/results" },
      //   ],
      // },
    ],
  },
  {
    title: "MANAGE",
    items: [{ label: "Staffs", icon: UserCog, path: "/staffs" }],
  },
  {
    title: "SYSTEM",
    items: [{ label: "Settings", icon: Settings, path: "/settings" }],
  },
];

export default function Sidebar({ sidebarOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openDropdowns, setOpenDropdowns] = useState({});

  const toggleDropdown = (label) => {
    setOpenDropdowns((prev) => ({
      [label]: !prev[label],
    }));
  };

  // FIXED: Exact match for highlighting active items
  const isActive = (path) => {
    return location.pathname === path;
  };

  // FIXED: Keep dropdown open if any child path matches (including nested routes)
  const shouldKeepOpen = (dropdownItems) => {
    return dropdownItems?.some(
      (item) => location.pathname.startsWith(item.path)
    );
  };

  // Check if any dropdown item is active for parent styling
  const isDropdownItemActive = (dropdownItems) => {
    return dropdownItems?.some(
      (item) => location.pathname === item.path
    );
  };

  useEffect(() => {
    const newOpenState = {};
    menu.forEach((section) => {
      section.items.forEach((item) => {
        if (item.hasDropdown && shouldKeepOpen(item.dropdownItems)) {
          newOpenState[item.label] = true;
        }
      });
    });
    setOpenDropdowns((prev) => ({ ...prev, ...newOpenState }));
  }, [location.pathname]);

  return (
    <div
      className={`${
        sidebarOpen ? "w-64" : "w-20"
      } bg-[#0f172a] text-white h-screen fixed left-0 top-0 flex flex-col shadow-lg transition-all duration-300 z-20`}
    >
      {/* Logo */}
      <div className="p-5 border-b border-slate-700">
        {sidebarOpen ? (
          <h1 className="text-lg font-semibold">Dreams EMR</h1>
        ) : (
          <h1 className="text-lg font-semibold text-center">D</h1>
        )}
      </div>

      {/* Menu with custom scrollbar */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
        {menu.map((section) => (
          <div key={section.title}>
            {sidebarOpen && (
              <p className="text-xs text-gray-400 mb-2">{section.title}</p>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                // For items with dropdown (Appointments, Laboratory)
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
                              ? "bg-slate-700 text-white"  // Softer active state when child is active
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
                                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" // Bright blue for exact match
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