import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export { default } from "next-auth/middleware";

const SIGNIN_ROUTE = "/authentication/signin";
const SIGNUP_ROUTE = "/authentication/signup";
const AUTH_ROUTES = [SIGNIN_ROUTE, SIGNUP_ROUTE];
const DASHBOARD_ROUTE = "/dashboard";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;
  const token = await getToken({ req: request });

  if (token) {
    if (AUTH_ROUTES.includes(url) || url === "/") {
      const cookieStore = await cookies();
      const lastOrganization = cookieStore.get("lastOrganization");
      const lastProject = cookieStore.get("lastProject");

      return NextResponse.redirect(new URL(`/${lastOrganization?.value}/projects/${lastProject?.value}`, request.url));
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
