import * as React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/theme";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import Providers from "@/app/components/authentication/providers";
import { getSession } from "@/lib/next-auth";
import NavBar from "@/app/components/layout/NavBar";

export default async function RootLayout(props: { children: React.ReactNode }) {
  const session = await getSession();
  const { user } = session ? session : {};

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" />
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <Providers session={session}>
              <CssBaseline />
              <NavBar />
              {props.children}
            </Providers>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
