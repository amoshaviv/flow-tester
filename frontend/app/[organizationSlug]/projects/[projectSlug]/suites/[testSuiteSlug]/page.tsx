import * as React from "react";
import { redirect, RedirectType } from "next/navigation";
import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";
import TestSuiteDetailsClient from "./TestSuiteDetailsClient";

const redirectToSignIn = () =>
  redirect("/authentication/signin", RedirectType.push);
const redirectToOrganizations = () =>
  redirect("/organizations", RedirectType.push);

export default async function TestSuitePage({
  params,
}: {
  params: Promise<{ organizationSlug: string; projectSlug: string; testSuiteSlug: string }>;
}) {
  const session = await getSession();
  const email = session?.user?.email;
  if (!email) return redirectToSignIn();

  const { organizationSlug, projectSlug, testSuiteSlug } = await params;
  const dbModels = await getDBModels();
  const { User, Organization, Project, TestSuite } = dbModels;

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

    const testSuite = await TestSuite.findBySlugAndProject(testSuiteSlug, project);
    if (!testSuite) {
      return (
        <div>
          <h1>Test Suite not found</h1>
          <p>The test suite you are looking for does not exist or you don't have access to it.</p>
        </div>
      );
    }

    return (
      <TestSuiteDetailsClient
        testSuiteData={testSuite}
        organizationSlug={organizationSlug}
        projectSlug={projectSlug}
      />
    );
  } catch (err) {
    console.log(err);
    return (
      <div>
        <h1>Error</h1>
        <p>An error occurred while loading the test suite details.</p>
      </div>
    );
  }
}