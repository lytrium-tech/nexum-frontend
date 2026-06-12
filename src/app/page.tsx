import { redirect } from 'next/navigation';
import { getSessionToken } from '@/lib/api/client';

export default async function Home() {
  const token = await getSessionToken(true);
  
  if (token) {
    redirect('/app');
  } else {
    redirect('/login');
  }
}
