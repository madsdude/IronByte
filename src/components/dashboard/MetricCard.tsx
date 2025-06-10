import React from 'react';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { MetricData } from '../../types';

interface MetricCardProps {
  metric: MetricData;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <dt className="text-sm font-medium text-slate-500 truncate">
              {metric.name}
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-slate-900">
              {metric.name.toLowerCase().includes('time') ? `${metric.value}h` : metric.value}{metric.name.toLowerCase().includes('compliance') ? '%' : ''}
            </dd>
          </div>
          {metric.change !== undefined && (
            <div className={`flex items-center text-sm font-medium ${
              metric.changeType === 'increase' 
                ? metric.name.toLowerCase().includes('time') ? 'text-red-600' : 'text-green-600' 
                : metric.name.toLowerCase().includes('time') ? 'text-green-600' : 'text-red-600'
            }`}>
              {metric.changeType === 'increase' ? (
                <ArrowUpIcon className="h-4 w-4 mr-1 flex-shrink-0 self-center" aria-hidden="true" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 mr-1 flex-shrink-0 self-center" aria-hidden="true" />
              )}
              <span>{metric.change}{metric.name.toLowerCase().includes('compliance') ? '%' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;