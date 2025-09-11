import * as React from "react";
import { redirect, RedirectType } from 'next/navigation';
import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";
import ProfileClient from "./ProfileClient";
import NavBar from "../components/layout/NavBar";

const redirectToSignIn = () =>
  redirect("/authentication/signin", RedirectType.push);

export default async function ProfilePage() {
  const session = await getSession();
  const email = session?.user?.email;
  if (!email) return redirectToSignIn();

  const dbModels = await getDBModels();
  const { User, Organization } = dbModels;

  try {
    const user = await User.findByEmail(email);
    if (!user) return redirectToSignIn();

    const organizations = await user.getOrganizations();
    if (!organizations || organizations.length === 0) return redirectToSignIn();

    const organizationWithRole = await Organization.findBySlugAndUserEmailWithRole(organizations[0].slug, email);
    if (!organizationWithRole) return redirectToSignIn();
    const { userRole, organization } = organizationWithRole;

    return (
      <>
        <NavBar organization={organization.toJSON()} role={userRole} />
        <ProfileClient
          user={{
            email: user.email,
            displayName: user.displayName,
            profileImageURL: user.profileImageURL,
          }}
        />
      </>
    );
  } catch (err) {
    console.log(err);
    return (
      <div>
        <h1>Error</h1>
        <p>An error occurred while loading your profile.</p>
      </div>
    );
  }
}
