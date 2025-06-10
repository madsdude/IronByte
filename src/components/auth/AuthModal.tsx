import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendEmail, setResendEmail] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register: registerSignIn,
    handleSubmit: handleSubmitSignIn,
    reset: resetSignIn,
    formState: { errors: signInErrors, isSubmitting: isSignInSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    reset: resetSignUp,
    formState: { errors: signUpErrors, isSubmitting: isSignUpSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const handleResendConfirmation = async () => {
    try {
      setIsProcessing(true);
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
      });

      if (resendError) throw resendError;

      setError('Confirmation email has been resent. Please check your inbox.');
      setShowResendButton(false);
    } catch (err) {
      console.error('Resend error:', err);
      setError(err instanceof Error ? err.message : 'Failed to resend confirmation email.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onSignIn = async (data: SignInFormData) => {
    try {
      setIsProcessing(true);
      setError(null);
      setShowResendButton(false);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          setResendEmail(data.email);
          setShowResendButton(true);
          throw new Error('Email not confirmed. Click the button below to resend confirmation email.');
        }
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        }
        throw signInError;
      }

      resetSignIn();
      onClose();
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onSignUp = async (data: SignUpFormData) => {
    try {
      setError(null);
      setShowResendButton(false);

      // Create a new user with email and password
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            email_confirm: true
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        throw signUpError;
      }

      if (signUpData.user) {
        // Wait for a short period to ensure the user is fully created
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Insert user data into the users table
        const { error: userError } = await supabase
          .from('users')
          .insert([
            {
              id: signUpData.user.id,
              email: data.email,
              display_name: data.email.split('@')[0]
            }
          ]);

        if (userError) {
          console.error('User data sync error:', userError);
        }

        // Insert the default user role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([
            {
              user_id: signUpData.user.id,
              role: 'user'
            }
          ]);

        if (roleError) {
          console.error('Role assignment error:', roleError);
          // Show a success message anyway since the user was created
          setError('Account created successfully! Please check your email to confirm your account.');
          setIsSignUp(false);
          resetSignUp();
          return;
        }

        // Show success message
        setError('Account created successfully! Please check your email to confirm your account.');
        setIsSignUp(false);
        resetSignUp();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
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
                  {isSignUp ? 'Create an Account' : 'Sign In'}
                </h3>
                <div className="mt-2">
                  {isSignUp ? (
                    <form onSubmit={handleSubmitSignUp(onSignUp)} className="space-y-4">
                      {error && (
                        <div className={`rounded-md p-4 ${error.includes('successfully') || error.includes('has been resent') ? 'bg-green-50' : 'bg-red-50'}`}>
                          <p className={`text-sm ${error.includes('successfully') || error.includes('has been resent') ? 'text-green-700' : 'text-red-700'}`}>
                            {error}
                          </p>
                        </div>
                      )}

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          {...registerSignUp('email')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                        {signUpErrors.email && (
                          <p className="mt-1 text-sm text-red-600">{signUpErrors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                          Password
                        </label>
                        <input
                          type="password"
                          {...registerSignUp('password')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                        {signUpErrors.password && (
                          <p className="mt-1 text-sm text-red-600">{signUpErrors.password.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          {...registerSignUp('confirmPassword')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                        {signUpErrors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">{signUpErrors.confirmPassword.message}</p>
                        )}
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <Button
                          type="submit"
                          variant="primary"
                          isLoading={isSignUpSubmitting || isProcessing}
                          className="w-full sm:ml-3 sm:w-auto"
                        >
                          Sign Up
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
                  ) : (
                    <form onSubmit={handleSubmitSignIn(onSignIn)} className="space-y-4">
                      {error && (
                        <div className={`rounded-md p-4 ${error.includes('successfully') || error.includes('has been resent') ? 'bg-green-50' : 'bg-red-50'}`}>
                          <p className={`text-sm ${error.includes('successfully') || error.includes('has been resent') ? 'text-green-700' : 'text-red-700'}`}>
                            {error}
                          </p>
                        </div>
                      )}

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          {...registerSignIn('email')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                        {signInErrors.email && (
                          <p className="mt-1 text-sm text-red-600">{signInErrors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                          Password
                        </label>
                        <input
                          type="password"
                          {...registerSignIn('password')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                        {signInErrors.password && (
                          <p className="mt-1 text-sm text-red-600">{signInErrors.password.message}</p>
                        )}
                      </div>

                      {showResendButton && (
                        <div className="text-center">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleResendConfirmation}
                            isLoading={isProcessing}
                            className="w-full"
                          >
                            Resend Confirmation Email
                          </Button>
                        </div>
                      )}

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <Button
                          type="submit"
                          variant="primary"
                          isLoading={isSignInSubmitting || isProcessing}
                          className="w-full sm:ml-3 sm:w-auto"
                        >
                          Sign In
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
                  )}

                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError(null);
                        setShowResendButton(false);
                        resetSignIn();
                        resetSignUp();
                      }}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;