import { NextRequest, NextResponse } from "next/server";
import { getDBModels } from "@/lib/sequelize";
import { getToken } from "next-auth/jwt";

const notAuthorized = () =>
  NextResponse.json({ message: "Not Authorized" }, { status: 401 });

export const PATCH = async (
  request: NextRequest,
  context: {
    params: Promise<{
      organizationSlug: string;
      projectSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug } = params;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization, Project } = dbModels;

  if (!email) return notAuthorized();
  const user = await User.findByEmail(email);
  if (!user) return notAuthorized();

  const { name, slug } = await request.json();

  if (!name || !slug) {
    return NextResponse.json(
      { message: "Name and slug are required" },
      { status: 400 }
    );
  }

  try {
    const organization = await Organization.findBySlugAndUserEmail(
      organizationSlug,
      email
    );
    if (!organization) return notAuthorized();

    const project = await Project.findBySlugAndOrganizationSlug(
      projectSlug,
      organizationSlug
    );
    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    const result = await Project.updateProjectDetails(project, name, slug);

    if (!result.success) {
      return NextResponse.json(
        { 
          message: result.error,
          suggestedSlug: result.suggestedSlug 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Project updated successfully",
      project: {
        slug: result.project?.slug,
        name: result.project?.name,
      },
    });
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to update project" },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  request: NextRequest,
  context: {
    params: Promise<{
      organizationSlug: string;
      projectSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug } = params;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization, Project } = dbModels;

  if (!email) return notAuthorized();
  const user = await User.findByEmail(email);
  if (!user) return notAuthorized();

  try {
    const organization = await Organization.findBySlugAndUserEmail(
      organizationSlug,
      email
    );
    if (!organization) return notAuthorized();

    const project = await Project.findBySlugAndOrganizationSlug(
      projectSlug,
      organizationSlug
    );
    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    await project.destroy();

    return NextResponse.json({
      message: "Project deleted successfully",
    });
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to delete project" },
      { status: 500 }
    );
  }
};