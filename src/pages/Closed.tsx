import React from 'react';
import { useTicketStore } from '../store/ticketStore';
import TicketList from '../components/dashboard/TicketList';
import QuickActions from '../components/tickets/QuickActions';

const Closed: React.FC = () => {
  const tickets = useTicketStore((state) => 
    state.tickets.filter(ticket => ticket.status === 'closed')
  );

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Closed Tickets</h1>
        <p className="mt-2 text-sm text-gray-500">
          View tickets that have been closed
        </p>
      </div>

      <div className="mt-6">
        <QuickActions />
      </div>

      <div className="mt-6">
        <TicketList 
          tickets={tickets} 
          title="Closed Tickets" 
          emptyMessage="No closed tickets" 
        />
      </div>
    </div>
  );
};

export default Closed;