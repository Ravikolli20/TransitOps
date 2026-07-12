import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookies } from '@/lib/session';
import type { TokenPair, ApiError } from '@/types';

const API_BASE = process.env.BACKEND_API_URL ?? 'http://localhost:3001/api/v1';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    const error = (await res.json()) as ApiError;
    return NextResponse.json(error, { status: res.status });
  }

  const tokens = (await res.json()) as TokenPair;
  setSessionCookies(tokens.accessToken, tokens.refreshToken);

  return NextResponse.json({ success: true });
}
