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
      testSuiteSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug, testSuiteSlug } = params;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization, Project, TestSuiteTest, TestSuiteVersion, Test } =
    dbModels;

  // Make sure user is authorized
  if (!email) return notAuthorized();
  const user = await User.findByEmail(email);
  if (!user) return notAuthorized();

  const { testSuiteVersionSlug, testSlugs } = await request.json();
  console.log('here!!!!', testSlugs);

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

    // Find the specific version
    let version = await TestSuiteVersion.findOne({
      where: { slug: testSuiteVersionSlug },
      include: [
        {
          association: "runs",
          attributes: ["slug"],
        },
        {
          association: "testSuite",
          attributes: ["id", "slug"],
        },
      ],
    });

    if (!version) {
      return NextResponse.json(
        { message: "Test suite version not found" },
        { status: 404 }
      );
    }

    if (version.runs.length > 0) {
      version = await TestSuiteVersion.createWithTestSuite(
        version.title,
        version.description,
        user,
        version.testSuite,
        true
      );
    } else {
      await TestSuiteTest.destroy({
        where: { test_suite_version_id: version.id },
      });
    }

    // Find tests by slugs and add them to the suite version
    const addedTests = [];
    for (const testSlug of testSlugs || []) {
      const test = await Test.findOne({
        where: { slug: testSlug, project_id: project.id },
      });

      if (test) {
        try {
          await TestSuiteTest.addTestToSuiteVersion(version, test);
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
    let message = "Failed to update test";
    let status = 400;

    return NextResponse.json({ message }, { status });
  }
};
