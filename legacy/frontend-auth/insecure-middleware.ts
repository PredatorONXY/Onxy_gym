import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Basic authentication middleware using localStorage simulation
// TODO: Implement proper PostgreSQL-based authentication middleware
export async function middleware(req: NextRequest) {
  // For now, allow all requests since we're using localStorage for auth
  // In production, this should check for valid JWT tokens or session cookies
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin-dashboard/:path*'], // Apply middleware to admin dashboard routes
};
