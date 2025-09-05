import * as React from "react";
import { redirect, RedirectType, notFound } from "next/navigation";
import { getDBModels } from "@/lib/sequelize";
import InviteSignupClient from "./InviteSignupClient";

const redirectToExpired = () =>
  redirect("/authentication/signup/invite/expired", RedirectType.push);

export default async function InviteSignupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const dbModels = await getDBModels();
  const { Invite } = dbModels;

  try {
    const invite = await Invite.findByToken(token);

    if (!invite) {
      notFound();
    }

    if (invite.isExpired()) {
      redirectToExpired();
    }

    return (
      <InviteSignupClient
        invite={{
          email: invite.email,
          role: invite.role,
          token: invite.token,
          organization: {
            name: invite.organization.name,
            slug: invite.organization.slug,
            domain: invite.organization.domain,
          },
          invitedBy: {
            displayName: invite.invitedBy.displayName,
            email: invite.invitedBy.email,
            profileImageURL: invite.invitedBy.profileImageURL,
          },
        }}
      />
    );
  } catch (err: any) {
    if (err.message === "NEXT_REDIRECT" || err.digest === 'NEXT_HTTP_ERROR_FALLBACK;404') {
      throw err
    }

    return (
      <div>
        <h1>Error</h1>
        <p>An error occurred while loading the invitation.</p>
      </div>
    );
  }
}