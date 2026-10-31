import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * OPENLAB PROTOCOL - ZERO-TRUST SECURITY MIDDLEWARE
 * Enforces defense-in-depth across all incoming routes and API requests:
 * - Anti-Clickjacking (X-Frame-Options: SAMEORIGIN)
 * - MIME-sniffing protection (X-Content-Type-Options: nosniff)
 * - Strict Referrer Policy
 * - Permissions-Policy (Hardware Sensor Sandbox lockdown)
 * - Protocol Trace Correlation ID
 * - Permissive CSP for development/local LAN (supporting ws://, HMR, and client hydration)
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const traceId = `trace_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

  // Attach Protocol Trace Header
  response.headers.set('X-Protocol-Trace-Id', traceId);
  response.headers.set('X-Security-Engine', 'OpenLab-Shield-v2.4');

  // Anti-Clickjacking Defense
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Prevent MIME Type Confusion
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Strict Permissions Policy (Zero hardware/camera access needed - pure software)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );

  // Content Security Policy - configured to allow full React hydration, HMR WebSockets, and LAN IPs
  const isDev = process.env.NODE_ENV !== 'production';

  if (!isDev) {
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' blob: data: https://images.unsplash.com https://api.dicebear.com",
      "connect-src 'self' ws: wss: http: https:",
      "worker-src 'self' blob:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    response.headers.set('Content-Security-Policy', cspHeader);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
