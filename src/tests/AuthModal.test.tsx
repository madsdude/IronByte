import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthModal from '../components/auth/AuthModal';
import { useAuthStore } from '../store/authStore';

// Mock the auth store
vi.mock('../store/authStore');

describe('AuthModal', () => {
  it('calls login with email only when signing up', async () => {
    // The component calls useAuthStore((state) => state.login)
    // We need to mock the selector behavior or just return an object with login if it's not checking reference equality too strictly.
    // However, zustand mocks are tricky. But here we are mocking the module.
    // The component imports useAuthStore from ../store/authStore
    // Our mock above replaces that export.

    // We can make useAuthStore a mock function that accepts a selector.
    // If we want to return a specific login function, we need to handle the selector.
    const loginMock = vi.fn();

    (useAuthStore as any).mockImplementation((selector: any) => {
        // Create a fake state
        const state = {
            login: loginMock,
            user: null,
            loading: false,
            setUser: vi.fn(),
            clearUser: vi.fn(),
        };
        // Apply selector
        return selector(state);
    });

    const onClose = vi.fn();
    render(<AuthModal isOpen={true} onClose={onClose} />);

    // Switch to Sign Up
    fireEvent.click(screen.getByText("Don't have an account? Sign up"));

    // Find inputs by name attribute
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]');

    if (!emailInput || !passwordInput || !confirmPasswordInput) {
      throw new Error("Inputs not found");
    }

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
        // The component calls login(data.email)
        // See AuthModal.tsx: await login(data.email);
        // It does NOT pass the password to login in the current implementation of AuthModal/authStore.
        expect(loginMock).toHaveBeenCalledWith('test@example.com');
    });
  });
});
