import React from 'react';
import { useTicketStore } from '../store/ticketStore';
import TicketList from '../components/dashboard/TicketList';
import QuickActions from '../components/tickets/QuickActions';

const AllTickets: React.FC = () => {
  const tickets = useTicketStore((state) => state.tickets);

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">All Tickets</h1>
        <p className="mt-2 text-sm text-gray-500">
          View and manage all support tickets
        </p>
      </div>

      <div className="mt-6">
        <QuickActions />
      </div>

      <div className="mt-6">
        <TicketList 
          tickets={tickets} 
          title="All Tickets" 
          emptyMessage="No tickets found" 
        />
      </div>
    </div>
  );
};

export default AllTickets;