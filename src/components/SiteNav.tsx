import { auth } from '@/auth';
import SiteNavBar from './SiteNavBar';

export default async function SiteNav({ variant }: { variant?: 'overlay' | 'solid' }) {
  const session = await auth();
  const user = session?.user ? { name: session.user.name, image: session.user.image, role: session.user.role } : null;

  return <SiteNavBar user={user} variant={variant} />;
}
