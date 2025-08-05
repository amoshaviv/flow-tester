import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {},
  {
    pages: {
      signIn: "authentication/signin",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // console.log(pathname);
        // TODO: authorization logic!
        // console.log('here', token);

        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/authentication/:path*", "/dashboard/:path*"],
};
