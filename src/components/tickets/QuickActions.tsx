import React, { useState } from 'react';
import { PlusCircle, Wrench } from 'lucide-react';
import Button from '../ui/Button';
import CreateTicketModal from './CreateTicketModal';

const QuickActions: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isServiceRequest, setIsServiceRequest] = useState(false);

  const handleNewTicket = (isService: boolean) => {
    setIsServiceRequest(isService);
    setIsCreateModalOpen(true);
  };

  return (
    <>
      <div className="bg-white p-4 shadow rounded-lg mb-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Ticket Management</h2>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage support tickets
            </p>
          </div>
          <div className="mt-3 sm:mt-0 sm:ml-4 flex flex-col sm:flex-row gap-2">
            <Button 
              variant="primary"
              iconLeft={<PlusCircle className="h-4 w-4" />}
              onClick={() => handleNewTicket(false)}
            >
              New Ticket
            </Button>
            <Button 
              variant="outline"
              iconLeft={<Wrench className="h-4 w-4" />}
              onClick={() => handleNewTicket(true)}
            >
              Service Request
            </Button>
          </div>
        </div>
      </div>

      <CreateTicketModal 
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsServiceRequest(false);
        }}
        defaultCategory={isServiceRequest ? 'service-request' : undefined}
      />
    </>
  );
};

export default QuickActions;