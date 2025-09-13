import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("spotify_access_token");
  const path = request.nextUrl.pathname;

  // Protect all routes except the login page ('/')
  if (path !== "/" && !accessToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If a logged-in user tries to access the login page, redirect them to the dashboard
  if (path === "/" && accessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|callback).*)"],
};
