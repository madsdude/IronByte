import React, { useState, useEffect } from 'react';
import { Bell, Menu, Search, X, LogIn, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';
import AuthModal from '../auth/AuthModal';
import SettingsModal from '../settings/SettingsModal';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

interface Notification {
  id: number;
  title: string;
  description: string;
  date: string;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewedNotifications, setViewedNotifications] = useState<number[]>([]);
  const { user, clearUser } = useAuthStore();

  const notifications: Notification[] = [
    {
      id: 1,
      title: 'New Comments Feature',
      description: 'You can now add comments to tickets and discuss with your team!',
      date: 'Apr 28, 2025'
    }
  ];

  useEffect(() => {
    // Load viewed notifications from localStorage
    const viewed = localStorage.getItem('viewedNotifications');
    if (viewed) {
      setViewedNotifications(JSON.parse(viewed));
    }
  }, []);

  const handleSignOut = async () => {
    try {
      // Clear local storage first
      clearUser();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      // Mark all notifications as viewed
      const newViewedNotifications = [...new Set([...viewedNotifications, ...notifications.map(n => n.id)])];
      setViewedNotifications(newViewedNotifications);
      localStorage.setItem('viewedNotifications', JSON.stringify(newViewedNotifications));
    }
  };

  const unviewedNotifications = notifications.filter(n => !viewedNotifications.includes(n.id));

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
                onClick={toggleSidebar}
                aria-expanded={isSidebarOpen}
              >
                <span className="sr-only">
                  {isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                </span>
                {isSidebarOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>

              {/* Logo */}
              <div className="flex-shrink-0 hidden lg:flex items-center">
                <h1 className="text-lg font-semibold text-slate-900">
                  ITIL Ticketing
                </h1>
              </div>
            </div>

            {/* Center - Search */}
            <div className={`flex-1 flex justify-center px-2 lg:px-0 ${isSearchOpen ? 'block' : 'hidden md:block'}`}>
              <div className="w-full max-w-lg lg:max-w-xs relative">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="block w-full bg-slate-50 border border-slate-300 rounded-md py-2 pl-10 pr-3 text-sm placeholder-slate-500 focus:outline-none focus:text-slate-900 focus:placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search tickets..."
                    type="search"
                  />
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Mobile search button */}
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <span className="sr-only">Search</span>
                <Search className="block h-5 w-5" aria-hidden="true" />
              </button>

              {user ? (
                <>
                  {/* Settings */}
                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="p-1 rounded-full bg-white text-slate-500 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">Settings</span>
                    <Settings className="h-5 w-5" aria-hidden="true" />
                  </button>

                  {/* Notifications */}
                  <div className="relative">
                    <button
                      type="button"
                      className="relative p-1 rounded-full bg-white text-slate-500 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={handleNotificationClick}
                    >
                      <span className="sr-only">View notifications</span>
                      <Bell className="h-5 w-5" aria-hidden="true" />
                      {unviewedNotifications.length > 0 && (
                        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white"></span>
                      )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                        <div className="p-4">
                          <h3 className="text-sm font-medium text-gray-900 mb-3">New Features</h3>
                          <div className="space-y-4">
                            {notifications.map((notification) => (
                              <div key={notification.id} className="flex space-x-3">
                                <div className="flex-1 space-y-1">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {notification.description}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {notification.date}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile dropdown */}
                  <div className="relative flex-shrink-0">
                    <div>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <span className="sr-only">Open user menu</span>
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
                          {user.email?.charAt(0).toUpperCase()}
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAuthModalOpen(true)}
                  iconLeft={<LogIn className="h-4 w-4" />}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  );
};

export default Header;
