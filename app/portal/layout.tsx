import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';

// Server components that read the session must be rendered dynamically.
export const dynamic = 'force-dynamic';

/**
 * Authoritative auth gate for the entire /portal subtree (today's page and the
 * future /portal/voice and /portal/call). Unauthenticated users are redirected
 * to the auth page. This server-side check is the real boundary; proxy.ts is
 * just an earlier, nicer redirect.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect('/auth');
  }

  return <>{children}</>;
}
