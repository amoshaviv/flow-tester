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

export const DELETE = async (
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
  const { User, Organization, UsersOrganizations } = dbModels;

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

    // Only owners and admins can remove users
    if (userRole !== "owner" && userRole !== "admin") {
      return NextResponse.json(
        { message: "Insufficient permissions to remove users" },
        { status: 403 }
      );
    }

    const { email: userEmailToRemove } = await request.json();

    if (!userEmailToRemove) {
      return NextResponse.json(
        { message: "User email is required" },
        { status: 400 }
      );
    }

    // Find user to be removed
    const userToRemove = await User.findByEmail(userEmailToRemove.trim());
    
    if (!userToRemove) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is in the organization
    const userOrgRelation = await UsersOrganizations.findOne({
      where: {
        userId: userToRemove.id,
        organizationId: organization.id,
      },
    });

    if (!userOrgRelation) {
      return NextResponse.json(
        { message: "User is not a member of this organization" },
        { status: 404 }
      );
    }

    // Prevent removing owners (only owners can remove other owners, but we'll restrict this for safety)
    if (userOrgRelation.role === "owner") {
      return NextResponse.json(
        { message: "Cannot remove organization owners" },
        { status: 403 }
      );
    }

    // Prevent self-removal
    if (userToRemove.id === currentUser.id) {
      return NextResponse.json(
        { message: "Cannot remove yourself from the organization" },
        { status: 403 }
      );
    }

    // Remove user from organization
    await userOrgRelation.destroy();

    return NextResponse.json({
      message: "User removed successfully",
      removedUser: {
        email: userToRemove.email,
        displayName: userToRemove.displayName,
      },
    });
    
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to remove user" },
      { status: 500 }
    );
  }
};

export const PATCH = async (
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
  const { User, Organization, UsersOrganizations } = dbModels;

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

    // Only owners and admins can change user roles
    if (userRole !== "owner" && userRole !== "admin") {
      return NextResponse.json(
        { message: "Insufficient permissions to modify user roles" },
        { status: 403 }
      );
    }

    const { email: userEmailToUpdate, role: newRole } = await request.json();

    if (!userEmailToUpdate || !newRole) {
      return NextResponse.json(
        { message: "User email and role are required" },
        { status: 400 }
      );
    }

    // Validate new role
    const validRoles = ["user", "tester", "admin"];
    if (userRole === "owner") {
      validRoles.push("owner");
    }

    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { message: "Invalid role" },
        { status: 400 }
      );
    }

    // Find user to be updated
    const userToUpdate = await User.findByEmail(userEmailToUpdate.trim());
    
    if (!userToUpdate) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is in the organization
    const userOrgRelation = await UsersOrganizations.findOne({
      where: {
        userId: userToUpdate.id,
        organizationId: organization.id,
      },
    });

    if (!userOrgRelation) {
      return NextResponse.json(
        { message: "User is not a member of this organization" },
        { status: 404 }
      );
    }

    // Additional validation for role changes
    // Non-owners cannot modify owner roles or assign owner roles
    if (userRole !== "owner") {
      if (userOrgRelation.role === "owner" || newRole === "owner") {
        return NextResponse.json(
          { message: "Only owners can modify or assign owner roles" },
          { status: 403 }
        );
      }
    }

    // Prevent changing your own role
    if (userToUpdate.id === currentUser.id) {
      return NextResponse.json(
        { message: "Cannot change your own role" },
        { status: 403 }
      );
    }

    // Update the role
    await userOrgRelation.update({ role: newRole });

    return NextResponse.json({
      message: "User role updated successfully",
      updatedUser: {
        email: userToUpdate.email,
        displayName: userToUpdate.displayName,
        role: newRole,
      },
    });
    
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to update user role" },
      { status: 500 }
    );
  }
};