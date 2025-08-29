import * as React from "react";
import { redirect, RedirectType } from "next/navigation";
import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";
import TestDetailsClient from "./TestDetailsClient";

const redirectToSignIn = () =>
  redirect("/authentication/signin", RedirectType.push);
const redirectToOrganizations = () =>
  redirect("/organizations", RedirectType.push);

export default async function TestPage({
  params,
}: {
  params: Promise<{ organizationSlug: string; projectSlug: string; testSlug: string }>;
}) {
  const session = await getSession();
  const email = session?.user?.email;
  if (!email) return redirectToSignIn();

  const { organizationSlug, projectSlug, testSlug } = await params;
  const dbModels = await getDBModels();
  const { User, Organization, Project, Test } = dbModels;

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

    const test = await Test.findBySlugAndProject(testSlug, project);
    if (!test) {
      return (
        <div>
          <h1>Test not found</h1>
          <p>The test you are looking for does not exist or you don't have access to it.</p>
        </div>
      );
    }

    return (
      <TestDetailsClient
        testData={test}
        organizationSlug={organizationSlug}
        projectSlug={projectSlug}
      />
    );
  } catch (err) {
    console.log(err);
    return (
      <div>
        <h1>Error</h1>
        <p>An error occurred while loading the test details.</p>
      </div>
    );
  }
}