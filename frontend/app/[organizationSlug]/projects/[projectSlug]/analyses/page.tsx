import * as React from "react";
import Container from "@mui/material/Container";
import { redirect, RedirectType } from "next/navigation";

import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";
import AnalysesTable from "./AnalysesTable";

export default async function AnalysesPage({
  params,
}: {
  params: Promise<{
    organizationSlug: string,
    projectSlug: string;
  }>;
}) {
  const { organizationSlug, projectSlug } = await params;

  const session = await getSession();
  const email = session?.user?.email;
  if (!email) return redirect("/authentication/signin", RedirectType.push);

  const dbModels = await getDBModels();
  const { Organization, Project, User } = dbModels;

  const user = await User.findByEmail(email);
  if (!user) return redirect("/authentication/signin", RedirectType.push);

  // Check if user has access to this organization
  const organization = await Organization.findBySlugAndUserEmail(
    organizationSlug,
    email
  );
  if (!organization) return redirect("/organizations", RedirectType.push);

  const project = await Project.findBySlugAndOrganizationSlug(
    projectSlug,
    organizationSlug
  );
  if (!project) return redirect(`/organizations/${organizationSlug}/projects`, RedirectType.push);

  // Fetch all analyses for this organization
  const analyses = await organization.getAnalyses();
  const clientAnalyses = analyses.map(analysis => ({
    slug: analysis.slug,
    status: analysis.status,
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  }));

  return (
    <AnalysesTable
      analyses={clientAnalyses}
      organizationSlug={organizationSlug}
    />
  );
}