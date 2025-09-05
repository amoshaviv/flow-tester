import { NextRequest, NextResponse } from "next/server";
import { getDBModels } from "@/lib/sequelize";
import { getToken } from "next-auth/jwt";
import { sendInviteEmail } from "@/lib/email";

const notAuthorized = () =>
  NextResponse.json({ message: "Not Authorized" }, { status: 401 });

export const POST = async (
  request: NextRequest,
  context: {
    params: Promise<{
      organizationSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug } = params;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization, Invite } = dbModels;

  if (!email) return notAuthorized();
  
  try {
    const currentUser = await User.findByEmail(email);
    if (!currentUser) return notAuthorized();

    // Get current user's role in organization
    const result = await Organization.findBySlugAndUserEmailWithRole(
      organizationSlug,
      email
    );
    
    if (!result) return notAuthorized();

    const { organization, userRole } = result;

    // Only owners and admins can add users
    if (userRole !== "owner" && userRole !== "admin") {
      return NextResponse.json(
        { message: "Insufficient permissions to add users" },
        { status: 403 }
      );
    }

    const { email: newUserEmail, role } = await request.json();

    if (!newUserEmail || !role) {
      return NextResponse.json(
        { message: "Email and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["user", "tester", "admin"];
    if (userRole === "owner") {
      validRoles.push("owner");
    }

    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { message: "Invalid role" },
        { status: 400 }
      );
    }

    // Find user to be added
    const userToAdd = await User.findByEmail(newUserEmail.trim());
    
    if (userToAdd) {
      // User exists, add them directly to organization
      const addResult = await Organization.addUserToOrganization(
        organization,
        userToAdd,
        role
      );

      if (!addResult.success) {
        return NextResponse.json(
          { message: addResult.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: "User added successfully",
        user: addResult.user,
      });
    } else {
      // User doesn't exist, create an invite
      const invite = await Invite.createInvite(
        newUserEmail.trim(),
        role as any,
        organization,
        currentUser
      );

      // Send invitation email
      const emailResult = await sendInviteEmail(newUserEmail.trim(), {
        inviteToken: invite.token,
        organizationName: organization.name,
        organizationDomain: organization.domain,
        invitedByName: currentUser.displayName || currentUser.email,
        invitedByEmail: currentUser.email,
        role: role,
      });

      if (!emailResult.success) {
        console.error("Failed to send invite email:", emailResult.error);
        // Still return success but mention email issue
        return NextResponse.json({
          message: "Invite created but failed to send email",
          invite: {
            email: invite.email,
            role: invite.role,
            token: invite.token,
          },
        });
      }

      return NextResponse.json({
        message: "Invitation sent successfully",
        invite: {
          email: invite.email,
          role: invite.role,
          token: invite.token,
        },
      });
    }
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to add user" },
      { status: 500 }
    );
  }
};