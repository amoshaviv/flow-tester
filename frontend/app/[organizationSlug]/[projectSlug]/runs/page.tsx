import * as React from "react";
import Container from "@mui/material/Container";
import { redirect, RedirectType } from "next/navigation";

import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";
import TestRunsTable from "./TestRunsTable";

export default async function RunsPage({
  params,
}: {
  params: Promise<{ organizationSlug: string; projectSlug: string }>;
}) {
  const { organizationSlug, projectSlug } = await params;

  const session = await getSession();
  const email = session?.user?.email;
  if (!email) return redirect("/authentication/signin", RedirectType.push);

  const dbModels = await getDBModels();
  const { Organization, User, Project, Test, TestVersion, TestRun } = dbModels;

  const user = await User.findByEmail(email);
  if (!user) return redirect("/authentication/signin", RedirectType.push);

  // Check if user has access to this organization
  const organization = await Organization.findBySlugAndUserEmail(
    organizationSlug,
    email
  );
  if (!organization) return redirect("/organizations", RedirectType.push);

  // Check if project exists in this organization
  const project = await Project.findBySlugAndOrganizationSlug(
    projectSlug,
    organizationSlug
  );
  if (!project) return redirect(`/${organizationSlug}`, RedirectType.push);

  // Fetch all test runs for this project
  const testRuns = await TestRun.findAllByProject(project);

  return (
    <TestRunsTable
      testRuns={testRuns}
      organizationSlug={organizationSlug}
      projectSlug={projectSlug}
    />
  );
}
