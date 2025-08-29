import { NextRequest, NextResponse } from "next/server";
import { getDBModels } from "@/lib/sequelize";
import { getToken } from "next-auth/jwt";

export const PUT = async (
  request: NextRequest,
  context: {
    params: Promise<{ organizationSlug: string }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug } = params;
  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization, Project } = dbModels;

  // Make sure user is authorized
  if (!email)
    return NextResponse.json({ message: "Not Authorized" }, { status: 401 });
  const user = await User.findByEmail(email);
  if (!user)
    return NextResponse.json({ message: "Not Authorized" }, { status: 401 });

  // Create organization
  const { name } = await request.json();
  try {
    const organization = await Organization.findBySlugAndUserEmail(
      organizationSlug,
      email
    );
    if (!organization)
      return NextResponse.json({ message: "Not Authorized" }, { status: 401 });

    const project = await Project.createWithOrganization(
      name,
      user,
      organization
    );

    return NextResponse.json({
      name: project.name,
      slug: project.slug,
    });
  } catch (err: any) {
    let message = "Failed to create organization";
    let status = 400;

    // Handle Sequelize unique constraint errors
    if (err && err.name === "SequelizeUniqueConstraintError") {
      if (err.errors && err.errors.length > 0) {
        // Compose a message based on which field failed
        const fields = err.errors.map((e: any) => e.path).join(", ");
        message = `Organization with this ${fields} already exists.`;
      } else {
        message = "Organization already exists.";
      }
      status = 409;
    } else if (err && err.name === "SequelizeValidationError") {
      // Handle validation errors
      message =
        err.errors?.map((e: any) => e.message).join("; ") || "Validation error";
      status = 400;
    } else if (err && err.message) {
      message = err.message;
    }

    return NextResponse.json({ message }, { status });
  }
};
