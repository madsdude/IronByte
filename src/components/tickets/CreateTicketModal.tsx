import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import Button from '../ui/Button';
import { useTicketStore } from '../../store/ticketStore';
import { useAuthStore } from '../../store/authStore';

const serviceRequestFields = {
  'hardware': [
    { name: 'device_type', label: 'Device Type', type: 'select', options: ['Laptop', 'Desktop', 'Monitor', 'Printer', 'Other'] },
    { name: 'location', label: 'Location', type: 'text' },
  ],
  'software': [
    { name: 'software_name', label: 'Software Name', type: 'text' },
    { name: 'license_type', label: 'License Type', type: 'select', options: ['Individual', 'Team', 'Enterprise'] },
  ],
  'access': [
    { name: 'system_name', label: 'System Name', type: 'text' },
    { name: 'access_type', label: 'Access Type', type: 'select', options: ['Read', 'Write', 'Admin'] },
  ],
  'network': [
    { name: 'network_resource', label: 'Network Resource', type: 'text' },
    { name: 'access_duration', label: 'Access Duration', type: 'select', options: ['Temporary', 'Permanent'] },
  ],
  'server': [
    { name: 'server_name', label: 'Server Name', type: 'text' },
    { name: 'server_type', label: 'Server Type', type: 'select', options: ['Web', 'Database', 'Application', 'File', 'Other'] },
    { name: 'environment', label: 'Environment', type: 'select', options: ['Development', 'Staging', 'Production'] },
  ],
};

const ticketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum(['hardware', 'software', 'network', 'access', 'service-request', 'incident', 'server']),
  startImmediately: z.boolean().optional(),
  device_type: z.string().optional(),
  location: z.string().optional(),
  software_name: z.string().optional(),
  license_type: z.string().optional(),
  system_name: z.string().optional(),
  access_type: z.string().optional(),
  network_resource: z.string().optional(),
  access_duration: z.string().optional(),
  server_name: z.string().optional(),
  server_type: z.string().optional(),
  environment: z.string().optional(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: 'service-request' | undefined;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ 
  isOpen, 
  onClose,
  defaultCategory 
}) => {
  const [error, setError] = useState<string | null>(null);
  const { addTicket, loading } = useTicketStore();
  const user = useAuthStore(state => state.user);
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      priority: 'medium',
      category: defaultCategory || 'incident',
      startImmediately: false,
    },
  });

  const selectedCategory = watch('category');
  const isServiceRequest = selectedCategory === 'service-request' || defaultCategory === 'service-request';

  const onSubmit = async (data: TicketFormData) => {
    if (!user) {
      setError('You must be logged in to create a ticket');
      return;
    }

    try {
      setError(null);
      const additionalFields: Record<string, string> = {};
      
      if (serviceRequestFields[selectedCategory as keyof typeof serviceRequestFields]) {
        serviceRequestFields[selectedCategory as keyof typeof serviceRequestFields].forEach(field => {
          if (data[field.name as keyof TicketFormData]) {
            additionalFields[field.name] = data[field.name as keyof TicketFormData] as string;
          }
        });
      }

      await addTicket({
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
        status: isServiceRequest && data.startImmediately ? 'in-progress' : 'new',
        additionalFields,
      });

      reset();
      onClose();
    } catch (err) {
      console.error('Failed to create ticket:', err);
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 w-full text-left sm:mt-0">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                  {defaultCategory === 'service-request' ? 'New Service Request' : 'Create New Ticket'}
                </h3>
                <div className="mt-2">
                  {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-4">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        type="text"
                        {...register('title')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        {...register('description')}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                          Priority
                        </label>
                        <select
                          {...register('priority')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                          Category
                        </label>
                        <select
                          {...register('category')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="hardware">Hardware</option>
                          <option value="software">Software</option>
                          <option value="network">Network</option>
                          <option value="access">Access</option>
                          <option value="server">Server</option>
                          <option value="service-request">Service Request</option>
                          <option value="incident">Incident</option>
                        </select>
                      </div>
                    </div>

                    {isServiceRequest && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('startImmediately')}
                          id="startImmediately"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="startImmediately" className="ml-2 block text-sm text-gray-700">
                          Start working on this request immediately
                        </label>
                      </div>
                    )}

                    {serviceRequestFields[selectedCategory as keyof typeof serviceRequestFields] && (
                      <div className="space-y-4 border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-700">Additional Information</h4>
                        {serviceRequestFields[selectedCategory as keyof typeof serviceRequestFields].map((field) => (
                          <div key={field.name}>
                            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                              {field.label}
                            </label>
                            {field.type === 'select' ? (
                              <select
                                {...register(field.name as keyof TicketFormData)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              >
                                {field.options?.map((option) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                {...register(field.name as keyof TicketFormData)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={loading}
                        className="w-full sm:ml-3 sm:w-auto"
                      >
                        Create Ticket
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="mt-3 w-full sm:mt-0 sm:w-auto"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketModal;