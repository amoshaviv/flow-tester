import * as React from "react";
import { redirect, RedirectType } from "next/navigation";
import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";
import ProjectsClient from "./ProjectsClient";

const redirectToSignIn = () =>
  redirect("/authentication/signin", RedirectType.push);
const redirectToOrganizations = () =>
  redirect("/organizations", RedirectType.push);

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const session = await getSession();
  const email = session?.user?.email;
  if (!email) return redirectToSignIn();

  const { organizationSlug } = await params;
  const dbModels = await getDBModels();
  const { User, Organization, Test } = dbModels;

  try {
    const user = await User.findByEmail(email);
    if (!user) return redirectToSignIn();

    const organization = await Organization.findBySlugAndUserEmail(
      organizationSlug,
      email
    );
    if (!organization) return redirectToOrganizations();

    const projects = await organization.getProjects();

    // Get test counts for each project
    const projectsWithTestCounts = await Promise.all(
      projects.map(async (project) => {
        const testCount = await Test.count({
          where: {
            project_id: project.id,
          },
        });
        return {
          slug: project.slug,
          name: project.name,
          createdAt: project.createdAt,
          testCount,
        };
      })
    );

    return (
      <ProjectsClient
        organization={{
          slug: organization.slug,
          name: organization.name,
        }}
        projects={projectsWithTestCounts}
        organizationSlug={organizationSlug}
      />
    );
  } catch (err) {
    console.log(err);
    return (
      <div>
        <h1>Error</h1>
        <p>An error occurred while loading the projects.</p>
      </div>
    );
  }
}
