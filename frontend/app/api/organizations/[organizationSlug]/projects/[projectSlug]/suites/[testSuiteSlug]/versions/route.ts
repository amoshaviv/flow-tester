import { NextRequest, NextResponse } from "next/server";
import { getDBModels } from "@/lib/sequelize";
import { getToken } from "next-auth/jwt";

const notAuthorized = () =>
  NextResponse.json({ message: "Not Authorized" }, { status: 401 });

export const PUT = async (
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
  const { User, Organization, Project, TestSuite, TestSuiteVersion } = dbModels;

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

    const testSuite = await TestSuite.findBySlugAndProject(testSuiteSlug, project);
    if (!testSuite) {
      return NextResponse.json({ message: "Test suite not found" }, { status: 404 });
    }

    // Create a new version and set it as default
    const testSuiteVersion = await TestSuiteVersion.createWithTestSuite(
      title,
      description,
      user,
      testSuite,
      true
    );

    return NextResponse.json({
      testSuite: {
        slug: testSuite.slug,
      },
      testSuiteVersion: {
        slug: testSuiteVersion.slug,
        title: testSuiteVersion.title,
        description: testSuiteVersion.description,
        number: testSuiteVersion.number,
        isDefault: testSuiteVersion.isDefault,
      },
      project: {
        name: project.name,
        slug: project.slug,
        profileImageURL: project.profileImageURL,
      },
      organization: {
        name: organization.name,
        slug: organization.slug,
        domain: organization.domain,
        profileImageURL: organization.profileImageURL,
      },
    });
  } catch (err: any) {
    console.log(err);
    let message = "Failed to create test suite version";
    let status = 400;

    return NextResponse.json({ message }, { status });
  }
};