import * as React from "react";
import { redirect, RedirectType, notFound } from "next/navigation";
import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";
import UsersClient from "./UsersClient";
import { NextResponse } from "next/server";

const redirectToSignIn = () =>
  redirect("/authentication/signin", RedirectType.push);

export default async function UsersPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const session = await getSession();
  const email = session?.user?.email;
  if (!email) return redirectToSignIn();

  const { organizationSlug } = await params;
  const dbModels = await getDBModels();
  const { User, Organization, UsersOrganizations } = dbModels;

  try {
    const user = await User.findByEmail(email);
    if (!user) return redirectToSignIn();

    // Get organization with current user's role
    const result = await Organization.findBySlugAndUserEmailWithRole(
      organizationSlug,
      email
    );

    if (!result) return notFound();
    const { organization, userRole } = result;

    // Only owners and admins can view user management
    if (userRole !== "owner" && userRole !== "admin") {
      notFound();
    }

    // Get all users with their roles
    const users = await UsersOrganizations.getUsersByOrganizationWithRoles(organization);

    return (
      <UsersClient
        organization={{
          slug: organization.slug,
          name: organization.name,
          domain: organization.domain,
        }}
        users={users}
        currentUserEmail={user.email}
        currentUserRole={userRole}
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
        <p>An error occurred while loading the users.</p>
      </div>
    );
  }
}