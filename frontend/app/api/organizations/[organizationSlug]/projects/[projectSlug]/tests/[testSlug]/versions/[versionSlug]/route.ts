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
      testSlug: string;
      versionSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug, testSlug, versionSlug } = params;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization, Project, Test, TestVersion } = dbModels;

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
    if (!project) return notAuthorized();

    // Find the test
    const test = await Test.findOne({
      where: { slug: testSlug },
      include: [
        {
          association: "project",
          where: { id: project.id },
          attributes: [],
        },
      ],
    });

    if (!test) {
      return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    const updatedVersion = await TestVersion.setAsDefault(versionSlug, test);
    
    if (!updatedVersion) {
      return NextResponse.json(
        { message: "Version not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Version set as default successfully",
      version: {
        slug: updatedVersion.slug,
        title: updatedVersion.title,
        description: updatedVersion.description,
        number: updatedVersion.number,
        isDefault: updatedVersion.isDefault,
      },
    });
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to update version" },
      { status: 500 }
    );
  }
};