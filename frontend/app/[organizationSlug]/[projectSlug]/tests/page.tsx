import * as React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { redirect, RedirectType } from "next/navigation";
import { getDBModels } from "@/lib/sequelize";
import { getSession } from "@/lib/next-auth";
import Grid from "@mui/material/Grid";
import NewTestModal from "./NewTestModal";
import TestsTable from "./TestsTable";

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

    const project = await Project.findBySlugAndOrganizationSlug(
      projectSlug,
      organizationSlug
    );
    if (!project) return redirectToOrganizations();

    const tests = await Test.findAllByProjectSlug(projectSlug);
    const defaultVersionsTests = tests
      .filter((test) => test.versions.length > 0)
      .map((test) => {
        const defaultTestVersion = test.versions.find(
          (version) => version.isDefault
        );
        return {
          slug: test.slug,
          title: defaultTestVersion?.title,
          description: defaultTestVersion?.description,
          defaultVersion: {
            slug: defaultTestVersion?.slug,
            title: defaultTestVersion?.title,
            description: defaultTestVersion?.description,
            number: defaultTestVersion?.number,
          },
          totalVersions: test.versions.length,
          totalRuns: 0,
        };
      });
      return <TestsTable tests={defaultVersionsTests} />;
  } catch (err) {
    console.log(err);
  }

  
  return (
    <Box sx={{ p: 1.2, pl: 2, pr: 2 }}>
      <Grid container>
        <Grid size="grow">
          <Typography variant="h4" fontWeight="bold" component="h1">
            Tests
          </Typography>
        </Grid>
        <Grid size={3}>
          <NewTestModal />
        </Grid>
      </Grid>
      <Grid sx={{ mt: 2 }} container>
        <TestsTable />
      </Grid>
    </Box>
  );
}
