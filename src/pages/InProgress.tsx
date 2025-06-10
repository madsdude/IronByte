import React, { useState } from 'react';
import { useTicketStore } from '../store/ticketStore';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import TicketList from '../components/dashboard/TicketList';
import QuickActions from '../components/tickets/QuickActions';
import { Clock, AlertTriangle } from 'lucide-react';

const InProgress: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const tickets = useTicketStore((state) => 
    state.tickets.filter(ticket => ticket.status === 'in-progress')
  );
  const { users } = useUserStore();

  // Group tickets by assignee
  const ticketsByAssignee = tickets.reduce((acc, ticket) => {
    const assigneeId = ticket.assigned_to || 'unassigned';
    if (!acc[assigneeId]) {
      acc[assigneeId] = [];
    }
    acc[assigneeId].push(ticket);
    return acc;
  }, {} as Record<string, typeof tickets>);

  // Calculate metrics
  const totalInProgress = tickets.length;
  const unassignedCount = (ticketsByAssignee['unassigned'] || []).length;
  const criticalCount = tickets.filter(t => t.priority === 'critical').length;
  const overdueCount = tickets.filter(t => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">In Progress</h1>
        <p className="mt-2 text-sm text-gray-500">
          Track and manage tickets currently being worked on
        </p>
      </div>

      <div className="mt-6">
        <QuickActions />
      </div>

      {/* Metrics Overview */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total In Progress
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {totalInProgress}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Unassigned
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {unassignedCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Critical Priority
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {criticalCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Overdue
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {overdueCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My In-Progress Tickets */}
      {user && ticketsByAssignee[user.id] && (
        <div className="mt-6">
          <TicketList 
            tickets={ticketsByAssignee[user.id]} 
            title="My In-Progress Tickets" 
            emptyMessage="You have no tickets in progress" 
          />
        </div>
      )}

      {/* Unassigned Tickets */}
      {ticketsByAssignee['unassigned'] && (
        <div className="mt-6">
          <TicketList 
            tickets={ticketsByAssignee['unassigned']} 
            title="Unassigned Tickets" 
            emptyMessage="No unassigned tickets" 
          />
        </div>
      )}

      {/* Other Team Members' Tickets */}
      {Object.entries(ticketsByAssignee).map(([assigneeId, assigneeTickets]) => {
        if (assigneeId === 'unassigned' || (user && assigneeId === user.id)) return null;
        const assignee = users[assigneeId];
        if (!assignee) return null;

        return (
          <div key={assigneeId} className="mt-6">
            <TicketList 
              tickets={assigneeTickets} 
              title={`Tickets Assigned to ${assignee.displayName || assignee.email}`} 
              emptyMessage="No tickets assigned" 
            />
          </div>
        );
      })}
    </div>
  );
};

export default InProgress;