import React, { useEffect, useState } from 'react';
import { useTicketStore } from '../store/ticketStore';
import MetricCard from '../components/dashboard/MetricCard';
import TicketList from '../components/dashboard/TicketList';
import QuickActions from '../components/tickets/QuickActions';
import KnowledgeBase from '../components/dashboard/KnowledgeBase';

const Dashboard: React.FC = () => {
  const { tickets, getMetrics } = useTicketStore();

  const [metrics, setMetrics] = useState([
    { name: 'Open Tickets', value: 0 },
    { name: 'Resolved Today', value: 0 },
    { name: 'Avg. Response Time', value: 0 },
    { name: 'SLA Compliance', value: 0 }
  ]);

  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = getMetrics();
      setMetrics([
        { name: 'Open Tickets', value: currentMetrics.openTickets },
        { name: 'Resolved Today', value: currentMetrics.resolvedToday },
        { name: 'Avg. Response Time', value: currentMetrics.avgResponseTime },
        { name: 'SLA Compliance', value: currentMetrics.slaCompliance }
      ]);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [tickets, getMetrics]);

  const recentTickets = [...tickets]
    .filter(ticket => ticket.status !== 'closed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const highPriorityTickets = tickets.filter(
    ticket => (ticket.priority === 'high' || ticket.priority === 'critical') && 
    ticket.status !== 'closed'
  );

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-500">
          Overview of support tickets and system performance
        </p>
      </div>

      <div className="mt-6">
        <QuickActions />
      </div>

      <div className="mt-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.name} metric={metric} />
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="grid grid-cols-1 gap-6">
          <TicketList 
            tickets={recentTickets} 
            title="Recent Tickets" 
            emptyMessage="No recent tickets" 
          />
          <KnowledgeBase />
        </div>
        <div>
          <TicketList 
            tickets={highPriorityTickets} 
            title="High Priority Tickets" 
            emptyMessage="No high priority tickets" 
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;