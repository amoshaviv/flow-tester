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
  const { User, Organization, Project, Test, TestVersion, TestRun } = dbModels;

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

    // Fetch all test runs for this project
    const testRuns = await TestRun.findAll({
      include: [
        {
          model: TestVersion,
          as: 'version',
          attributes: ['id', 'title', 'description', 'number', 'slug'],
          include: [
            {
              model: Test,
              as: 'test',
              attributes: ['id', 'slug'],
              where: { project_id: project.id },
              required: true
            }
          ],
          required: true
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    return NextResponse.json({ 
      testRuns: testRuns.map(testRun => ({
        slug: testRun.slug,
        status: testRun.status,
        resultsURL: testRun.resultsURL,
        createdAt: testRun.createdAt,
        updatedAt: testRun.updatedAt,
        version: {
          title: testRun.version.title,
          description: testRun.version.description,
          number: testRun.version.number,
          slug: testRun.version.slug,
          test: {
            slug: testRun.version.test.slug
          }
        },
        createdBy: {
          email: testRun.createdBy.email,
          firstName: testRun.createdBy.firstName,
          lastName: testRun.createdBy.lastName
        }
      }))
    });
  } catch (err: any) {
    console.log(err);
    let message = "Failed to fetch test runs";
    let status = 500;

    return NextResponse.json({ message }, { status });
  }
};