import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const settingsSchema = z.object({
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').optional(),
  confirmPassword: z.string().optional(),
  role: z.enum(['user', 'agent', 'admin']).optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [userRole, setUserRole] = React.useState<string>('user');
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [displayName, setDisplayName] = React.useState<string>('');

  React.useEffect(() => {
    const fetchUserDetails = async () => {
      if (user) {
        try {
          // Fetch user role
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (roleError) {
            console.error('Error fetching user role:', roleError);
          } else {
            // If no role is found, create a default 'user' role
            if (!roleData) {
              const { error: insertError } = await supabase
                .from('user_roles')
                .insert([{ user_id: user.id, role: 'user' }]);
              
              if (insertError) {
                console.error('Error creating default user role:', insertError);
              } else {
                setUserRole('user');
              }
            } else {
              setUserRole(roleData.role);
              setIsAdmin(roleData.role === 'admin');
            }
          }

          // Fetch display name
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('display_name')
            .eq('id', user.id)
            .maybeSingle();

          if (userError) {
            console.error('Error fetching user display name:', userError);
          } else if (userData) {
            setDisplayName(userData.display_name || '');
          }
        } catch (err) {
          console.error('Error in fetchUserDetails:', err);
          setError('Failed to fetch user details');
        }
      }
    };
    
    fetchUserDetails();
  }, [user]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      email: user?.email || '',
      displayName: displayName,
      role: userRole as 'user' | 'agent' | 'admin',
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    try {
      setError(null);
      setSuccess(null);

      // Update email if changed
      if (data.email !== user?.email) {
        const { error: updateError } = await supabase.auth.updateUser({
          email: data.email,
        });
        if (updateError) throw updateError;
      }

      // Update password if provided
      if (data.newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.newPassword,
        });
        if (passwordError) throw passwordError;
      }

      // Update display name
      const { error: displayNameError } = await supabase
        .from('users')
        .update({ display_name: data.displayName })
        .eq('id', user?.id);

      if (displayNameError) throw displayNameError;

      // Update role if admin and role changed
      if (isAdmin && data.role && data.role !== userRole) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: data.role })
          .eq('user_id', user?.id);

        if (roleError) throw roleError;
      }

      setSuccess('Settings updated successfully');
      setDisplayName(data.displayName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
                  Account Settings
                </h3>
                <div className="mt-2">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                      <div className="rounded-md bg-red-50 p-4">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}

                    {success && (
                      <div className="rounded-md bg-green-50 p-4">
                        <p className="text-sm text-green-700">{success}</p>
                      </div>
                    )}

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        {...register('email')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                        Display Name
                      </label>
                      <input
                        type="text"
                        {...register('displayName')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      {errors.displayName && (
                        <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
                      )}
                    </div>

                    {isAdmin && (
                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                          Role
                        </label>
                        <select
                          {...register('role')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="user">User</option>
                          <option value="agent">Agent</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <input
                        type="password"
                        {...register('newPassword')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      {errors.newPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        {...register('confirmPassword')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                        className="w-full sm:ml-3 sm:w-auto"
                      >
                        Save Changes
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

export default SettingsModal;