import { NextRequest, NextResponse } from "next/server";
import { getDBModels } from "@/lib/sequelize";
import { getToken } from "next-auth/jwt";

const notAuthorized = () =>
  NextResponse.json({ message: "Not Authorized" }, { status: 401 });

export const GET = async (
  request: NextRequest,
  context: {
    params: Promise<{ organizationSlug: string; projectSlug: string }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug } = params;

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

    const testSuites = await TestSuite.findAllByProjectSlug(projectSlug);
    return NextResponse.json(testSuites);
  } catch (err: any) {
    console.log(err);
    let message = "Failed to fetch test suites";
    let status = 400;

    return NextResponse.json({ message }, { status });
  }
};

export const PUT = async (
  request: NextRequest,
  context: {
    params: Promise<{ organizationSlug: string; projectSlug: string }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug } = params;

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

    const testSuite = await TestSuite.createWithUserAndProject(user, project);
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
    let message = "Failed to create a test suite";
    let status = 400;

    return NextResponse.json({ message }, { status });
  }
};