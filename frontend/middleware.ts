import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export { default } from "next-auth/middleware";

const SIGNIN_ROUTE = "/authentication/signin";
const SIGNUP_ROUTE = "/authentication/signup";
const AUTH_ROUTES = [SIGNIN_ROUTE, SIGNUP_ROUTE];
const DASHBOARD_ROUTE = "/dashboard";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;
  const token = await getToken({ req: request });

  if (token) {
    if (AUTH_ROUTES.includes(url) || url === '/') {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } else {
    if (url === DASHBOARD_ROUTE) {
      return NextResponse.redirect(new URL(SIGNIN_ROUTE, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/authentication/:path*", "/dashboard/:path*", "/"],
};
