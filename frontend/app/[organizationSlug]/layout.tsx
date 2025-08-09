import * as React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/theme";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import Providers from "@/app/components/authentication/providers";
import { useParams } from "next/navigation";
import { getSession } from "@/lib/next-auth";
import NavBar from "@/app/components/layout/NavBar";
import { getDBModels } from "@/lib/sequelize";
import { redirect } from "next/navigation";

export default async function OrganizationLayout(props: {
  children: React.ReactNode;
  params: Promise<{ organizationSlug: string }>;
}) {
  const session = await getSession();
  const email = session?.user?.email;
  const { params, children } = props;
  const { organizationSlug } = await params;

  const dbModels = await getDBModels();
  const { Organization } = dbModels;
  if (organizationSlug && email) {
    const organization = await Organization.findBySlugAndUserEmail(
      organizationSlug,
      email
    );

    if (organization) {
      return [
        <NavBar key="nav-bar" organization={organization.toJSON()} />,
        children,
      ];
    } else {
      redirect("/dashboard");
    }
  }
  return [<NavBar />, children];
}
