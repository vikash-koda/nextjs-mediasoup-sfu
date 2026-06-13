import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const role = request.cookies.get('role')?.value;

  // Protect API Routes
  if (
    (request.nextUrl.pathname === '/api/sessions' && request.method === 'POST') ||
    request.nextUrl.pathname === '/api/sessions/end' ||
    request.nextUrl.pathname === '/api/history' ||
    request.nextUrl.pathname.startsWith('/api/admin')
  ) {
    if (role !== 'agent') {
      return NextResponse.json(
        { error: 'Forbidden. Agent role required to access this resource.' }, 
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/sessions', '/api/sessions/end', '/api/history', '/api/admin/:path*'],
};
