import React from 'react';
import { TicketPriority, TicketStatus, TicketCategory } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  color?: string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  color,
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  
  let variantClasses = 'bg-gray-100 text-gray-800';
  if (variant === 'outline') {
    variantClasses = 'border border-current bg-transparent';
  }
  
  let colorClasses = '';
  if (color) {
    colorClasses = color;
  }
  
  return (
    <span className={`${baseClasses} ${variantClasses} ${colorClasses} ${className}`}>
      {children}
    </span>
  );
};

interface StatusBadgeProps {
  status: TicketStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: TicketStatus) => {
    switch (status) {
      case 'in-progress':
        return 'In Progress';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <Badge color={getStatusColor(status)}>
      {getStatusText(status)}
    </Badge>
  );
};

interface PriorityBadgeProps {
  priority: TicketPriority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-amber-100 text-amber-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Badge color={getPriorityColor(priority)}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

interface CategoryBadgeProps {
  category: TicketCategory;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const getCategoryColor = (category: TicketCategory) => {
    switch (category) {
      case 'hardware':
        return 'bg-stone-100 text-stone-800';
      case 'software':
        return 'bg-sky-100 text-sky-800';
      case 'network':
        return 'bg-indigo-100 text-indigo-800';
      case 'access':
        return 'bg-violet-100 text-violet-800';
      case 'service-request':
        return 'bg-emerald-100 text-emerald-800';
      case 'incident':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryText = (category: TicketCategory) => {
    switch (category) {
      case 'service-request':
        return 'Service Request';
      default:
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  return (
    <Badge color={getCategoryColor(category)}>
      {getCategoryText(category)}
    </Badge>
  );
};

export default Badge;