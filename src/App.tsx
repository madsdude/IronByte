import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import MyTickets from './pages/MyTickets';
import AllTickets from './pages/AllTickets';
import InProgress from './pages/InProgress';
import Resolved from './pages/Resolved';
import Closed from './pages/Closed';
import KnowledgeBasePage from './pages/KnowledgeBase';
import TicketDetail from './pages/TicketDetail';
import PublicTicket from './pages/PublicTicket';
import { useTicketStore } from './store/ticketStore';
import { useAuthStore } from './store/authStore';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fetchTickets = useTicketStore((state) => state.fetchTickets);
  const user = useAuthStore((state) => state.user);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    if (user) {
      // Initial fetch
      fetchTickets();

      // Poll for updates
      const interval = setInterval(() => {
        fetchTickets();
      }, 5000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [fetchTickets, user]);

  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/submit-ticket" element={<PublicTicket />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            user ? (
              <div className="h-screen flex overflow-hidden bg-slate-50">
                <Sidebar isMobileOpen={isSidebarOpen} />
                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                  <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
                  <main className="flex-1 relative overflow-y-auto focus:outline-none">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/my-tickets" element={<MyTickets />} />
                      <Route path="/all-tickets" element={<AllTickets />} />
                      <Route path="/in-progress" element={<InProgress />} />
                      <Route path="/resolved" element={<Resolved />} />
                      <Route path="/closed" element={<Closed />} />
                      <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
                      <Route path="/tickets/:id" element={<TicketDetail />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>
            ) : (
              <Navigate to="/submit-ticket" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
