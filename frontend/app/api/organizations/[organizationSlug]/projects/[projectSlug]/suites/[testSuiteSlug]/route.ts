import { NextRequest, NextResponse } from "next/server";
import { getDBModels } from "@/lib/sequelize";
import { getToken } from "next-auth/jwt";

const notAuthorized = () =>
  NextResponse.json({ message: "Not Authorized" }, { status: 401 });

export const DELETE = async (
  request: NextRequest,
  context: {
    params: Promise<{ organizationSlug: string; projectSlug: string; testSuiteSlug: string }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug, testSuiteSlug } = params;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization, Project, TestSuite } = dbModels;

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

    const testSuite = await TestSuite.findBySlugAndProject(testSuiteSlug, project);
    if (!testSuite) {
      return NextResponse.json({ message: "Test suite not found" }, { status: 404 });
    }

    // Delete the test suite (this should cascade to versions and runs)
    await TestSuite.destroy({
      where: { slug: testSuiteSlug }
    });

    return NextResponse.json({ message: "Test suite deleted successfully" });
  } catch (err: any) {
    console.log(err);
    let message = "Failed to delete test suite";
    let status = 400;

    return NextResponse.json({ message }, { status });
  }
};


export const PATCH = async (
  request: NextRequest,
  context: {
    params: Promise<{
      organizationSlug: string;
      projectSlug: string;
      testSuiteSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug, testSuiteSlug } = params;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization, Project, TestSuite, TestSuiteVersion } = dbModels;

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

    // Find the test suite by slug
    const testSuite = await TestSuite.findOne({
      where: { slug: testSuiteSlug },
      include: [
        {
          model: TestSuiteVersion,
          as: "versions",
          where: { isDefault: true },
          required: true,
        },
      ],
    });
    if (!testSuite) {
      return NextResponse.json({ message: "Test suite not found" }, { status: 404 });
    }

    // Set current default version to false
    const currentDefaultVersion = testSuite.versions[0];
    await currentDefaultVersion.update({ isDefault: false });

    // Create new test version as the new default
    const newDefaultVersion = await TestSuiteVersion.createWithTestSuite(title, description, user, testSuite, true)

    return NextResponse.json({
      message: "Test suite updated successfully",
      test: {
        slug: testSuite.slug,
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
