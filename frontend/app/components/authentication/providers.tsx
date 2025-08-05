"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

export default function Providers({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return (
    <SessionProvider basePath="/api/authentication" session={session}>
      {children}
    </SessionProvider>
  );
}
