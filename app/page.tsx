import { redirect } from 'next/navigation';
import { getAccessToken } from '@/lib/session';

export default function RootPage() {
  redirect(getAccessToken() ? '/dashboard' : '/login');
}
