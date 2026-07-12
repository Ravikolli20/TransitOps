import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api-client';
import { clearSessionCookies } from '@/lib/session';

export async function POST() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch {
    // Even if the backend call fails (e.g. token already expired),
    // we still clear local cookies so the user isn't stuck logged in.
  }
  clearSessionCookies();
  return NextResponse.json({ success: true });
}
