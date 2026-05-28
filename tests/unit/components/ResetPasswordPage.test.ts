import { jest, describe, it, expect } from '@jest/globals';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/app/reset-password/ResetPasswordForm', () => ({
  default: () => null,
}));

import { redirect } from 'next/navigation';
import ResetPasswordPage from '@/app/reset-password/page';

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

describe('ResetPasswordPage', () => {
  it('redirects to /forgot-password when token is missing', async () => {
    await ResetPasswordPage({ searchParams: Promise.resolve({}) }).catch(() => {});
    expect(mockRedirect).toHaveBeenCalledWith('/forgot-password');
  });
});
