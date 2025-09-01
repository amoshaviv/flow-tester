import * as React from "react";
import { redirect, RedirectType } from "next/navigation";
import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";
import ProjectSettingsClient from "./ProjectSettingsClient";

const redirectToSignIn = () =>
  redirect("/authentication/signin", RedirectType.push);
const redirectToOrganizations = () =>
  redirect("/organizations", RedirectType.push);

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ organizationSlug: string; projectSlug: string }>;
}) {
  const session = await getSession();
  const email = session?.user?.email;
  if (!email) return redirectToSignIn();

  const { organizationSlug, projectSlug } = await params;
  const dbModels = await getDBModels();
  const { User, Organization, Project } = dbModels;

  try {
    const user = await User.findByEmail(email);
    if (!user) return redirectToSignIn();

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

    return (
      <ProjectSettingsClient
        project={{
          slug: project.slug,
          name: project.name,
        }}
        organizationSlug={organizationSlug}
        projectSlug={projectSlug}
      />
    );
  } catch (err) {
    console.log(err);
    return (
      <div>
        <h1>Error</h1>
        <p>An error occurred while loading the project settings.</p>
      </div>
    );
  }
}
