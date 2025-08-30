import { NextRequest, NextResponse } from "next/server";
import { getDBModels } from "@/lib/sequelize";
import { getToken } from "next-auth/jwt";

const notAuthorized = () =>
  NextResponse.json({ message: "Not Authorized" }, { status: 401 });

export const GET = async (
  request: NextRequest,
  context: {
    params: Promise<{
      organizationSlug: string;
      projectSlug: string;
      testSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug, testSlug } = params;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization, Project, Test } = dbModels;

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

    const test = await Test.findBySlugAndProject(testSlug, project);
    if (!test) {
      return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    return NextResponse.json(test);
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to fetch test data" },
      { status: 500 }
    );
  }
};

export const PATCH = async (
  request: NextRequest,
  context: {
    params: Promise<{
      organizationSlug: string;
      projectSlug: string;
      testSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug, testSlug } = params;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization, Project, Test, TestVersion } = dbModels;

  // Make sure user is authorized
  if (!email) return notAuthorized();
  const user = await User.findByEmail(email);
  if (!user) return notAuthorized();

  const { title, description } = await request.json();

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

    // Find the test by slug
    const test = await Test.findOne({
      where: { slug: testSlug },
      include: [
        {
          model: TestVersion,
          as: "versions",
          where: { isDefault: true },
          required: true,
        },
      ],
    });

    if (!test) {
      return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    // Set current default version to false
    const currentDefaultVersion = test.versions[0];
    await currentDefaultVersion.update({ isDefault: false });

    // Create new test version as the new default
    const newDefaultVersion = await TestVersion.createWithTest(
      title,
      description,
      user,
      test,
      true
    );

    return NextResponse.json({
      message: "Test updated successfully",
      test: {
        slug: test.slug,
      },
      testVersion: {
        slug: newDefaultVersion.slug,
        title: newDefaultVersion.title,
        description: newDefaultVersion.description,
        number: newDefaultVersion.number,
        isDefault: newDefaultVersion.isDefault,
      },
    });
  } catch (err: any) {
    console.log(err);
    let message = "Failed to update test";
    let status = 400;

    return NextResponse.json({ message }, { status });
  }
};

export const DELETE = async (
  request: NextRequest,
  context: {
    params: Promise<{
      organizationSlug: string;
      projectSlug: string;
      testSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug, testSlug } = params;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization, Project, Test, TestVersion } = dbModels;

  // Make sure user is authorized
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

    // Find the test by slug
    const test = await Test.findOne({
      where: { slug: testSlug },
    });

    if (!test) {
      return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    // Soft delete all related test versions first
    await TestVersion.destroy({
      where: { test_id: test.id },
    });

    // Then soft delete the test
    await test.destroy();

    return NextResponse.json({
      message: "Test deleted successfully",
    });
  } catch (err: any) {
    console.log(err);
    let message = "Failed to delete test";
    let status = 400;

    return NextResponse.json({ message }, { status });
  }
};
