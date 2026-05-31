import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { getUserById } from '@/lib/permissions';

export const GET = withAuth(async (request, auth) => {
  let isAdmin = false;
  let username: string | undefined = undefined;
  try {
    const user = await getUserById(auth.userId);
    isAdmin = user?.['isAdmin'] === true;
    username = user?.['username'] as string | undefined;
  } catch (error) {
    console.error('Error fetching user admin status:', error);
  }

  const response = NextResponse.json(
    {
      authenticated: true,
      userId: auth.userId,
      email: auth.email,
      isAdmin,
      username
    },
    { status: 200 }
  );

  response.headers.set('Cache-Control', 'no-store');

  return response;
});
