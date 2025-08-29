import * as React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { redirect, RedirectType } from "next/navigation";
import { getDBModels } from "@/lib/sequelize";
import { getSession } from "@/lib/next-auth";
import Grid from "@mui/material/Grid";
import NewTestModal from "./NewTestModal";
import TestsClient from "./TestsClient";
import NewProjectForm from "./NewProjectForm";

const redirectToSignIn = () =>
  redirect("/authentication/signin", RedirectType.push);
const redirectToOrganizations = () =>
  redirect("/organizations", RedirectType.push);

export default async function Tests(props: {
  params: Promise<{ projectSlug: string; organizationSlug: string }>;
}) {
  const session = await getSession();
  const email = session?.user?.email;
  if (!email) return redirectToSignIn();

  const { params } = props;
  const { projectSlug, organizationSlug } = await params;
  const dbModels = await getDBModels();

  const { Test, Organization, Project } = dbModels;

  try {
    const organization = await Organization.findBySlugAndUserEmail(
      organizationSlug,
      email
    );
    if (!organization) return redirectToOrganizations();

    return <NewProjectForm organizationSlug={organizationSlug} />;
  } catch (err) {
    console.log(err);
  }

  return (
    <Box sx={{ p: 1.2, pl: 2, pr: 2 }}>
      Error
    </Box>
  );
}
