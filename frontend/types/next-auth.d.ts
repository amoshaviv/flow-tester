// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      email?: string | null;
      displayName?: string | null;
      profileImageURL?: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    email?: string | null;
    displayName?: string | null;
    profileImageURL?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    email?: string | null;
    displayName?: string | null;
    profileImageURL?: string | null;
  }
}
