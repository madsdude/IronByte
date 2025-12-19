import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../lib/api';
import Button from '../components/ui/Button';
import { Ticket, Send, LogIn } from 'lucide-react';
import AuthModal from '../components/auth/AuthModal';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

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
  'service-request': [
    { name: 'service_type', label: 'Service Type', type: 'select', options: ['Account Creation', 'Software Installation', 'Firewall Opening', 'Other'] },
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
  email: z.string().email('Invalid email address'),
  company: z.string().min(1, 'Company name is required'),
  category: z.enum(['hardware', 'software', 'network', 'access', 'service-request', 'incident', 'server']),
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
  service_type: z.string().optional(),
  source_ip: z.string().optional(),
  destination_ip: z.string().optional(),
  port: z.string().optional(),
  protocol: z.string().optional(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

export default function PublicTicket() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // If user is authenticated, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      category: 'service-request',
    },
  });

  const selectedCategory = watch('category');

  const onSubmit = async (data: TicketFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Prepare additional fields
      const additionalFields: Record<string, string> = {
        company: data.company,
        contact_email: data.email
      };

      if (serviceRequestFields[selectedCategory as keyof typeof serviceRequestFields]) {
        serviceRequestFields[selectedCategory as keyof typeof serviceRequestFields].forEach(field => {
          if (data[field.name as keyof TicketFormData]) {
            additionalFields[field.name] = data[field.name as keyof TicketFormData] as string;
          }
        });
      }

      // Add firewall fields if applicable
      if (selectedCategory === 'service-request' && data.service_type === 'Firewall Opening') {
        if (data.source_ip) additionalFields.source_ip = data.source_ip;
        if (data.destination_ip) additionalFields.destination_ip = data.destination_ip;
        if (data.port) additionalFields.port = data.port;
        if (data.protocol) additionalFields.protocol = data.protocol;
      }

      await api.post('/tickets', {
        title: data.title,
        description: data.description,
        status: 'new',
        priority: 'medium',
        category: data.category,
        submitted_by: null, // No user account for public tickets
        additional_fields: additionalFields
      });

      setSuccess(true);
      reset();
    } catch (err) {
      console.error('Error submitting ticket:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Technician Login Button */}
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          onClick={() => setIsAuthModalOpen(true)}
          iconLeft={<LogIn className="h-4 w-4" />}
        >
          Technician Login
        </Button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Ticket className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Submit a Support Ticket
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We'll get back to you via email as soon as possible
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {success ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Ticket submitted successfully
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>We'll review your ticket and get back to you via email.</p>
                  </div>
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSuccess(false)}
                    >
                      Submit another ticket
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {error}
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    {...register('email')}
                    type="email"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <div className="mt-1">
                  <input
                    {...register('company')}
                    type="text"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.company && (
                    <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <div className="mt-1">
                  <input
                    {...register('title')}
                    type="text"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <div className="mt-1">
                  <select
                    {...register('category')}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="hardware">Hardware</option>
                    <option value="software">Software</option>
                    <option value="network">Network</option>
                    <option value="access">Access</option>
                    <option value="service-request">Service Request</option>
                    <option value="incident">Incident</option>
                    <option value="server">Server</option>
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>
              </div>

              {/* Additional Fields based on category */}
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

                  {/* Firewall Opening specific fields */}
                  {selectedCategory === 'service-request' && watch('service_type') === 'Firewall Opening' && (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <h5 className="text-sm font-medium text-gray-700">Firewall Details</h5>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="source_ip" className="block text-sm font-medium text-gray-700">Source IP</label>
                          <input
                            type="text"
                            {...register('source_ip')}
                            placeholder="e.g. 192.168.1.100"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="destination_ip" className="block text-sm font-medium text-gray-700">Destination IP</label>
                          <input
                            type="text"
                            {...register('destination_ip')}
                            placeholder="e.g. 10.0.0.5"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="port" className="block text-sm font-medium text-gray-700">Port</label>
                          <input
                            type="text"
                            {...register('port')}
                            placeholder="e.g. 443"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="protocol" className="block text-sm font-medium text-gray-700">Protocol</label>
                          <select
                            {...register('protocol')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            <option value="TCP">TCP</option>
                            <option value="UDP">UDP</option>
                            <option value="ICMP">ICMP</option>
                            <option value="Both">TCP/UDP</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSubmitting}
                  iconRight={<Send className="h-4 w-4" />}
                >
                  Submit Ticket
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
