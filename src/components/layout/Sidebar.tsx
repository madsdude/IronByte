import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Ticket, Clock, CheckCircle, List, BookOpen, Settings, LogOut, HelpCircle as CircleHelp, XCircle } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'My Tickets', href: '/my-tickets', icon: Ticket },
  { name: 'All Tickets', href: '/all-tickets', icon: List },
  { name: 'In Progress', href: '/in-progress', icon: Clock },
  { name: 'Resolved', href: '/resolved', icon: CheckCircle },
  { name: 'Closed', href: '/closed', icon: XCircle },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
];

const secondaryNavigation = [
  { name: 'Help', href: '#', icon: CircleHelp },
  { name: 'Settings', href: '#', icon: Settings },
  { name: 'Sign out', href: '#', icon: LogOut },
];

interface SidebarProps {
  isMobileOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen }) => {
  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 flex lg:hidden transition-opacity ease-linear duration-300 ${
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Sidebar component for mobile */}
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white focus:outline-none">
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-lg font-semibold text-slate-900">ITIL Ticketing</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => `
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md
                    ${isActive
                      ? 'bg-slate-100 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <item.icon
                    className="mr-3 flex-shrink-0 h-5 w-5 text-slate-400 group-hover:text-slate-500"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-slate-200 p-4">
            <div className="flex items-center">
              {secondaryNavigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-slate-900"
                >
                  <item.icon
                    className="mr-3 flex-shrink-0 h-5 w-5 text-slate-400 group-hover:text-slate-500"
                    aria-hidden="true"
                  />
                  {item.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow border-r border-slate-200 bg-white pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-lg font-semibold text-slate-900">ITIL Ticketing</h1>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1 bg-white">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) => `
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md
                      ${isActive
                        ? 'bg-slate-100 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <item.icon
                      className="mr-3 flex-shrink-0 h-5 w-5 text-slate-400 group-hover:text-slate-500"
                      aria-hidden="true"
                    />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex flex-col border-t border-slate-200 p-4">
              {secondaryNavigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-slate-900"
                >
                  <item.icon
                    className="mr-3 flex-shrink-0 h-5 w-5 text-slate-400 group-hover:text-slate-500"
                    aria-hidden="true"
                  />
                  {item.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;