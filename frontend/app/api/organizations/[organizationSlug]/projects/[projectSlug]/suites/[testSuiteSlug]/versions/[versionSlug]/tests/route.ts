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
      testSuiteSlug: string;
      versionSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug, testSuiteSlug, versionSlug } = params;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const {
    User,
    Organization,
    Project,
    TestSuite,
    TestSuiteVersion,
    TestSuiteTest,
  } = dbModels;

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
    const testSuite = await TestSuite.findOne({
      where: { slug: testSuiteSlug },
      include: [
        {
          association: "project",
          where: { id: project.id },
          attributes: [],
        },
      ],
    });

    if (!testSuite) {
      return NextResponse.json(
        { message: "Test suite not found" },
        { status: 404 }
      );
    }

    // Find the specific version
    const version = await TestSuiteVersion.findOneBySlugAndTestSuite(
      versionSlug,
      testSuite
    );

    if (!version) {
      return NextResponse.json(
        { message: "Test suite version not found" },
        { status: 404 }
      );
    }

    // Get tests in this version
    const tests = await TestSuiteTest.findTestsByTestSuiteVersion(version.id);
    return NextResponse.json(tests);
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to fetch tests in test suite version" },
      { status: 500 }
    );
  }
};

export const POST = async (
  request: NextRequest,
  context: {
    params: Promise<{
      organizationSlug: string;
      projectSlug: string;
      testSuiteSlug: string;
      versionSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug, testSuiteSlug, versionSlug } = params;

  const body = await request.json().catch(() => ({}));
  const { testSlugs } = body; // Array of test slugs to add

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const {
    User,
    Organization,
    Project,
    TestSuite,
    TestSuiteVersion,
    TestSuiteTest,
    Test,
  } = dbModels;

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

    const testSuite = await TestSuite.findBySlugAndProject(
      testSuiteSlug,
      project
    );
    if (!testSuite) {
      return NextResponse.json(
        { message: "Test suite not found" },
        { status: 404 }
      );
    }

    // Find the specific version
    const version = await TestSuiteVersion.findOne({
      where: { slug: versionSlug, test_suite_id: testSuite.id },
    });

    if (!version) {
      return NextResponse.json(
        { message: "Test suite version not found" },
        { status: 404 }
      );
    }

    // Find tests by slugs and add them to the suite version
    const addedTests = [];
    for (const testSlug of testSlugs || []) {
      const test = await Test.findOne({
        where: { slug: testSlug, project_id: project.id },
      });

      if (test) {
        try {
          await TestSuiteTest.addTestToSuiteVersion(version.id, test.id);
          addedTests.push({
            id: test.id,
            slug: test.slug,
          });
        } catch (err) {
          // Test might already be in suite, ignore duplicate errors
          console.log(`Test ${testSlug} might already be in suite:`, err);
        }
      }
    }

    return NextResponse.json({
      message: "Tests added to test suite version successfully",
      addedTests,
    });
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to add tests to test suite version" },
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
      testSuiteSlug: string;
      versionSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug, testSuiteSlug, versionSlug } = params;

  const body = await request.json().catch(() => ({}));
  const { testSlugs } = body; // Array of test slugs to remove

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const {
    User,
    Organization,
    Project,
    TestSuite,
    TestSuiteVersion,
    TestSuiteTest,
    Test,
  } = dbModels;

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

    const testSuite = await TestSuite.findBySlugAndProject(
      testSuiteSlug,
      project
    );
    if (!testSuite) {
      return NextResponse.json(
        { message: "Test suite not found" },
        { status: 404 }
      );
    }

    // Find the specific version
    const version = await TestSuiteVersion.findOne({
      where: { slug: versionSlug, test_suite_id: testSuite.id },
    });

    if (!version) {
      return NextResponse.json(
        { message: "Test suite version not found" },
        { status: 404 }
      );
    }

    // Find tests by slugs and remove them from the suite version
    const removedTests = [];
    for (const testSlug of testSlugs || []) {
      const test = await Test.findOne({
        where: { slug: testSlug, project_id: project.id },
      });

      if (test) {
        const removed = await TestSuiteTest.removeTestFromSuiteVersion(
          version.id,
          test.id
        );
        if (removed > 0) {
          removedTests.push({
            id: test.id,
            slug: test.slug,
          });
        }
      }
    }

    return NextResponse.json({
      message: "Tests removed from test suite version successfully",
      removedTests,
    });
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to remove tests from test suite version" },
      { status: 500 }
    );
  }
};
