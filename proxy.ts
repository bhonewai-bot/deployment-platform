import { NextRequest, NextResponse } from "next/server";

// Routes that require a session
const protectedRoutes = ["/projects", "/deployments"];

// Auth pages that signed-in users should not see
const authRoutes = ["/login", "/sign-up"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
  const isAuthRoute = authRoutes.includes(pathname);

  // Better Auth sets this cookie when a session exists.
  // Check both plain and __Secure- prefixed variants (the latter is set in production HTTPS).
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  const hasSession = Boolean(sessionCookie?.value);

  // Unauthenticated user hitting a protected route → redirect to /login
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated user hitting an auth page → redirect to /projects
  if (isAuthRoute && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on all paths except:
     * - api/  (auth callbacks and route handlers must stay open)
     * - _next/static, _next/image  (build assets)
     * - favicon.ico and static files
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
