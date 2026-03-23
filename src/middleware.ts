import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password", "/auth/callback"];
const APP_API_ROUTES = ["/api/app/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (APP_API_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  const { supabaseResponse, user, hasStaffProfile } = await updateSession(request);
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthorizedStaff = !!user && hasStaffProfile;

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    if (isAuthorizedStaff) {
      url.pathname = "/dashboard";
    } else {
      url.pathname = "/login";
      url.searchParams.set("redirectTo", "/");
    }
    return NextResponse.redirect(url);
  }

  if ((!user || !hasStaffProfile) && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    if (user && !hasStaffProfile) {
      url.searchParams.set("reason", "no_staff_profile");
    }
    return NextResponse.redirect(url);
  }

  if (isAuthorizedStaff && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
