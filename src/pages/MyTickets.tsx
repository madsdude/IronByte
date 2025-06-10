import React from 'react';
import { useTicketStore } from '../store/ticketStore';
import { useAuthStore } from '../store/authStore';
import TicketList from '../components/dashboard/TicketList';
import QuickActions from '../components/tickets/QuickActions';

const MyTickets: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const tickets = useTicketStore((state) => 
    state.tickets.filter(ticket => 
      ticket.assigned_to === user?.id && 
      ticket.status !== 'closed' &&
      ticket.status !== 'resolved'
    )
  );

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">My Tickets</h1>
        <p className="mt-2 text-sm text-gray-500">
          View and manage tickets assigned to you
        </p>
      </div>

      <div className="mt-6">
        <QuickActions />
      </div>

      <div className="mt-6">
        <TicketList 
          tickets={tickets} 
          title="My Assigned Tickets" 
          emptyMessage="You have no assigned tickets" 
        />
      </div>
    </div>
  );
};

export default MyTickets;