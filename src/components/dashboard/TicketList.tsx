import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../ui/Badge';
import { Ticket } from '../../types';
import { formatDistance } from '../../utils/dateUtils';
import { User } from 'lucide-react';
import { useUserStore } from '../../store/userStore';

interface TicketListProps {
  tickets: Ticket[];
  title: string;
  emptyMessage?: string;
}

const TicketList: React.FC<TicketListProps> = ({ 
  tickets, 
  title, 
  emptyMessage = "No tickets found" 
}) => {
  const { users, fetchUser } = useUserStore();

  useEffect(() => {
    // Fetch user info for all assigned tickets and submitters
    tickets.forEach(ticket => {
      if (ticket.assigned_to) {
        fetchUser(ticket.assigned_to);
      }
      if (ticket.submittedBy) {
        fetchUser(ticket.submittedBy);
      }
    });
  }, [tickets, fetchUser]);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {title}
        </h3>
      </div>
      
      {tickets.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          {emptyMessage}
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="hover:bg-gray-50 transition-colors duration-150">
              <Link to={`/tickets/${ticket.id}`} className="block">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {ticket.title}
                      </p>
                      <p className="ml-1 text-xs text-gray-500">
                        #{ticket.id}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <div className="sm:flex items-center gap-4">
                      <p className="flex items-center text-sm text-gray-500">
                        <CategoryBadge category={ticket.category} />
                      </p>
                      {ticket.assigned_to && users[ticket.assigned_to] && (
                        <div className="flex items-center text-sm text-gray-500">
                          <User className="h-4 w-4 text-gray-400 mr-1" />
                          <span>Assigned to: {users[ticket.assigned_to].displayName || users[ticket.assigned_to].email}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <p>
                        {formatDistance(new Date(ticket.createdAt))}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      
      <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">
            Showing <span className="font-medium">{tickets.length}</span> results
          </span>
          {tickets.length > 0 && (
            <Link to="/all-tickets" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              View all
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketList;