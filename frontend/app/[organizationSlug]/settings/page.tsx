import * as React from "react";
import { redirect, RedirectType, notFound } from "next/navigation";
import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";
import OrganizationSettingsClient from "./OrganizationSettingsClient";

const redirectToSignIn = () =>
  redirect("/authentication/signin", RedirectType.push);
const redirectToOrganizations = () =>
  redirect("/organizations", RedirectType.push);

export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const session = await getSession();
  const email = session?.user?.email;
  if (!email) return redirectToSignIn();

  const { organizationSlug } = await params;
  const dbModels = await getDBModels();
  const { User, Organization } = dbModels;

  try {
    const user = await User.findByEmail(email);
    if (!user) return redirectToSignIn();

    const result = await Organization.findBySlugAndUserEmailWithRole(
      organizationSlug,
      email
    );
    if (!result) return notFound();
    const { organization, userRole } = result;

    // Only owners and admins can view user management
    if (userRole !== "owner" && userRole !== "admin") {
      return notFound();
    }

    return (
      <OrganizationSettingsClient
        organization={{
          slug: organization.slug,
          name: organization.name,
          domain: organization.domain,
          profileImageURL: organization.profileImageURL,
        }}
        organizationSlug={organizationSlug}
      />
    );
  } catch (err: any) {
    console.log(err);
    if (err.digest === 'NEXT_HTTP_ERROR_FALLBACK;404') {
      throw err
    }

    return (
      <div>
        <h1>Error</h1>
        <p>An error occurred while loading the organization settings.</p>
      </div>
    );
  }
}
