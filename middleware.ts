import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  // Optimize public routes and add caching headers
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api(.*)",
    "/_next(.*)", // Allow Next.js assets
    "/fonts/(.*)", // Allow font assets
    "/images/(.*)" // Allow image assets
  ],
  // Add debug false to reduce logging
  debug: false,
  // Optimize performance with longer session duration
  sessionDuration: 7 * 24 * 60 * 60, // 7 days
  // Add caching for auth state
  ignoredRoutes: [
    "/_next/static/(.*)",
    "/fonts/(.*)",
    "/images/(.*)",
    "/favicon.ico"
  ]
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/(api|trpc)(.*)"
  ],
}; 