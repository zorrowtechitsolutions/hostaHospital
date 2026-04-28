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
  Activity,
  CreditCard,
  Microscope,
  PlusCircle,
} from "lucide-react";
import { useState } from "react";

const menu = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { label: "Applications", icon: Users, path: "/applications" },
      { label: "Layouts", icon: Users, path: "/layouts" },
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
        children: [
          { label: "Consultation", path: "/appointments/consultation" },
        ],
      },
      { label: "Visits", icon: CalendarDays, path: "/visits" },
      { 
        label: "Laboratory", 
        icon: FlaskConical,
        hasDropdown: true,
        dropdownItems: [
          { label: "Register Lab", icon: PlusCircle, path: "/laboratory" },
          { label: "Lab Tests", icon: Microscope, path: "/lab/tests" },
          { label: "Lab Results", icon: FileText, path: "/lab/results" },
        ]
      },
      { label: "Pharmacy", icon: Pill, path: "/pharmacy" },
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
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isDropdownItemActive = (dropdownItems) => {
    return dropdownItems?.some(item => location.pathname === item.path);
  };

  // Check if any dropdown item is active to keep dropdown open
  const shouldKeepOpen = (dropdownItems) => {
    return dropdownItems?.some(item => location.pathname === item.path);
  };

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

      {/* Menu */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {menu.map((section) => (
          <div key={section.title}>
            {sidebarOpen && (
              <p className="text-xs text-gray-400 mb-2">{section.title}</p>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                // For items with dropdown (Laboratory)
                if (item.hasDropdown) {
                  const dropdownActive = isDropdownItemActive(item.dropdownItems);
                  // Keep dropdown open if any child is active
                  const isOpen = openDropdowns[item.label] || dropdownActive;
                  
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => {
                          if (sidebarOpen) {
                            toggleDropdown(item.label);
                          }
                        }}
                        className={`w-full flex items-center justify-between ${
                          sidebarOpen ? "px-3" : "justify-center"
                        } py-2 rounded-md text-sm transition
                          ${
                            dropdownActive
                              ? "bg-blue-600 text-white"
                              : "text-gray-300 hover:bg-slate-700"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={18} />
                          {sidebarOpen && item.label}
                        </div>
                        {sidebarOpen && (
                          isOpen ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )
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
                                  // Keep dropdown open when navigating
                                  setOpenDropdowns(prev => ({
                                    ...prev,
                                    [item.label]: true
                                  }));
                                }}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition
                                  ${
                                    dropdownItemActive
                                      ? "bg-blue-600/50 text-white"
                                      : "text-gray-400 hover:bg-slate-700 hover:text-gray-200"
                                  }`}
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
                          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
                            {item.label}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // For items with children (Appointments)
                if (item.children) {
                  const isOpen = openDropdowns[item.label];
                  
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => sidebarOpen && toggleDropdown(item.label)}
                        className={`w-full flex items-center justify-between ${
                          sidebarOpen ? "px-3" : "justify-center"
                        } py-2 rounded-md text-sm transition text-gray-300 hover:bg-slate-700`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={18} />
                          {sidebarOpen && item.label}
                        </div>
                        {sidebarOpen && (
                          isOpen ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )
                        )}
                      </button>

                      {/* Dropdown Items */}
                      {sidebarOpen && isOpen && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.children.map((child) => {
                            const active = isActive(child.path);
                            return (
                              <Link
                                key={child.path}
                                to={child.path}
                                className={`block px-3 py-2 rounded-md text-sm transition
                                  ${
                                    active
                                      ? "bg-blue-600 text-white"
                                      : "text-gray-400 hover:bg-slate-700 hover:text-gray-200"
                                  }`}
                              >
                                {child.label}
                              </Link>
                            );
                          })}
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
                    className={`flex items-center ${
                      sidebarOpen ? "gap-3 px-3" : "justify-center"
                    } py-2 rounded-md text-sm transition relative group
                    ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-slate-700"
                    }`}
                  >
                    <item.icon size={18} />
                    {sidebarOpen && item.label}
                    
                    {/* Tooltip for collapsed sidebar */}
                    {!sidebarOpen && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
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